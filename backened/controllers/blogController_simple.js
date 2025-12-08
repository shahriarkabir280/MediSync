import { sql } from '../config/db.js';

// Get all blog posts for a doctor
const getBlogPosts = async (req, res) => {
  console.log('🔍 getBlogPosts called with query:', req.query);
  console.log('🔍 User from auth:', req.user);
  
  try {
    const doctorId = req.user.id;
    
    const posts = await sql`
      SELECT 
        id, title, content, excerpt, status, created_at, updated_at, 
        views, tags, featured_image, category
      FROM blog_posts 
      WHERE doctor_id = ${doctorId}
      ORDER BY created_at DESC
      LIMIT 50
    `;
    
    console.log('🔍 Found blog posts:', posts.length);
    
    res.json({
      success: true,
      posts: posts,
      totalPages: 1,
      currentPage: 1,
      totalPosts: posts.length
    });
  } catch (error) {
    console.error('💥 Error fetching blog posts:', error);
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
};

// Get a single blog post
const getBlogPost = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { id } = req.params;
    
    const posts = await sql`
      SELECT * FROM blog_posts 
      WHERE id = ${id} AND doctor_id = ${doctorId}
    `;
    
    if (posts.length === 0) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    
    res.json({
      success: true,
      post: posts[0]
    });
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
    const { title, content, excerpt, status = 'draft', tags = [], featured_image, category } = req.body;
    
    // Generate simple slug
    const slug = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').substring(0, 50) + '-' + Date.now();
    
    const result = await sql`
      INSERT INTO blog_posts (
        doctor_id, title, slug, content, excerpt, status, 
        tags, featured_image, category
      ) VALUES (
        ${doctorId}, ${title}, ${slug}, ${content}, ${excerpt || ''}, ${status},
        ${JSON.stringify(tags)}, ${featured_image || null}, ${category || 'General'}
      ) RETURNING *
    `;
    
    console.log('✨ Blog post created:', result[0]);
    
    res.status(201).json({
      success: true,
      message: 'Blog post created successfully',
      post: result[0]
    });
  } catch (error) {
    console.error('💥 Error creating blog post:', error);
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
    const { title, content, excerpt, status, tags = [], featured_image, category } = req.body;
    
    // Generate new slug if title changed
    const slug = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').substring(0, 50) + '-' + id;
    
    const result = await sql`
      UPDATE blog_posts 
      SET 
        title = ${title},
        slug = ${slug},
        content = ${content},
        excerpt = ${excerpt || ''},
        status = ${status},
        tags = ${JSON.stringify(tags)},
        featured_image = ${featured_image || null},
        category = ${category || 'General'},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND doctor_id = ${doctorId}
      RETURNING *
    `;
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    
    console.log('📝 Blog post updated:', result[0]);
    
    res.json({
      success: true,
      message: 'Blog post updated successfully',
      post: result[0]
    });
  } catch (error) {
    console.error('💥 Error updating blog post:', error);
    res.status(500).json({ error: 'Failed to update blog post' });
  }
};

// Delete a blog post
const deleteBlogPost = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { id } = req.params;
    
    const result = await sql`
      DELETE FROM blog_posts 
      WHERE id = ${id} AND doctor_id = ${doctorId}
      RETURNING id
    `;
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    
    res.json({
      success: true,
      message: 'Blog post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({ error: 'Failed to delete blog post' });
  }
};

// Get categories
const getCategories = async (req, res) => {
  try {
    const categories = await sql`
      SELECT id, name, description, color, created_at
      FROM blog_categories 
      ORDER BY name ASC
    `;
    
    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    // Return default categories if none exist
    res.json({
      success: true,
      categories: [
        { id: 1, name: 'General', description: 'General health topics', color: '#3B82F6' },
        { id: 2, name: 'Cardiology', description: 'Heart health topics', color: '#EF4444' },
        { id: 3, name: 'Wellness', description: 'Wellness and prevention', color: '#10B981' }
      ]
    });
  }
};

// Create a category (simplified)
const createCategory = async (req, res) => {
  try {
    const { name, description, color = '#3B82F6' } = req.body;
    
    const slug = name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    
    const result = await sql`
      INSERT INTO blog_categories (name, slug, description, color)
      VALUES (${name}, ${slug}, ${description || ''}, ${color})
      RETURNING *
    `;
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category: result[0]
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
};

// Get basic stats
const getBlogStats = async (req, res) => {
  try {
    const doctorId = req.user.id;
    
    const stats = await sql`
      SELECT 
        COUNT(*) as total_posts,
        COUNT(*) FILTER (WHERE status = 'published') as published_posts,
        COUNT(*) FILTER (WHERE status = 'draft') as draft_posts,
        COALESCE(SUM(views), 0) as total_views
      FROM blog_posts 
      WHERE doctor_id = ${doctorId}
    `;
    
    const result = stats[0] || {};
    
    res.json({
      success: true,
      stats: {
        totalPosts: parseInt(result.total_posts) || 0,
        publishedPosts: parseInt(result.published_posts) || 0,
        draftPosts: parseInt(result.draft_posts) || 0,
        totalViews: parseInt(result.total_views) || 0,
        totalComments: 0
      }
    });
  } catch (error) {
    console.error('Error fetching blog stats:', error);
    res.json({
      success: true,
      stats: {
        totalPosts: 0,
        publishedPosts: 0,
        draftPosts: 0,
        totalViews: 0,
        totalComments: 0
      }
    });
  }
};

// Placeholder functions for other operations
const updateCategory = async (req, res) => {
  res.json({ success: true, message: 'Feature coming soon' });
};

const deleteCategory = async (req, res) => {
  res.json({ success: true, message: 'Feature coming soon' });
};

const uploadFeaturedImage = async (req, res) => {
  res.json({ success: true, url: '/default-blog-image.jpg' });
};

export {
  getBlogPosts,
  getBlogPost,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getBlogStats,
  uploadFeaturedImage
};