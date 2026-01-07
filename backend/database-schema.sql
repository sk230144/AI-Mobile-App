-- ==========================================
-- AI SPAM CALL APP - DATABASE SCHEMA
-- ==========================================
-- Run this in Supabase SQL Editor
-- https://supabase.com/dashboard/project/xhywujwsdiqqigmgdoaj/sql

-- ==========================================
-- 1. CALLS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  caller_number VARCHAR(20) NOT NULL,
  caller_name VARCHAR(255),
  call_duration INTEGER DEFAULT 0, -- in seconds
  call_status VARCHAR(50) DEFAULT 'completed', -- 'completed', 'missed', 'ongoing'
  recording_url TEXT,
  transcript TEXT,
  is_spam BOOLEAN DEFAULT false,
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00 for spam detection confidence
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 2. VIOLATIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS violations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id UUID REFERENCES calls(id) ON DELETE CASCADE NOT NULL,
  violation_type VARCHAR(100) NOT NULL, -- 'TCPA', 'FDCPA', 'ROBOCALL', etc.
  violation_description TEXT,
  timestamp_in_call INTEGER, -- seconds into call when violation occurred
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  estimated_payout DECIMAL(10,2), -- estimated compensation amount
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 3. LEGAL CASES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS legal_cases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  case_title VARCHAR(255),
  case_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'filed', 'in_progress', 'settled', 'closed'
  estimated_payout DECIMAL(10,2),
  actual_payout DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 4. CASE CALLS (Many-to-Many)
-- ==========================================
CREATE TABLE IF NOT EXISTS case_calls (
  case_id UUID REFERENCES legal_cases(id) ON DELETE CASCADE,
  call_id UUID REFERENCES calls(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (case_id, call_id)
);

-- ==========================================
-- 5. USER SETTINGS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  state VARCHAR(2), -- US state code (e.g., 'CA', 'NY')
  phone_number VARCHAR(20),
  virtual_number VARCHAR(20), -- Twilio number assigned to user
  auto_answer_enabled BOOLEAN DEFAULT true,
  recording_consent_given BOOLEAN DEFAULT false,
  notification_preferences JSONB DEFAULT '{"email": true, "push": true, "sms": false}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_calls_user_id ON calls(user_id);
CREATE INDEX IF NOT EXISTS idx_calls_created_at ON calls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_is_spam ON calls(is_spam);
CREATE INDEX IF NOT EXISTS idx_violations_call_id ON violations(call_id);
CREATE INDEX IF NOT EXISTS idx_violations_type ON violations(violation_type);
CREATE INDEX IF NOT EXISTS idx_legal_cases_user_id ON legal_cases(user_id);
CREATE INDEX IF NOT EXISTS idx_legal_cases_status ON legal_cases(case_status);

-- ==========================================
-- 7. CREATE UPDATED_AT TRIGGER FUNCTION
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at
CREATE TRIGGER update_calls_updated_at BEFORE UPDATE ON calls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_legal_cases_updated_at BEFORE UPDATE ON legal_cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- SUCCESS MESSAGE
-- ==========================================
DO $$
BEGIN
    RAISE NOTICE 'Database schema created successfully!';
    RAISE NOTICE 'Tables created: calls, violations, legal_cases, case_calls, user_settings';
    RAISE NOTICE 'Indexes and triggers applied.';
    RAISE NOTICE 'Next step: Run the RLS (Row Level Security) script';
END $$;
