import { Server } from 'socket.io';
import { supabase } from '../config/db.js';

/**
 * Modern WebSocket Server for Real-time Chat
 * Handles: Real-time messages, typing indicators, online status, read receipts
 * Refactored to use Supabase SDK
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
      const personalRoom = `user_${userKey}`;

      // Join personal room for targeted broadcasting
      socket.join(personalRoom);

      // Store socket info
      onlineUsers.set(socket.id, { userId, userType, userName, status: 'active' });

      // Add socket to user's socket set
      if (!userSockets.has(userKey)) {
        userSockets.set(userKey, new Set());
      }
      userSockets.get(userKey).add(socket.id);

      // console.log(`✅ ${userName} (${userKey}) is online - Joined room: ${personalRoom}`);

      // Send current online users list to the newly connected user
      // Optimization: constructing this list can be heavy if many users. 
      const onlineUsersList = Array.from(userSockets.keys()).map(key => {
        const [uid, utype] = key.split('_');
        return { userId: uid, userType: utype, isOnline: true };
      });
      socket.emit('online_users_list', onlineUsersList);

      // Broadcast online status to relevant chats
      broadcastOnlineStatus(io, userId, userType, true);
    });

    /**
     * Join specific chat room
     */
    socket.on('join_chat', (chatId) => {
      socket.join(`chat_${chatId}`);
      // console.log(`👥 Socket ${socket.id} joined chat ${chatId}`);
    });

    /**
     * Leave chat room
     */
    socket.on('leave_chat', (chatId) => {
      socket.leave(`chat_${chatId}`);
      // console.log(`👋 Socket ${socket.id} left chat ${chatId}`);
    });

    /**
     * Send message (broadcast to participants)
     */
    socket.on('send_message', async (data) => {
      const { chatId, message } = data;

      try {
        // 1. Get all participants of this chat to find who to notify
        const { data: participants } = await supabase
          .from('chat_participants')
          .select('user_id, user_type')
          .eq('chat_id', chatId);

        if (participants) {
          participants.forEach(participant => {
            const recipientRoom = `user_${participant.user_id}_${participant.user_type}`;

            // Broadcast to all sockets of this participant (including sender's other tabs)
            io.to(recipientRoom).emit('new_message', {
              chatId,
              message
            });
          });
        }

        console.log(`💬 Message from ${message.sender_id} sent to chat ${chatId} participants`);

        // 2. Handle delivery status for online recipients
        if (participants) {
          // Filter out sender
          const recipients = participants.filter(p => !(p.user_id == message.sender_id && p.user_type == message.sender_type));

          for (const participant of recipients) {
            const userKey = `${participant.user_id}_${participant.user_type}`;
            const socketIds = userSockets.get(userKey);

            if (socketIds && socketIds.size > 0) {
              // User is online - mark as delivered
              await supabase
                .from('message_status')
                .update({ status: 'delivered', delivered_at: new Date().toISOString() })
                .eq('message_id', message.id)
                .eq('user_id', participant.user_id)
                .eq('user_type', participant.user_type);

              // Emit delivery receipt
              socketIds.forEach(sid => {
                io.to(sid).emit('message_delivered', {
                  messageId: message.id,
                  chatId
                });
              });
            }
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
        // Update DB
        await supabase
          .from('message_status')
          .update({ status: 'read', read_at: new Date().toISOString() })
          .in('message_id', messageIds)
          .eq('user_id', userId)
          .eq('user_type', userType);

        // Notify message senders about read status
        const { data: messages } = await supabase
          .from('messages')
          .select('sender_id, sender_type')
          .in('id', messageIds);

        if (!messages) return;

        // Dedup senders
        const senders = new Set();
        messages.forEach(m => {
          if (!(m.sender_id == userId && m.sender_type == userType)) {
            senders.add(`${m.sender_id}_${m.sender_type}`);
          }
        });

        senders.forEach(senderKey => {
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
        // Upsert typing indicator
        const expiresAt = new Date(Date.now() + 10000).toISOString();

        await supabase
          .from('typing_indicators')
          .upsert({
            chat_id: chatId,
            user_id: userId,
            user_type: userType,
            user_name: userName,
            is_typing: true,
            started_at: new Date().toISOString(),
            expires_at: expiresAt
          }, { onConflict: 'chat_id, user_id, user_type' });

        // Broadcast to other participants in the chat
        socket.to(`chat_${chatId}`).emit('user_typing', {
          chatId,
          userId,
          userType,
          userName
        });
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
        await supabase
          .from('typing_indicators')
          .delete()
          .eq('chat_id', chatId)
          .eq('user_id', userId)
          .eq('user_type', userType);

        socket.to(`chat_${chatId}`).emit('user_stopped_typing', {
          chatId,
          userId,
          userType
        });
      } catch (error) {
        // console.error('Error handling typing stop:', error);
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
      }
    });

    /**
     * WebRTC Call Signaling
     */
    socket.on('call_user', (data) => {
      const { to, toType, from, fromType, fromName, callType, offer } = data;

      const userKey = `${to}_${toType}`;
      const socketIds = userSockets.get(userKey);

      if (socketIds && socketIds.size > 0) {
        socketIds.forEach(sid => {
          io.to(sid).emit('incoming_call', {
            from,
            fromType,
            fromName,
            callType,
            offer
          });
        });
      } else {
        socket.emit('call_failed', { reason: 'User offline' });
      }
    });

    socket.on('accept_call', (data) => {
      const { to, toType, answer } = data;

      const userKey = `${to}_${toType}`;
      const socketIds = userSockets.get(userKey);

      if (socketIds && socketIds.size > 0) {
        socketIds.forEach(sid => {
          io.to(sid).emit('call_accepted', { answer });
        });
      }
    });

    socket.on('reject_call', (data) => {
      const { to, toType } = data;

      const userKey = `${to}_${toType}`;
      const socketIds = userSockets.get(userKey);

      if (socketIds && socketIds.size > 0) {
        socketIds.forEach(sid => {
          io.to(sid).emit('call_rejected');
        });
      }
    });

    socket.on('end_call', (data) => {
      const { to, toType } = data;

      const userKey = `${to}_${toType}`;
      const socketIds = userSockets.get(userKey);

      if (socketIds && socketIds.size > 0) {
        socketIds.forEach(sid => {
          io.to(sid).emit('call_ended');
        });
      }
    });

    socket.on('ice_candidate', (data) => {
      const { to, toType, candidate } = data;

      const userKey = `${to}_${toType}`;
      const socketIds = userSockets.get(userKey);

      if (socketIds && socketIds.size > 0) {
        socketIds.forEach(sid => {
          io.to(sid).emit('ice_candidate', { candidate });
        });
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
      await supabase
        .from('typing_indicators')
        .delete()
        .lt('expires_at', new Date().toISOString());
    } catch (error) {
      //   console.error('Error cleaning typing indicators:', error);
    }
  }, 30000);

  return io;
}

/**
 * Broadcast online/offline status to users in common chats
 */
async function broadcastOnlineStatus(io, userId, userType, isOnline) {
  try {
    // Find all chats this user is in
    const { data: chats } = await supabase
      .from('chat_participants')
      .select('chat_id')
      .eq('user_id', userId)
      .eq('user_type', userType);

    if (!chats) return;

    // Broadcast to each chat
    chats.forEach(chat => {
      io.to(`chat_${chat.chat_id}`).emit('user_status_changed', {
        userId,
        userType,
        isOnline,
        timestamp: new Date()
      });
    });

    // Also broadcast globally to all connected clients (legacy/dashboard behavior)
    io.emit('user_status_changed', {
      userId,
      userType,
      isOnline,
      timestamp: new Date()
    });

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
    const { data: chats } = await supabase
      .from('chat_participants')
      .select('chat_id')
      .eq('user_id', userId)
      .eq('user_type', userType);

    if (!chats) return;

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
