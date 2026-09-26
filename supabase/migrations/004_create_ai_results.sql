-- Migration: 004_create_ai_results.sql
-- Description: Creates public.ai_results table with unique checkin_id, user_id, indicators, change_detected, explanation, and counsellor review flag with strict RLS policies.

CREATE TABLE IF NOT EXISTS public.ai_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  checkin_id UUID NOT NULL UNIQUE
    REFERENCES public.checkins(id)
    ON DELETE CASCADE,

  user_id UUID NOT NULL
    REFERENCES auth.users(id)
    ON DELETE CASCADE,

  indicators JSONB NOT NULL DEFAULT '[]'::jsonb,

  change_detected BOOLEAN NOT NULL DEFAULT false,

  explanation TEXT,

  requires_counsellor_review BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_results_checkin_id_idx ON public.ai_results(checkin_id);
CREATE INDEX IF NOT EXISTS ai_results_user_id_idx ON public.ai_results(user_id);
CREATE INDEX IF NOT EXISTS ai_results_created_at_idx ON public.ai_results(created_at);

ALTER TABLE public.ai_results ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only assigned counsellors can view AI results for users in their assigned cases
DROP POLICY IF EXISTS "Counsellors can view ai_results for assigned cases" ON public.ai_results;
CREATE POLICY "Counsellors can view ai_results for assigned cases"
ON public.ai_results
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.cases
    WHERE public.cases.user_id = public.ai_results.user_id
    AND public.cases.counsellor_id = auth.uid()
  )
);

-- RLS Policy: Authenticated users can insert ai_results matching their user_id
DROP POLICY IF EXISTS "Users can insert ai_results for own checkins" ON public.ai_results;
CREATE POLICY "Users can insert ai_results for own checkins"
ON public.ai_results
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
