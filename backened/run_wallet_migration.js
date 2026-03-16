import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const { DATABASE_URL } = process.env;
console.log('Using DATABASE_URL:', DATABASE_URL ? 'Loaded' : 'Not Loaded');

const runMigration = async () => {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const migrationSql = fs.readFileSync(path.join(__dirname, 'wallet_migration.sql'), 'utf8');
    console.log('Running migration...');
    await pool.query(migrationSql);
    console.log('Migration successful!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
};

runMigration();
