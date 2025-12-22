import { sql } from '../config/db.js';

const addPurgedColumns = async () => {
    try {
        console.log('Adding purged_by columns to emails table...');

        await sql`
      ALTER TABLE emails 
      ADD COLUMN IF NOT EXISTS purged_by_sender BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS purged_by_recipient BOOLEAN DEFAULT false
    `;

        console.log('Successfully added purged_by columns.');
        process.exit(0);
    } catch (error) {
        console.error('Error adding columns:', error);
        process.exit(1);
    }
};

addPurgedColumns();
