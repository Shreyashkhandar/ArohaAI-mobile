import { supabase, isSupabaseConfigured } from '../../lib/supabase';

/**
 * Submit a daily check-in response to public.checkins table,
 * and trigger AI analysis via backend service to store in public.ai_results.
 * 
 * @param {string} response Text response (e.g. 'Good', 'Okay', 'Not great', 'Difficult')
 */
export async function submitCheckIn(response) {
  if (!response || typeof response !== 'string' || !response.trim()) {
    throw new Error('Please select how you are feeling today.');
  }

  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Please check your connection.');
  }

  // 1. Get authenticated user securely from Supabase
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    throw new Error('User session not found. Please log in again.');
  }

  const userId = userData.user.id;

  try {
    // 2. Insert row into public.checkins
    const { data: checkinData, error: checkinError } = await supabase
      .from('checkins')
      .insert([
        {
          user_id: userId,
          response: response.trim(),
        },
      ])
      .select()
      .single();

    if (checkinError) {
      console.warn('[checkinService] Insert error:', checkinError.message);
      if (checkinError.message?.toLowerCase().includes('network') || checkinError.status === 0) {
        throw new Error('Unable to connect. Please check your internet connection.');
      }
      throw new Error('Unable to record your check-in right now. Please try again.');
    }

    // 3. Trigger AI analysis pipeline (Failure here does NOT fail check-in submission)
    try {
      await processAndStoreAIAnalysis({
        userId: userId,
        checkinId: checkinData.id,
        response: response.trim(),
      });
    } catch (aiErr) {
      console.warn('[checkinService] AI analysis pipeline notice (check-in preserved):', aiErr.message);
    }

    return { success: true, data: checkinData };
  } catch (err) {
    throw new Error(err.message || 'An error occurred while submitting your check-in.');
  }
}

/**
 * Helper to process AI analysis with FastAPI backend and persist in public.ai_results.
 */
async function processAndStoreAIAnalysis({ userId, checkinId, response }) {
  // Check if AI result already exists for this checkin_id to avoid duplicate processing
  const { data: existing } = await supabase
    .from('ai_results')
    .select('id')
    .eq('checkin_id', checkinId)
    .maybeSingle();

  if (existing) {
    return existing;
  }

  const aiServiceUrl = process.env.EXPO_PUBLIC_AI_SERVICE_URL || 'http://127.0.0.1:8001';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  const res = await fetch(`${aiServiceUrl}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: userId,
      checkin_id: checkinId,
      response: response,
    }),
    signal: controller.signal,
  });

  clearTimeout(timeoutId);

  if (!res.ok) {
    throw new Error(`AI service returned HTTP status ${res.status}`);
  }

  const aiResult = await res.json();

  if (!aiResult || !aiResult.checkin_id) {
    throw new Error('Invalid or malformed AI analysis response structure.');
  }

  // Insert valid AI analysis into public.ai_results
  const { data: storedResult, error: insertError } = await supabase
    .from('ai_results')
    .insert([
      {
        checkin_id: checkinId,
        user_id: userId,
        indicators: aiResult.indicators || [],
        change_detected: Boolean(aiResult.change_detected),
        explanation: aiResult.explanation || 'Analysis service is connected successfully.',
        requires_counsellor_review: Boolean(aiResult.requires_counsellor_review),
      },
    ])
    .select()
    .single();

  if (insertError) {
    console.warn('[checkinService] Error inserting ai_results row:', insertError.message);
    throw insertError;
  }

  return storedResult;
}

/**
 * Check if the currently authenticated user has already submitted a check-in today.
 *
 * @returns {Promise<Object|null>} The check-in record if found, otherwise null.
 */
export async function getTodayCheckIn() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return null;

    const userId = userData.user.id;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    const { data, error } = await supabase
      .from('checkins')
      .select('id, user_id, response, created_at')
      .eq('user_id', userId)
      .gte('created_at', todayStart.toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('[checkinService] getTodayCheckIn error:', error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.warn('[checkinService] getTodayCheckIn exception:', err.message);
    return null;
  }
}

/**
 * Fetch check-in history for a specific user ID.
 * Ordered by created_at DESC.
 * 
 * @param {string} userId Target user UUID
 */
export async function getUserCheckInHistory(userId) {
  if (!userId) return [];

  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('checkins')
      .select('id, user_id, response, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[checkinService] getUserCheckInHistory error:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.warn('[checkinService] getUserCheckInHistory exception:', err.message);
    return [];
  }
}
