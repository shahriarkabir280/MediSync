import { sql } from '../config/db.js';

// Create a pool-like wrapper for compatibility with existing queries
const pool = {
  query: async (text, params = []) => {
    try {
      // Convert parameterized query to Neon format
      let query = text;
      if (params && params.length > 0) {
        // Replace $1, $2, etc. with actual values for Neon
        params.forEach((param, index) => {
          const placeholder = `$${index + 1}`;
          const value = typeof param === 'string' ? `'${param.replace(/'/g, "''")}'` : param;
          query = query.replace(new RegExp(`\\${placeholder}\\b`, 'g'), value);
        });
      }
      
      const result = await sql`${sql.raw(query)}`;
      return { rows: result };
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }
};

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
    const query = excludeId 
      ? 'SELECT id FROM blog_posts WHERE slug = $1 AND doctor_id = $2 AND id != $3'
      : 'SELECT id FROM blog_posts WHERE slug = $1 AND doctor_id = $2';
    
    const params = excludeId ? [slug, doctorId, excludeId] : [slug, doctorId];
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
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
    
    const result = await pool.query(
      'SELECT * FROM blog_categories WHERE doctor_id = $1 ORDER BY name',
      [doctorId]
    );
    
    res.json(result.rows);
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
    const existingCategory = await pool.query(
      'SELECT id FROM blog_categories WHERE name = $1 AND doctor_id = $2',
      [name, doctorId]
    );
    
    if (existingCategory.rows.length > 0) {
      return res.status(400).json({ error: 'Category already exists' });
    }
    
    const result = await pool.query(
      'INSERT INTO blog_categories (doctor_id, name, description, color) VALUES ($1, $2, $3, $4) RETURNING *',
      [doctorId, name, description, color || '#3B82F6']
    );
    
    res.status(201).json(result.rows[0]);
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
    const categoryCheck = await pool.query(
      'SELECT id FROM blog_categories WHERE id = $1 AND doctor_id = $2',
      [id, doctorId]
    );
    
    if (categoryCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Check if another category with the same name exists
    const existingCategory = await pool.query(
      'SELECT id FROM blog_categories WHERE name = $1 AND doctor_id = $2 AND id != $3',
      [name, doctorId, id]
    );
    
    if (existingCategory.rows.length > 0) {
      return res.status(400).json({ error: 'Category name already exists' });
    }
    
    const result = await pool.query(
      'UPDATE blog_categories SET name = $1, description = $2, color = $3, updated_at = NOW() WHERE id = $4 AND doctor_id = $5 RETURNING *',
      [name, description, color, id, doctorId]
    );
    
    res.json(result.rows[0]);
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
    const categoryCheck = await pool.query(
      'SELECT id FROM blog_categories WHERE id = $1 AND doctor_id = $2',
      [id, doctorId]
    );
    
    if (categoryCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Check if category has posts
    const postsCheck = await pool.query(
      'SELECT id FROM blog_posts WHERE category_id = $1',
      [id]
    );
    
    if (postsCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Cannot delete category with existing posts' });
    }
    
    await pool.query(
      'DELETE FROM blog_categories WHERE id = $1 AND doctor_id = $2',
      [id, doctorId]
    );
    
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
    
    // Build WHERE clause
    let whereConditions = ['bp.doctor_id = $1'];
    let queryParams = [doctorId];
    let paramIndex = 2;
    
    if (status !== 'all') {
      whereConditions.push(`bp.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }
    
    if (category !== 'all') {
      whereConditions.push(`bp.category_id = $${paramIndex}`);
      queryParams.push(parseInt(category));
      paramIndex++;
    }
    
    if (search) {
      whereConditions.push(`(bp.title ILIKE $${paramIndex} OR bp.content ILIKE $${paramIndex} OR bp.excerpt ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    // Validate sort column
    const allowedSortColumns = ['title', 'created_at', 'updated_at', 'view_count', 'status'];
    const sortColumn = allowedSortColumns.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) 
      FROM blog_posts bp 
      LEFT JOIN blog_categories bc ON bp.category_id = bc.id 
      WHERE ${whereClause}
    `;
    
    const countResult = await pool.query(countQuery, queryParams);
    const totalPosts = parseInt(countResult.rows[0].count);
    
    // Get posts with category info
    const postsQuery = `
      SELECT 
        bp.*,
        bc.name as category_name,
        bc.color as category_color,
        (SELECT COUNT(*) FROM blog_comments WHERE post_id = bp.id) as comment_count
      FROM blog_posts bp
      LEFT JOIN blog_categories bc ON bp.category_id = bc.id
      WHERE ${whereClause}
      ORDER BY bp.${sortColumn} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    queryParams.push(parseInt(limit), offset);
    
    const postsResult = await pool.query(postsQuery, queryParams);
    
    res.json({
      posts: postsResult.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalPosts / parseInt(limit)),
        totalPosts,
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
    
    const query = isNumeric 
      ? `SELECT 
          bp.*,
          bc.name as category_name,
          bc.color as category_color
        FROM blog_posts bp
        LEFT JOIN blog_categories bc ON bp.category_id = bc.id
        WHERE bp.id = $1 AND bp.doctor_id = $2`
      : `SELECT 
          bp.*,
          bc.name as category_name,
          bc.color as category_color
        FROM blog_posts bp
        LEFT JOIN blog_categories bc ON bp.category_id = bc.id
        WHERE bp.slug = $1 AND bp.doctor_id = $2`;
    
    const result = await pool.query(query, [identifier, doctorId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    
    // Increment view count
    await pool.query(
      'UPDATE blog_posts SET view_count = view_count + 1 WHERE id = $1',
      [result.rows[0].id]
    );
    
    res.json(result.rows[0]);
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
      const categoryCheck = await pool.query(
        'SELECT id FROM blog_categories WHERE id = $1 AND doctor_id = $2',
        [category_id, doctorId]
      );
      
      if (categoryCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid category' });
      }
    }
    
    // Generate unique slug
    const baseSlug = generateSlug(title);
    const uniqueSlug = await ensureUniqueSlug(baseSlug, doctorId);
    
    // Auto-generate excerpt if not provided
    const autoExcerpt = excerpt || content.replace(/<[^>]*>/g, '').substring(0, 200) + '...';
    
    const result = await pool.query(
      `INSERT INTO blog_posts 
        (doctor_id, title, content, excerpt, slug, category_id, status, featured_image, tags, meta_title, meta_description)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
      RETURNING *`,
      [
        doctorId, 
        title, 
        content, 
        autoExcerpt, 
        uniqueSlug, 
        category_id, 
        status, 
        featured_image,
        tags ? JSON.stringify(tags) : null,
        meta_title || title,
        meta_description || autoExcerpt
      ]
    );
    
    // Fetch the post with category info
    const postWithCategory = await pool.query(
      `SELECT 
        bp.*,
        bc.name as category_name,
        bc.color as category_color
      FROM blog_posts bp
      LEFT JOIN blog_categories bc ON bp.category_id = bc.id
      WHERE bp.id = $1`,
      [result.rows[0].id]
    );
    
    res.status(201).json(postWithCategory.rows[0]);
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
    const postCheck = await pool.query(
      'SELECT * FROM blog_posts WHERE id = $1 AND doctor_id = $2',
      [id, doctorId]
    );
    
    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    
    const existingPost = postCheck.rows[0];
    
    // Verify category belongs to doctor if provided
    if (category_id && category_id !== '' && category_id !== existingPost.category_id) {
      const categoryCheck = await pool.query(
        'SELECT id FROM blog_categories WHERE id = $1 AND doctor_id = $2',
        [category_id, doctorId]
      );
      
      if (categoryCheck.rows.length === 0) {
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
    
    const result = await pool.query(
      `UPDATE blog_posts SET 
        title = $1, 
        content = $2, 
        excerpt = $3, 
        slug = $4, 
        category_id = $5, 
        status = $6,
        featured_image = $7,
        tags = $8,
        meta_title = $9,
        meta_description = $10,
        updated_at = NOW()
      WHERE id = $11 AND doctor_id = $12 
      RETURNING *`,
      [
        title, 
        content, 
        autoExcerpt, 
        slug, 
        category_id, 
        status,
        featured_image,
        tags ? JSON.stringify(tags) : null,
        meta_title || title,
        meta_description || autoExcerpt,
        id, 
        doctorId
      ]
    );
    
    // Fetch the updated post with category info
    const postWithCategory = await pool.query(
      `SELECT 
        bp.*,
        bc.name as category_name,
        bc.color as category_color
      FROM blog_posts bp
      LEFT JOIN blog_categories bc ON bp.category_id = bc.id
      WHERE bp.id = $1`,
      [result.rows[0].id]
    );
    
    res.json(postWithCategory.rows[0]);
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
    const postCheck = await pool.query(
      'SELECT id FROM blog_posts WHERE id = $1 AND doctor_id = $2',
      [id, doctorId]
    );
    
    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    
    // Delete associated comments first
    await pool.query('DELETE FROM blog_comments WHERE post_id = $1', [id]);
    
    // Delete the post
    await pool.query(
      'DELETE FROM blog_posts WHERE id = $1 AND doctor_id = $2',
      [id, doctorId]
    );
    
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
      totalPosts,
      publishedPosts,
      draftPosts,
      totalViews,
      totalComments,
      recentPosts
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM blog_posts WHERE doctor_id = $1', [doctorId]),
      pool.query('SELECT COUNT(*) FROM blog_posts WHERE doctor_id = $1 AND status = $2', [doctorId, 'published']),
      pool.query('SELECT COUNT(*) FROM blog_posts WHERE doctor_id = $1 AND status = $2', [doctorId, 'draft']),
      pool.query('SELECT COALESCE(SUM(view_count), 0) FROM blog_posts WHERE doctor_id = $1', [doctorId]),
      pool.query('SELECT COUNT(*) FROM blog_comments bc JOIN blog_posts bp ON bc.post_id = bp.id WHERE bp.doctor_id = $1', [doctorId]),
      pool.query(
        `SELECT title, slug, view_count, created_at 
         FROM blog_posts 
         WHERE doctor_id = $1 AND status = 'published'
         ORDER BY created_at DESC 
         LIMIT 5`,
        [doctorId]
      )
    ]);
    
    res.json({
      totalPosts: parseInt(totalPosts.rows[0].count),
      publishedPosts: parseInt(publishedPosts.rows[0].count),
      draftPosts: parseInt(draftPosts.rows[0].count),
      totalViews: parseInt(totalViews.rows[0].coalesce),
      totalComments: parseInt(totalComments.rows[0].count),
      recentPosts: recentPosts.rows
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