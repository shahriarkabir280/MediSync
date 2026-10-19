import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Imported first by server.js so every module sees the environment at load time.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const required = ['JWT_SECRET', 'SUPABASE_URL', 'SUPABASE_KEY'];
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  console.error('Copy backend/.env.example to backend/.env and fill in the values.');
  process.exit(1);
}

const optional = ['DATABASE_URL', 'GEMINI_API_KEY', 'SSL_STORE_ID', 'SSL_STORE_PASSWORD', 'SMTP_HOST'];
const unset = optional.filter((key) => !process.env[key]);

if (unset.length > 0) {
  console.warn(`Optional environment variables not set (related features disabled): ${unset.join(', ')}`);
}
