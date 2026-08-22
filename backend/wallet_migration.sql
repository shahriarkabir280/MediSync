-- Wallets table to track current balance and lifetime earnings
CREATE TABLE IF NOT EXISTS wallets (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER UNIQUE REFERENCES doctors(id) ON DELETE CASCADE,
  balance DECIMAL(15, 2) DEFAULT 0.00,
  total_earned DECIMAL(15, 2) DEFAULT 0.00,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Revenue split rules configuration
CREATE TABLE IF NOT EXISTS revenue_split_rules (
  id SERIAL PRIMARY KEY,
  service_type VARCHAR(50) UNIQUE NOT NULL, -- 'consultation', 'lab_test', etc.
  doctor_percentage DECIMAL(5, 2) NOT NULL,
  clinic_percentage DECIMAL(5, 2) NOT NULL,
  referral_percentage DECIMAL(5, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wallet transactions ledger
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  type VARCHAR(10) CHECK (type IN ('credit', 'debit')),
  source VARCHAR(50) NOT NULL, -- 'consultation', 'referral', 'withdrawal'
  source_id INTEGER, -- references billing.id or withdrawal_requests.id
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Withdrawal requests for payouts
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  payment_method VARCHAR(20) CHECK (payment_method IN ('bkash', 'nagad', 'rocket', 'bank')),
  account_details TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default rules
INSERT INTO revenue_split_rules (service_type, doctor_percentage, clinic_percentage, referral_percentage)
VALUES 
('consultation', 70.00, 30.00, 0.00),
('lab_test', 15.00, 85.00, 15.00)
ON CONFLICT (service_type) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_doctor_id ON wallet_transactions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_doctor_id ON withdrawal_requests(doctor_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);
