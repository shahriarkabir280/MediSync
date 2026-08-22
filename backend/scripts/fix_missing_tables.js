import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const { DATABASE_URL } = process.env;

if (!DATABASE_URL) {
    console.error('DATABASE_URL is missing in .env');
    process.exit(1);
}

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const runSql = async () => {
    try {
        console.log('🚀 Starting database fix...');

        const sql = `
-- Wellness & Finance Tables (Wallet System)
CREATE TABLE IF NOT EXISTS wallets (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER UNIQUE REFERENCES doctors(id) ON DELETE CASCADE,
  balance DECIMAL(15, 2) DEFAULT 0.00,
  total_earned DECIMAL(15, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS revenue_split_rules (
  id SERIAL PRIMARY KEY,
  service_type VARCHAR(50) UNIQUE NOT NULL,
  doctor_percentage DECIMAL(5, 2) NOT NULL,
  clinic_percentage DECIMAL(5, 2) NOT NULL,
  referral_percentage DECIMAL(5, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  account_details TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  type VARCHAR(10) NOT NULL,
  source VARCHAR(50) NOT NULL,
  source_id INTEGER,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wallet Indexes
CREATE INDEX IF NOT EXISTS idx_wallets_doctor_id ON wallets(doctor_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_doctor_id ON wallet_transactions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(type);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_doctor_id ON withdrawal_requests(doctor_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);

-- Seed Initial Revenue Rules
INSERT INTO revenue_split_rules (service_type, doctor_percentage, clinic_percentage, referral_percentage)
VALUES 
  ('consultation', 80.00, 20.00, 0.00),
  ('lab_test', 10.00, 70.00, 20.00)
ON CONFLICT (service_type) DO NOTHING;
        `;

        await pool.query(sql);
        console.log('✅ Tables created and seeded successfully!');

    } catch (err) {
        console.error('❌ Error fixing database:', err);
    } finally {
        await pool.end();
        process.exit();
    }
};

runSql();
