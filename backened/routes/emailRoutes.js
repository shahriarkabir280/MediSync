import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authenticateToken } from './authRoutes.js';

import {
  getEmails,
  getEmail,
  sendEmail,
  saveDraft,
  deleteEmail,
  markAsRead,
  toggleStar,
  getStats,
  getRecipients,
  emptyTrash,
  moveToFolder
} from '../controllers/emailController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get email statistics
router.get('/stats', getStats);

// Get all emails with filters
router.get('/', getEmails);

// Get recipients list
router.get('/recipients', getRecipients);

// Get single email
router.get('/:id', getEmail);

// Send email with attachments
router.post('/send', upload.array('attachments'), sendEmail);

// Save draft with attachments
router.post('/draft', upload.array('attachments'), saveDraft);

// Empty trash
router.delete('/trash', emptyTrash);

// Delete email
router.delete('/:id', deleteEmail);

// Mark as read/unread
router.put('/:id/read', markAsRead);

// Star/unstar email
router.put('/:id/star', toggleStar);

// Move email to folder
router.put('/:id/folder', moveToFolder);

export default router;