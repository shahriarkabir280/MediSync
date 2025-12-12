import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001';

/**
 * Custom hook for WebSocket chat connection
 * Handles real-time messaging, typing indicators, and online status
 */
export function useChatSocket(user) {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  useEffect(() => {
    if (!user?.userId || !user?.userType) {
      return;
    }

    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    const socket = socketRef.current;

    // Connection handlers
    socket.on('connect', () => {
      console.log('✅ Socket connected');
      setIsConnected(true);
      
      // Announce user online
      socket.emit('user_online', {
        userId: user.userId,
        userType: user.userType,
        userName: user.userName
      });
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    // Online status handlers
    socket.on('user_status_changed', (data) => {
      const userKey = `${data.userId}_${data.userType}`;
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (data.isOnline) {
          newSet.add(userKey);
        } else {
          newSet.delete(userKey);
        }
        return newSet;
      });
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user?.userId, user?.userType, user?.userName]);

  // Join a chat room
  const joinChat = (chatId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('join_chat', chatId);
    }
  };

  // Leave a chat room
  const leaveChat = (chatId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leave_chat', chatId);
    }
  };

  // Send message through WebSocket
  const sendMessage = (chatId, message) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('send_message', { chatId, message });
    }
  };

  // Mark messages as read
  const markAsRead = (chatId, messageIds, userId, userType) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('mark_read', { chatId, messageIds, userId, userType });
    }
  };

  // Start typing indicator
  const startTyping = (chatId, userId, userType, userName) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('typing_start', { chatId, userId, userType, userName });
    }
  };

  // Stop typing indicator
  const stopTyping = (chatId, userId, userType) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('typing_stop', { chatId, userId, userType });
    }
  };

  // Add reaction
  const addReaction = (chatId, messageId, userId, userType, reaction) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('add_reaction', { chatId, messageId, userId, userType, reaction });
    }
  };

  // Subscribe to events
  const on = (event, handler) => {
    if (socketRef.current) {
      socketRef.current.on(event, handler);
    }
  };

  // Unsubscribe from events
  const off = (event, handler) => {
    if (socketRef.current) {
      socketRef.current.off(event, handler);
    }
  };

  // Check if a user is online
  const isUserOnline = (userId, userType) => {
    return onlineUsers.has(`${userId}_${userType}`);
  };

  return {
    socket: socketRef.current,
    isConnected,
    onlineUsers,
    isUserOnline,
    joinChat,
    leaveChat,
    sendMessage,
    markAsRead,
    startTyping,
    stopTyping,
    addReaction,
    on,
    off
  };
}
