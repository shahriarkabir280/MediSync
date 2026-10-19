import express from 'express';
import { doctorOnly } from '../middleware/auth.js';
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

// Doctor-only routes
const authenticateToken = doctorOnly;

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