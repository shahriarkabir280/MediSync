// Applies backend/schema.sql to DATABASE_URL. The schema is idempotent, so this is safe to re-run.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pkg from 'pg';
const { Client } = pkg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set in backend/.env');
  process.exit(1);
}

const schema = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(schema);
  console.log('Database schema applied successfully.');
} catch (error) {
  console.error('Failed to apply schema:', error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
