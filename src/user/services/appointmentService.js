import { supabase, isSupabaseConfigured } from '../../lib/supabase';

/**
 * Fetch upcoming appointment for authenticated user ID.
 * Returns null if no appointments exist or table is not present.
 */
export async function getUpcomingAppointment() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return null;

    const userId = userData.user.id;

    // Safely query appointments table
    const { data, error } = await supabase
      .from('appointments')
      .select('id, appointment_date, status, counsellor_id')
      .eq('user_id', userId)
      .gte('appointment_date', new Date().toISOString())
      .order('appointment_date', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      // Table doesn't exist or query returned no records
      return null;
    }

    return data;
  } catch (err) {
    console.warn('[appointmentService] getUpcomingAppointment error:', err?.message);
    return null;
  }
}
