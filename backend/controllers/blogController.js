import { supabase } from '../config/db.js';

// Schema notes (see schema.sql):
// - blog_categories is a shared list (no doctor_id); posts store the category name in blog_posts.category
// - blog_posts.slug is globally unique
// - view counts live in blog_posts.views; comments link via blog_comments.blog_post_id

// Helper function to generate slug
const generateSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Helper function to ensure unique slug (slugs are unique across all doctors)
const ensureUniqueSlug = async (baseSlug, excludeId = null) => {
  let slug = baseSlug || 'post';
  let counter = 1;

  while (true) {
    let query = supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', slug);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data } = await query;

    if (!data || data.length === 0) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

// Characters that would break out of a PostgREST or() filter expression
const sanitizeSearch = (text) => text.replace(/[,()*\\]/g, ' ').trim();

const normalizeTags = (tags) => {
  if (!Array.isArray(tags)) return [];
  return tags.map((tag) => String(tag).trim()).filter(Boolean);
};

// Flatten the embedded comment count into the shape the dashboard expects
const flattenPost = (post) => ({
  ...post,
  comment_count: post.blog_comments ? post.blog_comments[0]?.count || 0 : 0,
  blog_comments: undefined
});

// Get all blog categories
const getCategories = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('blog_categories')
      .select('*')
      .order('name');

    if (error) throw error;

    res.json({ categories: data });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

// Create a new category
const createCategory = async (req, res) => {
  try {
    const { name, description, color } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const { data: existing } = await supabase
      .from('blog_categories')
      .select('id')
      .eq('name', name)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ error: 'Category already exists' });
    }

    const { data, error } = await supabase
      .from('blog_categories')
      .insert({
        name,
        slug: generateSlug(name),
        description,
        color: color || '#3B82F6'
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
};

// Update a category; posts reference categories by name, so they are renamed too
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const { data: category } = await supabase
      .from('blog_categories')
      .select('id, name')
      .eq('id', id)
      .maybeSingle();

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const { data: existingName } = await supabase
      .from('blog_categories')
      .select('id')
      .eq('name', name)
      .neq('id', id)
      .maybeSingle();

    if (existingName) {
      return res.status(400).json({ error: 'Category name already exists' });
    }

    const { data, error } = await supabase
      .from('blog_categories')
      .update({ name, slug: generateSlug(name), description, color })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (category.name !== name) {
      const { error: renameError } = await supabase
        .from('blog_posts')
        .update({ category: name })
        .eq('category', category.name);

      if (renameError) throw renameError;
    }

    res.json(data);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
};

// Delete a category
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: category } = await supabase
      .from('blog_categories')
      .select('id, name')
      .eq('id', id)
      .maybeSingle();

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const { count: postCount } = await supabase
      .from('blog_posts')
      .select('id', { count: 'exact', head: true })
      .eq('category', category.name);

    if (postCount > 0) {
      return res.status(400).json({ error: 'Cannot delete category with existing posts' });
    }

    const { error } = await supabase
      .from('blog_categories')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
};

// Get all blog posts for a doctor with pagination and filtering
const getBlogPosts = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const {
      page = 1,
      limit = 10,
      status = 'all',
      category = 'all',
      search = '',
      sort = 'created_at',
      order = 'desc'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('blog_posts')
      .select('*, blog_comments (count)', { count: 'exact' })
      .eq('doctor_id', doctorId);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (category !== 'all') {
      query = query.eq('category', category);
    }

    const searchTerm = sanitizeSearch(search);
    if (searchTerm) {
      query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%,excerpt.ilike.%${searchTerm}%`);
    }

    // Validate sort column
    const allowedSortColumns = ['title', 'created_at', 'updated_at', 'published_at', 'views', 'status'];
    const sortColumn = allowedSortColumns.includes(sort) ? sort : 'created_at';
    const isAscending = order.toLowerCase() === 'asc';

    const { data: posts, error, count } = await query
      .order(sortColumn, { ascending: isAscending })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) throw error;

    res.json({
      posts: posts.map(flattenPost),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil((count || 0) / parseInt(limit)),
        totalPosts: count || 0,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
};

// Get a single blog post by ID or slug (doctor's own view; does not count as a public view)
const getBlogPost = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { identifier } = req.params;

    const isNumeric = /^\d+$/.test(identifier);

    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('*, blog_comments (count)')
      .eq('doctor_id', doctorId)
      .eq(isNumeric ? 'id' : 'slug', identifier)
      .maybeSingle();

    if (error) throw error;

    if (!post) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    res.json(flattenPost(post));
  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({ error: 'Failed to fetch blog post' });
  }
};

// Create a new blog post
const createBlogPost = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const {
      title,
      content,
      excerpt,
      category,
      status = 'draft',
      featured_image,
      tags,
      meta_title,
      meta_description
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const uniqueSlug = await ensureUniqueSlug(generateSlug(title));

    // Auto-generate excerpt if not provided
    const autoExcerpt = excerpt || content.replace(/<[^>]*>/g, '').substring(0, 200) + '...';

    const { data: newPost, error } = await supabase
      .from('blog_posts')
      .insert({
        doctor_id: doctorId,
        title,
        content,
        excerpt: autoExcerpt,
        slug: uniqueSlug,
        category: category || null,
        status,
        published_at: status === 'published' ? new Date().toISOString() : null,
        featured_image,
        tags: normalizeTags(tags),
        meta_title: meta_title || title,
        meta_description: meta_description || autoExcerpt
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(newPost);
  } catch (error) {
    console.error('Error creating blog post:', error);
    res.status(500).json({ error: 'Failed to create blog post' });
  }
};

// Update a blog post
const updateBlogPost = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { id } = req.params;
    const {
      title,
      content,
      excerpt,
      category,
      status,
      featured_image,
      tags,
      meta_title,
      meta_description
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const { data: existingPost } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .eq('doctor_id', doctorId)
      .maybeSingle();

    if (!existingPost) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    // Generate new slug if title changed
    let slug = existingPost.slug;
    if (title !== existingPost.title) {
      slug = await ensureUniqueSlug(generateSlug(title), id);
    }

    const autoExcerpt = excerpt || content.replace(/<[^>]*>/g, '').substring(0, 200) + '...';
    const newStatus = status || existingPost.status;

    // Stamp the first publish time; keep it on later edits
    const publishedAt = newStatus === 'published'
      ? existingPost.published_at || new Date().toISOString()
      : existingPost.published_at;

    const { data: updatedPost, error } = await supabase
      .from('blog_posts')
      .update({
        title,
        content,
        excerpt: autoExcerpt,
        slug,
        category: category ?? existingPost.category,
        status: newStatus,
        published_at: publishedAt,
        featured_image,
        tags: normalizeTags(tags),
        meta_title: meta_title || title,
        meta_description: meta_description || autoExcerpt,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('doctor_id', doctorId)
      .select()
      .single();

    if (error) throw error;

    res.json(updatedPost);
  } catch (error) {
    console.error('Error updating blog post:', error);
    res.status(500).json({ error: 'Failed to update blog post' });
  }
};

// Delete a blog post (comments are removed by ON DELETE CASCADE)
const deleteBlogPost = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { id } = req.params;

    const { data: postCheck } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('id', id)
      .eq('doctor_id', doctorId)
      .maybeSingle();

    if (!postCheck) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id)
      .eq('doctor_id', doctorId);

    if (error) throw error;

    res.json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({ error: 'Failed to delete blog post' });
  }
};

// Get blog statistics
const getBlogStats = async (req, res) => {
  try {
    const doctorId = req.user.id;

    const [
      { count: totalPosts },
      { count: publishedPosts },
      { count: draftPosts },
      { data: viewCounts },
      { count: totalComments },
      { data: recentPosts }
    ] = await Promise.all([
      supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('doctor_id', doctorId),
      supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('doctor_id', doctorId).eq('status', 'published'),
      supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('doctor_id', doctorId).eq('status', 'draft'),
      supabase.from('blog_posts').select('views').eq('doctor_id', doctorId),
      // !inner join filters comments to this doctor's posts
      supabase.from('blog_comments').select('*, blog_posts!inner(doctor_id)', { count: 'exact', head: true }).eq('blog_posts.doctor_id', doctorId),
      supabase.from('blog_posts')
        .select('title, slug, views, created_at')
        .eq('doctor_id', doctorId)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(5)
    ]);

    const viewsSum = viewCounts?.reduce((sum, post) => sum + (post.views || 0), 0) || 0;

    res.json({
      stats: {
        totalPosts: totalPosts || 0,
        publishedPosts: publishedPosts || 0,
        draftPosts: draftPosts || 0,
        totalViews: viewsSum,
        totalComments: totalComments || 0,
        recentPosts: recentPosts || []
      }
    });
  } catch (error) {
    console.error('Error fetching blog stats:', error);
    res.status(500).json({ error: 'Failed to fetch blog statistics' });
  }
};

// Upload featured image
const uploadFeaturedImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const imageUrl = `/uploads/blog-images/${req.file.filename}`;
    res.json({ imageUrl });
  } catch (error) {
    console.error('Error uploading featured image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
};

export {
  // Categories
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,

  // Blog Posts
  getBlogPosts,
  getBlogPost,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,

  // Statistics
  getBlogStats,

  // File Upload
  uploadFeaturedImage
};
