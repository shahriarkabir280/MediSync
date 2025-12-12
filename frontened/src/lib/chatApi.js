import { api } from './api.js';

/**
 * Modern Chat API Client
 * Frontend SDK for WhatsApp/Telegram-style messaging
 */

export const chatApi = {
  /**
   * Start or get existing chat with a user
   */
  async startChat(myUser, otherUser) {
    const response = await api.post('/chat/chats/start', {
      myUserId: myUser.userId,
      myUserType: myUser.userType,
      myUserName: myUser.userName,
      myUserEmail: myUser.userEmail || '',
      myUserAvatar: myUser.userAvatar || '',
      otherUserId: otherUser.userId,
      otherUserType: otherUser.userType,
      otherUserName: otherUser.userName,
      otherUserEmail: otherUser.userEmail || '',
      otherUserAvatar: otherUser.userAvatar || ''
    });
    return response;
  },

  /**
   * Get all my chats (inbox)
   */
  async getMyChats(userId, userType) {
    const response = await api.get(`/chat/chats?userId=${userId}&userType=${userType}`);
    return response;
  },

  /**
   * Get messages for a specific chat
   */
  async getMessages(chatId, userId, userType, limit = 50, before = null) {
    let url = `/chat/chats/${chatId}/messages?userId=${userId}&userType=${userType}&limit=${limit}`;
    if (before) {
      url += `&before=${before}`;
    }
    const response = await api.get(url);
    return response;
  },

  /**
   * Send a text message
   */
  async sendMessage(chatId, sender, content, options = {}) {
    const response = await api.post(`/chat/chats/${chatId}/messages`, {
      senderId: sender.userId,
      senderType: sender.userType,
      senderName: sender.userName,
      content,
      messageType: options.messageType || 'text',
      replyToId: options.replyToId || null,
      encryptedContent: options.encryptedContent || null
    });
    return response;
  },

  /**
   * Send media message
   */
  async sendMediaMessage(chatId, sender, media, options = {}) {
    const response = await api.post(`/chat/chats/${chatId}/messages`, {
      senderId: sender.userId,
      senderType: sender.userType,
      senderName: sender.userName,
      content: options.caption || '',
      messageType: media.type,
      mediaUrl: media.url,
      mediaName: media.name,
      mediaSize: media.size,
      mediaType: media.mimeType,
      thumbnailUrl: media.thumbnailUrl || null,
      replyToId: options.replyToId || null
    });
    return response;
  },

  /**
   * Mark messages as read
   */
  async markAsRead(chatId, userId, userType, messageIds = null) {
    const response = await api.post(`/chat/chats/${chatId}/read`, {
      userId,
      userType,
      messageIds
    });
    return response;
  },

  /**
   * Delete a message
   */
  async deleteMessage(messageId, userId, userType, deleteForEveryone = false) {
    const response = await api.delete(`/chat/messages/${messageId}`, {
      data: {
        userId,
        userType,
        deleteForEveryone
      }
    });
    return response;
  },

  /**
   * Search users to start a new chat
   */
  async searchUsers(query, currentUserId, currentUserType) {
    const response = await api.get(
      `/chat/users/search?query=${encodeURIComponent(query)}&currentUserId=${currentUserId}&currentUserType=${currentUserType}`
    );
    return response;
  },

  /**
   * Update chat settings
   */
  async updateChatSettings(chatId, userId, userType, settings) {
    const response = await api.put(`/chat/chats/${chatId}/settings`, {
      userId,
      userType,
      ...settings // isPinned, isMuted, isArchived, isBlocked
    });
    return response;
  },

  /**
   * Add reaction to message
   */
  async addReaction(messageId, userId, userType, reaction) {
    const response = await api.post(`/chat/messages/${messageId}/reactions`, {
      userId,
      userType,
      reaction
    });
    return response;
  },

  /**
   * Remove reaction from message
   */
  async removeReaction(messageId, userId, userType) {
    const response = await api.delete(`/chat/messages/${messageId}/reactions`, {
      data: {
        userId,
        userType
      }
    });
    return response;
  }
};
