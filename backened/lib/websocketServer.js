import { Server } from 'socket.io';
import { sql } from '../config/db.js';

/**
 * Modern WebSocket Server for Real-time Chat
 * Handles: Real-time messages, typing indicators, online status, read receipts
 */

// Store online users: { socketId: {userId, userType, userName} }
const onlineUsers = new Map();
// Store user to socket mapping: { `${userId}_${userType}`: Set of socketIds }
const userSockets = new Map();

export function initializeWebSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: ["http://localhost:5173", "http://localhost:3000", "http://localhost:5174"],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    /**
     * User joins with their identity
     */
    socket.on('user_online', (data) => {
      const { userId, userType, userName } = data;
      
      if (!userId || !userType) {
        console.error('❌ Invalid user_online data:', data);
        return;
      }

      const userKey = `${userId}_${userType}`;
      
      // Store socket info
      onlineUsers.set(socket.id, { userId, userType, userName, status: 'active' });
      
      // Add socket to user's socket set
      if (!userSockets.has(userKey)) {
        userSockets.set(userKey, new Set());
      }
      userSockets.get(userKey).add(socket.id);

      console.log(`✅ ${userName} (${userKey}) is online - Socket: ${socket.id}`);
      console.log(`📊 Total sockets for ${userKey}:`, userSockets.get(userKey).size);
      console.log(`📊 All online users:`, Array.from(userSockets.keys()));

      // Send current online users list to the newly connected user
      const onlineUsersList = Array.from(userSockets.keys()).map(key => {
        const [uid, utype] = key.split('_');
        return { userId: uid, userType: utype, isOnline: true };
      });
      socket.emit('online_users_list', onlineUsersList);
      console.log(`📤 Sent online users list to ${userName}:`, onlineUsersList.length, 'users');

      // Broadcast online status to relevant chats
      broadcastOnlineStatus(io, userId, userType, true);
    });

    /**
     * Join specific chat room
     */
    socket.on('join_chat', (chatId) => {
      socket.join(`chat_${chatId}`);
      console.log(`👥 Socket ${socket.id} joined chat ${chatId}`);
    });

    /**
     * Leave chat room
     */
    socket.on('leave_chat', (chatId) => {
      socket.leave(`chat_${chatId}`);
      console.log(`👋 Socket ${socket.id} left chat ${chatId}`);
    });

    /**
     * Send message (broadcast to chat room)
     */
    socket.on('send_message', async (data) => {
      const { chatId, message } = data;
      
      // Broadcast to all participants in the chat room except sender
      socket.to(`chat_${chatId}`).emit('new_message', {
        chatId,
        message
      });

      console.log(`💬 Message sent to chat ${chatId}`);

      // Send delivery notifications to online participants
      try {
        const participants = await sql`
          SELECT user_id, user_type FROM chat_participants
          WHERE chat_id = ${chatId}
            AND NOT (user_id = ${message.sender_id} AND user_type = ${message.sender_type})
        `;

        for (const participant of participants) {
          const userKey = `${participant.user_id}_${participant.user_type}`;
          const socketIds = userSockets.get(userKey);
          
          if (socketIds && socketIds.size > 0) {
            // User is online - mark as delivered
            await sql`
              UPDATE message_status
              SET status = 'delivered', delivered_at = NOW()
              WHERE message_id = ${message.id}
                AND user_id = ${participant.user_id}
                AND user_type = ${participant.user_type}
            `;

            // Emit delivery receipt
            socketIds.forEach(sid => {
              io.to(sid).emit('message_delivered', {
                messageId: message.id,
                chatId
              });
            });
          }
        }
      } catch (error) {
        console.error('Error handling message delivery:', error);
      }
    });

    /**
     * Mark message as read
     */
    socket.on('mark_read', async (data) => {
      const { chatId, messageIds, userId, userType } = data;

      try {
        await sql`
          UPDATE message_status
          SET status = 'read', read_at = NOW()
          WHERE message_id = ANY(${messageIds})
            AND user_id = ${userId}
            AND user_type = ${userType}
        `;

        // Notify message senders about read status
        const messages = await sql`
          SELECT DISTINCT sender_id, sender_type FROM messages
          WHERE id = ANY(${messageIds})
            AND NOT (sender_id = ${userId} AND sender_type = ${userType})
        `;

        messages.forEach(msg => {
          const senderKey = `${msg.sender_id}_${msg.sender_type}`;
          const socketIds = userSockets.get(senderKey);
          
          if (socketIds) {
            socketIds.forEach(sid => {
              io.to(sid).emit('messages_read', {
                chatId,
                messageIds,
                readBy: { userId, userType }
              });
            });
          }
        });

        console.log(`✅ Marked ${messageIds.length} messages as read in chat ${chatId}`);
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    /**
     * Typing indicator
     */
    socket.on('typing_start', async (data) => {
      const { chatId, userId, userType, userName } = data;

      try {
        // Store in database with expiry
        await sql`
          INSERT INTO typing_indicators (chat_id, user_id, user_type, user_name, is_typing, started_at, expires_at)
          VALUES (${chatId}, ${userId}, ${userType}, ${userName}, TRUE, NOW(), NOW() + INTERVAL '10 seconds')
          ON CONFLICT (chat_id, user_id, user_type)
          DO UPDATE SET is_typing = TRUE, started_at = NOW(), expires_at = NOW() + INTERVAL '10 seconds'
        `;

        // Broadcast to other participants in the chat
        socket.to(`chat_${chatId}`).emit('user_typing', {
          chatId,
          userId,
          userType,
          userName
        });

        console.log(`⌨️  ${userName} is typing in chat ${chatId}`);
      } catch (error) {
        console.error('Error handling typing start:', error);
      }
    });

    /**
     * Stop typing
     */
    socket.on('typing_stop', async (data) => {
      const { chatId, userId, userType } = data;

      try {
        await sql`
          DELETE FROM typing_indicators
          WHERE chat_id = ${chatId}
            AND user_id = ${userId}
            AND user_type = ${userType}
        `;

        socket.to(`chat_${chatId}`).emit('user_stopped_typing', {
          chatId,
          userId,
          userType
        });

        console.log(`⌨️  User stopped typing in chat ${chatId}`);
      } catch (error) {
        console.error('Error handling typing stop:', error);
      }
    });

    /**
     * Message reaction
     */
    socket.on('add_reaction', (data) => {
      const { chatId, messageId, userId, userType, reaction } = data;

      socket.to(`chat_${chatId}`).emit('reaction_added', {
        messageId,
        userId,
        userType,
        reaction
      });

      console.log(`😊 Reaction added to message ${messageId}`);
    });

    /**
     * User active status
     */
    socket.on('user_active', (data) => {
      const { userId, userType } = data;
      const user = onlineUsers.get(socket.id);
      
      if (user) {
        user.status = 'active';
        user.lastActivity = new Date();
        broadcastActivityStatus(io, userId, userType, 'active');
        console.log(`✅ User ${userId} is now active`);
      }
    });

    /**
     * User away status
     */
    socket.on('user_away', (data) => {
      const { userId, userType } = data;
      const user = onlineUsers.get(socket.id);
      
      if (user) {
        user.status = 'away';
        broadcastActivityStatus(io, userId, userType, 'away');
        console.log(`💤 User ${userId} is now away`);
      }
    });

    /**
     * Handle disconnect
     */
    socket.on('disconnect', () => {
      const user = onlineUsers.get(socket.id);
      
      if (user) {
        const userKey = `${user.userId}_${user.userType}`;
        const socketIds = userSockets.get(userKey);
        
        if (socketIds) {
          socketIds.delete(socket.id);
          
          // If user has no more sockets, they're offline
          if (socketIds.size === 0) {
            userSockets.delete(userKey);
            broadcastOnlineStatus(io, user.userId, user.userType, false);
            console.log(`👋 ${user.userName} went offline`);
          }
        }
        
        onlineUsers.delete(socket.id);
      }

      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  // Clean up expired typing indicators every 30 seconds
  setInterval(async () => {
    try {
      await sql`
        DELETE FROM typing_indicators
        WHERE expires_at < NOW()
      `;
    } catch (error) {
      console.error('Error cleaning typing indicators:', error);
    }
  }, 30000);

  console.log('✅ WebSocket server initialized');
  
  return io;
}

/**
 * Broadcast online/offline status to users in common chats
 */
async function broadcastOnlineStatus(io, userId, userType, isOnline) {
  try {
    const userKey = `${userId}_${userType}`;
    console.log(`📡 Broadcasting ${isOnline ? 'ONLINE' : 'OFFLINE'} status for ${userKey}`);
    
    // Find all chats this user is in
    const chats = await sql`
      SELECT DISTINCT chat_id FROM chat_participants
      WHERE user_id = ${userId} AND user_type = ${userType}
    `;

    console.log(`📡 Found ${chats.length} chats to broadcast to`);

    // Broadcast to each chat
    chats.forEach(chat => {
      console.log(`📡 Broadcasting to chat_${chat.chat_id}`);
      io.to(`chat_${chat.chat_id}`).emit('user_status_changed', {
        userId,
        userType,
        isOnline,
        timestamp: new Date()
      });
    });
    
    // Also broadcast globally to all connected clients
    io.emit('user_status_changed', {
      userId,
      userType,
      isOnline,
      timestamp: new Date()
    });
    
    console.log(`📡 Broadcast complete for ${userKey}`);
  } catch (error) {
    console.error('Error broadcasting online status:', error);
  }
}

/**
 * Broadcast activity status (active/away) to users in common chats
 */
async function broadcastActivityStatus(io, userId, userType, status) {
  try {
    // Find all chats this user is in
    const chats = await sql`
      SELECT DISTINCT chat_id FROM chat_participants
      WHERE user_id = ${userId} AND user_type = ${userType}
    `;

    // Broadcast to each chat
    chats.forEach(chat => {
      io.to(`chat_${chat.chat_id}`).emit('user_activity_changed', {
        userId,
        userType,
        status,
        timestamp: new Date()
      });
    });
  } catch (error) {
    console.error('Error broadcasting activity status:', error);
  }
}

export { onlineUsers, userSockets };
