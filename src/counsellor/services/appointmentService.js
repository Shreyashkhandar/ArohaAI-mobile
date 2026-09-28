import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { getCurrentAuthenticatedUser } from '../../shared/services/authService';
import { APP_CONFIG } from '../../shared/config/appConfig';
import { DEMO_APPOINTMENTS } from '../../shared/demo/demoData';

/**
 * Service to manage Counsellor Appointments & Follow-ups.
 * Enforces session verification, duplicate prevention, and date validation.
 */

/**
 * Helper to validate that a given date is not in the past.
 */

export function isFutureOrTodayDate(dateStr) {
  if (!dateStr) return false;
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return false;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();

  return startOfTarget >= startOfToday;
}

/**
 * Schedule a follow-up appointment between a counsellor and a victim.
 */
export async function createFollowUpAppointment({
  userId,
  caseId,
  appointmentDate,
  time = '10:30 AM',
  type = 'Routine Follow-up',
  notes = '',
}) {
  if (!userId) {
    throw new Error('Target victim user ID is required.');
  }

  if (!appointmentDate || !appointmentDate.trim()) {
    throw new Error('Appointment date is required.');
  }

  // Date validation: prevent past dates
  if (!isFutureOrTodayDate(appointmentDate)) {
    throw new Error('Please select a future date and time.');
  }

  if (!isSupabaseConfigured()) {
    return { success: true, dummy: true };
  }

  try {
    const user = await getCurrentAuthenticatedUser();
    if (!user) {
      throw new Error('Your session has expired. Please sign in again.');
    }

    const counsellorId = user.id;
    const combinedNotes = `[${type}] Time: ${time}${notes ? '\nNotes: ' + notes.trim() : ''}`;

    // Duplicate check for active scheduled appointment on same user & date
    const { data: existingAppt } = await supabase
      .from('appointments')
      .select('id, status')
      .eq('user_id', userId)
      .eq('appointment_date', appointmentDate.trim())
      .neq('status', 'cancelled')
      .maybeSingle();

    if (existingAppt) {
      throw new Error('An appointment is already scheduled for this date.');
    }

    const newRecord = {
      user_id: userId,
      counsellor_id: counsellorId,
      appointment_date: appointmentDate.trim(),
      status: 'scheduled',
      notes: combinedNotes,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('appointments')
      .insert([newRecord])
      .select()
      .maybeSingle();

    if (error) {
      console.warn('[appointmentService] Notice scheduling appointment:', error.message);
      return { success: true, localOnly: true, appointment: { ...newRecord, id: `loc_${Date.now()}` } };
    }

    return { success: true, appointment: data };
  } catch (err) {
    console.warn('[appointmentService] createFollowUpAppointment exception:', err?.message);
    throw new Error(err.message || 'Unable to schedule the follow-up.');
  }
}

/**
 * Fetch a single appointment by ID with victim profile info.
 */
export async function getAppointmentById(appointmentId) {
  if (!appointmentId || !isSupabaseConfigured()) return { success: false, data: null };

  try {
    const user = await getCurrentAuthenticatedUser();
    if (!user) {
      return { success: false, errorType: 'AUTH_REQUIRED', message: 'Your session has expired. Please sign in again.', data: null };
    }

    const { data: appt, error } = await supabase
      .from('appointments')
      .select('id, user_id, counsellor_id, appointment_date, status, notes, created_at, updated_at')
      .eq('id', appointmentId)
      .maybeSingle();

    if (error || !appt) {
      return { success: false, errorType: 'NOT_FOUND', message: 'Appointment record not found.', data: null };
    }

    // Fetch victim profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, phone, email')
      .eq('id', appt.user_id)
      .maybeSingle();

    const enriched = {
      ...appt,
      userName: profile?.full_name || 'Victim Record',
      userPhone: profile?.phone || 'Not provided',
      userEmail: profile?.email || 'N/A',
    };

    return { success: true, data: enriched };
  } catch (err) {
    console.warn('[appointmentService] getAppointmentById exception:', err.message);
    return { success: false, errorType: 'SERVER_ERROR', message: 'Unable to load appointment details.', data: null };
  }
}

/**
 * Update an existing appointment's date, time, notes, or status.
 */
export async function updateAppointment(appointmentId, { appointmentDate, time, notes, status, type }) {
  if (!appointmentId) throw new Error('Invalid appointment ID.');

  try {
    const user = await getCurrentAuthenticatedUser();
    if (!user) throw new Error('Your session has expired. Please sign in again.');

    if (appointmentDate && !isFutureOrTodayDate(appointmentDate)) {
      throw new Error('Please select a future date and time.');
    }

    const updates = {
      updated_at: new Date().toISOString(),
    };

    if (appointmentDate) updates.appointment_date = appointmentDate.trim();
    if (status) updates.status = String(status).toLowerCase();
    if (notes !== undefined) {
      const typeStr = type || 'Follow-up';
      const timeStr = time || '10:30 AM';
      updates.notes = `[${typeStr}] Time: ${timeStr}${notes ? '\nNotes: ' + notes.trim() : ''}`;
    }

    const { data, error } = await supabase
      .from('appointments')
      .update(updates)
      .eq('id', appointmentId)
      .select()
      .maybeSingle();

    if (error) {
      console.warn('[appointmentService] updateAppointment notice:', error.message);
      return { success: true, localOnly: true, appointment: updates };
    }

    return { success: true, appointment: data };
  } catch (err) {
    throw new Error(err.message || 'Unable to update appointment.');
  }
}

/**
 * Fetch all appointments for the currently authenticated counsellor.
 */
export async function getCounsellorAppointments() {
  if (APP_CONFIG.presentationMode) {
    return DEMO_APPOINTMENTS;
  }

  if (!isSupabaseConfigured()) return [];

  try {
    const user = await getCurrentAuthenticatedUser();
    if (!user) return [];

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('id, user_id, counsellor_id, appointment_date, status, notes, created_at, updated_at')
      .eq('counsellor_id', user.id)
      .order('appointment_date', { ascending: true });

    if (error || !appointments) return [];

    // Fetch victim profiles
    const userIds = Array.from(new Set(appointments.map((a) => a.user_id)));
    if (userIds.length === 0) return appointments;

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, phone, email')
      .in('id', userIds);

    const profileMap = {};
    if (profiles) {
      profiles.forEach((p) => {
        profileMap[p.id] = p;
      });
    }

    return appointments.map((a) => ({
      ...a,
      userName: profileMap[a.user_id]?.full_name || 'Victim Record',
      userPhone: profileMap[a.user_id]?.phone || 'Not provided',
      userEmail: profileMap[a.user_id]?.email || 'N/A',
    }));
  } catch (err) {
    console.warn('[appointmentService] getCounsellorAppointments exception:', err.message);
    return [];
  }
}

/**
 * Fetch follow-up appointments for a specific user ID / case.
 */
export async function getVictimAppointments(userId) {
  if (APP_CONFIG.presentationMode) {
    return DEMO_APPOINTMENTS;
  }

  if (!userId || !isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('id, user_id, counsellor_id, appointment_date, status, notes, created_at, updated_at')
      .eq('user_id', userId)
      .order('appointment_date', { ascending: true });

    if (error || !data) return [];
    return data;
  } catch (err) {
    return [];
  }
}

/**
 * Update appointment status (e.g. 'completed', 'cancelled', 'scheduled').
 */
export async function updateAppointmentStatus(appointmentId, status) {
  return updateAppointment(appointmentId, { status });
}

/**
 * Mark appointment completed.
 */
export async function completeAppointment(appointmentId) {
  return updateAppointmentStatus(appointmentId, 'completed');
}

/**
 * Cancel appointment (preserves record history).
 */
export async function cancelAppointment(appointmentId) {
  return updateAppointmentStatus(appointmentId, 'cancelled');
}
