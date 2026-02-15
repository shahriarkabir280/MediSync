import { supabase } from '../config/db.js';
import { getIO } from '../lib/websocketServer.js';

/**
 * Modern Chat Controller
 * WhatsApp/Telegram style messaging system
 * Refactored to use Supabase SDK
 */

export const chatController = {
  /**
   * Get or create a private chat between two users
   */
  getOrCreateChat: async (req, res) => {
    try {
      const { myUserId, myUserType, myUserName, myUserEmail, myUserAvatar,
        otherUserId, otherUserType, otherUserName, otherUserEmail, otherUserAvatar } = req.body;

      if (!myUserId || !myUserType || !otherUserId || !otherUserType) {
        return res.status(400).json({ error: 'Missing required user information' });
      }

      // Check for existing private chat
      // Strategy: Find chats where I am a participant, and check if the other user is also a participant in that chat.
      const { data: myChats } = await supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', myUserId)
        .eq('user_type', myUserType);

      const myChatIds = myChats ? myChats.map(c => c.chat_id) : [];

      let existingChatId = null;

      if (myChatIds.length > 0) {
        const { data: common } = await supabase
          .from('chat_participants')
          .select('chat_id')
          .eq('user_id', otherUserId)
          .eq('user_type', otherUserType)
          .in('chat_id', myChatIds)
          .limit(1); // Private chat should be unique pair? Or just find one.

        if (common && common.length > 0) {
          existingChatId = common[0].chat_id;

          // Verify it's a private chat (optional equality check if group chats exist separately)
          // Assuming 'private' type enforcement
        }
      }

      if (existingChatId) {
        // Fetch full chat details
        const { data: chatData, error: chatError } = await supabase
          .from('chats')
          .select(`
                *,
                chat_participants (*)
            `)
          .eq('id', existingChatId)
          .single();

        if (chatError) throw chatError;

        // Unread count
        const { count: unreadCount } = await supabase
          .from('message_status')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', myUserId)
          .eq('user_type', myUserType)
          .neq('status', 'read')
          .in('message_id', (
            await supabase.from('messages').select('id').eq('chat_id', existingChatId).neq('sender_id', myUserId)
          ).data?.map(m => m.id) || []);
        // The unread logic is: messages in this chat, sent by NOT me, where my status is not read.
        // Optimized query: Join messages and message_status? Supabase join filtering is tricky.
        // Better: select count from message_status where user=me and status!=read and message_id in (select id from messages where chat_id=...)

        // Simplified Unread Count (Approximate or 2-step)
        // Let's do a direct count on message_status joined with messages filtering
        const { count: realUnread } = await supabase
          .from('message_status')
          .select('id, messages!inner(chat_id, sender_id)', { count: 'exact', head: true })
          .eq('user_id', myUserId)
          .eq('user_type', myUserType)
          .neq('status', 'read')
          .eq('messages.chat_id', existingChatId)
          .neq('messages.sender_id', myUserId);


        // Helper to format other user
        const allParts = chatData.chat_participants;
        const otherUser = allParts.find(p => !(p.user_id == myUserId && p.user_type == myUserType)) || allParts[0];

        return res.json({
          chat: {
            ...chatData,
            other_user: otherUser ? {
              user_id: otherUser.user_id,
              user_type: otherUser.user_type,
              user_name: otherUser.user_name,
              user_email: otherUser.user_email,
              user_avatar: otherUser.user_avatar
            } : null,
            unread_count: realUnread || 0
          },
          isNew: false
        });
      }

      // Create new chat
      const { data: newChat, error: createError } = await supabase
        .from('chats')
        .insert({ type: 'private', created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .select()
        .single();

      if (createError) throw createError;

      // Add participants
      const participants = [
        { chat_id: newChat.id, user_id: myUserId, user_type: myUserType, user_name: myUserName, user_email: myUserEmail, user_avatar: myUserAvatar },
        { chat_id: newChat.id, user_id: otherUserId, user_type: otherUserType, user_name: otherUserName, user_email: otherUserEmail, user_avatar: otherUserAvatar }
      ];

      const { data: addedParticipants, error: partError } = await supabase
        .from('chat_participants')
        .insert(participants)
        .select();

      if (partError) throw partError;

      console.log(`✅ Created new chat ${newChat.id} between ${myUserId} and ${otherUserId}`);

      res.json({
        chat: {
          ...newChat,
          other_user: participants.find(p => !(p.user_id == myUserId && p.user_type == myUserType)),
          unread_count: 0
        },
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

      // Get all chats where user is participant
      const { data: myChats, error: myChatsError } = await supabase
        .from('chat_participants')
        .select(`
            chat_id,
            is_muted, is_pinned, is_blocked, last_read_at,
            chats (
                id, type, created_at, updated_at, last_message_at, is_archived
            )
          `)
        .eq('user_id', userId)
        .eq('user_type', userType);

      if (myChatsError) throw myChatsError;

      // Filter and Format
      const filteredChats = myChats.filter(Item => Item.chats && !Item.chats.is_archived); // Client side archive filter or SQL?
      // "AND c.is_archived = FALSE" was in SQL. Supabase query above fetches joined chat.
      const activeChats = filteredChats.filter(c => !c.chats.is_archived);

      // We need to fetch:
      // 1. Other participant
      // 2. Last message
      // 3. Unread count
      // Doing this in loop is N+1, but Supabase might be fast enough for typical inbox list (20-50 chats).
      // Optimization: Fetch all needed data in parallel batches or single big queries?
      // Complex single query via Supabase is hard.
      // Let's iterate for now.

      const enrichedChats = await Promise.all(activeChats.map(async (item) => {
        const chatId = item.chat_id;
        const chatDetails = item.chats;

        // 1. Other Participant
        // Fetch one participant that is NOT me
        const { data: otherPart } = await supabase
          .from('chat_participants')
          .select('user_id, user_type, user_name, user_email, user_avatar')
          .eq('chat_id', chatId)
          .neq('user_id', userId)
          // Note: using != userId might be issue if same userId but different type? 
          // SQL used: NOT (cp2.user_id = userId AND cp2.user_type = userType)
          // Supabase doesn't easily support composite NOT EQ.
          // Logic check in JS after fetch?
          // Or just fetch all participants and find the other one.
          .limit(1); // Random other if group? Logic implies Private mostly.

        // Better: fetch all participants for chat
        const { data: allParts } = await supabase.from('chat_participants').select('*').eq('chat_id', chatId);
        const otherUser = allParts.find(p => !(p.user_id == userId && p.user_type == userType)) || allParts[0]; // Fallback

        // 2. Last Message
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('id, content, message_type, sender_id, sender_name, created_at, is_deleted')
          .eq('chat_id', chatId)
          .eq('is_deleted', false) // Check deleted logic
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // 3. Unread Count
        const { count: unread } = await supabase
          .from('message_status')
          .select('id, messages!inner(chat_id, sender_id)', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('user_type', userType)
          .neq('status', 'read')
          .eq('messages.chat_id', chatId)
          .neq('messages.sender_id', userId);

        return {
          id: chatDetails.id,
          type: chatDetails.type,
          created_at: chatDetails.created_at,
          updated_at: chatDetails.updated_at,
          last_message_at: chatDetails.last_message_at,
          is_archived: chatDetails.is_archived,
          is_muted: item.is_muted,
          is_pinned: item.is_pinned,
          is_blocked: item.is_blocked,
          last_read_at: item.last_read_at,
          other_user: otherUser ? {
            user_id: otherUser.user_id,
            user_type: otherUser.user_type,
            user_name: otherUser.user_name,
            user_email: otherUser.user_email,
            user_avatar: otherUser.user_avatar
          } : null,
          last_message: lastMsg,
          unread_count: unread || 0
        };
      }));

      // Sort: Pinned first? Original SQL: ORDER BY c.last_message_at DESC
      enrichedChats.sort((a, b) => {
        const timeA = new Date(a.last_message_at || a.created_at).getTime();
        const timeB = new Date(b.last_message_at || b.created_at).getTime();
        return timeB - timeA;
      });

      res.json({ chats: enrichedChats });

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

      // Verify participant
      const { data: part, error: partCheck } = await supabase
        .from('chat_participants')
        .select('id')
        .eq('chat_id', chatId)
        .eq('user_id', userId)
        .eq('user_type', userType)
        .maybeSingle();

      if (!part) return res.status(403).json({ error: 'You are not a participant in this chat' });

      // Fetch messages
      let query = supabase
        .from('messages')
        .select(`
            *,
            reply_to:messages!reply_to_id(id, content, sender_name),
            message_status(user_id, status, delivered_at, read_at),
            message_reactions(user_id, user_type, reaction)
          `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: false })
        .limit(parseInt(limit));

      if (before) {
        query = query.lt('id', before); // Assuming ID is sortable (UUID not necessarily, usually CreatedAt for pagination)
        // Original SQL used `m.id < before`. If IDs are serial Ints, fine. If UUIDs, not fine.
        // Assuming serial or timestamp based pagination would be safer but let's stick to ID if that's what frontend sends.
      }

      // SQL had: AND (m.is_deleted = FALSE OR m.sender_id = userId)
      // Supabase supports OR? .or(`is_deleted.eq.false,sender_id.eq.${userId}`)
      query = query.or(`is_deleted.eq.false,sender_id.eq.${userId},delete_for_everyone.eq.true`);

      const { data: messages, error: msgError } = await query;
      if (msgError) throw msgError;

      // Process messages to shape them like SQL result
      // Filter out messages deleted by me
      const formattedMessages = messages
        .filter(m => !m.deleted_by || !m.deleted_by.includes(userId))
        .map(m => {
          const myStatus = m.message_status?.find(s => s.user_id == userId); // Assuming userId matching type too implicitly or unique userId
          return {
            ...m,
            reply_to: m.reply_to, // Supabase returns single object usually for foreign key
            my_status: myStatus,
            reactions: m.message_reactions
          };
        });

      // Mark as delivered
      // Update message_status where chat_id matches and user is me and status is sent
      // We need message IDs from the chat.
      // Easiest: Update directly on message_status using join?
      // Update message_status set status='delivered' where user_id=me AND message_id IN (select id from messages where chat_id=...)
      // Supabase update with subquery is hard.
      // Do it in 2 steps: fetch pending message IDs, then update.
      const { data: pendingDeliveries } = await supabase
        .from('message_status')
        .select('id, messages!inner(chat_id)')
        .eq('user_id', userId)
        .eq('status', 'sent')
        .eq('messages.chat_id', chatId);

      if (pendingDeliveries && pendingDeliveries.length > 0) {
        await supabase
          .from('message_status')
          .update({ status: 'delivered', delivered_at: new Date().toISOString() })
          .in('id', pendingDeliveries.map(p => p.id));
      }

      res.json({ messages: formattedMessages.reverse() });

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

      // Validate
      if (!senderId || !content && !mediaUrl && !encryptedContent) {
        return res.status(400).json({ error: 'Invalid message data' });
      }

      // Verify participant
      const { data: part } = await supabase.from('chat_participants').select('id').eq('chat_id', chatId).eq('user_id', senderId).maybeSingle();
      if (!part) return res.status(403).json({ error: 'NotInChat' });

      // Insert Message
      const { data: message, error: msgError } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: senderId,
          sender_type: senderType,
          sender_name: senderName,
          content,
          encrypted_content: encryptedContent,
          message_type: messageType,
          media_url: mediaUrl,
          media_name: mediaName,
          media_size: mediaSize,
          media_type: mediaType,
          thumbnail_url: thumbnailUrl,
          reply_to_id: replyToId,
          is_forwarded: false, // Default
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (msgError) throw msgError;

      // Get participants
      const { data: participants } = await supabase.from('chat_participants').select('user_id, user_type').eq('chat_id', chatId);

      // Create statuses
      const statuses = participants.map(p => ({
        message_id: message.id,
        user_id: p.user_id,
        user_type: p.user_type,
        status: (p.user_id == senderId && p.user_type == senderType) ? 'read' : 'sent',
        read_at: (p.user_id == senderId && p.user_type == senderType) ? new Date().toISOString() : null
      }));

      await supabase.from('message_status').insert(statuses);

      // Update chat last message time
      await supabase.from('chats').update({ last_message_at: new Date().toISOString() }).eq('id', chatId);

      // Reply Info
      let replyInfo = null;
      if (replyToId) {
        const { data: reply } = await supabase.from('messages').select('id, content, sender_name').eq('id', replyToId).single();
        replyInfo = reply;
      }

      console.log(`✅ Message sent in chat ${chatId}`);

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

      if (!userId) return res.status(400).json({ error: 'UserId required' });

      // Update message status
      let query = supabase
        .from('message_status')
        .update({ status: 'read', read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('user_type', userType)
        .neq('status', 'read'); // Only update unread ones

      if (messageIds && messageIds.length > 0) {
        query = query.in('message_id', messageIds);
      } else {
        // All messages in chat
        // We need to filter by message_id IN (select id from messages where chat_id=...)
        // This requires 2 steps or complex query.
        // Step 1: get unread message IDs for this chat
        const { data: unreadMsgs } = await supabase
          .from('message_status')
          .select('id, messages!inner(chat_id)')
          .eq('user_id', userId)
          .eq('messages.chat_id', chatId)
          .neq('status', 'read');

        if (unreadMsgs && unreadMsgs.length > 0) {
          const ids = unreadMsgs.map(u => u.id); // message_status IDs
          await supabase.from('message_status').update({ status: 'read', read_at: new Date().toISOString() }).in('id', ids);
        }
      }

      // Update participant last read
      await supabase
        .from('chat_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('chat_id', chatId)
        .eq('user_id', userId);

      res.json({ success: true });
    } catch (error) {
      console.error('Error marking read:', error);
      res.status(500).json({ error: 'Failed' });
    }
  },

  /**
   * Delete a message (Unsend)
   */
  deleteMessage: async (req, res) => {
    try {
      const { messageId } = req.params;
      const { userId, userType, deleteForEveryone = false } = req.body;

      const { data: message } = await supabase.from('messages').select('*').eq('id', messageId).eq('sender_id', userId).single();

      if (!message) return res.status(403).json({ error: 'Not allowed' });

      if (deleteForEveryone) {
        const updateData = {};
        const timeLimit = 24 * 60 * 60 * 1000;
        if (new Date() - new Date(message.created_at) > timeLimit) {
          return res.status(400).json({ error: 'Too late to unsend' });
        }
        updateData.delete_for_everyone = true;
        updateData.is_deleted = true;
        updateData.deleted_at = new Date().toISOString();

        // Emit socket event
        try {
          const io = getIO();
          io.to(`chat_${message.chat_id}`).emit('message_deleted', {
            messageId,
            chatId: message.chat_id,
            deleteForEveryone: true
          });
        } catch (err) {
          console.error('Socket emit error:', err);
        }

        await supabase.from('messages').update(updateData).eq('id', messageId);

      } else {
        // "Delete for Me" -> Update deleted_by array
        const currentDeletedBy = message.deleted_by || [];
        if (!currentDeletedBy.includes(userId)) {
          const newDeletedBy = [...currentDeletedBy, userId];
          await supabase.from('messages').update({ deleted_by: newDeletedBy }).eq('id', messageId);
        }
      }

      res.json({ success: true, deleteForEveryone });
    } catch (error) {
      console.error('Error deleting:', error);
      res.status(500).json({ error: 'Failed' });
    }
  },

  /**
   * Forward a message
   */
  forwardMessage: async (req, res) => {
    // Implementation simplifies: Fetch original, insert new copies loop
    try {
      const { messageId, toChatIds, userId, userType } = req.body;

      const { data: original } = await supabase.from('messages').select('*').eq('id', messageId).single();
      if (!original) return res.status(404).json({ error: 'Message not found' });

      // Sender Name lookup
      let senderName = 'User';
      if (userType === 'doctor') {
        const { data: d } = await supabase.from('doctors').select('first_name, last_name').eq('unique_id', userId).single();
        if (d) senderName = `${d.first_name} ${d.last_name}`;
      } else {
        const { data: p } = await supabase.from('patients').select('first_name, last_name').eq('unique_id', userId).single();
        if (p) senderName = `${p.first_name} ${p.last_name}`;
      }

      const forwarded = [];
      for (const chatId of toChatIds) {
        // Check access
        const { data: access } = await supabase.from('chat_participants').select('id').eq('chat_id', chatId).eq('user_id', userId).maybeSingle();
        if (!access) continue;

        const { data: newMsg } = await supabase.from('messages').insert({
          chat_id: chatId,
          sender_id: userId,
          sender_type: userType,
          sender_name: senderName,
          content: original.content,
          message_type: original.message_type,
          media_url: original.media_url,
          media_name: original.media_name,
          media_type: original.media_type,
          is_forwarded: true,
          forwarded_from_message_id: messageId,
          created_at: new Date().toISOString()
        }).select().single();

        if (newMsg) {
          forwarded.push(newMsg);
          // Create statuses
          const { data: parts } = await supabase.from('chat_participants').select('*').eq('chat_id', chatId);
          const statuses = parts.map(p => ({
            message_id: newMsg.id,
            user_id: p.user_id,
            user_type: p.user_type,
            status: (p.user_id == userId) ? 'read' : 'sent',
            read_at: (p.user_id == userId) ? new Date().toISOString() : null
          }));
          await supabase.from('message_status').insert(statuses);
          await supabase.from('chats').update({ last_message_at: new Date().toISOString() }).eq('id', chatId);
        }
      }

      res.json({ success: true, forwardedCount: forwarded.length });
    } catch (error) {
      console.error('Error forwarding:', error);
      res.status(500).json({ error: 'Failed' });
    }
  },

  /**
   * Search Users
   */
  searchUsers: async (req, res) => {
    try {
      const { query = '', currentUserId } = req.query;

      if (!query) return res.json({ users: [] });

      const term = `%${query}%`;
      // Search doctors
      const { data: doctors } = await supabase
        .from('doctors')
        .select('unique_id, first_name, last_name, email, profile_image_url, specialization')
        .or(`first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term}`)
        .neq('unique_id', currentUserId)
        .not('unique_id', 'ilike', 'DOC-00%')
        .limit(20);

      // Search patients
      const { data: patients } = await supabase
        .from('patients')
        .select('unique_id, first_name, last_name, email')
        .or(`first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term}`)
        .neq('unique_id', currentUserId)
        .not('unique_id', 'ilike', 'PAT-00%')
        .limit(20);

      const formatDocs = (doctors || []).map(d => ({
        user_id: d.unique_id,
        user_type: 'doctor',
        user_name: `${d.first_name} ${d.last_name}`,
        user_email: d.email,
        user_avatar: d.profile_image_url,
        specialization: d.specialization
      }));

      const formatPats = (patients || []).map(p => ({
        user_id: p.unique_id,
        user_type: 'patient',
        user_name: `${p.first_name} ${p.last_name}`,
        user_email: p.email,
        user_avatar: null
      }));

      res.json({ users: [...formatDocs, ...formatPats] });
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Failed' });
    }
  },

  /**
   * Update chat settings
   */
  updateChatSettings: async (req, res) => {
    try {
      const { chatId } = req.params;
      const { userId, isPinned, isMuted, isArchived, isBlocked } = req.body;

      const partUpdates = {};
      if (isPinned !== undefined) partUpdates.is_pinned = isPinned;
      if (isMuted !== undefined) partUpdates.is_muted = isMuted;
      if (isBlocked !== undefined) partUpdates.is_blocked = isBlocked;

      if (Object.keys(partUpdates).length > 0) {
        await supabase.from('chat_participants')
          .update(partUpdates)
          .eq('chat_id', chatId)
          .eq('user_id', userId);
      }

      if (isArchived !== undefined) {
        // Update global chat archive status (legacy)
        await supabase.from('chats').update({ is_archived: isArchived }).eq('id', chatId);
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error updating settings:', error);
      res.status(500).json({ error: 'Failed' });
    }
  },

  /**
   * Add reaction
   */
  addReaction: async (req, res) => {
    try {
      const { messageId } = req.params;
      const { userId, userType, reaction } = req.body;

      const { data, error } = await supabase
        .from('message_reactions')
        .insert({
          message_id: messageId,
          user_id: userId,
          user_type: userType,
          reaction,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      res.json({ success: true, reaction: data });
    } catch (error) {
      console.error('Error adding reaction:', error);
      res.status(500).json({ error: 'Failed' });
    }
  },

  /**
   * Remove reaction
   */
  removeReaction: async (req, res) => {
    try {
      const { messageId } = req.params;
      const { userId, userType, reaction } = req.body;

      const { error } = await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', userId)
        .eq('user_type', userType)
        .eq('reaction', reaction);

      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      console.error('Error removing reaction:', error);
      res.status(500).json({ error: 'Failed' });
    }
  },

  /**
   * Archive Chat
   */
  archiveChat: async (req, res) => {
    try {
      const { chatId } = req.params;
      const { isArchived } = req.body;
      await supabase.from('chats').update({ is_archived: isArchived !== undefined ? isArchived : true }).eq('id', chatId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error archiving:', error);
      res.status(500).json({ error: 'Failed' });
    }
  },

  /**
   * Clear Chat
   */
  clearChat: async (req, res) => {
    try {
      const { chatId } = req.params;
      await supabase.from('messages').delete().eq('chat_id', chatId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error clearing:', error);
      res.status(500).json({ error: 'Failed' });
    }
  },

  /**
   * Get Chat Settings (Placeholder)
   */
  getChatSettings: async (req, res) => {
    // Mock or fetch global settings
    res.json({ success: true, settings: {} });
  },

  /**
   * Get Per Chat Settings
   */
  getPerChatSettings: async (req, res) => {
    try {
      const { chatId } = req.params;
      // Logic to get settings
      res.json({ success: true, settings: {} });
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  },

  /**
   * Update Per Chat Settings (Alias to updateChatSettings but specific route)
   */
  updatePerChatSettings: async (req, res) => {
    // Reuse logic or mock
    return chatController.updateChatSettings(req, res);
  }
};
