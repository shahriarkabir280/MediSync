import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { chatController } from '../controllers/chatController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads/chat-files'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max file size
  },
  fileFilter: function (req, file, cb) {
    // Allow images, videos, audio, documents
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|webm|mp3|wav|m4a|ogg|pdf|doc|docx|txt|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, videos, audio, and documents allowed.'));
    }
  }
});

/**
 * Modern Chat API Routes
 * RESTful endpoints for WhatsApp/Telegram-style messaging
 */

// Get or create a private chat with another user
router.post('/chats/start', chatController.getOrCreateChat);

// Get all my chats (inbox)
router.get('/chats', chatController.getMyChats);

// Get messages for a specific chat
router.get('/chats/:chatId/messages', chatController.getMessages);

// Send a message
router.post('/chats/:chatId/messages', chatController.sendMessage);

// Mark messages as read
router.post('/chats/:chatId/read', chatController.markAsRead);

// Delete a message (Unsend) - using POST to properly handle body
router.post('/messages/:messageId/delete', chatController.deleteMessage);

// Forward a message
router.post('/messages/forward', chatController.forwardMessage);

// Search users to start a chat
router.get('/users/search', chatController.searchUsers);

// Update chat settings (pin, mute, archive, block)
router.put('/chats/:chatId/settings', chatController.updateChatSettings);

// Add reaction to message
router.post('/messages/:messageId/reactions', chatController.addReaction);

// Remove reaction from message
router.delete('/messages/:messageId/reactions', chatController.removeReaction);

// Upload chat file (images, voice messages, documents, etc.)
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `/uploads/chat-files/${req.file.filename}`;
    
    res.json({
      success: true,
      file: {
        url: fileUrl,
        name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Get chat settings for a user (global/centralized settings)
router.get('/settings', chatController.getChatSettings);

// Update chat settings for a user (global/centralized settings)
router.put('/settings', chatController.updateChatSettings);

// Get per-chat settings (mute, pin, block for specific chat)
router.get('/chats/:chatId/settings', chatController.getPerChatSettings);

// Update per-chat settings (mute, pin, block for specific chat)
router.put('/chats/:chatId/settings', chatController.updatePerChatSettings);

// Archive/Unarchive a chat
router.put('/chats/:chatId/archive', chatController.archiveChat);

// Clear all messages in a chat
router.delete('/chats/:chatId/clear', chatController.clearChat);

// Delete a specific message
router.delete('/messages/:messageId', chatController.deleteMessage);

export default router;
