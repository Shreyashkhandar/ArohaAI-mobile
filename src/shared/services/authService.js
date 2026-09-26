import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { ROLES } from '../types/roles';

/**
 * Register a new user with email, password, full name, and role.
 * 
 * @param {Object} params
 * @param {string} params.fullName
 * @param {string} params.email
 * @param {string} params.password
 * @param {string} params.confirmPassword
 * @param {string} params.role ('User' or 'Counsellor')
 */
export async function registerWithEmail({ fullName, email, password, confirmPassword, role }) {
  if (!fullName || !fullName.trim()) {
    throw new Error('Please enter your full name.');
  }

  if (!email || !email.trim()) {
    throw new Error('Please enter your email address.');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    throw new Error('Please enter a valid email address.');
  }

  if (!password) {
    throw new Error('Please enter a password.');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  if (password !== confirmPassword) {
    throw new Error('Passwords do not match. Please verify your password.');
  }

  const normalizedRole = String(role || ROLES.USER).toLowerCase();
  if (normalizedRole !== ROLES.USER && normalizedRole !== ROLES.COUNSELLOR) {
    throw new Error('Invalid role selected.');
  }

  if (!isSupabaseConfigured()) {
    throw new Error('Supabase credentials are required in .env before authentication can be tested.');
  }

  try {
    // 1. Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          role: normalizedRole,
        },
      },
    });

    if (authError) {
      if (authError.message?.toLowerCase().includes('already registered') || authError.status === 422) {
        throw new Error('An account with this email address already exists. Please login instead.');
      }
      if (authError.message?.toLowerCase().includes('network') || authError.status === 0) {
        throw new Error('Unable to connect. Please check your internet connection.');
      }
      throw new Error(authError.message || 'Registration failed. Please try again.');
    }

    const user = authData?.user;
    if (!user) {
      throw new Error('Registration failed. No user record returned.');
    }

    // 2. Client Profile Creation (Primary or Fallback)
    let profile = await getUserProfile(user.id);
    if (!profile) {
      const profileRow = {
        id: user.id,
        user_id: user.id,
        full_name: fullName.trim(),
        email: email.trim(),
        role: normalizedRole,
      };

      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .upsert(profileRow)
        .select()
        .single();

      if (!profileError && newProfile) {
        profile = newProfile;
      } else {
        profile = profileRow;
      }
    }

    return {
      success: true,
      user,
      profile,
      session: authData.session,
    };
  } catch (error) {
    throw new Error(error.message || 'An unexpected registration error occurred.');
  }
}

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
    let profile = await getUserProfile(user.id);
    if (!profile) {
      const metaName = user.user_metadata?.full_name || '';
      const metaRole = String(user.user_metadata?.role || selectedRole || ROLES.USER).toLowerCase();

      const profileRow = {
        id: user.id,
        user_id: user.id,
        full_name: metaName,
        email: user.email,
        role: metaRole,
      };

      const { data: createdProfile } = await supabase
        .from('profiles')
        .upsert(profileRow)
        .select()
        .single();

      profile = createdProfile || profileRow;
    }

    // 3. Strict RBAC Validation: Compare UI selected role against actual database role
    const normalizedSelectedRole = String(selectedRole || '').toUpperCase();
    const normalizedDatabaseRole = String(profile.role || '').toUpperCase();

    if (normalizedSelectedRole !== normalizedDatabaseRole) {
      // Access denied due to role mismatch - sign out immediately
      await supabase.auth.signOut();
      throw new Error('Account role does not match the selected role.');
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
 * Send password reset email to user.
 * 
 * @param {string} email 
 */
export async function resetPasswordForEmail(email) {
  if (!email || !email.trim()) {
    throw new Error('Please enter your email address.');
  }

  if (!isSupabaseConfigured()) {
    throw new Error('Supabase credentials are required in .env before authentication can be tested.');
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (error) {
      throw new Error(error.message || 'Failed to send password reset email.');
    }
    return { success: true };
  } catch (error) {
    throw new Error(error.message || 'Unable to request password reset.');
  }
}

/**
 * Fetch profile for a specific user ID from the profiles table.
 * Supports querying by either user_id or id for compatibility.
 */
export async function getUserProfile(userId) {
  if (!userId) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, user_id, full_name, email, phone, role, created_at, updated_at')
      .or(`user_id.eq.${userId},id.eq.${userId}`)
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      // Fallback query matching id directly
      const { data: idData } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, email, phone, role, created_at, updated_at')
        .eq('id', userId)
        .maybeSingle();
      return idData || null;
    }

    return data;
  } catch (err) {
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
