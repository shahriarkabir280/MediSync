import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const { DATABASE_URL } = process.env;

const runMigration = async () => {
    const client = new pg.Client({
        connectionString: DATABASE_URL,
    });

    try {
        console.log('Connecting to database...');
        await client.connect();
        console.log('Connected.');

        console.log('Adding group metadata columns to chats table...');
        await client.query("ALTER TABLE chats ADD COLUMN IF NOT EXISTS name VARCHAR(255);");
        await client.query("ALTER TABLE chats ADD COLUMN IF NOT EXISTS avatar VARCHAR(500);");
        await client.query("ALTER TABLE chats ADD COLUMN IF NOT EXISTS description TEXT;");
        console.log('Successfully added group columns.');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
};

runMigration();
