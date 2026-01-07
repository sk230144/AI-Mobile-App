-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
-- Run this AFTER database-schema.sql
-- This ensures users can only access their own data

-- ==========================================
-- 1. ENABLE RLS ON ALL TABLES
-- ==========================================
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 2. CALLS TABLE POLICIES
-- ==========================================

-- Users can view their own calls
CREATE POLICY "Users can view their own calls"
  ON calls FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own calls
CREATE POLICY "Users can insert their own calls"
  ON calls FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own calls
CREATE POLICY "Users can update their own calls"
  ON calls FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own calls
CREATE POLICY "Users can delete their own calls"
  ON calls FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- 3. VIOLATIONS TABLE POLICIES
-- ==========================================

-- Users can view violations for their calls
CREATE POLICY "Users can view violations for their calls"
  ON violations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM calls
      WHERE calls.id = violations.call_id
      AND calls.user_id = auth.uid()
    )
  );

-- Users can insert violations for their calls
CREATE POLICY "Users can insert violations for their calls"
  ON violations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM calls
      WHERE calls.id = violations.call_id
      AND calls.user_id = auth.uid()
    )
  );

-- Users can update violations for their calls
CREATE POLICY "Users can update violations for their calls"
  ON violations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM calls
      WHERE calls.id = violations.call_id
      AND calls.user_id = auth.uid()
    )
  );

-- Users can delete violations for their calls
CREATE POLICY "Users can delete violations for their calls"
  ON violations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM calls
      WHERE calls.id = violations.call_id
      AND calls.user_id = auth.uid()
    )
  );

-- ==========================================
-- 4. LEGAL CASES TABLE POLICIES
-- ==========================================

-- Users can view their own cases
CREATE POLICY "Users can view their own cases"
  ON legal_cases FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own cases
CREATE POLICY "Users can create their own cases"
  ON legal_cases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own cases
CREATE POLICY "Users can update their own cases"
  ON legal_cases FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own cases
CREATE POLICY "Users can delete their own cases"
  ON legal_cases FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- 5. CASE_CALLS TABLE POLICIES
-- ==========================================

-- Users can view case-call relationships for their cases
CREATE POLICY "Users can view their case-call relationships"
  ON case_calls FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM legal_cases
      WHERE legal_cases.id = case_calls.case_id
      AND legal_cases.user_id = auth.uid()
    )
  );

-- Users can add calls to their cases
CREATE POLICY "Users can add calls to their cases"
  ON case_calls FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM legal_cases
      WHERE legal_cases.id = case_calls.case_id
      AND legal_cases.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM calls
      WHERE calls.id = case_calls.call_id
      AND calls.user_id = auth.uid()
    )
  );

-- Users can remove calls from their cases
CREATE POLICY "Users can remove calls from their cases"
  ON case_calls FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM legal_cases
      WHERE legal_cases.id = case_calls.case_id
      AND legal_cases.user_id = auth.uid()
    )
  );

-- ==========================================
-- 6. USER SETTINGS TABLE POLICIES
-- ==========================================

-- Users can view their own settings
CREATE POLICY "Users can view their own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own settings
CREATE POLICY "Users can insert their own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own settings
CREATE POLICY "Users can update their own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own settings
CREATE POLICY "Users can delete their own settings"
  ON user_settings FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- SUCCESS MESSAGE
-- ==========================================
DO $$
BEGIN
    RAISE NOTICE 'Row Level Security policies created successfully!';
    RAISE NOTICE 'All tables are now secured.';
    RAISE NOTICE 'Users can only access their own data.';
    RAISE NOTICE 'Next step: Configure storage bucket for call recordings';
END $$;
