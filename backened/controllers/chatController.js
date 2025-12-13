import { sql } from '../config/db.js';
import crypto from 'crypto';

/**
 * Modern Chat Controller
 * WhatsApp/Telegram style messaging system
 */

export const chatController = {
  /**
   * Get or create a private chat between two users
   * This is the main entry point for starting a conversation
   */
  getOrCreateChat: async (req, res) => {
    try {
      const { myUserId, myUserType, myUserName, myUserEmail, myUserAvatar,
              otherUserId, otherUserType, otherUserName, otherUserEmail, otherUserAvatar } = req.body;

      if (!myUserId || !myUserType || !otherUserId || !otherUserType) {
        return res.status(400).json({ error: 'Missing required user information' });
      }

      // Check if chat already exists between these two users
      const existingChat = await sql`
        SELECT c.*, 
          json_agg(
            json_build_object(
              'user_id', cp.user_id,
              'user_type', cp.user_type,
              'user_name', cp.user_name,
              'user_email', cp.user_email,
              'user_avatar', cp.user_avatar,
              'is_muted', cp.is_muted,
              'is_pinned', cp.is_pinned,
              'last_read_at', cp.last_read_at
            )
          ) as participants
        FROM chats c
        JOIN chat_participants cp ON c.id = cp.chat_id
        WHERE c.type = 'private'
          AND c.id IN (
            SELECT chat_id FROM chat_participants 
            WHERE user_id = ${myUserId} AND user_type = ${myUserType}
          )
          AND c.id IN (
            SELECT chat_id FROM chat_participants 
            WHERE user_id = ${otherUserId} AND user_type = ${otherUserType}
          )
          AND (SELECT COUNT(*) FROM chat_participants WHERE chat_id = c.id) = 2
        GROUP BY c.id
        LIMIT 1
      `;

      if (existingChat.length > 0) {
        // Get unread count for this user
        const unreadCount = await sql`
          SELECT COUNT(*) as count
          FROM messages m
          LEFT JOIN message_status ms ON m.id = ms.message_id 
            AND ms.user_id = ${myUserId} 
            AND ms.user_type = ${myUserType}
          WHERE m.chat_id = ${existingChat[0].id}
            AND m.sender_id != ${myUserId}
            AND (ms.status IS NULL OR ms.status != 'read')
            AND m.is_deleted = FALSE
        `;

        return res.json({
          chat: {
            ...existingChat[0],
            unread_count: parseInt(unreadCount[0].count)
          },
          isNew: false
        });
      }

      // Create new chat
      const [newChat] = await sql`
        INSERT INTO chats (type, created_at, updated_at)
        VALUES ('private', NOW(), NOW())
        RETURNING *
      `;

      // Add both participants
      await sql`
        INSERT INTO chat_participants 
          (chat_id, user_id, user_type, user_name, user_email, user_avatar)
        VALUES 
          (${newChat.id}, ${myUserId}, ${myUserType}, ${myUserName}, ${myUserEmail || ''}, ${myUserAvatar || ''}),
          (${newChat.id}, ${otherUserId}, ${otherUserType}, ${otherUserName}, ${otherUserEmail || ''}, ${otherUserAvatar || ''})
      `;

      // Get full chat with participants
      const chat = await sql`
        SELECT c.*, 
          json_agg(
            json_build_object(
              'user_id', cp.user_id,
              'user_type', cp.user_type,
              'user_name', cp.user_name,
              'user_email', cp.user_email,
              'user_avatar', cp.user_avatar,
              'is_muted', cp.is_muted,
              'is_pinned', cp.is_pinned,
              'last_read_at', cp.last_read_at
            )
          ) as participants
        FROM chats c
        JOIN chat_participants cp ON c.id = cp.chat_id
        WHERE c.id = ${newChat.id}
        GROUP BY c.id
      `;

      console.log(`✅ Created new chat ${newChat.id} between ${myUserId} and ${otherUserId}`);

      res.json({
        chat: { ...chat[0], unread_count: 0 },
        isNew: true
      });

    } catch (error) {
      console.error('Error getting/creating chat:', error);
      res.status(500).json({ error: 'Failed to get or create chat' });
    }
  },

  /**
   * Get all chats for a user (their inbox)
   */
  getMyChats: async (req, res) => {
    try {
      const { userId, userType } = req.query;

      if (!userId || !userType) {
        return res.status(400).json({ error: 'userId and userType required' });
      }

      const chats = await sql`
        SELECT 
          c.id,
          c.type,
          c.created_at,
          c.updated_at,
          c.last_message_at,
          c.is_archived,
          cp.is_muted,
          cp.is_pinned,
          cp.is_blocked,
          cp.last_read_at,
          -- Other participant info
          (
            SELECT json_build_object(
              'user_id', cp2.user_id,
              'user_type', cp2.user_type,
              'user_name', cp2.user_name,
              'user_email', cp2.user_email,
              'user_avatar', cp2.user_avatar
            )
            FROM chat_participants cp2
            WHERE cp2.chat_id = c.id 
              AND NOT (cp2.user_id = ${userId} AND cp2.user_type = ${userType})
            LIMIT 1
          ) as other_user,
          -- Last message
          (
            SELECT json_build_object(
              'id', m.id,
              'content', m.content,
              'message_type', m.message_type,
              'sender_id', m.sender_id,
              'sender_name', m.sender_name,
              'created_at', m.created_at,
              'is_deleted', m.is_deleted
            )
            FROM messages m
            WHERE m.chat_id = c.id AND m.is_deleted = FALSE
            ORDER BY m.created_at DESC
            LIMIT 1
          ) as last_message,
          -- Unread count
          (
            SELECT COUNT(*)
            FROM messages m
            LEFT JOIN message_status ms ON m.id = ms.message_id 
              AND ms.user_id = ${userId} 
              AND ms.user_type = ${userType}
            WHERE m.chat_id = c.id
              AND m.sender_id != ${userId}
              AND (ms.status IS NULL OR ms.status != 'read')
              AND m.is_deleted = FALSE
          ) as unread_count
        FROM chats c
        JOIN chat_participants cp ON c.id = cp.chat_id
        WHERE cp.user_id = ${userId} 
          AND cp.user_type = ${userType}
          AND c.is_archived = FALSE
        ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC
      `;

      res.json({ chats });

    } catch (error) {
      console.error('Error fetching chats:', error);
      res.status(500).json({ error: 'Failed to fetch chats' });
    }
  },

  /**
   * Get messages for a specific chat
   */
  getMessages: async (req, res) => {
    try {
      const { chatId } = req.params;
      const { userId, userType, limit = 50, before } = req.query;

      if (!userId || !userType) {
        return res.status(400).json({ error: 'userId and userType required' });
      }

      // Verify user is participant
      const participant = await sql`
        SELECT id FROM chat_participants
        WHERE chat_id = ${chatId}
          AND user_id = ${userId}
          AND user_type = ${userType}
      `;

      if (participant.length === 0) {
        return res.status(403).json({ error: 'You are not a participant in this chat' });
      }

      // Build query with optional pagination
      let messagesQuery;
      if (before) {
        messagesQuery = sql`
          SELECT 
            m.*,
            -- Reply info
            (
              SELECT json_build_object(
                'id', m2.id,
                'content', m2.content,
                'sender_name', m2.sender_name
              )
              FROM messages m2
              WHERE m2.id = m.reply_to_id
            ) as reply_to,
            -- Message status for this user
            (
              SELECT json_build_object(
                'status', ms.status,
                'delivered_at', ms.delivered_at,
                'read_at', ms.read_at
              )
              FROM message_status ms
              WHERE ms.message_id = m.id
                AND ms.user_id = ${userId}
                AND ms.user_type = ${userType}
            ) as my_status,
            -- Reactions
            (
              SELECT json_agg(
                json_build_object(
                  'user_id', mr.user_id,
                  'user_type', mr.user_type,
                  'reaction', mr.reaction
                )
              )
              FROM message_reactions mr
              WHERE mr.message_id = m.id
            ) as reactions
          FROM messages m
          WHERE m.chat_id = ${chatId}
            AND m.id < ${before}
            AND (m.is_deleted = FALSE OR m.sender_id = ${userId})
          ORDER BY m.created_at DESC
          LIMIT ${limit}
        `;
      } else {
        messagesQuery = sql`
          SELECT 
            m.*,
            -- Reply info
            (
              SELECT json_build_object(
                'id', m2.id,
                'content', m2.content,
                'sender_name', m2.sender_name
              )
              FROM messages m2
              WHERE m2.id = m.reply_to_id
            ) as reply_to,
            -- Message status for this user
            (
              SELECT json_build_object(
                'status', ms.status,
                'delivered_at', ms.delivered_at,
                'read_at', ms.read_at
              )
              FROM message_status ms
              WHERE ms.message_id = m.id
                AND ms.user_id = ${userId}
                AND ms.user_type = ${userType}
            ) as my_status,
            -- Reactions
            (
              SELECT json_agg(
                json_build_object(
                  'user_id', mr.user_id,
                  'user_type', mr.user_type,
                  'reaction', mr.reaction
                )
              )
              FROM message_reactions mr
              WHERE mr.message_id = m.id
            ) as reactions
          FROM messages m
          WHERE m.chat_id = ${chatId}
            AND (m.is_deleted = FALSE OR m.sender_id = ${userId})
          ORDER BY m.created_at DESC
          LIMIT ${limit}
        `;
      }

      const messages = await messagesQuery;

      // Mark messages as delivered for this user
      await sql`
        UPDATE message_status
        SET status = 'delivered', delivered_at = NOW()
        WHERE message_id IN (
          SELECT id FROM messages WHERE chat_id = ${chatId}
        )
          AND user_id = ${userId}
          AND user_type = ${userType}
          AND status = 'sent'
      `;

      res.json({ messages: messages.reverse() });

    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  },

  /**
   * Send a new message
   */
  sendMessage: async (req, res) => {
    try {
      const { chatId } = req.params;
      const { 
        senderId, senderType, senderName,
        content, messageType = 'text',
        mediaUrl, mediaName, mediaSize, mediaType, thumbnailUrl,
        replyToId, encryptedContent
      } = req.body;

      if (!senderId || !senderType || !senderName) {
        return res.status(400).json({ error: 'Sender information required' });
      }

      if (!content && !mediaUrl && !encryptedContent) {
        return res.status(400).json({ error: 'Message content or media required' });
      }

      // Verify sender is participant
      const participant = await sql`
        SELECT id FROM chat_participants
        WHERE chat_id = ${chatId}
          AND user_id = ${senderId}
          AND user_type = ${senderType}
      `;

      if (participant.length === 0) {
        return res.status(403).json({ error: 'You are not a participant in this chat' });
      }

      // Insert message
      const [message] = await sql`
        INSERT INTO messages (
          chat_id, sender_id, sender_type, sender_name,
          content, encrypted_content, message_type,
          media_url, media_name, media_size, media_type, thumbnail_url,
          reply_to_id, created_at
        )
        VALUES (
          ${chatId}, ${senderId}, ${senderType}, ${senderName},
          ${content || null}, ${encryptedContent || null}, ${messageType},
          ${mediaUrl || null}, ${mediaName || null}, ${mediaSize || null}, 
          ${mediaType || null}, ${thumbnailUrl || null},
          ${replyToId || null}, NOW()
        )
        RETURNING *
      `;

      // Get all participants to create message status
      const participants = await sql`
        SELECT user_id, user_type FROM chat_participants
        WHERE chat_id = ${chatId}
      `;

      // Create message status for each participant
      for (const p of participants) {
        const status = (p.user_id === senderId && p.user_type === senderType) ? 'read' : 'sent';
        const readAt = (p.user_id === senderId && p.user_type === senderType) ? new Date() : null;
        
        await sql`
          INSERT INTO message_status (message_id, user_id, user_type, status, read_at)
          VALUES (${message.id}, ${p.user_id}, ${p.user_type}, ${status}, ${readAt})
        `;
      }

      // Get reply info if exists
      let replyInfo = null;
      if (replyToId) {
        const reply = await sql`
          SELECT id, content, sender_name FROM messages WHERE id = ${replyToId}
        `;
        if (reply.length > 0) {
          replyInfo = reply[0];
        }
      }

      console.log(`✅ Message sent in chat ${chatId} by ${senderName}`);

      res.json({
        message: {
          ...message,
          reply_to: replyInfo,
          reactions: []
        }
      });

    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  },

  /**
   * Mark messages as read
   */
  markAsRead: async (req, res) => {
    try {
      const { chatId } = req.params;
      const { userId, userType, messageIds } = req.body;

      if (!userId || !userType) {
        return res.status(400).json({ error: 'userId and userType required' });
      }

      // Verify user is participant
      const participant = await sql`
        SELECT id FROM chat_participants
        WHERE chat_id = ${chatId}
          AND user_id = ${userId}
          AND user_type = ${userType}
      `;

      if (participant.length === 0) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      if (messageIds && messageIds.length > 0) {
        // Mark specific messages as read
        await sql`
          UPDATE message_status
          SET status = 'read', read_at = NOW()
          WHERE message_id = ANY(${messageIds})
            AND user_id = ${userId}
            AND user_type = ${userType}
            AND status != 'read'
        `;
      } else {
        // Mark all messages in chat as read
        await sql`
          UPDATE message_status
          SET status = 'read', read_at = NOW()
          WHERE message_id IN (
            SELECT id FROM messages WHERE chat_id = ${chatId}
          )
            AND user_id = ${userId}
            AND user_type = ${userType}
            AND status != 'read'
        `;
      }

      // Update last_read_at for participant
      await sql`
        UPDATE chat_participants
        SET last_read_at = NOW()
        WHERE chat_id = ${chatId}
          AND user_id = ${userId}
          AND user_type = ${userType}
      `;

      res.json({ success: true });

    } catch (error) {
      console.error('Error marking messages as read:', error);
      res.status(500).json({ error: 'Failed to mark messages as read' });
    }
  },

  /**
   * Delete a message (Unsend)
   */
  deleteMessage: async (req, res) => {
    try {
      const { messageId } = req.params;
      const { userId, userType, deleteForEveryone = false } = req.body;

      console.log('Delete message request:', { messageId, userId, userType, deleteForEveryone });

      // Verify user is sender
      const message = await sql`
        SELECT * FROM messages
        WHERE id = ${messageId}
          AND sender_id = ${userId}
          AND sender_type = ${userType}
      `;

      console.log('Found message:', message.length > 0 ? 'Yes' : 'No');

      if (message.length === 0) {
        return res.status(403).json({ error: 'You can only delete your own messages' });
      }

      if (deleteForEveryone) {
        // Unsend for everyone (within time limit - 1 hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const messageTime = new Date(message[0].created_at);
        
        console.log('Message time:', messageTime, 'One hour ago:', oneHourAgo);
        
        if (messageTime < oneHourAgo) {
          return res.status(400).json({ error: 'Can only unsend for everyone within 1 hour' });
        }

        console.log('Updating message as deleted for everyone');
        
        await sql`
          UPDATE messages
          SET is_deleted = ${true}, 
              delete_for_everyone = ${true}, 
              deleted_at = NOW()
          WHERE id = ${messageId}
        `;

        // Emit socket event for real-time update
        const io = req.app.get('io');
        if (io) {
          io.to(`chat_${message[0].chat_id}`).emit('message_deleted', {
            messageId,
            chatId: message[0].chat_id,
            deleteForEveryone: true
          });
        }
      } else {
        // Delete for me only
        console.log('Updating message as deleted for sender only');
        
        await sql`
          UPDATE messages
          SET is_deleted = ${true}, 
              deleted_at = NOW()
          WHERE id = ${messageId}
        `;
      }

      console.log('Delete successful');
      res.json({ success: true, deleteForEveryone });

    } catch (error) {
      console.error('Error deleting message:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ error: 'Failed to delete message', details: error.message });
    }
  },

  /**
   * Forward a message to another chat
   */
  forwardMessage: async (req, res) => {
    try {
      const { messageId, toChatIds, userId, userType } = req.body;

      if (!messageId || !toChatIds || !Array.isArray(toChatIds) || toChatIds.length === 0) {
        return res.status(400).json({ error: 'messageId and toChatIds array required' });
      }

      // Get original message
      const originalMessage = await sql`
        SELECT * FROM messages
        WHERE id = ${messageId}
      `;

      if (originalMessage.length === 0) {
        return res.status(404).json({ error: 'Message not found' });
      }

      const message = originalMessage[0];

      // Verify user has access to the original message's chat
      const hasAccess = await sql`
        SELECT id FROM chat_participants
        WHERE chat_id = ${message.chat_id}
          AND user_id = ${userId}
          AND user_type = ${userType}
      `;

      if (hasAccess.length === 0) {
        return res.status(403).json({ error: 'You do not have access to this message' });
      }

      const forwardedMessages = [];
      const io = req.app.get('io');

      // Forward to each chat
      for (const chatId of toChatIds) {
        // Verify user is participant in target chat
        const isParticipant = await sql`
          SELECT id FROM chat_participants
          WHERE chat_id = ${chatId}
            AND user_id = ${userId}
            AND user_type = ${userType}
        `;

        if (isParticipant.length === 0) {
          continue; // Skip this chat
        }

        // Get sender name
        let senderName = '';
        if (userType === 'doctor') {
          const doctor = await sql`
            SELECT CONCAT(first_name, ' ', last_name) as name FROM doctors WHERE unique_id = ${userId}
          `;
          senderName = doctor[0]?.name || 'Doctor';
        } else {
          const patient = await sql`
            SELECT CONCAT(first_name, ' ', last_name) as name FROM patients WHERE unique_id = ${userId}
          `;
          senderName = patient[0]?.name || 'Patient';
        }

        // Create forwarded message
        const newMessage = await sql`
          INSERT INTO messages (
            chat_id, sender_id, sender_type, sender_name,
            message_type, content,
            media_url, media_name, media_size, media_type,
            is_forwarded, forwarded_from_message_id
          ) VALUES (
            ${chatId}, ${userId}, ${userType}, ${senderName},
            ${message.message_type}, ${message.content},
            ${message.media_url}, ${message.media_name}, ${message.media_size}, ${message.media_type},
            TRUE, ${messageId}
          )
          RETURNING *
        `;

        forwardedMessages.push(newMessage[0]);

        // Update chat's last message
        await sql`
          UPDATE chats
          SET last_message_at = NOW()
          WHERE id = ${chatId}
        `;

        // Create message status for all participants
        const participants = await sql`
          SELECT user_id, user_type FROM chat_participants WHERE chat_id = ${chatId}
        `;

        for (const participant of participants) {
          await sql`
            INSERT INTO message_status (message_id, user_id, user_type, status)
            VALUES (
              ${newMessage[0].id},
              ${participant.user_id},
              ${participant.user_type},
              ${participant.user_id === userId && participant.user_type === userType ? 'read' : 'sent'}
            )
          `;
        }

        // Emit socket event
        if (io) {
          io.to(`chat_${chatId}`).emit('new_message', newMessage[0]);
        }
      }

      res.json({ 
        success: true, 
        forwardedCount: forwardedMessages.length,
        messages: forwardedMessages
      });

    } catch (error) {
      console.error('Error forwarding message:', error);
      res.status(500).json({ error: 'Failed to forward message' });
    }
  },

  /**
   * Search all users to start a new chat
   * Fixed: Using profile_image_url instead of profile_image
   */
  searchUsers: async (req, res) => {
    try {
      const { query = '', currentUserId, currentUserType } = req.query;

      if (!currentUserId || !currentUserType) {
        return res.status(400).json({ error: 'Current user info required' });
      }

      // Search doctors
      const doctors = await sql`
        SELECT 
          unique_id as user_id,
          'doctor' as user_type,
          CONCAT(first_name, ' ', last_name) as user_name,
          email as user_email,
          profile_image_url as user_avatar,
          specialization
        FROM doctors
        WHERE (LOWER(first_name) LIKE LOWER(${'%' + query + '%'})
          OR LOWER(last_name) LIKE LOWER(${'%' + query + '%'})
          OR LOWER(email) LIKE LOWER(${'%' + query + '%'}))
          AND unique_id != ${currentUserId}
        LIMIT 20
      `;

      // Search patients
      const patients = await sql`
        SELECT 
          unique_id as user_id,
          'patient' as user_type,
          CONCAT(first_name, ' ', last_name) as user_name,
          email as user_email,
          NULL as user_avatar,
          NULL as specialization
        FROM patients
        WHERE (LOWER(first_name) LIKE LOWER(${'%' + query + '%'})
          OR LOWER(last_name) LIKE LOWER(${'%' + query + '%'})
          OR LOWER(email) LIKE LOWER(${'%' + query + '%'}))
          AND unique_id != ${currentUserId}
        LIMIT 20
      `;

      const users = [...doctors, ...patients].sort((a, b) => 
        a.user_name.localeCompare(b.user_name)
      );

      res.json({ users });

    } catch (error) {
      console.error('Error searching users:', error);
      res.status(500).json({ error: 'Failed to search users' });
    }
  },

  /**
   * Toggle chat settings (pin, mute, archive, block)
   */
  updateChatSettings: async (req, res) => {
    try {
      const { chatId } = req.params;
      const { userId, userType, isPinned, isMuted, isArchived, isBlocked } = req.body;

      if (!userId || !userType) {
        return res.status(400).json({ error: 'User info required' });
      }

      // Build update query dynamically
      const updates = [];
      if (isPinned !== undefined) updates.push(sql`is_pinned = ${isPinned}`);
      if (isMuted !== undefined) updates.push(sql`is_muted = ${isMuted}`);
      if (isBlocked !== undefined) updates.push(sql`is_blocked = ${isBlocked}`);

      if (updates.length > 0) {
        await sql`
          UPDATE chat_participants
          SET ${sql(updates, ', ')}
          WHERE chat_id = ${chatId}
            AND user_id = ${userId}
            AND user_type = ${userType}
        `;
      }

      if (isArchived !== undefined) {
        await sql`
          UPDATE chats
          SET is_archived = ${isArchived}
          WHERE id = ${chatId}
        `;
      }

      res.json({ success: true });

    } catch (error) {
      console.error('Error updating chat settings:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  },

  /**
   * Add reaction to a message
   */
  addReaction: async (req, res) => {
    try {
      const { messageId } = req.params;
      const { userId, userType, reaction } = req.body;

      await sql`
        INSERT INTO message_reactions (message_id, user_id, user_type, reaction)
        VALUES (${messageId}, ${userId}, ${userType}, ${reaction})
        ON CONFLICT (message_id, user_id, user_type)
        DO UPDATE SET reaction = ${reaction}, created_at = NOW()
      `;

      res.json({ success: true });

    } catch (error) {
      console.error('Error adding reaction:', error);
      res.status(500).json({ error: 'Failed to add reaction' });
    }
  },

  /**
   * Remove reaction from a message
   */
  removeReaction: async (req, res) => {
    try {
      const { messageId } = req.params;
      const { userId, userType } = req.body;

      await sql`
        DELETE FROM message_reactions
        WHERE message_id = ${messageId}
          AND user_id = ${userId}
          AND user_type = ${userType}
      `;

      res.json({ success: true });

    } catch (error) {
      console.error('Error removing reaction:', error);
      res.status(500).json({ error: 'Failed to remove reaction' });
    }
  },

  /**
   * Get chat settings for a user
   */
  getChatSettings: async (req, res) => {
    try {
      const { userId, userType } = req.query;

      if (!userId || !userType) {
        return res.status(400).json({ error: 'Missing userId or userType' });
      }

      const settings = await sql`
        SELECT 
          sound_enabled,
          desktop_notifications,
          message_preview,
          read_receipts,
          online_status,
          typing_indicator,
          last_seen,
          auto_download,
          auto_play,
          enter_to_send,
          font_size,
          theme,
          updated_at
        FROM chat_settings
        WHERE user_id = ${userId} AND user_type = ${userType}
      `;

      // If no settings exist, return defaults
      if (settings.length === 0) {
        return res.json({
          notifications: {
            sound: true,
            desktop: true,
            messagePreview: true
          },
          privacy: {
            readReceipts: true,
            onlineStatus: true,
            typingIndicator: true,
            lastSeen: true
          },
          media: {
            autoDownload: true,
            autoPlay: false
          },
          chat: {
            enterToSend: true,
            fontSize: 'medium',
            theme: 'light'
          }
        });
      }

      const setting = settings[0];
      res.json({
        notifications: {
          sound: setting.sound_enabled,
          desktop: setting.desktop_notifications,
          messagePreview: setting.message_preview
        },
        privacy: {
          readReceipts: setting.read_receipts,
          onlineStatus: setting.online_status,
          typingIndicator: setting.typing_indicator,
          lastSeen: setting.last_seen
        },
        media: {
          autoDownload: setting.auto_download,
          autoPlay: setting.auto_play
        },
        chat: {
          enterToSend: setting.enter_to_send,
          fontSize: setting.font_size,
          theme: setting.theme
        },
        updatedAt: setting.updated_at
      });

    } catch (error) {
      console.error('Error getting chat settings:', error);
      res.status(500).json({ error: 'Failed to get chat settings' });
    }
  },

  /**
   * Update chat settings for a user (global settings)
   */
  updateChatSettings: async (req, res) => {
    try {
      const { userId, userType, settings } = req.body;

      if (!userId || !userType || !settings) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Upsert settings
      await sql`
        INSERT INTO chat_settings (
          user_id,
          user_type,
          sound_enabled,
          desktop_notifications,
          message_preview,
          read_receipts,
          online_status,
          typing_indicator,
          last_seen,
          auto_download,
          auto_play,
          enter_to_send,
          font_size,
          theme,
          updated_at
        ) VALUES (
          ${userId},
          ${userType},
          ${settings.notifications.sound},
          ${settings.notifications.desktop},
          ${settings.notifications.messagePreview},
          ${settings.privacy.readReceipts},
          ${settings.privacy.onlineStatus},
          ${settings.privacy.typingIndicator},
          ${settings.privacy.lastSeen},
          ${settings.media.autoDownload},
          ${settings.media.autoPlay},
          ${settings.chat.enterToSend},
          ${settings.chat.fontSize},
          ${settings.chat.theme},
          NOW()
        )
        ON CONFLICT (user_id, user_type)
        DO UPDATE SET
          sound_enabled = ${settings.notifications.sound},
          desktop_notifications = ${settings.notifications.desktop},
          message_preview = ${settings.notifications.messagePreview},
          read_receipts = ${settings.privacy.readReceipts},
          online_status = ${settings.privacy.onlineStatus},
          typing_indicator = ${settings.privacy.typingIndicator},
          last_seen = ${settings.privacy.lastSeen},
          auto_download = ${settings.media.autoDownload},
          auto_play = ${settings.media.autoPlay},
          enter_to_send = ${settings.chat.enterToSend},
          font_size = ${settings.chat.fontSize},
          theme = ${settings.chat.theme},
          updated_at = NOW()
      `;

      res.json({ success: true, message: 'Settings updated successfully' });

    } catch (error) {
      console.error('Error updating chat settings:', error);
      res.status(500).json({ error: 'Failed to update chat settings' });
    }
  },

  /**
   * Update per-chat settings (mute, pin, block for specific conversation)
   */
  updatePerChatSettings: async (req, res) => {
    try {
      const { chatId } = req.params;
      const { userId, userType, isMuted, isPinned, isBlocked, customNickname } = req.body;

      if (!userId || !userType) {
        return res.status(400).json({ error: 'Missing userId or userType' });
      }

      // Build dynamic update query
      const updates = [];
      const values = [];
      
      if (typeof isMuted === 'boolean') {
        updates.push('is_muted = $' + (values.length + 1));
        values.push(isMuted);
      }
      if (typeof isPinned === 'boolean') {
        updates.push('is_pinned = $' + (values.length + 1));
        values.push(isPinned);
      }
      if (typeof isBlocked === 'boolean') {
        updates.push('is_blocked = $' + (values.length + 1));
        values.push(isBlocked);
      }
      if (customNickname !== undefined) {
        updates.push('custom_nickname = $' + (values.length + 1));
        values.push(customNickname);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No settings to update' });
      }

      // Add chatId, userId, userType to values
      values.push(chatId, userId, userType);

      await sql.unsafe(`
        UPDATE chat_participants
        SET ${updates.join(', ')}
        WHERE chat_id = $${values.length - 2}
          AND user_id = $${values.length - 1}
          AND user_type = $${values.length}
      `, values);

      res.json({ success: true, message: 'Per-chat settings updated successfully' });

    } catch (error) {
      console.error('Error updating per-chat settings:', error);
      res.status(500).json({ error: 'Failed to update per-chat settings' });
    }
  },

  /**
   * Get per-chat settings for current user
   */
  getPerChatSettings: async (req, res) => {
    try {
      const { chatId } = req.params;
      const { userId, userType } = req.query;

      if (!userId || !userType) {
        return res.status(400).json({ error: 'Missing userId or userType' });
      }

      const result = await sql`
        SELECT is_muted, is_pinned, is_blocked, is_archived, custom_nickname
        FROM chat_participants
        WHERE chat_id = ${chatId}
          AND user_id = ${userId}
          AND user_type = ${userType}
      `;

      if (result.length === 0) {
        return res.status(404).json({ error: 'Chat participant not found' });
      }

      res.json({
        isMuted: result[0].is_muted,
        isPinned: result[0].is_pinned,
        isBlocked: result[0].is_blocked,
        isArchived: result[0].is_archived || false,
        customNickname: result[0].custom_nickname
      });

    } catch (error) {
      console.error('Error getting per-chat settings:', error);
      res.status(500).json({ error: 'Failed to get per-chat settings' });
    }
  },

  /**
   * Archive/Unarchive a chat
   */
  archiveChat: async (req, res) => {
    try {
      const { chatId } = req.params;
      const { userId, userType, isArchived } = req.body;

      if (!userId || !userType || typeof isArchived !== 'boolean') {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Update is_archived in chat_participants table for this user
      await sql`
        UPDATE chat_participants
        SET is_archived = ${isArchived}
        WHERE chat_id = ${chatId}
          AND user_id = ${userId}
          AND user_type = ${userType}
      `;

      res.json({ 
        success: true, 
        message: isArchived ? 'Chat archived successfully' : 'Chat unarchived successfully'
      });

    } catch (error) {
      console.error('Error archiving chat:', error);
      res.status(500).json({ error: 'Failed to archive chat' });
    }
  },

  /**
   * Clear all messages in a chat
   */
  clearChat: async (req, res) => {
    try {
      const { chatId } = req.params;
      const { userId, userType } = req.body;

      if (!userId || !userType) {
        return res.status(400).json({ error: 'Missing userId or userType' });
      }

      // Delete all messages in this chat
      await sql`
        DELETE FROM messages
        WHERE chat_id = ${chatId}
      `;

      // Also delete all reactions and forwards related to those messages
      await sql`
        DELETE FROM message_reactions
        WHERE message_id IN (
          SELECT id FROM messages WHERE chat_id = ${chatId}
        )
      `;

      res.json({ 
        success: true, 
        message: 'Chat cleared successfully'
      });

    } catch (error) {
      console.error('Error clearing chat:', error);
      res.status(500).json({ error: 'Failed to clear chat' });
    }
  },

  /**
   * Delete a specific message
   */
  deleteMessage: async (req, res) => {
    try {
      const { messageId } = req.params;
      const { userId, userType } = req.body;

      if (!userId || !userType) {
        return res.status(400).json({ error: 'Missing userId or userType' });
      }

      // Check if user owns the message
      const message = await sql`
        SELECT sender_id, sender_type
        FROM messages
        WHERE id = ${messageId}
      `;

      if (message.length === 0) {
        return res.status(404).json({ error: 'Message not found' });
      }

      if (message[0].sender_id !== userId || message[0].sender_type !== userType) {
        return res.status(403).json({ error: 'You can only delete your own messages' });
      }

      // Delete the message
      await sql`
        DELETE FROM messages
        WHERE id = ${messageId}
      `;

      // Delete associated reactions
      await sql`
        DELETE FROM message_reactions
        WHERE message_id = ${messageId}
      `;

      res.json({ 
        success: true, 
        message: 'Message deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting message:', error);
      res.status(500).json({ error: 'Failed to delete message' });
    }
  }
};
