import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { APP_CONFIG } from '../../shared/config/appConfig';
import { DEMO_COUNSELLOR_PROFILE } from '../../shared/demo/demoData';

/**
 * Fetch assigned counsellor profile for the currently authenticated user.
 * 
 * Logic:
 * 1. Get currently authenticated user.
 * 2. Find active case in `cases` table for this user.
 * 3. Extract `counsellor_id`.
 * 4. Fetch profile from `profiles` table matching `id = counsellor_id`.
 * 5. Return profile object { id, full_name, email, phone, role }.
 * 
 * @returns {Promise<{ success: boolean, counsellor: Object|null, errorType?: string, message?: string }>}
 */
export async function getAssignedCounsellor() {
  if (APP_CONFIG.presentationMode) {
    return {
      success: true,
      counsellor: DEMO_COUNSELLOR_PROFILE,
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      success: false,
      counsellor: null,
      errorType: 'CONFIG_ERROR',
      message: 'Supabase is not configured.',
    };
  }

  try {
    // 1. Get current authenticated user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return {
        success: false,
        counsellor: null,
        errorType: 'AUTH_REQUIRED',
        message: 'No active authentication session.',
      };
    }

    const userId = userData.user.id;

    // 2. Query user's active case from public.cases
    const { data: caseRecord, error: caseError } = await supabase
      .from('cases')
      .select('counsellor_id, status')
      .eq('user_id', userId)
      .neq('status', 'closed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (caseError) {
      console.warn('[counsellorService] Case lookup database error:', caseError.message);
      return {
        success: false,
        counsellor: null,
        errorType: 'DATABASE_ERROR',
        message: 'Unable to load your counsellor details.',
      };
    }

    if (!caseRecord || !caseRecord.counsellor_id) {
      return {
        success: true,
        counsellor: null, // No counsellor assigned yet
      };
    }

    // 3. Fetch counsellor profile from public.profiles
    const { data: counsellorProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, role')
      .eq('id', caseRecord.counsellor_id)
      .maybeSingle();

    if (profileError) {
      console.warn('[counsellorService] Profile lookup database error:', profileError.message);
      return {
        success: false,
        counsellor: null,
        errorType: 'DATABASE_ERROR',
        message: 'Unable to load your counsellor details.',
      };
    }

    return {
      success: true,
      counsellor: counsellorProfile || null,
    };
  } catch (err) {
    console.warn('[counsellorService] Exception in getAssignedCounsellor:', err?.message || err);
    return {
      success: false,
      counsellor: null,
      errorType: 'UNEXPECTED_ERROR',
      message: 'Unable to load your counsellor details.',
    };
  }
}
