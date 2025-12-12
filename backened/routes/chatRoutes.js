import express from 'express';
import { chatController } from '../controllers/chatController.js';

const router = express.Router();

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

// Delete a message
router.delete('/messages/:messageId', chatController.deleteMessage);

// Search users to start a chat
router.get('/users/search', chatController.searchUsers);

// Update chat settings (pin, mute, archive, block)
router.put('/chats/:chatId/settings', chatController.updateChatSettings);

// Add reaction to message
router.post('/messages/:messageId/reactions', chatController.addReaction);

// Remove reaction from message
router.delete('/messages/:messageId/reactions', chatController.removeReaction);

export default router;
