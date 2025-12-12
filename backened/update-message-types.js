import { sql } from './config/db.js';

/**
 * Update message_type constraint to include 'document'
 */

async function updateMessageTypes() {
  try {
    console.log('🔧 Updating message_type constraint...');

    // Drop old constraint
    await sql`
      ALTER TABLE messages 
      DROP CONSTRAINT IF EXISTS chk_message_type
    `;
    console.log('✅ Dropped old constraint');

    // Add new constraint with 'document' included
    await sql`
      ALTER TABLE messages 
      ADD CONSTRAINT chk_message_type 
      CHECK (message_type IN ('text', 'image', 'video', 'audio', 'file', 'voice', 'document', 'location'))
    `;
    console.log('✅ Added new constraint with document type');

    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

updateMessageTypes();
