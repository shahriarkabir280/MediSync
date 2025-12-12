import { sql } from './config/db.js';

async function addDeleteColumns() {
  try {
    console.log('Adding delete columns to messages table...');

    // Check if columns already exist
    const columnsCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'messages' 
      AND column_name IN ('deleted_at', 'delete_for_everyone')
    `;

    const existingColumns = columnsCheck.map(row => row.column_name);

    // Add deleted_at column if it doesn't exist
    if (!existingColumns.includes('deleted_at')) {
      await sql`
        ALTER TABLE messages 
        ADD COLUMN deleted_at TIMESTAMP
      `;
      console.log('✅ Added deleted_at column');
    } else {
      console.log('✓ deleted_at column already exists');
    }

    // Add delete_for_everyone column if it doesn't exist
    if (!existingColumns.includes('delete_for_everyone')) {
      await sql`
        ALTER TABLE messages 
        ADD COLUMN delete_for_everyone BOOLEAN DEFAULT FALSE
      `;
      console.log('✅ Added delete_for_everyone column');
    } else {
      console.log('✓ delete_for_everyone column already exists');
    }

    // Also check for forwarded columns
    const forwardCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'messages' 
      AND column_name IN ('is_forwarded', 'forwarded_from_message_id')
    `;

    const forwardColumns = forwardCheck.map(row => row.column_name);

    // Add is_forwarded column if it doesn't exist
    if (!forwardColumns.includes('is_forwarded')) {
      await sql`
        ALTER TABLE messages 
        ADD COLUMN is_forwarded BOOLEAN DEFAULT FALSE
      `;
      console.log('✅ Added is_forwarded column');
    } else {
      console.log('✓ is_forwarded column already exists');
    }

    // Add forwarded_from_message_id column if it doesn't exist
    if (!forwardColumns.includes('forwarded_from_message_id')) {
      await sql`
        ALTER TABLE messages 
        ADD COLUMN forwarded_from_message_id INTEGER
      `;
      console.log('✅ Added forwarded_from_message_id column');
    } else {
      console.log('✓ forwarded_from_message_id column already exists');
    }

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

addDeleteColumns();
