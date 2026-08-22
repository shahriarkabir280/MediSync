import pg from 'pg';
import bcrypt from 'bcryptjs';
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

        // 1. Add password_hash column to patients if not exists
        console.log('Adding password_hash column to patients table...');
        await client.query('ALTER TABLE patients ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);');
        console.log('Successfully added password_hash column.');

        // 2. Prepare default hash for 'password123'
        const defaultPassword = 'password123';
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(defaultPassword, salt);
        console.log('Generated default hash for "password123".');

        // 3. Update doctors missing passwords
        console.log('Updating doctors with missing passwords...');
        const docResult = await client.query(
            'UPDATE doctors SET password_hash = $1 WHERE password_hash IS NULL;',
            [hash]
        );
        console.log(`Updated ${docResult.rowCount} doctors.`);

        // 4. Update patients missing passwords (all of them initially)
        console.log('Updating patients with missing passwords...');
        const patResult = await client.query(
            'UPDATE patients SET password_hash = $1 WHERE password_hash IS NULL;',
            [hash]
        );
        console.log(`Updated ${patResult.rowCount} patients.`);

        console.log('\n✅ Migration and auth initialization completed successfully!');

    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        await client.end();
    }
};

runMigration();
