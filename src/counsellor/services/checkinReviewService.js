import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { getCurrentAuthenticatedUser } from '../../shared/services/authService';

/**
 * Fetch check-in history for a target victim/user assigned to the counsellor.
 * Supports date filter range: 'all', '7days', '30days'.
 * 
 * @param {string} userId Target victim user UUID
 * @param {string} filter 'all' | '7days' | '30days'
 */
export async function getCaseCheckIns(userId, filter = 'all') {
  if (!userId) {
    return { success: false, code: 'INVALID_ID', data: [] };
  }

  if (!isSupabaseConfigured()) {
    return { success: false, code: 'CONFIG_ERROR', data: [] };
  }

  try {
    // 1. Verify counsellor session
    const authUser = await getCurrentAuthenticatedUser();
    if (!authUser) {
      return { success: false, code: 'NO_SESSION', data: [] };
    }

    // 2. Build base query for public.checkins
    let query = supabase
      .from('checkins')
      .select('id, user_id, response, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // 3. Apply date filter if specified
    if (filter === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      query = query.gte('created_at', d.toISOString());
    } else if (filter === '30days') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      query = query.gte('created_at', d.toISOString());
    }

    const { data: checkins, error: checkinError } = await query;

    if (checkinError) {
      console.warn('[checkinReviewService] Error fetching checkins:', checkinError.message);
      return { success: false, code: 'DATABASE_ERROR', data: [] };
    }

    if (!checkins || checkins.length === 0) {
      return { success: true, data: [] };
    }

    // 4. Fetch associated AI results for these check-ins
    const checkinIds = checkins.map((c) => c.id);
    const { data: aiResults } = await supabase
      .from('ai_results')
      .select('id, checkin_id, indicators, explanation, requires_counsellor_review, created_at')
      .in('checkin_id', checkinIds);

    const aiMap = {};
    if (aiResults) {
      aiResults.forEach((res) => {
        aiMap[res.checkin_id] = res;
      });
    }

    // 5. Combine check-ins with AI review indicators
    const enriched = checkins.map((c) => ({
      ...c,
      aiResult: aiMap[c.id] || null,
      assessmentIndicator: aiMap[c.id]?.requires_counsellor_review ? 'Follow-up Suggested' : 'Regular',
    }));

    return { success: true, data: enriched };
  } catch (err) {
    console.warn('[checkinReviewService] getCaseCheckIns exception:', err.message);
    return { success: false, code: 'UNEXPECTED_ERROR', data: [] };
  }
}

/**
 * Get full details for a single check-in record.
 * 
 * @param {string} checkinId Check-in UUID
 */
export async function getCheckInDetails(checkinId) {
  if (!checkinId) {
    return { success: false, code: 'INVALID_ID', data: null };
  }

  try {
    const authUser = await getCurrentAuthenticatedUser();
    if (!authUser) {
      return { success: false, code: 'NO_SESSION', data: null };
    }

    const { data: checkin, error } = await supabase
      .from('checkins')
      .select('id, user_id, response, created_at')
      .eq('id', checkinId)
      .single();

    if (error || !checkin) {
      return { success: false, code: 'NOT_FOUND', data: null };
    }

    const { data: aiResult } = await supabase
      .from('ai_results')
      .select('id, indicators, explanation, requires_counsellor_review, created_at')
      .eq('checkin_id', checkinId)
      .maybeSingle();

    return {
      success: true,
      data: {
        ...checkin,
        aiResult: aiResult || null,
      },
    };
  } catch (err) {
    console.warn('[checkinReviewService] getCheckInDetails exception:', err.message);
    return { success: false, code: 'UNEXPECTED_ERROR', data: null };
  }
}

/**
 * Fetch the single latest check-in record for a victim.
 * 
 * @param {string} userId Target victim user UUID
 */
export async function getLatestCheckIn(userId) {
  if (!userId) return null;
  try {
    const { data, error } = await supabase
      .from('checkins')
      .select('id, user_id, response, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return null;
    return data;
  } catch (err) {
    return null;
  }
}
