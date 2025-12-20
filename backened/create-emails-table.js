import { sql } from './config/db.js';

async function createEmailsTable() {
  try {
    console.log('Creating emails table...');
    
    // Create emails table
    await sql`
      CREATE TABLE IF NOT EXISTS emails (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
        sender_email VARCHAR(255) NOT NULL,
        sender_name VARCHAR(255) NOT NULL,
        recipient_id INTEGER,
        recipient_email VARCHAR(255) NOT NULL,
        recipient_name VARCHAR(255),
        subject VARCHAR(500) NOT NULL,
        body TEXT,
        cc TEXT,
        bcc TEXT,
        attachments JSONB DEFAULT '[]',
        is_read BOOLEAN DEFAULT false,
        is_starred BOOLEAN DEFAULT false,
        is_draft BOOLEAN DEFAULT false,
        folder VARCHAR(50) DEFAULT 'inbox',
        reply_to_id INTEGER REFERENCES emails(id) ON DELETE SET NULL,
        deleted_by_sender BOOLEAN DEFAULT false,
        deleted_by_recipient BOOLEAN DEFAULT false,
        read_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`;
    
    console.log('✅ Emails table created successfully');
    
    // Create indexes
    console.log('Creating indexes...');
    await Promise.all([
      sql`CREATE INDEX IF NOT EXISTS idx_emails_sender_id ON emails(sender_id)`,
      sql`CREATE INDEX IF NOT EXISTS idx_emails_recipient_id ON emails(recipient_id)`,
      sql`CREATE INDEX IF NOT EXISTS idx_emails_folder ON emails(folder)`,
      sql`CREATE INDEX IF NOT EXISTS idx_emails_is_read ON emails(is_read)`,
      sql`CREATE INDEX IF NOT EXISTS idx_emails_created_at ON emails(created_at DESC)`
    ]);
    
    console.log('✅ Email indexes created successfully');
    
    // Insert sample email
    console.log('Inserting sample email...');
    await sql`
      INSERT INTO emails (
        sender_id, sender_email, sender_name,
        recipient_id, recipient_email, recipient_name,
        subject, body, folder
      ) VALUES (
        1, 'doctor@careconnect.com', 'Dr. Smith',
        1, 'doctor@careconnect.com', 'Dr. Smith',
        'Welcome to CareConnect Email',
        'Welcome to the new email system! You can now send and receive emails within CareConnect. This is a test email to demonstrate the functionality.',
        'inbox'
      )
      ON CONFLICT DO NOTHING`;
    
    console.log('✅ Sample email inserted');
    console.log('\n🎉 Email system setup complete!');
    
  } catch (error) {
    console.error('❌ Error creating emails table:', error);
  } finally {
    process.exit();
  }
}

createEmailsTable();
