import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { getCurrentAuthenticatedUser } from '../../shared/services/authService';
import { getCounsellorCases } from './caseService';
import { getCounsellorAppointments } from './appointmentService';
import { getCaseInterventions } from './interventionService';
import { APP_CONFIG } from '../../shared/config/appConfig';

/**
 * Service to aggregate real dashboard metrics and case-monitoring feeds for Counsellor Home Dashboard.
 */

export function formatRecency(dateString) {
  if (!dateString) return 'No check-in recorded';
  const now = new Date();
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return 'Recorded';

  // Compare calendar days
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffTime = startOfToday.getTime() - startOfTarget.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));

  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays} days ago`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export async function getCounsellorDashboardData() {
  if (!APP_CONFIG.presentationMode && !isSupabaseConfigured()) {
    return {
      success: false,
      errorType: 'CONFIG_ERROR',
      message: 'Supabase is not configured.',
    };
  }

  try {
    if (!APP_CONFIG.presentationMode) {
      const user = await getCurrentAuthenticatedUser();
      if (!user) {
        return {
          success: false,
          errorType: 'AUTH_REQUIRED',
          message: 'Your session has expired. Please sign in again.',
        };
      }
    }

    // Load cases and appointments concurrently
    const [casesRes, appointmentsList] = await Promise.all([
      getCounsellorCases(),
      getCounsellorAppointments(),
    ]);

    let loadedCases = [];
    if (Array.isArray(casesRes)) {
      loadedCases = casesRes;
    } else if (casesRes && casesRes.success && Array.isArray(casesRes.cases)) {
      loadedCases = casesRes.cases;
    } else if (casesRes && casesRes.cases && Array.isArray(casesRes.cases)) {
      loadedCases = casesRes.cases;
    }

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Map appointments by userId & caseId
    const activeAppointments = appointmentsList.filter(
      (a) => (a.status || '').toLowerCase() !== 'cancelled'
    );

    const upcomingAppointments = activeAppointments
      .filter((a) => (a.status || '').toLowerCase() !== 'completed' && new Date(a.appointment_date) >= now)
      .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));

    const overdueAppointments = activeAppointments
      .filter((a) => (a.status || '').toLowerCase() !== 'completed' && new Date(a.appointment_date) < now)
      .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));

    // Load interventions for all cases
    const interventionPromises = loadedCases.map((c) => getCaseInterventions(c.id));
    const interventionResults = await Promise.all(interventionPromises);

    const caseInterventionMap = {};
    loadedCases.forEach((c, idx) => {
      const res = interventionResults[idx];
      if (res && res.success && Array.isArray(res.data)) {
        caseInterventionMap[c.id] = res.data;
      } else {
        caseInterventionMap[c.id] = [];
      }
    });

    // Compute Metrics & Needs Attention list
    const activeCasesList = loadedCases.filter(
      (c) => String(c.status || 'active').toLowerCase() !== 'closed'
    );

    const needsAttentionItems = [];

    loadedCases.forEach((c) => {
      const userAppts = activeAppointments.filter((a) => a.user_id === c.user_id);
      const overdueAppt = userAppts.find(
        (a) => (a.status || '').toLowerCase() !== 'completed' && new Date(a.appointment_date) < now
      );
      const upcomingAppt = userAppts.find(
        (a) => (a.status || '').toLowerCase() !== 'completed' && new Date(a.appointment_date) >= now
      );

      const caseInts = caseInterventionMap[c.id] || [];
      const activeInt = caseInts.find((i) => (i.status || '').toLowerCase() !== 'completed');
      const reviewDueInt = caseInts.find(
        (i) =>
          (i.status || '').toLowerCase() !== 'completed' &&
          i.review_date &&
          new Date(i.review_date) <= now
      );

      // Check recency of check-in
      let lastCheckInDate = null;
      if (c.lastCheckIn) {
        lastCheckInDate = new Date(c.lastCheckIn);
      }
      const daysSinceCheckIn = lastCheckInDate
        ? Math.floor((now.getTime() - lastCheckInDate.getTime()) / (1000 * 3600 * 24))
        : 999;

      let attentionReason = null;
      let attentionDateStr = null;

      if (overdueAppt) {
        attentionReason = 'Follow-up overdue';
        attentionDateStr = `Scheduled: ${new Date(overdueAppt.appointment_date).toLocaleDateString('en-GB')}`;
      } else if (reviewDueInt) {
        attentionReason = 'Intervention review due';
        attentionDateStr = `Review Date: ${reviewDueInt.review_date}`;
      } else if (daysSinceCheckIn >= 3 && daysSinceCheckIn < 900) {
        attentionReason = 'No recent check-in';
        attentionDateStr = `Last: ${formatRecency(c.lastCheckIn)}`;
      } else if (c.requiresReview) {
        attentionReason = 'Monitoring review flag';
        attentionDateStr = 'Review requested';
      }

      if (attentionReason) {
        needsAttentionItems.push({
          id: `attn-${c.id}`,
          caseId: c.id,
          userId: c.user_id,
          victimName: c.userName || 'Victim Record',
          reason: attentionReason,
          dateInfo: attentionDateStr,
          rawCase: c,
        });
      }

      // Attach dynamic attributes to case snapshot
      c.recencyLabel = formatRecency(c.lastCheckIn);
      c.nextFollowUpStr = upcomingAppt
        ? new Date(upcomingAppt.appointment_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
        : 'None scheduled';
      c.activeIntervention = activeInt || null;
    });

    // Recent Check-ins Timeline
    const recentCheckIns = loadedCases
      .filter((c) => Boolean(c.lastCheckIn))
      .sort((a, b) => new Date(b.lastCheckIn) - new Date(a.lastCheckIn))
      .slice(0, 6)
      .map((c) => ({
        id: `ci-${c.id}`,
        caseId: c.id,
        victimName: c.userName || 'Victim Record',
        recency: formatRecency(c.lastCheckIn),
        timestamp: c.lastCheckIn,
        rawCase: c,
      }));

    return {
      success: true,
      data: {
        activeCasesCount: activeCasesList.length,
        upcomingFollowUpsCount: upcomingAppointments.length,
        casesNeedingReviewCount: needsAttentionItems.length,
        overdueFollowUpsCount: overdueAppointments.length,
        needsAttentionItems,
        upcomingAppointments,
        recentCheckIns,
        allCases: loadedCases,
      },
    };
  } catch (err) {
    console.warn('[dashboardService] Exception:', err.message);
    return {
      success: false,
      errorType: 'SERVER_ERROR',
      message: 'Unable to load dashboard information.',
    };
  }
}
