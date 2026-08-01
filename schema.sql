-- ═══════════════════════════════════════════════════════════════════════════
-- AGMIEX — Database Schema for Website Demo Requests & Razorpay Payments
-- Compatible with PostgreSQL, Supabase, MySQL 8+, and Cloud SQL
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable UUID extension (PostgreSQL / Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ───────────────────────────────────────────────────────────────────────────
-- 1. TABLE: demo_requests
-- Stores form submissions from the "Book Your Website Demo" page
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS demo_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(150) NOT NULL,
    business_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    whatsapp VARCHAR(30) NOT NULL,
    budget_range VARCHAR(50) DEFAULT '< ₹50,000',
    requirements TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending', -- 'pending', 'in_sprint', 'demo_delivered', 'converted', 'cancelled'
    is_deposit_paid BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ───────────────────────────────────────────────────────────────────────────
-- 2. TABLE: payment_transactions
-- Stores Razorpay payment logs and transaction metadata for ₹99 deposits
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    demo_request_id UUID REFERENCES demo_requests(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 99.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    razorpay_order_id VARCHAR(100) UNIQUE,
    razorpay_payment_id VARCHAR(100) UNIQUE,
    razorpay_signature VARCHAR(255),
    payment_status VARCHAR(30) NOT NULL DEFAULT 'created', -- 'created', 'authorized', 'captured', 'failed', 'refunded'
    payment_method VARCHAR(50), -- 'upi', 'card', 'netbanking', 'wallet'
    error_code VARCHAR(100),
    error_description TEXT,
    raw_payload JSONB, -- Stores full Razorpay webhook / API response
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ───────────────────────────────────────────────────────────────────────────
-- 3. INDEXES FOR FAST QUERYING
-- ───────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_demo_requests_email ON demo_requests(email);
CREATE INDEX IF NOT EXISTS idx_demo_requests_status ON demo_requests(status);
CREATE INDEX IF NOT EXISTS idx_demo_requests_created ON demo_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_demo_request_id ON payment_transactions(demo_request_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order ON payment_transactions(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payment_transactions(payment_status);

-- ───────────────────────────────────────────────────────────────────────────
-- 4. AUTOMATIC UPDATED_AT TRIGGER FUNCTION
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_demo_requests_modtime
    BEFORE UPDATE ON demo_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_payment_transactions_modtime
    BEFORE UPDATE ON payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

-- ───────────────────────────────────────────────────────────────────────────
-- 5. ANALYTICS VIEW: v_demo_payment_summary
-- Provides an executive overview of demo leads and captured payments
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_demo_payment_summary AS
SELECT 
    dr.id AS demo_id,
    dr.full_name,
    dr.business_name,
    dr.email,
    dr.phone,
    dr.whatsapp,
    dr.budget_range,
    dr.status AS demo_status,
    dr.created_at AS request_date,
    pt.id AS payment_id,
    pt.amount AS payment_amount,
    pt.currency,
    pt.payment_status,
    pt.razorpay_order_id,
    pt.razorpay_payment_id,
    pt.payment_method,
    pt.paid_at
FROM demo_requests dr
LEFT JOIN payment_transactions pt ON dr.id = pt.demo_request_id
ORDER BY dr.created_at DESC;
