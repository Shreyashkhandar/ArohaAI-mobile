import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { getCurrentAuthenticatedUser } from '../../shared/services/authService';

/**
 * Service to manage Counsellor Intervention Plans and Records.
 * Follows ArohaAI auth verification & RLS standards with robust fallback handling.
 */

const INTERVENTION_TAG_START = '[INTERVENTION_PLAN_RECORD]';
const INTERVENTION_TAG_END = '[/INTERVENTION_PLAN_RECORD]';

/**
 * Helper to parse structured intervention records stored in case notes fallback
 */
function parseInterventionsFromNotes(notesText) {
  if (!notesText || typeof notesText !== 'string') return [];
  const items = [];
  let searchIdx = 0;

  while (searchIdx < notesText.length) {
    const startIdx = notesText.indexOf(INTERVENTION_TAG_START, searchIdx);
    if (startIdx === -1) break;

    const endIdx = notesText.indexOf(INTERVENTION_TAG_END, startIdx);
    if (endIdx === -1) break;

    const jsonStr = notesText.substring(startIdx + INTERVENTION_TAG_START.length, endIdx).trim();
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && parsed.id) {
        items.push(parsed);
      }
    } catch (e) {
      console.warn('[interventionService] Failed to parse note intervention fallback:', e.message);
    }

    searchIdx = endIdx + INTERVENTION_TAG_END.length;
  }

  // Sort newest first
  return items.sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt));
}

/**
 * Helper to serialize an intervention item into notes fallback text
 */
function serializeInterventionToNote(item) {
  return `${INTERVENTION_TAG_START}\n${JSON.stringify(item, null, 2)}\n${INTERVENTION_TAG_END}`;
}

/**
 * Fetch all intervention records for a specific case ID.
 */
export async function getCaseInterventions(caseId) {
  if (!caseId) {
    return { success: false, errorType: 'INVALID_PARAM', message: 'Case ID is required.', data: [] };
  }

  if (!isSupabaseConfigured()) {
    return { success: false, errorType: 'CONFIG_ERROR', message: 'Supabase is not configured.', data: [] };
  }

  try {
    const user = await getCurrentAuthenticatedUser();
    if (!user) {
      return { success: false, errorType: 'AUTH_REQUIRED', message: 'Your session has expired. Please sign in again.', data: [] };
    }

    // Try primary Supabase table query first
    const { data, error } = await supabase
      .from('interventions')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      return { success: true, data };
    }

    // If table doesn't exist or returns DB error, check case.notes for fallback storage
    console.log('[interventionService] Querying fallback notes for case:', caseId);
    const { data: caseRecord, error: caseErr } = await supabase
      .from('cases')
      .select('notes')
      .eq('id', caseId)
      .maybeSingle();

    if (!caseErr && caseRecord && caseRecord.notes) {
      const fallbackItems = parseInterventionsFromNotes(caseRecord.notes);
      return { success: true, data: fallbackItems };
    }

    return { success: true, data: [] };
  } catch (err) {
    console.warn('[interventionService] Error in getCaseInterventions:', err.message);
    return { success: false, errorType: 'SERVER_ERROR', message: 'Unable to load intervention information.', data: [] };
  }
}

/**
 * Fetch a single intervention by its unique ID.
 */
export async function getInterventionById(interventionId, caseId = null) {
  if (!interventionId) {
    return { success: false, errorType: 'INVALID_PARAM', message: 'Intervention ID is required.', data: null };
  }

  try {
    const user = await getCurrentAuthenticatedUser();
    if (!user) {
      return { success: false, errorType: 'AUTH_REQUIRED', message: 'Your session has expired. Please sign in again.', data: null };
    }

    // Try direct query
    const { data, error } = await supabase
      .from('interventions')
      .select('*')
      .eq('id', interventionId)
      .maybeSingle();

    if (!error && data) {
      return { success: true, data };
    }

    // Fallback search if caseId provided or from notes
    if (caseId) {
      const res = await getCaseInterventions(caseId);
      if (res.success && res.data) {
        const found = res.data.find((item) => item.id === interventionId);
        if (found) return { success: true, data: found };
      }
    }

    return { success: false, errorType: 'NOT_FOUND', message: 'Intervention record not found.', data: null };
  } catch (err) {
    console.warn('[interventionService] Error in getInterventionById:', err.message);
    return { success: false, errorType: 'SERVER_ERROR', message: 'Unable to load intervention details.', data: null };
  }
}

/**
 * Create a new intervention plan record.
 */
export async function createIntervention(payload) {
  const { case_id, user_id, support_type, support_objective, action_taken, next_steps, review_date, status = 'active' } = payload || {};

  if (!case_id) {
    return { success: false, errorType: 'VALIDATION_ERROR', message: 'Case ID is required.' };
  }

  if (!support_objective || !support_objective.trim()) {
    return { success: false, errorType: 'VALIDATION_ERROR', message: 'Support objective is required.' };
  }

  try {
    const user = await getCurrentAuthenticatedUser();
    if (!user) {
      return { success: false, errorType: 'AUTH_REQUIRED', message: 'Your session has expired. Please sign in again.' };
    }

    const authUserId = user.id;

    const newRecord = {
      case_id,
      user_id: user_id || authUserId,
      counsellor_id: authUserId,
      support_type: support_type || 'Counselling',
      support_objective: support_objective.trim(),
      action_taken: action_taken ? action_taken.trim() : '',
      next_steps: next_steps ? next_steps.trim() : '',
      review_date: review_date ? review_date.trim() : '',
      status: (status || 'active').toLowerCase(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Attempt DB Insert
    const { data, error } = await supabase
      .from('interventions')
      .insert([newRecord])
      .select()
      .single();

    if (!error && data) {
      return { success: true, data };
    }

    console.warn('[interventionService] Database insert error, writing fallback notes block:', error?.message);

    // Fallback: Append structured note to cases table
    const generateId = `int_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fallbackRecord = { ...newRecord, id: generateId };

    const { data: caseObj } = await supabase
      .from('cases')
      .select('notes')
      .eq('id', case_id)
      .maybeSingle();

    const existingNotes = caseObj?.notes || '';
    const noteBlock = serializeInterventionToNote(fallbackRecord);
    const updatedNotes = existingNotes ? `${noteBlock}\n\n${existingNotes}` : noteBlock;

    await supabase
      .from('cases')
      .update({ notes: updatedNotes, updated_at: new Date().toISOString() })
      .eq('id', case_id);

    return { success: true, data: fallbackRecord };
  } catch (err) {
    console.warn('[interventionService] Error creating intervention:', err.message);
    return { success: false, errorType: 'SERVER_ERROR', message: 'Unable to save the intervention plan.' };
  }
}

/**
 * Update an existing intervention plan.
 */
export async function updateIntervention(interventionId, payload) {
  if (!interventionId) {
    return { success: false, errorType: 'VALIDATION_ERROR', message: 'Intervention ID is required.' };
  }

  const { support_type, support_objective, action_taken, next_steps, review_date, status } = payload || {};

  if (support_objective !== undefined && !support_objective.trim()) {
    return { success: false, errorType: 'VALIDATION_ERROR', message: 'Support objective cannot be empty.' };
  }

  try {
    const user = await getCurrentAuthenticatedUser();
    if (!user) {
      return { success: false, errorType: 'AUTH_REQUIRED', message: 'Your session has expired. Please sign in again.' };
    }

    const updates = {
      updated_at: new Date().toISOString(),
    };

    if (support_type !== undefined) updates.support_type = support_type;
    if (support_objective !== undefined) updates.support_objective = support_objective.trim();
    if (action_taken !== undefined) updates.action_taken = action_taken.trim();
    if (next_steps !== undefined) updates.next_steps = next_steps.trim();
    if (review_date !== undefined) updates.review_date = review_date.trim();
    if (status !== undefined) updates.status = status.toLowerCase();

    // Try direct DB update
    const { data, error } = await supabase
      .from('interventions')
      .update(updates)
      .eq('id', interventionId)
      .select()
      .maybeSingle();

    if (!error && data) {
      return { success: true, data };
    }

    // Fallback for cases notes
    if (payload.case_id) {
      const { data: caseObj } = await supabase
        .from('cases')
        .select('notes')
        .eq('id', payload.case_id)
        .maybeSingle();

      if (caseObj && caseObj.notes) {
        const items = parseInterventionsFromNotes(caseObj.notes);
        const targetIdx = items.findIndex((i) => i.id === interventionId);
        if (targetIdx !== -1) {
          items[targetIdx] = { ...items[targetIdx], ...updates };
          // Re-serialize all
          const nonInterventionNotes = caseObj.notes.replace(/\[INTERVENTION_PLAN_RECORD\][\s\S]*?\[\/INTERVENTION_PLAN_RECORD\]/g, '').trim();
          const newInterventionBlocks = items.map(serializeInterventionToNote).join('\n\n');
          const finalNotes = [newInterventionBlocks, nonInterventionNotes].filter(Boolean).join('\n\n');

          await supabase
            .from('cases')
            .update({ notes: finalNotes, updated_at: new Date().toISOString() })
            .eq('id', payload.case_id);

          return { success: true, data: items[targetIdx] };
        }
      }
    }

    return { success: false, errorType: 'UPDATE_FAILED', message: 'Unable to update intervention plan.' };
  } catch (err) {
    console.warn('[interventionService] Error updating intervention:', err.message);
    return { success: false, errorType: 'SERVER_ERROR', message: 'Unable to update the intervention plan.' };
  }
}

/**
 * Mark an intervention record as completed.
 */
export async function completeIntervention(interventionId, caseId = null) {
  return updateIntervention(interventionId, { status: 'completed', case_id: caseId });
}
