-- SecureBank AI Database Schema
-- Production-grade banking simulation

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    role VARCHAR(20) DEFAULT 'customer'
);

-- Accounts table
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    account_number VARCHAR(20) UNIQUE NOT NULL,
    account_type VARCHAR(20) NOT NULL,
    balance DECIMAL(15, 2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_account_id UUID REFERENCES accounts(id),
    to_account_id UUID REFERENCES accounts(id),
    amount DECIMAL(15, 2) NOT NULL,
    transaction_type VARCHAR(30) NOT NULL,
    description TEXT,
    note TEXT,
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

-- Loan applications table
CREATE TABLE loan_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    amount DECIMAL(15, 2) NOT NULL,
    purpose TEXT,
    income_stated DECIMAL(15, 2),
    income_verified DECIMAL(15, 2),
    ai_recommendation TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    interest_rate DECIMAL(5, 2)
);

-- Chat history table
CREATE TABLE chat_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(100),
    message TEXT NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

-- Audit log table
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100),
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed data: Create test users
-- Using plaintext: prefix for password hashes (supported by security.py fallback for testing)
INSERT INTO users (username, email, password_hash, full_name, phone, role) VALUES
('john.doe', 'john.doe@email.com', 'plaintext:SecureBank123!', 'John Doe', '+1-555-0101', 'customer'),
('jane.smith', 'jane.smith@email.com', 'plaintext:SecureBank123!', 'Jane Smith', '+1-555-0102', 'customer'),
('admin', 'admin@securebank.ai', 'plaintext:SecureBank123!', 'System Administrator', '+1-555-0001', 'admin'),
('attacker', 'test@test.com', 'plaintext:SecureBank123!', 'Test User', '+1-555-9999', 'customer');

-- Seed data: Create accounts
INSERT INTO accounts (user_id, account_number, account_type, balance) VALUES
((SELECT id FROM users WHERE username = 'john.doe'), '1001234567', 'checking', 5420.50),
((SELECT id FROM users WHERE username = 'john.doe'), '2001234567', 'savings', 15000.00),
((SELECT id FROM users WHERE username = 'jane.smith'), '1001234568', 'checking', 8750.25),
((SELECT id FROM users WHERE username = 'jane.smith'), '2001234568', 'savings', 25000.00),
((SELECT id FROM users WHERE username = 'attacker'), '1009999999', 'checking', 100.00),
((SELECT id FROM users WHERE username = 'admin'), '1000000001', 'checking', 1000000.00);

-- Seed data: Create sample transactions
INSERT INTO transactions (from_account_id, to_account_id, amount, transaction_type, description, note) VALUES
((SELECT id FROM accounts WHERE account_number = '1001234567'), 
 (SELECT id FROM accounts WHERE account_number = '1001234568'), 
 50.00, 'transfer', 'Coffee money', 'Thanks for yesterday!'),
((SELECT id FROM accounts WHERE account_number = '1001234567'), 
 NULL, 
 125.50, 'debit', 'Starbucks Purchase', 'Payment to Starbucks on 12/01'),
((SELECT id FROM accounts WHERE account_number = '1001234568'), 
 NULL, 
 2500.00, 'credit', 'Salary Deposit', 'Monthly salary');

-- Vulnerable transaction with XSS payload (Scenario B)
INSERT INTO transactions (from_account_id, to_account_id, amount, transaction_type, description, note) VALUES
((SELECT id FROM accounts WHERE account_number = '1009999999'), 
 NULL, 
 10.00, 'debit', 'Test Payment', '<script>alert("XSS via AI")</script>Legitimate payment');

-- Create indexes for performance
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_transactions_from_account ON transactions(from_account_id);
CREATE INDEX idx_transactions_to_account ON transactions(to_account_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX idx_chat_history_session_id ON chat_history(session_id);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- Create views for common queries
CREATE VIEW account_summary AS
SELECT 
    u.id as user_id,
    u.full_name,
    u.email,
    a.account_number,
    a.account_type,
    a.balance,
    a.status
FROM users u
JOIN accounts a ON u.id = a.user_id
WHERE u.is_active = TRUE AND a.status = 'active';

-- Function to update account balance (used by AI agent)
CREATE OR REPLACE FUNCTION transfer_money(
    p_from_account VARCHAR(20),
    p_to_account VARCHAR(20),
    p_amount DECIMAL(15, 2),
    p_description TEXT DEFAULT 'Transfer'
) RETURNS JSONB AS $$
DECLARE
    v_from_id UUID;
    v_to_id UUID;
    v_from_balance DECIMAL(15, 2);
    v_result JSONB;
BEGIN
    -- Get account IDs
    SELECT id, balance INTO v_from_id, v_from_balance
    FROM accounts WHERE account_number = p_from_account;
    
    SELECT id INTO v_to_id
    FROM accounts WHERE account_number = p_to_account;
    
    -- Check if accounts exist
    IF v_from_id IS NULL OR v_to_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Account not found');
    END IF;
    
    -- Check sufficient balance
    IF v_from_balance < p_amount THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient funds');
    END IF;
    
    -- Perform transfer (VULNERABLE: No additional validation)
    UPDATE accounts SET balance = balance - p_amount WHERE id = v_from_id;
    UPDATE accounts SET balance = balance + p_amount WHERE id = v_to_id;
    
    -- Log transaction
    INSERT INTO transactions (from_account_id, to_account_id, amount, transaction_type, description)
    VALUES (v_from_id, v_to_id, p_amount, 'transfer', p_description);
    
    RETURN jsonb_build_object('success', true, 'message', 'Transfer completed');
END;
$$ LANGUAGE plpgsql;

-- Default password for all test users: "SecureBank123!"
-- Note: In production, never use the same password hash for multiple users
