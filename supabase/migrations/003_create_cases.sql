-- Migration: 003_create_cases.sql
-- Description: Creates the cases table, indices, and RLS policies for counsellors and users.

CREATE TABLE IF NOT EXISTS public.cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL
    REFERENCES auth.users(id)
    ON DELETE CASCADE,

  counsellor_id UUID NOT NULL
    REFERENCES auth.users(id)
    ON DELETE CASCADE,

  status TEXT NOT NULL DEFAULT 'active' CHECK (LOWER(status) IN ('active', 'closed')),

  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cases_user_id_idx ON public.cases(user_id);
CREATE INDEX IF NOT EXISTS cases_counsellor_id_idx ON public.cases(counsellor_id);

ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

-- 1. Counsellors can create cases where counsellor_id matches their authenticated auth.uid()
DROP POLICY IF EXISTS "Counsellors can create cases" ON public.cases;
CREATE POLICY "Counsellors can create cases"
ON public.cases
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = counsellor_id);

-- 2. Counsellors can view cases assigned to them
DROP POLICY IF EXISTS "Counsellors can view assigned cases" ON public.cases;
CREATE POLICY "Counsellors can view assigned cases"
ON public.cases
FOR SELECT
TO authenticated
USING (auth.uid() = counsellor_id);

-- 3. Users can view their own case records only
DROP POLICY IF EXISTS "Users can view own cases" ON public.cases;
CREATE POLICY "Users can view own cases"
ON public.cases
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 4. Counsellors can update cases assigned to them
DROP POLICY IF EXISTS "Counsellors can update assigned cases" ON public.cases;
CREATE POLICY "Counsellors can update assigned cases"
ON public.cases
FOR UPDATE
TO authenticated
USING (auth.uid() = counsellor_id)
WITH CHECK (auth.uid() = counsellor_id);
