import { sql } from '../config/db.js';

/**
 * Modern Chat System - Database Schema
 * Based on WhatsApp/Telegram architecture
 * Features:
 * - One-to-one private messaging
 * - Message encryption support
 * - Read receipts and delivery status
 * - Typing indicators
 * - Media sharing
 * - Message reactions
 */

export async function createChatSchema() {
  console.log('📦 Creating modern chat schema...');

  try {
    // 1. CHATS TABLE - Stores individual chat conversations
    await sql`
      CREATE TABLE IF NOT EXISTS chats (
        id SERIAL PRIMARY KEY,
        type VARCHAR(20) NOT NULL DEFAULT 'private',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        last_message_at TIMESTAMP,
        is_archived BOOLEAN DEFAULT FALSE,
        CONSTRAINT chk_chat_type CHECK (type IN ('private', 'group'))
      )
    `;
    console.log('✅ Created chats table');

    // 2. CHAT_PARTICIPANTS TABLE - Links users to chats (2 for private, many for group)
    await sql`
      CREATE TABLE IF NOT EXISTS chat_participants (
        id SERIAL PRIMARY KEY,
        chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
        user_id VARCHAR(50) NOT NULL,
        user_type VARCHAR(20) NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        user_email VARCHAR(255),
        user_avatar VARCHAR(500),
        joined_at TIMESTAMP DEFAULT NOW(),
        last_read_at TIMESTAMP DEFAULT NOW(),
        is_muted BOOLEAN DEFAULT FALSE,
        is_pinned BOOLEAN DEFAULT FALSE,
        is_blocked BOOLEAN DEFAULT FALSE,
        custom_nickname VARCHAR(255),
        UNIQUE(chat_id, user_id, user_type),
        CONSTRAINT chk_user_type CHECK (user_type IN ('doctor', 'patient', 'admin'))
      )
    `;
    console.log('✅ Created chat_participants table');

    // 3. MESSAGES TABLE - Stores all messages
    await sql`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
        sender_id VARCHAR(50) NOT NULL,
        sender_type VARCHAR(20) NOT NULL,
        sender_name VARCHAR(255) NOT NULL,
        content TEXT,
        encrypted_content TEXT,
        message_type VARCHAR(20) DEFAULT 'text',
        media_url VARCHAR(500),
        media_name VARCHAR(255),
        media_size INTEGER,
        media_type VARCHAR(100),
        thumbnail_url VARCHAR(500),
        reply_to_id INTEGER REFERENCES messages(id) ON DELETE SET NULL,
        forward_from_chat_id INTEGER,
        forward_from_message_id INTEGER,
        created_at TIMESTAMP DEFAULT NOW(),
        edited_at TIMESTAMP,
        deleted_at TIMESTAMP,
        is_deleted BOOLEAN DEFAULT FALSE,
        delete_for_everyone BOOLEAN DEFAULT FALSE,
        CONSTRAINT chk_message_type CHECK (message_type IN ('text', 'image', 'video', 'audio', 'file', 'voice', 'location'))
      )
    `;
    console.log('✅ Created messages table');

    // 4. MESSAGE_STATUS TABLE - Tracks delivery and read status for each recipient
    await sql`
      CREATE TABLE IF NOT EXISTS message_status (
        id SERIAL PRIMARY KEY,
        message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
        user_id VARCHAR(50) NOT NULL,
        user_type VARCHAR(20) NOT NULL,
        status VARCHAR(20) DEFAULT 'sent',
        delivered_at TIMESTAMP,
        read_at TIMESTAMP,
        UNIQUE(message_id, user_id, user_type),
        CONSTRAINT chk_status CHECK (status IN ('sent', 'delivered', 'read'))
      )
    `;
    console.log('✅ Created message_status table');

    // 5. MESSAGE_REACTIONS TABLE - Emoji reactions to messages
    await sql`
      CREATE TABLE IF NOT EXISTS message_reactions (
        id SERIAL PRIMARY KEY,
        message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
        user_id VARCHAR(50) NOT NULL,
        user_type VARCHAR(20) NOT NULL,
        reaction VARCHAR(10) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(message_id, user_id, user_type)
      )
    `;
    console.log('✅ Created message_reactions table');

    // 6. TYPING_INDICATORS TABLE - Real-time typing status
    await sql`
      CREATE TABLE IF NOT EXISTS typing_indicators (
        id SERIAL PRIMARY KEY,
        chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
        user_id VARCHAR(50) NOT NULL,
        user_type VARCHAR(20) NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        is_typing BOOLEAN DEFAULT TRUE,
        started_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '10 seconds',
        UNIQUE(chat_id, user_id, user_type)
      )
    `;
    console.log('✅ Created typing_indicators table');

    // 7. USER_ENCRYPTION_KEYS TABLE - For end-to-end encryption
    await sql`
      CREATE TABLE IF NOT EXISTS user_encryption_keys (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        user_type VARCHAR(20) NOT NULL,
        public_key TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        UNIQUE(user_id, user_type)
      )
    `;
    console.log('✅ Created user_encryption_keys table');

    // CREATE INDEXES for performance
    console.log('\n📑 Creating indexes...');

    await sql`CREATE INDEX IF NOT EXISTS idx_chats_updated ON chats(updated_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_chats_last_message ON chats(last_message_at DESC)`;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_chat_participants_user ON chat_participants(user_id, user_type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_chat_participants_chat ON chat_participants(chat_id)`;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_id, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id, sender_type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC)`;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_message_status_message ON message_status(message_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_message_status_user ON message_status(user_id, user_type, status)`;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_typing_chat ON typing_indicators(chat_id, expires_at)`;

    console.log('✅ Created indexes');

    // CREATE TRIGGER to update chats.updated_at
    await sql`
      CREATE OR REPLACE FUNCTION update_chat_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        UPDATE chats
        SET updated_at = NOW(), last_message_at = NOW()
        WHERE id = NEW.chat_id;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `;

    await sql`
      DROP TRIGGER IF EXISTS tr_update_chat_timestamp ON messages
    `;

    await sql`
      CREATE TRIGGER tr_update_chat_timestamp
      AFTER INSERT ON messages
      FOR EACH ROW
      EXECUTE FUNCTION update_chat_timestamp()
    `;

    console.log('✅ Created triggers');

    console.log('\n✨ Chat schema created successfully!\n');
    return true;

  } catch (error) {
    console.error('❌ Error creating chat schema:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createChatSchema()
    .then(() => {
      console.log('✅ Schema initialization complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Schema initialization failed:', error);
      process.exit(1);
    });
}
