-- Migration: 006_create_interventions.sql
-- Description: Creates public.interventions table for case management support & intervention tracking.

CREATE TABLE IF NOT EXISTS public.interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  counsellor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  support_type TEXT NOT NULL,
  support_objective TEXT NOT NULL,
  action_taken TEXT,
  next_steps TEXT,
  review_date TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (LOWER(status) IN ('planned', 'active', 'completed', 'paused')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS interventions_case_id_idx ON public.interventions(case_id);
CREATE INDEX IF NOT EXISTS interventions_user_id_idx ON public.interventions(user_id);
CREATE INDEX IF NOT EXISTS interventions_counsellor_id_idx ON public.interventions(counsellor_id);

ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;

-- 1. Counsellors can insert interventions for cases assigned to them
DROP POLICY IF EXISTS "Counsellors can insert interventions" ON public.interventions;
CREATE POLICY "Counsellors can insert interventions"
ON public.interventions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = counsellor_id);

-- 2. Counsellors and users can view relevant interventions
DROP POLICY IF EXISTS "Counsellors and users can select interventions" ON public.interventions;
CREATE POLICY "Counsellors and users can select interventions"
ON public.interventions
FOR SELECT
TO authenticated
USING (auth.uid() = counsellor_id OR auth.uid() = user_id);

-- 3. Counsellors can update interventions assigned to them
DROP POLICY IF EXISTS "Counsellors can update interventions" ON public.interventions;
CREATE POLICY "Counsellors can update interventions"
ON public.interventions
FOR UPDATE
TO authenticated
USING (auth.uid() = counsellor_id)
WITH CHECK (auth.uid() = counsellor_id);
