import { sql } from '../config/db.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const chatController = {
  // Get all conversations for a user
  getConversations: async (req, res) => {
    try {
      const { userId, userType } = req.query;
      
      if (!userId || !userType) {
        return res.status(400).json({ error: 'userId and userType are required' });
      }

      const conversations = await sql`
        SELECT 
          c.id,
          c.name,
          c.type,
          c.created_at,
          c.updated_at,
          cp.is_pinned,
          cp.is_muted,
          cp.last_seen,
          lm.content as last_message,
          lm.message_type as last_message_type,
          lm.created_at as last_message_time,
          lm.sender_name as last_sender_name,
          (SELECT COUNT(*) FROM messages m 
           LEFT JOIN message_status ms ON m.id = ms.message_id 
           WHERE m.conversation_id = c.id 
           AND m.sender_id != ${userId}
           AND (ms.status IS NULL OR ms.status != 'read' OR ms.user_id != ${userId})
          ) as unread_count,
          -- Get other participant info for direct chats
          CASE WHEN c.type = 'direct' THEN
            (SELECT json_build_object(
              'id', cp2.user_id,
              'name', cp2.user_name,
              'email', cp2.user_email,
              'type', cp2.user_type,
              'last_seen', cp2.last_seen,
              'is_online', CASE WHEN cp2.last_seen > NOW() - INTERVAL '5 minutes' THEN true ELSE false END
            ) FROM conversation_participants cp2 
             WHERE cp2.conversation_id = c.id 
             AND cp2.user_id != ${userId}
             LIMIT 1)
          ELSE NULL
          END as other_participant
        FROM conversations c
        JOIN conversation_participants cp ON c.id = cp.conversation_id
        LEFT JOIN messages lm ON c.last_message_id = lm.id
        WHERE cp.user_id = ${userId} AND cp.user_type = ${userType}
        ORDER BY c.updated_at DESC
      `;

      res.json({ conversations });
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({ error: 'Failed to fetch conversations' });
    }
  },

  // Get messages for a conversation
  getMessages: async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { userId, userType, page = 1, limit = 50 } = req.query;
      
      if (!userId || !userType) {
        return res.status(400).json({ error: 'userId and userType are required' });
      }

      const offset = (page - 1) * limit;

      // Verify user is participant in conversation
      const participant = await sql`
        SELECT id FROM conversation_participants 
        WHERE conversation_id = ${conversationId} 
        AND user_id = ${userId} 
        AND user_type = ${userType}
      `;

      if (participant.length === 0) {
        console.error(`🚫 PRIVACY VIOLATION ATTEMPT: User ${userId} (${userType}) tried to access messages in conversation ${conversationId} but is not a participant`);
        return res.status(403).json({ 
          error: 'Not authorized to access this conversation',
          details: 'You are not a participant in this conversation' 
        });
      }

      console.log(`✅ Message access authorized: User ${userId} (${userType}) -> Conversation ${conversationId}`);

      const messages = await sql`
        SELECT 
          m.*,
          ms.status as delivery_status,
          reply_msg.content as reply_content,
          reply_msg.sender_name as reply_sender_name
        FROM messages m
        LEFT JOIN message_status ms ON m.id = ms.message_id 
          AND ms.user_id = ${userId} AND ms.user_type = ${userType}
        LEFT JOIN messages reply_msg ON m.reply_to = reply_msg.id
        WHERE m.conversation_id = ${conversationId} 
        AND m.is_deleted = false
        ORDER BY m.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      // Mark messages as read
      await sql`
        INSERT INTO message_status (message_id, user_id, user_type, status)
        SELECT m.id, ${userId}, ${userType}, 'read'
        FROM messages m
        WHERE m.conversation_id = ${conversationId}
        AND m.sender_id != ${userId}
        AND NOT EXISTS (
          SELECT 1 FROM message_status ms 
          WHERE ms.message_id = m.id 
          AND ms.user_id = ${userId} 
          AND ms.user_type = ${userType}
        )
        ON CONFLICT (message_id, user_id, user_type) 
        DO UPDATE SET status = 'read', timestamp = CURRENT_TIMESTAMP
      `;

      // Update last seen timestamp
      await sql`
        UPDATE conversation_participants 
        SET last_seen = CURRENT_TIMESTAMP
        WHERE conversation_id = ${conversationId} 
        AND user_id = ${userId} 
        AND user_type = ${userType}
      `;

      res.json({ messages: messages.reverse() });
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  },

  // Send a message
  sendMessage: async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { 
        content, 
        messageType = 'text', 
        replyTo, 
        senderId, 
        senderName, 
        senderType,
        fileName,
        fileUrl,
        fileSize
      } = req.body;

      if (!content || !senderId || !senderType) {
        return res.status(400).json({ error: 'content, senderId, and senderType are required' });
      }

      // Verify sender is participant in conversation
      const participant = await sql`
        SELECT id FROM conversation_participants 
        WHERE conversation_id = ${conversationId} 
        AND user_id = ${senderId} 
        AND user_type = ${senderType}
      `;

      if (participant.length === 0) {
        console.error(`🚫 PRIVACY VIOLATION ATTEMPT: ${senderName} (${senderId}) tried to send message to conversation ${conversationId} but is not a participant`);
        return res.status(403).json({ 
          error: 'Not authorized to send messages to this conversation',
          details: 'You are not a participant in this conversation'
        });
      }

      console.log(`✅ Message authorization verified: ${senderName} (${senderId}) -> Conversation ${conversationId}`);

      // Insert message
      const newMessage = await sql`
        INSERT INTO messages (
          conversation_id, 
          sender_id, 
          sender_name, 
          sender_type, 
          content, 
          message_type,
          reply_to,
          file_name,
          file_url,
          file_size
        )
        VALUES (
          ${conversationId}, 
          ${senderId}, 
          ${senderName || 'Unknown'}, 
          ${senderType}, 
          ${content}, 
          ${messageType},
          ${replyTo || null},
          ${fileName || null},
          ${fileUrl || null},
          ${fileSize || null}
        )
        RETURNING *
      `;

      const message = newMessage[0];

      // Get all participants for status tracking
      const participants = await sql`
        SELECT user_id, user_type FROM conversation_participants 
        WHERE conversation_id = ${conversationId}
      `;

      // Insert message status for all participants
      for (const participant of participants) {
        const status = participant.user_id === senderId && participant.user_type === senderType ? 'read' : 'delivered';
        await sql`
          INSERT INTO message_status (message_id, user_id, user_type, status)
          VALUES (${message.id}, ${participant.user_id}, ${participant.user_type}, ${status})
        `;
      }

      // Get reply info if this is a reply
      let replyInfo = null;
      if (replyTo) {
        const replyMessage = await sql`
          SELECT content, sender_name FROM messages WHERE id = ${replyTo}
        `;
        if (replyMessage.length > 0) {
          replyInfo = {
            content: replyMessage[0].content,
            senderName: replyMessage[0].sender_name
          };
        }
      }

      const response = {
        ...message,
        delivery_status: 'read',
        reply_content: replyInfo?.content,
        reply_sender_name: replyInfo?.senderName
      };

      res.status(201).json({ message: response });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  },

  // Create a new conversation
  createConversation: async (req, res) => {
    try {
      const { 
        name, 
        type = 'direct', 
        createdBy, 
        createdByType = 'doctor',
        participants = [] 
      } = req.body;

      if (!createdBy || participants.length === 0) {
        return res.status(400).json({ error: 'createdBy and participants are required' });
      }

      // Create conversation
      const newConversation = await sql`
        INSERT INTO conversations (name, type, created_by)
        VALUES (${name || 'New Conversation'}, ${type}, ${createdBy})
        RETURNING *
      `;

      const conversation = newConversation[0];

      // Add creator as participant
      await sql`
        INSERT INTO conversation_participants (
          conversation_id, 
          user_id, 
          user_type, 
          user_name, 
          user_email
        )
        VALUES (
          ${conversation.id}, 
          ${createdBy}, 
          ${createdByType}, 
          ${req.body.createdByName || 'Unknown'}, 
          ${req.body.createdByEmail || ''}
        )
      `;

      // Add other participants
      for (const participant of participants) {
        await sql`
          INSERT INTO conversation_participants (
            conversation_id, 
            user_id, 
            user_type, 
            user_name, 
            user_email
          )
          VALUES (
            ${conversation.id}, 
            ${participant.userId}, 
            ${participant.userType}, 
            ${participant.userName || 'Unknown'}, 
            ${participant.userEmail || ''}
          )
          ON CONFLICT (conversation_id, user_id, user_type) DO NOTHING
        `;
      }

      res.status(201).json({ conversation });
    } catch (error) {
      console.error('Error creating conversation:', error);
      res.status(500).json({ error: 'Failed to create conversation' });
    }
  },

  // Search conversations and messages
  searchChat: async (req, res) => {
    try {
      const { query, userId, userType, type = 'all' } = req.query;
      
      if (!query || !userId || !userType) {
        return res.status(400).json({ error: 'query, userId, and userType are required' });
      }

      const searchResults = {};

      // Search conversations
      if (type === 'all' || type === 'conversations') {
        searchResults.conversations = await sql`
          SELECT DISTINCT
            c.id,
            c.name,
            c.type,
            c.updated_at,
            COALESCE(cp_other.user_name, c.name) as display_name
          FROM conversations c
          JOIN conversation_participants cp ON c.id = cp.conversation_id
          LEFT JOIN conversation_participants cp_other ON c.id = cp_other.conversation_id 
            AND cp_other.user_id != ${userId}
          WHERE cp.user_id = ${userId} 
          AND cp.user_type = ${userType}
          AND (
            c.name ILIKE ${'%' + query + '%'} 
            OR cp_other.user_name ILIKE ${'%' + query + '%'}
          )
          ORDER BY c.updated_at DESC
          LIMIT 10
        `;
      }

      // Search messages
      if (type === 'all' || type === 'messages') {
        searchResults.messages = await sql`
          SELECT 
            m.*,
            c.name as conversation_name,
            COALESCE(cp_other.user_name, c.name) as conversation_display_name
          FROM messages m
          JOIN conversations c ON m.conversation_id = c.id
          JOIN conversation_participants cp ON c.id = cp.conversation_id
          LEFT JOIN conversation_participants cp_other ON c.id = cp_other.conversation_id 
            AND cp_other.user_id != ${userId}
          WHERE cp.user_id = ${userId} 
          AND cp.user_type = ${userType}
          AND m.content ILIKE ${'%' + query + '%'}
          AND m.is_deleted = false
          ORDER BY m.created_at DESC
          LIMIT 20
        `;
      }

      res.json(searchResults);
    } catch (error) {
      console.error('Error searching chat:', error);
      res.status(500).json({ error: 'Failed to search chat' });
    }
  },

  // Update typing indicator
  updateTypingStatus: async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { userId, userType, userName, isTyping } = req.body;

      if (!userId || !userType) {
        return res.status(400).json({ error: 'userId and userType are required' });
      }

      await sql`
        INSERT INTO typing_indicators (
          conversation_id, 
          user_id, 
          user_type, 
          user_name, 
          is_typing,
          updated_at
        )
        VALUES (
          ${conversationId}, 
          ${userId}, 
          ${userType}, 
          ${userName || 'Unknown'}, 
          ${isTyping},
          CURRENT_TIMESTAMP
        )
        ON CONFLICT (conversation_id, user_id, user_type) 
        DO UPDATE SET 
          is_typing = ${isTyping},
          updated_at = CURRENT_TIMESTAMP
      `;

      // Clean up old typing indicators (older than 10 seconds)
      await sql`
        DELETE FROM typing_indicators 
        WHERE updated_at < NOW() - INTERVAL '10 seconds'
      `;

      res.json({ success: true });
    } catch (error) {
      console.error('Error updating typing status:', error);
      res.status(500).json({ error: 'Failed to update typing status' });
    }
  },

  // Get typing indicators for a conversation
  getTypingIndicators: async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { excludeUserId, excludeUserType } = req.query;

      let typingUsers = await sql`
        SELECT user_id, user_name, user_type, is_typing, updated_at
        FROM typing_indicators 
        WHERE conversation_id = ${conversationId}
        AND is_typing = true
        AND updated_at > NOW() - INTERVAL '10 seconds'
      `;

      // Exclude current user if specified
      if (excludeUserId && excludeUserType) {
        typingUsers = typingUsers.filter(
          user => !(user.user_id === excludeUserId && user.user_type === excludeUserType)
        );
      }

      res.json({ typingUsers });
    } catch (error) {
      console.error('Error fetching typing indicators:', error);
      res.status(500).json({ error: 'Failed to fetch typing indicators' });
    }
  },

  // Update message status (read, delivered)
  updateMessageStatus: async (req, res) => {
    try {
      const { messageId } = req.params;
      const { userId, userType, status } = req.body;

      if (!userId || !userType || !status) {
        return res.status(400).json({ error: 'userId, userType, and status are required' });
      }

      await sql`
        INSERT INTO message_status (message_id, user_id, user_type, status, timestamp)
        VALUES (${messageId}, ${userId}, ${userType}, ${status}, CURRENT_TIMESTAMP)
        ON CONFLICT (message_id, user_id, user_type)
        DO UPDATE SET 
          status = ${status}, 
          timestamp = CURRENT_TIMESTAMP
      `;

      res.json({ success: true });
    } catch (error) {
      console.error('Error updating message status:', error);
      res.status(500).json({ error: 'Failed to update message status' });
    }
  },

  // Toggle conversation pin status
  togglePin: async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { userId, userType } = req.body;

      if (!userId || !userType) {
        return res.status(400).json({ error: 'userId and userType are required' });
      }

      const result = await sql`
        UPDATE conversation_participants 
        SET is_pinned = NOT is_pinned
        WHERE conversation_id = ${conversationId} 
        AND user_id = ${userId} 
        AND user_type = ${userType}
        RETURNING is_pinned
      `;

      if (result.length === 0) {
        return res.status(404).json({ error: 'Participant not found' });
      }

      res.json({ isPinned: result[0].is_pinned });
    } catch (error) {
      console.error('Error toggling pin status:', error);
      res.status(500).json({ error: 'Failed to toggle pin status' });
    }
  },

  // Delete message (soft delete)
  deleteMessage: async (req, res) => {
    try {
      const { messageId } = req.params;
      const { userId, userType } = req.body;

      if (!userId || !userType) {
        return res.status(400).json({ error: 'userId and userType are required' });
      }

      // Verify user owns the message
      const message = await sql`
        SELECT id FROM messages 
        WHERE id = ${messageId} 
        AND sender_id = ${userId} 
        AND sender_type = ${userType}
      `;

      if (message.length === 0) {
        return res.status(403).json({ error: 'Not authorized to delete this message' });
      }

      await sql`
        UPDATE messages 
        SET is_deleted = true, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${messageId}
      `;

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting message:', error);
      res.status(500).json({ error: 'Failed to delete message' });
    }
  },

  // Search all users (doctors and patients) for starting new conversations
  searchUsers: async (req, res) => {
    try {
      const { query = '', currentUserId, currentUserType } = req.query;
      
      if (!currentUserId || !currentUserType) {
        return res.status(400).json({ error: 'currentUserId and currentUserType are required' });
      }

      // Search doctors
      const doctors = await sql`
        SELECT 
          unique_id as id,
          CONCAT(first_name, ' ', last_name) as name,
          email,
          'doctor' as type,
          specialization,
          CASE WHEN unique_id = ${currentUserId} THEN true ELSE false END as is_current_user
        FROM doctors 
        WHERE unique_id IS NOT NULL 
        AND (
          LOWER(CONCAT(first_name, ' ', last_name)) LIKE LOWER(${'%' + query + '%'}) OR
          LOWER(email) LIKE LOWER(${'%' + query + '%'}) OR
          LOWER(specialization) LIKE LOWER(${'%' + query + '%'})
        )
        AND unique_id != ${currentUserId}
        ORDER BY first_name, last_name
        LIMIT 20
      `;

      // Search patients  
      const patients = await sql`
        SELECT 
          unique_id as id,
          CONCAT(first_name, ' ', last_name) as name,
          email,
          'patient' as type,
          date_of_birth,
          CASE WHEN unique_id = ${currentUserId} THEN true ELSE false END as is_current_user
        FROM patients 
        WHERE unique_id IS NOT NULL 
        AND (
          LOWER(CONCAT(first_name, ' ', last_name)) LIKE LOWER(${'%' + query + '%'}) OR
          LOWER(email) LIKE LOWER(${'%' + query + '%'})
        )
        AND unique_id != ${currentUserId}
        ORDER BY first_name, last_name
        LIMIT 20
      `;

      // Combine and sort results
      const allUsers = [...doctors, ...patients].sort((a, b) => a.name.localeCompare(b.name));

      res.json({ users: allUsers });
    } catch (error) {
      console.error('Error searching users:', error);
      res.status(500).json({ error: 'Failed to search users' });
    }
  },

  // Create or get existing conversation with a user
  startConversation: async (req, res) => {
    try {
      const { otherUserId, otherUserType, currentUserId, currentUserType, currentUserName, otherUserName } = req.body;
      
      if (!otherUserId || !otherUserType || !currentUserId || !currentUserType) {
        return res.status(400).json({ error: 'All user details are required' });
      }

      // Check if conversation already exists
      const existingConv = await sql`
        SELECT c.id, c.name
        FROM conversations c
        JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
        JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
        WHERE c.type = 'direct'
        AND cp1.user_id = ${currentUserId} AND cp1.user_type = ${currentUserType}
        AND cp2.user_id = ${otherUserId} AND cp2.user_type = ${otherUserType}
        LIMIT 1
      `;

      if (existingConv.length > 0) {
        return res.json({ 
          conversation: existingConv[0],
          isNew: false
        });
      }

      // Create new conversation
      const conversationName = `${currentUserName} - ${otherUserName}`;
      
      const [newConversation] = await sql`
        INSERT INTO conversations (name, type, created_by)
        VALUES (${conversationName}, 'direct', ${currentUserId})
        RETURNING *
      `;

      // Add both participants
      await sql`
        INSERT INTO conversation_participants (
          conversation_id, user_id, user_type, user_name, user_email, joined_at
        ) VALUES 
        (${newConversation.id}, ${currentUserId}, ${currentUserType}, ${currentUserName}, '', NOW()),
        (${newConversation.id}, ${otherUserId}, ${otherUserType}, ${otherUserName}, '', NOW())
      `;

      res.json({ 
        conversation: newConversation,
        isNew: true
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      res.status(500).json({ error: 'Failed to start conversation' });
    }
  }
};