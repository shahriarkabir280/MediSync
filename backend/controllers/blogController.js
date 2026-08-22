import { supabase } from '../config/db.js';

// Helper function to generate slug
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
};

// Helper function to ensure unique slug
const ensureUniqueSlug = async (baseSlug, doctorId, excludeId = null) => {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    let query = supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', slug)
      .eq('doctor_id', doctorId);

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

// Get all categories for a doctor
const getCategories = async (req, res) => {
  try {
    const doctorId = req.user.id;

    const { data, error } = await supabase
      .from('blog_categories')
      .select('*')
      .eq('doctor_id', doctorId)
      .order('name');

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

// Create a new category
const createCategory = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { name, description, color } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    // Check if category already exists for this doctor
    const { data: existing } = await supabase
      .from('blog_categories')
      .select('id')
      .eq('name', name)
      .eq('doctor_id', doctorId)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ error: 'Category already exists' });
    }

    const { data, error } = await supabase
      .from('blog_categories')
      .insert({
        doctor_id: doctorId,
        name,
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

// Update a category
const updateCategory = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { id } = req.params;
    const { name, description, color } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    // Check if category belongs to the doctor
    const { data: categoryCheck } = await supabase
      .from('blog_categories')
      .select('id')
      .eq('id', id)
      .eq('doctor_id', doctorId)
      .maybeSingle();

    if (!categoryCheck) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if another category with the same name exists
    const { data: existingName } = await supabase
      .from('blog_categories')
      .select('id')
      .eq('name', name)
      .eq('doctor_id', doctorId)
      .neq('id', id)
      .maybeSingle();

    if (existingName) {
      return res.status(400).json({ error: 'Category name already exists' });
    }

    const { data, error } = await supabase
      .from('blog_categories')
      .update({
        name,
        description,
        color,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('doctor_id', doctorId)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
};

// Delete a category
const deleteCategory = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { id } = req.params;

    // Check if category belongs to the doctor
    const { data: categoryCheck } = await supabase
      .from('blog_categories')
      .select('id')
      .eq('id', id)
      .eq('doctor_id', doctorId)
      .maybeSingle();

    if (!categoryCheck) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if category has posts
    const { count: postCount } = await supabase
      .from('blog_posts')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id);

    if (postCount > 0) {
      return res.status(400).json({ error: 'Cannot delete category with existing posts' });
    }

    const { error } = await supabase
      .from('blog_categories')
      .delete()
      .eq('id', id)
      .eq('doctor_id', doctorId);

    if (error) throw error;

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
};

// Get all blog posts for a doctor with pagination and filtering
const getBlogPosts = async (req, res) => {
  console.log('🔍 getBlogPosts called with query:', req.query);
  console.log('🔍 User from auth:', req.user);

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
      .select(`
        *,
        blog_categories (name, color),
        blog_comments (count)
      `, { count: 'exact' })
      .eq('doctor_id', doctorId);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (category !== 'all') {
      query = query.eq('category_id', parseInt(category));
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,excerpt.ilike.%${search}%`);
    }

    // Validate sort column
    const allowedSortColumns = ['title', 'created_at', 'updated_at', 'view_count', 'status'];
    const sortColumn = allowedSortColumns.includes(sort) ? sort : 'created_at';
    const isAscending = order.toLowerCase() === 'asc';

    const { data: posts, error, count } = await query
      .order(sortColumn, { ascending: isAscending })
      // Apply offset and limit
      .range(offset, offset + parseInt(limit) - 1);

    if (error) throw error;

    // Flatten result for existing frontend contract
    const flattenedPosts = posts.map(post => ({
      ...post,
      category_name: post.blog_categories?.name,
      category_color: post.blog_categories?.color,
      comment_count: post.blog_comments ? post.blog_comments[0]?.count : 0,
      // Supabase returns array depending on join, count returns object like [{count: 5}]
      blog_categories: undefined,
      blog_comments: undefined
    }));

    res.json({
      posts: flattenedPosts,
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

// Get a single blog post by ID or slug
const getBlogPost = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { identifier } = req.params;

    // Check if identifier is numeric (ID) or string (slug)
    const isNumeric = /^\d+$/.test(identifier);

    let query = supabase
      .from('blog_posts')
      .select(`
            *,
            blog_categories (name, color)
        `)
      .eq('doctor_id', doctorId);

    if (isNumeric) {
      query = query.eq('id', identifier);
    } else {
      query = query.eq('slug', identifier);
    }

    const { data: post, error } = await query.single();

    if (error || !post) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    // Increment view count (fire and forget mostly, or await)
    await supabase.rpc('increment_view_count', { row_id: post.id }).catch(async () => {
      // Fallback if RPC doesn't exist: manual update
      await supabase
        .from('blog_posts')
        .update({ view_count: post.view_count + 1 })
        .eq('id', post.id);
    });

    // Flatten result
    const flattenedPost = {
      ...post,
      category_name: post.blog_categories?.name,
      category_color: post.blog_categories?.color,
      blog_categories: undefined
    };

    res.json(flattenedPost);
  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({ error: 'Failed to fetch blog post' });
  }
};

// Create a new blog post
const createBlogPost = async (req, res) => {
  console.log('✨ createBlogPost called with body:', req.body);
  console.log('✨ User from auth:', req.user);

  try {
    const doctorId = req.user.id;
    const {
      title,
      content,
      excerpt,
      category_id,
      status = 'draft',
      featured_image,
      tags,
      meta_title,
      meta_description
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    // Verify category belongs to doctor
    if (category_id) {
      const { data: categoryCheck } = await supabase
        .from('blog_categories')
        .select('id')
        .eq('id', category_id)
        .eq('doctor_id', doctorId)
        .maybeSingle();

      if (!categoryCheck) {
        return res.status(400).json({ error: 'Invalid category' });
      }
    }

    // Generate unique slug
    const baseSlug = generateSlug(title);
    const uniqueSlug = await ensureUniqueSlug(baseSlug, doctorId);

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
        category_id,
        status,
        featured_image,
        tags: tags, // Supabase handles JSON automatically if column is jsonb
        meta_title: meta_title || title,
        meta_description: meta_description || autoExcerpt
      })
      .select(`
            *,
            blog_categories (name, color)
        `)
      .single();

    if (error) throw error;

    // Flatten
    const flattened = {
      ...newPost,
      category_name: newPost.blog_categories?.name,
      category_color: newPost.blog_categories?.color,
      blog_categories: undefined
    };

    res.status(201).json(flattened);
  } catch (error) {
    console.error('Error creating blog post:', error);
    res.status(500).json({ error: 'Failed to create blog post' });
  }
};

// Update a blog post
const updateBlogPost = async (req, res) => {
  console.log('📝 updateBlogPost called with id:', req.params.id);
  console.log('📝 Request body:', req.body);
  console.log('📝 User from auth:', req.user);

  try {
    const doctorId = req.user.id;
    const { id } = req.params;
    const {
      title,
      content,
      excerpt,
      category_id,
      status,
      featured_image,
      tags,
      meta_title,
      meta_description
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    // Check if post belongs to the doctor
    const { data: existingPost } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .eq('doctor_id', doctorId)
      .maybeSingle();

    if (!existingPost) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    // Verify category belongs to doctor if provided
    if (category_id && category_id !== '' && category_id !== existingPost.category_id) {
      const { data: categoryCheck } = await supabase
        .from('blog_categories')
        .select('id')
        .eq('id', category_id)
        .eq('doctor_id', doctorId)
        .maybeSingle();

      if (!categoryCheck) {
        return res.status(400).json({ error: 'Invalid category' });
      }
    }

    // Generate new slug if title changed
    let slug = existingPost.slug;
    if (title !== existingPost.title) {
      const baseSlug = generateSlug(title);
      slug = await ensureUniqueSlug(baseSlug, doctorId, id);
    }

    // Auto-generate excerpt if not provided
    const autoExcerpt = excerpt || content.replace(/<[^>]*>/g, '').substring(0, 200) + '...';

    const { data: updatedPost, error } = await supabase
      .from('blog_posts')
      .update({
        title,
        content,
        excerpt: autoExcerpt,
        slug,
        category_id,
        status,
        featured_image,
        tags,
        meta_title: meta_title || title,
        meta_description: meta_description || autoExcerpt,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('doctor_id', doctorId)
      .select(`
            *,
            blog_categories (name, color)
        `)
      .single();

    if (error) throw error;

    const flattened = {
      ...updatedPost,
      category_name: updatedPost.blog_categories?.name,
      category_color: updatedPost.blog_categories?.color,
      blog_categories: undefined
    };

    res.json(flattened);
  } catch (error) {
    console.error('Error updating blog post:', error);
    res.status(500).json({ error: 'Failed to update blog post' });
  }
};

// Delete a blog post
const deleteBlogPost = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { id } = req.params;

    // Check if post belongs to the doctor
    const { data: postCheck } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('id', id)
      .eq('doctor_id', doctorId)
      .maybeSingle();

    if (!postCheck) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    // Delete associated comments first (Supabase usually handles via cascade, but if not:)
    // Manual deletion of comments:
    await supabase.from('blog_comments').delete().eq('post_id', id);

    // Delete the post
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
      // totalViews requires aggregation, which Supabase client doesn't do nicely on .select() without filtering
      // We can fetch all view_counts and sum in JS (heavy?) or use RPC.
      // For simplicity: fetch all posts view_count.
      { data: viewCounts },
      { count: totalComments },
      { data: recentPosts }
    ] = await Promise.all([
      supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('doctor_id', doctorId),
      supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('doctor_id', doctorId).eq('status', 'published'),
      supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('doctor_id', doctorId).eq('status', 'draft'),
      supabase.from('blog_posts').select('view_count').eq('doctor_id', doctorId),
      // Join to count comments for this doctor's posts? 
      // Or simpler: select count from blog_comments where post in (select id from blog_posts where doctor_id = ...)
      // Supabase supports filtering on joined table, but counting all comments globally is hard?
      // Let's use !inner join to filter comments by post.doctor_id
      supabase.from('blog_comments').select('*, blog_posts!inner(doctor_id)', { count: 'exact', head: true }).eq('blog_posts.doctor_id', doctorId),

      supabase.from('blog_posts')
        .select('title, slug, view_count, created_at')
        .eq('doctor_id', doctorId)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(5)
    ]);

    const viewsSum = viewCounts?.reduce((sum, post) => sum + (post.view_count || 0), 0) || 0;

    res.json({
      totalPosts: totalPosts || 0,
      publishedPosts: publishedPosts || 0,
      draftPosts: draftPosts || 0,
      totalViews: viewsSum,
      totalComments: totalComments || 0,
      recentPosts: recentPosts || []
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

    const imageUrl = `/uploads/${req.file.filename}`;
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