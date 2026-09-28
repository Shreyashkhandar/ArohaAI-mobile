-- Migration: 005_counsellor_profiles_rls.sql
-- Description: Allow counsellors to view and manage victim profiles for case management.

DROP POLICY IF EXISTS "Counsellors can view victim profiles" ON public.profiles;
CREATE POLICY "Counsellors can view victim profiles"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = id
        OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND LOWER(p.role) = 'counsellor'
        )
    );

DROP POLICY IF EXISTS "Counsellors can insert victim profiles" ON public.profiles;
CREATE POLICY "Counsellors can insert victim profiles"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = id
        OR LOWER(role) = 'user'
    );
