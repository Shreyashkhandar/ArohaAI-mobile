import { supabase, isSupabaseConfigured } from '../../lib/supabase';

/**
 * Fetch all cases assigned to the currently authenticated counsellor.
 */
export async function getCounsellorCases() {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return [];

    const counsellorId = userData.user.id;

    // Fetch cases for this counsellor
    const { data: cases, error } = await supabase
      .from('cases')
      .select('id, user_id, counsellor_id, status, notes, created_at, updated_at')
      .eq('counsellor_id', counsellorId)
      .order('created_at', { ascending: false });

    if (error || !cases) {
      console.warn('[caseService] Error fetching cases:', error?.message);
      return [];
    }

    if (cases.length === 0) return [];

    // Collect user_ids to fetch associated user profiles
    const userIds = Array.from(new Set(cases.map((c) => c.user_id)));

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, user_id, full_name, email, phone, role')
      .in('id', userIds);

    const profileMap = {};
    if (profiles) {
      profiles.forEach((p) => {
        profileMap[p.id] = p;
        if (p.user_id) profileMap[p.user_id] = p;
      });
    }

    // Attach user profile information to each case
    return cases.map((c) => {
      const userProfile = profileMap[c.user_id] || {};
      return {
        ...c,
        userName: userProfile.full_name || 'User Account',
        userEmail: userProfile.email || 'N/A',
        userPhone: userProfile.phone || 'Not provided',
      };
    });
  } catch (err) {
    console.warn('[caseService] Exception in getCounsellorCases:', err.message);
    return [];
  }
}

/**
 * Fetch all registered user profiles (role = 'user') available for case assignment.
 */
export async function getAvailableUserProfiles() {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, user_id, full_name, email, phone, role')
      .eq('role', 'user')
      .order('full_name', { ascending: true });

    if (error || !data) {
      console.warn('[caseService] Error fetching user profiles:', error?.message);
      return [];
    }

    return data;
  } catch (err) {
    console.warn('[caseService] getAvailableUserProfiles exception:', err.message);
    return [];
  }
}

/**
 * Create a new case linking the authenticated counsellor to a target user.
 * 
 * @param {Object} params
 * @param {string} params.userId Target user UUID
 * @param {string} params.notes Initial case notes
 */
export async function createCase({ userId, notes }) {
  if (!userId) {
    throw new Error('Please select a user to link to this case.');
  }

  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not properly configured.');
  }

  // 1. Get authenticated counsellor ID securely from Supabase
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    throw new Error('Authenticated counsellor session not found. Please log in again.');
  }

  const counsellorId = userData.user.id;

  try {
    const { data, error } = await supabase
      .from('cases')
      .insert([
        {
          counsellor_id: counsellorId,
          user_id: userId,
          status: 'active',
          notes: notes ? notes.trim() : '',
        },
      ])
      .select()
      .single();

    if (error) {
      console.warn('[caseService] Error creating case:', error.message);
      throw new Error('Failed to create case record. Please try again.');
    }

    return { success: true, case: data };
  } catch (err) {
    throw new Error(err.message || 'An error occurred while creating the case.');
  }
}

/**
 * Update case notes for an assigned case.
 * 
 * @param {string} caseId Case UUID
 * @param {string} notes Updated case notes
 */
export async function updateCaseNotes(caseId, notes) {
  if (!caseId) {
    throw new Error('Invalid case ID.');
  }

  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    throw new Error('Counsellor session expired. Please log in again.');
  }

  try {
    const { data, error } = await supabase
      .from('cases')
      .update({
        notes: notes ? notes.trim() : '',
        updated_at: new Date().toISOString(),
      })
      .eq('id', caseId)
      .eq('counsellor_id', userData.user.id)
      .select()
      .single();

    if (error) {
      throw new Error('Failed to update case notes.');
    }

    return { success: true, case: data };
  } catch (err) {
    throw new Error(err.message || 'Error updating case notes.');
  }
}

/**
 * Fetch AI observations records for a target user ID assigned to the authenticated counsellor.
 * Database RLS enforces that only assigned counsellors can retrieve non-empty rows.
 *
 * @param {string} userId Target user UUID
 */
export async function getCounsellorAIObservations(userId) {
  if (!userId || !isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('ai_results')
      .select('id, checkin_id, user_id, indicators, change_detected, explanation, requires_counsellor_review, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[caseService] getCounsellorAIObservations RLS/query notice:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.warn('[caseService] getCounsellorAIObservations exception:', err.message);
    return [];
  }
}
