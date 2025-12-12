import { Server } from 'socket.io';
import { sql } from '../config/db.js';

let io;

export const initializeWebSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173", "http://localhost:3000"],
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Store connected users
  const connectedUsers = new Map();

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Handle user authentication and joining
    socket.on('join', async (userData) => {
      try {
        const { userId, userType, userName } = userData;
        
        // Store user info
        connectedUsers.set(socket.id, { userId, userType, userName, socketId: socket.id });
        
        // Update user's last seen timestamp
        await sql`
          UPDATE conversation_participants 
          SET last_seen = CURRENT_TIMESTAMP
          WHERE user_id = ${userId} AND user_type = ${userType}
        `;

        // Get user's conversations and join their rooms
        const conversations = await sql`
          SELECT conversation_id FROM conversation_participants 
          WHERE user_id = ${userId} AND user_type = ${userType}
        `;

        conversations.forEach(conv => {
          socket.join(`conversation_${conv.conversation_id}`);
        });

        // Broadcast user online status to their conversations
        conversations.forEach(conv => {
          socket.to(`conversation_${conv.conversation_id}`).emit('user_online', {
            userId,
            userType,
            userName,
            isOnline: true
          });
        });

        console.log(`User ${userName} (${userId}) joined`);
      } catch (error) {
        console.error('Error handling user join:', error);
      }
    });

    // Handle joining specific conversation
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation_${conversationId}`);
      console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
    });

    // Handle leaving conversation
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation_${conversationId}`);
      console.log(`Socket ${socket.id} left conversation ${conversationId}`);
    });

    // Handle new message broadcasting
    socket.on('send_message', async (messageData) => {
      try {
        const { conversationId, message } = messageData;
        
        // Broadcast to all users in the conversation except sender
        socket.to(`conversation_${conversationId}`).emit('new_message', {
          conversationId,
          message
        });

        // Update message delivery status for online users
        const roomSockets = await io.in(`conversation_${conversationId}`).fetchSockets();
        
        for (const roomSocket of roomSockets) {
          if (roomSocket.id !== socket.id) { // Don't update status for sender
            const userData = connectedUsers.get(roomSocket.id);
            if (userData) {
              // Update message status to 'delivered'
              await sql`
                UPDATE message_status 
                SET status = 'delivered', timestamp = CURRENT_TIMESTAMP
                WHERE message_id = ${message.id} 
                AND user_id = ${userData.userId} 
                AND user_type = ${userData.userType}
              `;
            }
          }
        }

      } catch (error) {
        console.error('Error broadcasting message:', error);
      }
    });

    // Handle typing indicators
    socket.on('typing_start', async (data) => {
      try {
        const { conversationId, userId, userType, userName } = data;
        
        // Update typing status in database
        await sql`
          INSERT INTO typing_indicators (
            conversation_id, user_id, user_type, user_name, is_typing, updated_at
          )
          VALUES (${conversationId}, ${userId}, ${userType}, ${userName}, true, CURRENT_TIMESTAMP)
          ON CONFLICT (conversation_id, user_id, user_type) 
          DO UPDATE SET is_typing = true, updated_at = CURRENT_TIMESTAMP
        `;

        // Broadcast to others in conversation
        socket.to(`conversation_${conversationId}`).emit('user_typing', {
          userId,
          userType,
          userName,
          isTyping: true
        });

      } catch (error) {
        console.error('Error handling typing start:', error);
      }
    });

    socket.on('typing_stop', async (data) => {
      try {
        const { conversationId, userId, userType, userName } = data;
        
        // Update typing status in database
        await sql`
          UPDATE typing_indicators 
          SET is_typing = false, updated_at = CURRENT_TIMESTAMP
          WHERE conversation_id = ${conversationId} 
          AND user_id = ${userId} 
          AND user_type = ${userType}
        `;

        // Broadcast to others in conversation
        socket.to(`conversation_${conversationId}`).emit('user_typing', {
          userId,
          userType,
          userName,
          isTyping: false
        });

      } catch (error) {
        console.error('Error handling typing stop:', error);
      }
    });

    // Handle message read status
    socket.on('mark_messages_read', async (data) => {
      try {
        const { conversationId, userId, userType, messageIds } = data;

        if (messageIds && messageIds.length > 0) {
          // Update multiple messages as read
          for (const messageId of messageIds) {
            await sql`
              INSERT INTO message_status (message_id, user_id, user_type, status, timestamp)
              VALUES (${messageId}, ${userId}, ${userType}, 'read', CURRENT_TIMESTAMP)
              ON CONFLICT (message_id, user_id, user_type)
              DO UPDATE SET status = 'read', timestamp = CURRENT_TIMESTAMP
            `;
          }

          // Notify other users in conversation about read receipts
          socket.to(`conversation_${conversationId}`).emit('messages_read', {
            userId,
            userType,
            messageIds
          });
        }

      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Handle file upload progress (for large files)
    socket.on('file_upload_progress', (data) => {
      const { conversationId, progress, fileName } = data;
      socket.to(`conversation_${conversationId}`).emit('file_upload_progress', {
        progress,
        fileName,
        userId: connectedUsers.get(socket.id)?.userId
      });
    });

    // Handle user disconnect
    socket.on('disconnect', async () => {
      try {
        const userData = connectedUsers.get(socket.id);
        
        if (userData) {
          const { userId, userType, userName } = userData;

          // Update last seen timestamp
          await sql`
            UPDATE conversation_participants 
            SET last_seen = CURRENT_TIMESTAMP
            WHERE user_id = ${userId} AND user_type = ${userType}
          `;

          // Clear typing indicators
          await sql`
            UPDATE typing_indicators 
            SET is_typing = false, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ${userId} AND user_type = ${userType}
          `;

          // Get user's conversations to broadcast offline status
          const conversations = await sql`
            SELECT conversation_id FROM conversation_participants 
            WHERE user_id = ${userId} AND user_type = ${userType}
          `;

          // Broadcast user offline status
          conversations.forEach(conv => {
            socket.to(`conversation_${conv.conversation_id}`).emit('user_offline', {
              userId,
              userType,
              userName,
              isOnline: false,
              lastSeen: new Date().toISOString()
            });
          });

          connectedUsers.delete(socket.id);
          console.log(`User ${userName} (${userId}) disconnected`);
        }

      } catch (error) {
        console.error('Error handling user disconnect:', error);
      }
    });
  });

  // Clean up old typing indicators every 30 seconds
  setInterval(async () => {
    try {
      await sql`
        DELETE FROM typing_indicators 
        WHERE updated_at < NOW() - INTERVAL '30 seconds'
      `;
    } catch (error) {
      console.error('Error cleaning typing indicators:', error);
    }
  }, 30000);

  return io;
};

// Export function to get io instance
export const getIO = () => {
  if (!io) {
    throw new Error('WebSocket server not initialized');
  }
  return io;
};