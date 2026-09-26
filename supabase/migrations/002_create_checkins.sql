-- Migration: 002_create_checkins.sql
-- Description: Creates the checkins table with user_id reference, response text, indices, and RLS policies for authenticated users and assigned counsellors.

CREATE TABLE IF NOT EXISTS public.checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL
    REFERENCES auth.users(id)
    ON DELETE CASCADE,

  response TEXT NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS checkins_user_id_idx
ON public.checkins(user_id);

CREATE INDEX IF NOT EXISTS checkins_created_at_idx
ON public.checkins(created_at);

ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create their own checkins" ON public.checkins;
CREATE POLICY "Users can create their own checkins"
ON public.checkins
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own checkins" ON public.checkins;
CREATE POLICY "Users can view their own checkins"
ON public.checkins
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Counsellors can view checkins for assigned cases" ON public.checkins;
CREATE POLICY "Counsellors can view checkins for assigned cases"
ON public.checkins
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.cases
    WHERE public.cases.user_id = public.checkins.user_id
    AND public.cases.counsellor_id = auth.uid()
  )
);
