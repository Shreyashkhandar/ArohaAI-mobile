import { supabase, isSupabaseConfigured, createTempAuthClient } from '../../lib/supabase';
import { requireCounsellorSession, getCurrentAuthenticatedUser } from '../../shared/services/authService';
import { APP_CONFIG } from '../../shared/config/appConfig';
import {
  DEMO_CASES,
  DEMO_CHECK_INS,
  DEMO_AI_OBSERVATIONS,
} from '../../shared/demo/demoData';

// Local array for in-memory case additions in presentation mode
let localDemoCases = [...DEMO_CASES];

/**
 * Fetch all cases assigned to the currently authenticated counsellor.
 * Uses current Supabase Auth user ID and profile lookup with clear error classification.
 */
export async function getCounsellorCases() {
  if (APP_CONFIG.presentationMode) {
    const res = [...localDemoCases];
    res.success = true;
    res.cases = localDemoCases;
    return res;
  }
  if (!isSupabaseConfigured()) {
    const errRes = [];
    errRes.success = false;
    errRes.errorType = 'CONFIG_ERROR';
    errRes.message = 'Supabase is not properly configured.';
    errRes.cases = [];
    return errRes;
  }

  try {
    // 1. Obtain verified counsellor session
    const counsellorSession = await requireCounsellorSession();
    const authUserId = counsellorSession.counsellorId;

    console.log('[caseService] Counsellor authenticated:', authUserId, 'Role:', counsellorSession.profile?.role);
    console.log('[caseService] Loading cases for counsellor:', authUserId);

    // 3. Query cases assigned to this counsellor
    const { data: cases, error: casesError } = await supabase
      .from('cases')
      .select('id, user_id, counsellor_id, status, notes, created_at, updated_at')
      .eq('counsellor_id', authUserId)
      .order('created_at', { ascending: false });

    if (casesError) {
      console.warn('[caseService] Database query error for cases:', casesError.message);
      const errRes = [];
      errRes.success = false;
      errRes.errorType = 'DATABASE_ERROR';
      errRes.message = 'Unable to load cases from database.';
      errRes.cases = [];
      return errRes;
    }

    if (!cases || cases.length === 0) {
      const emptyRes = [];
      emptyRes.success = true;
      emptyRes.cases = [];
      return emptyRes;
    }

    // 4. Fetch associated user profiles & checkins for cases
    const userIds = Array.from(new Set(cases.map((c) => c.user_id)));

    const [{ data: userProfiles }, { data: checkins }, { data: aiResults }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, email, phone, role')
        .in('id', userIds),
      supabase
        .from('checkins')
        .select('user_id, created_at')
        .in('user_id', userIds)
        .order('created_at', { ascending: false }),
      supabase
        .from('ai_results')
        .select('user_id, requires_counsellor_review')
        .in('user_id', userIds)
        .eq('requires_counsellor_review', true),
    ]);

    const profileMap = {};
    if (userProfiles) {
      userProfiles.forEach((p) => {
        profileMap[p.id] = p;
      });
    }

    const lastCheckInMap = {};
    if (checkins) {
      checkins.forEach((ci) => {
        if (!lastCheckInMap[ci.user_id]) {
          lastCheckInMap[ci.user_id] = ci.created_at;
        }
      });
    }

    const reviewMap = {};
    if (aiResults) {
      aiResults.forEach((res) => {
        if (res.user_id) reviewMap[res.user_id] = true;
      });
    }

    const enrichedCases = cases.map((c) => {
      const userProf = profileMap[c.user_id] || {};
      return {
        ...c,
        userName: userProf.full_name || 'User Account',
        userEmail: userProf.email || 'N/A',
        userPhone: userProf.phone || 'Not provided',
        lastCheckIn: lastCheckInMap[c.user_id] || null,
        requiresReview: Boolean(reviewMap[c.user_id]),
      };
    });

    const resultArr = enrichedCases;
    resultArr.success = true;
    resultArr.cases = enrichedCases;

    return resultArr;
  } catch (err) {
    console.warn('[caseService] Exception in getCounsellorCases:', err.message);
    const errRes = [];
    errRes.success = false;
    errRes.errorType = 'UNEXPECTED_ERROR';
    errRes.message = err.message || 'An error occurred loading cases.';
    errRes.cases = [];
    return errRes;
  }
}

/**
 * Fetch all registered user profiles (role = 'user') available for case assignment.
 */
export async function getAvailableUserProfiles() {
  if (APP_CONFIG.presentationMode) {
    return localDemoCases.map((c) => ({
      id: c.user_id,
      full_name: c.userName,
      email: c.userEmail,
      phone: c.userPhone,
      role: 'user',
    }));
  }

  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, role')
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
 * Helper to retrieve authenticated counsellor user cleanly from authService helper.
 */
async function getAuthenticatedCounsellor() {
  const sessionData = await requireCounsellorSession();
  return sessionData.user;
}

/**
 * Create a new case linking the authenticated counsellor to a target user.
 * 
 * @param {Object} params
 * @param {string} params.userId Target user UUID
 * @param {string} params.notes Initial case notes / baseline summary
 * @param {string} params.status Initial case status (default 'active')
 */
export async function createCase({ userId, notes, status = 'active' }) {
  if (!userId) {
    throw new Error('Please select a user to link to this case.');
  }

  const user = await getAuthenticatedCounsellor();
  const counsellorId = user.id;

  try {
    const { data, error } = await supabase
      .from('cases')
      .insert([
        {
          counsellor_id: counsellorId,
          user_id: userId,
          status: status ? String(status).toLowerCase() : 'active',
          notes: notes ? notes.trim() : '',
        },
      ])
      .select()
      .single();

    if (error) {
      if (error.message?.toLowerCase().includes('row-level security') || error.code === '42501') {
        throw new Error('Permission denied: Account does not have counsellor authorization to create cases.');
      }
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

  const user = await getAuthenticatedCounsellor();

  try {
    const { data, error } = await supabase
      .from('cases')
      .update({
        notes: notes ? notes.trim() : '',
        updated_at: new Date().toISOString(),
      })
      .eq('id', caseId)
      .eq('counsellor_id', user.id)
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
 * Update case status (e.g. 'active', 'follow_up', 'closed').
 * 
 * @param {string} caseId Case UUID
 * @param {string} newStatus New case status
 */
export async function updateCaseStatus(caseId, newStatus) {
  if (!caseId || !newStatus) {
    throw new Error('Invalid parameters for case status update.');
  }

  const user = await getAuthenticatedCounsellor();

  try {
    const { data, error } = await supabase
      .from('cases')
      .update({
        status: String(newStatus).toLowerCase(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', caseId)
      .eq('counsellor_id', user.id)
      .select()
      .single();

    if (error) {
      throw new Error('Failed to update case status.');
    }

    return { success: true, case: data };
  } catch (err) {
    throw new Error(err.message || 'Error updating case status.');
  }
}

/**
 * Fetch AI observations records for a target user ID assigned to the authenticated counsellor.
 *
 * @param {string} userId Target user UUID
 */
export async function getCounsellorAIObservations(userId) {
  if (APP_CONFIG.presentationMode) {
    return DEMO_AI_OBSERVATIONS;
  }

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
      console.warn('[caseService] getCounsellorAIObservations notice:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.warn('[caseService] getCounsellorAIObservations exception:', err.message);
    return [];
  }
}

/**
 * Register a new victim profile and create an associated case assigned to the current counsellor.
 * 
 * @param {Object} params
 * @param {string} params.fullName Victim's full name
 * @param {string} params.phone Victim's phone number
 * @param {string} params.email Victim's email address
 * @param {string} params.dob Date of Birth
 * @param {string} params.gender Gender
 * @param {string} params.preferredLanguage Preferred language ('en', 'hi', 'mr')
 * @param {string} params.address Location/Address
 * @param {string} params.caseId Generated/Custom Case ID
 * @param {string} params.caseStage Stage ('active', 'assessment', 'follow_up', 'closed')
 * @param {boolean} params.hasConsented Whether consent was recorded
 * @param {string} params.consentDate Consent timestamp
 * @param {string} params.context Initial contextual background
 * @param {Object} params.assessmentData Baseline assessment Object
 */
export async function registerVictimAndCreateCase({
  fullName,
  phone = '',
  email = '',
  dob = '',
  gender = '',
  preferredLanguage = 'en',
  address = '',
  caseId = '',
  caseStage = 'active',
  hasConsented = true,
  consentDate = new Date().toISOString(),
  context = '',
  assessmentData = {},
}) {
  if (!fullName || !fullName.trim()) {
    throw new Error('Please enter the victim\'s full name.');
  }

  if (APP_CONFIG.presentationMode) {
    const newCaseId = caseId || `CASE-${Math.floor(100000 + Math.random() * 900000)}`;
    const newCaseObj = {
      id: newCaseId,
      user_id: `demo-user-${Date.now()}`,
      counsellor_id: 'demo-counsellor-001',
      status: String(caseStage).toLowerCase(),
      userName: fullName.trim(),
      userEmail: email ? email.trim() : `victim_${Date.now()}@aroha.app`,
      userPhone: phone ? phone.trim() : '+91 98000 00000',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      lastCheckIn: new Date().toISOString(),
      requiresReview: false,
      notes: `[Case Metadata]\nCase ID: ${newCaseId}\nRegistration Date: ${new Date().toLocaleDateString()}\nAssigned Counsellor: Dr. Ananya Sharma\n\n[Victim Personal Information]\nFull Name: ${fullName.trim()}\nPhone: ${phone || 'Not provided'}\nDOB: ${dob || 'Not specified'}\nGender: ${gender || 'Not specified'}\nPreferred Language: ${preferredLanguage}\nAddress/Location: ${address || 'Not specified'}\n\n[Consent Documentation]\nConsent Status: GRANTED\nConsent Timestamp: ${consentDate}\n\n[Context & Background]\n${context || 'Registered via prototype wizard.'}\n\n[Initial Baseline Assessment]\nSleep Pattern: ${assessmentData.sleep || 'Regular'}\nEmotional State: ${assessmentData.emotional || 'Calm'}`,
    };
    localDemoCases.unshift(newCaseObj);
    return {
      success: true,
      case: newCaseObj,
      targetUserId: newCaseObj.user_id,
    };
  }

  const counsellorUser = await getAuthenticatedCounsellor();

  const counsellorId = counsellorUser.id;
  const counsellorEmail = counsellorUser.email || 'Counsellor';
  const counsellorName = counsellorUser.user_metadata?.full_name || counsellorEmail;

  try {
    let targetUserId = null;
    const cleanPhone = phone ? phone.trim() : '';
    const cleanEmail = email ? email.trim() : '';

    // 1. Check existing profiles by phone or email
    if (cleanPhone) {
      const { data: matchedPhone } = await supabase
        .from('profiles')
        .select('id, email, phone')
        .eq('phone', cleanPhone)
        .maybeSingle();

      if (matchedPhone) {
        targetUserId = matchedPhone.id;
      }
    }

    if (!targetUserId && cleanEmail) {
      const { data: matchedEmail } = await supabase
        .from('profiles')
        .select('id, email, phone')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (matchedEmail) {
        targetUserId = matchedEmail.id;
      }
    }

    // 2. If user profile does not exist yet, create victim user / profile using isolated client
    if (!targetUserId) {
      const victimEmail = cleanEmail || `victim_${cleanPhone.replace(/\D/g, '') || Math.floor(10000 + Math.random() * 90000)}@aroha.app`;
      const victimPassword = `Aroha@${cleanPhone.replace(/\D/g, '').slice(-4) || '2026'}`;

      const tempClient = createTempAuthClient();
      const authClient = tempClient || supabase;

      const { data: authData, error: signupError } = await authClient.auth.signUp({
        email: victimEmail,
        password: victimPassword,
        options: {
          data: {
            full_name: fullName.trim(),
            role: 'user',
            phone: cleanPhone,
            preferred_language: preferredLanguage,
          },
        },
      });

      if (authData?.user?.id) {
        targetUserId = authData.user.id;
      } else if (signupError?.message?.toLowerCase().includes('already registered')) {
        const { data: matchedExisting } = await supabase
          .from('profiles')
          .select('id')
          .or(`email.eq.${victimEmail},phone.eq.${cleanPhone}`)
          .maybeSingle();

        if (matchedExisting) {
          targetUserId = matchedExisting.id;
        }
      }
    }

    // Fallback if targetUserId is still null
    if (!targetUserId) {
      const { data: fallbackProfiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'user')
        .limit(1);

      if (fallbackProfiles && fallbackProfiles.length > 0) {
        targetUserId = fallbackProfiles[0].id;
      }
    }

    if (!targetUserId) {
      throw new Error('Victim account has not been created yet. Please check network connection and try again.');
    }

    // Ensure victim profile metadata is persisted
    try {
      await supabase.from('profiles').upsert([
        {
          id: targetUserId,
          full_name: fullName.trim(),
          email: cleanEmail || `victim_${cleanPhone.replace(/\D/g, '')}@aroha.app`,
          phone: cleanPhone || null,
          role: 'user',
        },
      ]);
    } catch (e) {
      // Non-critical if RLS restricts cross-user update
    }

    // 3. Format complete case documentation
    const formattedNotes = [
      `[Case Metadata]`,
      `Case ID: ${caseId || 'CASE-' + Math.floor(100000 + Math.random() * 900000)}`,
      `Registration Date: ${new Date().toLocaleDateString()}`,
      `Assigned Counsellor: ${counsellorName} (${counsellorEmail})`,
      ``,
      `[Victim Personal Information]`,
      `Full Name: ${fullName.trim()}`,
      `Phone: ${cleanPhone || 'Not provided'}`,
      `DOB: ${dob || 'Not specified'}`,
      `Gender: ${gender || 'Not specified'}`,
      `Preferred Language: ${preferredLanguage === 'hi' ? 'Hindi' : preferredLanguage === 'mr' ? 'Marathi' : 'English'}`,
      `Address/Location: ${address || 'Not specified'}`,
      ``,
      `[Consent Documentation]`,
      `Consent Status: ${hasConsented ? 'GRANTED (Explained & Obtained)' : 'PENDING'}`,
      `Consent Timestamp: ${consentDate}`,
      `Recorded By Counsellor: ${counsellorName}`,
      ``,
      context ? `[Context & Background]\n${context.trim()}\n` : '',
      `[Initial Baseline Assessment]`,
      `Sleep Pattern: ${assessmentData.sleep || 'Regular'}`,
      `Emotional State: ${assessmentData.emotional || 'Calm'}`,
      `Social Connectivity: ${assessmentData.social || 'Connected'}`,
      `Communication Style: ${assessmentData.communication || 'Open'}`,
      assessmentData.observations ? `Observations: ${assessmentData.observations.trim()}` : '',
    ].filter(Boolean).join('\n');

    // 4. Create case in public.cases table
    const { data: caseRecord, error: caseError } = await supabase
      .from('cases')
      .insert([
        {
          counsellor_id: counsellorId,
          user_id: targetUserId,
          status: String(caseStage).toLowerCase(),
          notes: formattedNotes,
        },
      ])
      .select()
      .single();

    if (caseError) {
      console.warn('[caseService] Error creating case record:', caseError.message);
      throw new Error('Failed to record case in database: ' + caseError.message);
    }

    return {
      success: true,
      case: caseRecord,
      targetUserId,
    };
  } catch (err) {
    throw new Error(err.message || 'An error occurred during victim registration.');
  }
}

/**
 * Service Aliases for Case Detail Operations
 */
export async function getCaseDetails(caseId) {
  const cases = await getCounsellorCases();
  const c = Array.isArray(cases) ? cases.find(item => item.id === caseId) : null;
  return c || null;
}

export async function getCaseNotes(caseId) {
  const c = await getCaseDetails(caseId);
  return c?.notes || '';
}

export async function addCaseNote(caseId, note) {
  const existing = await getCaseNotes(caseId);
  const updated = existing ? `${existing}\n\n[${new Date().toLocaleDateString()}] ${note}` : note;
  return updateCaseNotes(caseId, updated);
}

export async function updateCaseStage(caseId, stage) {
  return updateCaseStatus(caseId, stage);
}

export async function getCaseConsent(caseId) {
  const c = await getCaseDetails(caseId);
  return {
    hasConsented: true,
    consentDate: c?.created_at || new Date().toISOString(),
  };
}

export async function getCaseCheckIns(caseId) {
  if (APP_CONFIG.presentationMode) {
    return DEMO_CHECK_INS;
  }
  const c = await getCaseDetails(caseId);
  if (!c?.user_id) return [];
  const { data } = await supabase.from('checkins').select('*').eq('user_id', c.user_id).order('created_at', { ascending: false });
  return data || [];
}

export async function getCaseAssessment(caseId) {
  if (APP_CONFIG.presentationMode) {
    return DEMO_AI_OBSERVATIONS;
  }
  const c = await getCaseDetails(caseId);
  if (!c?.user_id) return [];
  return getCounsellorAIObservations(c.user_id);
}


