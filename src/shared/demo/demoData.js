/**
 * ArohaAI Safe Mock Demo Dataset for Prototype & SIH Presentation
 * Realistic, fictional victim names and case records.
 * No real victim information or database dependencies.
 */

export const DEMO_COUNSELLOR_USER = {
  id: 'demo-counsellor-001',
  email: 'ananya.sharma@aroha.app',
  user_metadata: {
    full_name: 'Dr. Ananya Sharma',
    role: 'counsellor',
  },
};

export const DEMO_COUNSELLOR_PROFILE = {
  id: 'demo-counsellor-001',
  full_name: 'Dr. Ananya Sharma',
  email: 'ananya.sharma@aroha.app',
  phone: '+91 98765 43210',
  role: 'counsellor',
};

export const DEMO_USER = {
  id: 'demo-user-001',
  email: 'riya.sharma@aroha.app',
  user_metadata: {
    full_name: 'Riya Sharma',
    role: 'user',
  },
};

export const DEMO_USER_PROFILE = {
  id: 'demo-user-001',
  full_name: 'Riya Sharma',
  email: 'riya.sharma@aroha.app',
  phone: '+91 98123 45678',
  role: 'user',
};

export const DEMO_CASES = [
  {
    id: 'CASE-782104',
    user_id: 'demo-user-001',
    counsellor_id: 'demo-counsellor-001',
    status: 'active',
    userName: 'Riya Sharma',
    userEmail: 'riya.sharma@aroha.app',
    userPhone: '+91 98123 45678',
    created_at: '2026-09-20T10:30:00Z',
    updated_at: '2026-09-26T14:15:00Z',
    lastCheckIn: '2026-09-27T08:30:00Z',
    requiresReview: true,
    notes: `[Case Metadata]\nCase ID: CASE-782104\nRegistration Date: 20/09/2026\nAssigned Counsellor: Dr. Ananya Sharma\n\n[Victim Personal Information]\nFull Name: Riya Sharma\nPhone: +91 98123 45678\nDOB: 14/05/1998\nGender: Female\nPreferred Language: English\nAddress/Location: Pune, Maharashtra\n\n[Consent Documentation]\nConsent Status: GRANTED (Explained & Obtained)\nConsent Timestamp: 20/09/2026 10:30 AM\n\n[Context & Background]\nSeeking emotional support and structured guidance following workplace anxiety and interpersonal stress.\n\n[Initial Baseline Assessment]\nSleep Pattern: Slightly irregular\nEmotional State: Calm with occasional anxiety\nSocial Connectivity: Moderate\nCommunication Style: Open & responsive`,
  },
  {
    id: 'CASE-491032',
    user_id: 'demo-user-002',
    counsellor_id: 'demo-counsellor-001',
    status: 'assessment',
    userName: 'Aarav Patel',
    userEmail: 'aarav.p@aroha.app',
    userPhone: '+91 98987 65432',
    created_at: '2026-09-22T11:00:00Z',
    updated_at: '2026-09-26T16:20:00Z',
    lastCheckIn: '2026-09-26T18:00:00Z',
    requiresReview: false,
    notes: `[Case Metadata]\nCase ID: CASE-491032\nRegistration Date: 22/09/2026\nAssigned Counsellor: Dr. Ananya Sharma\n\n[Victim Personal Information]\nFull Name: Aarav Patel\nPhone: +91 98987 65432\nPreferred Language: English\nAddress/Location: Mumbai, Maharashtra\n\n[Consent Documentation]\nConsent Status: GRANTED\n\n[Context & Background]\nInitial baseline assessment conducted. Sleep and daily routines are being monitored.`,
  },
  {
    id: 'CASE-612984',
    user_id: 'demo-user-003',
    counsellor_id: 'demo-counsellor-001',
    status: 'follow_up',
    userName: 'Priya Verma',
    userEmail: 'priya.v@aroha.app',
    userPhone: '+91 97654 32109',
    created_at: '2026-09-15T09:15:00Z',
    updated_at: '2026-09-25T11:45:00Z',
    lastCheckIn: '2026-09-24T12:00:00Z',
    requiresReview: true,
    notes: `[Case Metadata]\nCase ID: CASE-612984\nRegistration Date: 15/09/2026\nAssigned Counsellor: Dr. Ananya Sharma\n\n[Victim Personal Information]\nFull Name: Priya Verma\nPhone: +91 97654 32109\nPreferred Language: Hindi\nAddress/Location: Nagpur, Maharashtra\n\n[Consent Documentation]\nConsent Status: GRANTED\n\n[Context & Background]\nFollow-up phase. Daily check-ins are recorded regularly. Review requested for routine updates.`,
  },
  {
    id: 'CASE-304192',
    user_id: 'demo-user-004',
    counsellor_id: 'demo-counsellor-001',
    status: 'active',
    userName: 'Vikram Singh',
    userEmail: 'vikram.s@aroha.app',
    userPhone: '+91 96543 21098',
    created_at: '2026-09-24T15:00:00Z',
    updated_at: '2026-09-27T09:10:00Z',
    lastCheckIn: '2026-09-27T09:00:00Z',
    requiresReview: false,
    notes: `[Case Metadata]\nCase ID: CASE-304192\nRegistration Date: 24/09/2026\nAssigned Counsellor: Dr. Ananya Sharma\n\n[Victim Personal Information]\nFull Name: Vikram Singh\nPhone: +91 96543 21098\nPreferred Language: English\n\n[Consent Documentation]\nConsent Status: GRANTED`,
  },
  {
    id: 'CASE-820516',
    user_id: 'demo-user-005',
    counsellor_id: 'demo-counsellor-001',
    status: 'closed',
    userName: 'Ananya Deshmukh',
    userEmail: 'ananya.d@aroha.app',
    userPhone: '+91 95432 10987',
    created_at: '2026-09-01T10:00:00Z',
    updated_at: '2026-09-20T17:00:00Z',
    lastCheckIn: '2026-09-19T14:30:00Z',
    requiresReview: false,
    notes: `[Case Metadata]\nCase ID: CASE-820516\nRegistration Date: 01/09/2026\nAssigned Counsellor: Dr. Ananya Sharma\n\n[Victim Personal Information]\nFull Name: Ananya Deshmukh\nPhone: +91 95432 10987\n\n[Consent Documentation]\nConsent Status: GRANTED\n\n[Case Status]\nCase successfully closed following completed support plan.`,
  },
];

export const DEMO_APPOINTMENTS = [
  {
    id: 'appt-001',
    user_id: 'demo-user-001',
    counsellor_id: 'demo-counsellor-001',
    title: 'Individual Counselling Session',
    appointment_date: '2026-09-28T14:00:00Z',
    scheduled_at: '2026-09-28T14:00:00Z',
    status: 'scheduled',
    notes: 'Follow-up on weekly routine and emotional reflections.',
    user_name: 'Riya Sharma',
  },
  {
    id: 'appt-002',
    user_id: 'demo-user-003',
    counsellor_id: 'demo-counsellor-001',
    title: 'Progress Review Consultation',
    appointment_date: '2026-09-29T11:30:00Z',
    scheduled_at: '2026-09-29T11:30:00Z',
    status: 'scheduled',
    notes: 'Review baseline assessment and stress management strategies.',
    user_name: 'Priya Verma',
  },
  {
    id: 'appt-003',
    user_id: 'demo-user-002',
    counsellor_id: 'demo-counsellor-001',
    title: 'Initial Intake Session',
    appointment_date: '2026-09-25T10:00:00Z',
    scheduled_at: '2026-09-25T10:00:00Z',
    status: 'completed',
    notes: 'Intake completed cleanly.',
    user_name: 'Aarav Patel',
  },
];

export const DEMO_CHECK_INS = [
  {
    id: 'ci-101',
    user_id: 'demo-user-001',
    response: 'Good',
    created_at: '2026-09-27T08:30:00Z',
  },
  {
    id: 'ci-100',
    user_id: 'demo-user-001',
    response: 'Okay',
    created_at: '2026-09-26T09:15:00Z',
  },
  {
    id: 'ci-099',
    user_id: 'demo-user-001',
    response: 'Calm',
    created_at: '2026-09-25T08:45:00Z',
  },
  {
    id: 'ci-098',
    user_id: 'demo-user-001',
    response: 'Reflective',
    created_at: '2026-09-24T10:00:00Z',
  },
];

export const DEMO_AI_OBSERVATIONS = [
  {
    id: 'ai-001',
    checkin_id: 'ci-101',
    user_id: 'demo-user-001',
    indicators: ['Stable emotional tone', 'Positive communication sentiment'],
    change_detected: false,
    explanation: 'User reported feeling Good with steady routine engagement.',
    requires_counsellor_review: false,
    created_at: '2026-09-27T08:31:00Z',
  },
  {
    id: 'ai-000',
    checkin_id: 'ci-100',
    user_id: 'demo-user-001',
    indicators: ['Mild stress noted', 'Sleep pattern variation'],
    change_detected: true,
    explanation: 'Slight fluctuation in reported mood compared to 3-day baseline.',
    requires_counsellor_review: true,
    created_at: '2026-09-26T09:16:00Z',
  },
];

export const DEMO_INTERVENTIONS = [
  {
    id: 'int-001',
    case_id: 'CASE-782104',
    title: 'Daily Mindfulness & Sleep Hygiene Plan',
    description: 'Structure 15-minute relaxation prior to sleep; track morning check-ins.',
    status: 'active',
    review_date: '2026-10-05',
    created_at: '2026-09-21T10:00:00Z',
  },
];

export const DEMO_ALERTS = [
  {
    id: 'alert-001',
    caseId: 'CASE-782104',
    victimName: 'Riya Sharma',
    type: 'review_required',
    title: 'Monitoring Flag',
    message: 'Check-in reflection flagged for counsellor review.',
    timestamp: '2026-09-27T08:30:00Z',
  },
  {
    id: 'alert-002',
    caseId: 'CASE-612984',
    victimName: 'Priya Verma',
    type: 'follow_up_due',
    title: 'Appointment Approaching',
    message: 'Scheduled follow-up consultation on 29th Sept.',
    timestamp: '2026-09-26T12:00:00Z',
  },
];
