import express from 'express';
import multer from 'multer';
import path from 'path';
import { authenticateToken } from './authRoutes.js';

// Add logging middleware
const blogLogger = (req, res, next) => {
  console.log(`🚀 Blog API: ${req.method} ${req.path}`, {
    body: req.body,
    query: req.query,
    params: req.params,
    user: req.user ? { id: req.user.id, name: req.user.name } : 'Not authenticated'
  });
  next();
};

import {
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
} from '../controllers/blogController.js';

const router = express.Router();

// Add blog logging middleware to all routes
router.use(blogLogger);

// Configure multer for featured image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/blog-images/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'blog-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter
});

// Middleware to ensure authentication for all blog routes
router.use(authenticateToken);

// ===== BLOG STATISTICS =====
router.get('/stats', getBlogStats);

// ===== CATEGORY ROUTES =====
router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// ===== BLOG POST ROUTES =====
router.get('/posts', getBlogPosts);
router.get('/posts/:identifier', getBlogPost);
router.post('/posts', createBlogPost);
router.put('/posts/:id', updateBlogPost);
router.delete('/posts/:id', deleteBlogPost);

// ===== FILE UPLOAD ROUTES =====
router.post('/upload/featured-image', upload.single('image'), uploadFeaturedImage);

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
  }

  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({ error: 'Only image files are allowed!' });
  }

  res.status(500).json({ error: 'File upload failed' });
});

export default router;