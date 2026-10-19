import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';
import { API_CONFIG } from '../config/api';

const SOCKET_URL = API_CONFIG.BASE_URL;

/**
 * Custom hook for WebSocket chat connection
 * Handles real-time messaging, typing indicators, and online status
 */
export function useChatSocket(user) {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [userActivityStatus, setUserActivityStatus] = useState(new Map()); // userId_userType -> 'active' | 'away'

  useEffect(() => {
    if (!user?.userId || !user?.userType) {
      return;
    }

    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      // Server rejects connections without the doctor's JWT; a callback re-reads it on every reconnect
      auth: (cb) => cb({ token: localStorage.getItem('authToken') }),
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    const socket = socketRef.current;

    // Connection handlers
    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      console.log('👤 User info:', { userId: user.userId, userType: user.userType, userName: user.userName });
      setIsConnected(true);

      // Announce user online
      socket.emit('user_online', {
        userId: user.userId,
        userType: user.userType,
        userName: user.userName
      });

      console.log('📡 Emitted user_online event');
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
      console.log('📊 User status changed:', data);
      const userKey = `${data.userId}_${data.userType}`;
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (data.isOnline) {
          console.log(`✅ User ${userKey} is now ONLINE`);
          newSet.add(userKey);
        } else {
          console.log(`❌ User ${userKey} is now OFFLINE`);
          newSet.delete(userKey);
          // Remove activity status when offline
          setUserActivityStatus(prev => {
            const newMap = new Map(prev);
            newMap.delete(userKey);
            return newMap;
          });
        }
        return newSet;
      });
    });

    // Activity status handlers
    socket.on('user_activity_changed', (data) => {
      const userKey = `${data.userId}_${data.userType}`;
      setUserActivityStatus(prev => {
        const newMap = new Map(prev);
        newMap.set(userKey, data.status);
        return newMap;
      });
    });

    // Receive initial online users list
    socket.on('online_users_list', (usersList) => {
      console.log('📥 Received online users list:', usersList);
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        usersList.forEach(u => {
          const userKey = `${u.userId}_${u.userType}`;
          if (u.isOnline) {
            newSet.add(userKey);
            console.log(`✅ Added ${userKey} to online users`);
          }
        });
        console.log('📊 Total online users after update:', newSet.size);
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
  const joinChat = useCallback((chatId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('join_chat', chatId);
    }
  }, [isConnected]);

  // Leave a chat room
  const leaveChat = useCallback((chatId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leave_chat', chatId);
    }
  }, [isConnected]);

  // Send message through WebSocket
  const sendMessage = useCallback((chatId, message) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('send_message', { chatId, message });
    }
  }, [isConnected]);

  // Mark messages as read
  const markAsRead = useCallback((chatId, messageIds, userId, userType) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('mark_read', { chatId, messageIds, userId, userType });
    }
  }, [isConnected]);

  // Start typing indicator
  const startTyping = useCallback((chatId, userId, userType, userName) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('typing_start', { chatId, userId, userType, userName });
    }
  }, [isConnected]);

  // Stop typing indicator
  const stopTyping = useCallback((chatId, userId, userType) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('typing_stop', { chatId, userId, userType });
    }
  }, [isConnected]);

  // Add reaction
  const addReaction = useCallback((chatId, messageId, userId, userType, reaction) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('add_reaction', { chatId, messageId, userId, userType, reaction });
    }
  }, [isConnected]);

  // Subscribe to events
  const on = useCallback((event, handler) => {
    if (socketRef.current) {
      socketRef.current.on(event, handler);
    }
  }, [socketRef.current]); // socketRef is stable

  // Unsubscribe from events
  const off = useCallback((event, handler) => {
    if (socketRef.current) {
      socketRef.current.off(event, handler);
    }
  }, [socketRef.current]);

  // Check if a user is online
  const isUserOnline = useCallback((userId, userType) => {
    return onlineUsers.has(`${userId}_${userType}`);
  }, [onlineUsers]);

  // Get user activity status (active, away, or offline)
  const getUserActivityStatus = useCallback((userId, userType) => {
    const userKey = `${userId}_${userType}`;
    if (!onlineUsers.has(userKey)) return 'offline';
    return userActivityStatus.get(userKey) || 'active';
  }, [onlineUsers, userActivityStatus]);

  return useMemo(() => ({
    socket: socketRef.current,
    isConnected,
    onlineUsers,
    userActivityStatus,
    isUserOnline,
    getUserActivityStatus,
    joinChat,
    leaveChat,
    sendMessage,
    markAsRead,
    startTyping,
    stopTyping,
    addReaction,
    on,
    off
  }), [
    isConnected,
    onlineUsers,
    userActivityStatus,
    isUserOnline,
    getUserActivityStatus,
    joinChat,
    leaveChat,
    sendMessage,
    markAsRead,
    startTyping,
    stopTyping,
    addReaction,
    on,
    off
  ]);
}
