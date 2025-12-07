import express from 'express';
import jwt from 'jsonwebtoken';
import {
  getNotifications,
  markAsRead,
  markAsUnread,
  markAllAsRead,
  deleteNotification,
  deleteMultiple,
  createNotification,
  getNotificationStats
} from '../controllers/notificationController.js';

const router = express.Router();

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'careconnect_jwt_secret_2024';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.doctorId = decoded.doctorId;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Get notifications with filtering and pagination
router.get('/', authenticateToken, getNotifications);

// Get notification statistics
router.get('/stats', authenticateToken, getNotificationStats);

// Mark notification as read
router.put('/:notificationId/read', authenticateToken, markAsRead);

// Mark notification as unread
router.put('/:notificationId/unread', authenticateToken, markAsUnread);

// Mark all notifications as read
router.put('/mark-all-read', authenticateToken, markAllAsRead);

// Delete notification
router.delete('/:notificationId', authenticateToken, deleteNotification);

// Delete multiple notifications
router.delete('/', authenticateToken, deleteMultiple);

// Create notification (for system/admin use)
router.post('/', createNotification);

export default router;