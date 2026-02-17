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
   * Send a message
   */
  async sendMessage(chatId, sender, content, options = {}) {
    const response = await api.post(`/chat/chats/${chatId}/messages`, {
      senderId: sender.userId,
      senderType: sender.userType,
      senderName: sender.userName,
      content,
      messageType: options.messageType || 'text',
      mediaUrl: options.mediaUrl || null,
      mediaName: options.mediaName || null,
      mediaSize: options.mediaSize || null,
      mediaType: options.mediaType || null,
      thumbnailUrl: options.thumbnailUrl || null,
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
    const response = await api.post(`/chat/messages/${messageId}/delete`, {
      userId,
      userType,
      deleteForEveryone
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
   * Upload file (image, voice, document) with progress tracking
   */
  async uploadFile(file, onProgress) {
    return new Promise((resolve, reject) => {
      const formData = new FormData();

      // If it's a Blob without a name property, add filename
      if (file instanceof Blob && !file.name) {
        formData.append('file', file, file.name || `file-${Date.now()}`);
      } else {
        formData.append('file', file, file.name);
      }

      const xhr = new XMLHttpRequest();
      const token = localStorage.getItem('authToken');

      xhr.open('POST', 'http://localhost:3001/api/chat/upload', true);

      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      // Track upload progress
      if (onProgress && xhr.upload) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            onProgress(percentComplete);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (e) {
            reject(new Error('Failed to parse upload response'));
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            reject(new Error(errorData.error || 'Upload failed'));
          } catch (e) {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.onabort = () => reject(new Error('Upload aborted'));

      xhr.send(formData);
    });
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
  },

  /**
   * Forward a message to other chats
   */
  async forwardMessage(messageId, toChatIds, userId, userType) {
    const response = await api.post('/chat/messages/forward', {
      messageId,
      toChatIds,
      userId,
      userType
    });
    return response;
  },

  /**
   * Get chat settings for a user
   */
  async getChatSettings(userId, userType) {
    const response = await api.get(`/chat/settings?userId=${userId}&userType=${userType}`);
    return response;
  },

  /**
   * Update chat settings for a user (global/centralized settings)
   */
  async updateChatSettings(userId, userType, settings) {
    const response = await api.put('/chat/settings', {
      userId,
      userType,
      settings
    });
    return response;
  },

  /**
   * Get per-chat settings (mute, pin, block for specific conversation)
   */
  async getPerChatSettings(chatId, userId, userType) {
    const response = await api.get(`/chat/chats/${chatId}/settings?userId=${userId}&userType=${userType}`);
    return response;
  },

  /**
   * Update per-chat settings (mute, pin, block for specific conversation)
   */
  async updatePerChatSettings(chatId, userId, userType, settings) {
    const response = await api.put(`/chat/chats/${chatId}/settings`, {
      userId,
      userType,
      ...settings
    });
    return response;
  },

  /**
   * Archive/Unarchive a chat
   */
  async archiveChat(chatId, userId, userType, isArchived) {
    const response = await api.put(`/chat/chats/${chatId}/archive`, {
      userId,
      userType,
      isArchived
    });
    return response;
  },

  /**
   * Clear all messages in a chat
   */
  async clearChat(chatId, userId, userType) {
    const response = await api.delete(`/chat/chats/${chatId}/clear`, {
      data: {
        userId,
        userType
      }
    });
    return response;
  },

  /**
   * Get link preview metadata for a URL
   */
  async getLinkPreview(url) {
    const response = await api.get(`/chat/link-preview?url=${encodeURIComponent(url)}`);
    return response;
  }


};
