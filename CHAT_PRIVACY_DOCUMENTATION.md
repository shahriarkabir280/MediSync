# Chat System - One-to-One Privacy Documentation

## Overview
The CareConnect chat system implements **strict one-to-one privacy** for direct conversations. Each conversation is isolated to exactly two participants, ensuring messages are never visible to others.

## How It Works

### 1. Conversation Types
- **Direct (`type='direct'`)**: One-to-one conversations between exactly 2 users
- **Group (`type='group'`)**: Multi-participant conversations (separate feature)

### 2. Conversation Creation
When a user starts a chat with another user, the system:

1. **Checks for existing conversation** between these exact two users
   - Uses optimized query that ensures exactly 2 participants
   - Returns existing conversation if found
   
2. **Creates new conversation** if none exists
   - Adds both users as participants
   - Generates conversation name: "User1 - User2"

### 3. Privacy Enforcement

#### Backend Authorization
Every API endpoint verifies user authorization:

```javascript
// Before accessing messages
const participant = await sql`
  SELECT id FROM conversation_participants 
  WHERE conversation_id = ${conversationId} 
  AND user_id = ${userId} 
  AND user_type = ${userType}
`;

if (participant.length === 0) {
  return res.status(403).json({ error: 'Not authorized' });
}
```

#### Database Constraints
- **Unique constraint**: Prevents same user from being added twice to a conversation
- **Foreign keys**: Maintain referential integrity
- **Indexes**: Optimize participant lookups

### 4. Message Visibility
Messages are only visible to conversation participants:
- Users can only see conversations they're part of
- Messages are filtered by conversation_id and participant verification
- WebSocket events only sent to conversation participants

## Examples

### Example 1: Dr. John messages Patient Mary
1. Dr. John (DOC-001) starts chat with Mary (PAT-002)
2. System creates Conversation #1 with 2 participants:
   - Dr. John (DOC-001, doctor)
   - Mary (PAT-002, patient)
3. All messages in this conversation are visible **only** to Dr. John and Mary

### Example 2: Dr. Smith messages Patient Mary  
1. Dr. Smith (DOC-002) starts chat with Mary (PAT-002)
2. System creates **separate** Conversation #2 with 2 participants:
   - Dr. Smith (DOC-002, doctor)
   - Mary (PAT-002, patient)
3. Messages in Conversation #2 are visible **only** to Dr. Smith and Mary
4. Dr. John **cannot see** messages in Conversation #2
5. Mary sees **two separate conversations** - one with Dr. John, one with Dr. Smith

### Example 3: Prevention of Cross-Conversation Visibility
- Dr. John cannot see Dr. Smith's conversation with Mary
- Mary's conversations with different doctors are completely separate
- Each doctor sees only their own conversation with Mary

## Implementation Details

### API Endpoints

#### Start/Get Conversation
```
POST /chat/conversations/start
Body: {
  currentUserId, currentUserType, currentUserName,
  otherUserId, otherUserType, otherUserName
}
```
- Returns existing conversation or creates new one
- Ensures exactly 2 participants

#### Get Conversations List
```
GET /chat/conversations?userId=XXX&userType=YYY
```
- Returns only conversations where user is a participant
- Includes other participant info for direct chats

#### Get Messages
```
GET /chat/conversations/:id/messages?userId=XXX&userType=YYY
```
- Verifies user is participant before returning messages
- Returns 403 if user is not authorized

#### Send Message
```
POST /chat/conversations/:id/messages
Body: { content, senderId, senderType, ... }
```
- Verifies sender is participant
- Broadcasts only to conversation participants via WebSocket

### WebSocket Events
```javascript
// Join conversation room
socket.join(`conversation_${conversationId}`);

// Broadcast only to conversation participants
io.to(`conversation_${conversationId}`).emit('new_message', message);
```

### Database Schema

#### Conversations
```sql
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  type VARCHAR(50), -- 'direct' or 'group'
  created_by VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT FALSE,
  last_message_id INTEGER
);
```

#### Conversation Participants
```sql
CREATE TABLE conversation_participants (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id),
  user_id VARCHAR(50),
  user_type VARCHAR(50), -- 'doctor', 'patient', etc.
  user_name VARCHAR(255),
  user_email VARCHAR(255),
  joined_at TIMESTAMP DEFAULT NOW(),
  last_seen TIMESTAMP,
  is_muted BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  UNIQUE(conversation_id, user_id, user_type)
);
```

#### Messages
```sql
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id),
  sender_id VARCHAR(50),
  sender_name VARCHAR(255),
  sender_type VARCHAR(50),
  content TEXT,
  message_type VARCHAR(50) DEFAULT 'text',
  file_url VARCHAR(500),
  file_name VARCHAR(255),
  file_size INTEGER,
  reply_to INTEGER REFERENCES messages(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_edited BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE
);
```

## Recent Fixes (December 2025)

### Issue: Conversation Grouping
**Problem**: Multiple doctors messaging the same patient could see each other's messages due to improper conversation lookup.

**Solution**: Updated `startConversation` function in `chatController.js`:
1. Enhanced query to ensure conversation has exactly 2 participants
2. Verifies both users are participants before returning existing conversation
3. Creates separate conversations for each unique user pair

**Code Fix**:
```javascript
// Old: Could match conversations with wrong participants
// New: Ensures exactly 2 participants matching both users
const existingConv = await sql`
  SELECT c.id, c.name
  FROM conversations c
  WHERE c.type = 'direct'
  AND c.id IN (
    SELECT cp1.conversation_id
    FROM conversation_participants cp1
    WHERE cp1.user_id = ${currentUserId} AND cp1.user_type = ${currentUserType}
  )
  AND c.id IN (
    SELECT cp2.conversation_id
    FROM conversation_participants cp2
    WHERE cp2.user_id = ${otherUserId} AND cp2.user_type = ${otherUserType}
  )
  AND (
    SELECT COUNT(*)
    FROM conversation_participants cp
    WHERE cp.conversation_id = c.id
  ) = 2
  LIMIT 1
`;
```

### Issue: Duplicate Conversations
**Problem**: Same two users had multiple conversations due to race conditions.

**Solution**: 
1. Added cleanup to remove duplicate conversations
2. Improved query prevents duplicates from being created
3. Database constraints prevent duplicate participants

## Security Best Practices

✅ **Always verify participants** before showing messages  
✅ **Use conversation rooms** in WebSocket for targeted broadcasts  
✅ **Filter by user_id AND user_type** for authorization  
✅ **Log privacy violations** for monitoring  
✅ **Use database constraints** to enforce data integrity  

❌ **Never** broadcast to all connected users  
❌ **Never** show conversations without participant check  
❌ **Never** rely on frontend filtering alone  

## Troubleshooting

### Users seeing wrong messages?
1. Check `conversation_participants` table for correct participants
2. Verify `startConversation` is being called correctly
3. Check browser console for API errors
4. Review server logs for authorization failures

### Duplicate conversations?
1. Check if multiple conversations exist for same user pair:
```sql
SELECT c.id, c.name, cp.user_name
FROM conversations c
JOIN conversation_participants cp ON c.id = cp.conversation_id
WHERE c.type = 'direct'
ORDER BY c.id;
```

### Messages not appearing?
1. Verify WebSocket connection
2. Check if user joined conversation room
3. Verify participant authorization
4. Check message status in database

## Frontend Integration

### Starting a Conversation
```javascript
import { chatApi } from './lib/chatApi.js';

// Start or get existing conversation
const { conversation } = await chatApi.startConversation(
  otherUserId,
  otherUserType,
  currentUserId,
  currentUserType,
  currentUserName,
  otherUserName
);

// conversation.id is now ready for messages
```

### Sending Messages
```javascript
await chatApi.sendMessage(conversationId, {
  content: 'Hello!',
  senderId: currentUserId,
  senderType: currentUserType,
  senderName: currentUserName,
  messageType: 'text'
});
```

### WebSocket Events
```javascript
socket.emit('join_conversation', conversationId);

socket.on('new_message', (message) => {
  // Only receives messages for joined conversations
});
```

## Conclusion
The CareConnect chat system ensures complete privacy for one-to-one conversations through:
- Database-level constraints
- Backend authorization checks  
- Targeted WebSocket broadcasts
- Separate conversations per user pair

Each conversation is completely isolated, and users can only see messages in conversations they're participants in. **Each doctor-patient pair has their own private conversation that others cannot access.**
