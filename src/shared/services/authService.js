import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { ROLES } from '../types/roles';
import { APP_CONFIG } from '../config/appConfig';
import {
  DEMO_COUNSELLOR_USER,
  DEMO_COUNSELLOR_PROFILE,
  DEMO_USER,
  DEMO_USER_PROFILE,
} from '../demo/demoData';

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
        full_name: fullName.trim(),
        email: email.trim(),
        role: normalizedRole,
      };

      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .upsert([profileRow])
        .select()
        .maybeSingle();

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
  if (APP_CONFIG.presentationMode) {
    const isCounsellor = String(selectedRole || '').toLowerCase() === 'counsellor' || (email && email.toLowerCase().includes('counsellor'));
    if (isCounsellor) {
      return {
        success: true,
        user: DEMO_COUNSELLOR_USER,
        profile: DEMO_COUNSELLOR_PROFILE,
        session: { user: DEMO_COUNSELLOR_USER },
      };
    }
    return {
      success: true,
      user: DEMO_USER,
      profile: DEMO_USER_PROFILE,
      session: { user: DEMO_USER },
    };
  }

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
        full_name: metaName,
        email: user.email,
        role: metaRole,
      };

      const { data: createdProfile } = await supabase
        .from('profiles')
        .upsert([profileRow])
        .select()
        .maybeSingle();

      profile = createdProfile || profileRow;
    }

    if (!profile || !profile.role) {
      throw new Error('Your account is authenticated, but your counsellor profile is incomplete. Please contact an administrator.');
    }

    // 3. Role Validation & Resolution
    const databaseRole = String(profile.role).toLowerCase();

    // If UI specifically requested 'counsellor' but the account is 'user', reject login
    if (selectedRole && String(selectedRole).toLowerCase() === 'counsellor' && databaseRole !== 'counsellor') {
      await supabase.auth.signOut();
      throw new Error('Account does not have Counsellor privileges.');
    }

    console.log('[AUTH DEBUG] Login successful');
    console.log('[AUTH DEBUG] Auth user ID:', user.id);
    console.log('[AUTH DEBUG] signIn session exists:', Boolean(authData.session));

    // Verify getSession() immediately after login
    const sessionCheck = await getCurrentAuthSession();
    console.log('[AUTH DEBUG] getSession after login:', Boolean(sessionCheck));
    console.log('[AUTH DEBUG] auth user id:', sessionCheck?.user?.id || user.id);

    return {
      success: true,
      user,
      profile,
      session: authData.session || sessionCheck,
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
 */
export async function getUserProfile(userId) {
  if (!userId) return null;

  if (APP_CONFIG.presentationMode) {
    if (userId === DEMO_COUNSELLOR_USER.id) {
      return DEMO_COUNSELLOR_PROFILE;
    }
    return DEMO_USER_PROFILE;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, role, created_at, updated_at')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('[authService] getUserProfile error:', error?.message);
      return null;
    }

    return data || null;
  } catch (err) {
    console.warn('[authService] getUserProfile exception:', err?.message);
    return null;
  }
}

/**
 * Get current active Supabase auth session safely with developer debug logging.
 * Returns the session object if present, otherwise returns null.
 */
export async function getCurrentAuthSession() {
  if (!isSupabaseConfigured()) {
    console.log('[AUTH DEBUG] Supabase is not configured');
    return null;
  }
  try {
    console.log('[AUTH DEBUG] Session check started');
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.warn('[AUTH DEBUG] getSession error:', error.message);
      return null;
    }

    const session = data?.session || null;
    if (session) {
      console.log('[AUTH DEBUG] Session exists: true');
      console.log('[AUTH DEBUG] Auth user id:', session.user?.id);
    } else {
      console.log('[AUTH DEBUG] Session exists: false');
    }
    console.log('[AUTH DEBUG] Session restoration completed');
    return session;
  } catch (err) {
    console.warn('[AUTH DEBUG] getSession exception:', err?.message || err);
    return null;
  }
}

/**
 * Obtain the currently authenticated Supabase user safely.
 * Checks active session in memory/storage first, falling back to auth.getUser().
 */
export async function getCurrentAuthenticatedUser() {
  if (!isSupabaseConfigured()) {
    return null;
  }
  try {
    const session = await getCurrentAuthSession();
    if (session?.user) {
      return session.user;
    }

    const { data, error } = await supabase.auth.getUser();
    if (error) {
      if (!error.message?.toLowerCase().includes('session missing')) {
        console.warn('[AUTH DEBUG] getUser notice:', error.message);
      }
      return null;
    }
    return data?.user || null;
  } catch (err) {
    console.warn('[AUTH DEBUG] getCurrentAuthenticatedUser exception:', err?.message || err);
    return null;
  }
}

/**
 * Get current active session (legacy alias).
 */
export async function getCurrentSession() {
  return getCurrentAuthSession();
}

/**
 * Get current authenticated user (legacy alias).
 */
export async function getCurrentUser() {
  return getCurrentAuthenticatedUser();
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
 * Helper to obtain and verify an active authenticated counsellor session.
 * 
 * 1. Obtains the current active session.
 * 2. Verifies session.user exists.
 * 3. Fetches user profile using profiles.id = session.user.id.
 * 4. Verifies profile.role === 'counsellor'.
 * 5. Returns { session, user: session.user, profile, counsellorId: session.user.id }.
 */
export async function requireCounsellorSession() {
  if (APP_CONFIG.presentationMode) {
    return {
      session: { user: DEMO_COUNSELLOR_USER },
      user: DEMO_COUNSELLOR_USER,
      profile: DEMO_COUNSELLOR_PROFILE,
      counsellorId: DEMO_COUNSELLOR_USER.id,
    };
  }

  if (!isSupabaseConfigured()) {
    const err = new Error('Supabase is not configured.');
    err.errorType = 'CONFIG_ERROR';
    throw err;
  }

  const session = await getCurrentAuthSession();
  if (!session || !session.user) {
    const err = new Error('Your session has expired. Please sign in again to continue.');
    err.errorType = 'AUTH_REQUIRED';
    throw err;
  }

  let profile = await getUserProfile(session.user.id);
  if (!profile && session.user.user_metadata?.role) {
    const metaRole = String(session.user.user_metadata.role || '').toLowerCase();
    const metaName = session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'Counsellor';
    if (metaRole === ROLES.COUNSELLOR) {
      profile = {
        id: session.user.id,
        full_name: metaName,
        email: session.user.email,
        role: ROLES.COUNSELLOR,
      };
    }
  }

  if (!profile) {
    const err = new Error('Counsellor profile record not found.');
    err.errorType = 'PROFILE_NOT_FOUND';
    throw err;
  }

  const normalizedRole = String(profile.role || '').toLowerCase();
  if (normalizedRole !== ROLES.COUNSELLOR) {
    const err = new Error('Account does not have Counsellor authorization.');
    err.errorType = 'ROLE_REQUIRED';
    throw err;
  }

  return {
    session,
    user: session.user,
    profile,
    counsellorId: session.user.id,
  };
}

/**
 * Sign out current user.
 */
export async function logout() {
  if (APP_CONFIG.presentationMode) {
    return { success: true };
  }

  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (err) {
    throw new Error('Failed to log out. Please try again.');
  }
}
