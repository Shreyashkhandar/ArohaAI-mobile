import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Authenticate user with email and password, then verify selected role against database profile role.
 * 
 * @param {string} email 
 * @param {string} password 
 * @param {string} selectedRole UI selected role ('User' or 'Counsellor')
 */
export async function loginWithEmail(email, password, selectedRole) {
  if (!email || !email.trim()) {
    throw new Error('Please enter your email address.');
  }

  if (!password || !password.trim()) {
    throw new Error('Please enter your password.');
  }

  if (!isSupabaseConfigured()) {
    throw new Error('Supabase credentials are required in .env before authentication can be tested.');
  }

  try {
    // 1. Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      if (authError.message?.toLowerCase().includes('invalid login credentials')) {
        throw new Error('Invalid email or password.');
      }
      if (authError.message?.toLowerCase().includes('network') || authError.status === 0) {
        throw new Error('Unable to connect. Please check your internet connection.');
      }
      throw new Error(authError.message || 'Authentication failed. Please try again.');
    }

    const user = authData?.user;
    if (!user) {
      throw new Error('Authentication failed. No user record returned.');
    }

    // 2. Retrieve user profile & actual role from database
    const profile = await getUserProfile(user.id);
    if (!profile) {
      // Sign out since profile lookup failed
      await supabase.auth.signOut();
      throw new Error('User profile not found. Please contact an administrator.');
    }

    // 3. RBAC Validation: Compare UI selected role against actual database role
    const normalizedSelectedRole = String(selectedRole || '').toUpperCase();
    const normalizedDatabaseRole = String(profile.role || '').toUpperCase();

    if (normalizedSelectedRole !== normalizedDatabaseRole) {
      // Access denied due to role mismatch - sign out immediately
      await supabase.auth.signOut();
      throw new Error('Role mismatch. You do not have permission to log in as the selected role.');
    }

    return {
      success: true,
      user,
      profile,
      session: authData.session,
    };
  } catch (error) {
    throw new Error(error.message || 'An unexpected authentication error occurred.');
  }
}

/**
 * Fetch profile for a specific user ID from the profiles table.
 */
export async function getUserProfile(userId) {
  if (!userId) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, role, created_at, updated_at')
      .eq('id', userId)
      .single();

    if (error) {
      console.warn('[authService] Profile fetch error:', error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.warn('[authService] Unexpected profile query error:', err.message);
    return null;
  }
}

/**
 * Get current active session.
 */
export async function getCurrentSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data?.session || null;
  } catch (err) {
    return null;
  }
}

/**
 * Get current authenticated user.
 */
export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data?.user || null;
  } catch (err) {
    return null;
  }
}

/**
 * Subscribe to auth state changes.
 */
export function onAuthStateChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
  return subscription;
}

/**
 * Sign out current user.
 */
export async function logout() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (err) {
    throw new Error('Failed to log out. Please try again.');
  }
}
