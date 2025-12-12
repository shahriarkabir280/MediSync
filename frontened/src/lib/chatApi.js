import { api } from './api.js';

export const chatApi = {
  // Get all conversations for current user
  getConversations: async (userId, userType) => {
    try {
      const response = await api.get(`/chat/conversations?userId=${userId}&userType=${userType}`);
      console.log('Raw API response:', response);
      return response; // The response already contains the conversations property
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  },

  // Get messages for a conversation
  getMessages: async (conversationId, userId, userType, page = 1, limit = 50) => {
    try {
      const response = await api.get(
        `/chat/conversations/${conversationId}/messages?userId=${userId}&userType=${userType}&page=${page}&limit=${limit}`
      );
      console.log('Raw messages API response:', response);
      return response; // The response already contains the messages property
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  // Send a text message
  sendMessage: async (conversationId, messageData) => {
    try {
      const response = await api.post(`/chat/conversations/${conversationId}/messages`, messageData);
      console.log('Send message response:', response);
      return response; // The response contains the message property
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Send a file message (legacy)
  sendFile: async (conversationId, file, messageData) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('senderId', messageData.senderId);
      formData.append('senderName', messageData.senderName);
      formData.append('senderType', messageData.senderType);
      if (messageData.replyTo) {
        formData.append('replyTo', messageData.replyTo);
      }

      const response = await api.post(`/chat/conversations/${conversationId}/messages/file`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error sending file:', error);
      throw error;
    }
  },

  // Optimized file upload (multiple files)
  uploadFiles: async (files, conversationId, senderId, senderType, options = {}) => {
    try {
      const formData = new FormData();
      
      // Append files
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });
      
      // Append metadata
      formData.append('conversationId', conversationId);
      formData.append('senderId', senderId);
      formData.append('senderType', senderType);
      
      if (options.messageText) {
        formData.append('messageText', options.messageText);
      }
      if (options.senderName) {
        formData.append('senderName', options.senderName);
      }

      const response = await api.post('/chat/upload-optimized', formData);
      return response;
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    }
  },

  // Chunked file upload for large files
  uploadFileChunk: async (chunk, fileName, chunkIndex, totalChunks, fileId, options = {}) => {
    try {
      const queryParams = new URLSearchParams({
        fileName,
        chunkIndex: chunkIndex.toString(),
        totalChunks: totalChunks.toString(),
        fileId,
        ...(options.conversationId && { conversationId: options.conversationId }),
        ...(options.senderId && { senderId: options.senderId }),
        ...(options.senderType && { senderType: options.senderType })
      });

      const response = await api.post(`/chat/upload-chunk?${queryParams}`, chunk, {
        headers: {
          'Content-Type': 'application/octet-stream'
        },
      });
      return response;
    } catch (error) {
      console.error('Error uploading chunk:', error);
      throw error;
    }
  },

  // Compressed file upload
  uploadCompressedFile: async (file, conversationId, senderId, senderType, options = {}) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('conversationId', conversationId);
      formData.append('senderId', senderId);
      formData.append('senderType', senderType);
      
      if (options.senderName) {
        formData.append('senderName', options.senderName);
      }

      const response = await api.post('/chat/compress-and-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response;
    } catch (error) {
      console.error('Error uploading compressed file:', error);
      throw error;
    }
  },

  // Create a new conversation
  createConversation: async (conversationData) => {
    try {
      const response = await api.post('/chat/conversations', conversationData);
      return response.data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  },

  // Search conversations and messages
  searchChat: async (query, userId, userType, type = 'all') => {
    try {
      const response = await api.get(
        `/chat/search?query=${encodeURIComponent(query)}&userId=${userId}&userType=${userType}&type=${type}`
      );
      return response.data;
    } catch (error) {
      console.error('Error searching chat:', error);
      throw error;
    }
  },

  // Update typing indicator
  updateTypingStatus: async (conversationId, userId, userType, userName, isTyping) => {
    try {
      const response = await api.put(`/chat/conversations/${conversationId}/typing`, {
        userId,
        userType,
        userName,
        isTyping
      });
      return response.data;
    } catch (error) {
      console.error('Error updating typing status:', error);
      throw error;
    }
  },

  // Get typing indicators
  getTypingIndicators: async (conversationId, excludeUserId, excludeUserType) => {
    try {
      let url = `/chat/conversations/${conversationId}/typing`;
      if (excludeUserId && excludeUserType) {
        url += `?excludeUserId=${excludeUserId}&excludeUserType=${excludeUserType}`;
      }
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching typing indicators:', error);
      throw error;
    }
  },

  // Update message status
  updateMessageStatus: async (messageId, userId, userType, status) => {
    try {
      const response = await api.put(`/chat/messages/${messageId}/status`, {
        userId,
        userType,
        status
      });
      return response.data;
    } catch (error) {
      console.error('Error updating message status:', error);
      throw error;
    }
  },

  // Toggle conversation pin
  togglePin: async (conversationId, userId, userType) => {
    try {
      const response = await api.put(`/chat/conversations/${conversationId}/pin`, {
        userId,
        userType
      });
      return response.data;
    } catch (error) {
      console.error('Error toggling pin:', error);
      throw error;
    }
  },

  // Delete message
  deleteMessage: async (messageId, userId, userType) => {
    try {
      const response = await api.delete(`/chat/messages/${messageId}`, {
        data: { userId, userType }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  },

  // Search all users (doctors and patients) for starting conversations
  searchUsers: async (query = '', currentUserId, currentUserType) => {
    try {
      const response = await api.get(
        `/chat/users/search?query=${encodeURIComponent(query)}&currentUserId=${currentUserId}&currentUserType=${currentUserType}`
      );
      console.log('Search users response:', response);
      return response;
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  },

  // Start or get existing conversation with a user
  startConversation: async (otherUserId, otherUserType, currentUserId, currentUserType, currentUserName, otherUserName) => {
    try {
      const response = await api.post('/chat/conversations/start', {
        otherUserId,
        otherUserType,
        currentUserId,
        currentUserType,
        currentUserName,
        otherUserName
      });
      console.log('Start conversation response:', response);
      return response;
    } catch (error) {
      console.error('Error starting conversation:', error);
      throw error;
    }
  }
};