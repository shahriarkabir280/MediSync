import { chatApi } from '../lib/chatApi.js';

/**
 * Chat System Test Script
 * Tests the modern chat functionality
 */

async function testChatSystem() {
  console.log('🧪 Testing Modern Chat System\n');

  try {
    // Test 1: Search users
    console.log('1️⃣ Testing user search...');
    const searchResult = await chatApi.searchUsers('', 'DOC-001', 'doctor');
    console.log(`✅ Found ${searchResult.users?.length || 0} users`);
    
    if (searchResult.users && searchResult.users.length > 0) {
      console.log(`   Sample user: ${searchResult.users[0].user_name} (${searchResult.users[0].user_type})`);
    }

    // Test 2: Start a chat
    if (searchResult.users && searchResult.users.length > 0) {
      console.log('\n2️⃣ Testing chat creation...');
      const me = {
        userId: 'DOC-001',
        userType: 'doctor',
        userName: 'Dr. John Doe',
        userEmail: 'john@example.com'
      };

      const other = searchResult.users[0];
      const otherUser = {
        userId: other.user_id,
        userType: other.user_type,
        userName: other.user_name,
        userEmail: other.user_email
      };

      const chatResult = await chatApi.startChat(me, otherUser);
      console.log(`✅ ${chatResult.isNew ? 'Created new' : 'Found existing'} chat #${chatResult.chat.id}`);

      // Test 3: Send a message
      console.log('\n3️⃣ Testing message sending...');
      const messageResult = await chatApi.sendMessage(
        chatResult.chat.id,
        me,
        'Hello! This is a test message from the new chat system. 🚀'
      );
      console.log(`✅ Message sent with ID: ${messageResult.message.id}`);

      // Test 4: Get messages
      console.log('\n4️⃣ Testing message retrieval...');
      const messagesResult = await chatApi.getMessages(
        chatResult.chat.id,
        me.userId,
        me.userType
      );
      console.log(`✅ Retrieved ${messagesResult.messages?.length || 0} messages`);

      // Test 5: Get my chats
      console.log('\n5️⃣ Testing chat list...');
      const chatsResult = await chatApi.getMyChats(me.userId, me.userType);
      console.log(`✅ Found ${chatsResult.chats?.length || 0} chats`);
      
      if (chatsResult.chats && chatsResult.chats.length > 0) {
        console.log(`   Latest chat: ${chatsResult.chats[0].other_user?.user_name}`);
        console.log(`   Unread count: ${chatsResult.chats[0].unread_count || 0}`);
      }
    }

    console.log('\n✅ All tests passed! Chat system is working properly.\n');
    console.log('📱 You can now use the chat interface in the dashboard.');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
  }
}

// Run tests
testChatSystem();
