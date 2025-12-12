import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const useWebSocket = (serverUrl = 'http://localhost:3001') => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Map());
  const [typingUsers, setTypingUsers] = useState(new Map());
  const messageCallbacks = useRef(new Map());
  const statusCallbacks = useRef(new Map());
  const typingCallbacks = useRef(new Map());

  useEffect(() => {
    const newSocket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: false,
      timeout: 20000,
      forceNew: true
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket server:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    });

    newSocket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Handle new messages
    newSocket.on('new_message', (data) => {
      try {
        const { conversationId, message } = data;
        const callback = messageCallbacks.current.get(conversationId);
        if (callback) {
          callback(message);
        }
      } catch (error) {
        console.error('Error handling new message:', error);
      }
    });

    // Handle typing indicators
    newSocket.on('typing_update', (data) => {
      try {
        const { conversationId, users } = data;
        setTypingUsers(prev => new Map(prev.set(conversationId, users)));
        const callback = typingCallbacks.current.get(conversationId);
        if (callback) {
          callback(users);
        }
      } catch (error) {
        console.error('Error handling typing update:', error);
      }
    });

    // Handle online users updates
    newSocket.on('user_status_update', (data) => {
      try {
        setOnlineUsers(prev => new Map(prev.set(`${data.userId}_${data.userType}`, data)));
      } catch (error) {
        console.error('Error handling user status update:', error);
      }
    });

    return () => {
      try {
        newSocket.removeAllListeners();
        newSocket.disconnect();
      } catch (error) {
        console.error('Error during WebSocket cleanup:', error);
      }
    };
  }, [serverUrl]);

  // Connect and authenticate user
  const connect = (userData) => {
    try {
      if (socket && !isConnected) {
        socket.connect();
        socket.emit('join', userData);
      }
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
    }
  };

  // Disconnect
  const disconnect = () => {
    try {
      if (socket && isConnected) {
        socket.disconnect();
      }
    } catch (error) {
      console.error('Error disconnecting from WebSocket:', error);
    }
  };

  // Join a conversation room
  const joinConversation = (conversationId) => {
    try {
      if (socket && isConnected) {
        socket.emit('join_conversation', conversationId);
      }
    } catch (error) {
      console.error('Error joining conversation:', error);
    }
  };

  // Leave a conversation room
  const leaveConversation = (conversationId) => {
    try {
      if (socket && isConnected) {
        socket.emit('leave_conversation', conversationId);
      }
    } catch (error) {
      console.error('Error leaving conversation:', error);
    }
  };

  // Send message through WebSocket
  const sendMessage = (conversationId, message) => {
    try {
      if (socket && isConnected) {
        socket.emit('send_message', { conversationId, message });
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Update typing status
  const updateTypingStatus = (conversationId, userData, isTyping) => {
    try {
      if (socket && isConnected) {
        if (isTyping) {
          socket.emit('typing_start', { conversationId, ...userData });
        } else {
          socket.emit('typing_stop', { conversationId, ...userData });
        }
      }
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  };

  // Subscribe to new messages for a conversation
  const onNewMessage = (conversationId, callback) => {
    try {
      messageCallbacks.current.set(conversationId, callback);
      
      // Return cleanup function
      return () => {
        messageCallbacks.current.delete(conversationId);
      };
    } catch (error) {
      console.error('Error subscribing to messages:', error);
      return () => {};
    }
  };

  // Subscribe to typing indicators
  const onTypingUpdate = (conversationId, callback) => {
    try {
      typingCallbacks.current.set(conversationId, callback);
      
      return () => {
        typingCallbacks.current.delete(conversationId);
      };
    } catch (error) {
      console.error('Error subscribing to typing updates:', error);
      return () => {};
    }
  };

  // Check if user is online
  const isUserOnline = (userId, userType) => {
    try {
      const user = onlineUsers.get(`${userId}_${userType}`);
      return user?.isOnline || false;
    } catch (error) {
      console.error('Error checking user online status:', error);
      return false;
    }
  };

  // Get user's last seen time
  const getUserLastSeen = (userId, userType) => {
    try {
      const user = onlineUsers.get(`${userId}_${userType}`);
      return user?.lastSeen || null;
    } catch (error) {
      console.error('Error getting user last seen:', error);
      return null;
    }
  };

  return {
    socket,
    isConnected,
    onlineUsers,
    typingUsers,
    connect,
    disconnect,
    joinConversation,
    leaveConversation,
    sendMessage,
    updateTypingStatus,
    onNewMessage,
    onTypingUpdate,
    isUserOnline,
    getUserLastSeen
  };
};

export default useWebSocket;