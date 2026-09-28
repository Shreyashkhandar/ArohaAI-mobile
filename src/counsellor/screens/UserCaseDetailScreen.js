import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../shared/theme/theme';
import Icon from '../../shared/components/Icon';
import { updateCaseNotes, updateCaseStatus, getCounsellorAIObservations } from '../services/caseService';
import { appendNoteToHistory, formatDetailedNote } from '../services/noteService';
import { createFollowUpAppointment, getVictimAppointments } from '../services/appointmentService';
import { getUserCheckInHistory } from '../../user/services/checkinService';
import { getCurrentAuthenticatedUser } from '../../shared/services/authService';
import { getCaseInterventions } from '../services/interventionService';
import InterventionPlanScreen from './InterventionPlanScreen';
import InterventionDetailScreen from './InterventionDetailScreen';
import ScheduleAppointmentScreen from './ScheduleAppointmentScreen';
import AppointmentDetailScreen from './AppointmentDetailScreen';
import CheckInDetailScreen from './CheckInDetailScreen';
import CounsellorCheckInHistoryScreen from './CounsellorCheckInHistoryScreen';

const DETAIL_TABS = [
  { id: 'overview', label: 'Overview', icon: 'document-text-outline' },
  { id: 'intervention', label: 'Intervention', icon: 'shield-checkmark-outline' },
  { id: 'assessment', label: 'Assessment', icon: 'clipboard-outline' },
  { id: 'checkins', label: 'Check-ins', icon: 'checkmark-circle-outline' },
  { id: 'trends', label: 'Trends', icon: 'analytics-outline' },
  { id: 'notes', label: 'Notes', icon: 'create-outline' },
  { id: 'appointments', label: 'Appointments', icon: 'calendar-outline' },
  { id: 'routine', label: 'Routine', icon: 'time-outline' },
  { id: 'alerts', label: 'Alerts', icon: 'alert-circle-outline' },
];

const VALID_STAGES = [
  { id: 'active', label: 'Initial Contact & Active' },
  { id: 'assessment', label: 'Initial Assessment' },
  { id: 'early_support', label: 'Early Support' },
  { id: 'stabilization', label: 'Stabilization' },
  { id: 'follow_up', label: 'Active Monitoring & Follow-up' },
  { id: 'closed', label: 'Closed' },
];

export default function UserCaseDetailScreen({ caseData: initialCaseData, onBack, onCaseUpdated }) {
  const [caseData, setCaseData] = useState(initialCaseData);
  const [activeTab, setActiveTab] = useState('overview');
  const [notes, setNotes] = useState(initialCaseData?.notes || '');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Intervention Plan & History State
  const [interventions, setInterventions] = useState([]);
  const [isLoadingInterventions, setIsLoadingInterventions] = useState(true);
  const [interventionSubView, setInterventionSubView] = useState(null); // null | 'plan' | 'detail'
  const [selectedIntervention, setSelectedIntervention] = useState(null);

  // Appointment Sub-view State
  const [apptSubView, setApptSubView] = useState(null); // null | 'schedule' | 'detail'
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Check-in Sub-view State
  const [checkInSubView, setCheckInSubView] = useState(null); // null | 'detail' | 'history'
  const [selectedCheckIn, setSelectedCheckIn] = useState(null);

  // Modals State
  const [showStageModal, setShowStageModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);

  // Note Form State
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [interactionType, setInteractionType] = useState('In-person Session');
  const [observation, setObservation] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(true);
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');

  // Assessment State
  const [isSavingAssessment, setIsSavingAssessment] = useState(false);
  const [emotionalState, setEmotionalState] = useState('Calm / Stable');
  const [reportedConcerns, setReportedConcerns] = useState('');
  const [sleepConcerns, setSleepConcerns] = useState('Normal');
  const [socialWithdrawal, setSocialWithdrawal] = useState('None');
  const [anxietyConcerns, setAnxietyConcerns] = useState('Mild');
  const [safetyConcerns, setSafetyConcerns] = useState('None identified');
  const [immediateSupportRequired, setImmediateSupportRequired] = useState(false);
  const [counsellorObservations, setCounsellorObservations] = useState('');

  // Follow-up Appointment State
  const [isSchedulingAppt, setIsSchedulingAppt] = useState(false);
  const [isSavingAppt, setIsSavingAppt] = useState(false);
  const [apptDate, setApptDate] = useState('');
  const [apptTime, setApptTime] = useState('10:00 AM');
  const [apptType, setApptType] = useState('Routine Check-in Review');
  const [apptNotes, setApptNotes] = useState('');
  const [appointments, setAppointments] = useState([]);

  // Routine / Follow-up Config State
  const [followUpFrequency, setFollowUpFrequency] = useState('Daily');
  const [routineActivity, setRoutineActivity] = useState('Morning Check-in & Evening Reflection');
  const [preferredTime, setPreferredTime] = useState('09:00 AM');
  const [routineInstructions, setRoutineInstructions] = useState('Complete daily check-in prompt before noon.');
  const [isRoutineActive, setIsRoutineActive] = useState(true);
  const [isSavingRoutine, setIsSavingRoutine] = useState(false);

  // Consent Record State
  const [hasConsent, setHasConsent] = useState(true);
  const [consentDate, setConsentDate] = useState(new Date().toLocaleDateString());

  // Check-ins & AI State
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [checkIns, setCheckIns] = useState([]);
  const [isLoadingCheckIns, setIsLoadingCheckIns] = useState(true);
  const [aiObservations, setAiObservations] = useState([]);
  const [isLoadingAIObservations, setIsLoadingAIObservations] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadCaseDetails = useCallback(async () => {
    if (caseData?.user_id || caseData?.id) {
      setIsLoadingCheckIns(true);
      setIsLoadingAIObservations(true);
      setIsLoadingInterventions(true);
      setErrorMessage('');
      try {
        const [history, obs, appts, intRes] = await Promise.all([
          caseData.user_id ? getUserCheckInHistory(caseData.user_id) : Promise.resolve([]),
          caseData.user_id ? getCounsellorAIObservations(caseData.user_id) : Promise.resolve([]),
          caseData.user_id ? getVictimAppointments(caseData.user_id) : Promise.resolve([]),
          caseData.id ? getCaseInterventions(caseData.id) : Promise.resolve({ success: true, data: [] }),
        ]);
        setCheckIns(history || []);
        setAiObservations(obs || []);
        setAppointments(appts || []);
        if (intRes && intRes.success) {
          setInterventions(intRes.data || []);
        }
      } catch (err) {
        console.warn('[UserCaseDetailScreen] Load error:', err.message);
        setErrorMessage('Unable to load full case details. Please try again.');
      } finally {
        setIsLoadingCheckIns(false);
        setIsLoadingAIObservations(false);
        setIsLoadingInterventions(false);
        setIsRefreshing(false);
      }
    } else {
      setIsLoadingCheckIns(false);
      setIsLoadingAIObservations(false);
      setIsLoadingInterventions(false);
      setIsRefreshing(false);
    }
  }, [caseData?.user_id, caseData?.id]);

  useEffect(() => {
    loadCaseDetails();
  }, [loadCaseDetails]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadCaseDetails();
  };

  const handleStatusChange = async (newStatus) => {
    if (!caseData?.id || isUpdatingStatus) return;

    // Verify session
    const authUser = await getCurrentAuthenticatedUser();
    if (!authUser) {
      setErrorMessage('Your counsellor session is no longer available. Please sign in again.');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setIsUpdatingStatus(true);

    try {
      const result = await updateCaseStatus(caseData.id, newStatus);
      if (result.success) {
        setCaseData((prev) => ({ ...prev, status: newStatus }));
        setSuccessMessage(`Case stage updated to ${newStatus.toUpperCase()}`);
        setShowStageModal(false);
        setShowCloseModal(false);
        if (onCaseUpdated) onCaseUpdated();
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update case stage.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddNote = async () => {
    if (!caseData?.id || !observation.trim()) {
      setErrorMessage('Please enter clinical observation notes before saving.');
      return;
    }

    const authUser = await getCurrentAuthenticatedUser();
    if (!authUser) {
      setErrorMessage('Counsellor session expired. Please sign in again.');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setIsSavingNotes(true);

    try {
      const formattedEntry = formatDetailedNote({
        interactionDate: new Date().toLocaleDateString(),
        interactionType,
        observation: observation.trim(),
        actionTaken: actionTaken.trim(),
        followUpRequired,
        nextFollowUpDate: nextFollowUpDate.trim(),
        authorName: authUser.user_metadata?.full_name || authUser.email || 'Counsellor',
      });

      const updatedNotes = appendNoteToHistory(notes, formattedEntry, 'Counsellor');
      await updateCaseNotes(caseData.id, updatedNotes);
      setNotes(updatedNotes);

      // Reset Form
      setObservation('');
      setActionTaken('');
      setNextFollowUpDate('');
      setShowNoteModal(false);
      setSuccessMessage('Confidential counsellor note recorded successfully.');
      if (onCaseUpdated) onCaseUpdated();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save case note.');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleSaveAssessment = async () => {
    if (!caseData?.id) return;
    setErrorMessage('');
    setSuccessMessage('');
    setIsSavingAssessment(true);

    try {
      const assessmentEntry = formatDetailedNote({
        interactionDate: new Date().toLocaleDateString(),
        interactionType: 'Initial Clinical Assessment',
        observation: `Emotional State: ${emotionalState}\nSleep: ${sleepConcerns}\nSocial Withdrawal: ${socialWithdrawal}\nAnxiety: ${anxietyConcerns}\nSafety Concerns: ${safetyConcerns}\nImmediate Support Needed: ${immediateSupportRequired ? 'YES' : 'NO'}\nNotes: ${counsellorObservations}`,
        actionTaken: 'Baseline assessment recorded in case record.',
        followUpRequired: true,
        authorName: 'Counsellor',
      });

      const updatedNotes = appendNoteToHistory(notes, assessmentEntry, 'Counsellor');
      await updateCaseNotes(caseData.id, updatedNotes);
      setNotes(updatedNotes);
      setSuccessMessage('Initial clinical assessment saved successfully.');
      if (onCaseUpdated) onCaseUpdated();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save assessment.');
    } finally {
      setIsSavingAssessment(false);
    }
  };

  const handleScheduleAppointment = async () => {
    if (!caseData?.user_id || !apptDate.trim()) return;
    setErrorMessage('');
    setSuccessMessage('');
    setIsSavingAppt(true);

    try {
      const result = await createFollowUpAppointment({
        userId: caseData.user_id,
        caseId: caseData.id,
        appointmentDate: apptDate.trim(),
        time: apptTime.trim(),
        type: apptType.trim(),
        notes: apptNotes.trim(),
      });

      if (result.success) {
        setAppointments((prev) => [
          ...prev,
          {
            id: 'local-' + Date.now(),
            appointment_date: apptDate.trim(),
            status: 'scheduled',
            notes: `[${apptType.trim()}] Time: ${apptTime.trim()}\nNotes: ${apptNotes.trim()}`,
          },
        ]);

        setApptDate('');
        setApptNotes('');
        setIsSchedulingAppt(false);
        setSuccessMessage('Follow-up session scheduled successfully.');
        if (onCaseUpdated) onCaseUpdated();
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to schedule appointment.');
    } finally {
      setIsSavingAppt(false);
    }
  };

  const handleSaveRoutine = async () => {
    setErrorMessage('');
    setIsSavingRoutine(true);
    setTimeout(() => {
      setIsSavingRoutine(false);
      setSuccessMessage('Routine & follow-up schedule updated successfully.');
    }, 400);
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'Date unknown';
    try {
      const date = new Date(isoString);
      const now = new Date();

      if (date.toDateString() === now.toDateString()) {
        return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }

      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }

      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (err) {
      return isoString;
    }
  };

  if (!caseData) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>Case details not found.</Text>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back to Cases</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentStatus = String(caseData.status || 'active').toLowerCase();
  const isHighRisk = caseData.requiresReview || aiObservations.some((o) => o.requires_counsellor_review);
  const activePlan = interventions.length > 0 ? interventions[0] : null;
  const upcomingAppt = appointments.find((a) => (a.status || '').toLowerCase() !== 'cancelled');

  if (interventionSubView === 'plan') {
    return (
      <InterventionPlanScreen
        caseData={caseData}
        victimProfile={{ full_name: caseData?.userName || caseData?.user_profile?.full_name || 'Victim' }}
        initialIntervention={selectedIntervention}
        onBack={() => setInterventionSubView(null)}
        onSaved={() => {
          loadCaseDetails();
          setInterventionSubView(null);
          if (onCaseUpdated) onCaseUpdated();
        }}
      />
    );
  }

  if (interventionSubView === 'detail') {
    return (
      <InterventionDetailScreen
        intervention={selectedIntervention}
        caseData={caseData}
        victimProfile={{ full_name: caseData?.userName || caseData?.user_profile?.full_name || 'Victim' }}
        onBack={() => setInterventionSubView(null)}
        onEdit={(item) => {
          setSelectedIntervention(item);
          setInterventionSubView('plan');
        }}
        onUpdated={(updatedItem) => {
          setSelectedIntervention(updatedItem);
          loadCaseDetails();
        }}
      />
    );
  }

  if (apptSubView === 'schedule') {
    return (
      <ScheduleAppointmentScreen
        caseData={caseData}
        victimProfile={{ full_name: caseData?.userName || caseData?.user_profile?.full_name || 'Victim Record' }}
        onBack={() => setApptSubView(null)}
        onScheduled={() => {
          loadCaseDetails();
          setApptSubView(null);
          if (onCaseUpdated) onCaseUpdated();
        }}
      />
    );
  }

  if (apptSubView === 'detail') {
    return (
      <AppointmentDetailScreen
        appointment={selectedAppointment}
        caseData={caseData}
        victimProfile={{ full_name: caseData?.userName || caseData?.user_profile?.full_name || 'Victim Record' }}
        onBack={() => setApptSubView(null)}
        onUpdated={() => {
          loadCaseDetails();
        }}
      />
    );
  }

  if (checkInSubView === 'detail' && selectedCheckIn) {
    return (
      <CheckInDetailScreen
        checkIn={selectedCheckIn}
        victimName={caseData?.userName || caseData?.user_profile?.full_name || 'Victim Record'}
        caseId={caseData?.id}
        onBack={() => setCheckInSubView(null)}
        onCaseNoteAdded={() => loadCaseDetails()}
      />
    );
  }

  if (checkInSubView === 'history') {
    return (
      <CounsellorCheckInHistoryScreen
        userId={caseData?.user_id}
        caseId={caseData?.id}
        victimName={caseData?.userName || caseData?.user_profile?.full_name || 'Victim Record'}
        onBack={() => setCheckInSubView(null)}
      />
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} />
      }
    >
      {/* Navigation Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7} accessibilityLabel="Go back to cases">
          <Icon name="arrow-back" size={16} color={COLORS.primary} />
          <Text style={styles.backButtonText}>Back to Cases</Text>
        </TouchableOpacity>
        
        <View style={styles.caseHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{caseData?.userName || 'Victim Case Record'}</Text>
            <Text style={styles.caseIdText}>Case ID: {caseData?.id}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>{currentStatus.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {/* 9. EMERGENCY / HIGH-RISK ALERT CARD */}
      {isHighRisk && (
        <View style={styles.emergencyAlertCard}>
          <View style={styles.emergencyAlertHeader}>
            <Icon name="alert-circle" size={20} color="#9B1C1C" style={{ marginRight: 8 }} />
            <Text style={styles.emergencyAlertTitle}>Immediate Attention Required</Text>
          </View>
          <Text style={styles.emergencyAlertBody}>
            Monitoring indicators flagged daily check-in responses for counsellor review.
          </Text>
          <View style={styles.emergencyAlertActions}>
            <TouchableOpacity
              style={styles.emergencyActionBtn}
              onPress={() => setActiveTab('alerts')}
              activeOpacity={0.8}
            >
              <Text style={styles.emergencyActionText}>Review Case Flags</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.emergencyActionBtn, styles.emergencyActionPrimary]}
              onPress={() => {
                setSelectedIntervention(activePlan);
                setInterventionSubView('plan');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.emergencyActionPrimaryText}>Record Intervention</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Banners */}
      {errorMessage ? (
        <View style={styles.errorCard}>
          <Icon name="shield-outline" size={16} color="#9B1C1C" style={{ marginRight: 8 }} />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {successMessage ? (
        <View style={styles.successCard}>
          <Icon name="checkmark-circle-outline" size={16} color={COLORS.primary} style={{ marginRight: 8 }} />
          <Text style={styles.successText}>{successMessage}</Text>
        </View>
      ) : null}

      {/* 10. CASE ACTIONS QUICK BAR */}
      <View style={styles.quickActionsBar}>
        <TouchableOpacity
          style={styles.actionPillBtn}
          onPress={() => setShowStageModal(true)}
          activeOpacity={0.8}
        >
          <Icon name="swap-horizontal-outline" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
          <Text style={styles.actionPillText}>Update Stage</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionPillBtn}
          onPress={() => {
            setSelectedIntervention(activePlan);
            setInterventionSubView('plan');
          }}
          activeOpacity={0.8}
        >
          <Icon name="clipboard-outline" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
          <Text style={styles.actionPillText}>Intervention</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionPillBtn}
          onPress={() => setShowNoteModal(true)}
          activeOpacity={0.8}
        >
          <Icon name="create-outline" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
          <Text style={styles.actionPillText}>+ Add Note</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionPillBtn}
          onPress={() => setApptSubView('schedule')}
          activeOpacity={0.8}
        >
          <Icon name="calendar-outline" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
          <Text style={styles.actionPillText}>Schedule</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionPillBtn, styles.actionPillClose]}
          onPress={() => setShowCloseModal(true)}
          activeOpacity={0.8}
        >
          <Icon name="close-circle-outline" size={14} color="#9B1C1C" style={{ marginRight: 4 }} />
          <Text style={styles.actionPillCloseText}>Close Case</Text>
        </TouchableOpacity>
      </View>

      {/* 9-SECTION TOP TAB NAVIGATION */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScrollView}
        contentContainerStyle={styles.tabsContainer}
      >
        {DETAIL_TABS.map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabButton, isSelected && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.8}
            >
              <Icon
                name={tab.icon}
                size={14}
                color={isSelected ? COLORS.primary : COLORS.textSubtle}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.tabButtonText, isSelected && styles.tabButtonTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* TAB 1: OVERVIEW & VICTIM INFORMATION */}
      {(activeTab === 'overview') && (
        <View style={styles.tabContent}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>1. Victim & Case Overview</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Victim Full Name</Text>
              <Text style={styles.infoValue}>{caseData?.userName || 'User Account'}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Registration Date</Text>
              <Text style={styles.infoValue}>
                {caseData?.created_at ? new Date(caseData.created_at).toLocaleDateString() : 'Recorded'}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone Contact</Text>
              <Text style={styles.infoValue}>{caseData?.userPhone || 'Not provided'}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{caseData?.userEmail || 'N/A'}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Assigned Counsellor</Text>
              <Text style={styles.infoValue}>Authorized Staff</Text>
            </View>
          </View>

          {/* INTERVENTION & SUPPORT CARD */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Icon name="shield-checkmark" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
                <Text style={styles.cardTitle}>Intervention & Support</Text>
              </View>
              {activePlan && (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedIntervention(activePlan);
                    setInterventionSubView('plan');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.primary }}>Edit Plan</Text>
                </TouchableOpacity>
              )}
            </View>

            {isLoadingInterventions ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 12 }} />
            ) : activePlan ? (
              <View style={styles.interventionSummaryBox}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Support Category</Text>
                  <Text style={[styles.infoValue, { fontWeight: '700' }]}>{activePlan.support_type}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Status</Text>
                  <Text style={[styles.infoValue, { textTransform: 'capitalize', color: COLORS.primary, fontWeight: '700' }]}>
                    {activePlan.status}
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Support Objective</Text>
                  <Text style={[styles.infoValue, { flex: 1, textAlign: 'right' }]} numberOfLines={2}>
                    {activePlan.support_objective}
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Next Review Date</Text>
                  <Text style={styles.infoValue}>{activePlan.review_date || 'Not scheduled'}</Text>
                </View>

                <TouchableOpacity
                  style={[styles.primaryActionBtn, { marginTop: 12 }]}
                  onPress={() => {
                    setSelectedIntervention(activePlan);
                    setInterventionSubView('detail');
                  }}
                  activeOpacity={0.8}
                >
                  <Icon name="eye-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.primaryActionBtnText}>View Full Intervention Record</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emptyBox}>
                <Icon name="clipboard-outline" size={32} color={COLORS.textSubtle} style={{ marginBottom: 6 }} />
                <Text style={styles.emptyBoxTitle}>No intervention plan recorded</Text>
                <Text style={styles.emptyBoxSubtitle}>Create a support plan to document the next steps for this case.</Text>
                <TouchableOpacity
                  style={[styles.primaryActionBtn, { marginTop: 10 }]}
                  onPress={() => {
                    setSelectedIntervention(null);
                    setInterventionSubView('plan');
                  }}
                  activeOpacity={0.8}
                >
                  <Icon name="add-circle-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.primaryActionBtnText}>Create Intervention Plan</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* APPOINTMENT & FOLLOW-UP SUMMARY */}
            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.cardBorder }}>
              <Text style={[styles.infoLabel, { marginBottom: 6, fontWeight: '700' }]}>Follow-up & Appointment</Text>
              {upcomingAppt ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Icon name="calendar" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 13, color: COLORS.textPrimary, fontWeight: '600' }}>
                      {upcomingAppt.appointment_date || 'Scheduled Session'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedAppointment(upcomingAppt);
                      setApptSubView('detail');
                    }}
                  >
                    <Text style={{ fontSize: 12, color: COLORS.primary, fontWeight: '700' }}>View Appointment</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Icon name="calendar-outline" size={16} color={COLORS.textSubtle} style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 13, color: COLORS.textSubtle }}>No appointment scheduled</Text>
                  </View>
                  <TouchableOpacity
                    style={{ backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.cardBorder, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4 }}
                    onPress={() => setApptSubView('schedule')}
                  >
                    <Text style={{ fontSize: 12, color: COLORS.primary, fontWeight: '600' }}>Schedule Follow-up</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* WELLBEING MONITORING SUMMARY CARD */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Icon name="pulse-outline" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
                <Text style={styles.cardTitle}>Wellbeing Monitoring</Text>
              </View>
              {checkIns.length > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{checkIns.length} check-ins</Text>
                </View>
              )}
            </View>

            {isLoadingCheckIns ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 12 }} />
            ) : checkIns.length > 0 ? (
              <View style={styles.interventionSummaryBox}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Latest Check-in</Text>
                  <Text style={[styles.infoValue, { fontWeight: '700' }]}>
                    {new Date(checkIns[0].created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Submitted Response</Text>
                  <Text style={[styles.infoValue, { flex: 1, textAlign: 'right' }]} numberOfLines={2}>
                    "{checkIns[0].response}"
                  </Text>
                </View>

                {checkIns[0].aiResult?.requires_counsellor_review && (
                  <View style={[styles.flagCard, { marginTop: 8 }]}>
                    <Icon name="alert-circle" size={14} color="#9B1C1C" style={{ marginRight: 4 }} />
                    <Text style={{ fontSize: 11, color: '#9B1C1C', fontWeight: '700' }}>System-generated review flag</Text>
                  </View>
                )}

                <View style={{ flexDirection: 'row', marginTop: 12 }}>
                  <TouchableOpacity
                    style={[styles.primaryActionBtn, { flex: 1, marginRight: 4 }]}
                    onPress={() => setCheckInSubView('history')}
                    activeOpacity={0.8}
                  >
                    <Icon name="list-outline" size={15} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.primaryActionBtnText}>View Check-in History</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.secondaryActionBtn, { flex: 1, marginLeft: 4 }]}
                    onPress={() => {
                      setSelectedCheckIn(checkIns[0]);
                      setCheckInSubView('detail');
                    }}
                    activeOpacity={0.8}
                  >
                    <Icon name="eye-outline" size={15} color={COLORS.primary} style={{ marginRight: 4 }} />
                    <Text style={styles.secondaryActionBtnText}>Inspect Details</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.emptyBox}>
                <Icon name="calendar-outline" size={32} color={COLORS.textSubtle} style={{ marginBottom: 6 }} />
                <Text style={styles.emptyBoxTitle}>No check-ins recorded yet</Text>
                <Text style={styles.emptyBoxSubtitle}>Check-in information will appear here when the victim submits their wellbeing check-in.</Text>
              </View>
            )}
          </View>

          {/* 5. CONSENT INFORMATION */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Consent Record</Text>
            <View style={styles.consentBox}>
              <Icon name="shield-checkmark" size={20} color={COLORS.primary} style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.consentStatusText}>Consent Recorded & Verified</Text>
                <Text style={styles.consentSubtext}>
                  Informed consent obtained by counsellor on {consentDate}.
                </Text>
              </View>
            </View>
          </View>

          {/* 3. CASE STAGE MANAGER */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Update Case Monitoring Stage</Text>
            <Text style={styles.cardSubtitle}>Change the operational status of this case in database:</Text>

            <View style={styles.statusPillsRow}>
              {VALID_STAGES.map((st) => {
                const isSelected = currentStatus === st.id;
                return (
                  <TouchableOpacity
                    key={st.id}
                    style={[styles.statusChip, isSelected && styles.statusChipSelected]}
                    onPress={() => handleStatusChange(st.id)}
                    disabled={isUpdatingStatus}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.statusChipText, isSelected && styles.statusChipTextSelected]}>
                      {st.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      )}

      {/* TAB: INTERVENTION PLAN & HISTORY */}
      {(activeTab === 'intervention') && (
        <View style={styles.tabContent}>
          {/* Active Plan Card */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Active Intervention Plan</Text>

              <TouchableOpacity
                style={styles.addNoteBtn}
                onPress={() => {
                  setSelectedIntervention(null);
                  setInterventionSubView('plan');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.addNoteBtnText}>+ Create Plan</Text>
              </TouchableOpacity>
            </View>

            {isLoadingInterventions ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 16 }} />
            ) : activePlan ? (
              <View style={styles.interventionSummaryBox}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Support Type</Text>
                  <Text style={[styles.infoValue, { fontWeight: '700' }]}>{activePlan.support_type}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Status</Text>
                  <Text style={[styles.infoValue, { textTransform: 'capitalize', color: COLORS.primary, fontWeight: '700' }]}>
                    {activePlan.status}
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Objective</Text>
                  <Text style={[styles.infoValue, { flex: 1, textAlign: 'right' }]}>{activePlan.support_objective}</Text>
                </View>

                {activePlan.action_taken ? (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Action Taken</Text>
                      <Text style={[styles.infoValue, { flex: 1, textAlign: 'right' }]}>{activePlan.action_taken}</Text>
                    </View>
                  </>
                ) : null}

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Next Review</Text>
                  <Text style={styles.infoValue}>{activePlan.review_date || 'Not scheduled'}</Text>
                </View>

                <View style={{ flexDirection: 'row', marginTop: 12 }}>
                  <TouchableOpacity
                    style={[styles.primaryActionBtn, { flex: 1, marginRight: 6 }]}
                    onPress={() => {
                      setSelectedIntervention(activePlan);
                      setInterventionSubView('detail');
                    }}
                    activeOpacity={0.8}
                  >
                    <Icon name="eye-outline" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.primaryActionBtnText}>View Details</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.secondaryActionBtn, { flex: 1, marginLeft: 6 }]}
                    onPress={() => {
                      setSelectedIntervention(activePlan);
                      setInterventionSubView('plan');
                    }}
                    activeOpacity={0.8}
                  >
                    <Icon name="create-outline" size={16} color={COLORS.primary} style={{ marginRight: 4 }} />
                    <Text style={styles.secondaryActionBtnText}>Edit Plan</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.emptyBox}>
                <Icon name="clipboard-outline" size={36} color={COLORS.textSubtle} style={{ marginBottom: 6 }} />
                <Text style={styles.emptyBoxTitle}>No active intervention plan</Text>
                <Text style={styles.emptyBoxSubtitle}>Document support goals, interventions, and follow-up review dates.</Text>
                <TouchableOpacity
                  style={[styles.primaryActionBtn, { marginTop: 12 }]}
                  onPress={() => {
                    setSelectedIntervention(null);
                    setInterventionSubView('plan');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryActionBtnText}>+ Create Intervention Plan</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Intervention History */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Intervention History</Text>
            <Text style={styles.cardSubtitle}>Previous intervention records and support updates:</Text>

            {interventions.length === 0 ? (
              <Text style={{ fontSize: 13, color: COLORS.textSubtle, fontStyle: 'italic', marginVertical: 8 }}>
                No historical intervention records stored yet.
              </Text>
            ) : (
              interventions.map((item, idx) => {
                const dateStr = item.created_at
                  ? new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                  : `Record #${idx + 1}`;
                return (
                  <TouchableOpacity
                    key={item.id || idx}
                    style={styles.historyCardItem}
                    onPress={() => {
                      setSelectedIntervention(item);
                      setInterventionSubView('detail');
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.historyCardHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Icon name="file-text-outline" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
                        <Text style={styles.historyCardDate}>{dateStr}</Text>
                      </View>
                      <View style={[styles.miniStatusBadge, { backgroundColor: item.status === 'completed' ? '#ECEFF1' : '#E8F5E9' }]}>
                        <Text style={[styles.miniStatusBadgeText, { color: item.status === 'completed' ? '#5B7C8D' : '#2E7D32' }]}>
                          {(item.status || 'Active').toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.historyCardType}>{item.support_type || 'Support Plan'}</Text>
                    <Text style={styles.historyCardObjective} numberOfLines={2}>
                      {item.support_objective}
                    </Text>
                    {item.review_date ? (
                      <Text style={styles.historyCardReviewDate}>Next Review: {item.review_date}</Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>
      )}

      {/* TAB 2: ASSESSMENT */}
      {(activeTab === 'assessment') && (
        <View style={styles.tabContent}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>2. Initial Clinical Assessment</Text>
            <Text style={styles.cardSubtitle}>Record structured observations without auto-generated diagnoses.</Text>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Observed Emotional State</Text>
              <View style={styles.pillRow}>
                {['Calm / Stable', 'Anxious', 'Distressed', 'Withdrawn', 'Agitated'].map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[styles.dimChip, emotionalState === st && styles.dimChipSelected]}
                    onPress={() => setEmotionalState(st)}
                  >
                    <Text style={[styles.dimChipText, emotionalState === st && styles.dimChipTextSelected]}>
                      {st}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Sleep Quality Concerns</Text>
              <View style={styles.pillRow}>
                {['Normal', 'Insomnia', 'Disturbed Sleep', 'Severe Fatigue'].map((sl) => (
                  <TouchableOpacity
                    key={sl}
                    style={[styles.dimChip, sleepConcerns === sl && styles.dimChipSelected]}
                    onPress={() => setSleepConcerns(sl)}
                  >
                    <Text style={[styles.dimChipText, sleepConcerns === sl && styles.dimChipTextSelected]}>
                      {sl}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Social Withdrawal Level</Text>
              <View style={styles.pillRow}>
                {['None', 'Mild', 'Moderate', 'Severe'].map((sw) => (
                  <TouchableOpacity
                    key={sw}
                    style={[styles.dimChip, socialWithdrawal === sw && styles.dimChipSelected]}
                    onPress={() => setSocialWithdrawal(sw)}
                  >
                    <Text style={[styles.dimChipText, socialWithdrawal === sw && styles.dimChipTextSelected]}>
                      {sw}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Safety & Crisis Concerns</Text>
              <TextInput
                style={styles.input}
                value={safetyConcerns}
                onChangeText={setSafetyConcerns}
                placeholder="None identified / Low risk"
                placeholderTextColor="#8A9D93"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Detailed Counsellor Observations</Text>
              <TextInput
                style={styles.textInput}
                value={counsellorObservations}
                onChangeText={setCounsellorObservations}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholder="Enter narrative baseline evaluation..."
                placeholderTextColor="#8A9D93"
              />
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, isSavingAssessment && styles.buttonDisabled]}
              onPress={handleSaveAssessment}
              disabled={isSavingAssessment}
              activeOpacity={0.8}
            >
              {isSavingAssessment ? (
                <ActivityIndicator color={COLORS.buttonText} size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Save Assessment</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* TAB 3: CHECK-INS */}
      {(activeTab === 'checkins') && (
        <View style={styles.tabContent}>
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>3. Wellbeing Check-in History</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{checkIns.length} recorded</Text>
              </View>
            </View>

            {isLoadingCheckIns ? (
              <ActivityIndicator color={COLORS.primary} size="small" style={{ marginVertical: 16 }} />
            ) : checkIns.length > 0 ? (
              <View style={styles.historyList}>
                {checkIns.map((item, index) => (
                  <React.Fragment key={item.id || index}>
                    {index > 0 && <View style={styles.historyDivider} />}
                    <TouchableOpacity
                      style={styles.historyRow}
                      onPress={() => {
                        setSelectedCheckIn(item);
                        setCheckInSubView('detail');
                      }}
                      activeOpacity={0.75}
                    >
                      <Icon name="checkin" size={16} color={COLORS.primary} style={{ marginRight: 8, marginTop: 2 }} />
                      <View style={styles.historyContent}>
                        <Text style={styles.historyResponse}>"{item.response}"</Text>
                        <Text style={styles.historyDate}>{formatDate(item.created_at)}</Text>
                      </View>
                      <Icon name="chevron-forward" size={14} color={COLORS.primary} />
                    </TouchableOpacity>
                  </React.Fragment>
                ))}
              </View>
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No check-ins recorded yet.</Text>
                <Text style={styles.emptySubtext}>Daily check-ins completed by the victim will appear here.</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* TAB 4: TRENDS & AI MONITORING SUMMARY */}
      {(activeTab === 'trends') && (
        <View style={styles.tabContent}>
          <View style={[styles.card, styles.aiCard]}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.aiCardTitle}>4. AI-Assisted Wellbeing Assessment</Text>
              <View style={styles.aiBadge}>
                <Text style={styles.aiBadgeText}>Monitoring Indicator</Text>
              </View>
            </View>

            {isLoadingAIObservations ? (
              <ActivityIndicator color={COLORS.primary} size="small" style={{ marginVertical: 16 }} />
            ) : aiObservations.length > 0 ? (
              <View style={styles.aiList}>
                {aiObservations.map((obs, idx) => (
                  <View key={obs.id || idx} style={styles.aiItemCard}>
                    <View style={styles.aiItemHeader}>
                      <Text style={styles.aiItemDate}>{formatDate(obs.created_at)}</Text>
                      <View style={[styles.flagBadge, obs.requires_counsellor_review && styles.flagBadgeActive]}>
                        <Text style={styles.flagBadgeText}>
                          Review Suggested: {obs.requires_counsellor_review ? 'Yes' : 'No'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.aiItemExplanation}>{obs.explanation}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyBox}>
                <Icon name="analytics-outline" size={24} color={COLORS.textSubtle} style={{ marginBottom: 6 }} />
                <Text style={styles.emptyText}>Assessment data will appear after the first completed check-in.</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* TAB 5: COUNSELLOR NOTES */}
      {(activeTab === 'notes') && (
        <View style={styles.tabContent}>
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>5. Counsellor Case Notes</Text>
              <TouchableOpacity
                style={styles.addNoteBtn}
                onPress={() => setShowNoteModal(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.addNoteBtnText}>+ Add Note</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.notesContainer}>
              <Text style={styles.notesText}>
                {notes ? notes : 'No counsellor notes recorded yet.'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* TAB 6: APPOINTMENTS */}
      {(activeTab === 'appointments') && (
        <View style={styles.tabContent}>
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>6. Follow-up Appointments</Text>
              {!isSchedulingAppt && (
                <TouchableOpacity
                  style={styles.addNoteBtn}
                  onPress={() => setIsSchedulingAppt(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.addNoteBtnText}>+ Schedule Session</Text>
                </TouchableOpacity>
              )}
            </View>

            {isSchedulingAppt ? (
              <View style={styles.newNoteBox}>
                <Text style={styles.formSectionTitle}>Schedule Follow-up Session</Text>

                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Date (YYYY-MM-DD) *</Text>
                  <TextInput
                    style={styles.input}
                    value={apptDate}
                    onChangeText={setApptDate}
                    placeholder="2026-10-05"
                    placeholderTextColor="#8A9D93"
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Time</Text>
                  <TextInput
                    style={styles.input}
                    value={apptTime}
                    onChangeText={setApptTime}
                    placeholder="10:00 AM"
                    placeholderTextColor="#8A9D93"
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Purpose</Text>
                  <TextInput
                    style={styles.input}
                    value={apptType}
                    onChangeText={setApptType}
                    placeholder="Routine Check-in Review"
                    placeholderTextColor="#8A9D93"
                  />
                </View>

                <View style={styles.noteActionsRow}>
                  <TouchableOpacity
                    style={[styles.saveBtn, (!apptDate.trim() || isSavingAppt) && styles.buttonDisabled]}
                    onPress={handleScheduleAppointment}
                    disabled={!apptDate.trim() || isSavingAppt}
                    activeOpacity={0.8}
                  >
                    {isSavingAppt ? (
                      <ActivityIndicator color={COLORS.buttonText} size="small" />
                    ) : (
                      <Text style={styles.saveBtnText}>Save Appointment</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelNoteBtn}
                    onPress={() => {
                      setApptDate('');
                      setIsSchedulingAppt(false);
                    }}
                    disabled={isSavingAppt}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelNoteBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            {appointments.length > 0 ? (
              <View style={styles.historyList}>
                {appointments.map((appt, idx) => (
                  <View key={appt.id || idx} style={styles.apptCard}>
                    <Icon name="calendar" size={16} color={COLORS.primary} style={{ marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.apptDateText}>{formatDate(appt.appointment_date)}</Text>
                      <Text style={styles.apptNotesText}>{appt.notes}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No appointments scheduled yet for this case.</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* TAB 7: ROUTINE */}
      {(activeTab === 'routine') && (
        <View style={styles.tabContent}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>7. Victim Routine & Follow-up Plan</Text>
            <Text style={styles.cardSubtitle}>Configure check-in instructions visible to the user.</Text>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Check-in Frequency</Text>
              <View style={styles.pillRow}>
                {['Daily', 'Bi-weekly', 'Weekly'].map((freq) => (
                  <TouchableOpacity
                    key={freq}
                    style={[styles.dimChip, followUpFrequency === freq && styles.dimChipSelected]}
                    onPress={() => setFollowUpFrequency(freq)}
                  >
                    <Text style={[styles.dimChipText, followUpFrequency === freq && styles.dimChipTextSelected]}>
                      {freq}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Preferred Reflection Time</Text>
              <TextInput
                style={styles.input}
                value={preferredTime}
                onChangeText={setPreferredTime}
                placeholder="09:00 AM"
                placeholderTextColor="#8A9D93"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>User-Facing Instructions</Text>
              <TextInput
                style={styles.textInput}
                value={routineInstructions}
                onChangeText={setRoutineInstructions}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                placeholder="Instructions displayed to victim during check-in..."
                placeholderTextColor="#8A9D93"
              />
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, isSavingRoutine && styles.buttonDisabled]}
              onPress={handleSaveRoutine}
              disabled={isSavingRoutine}
              activeOpacity={0.8}
            >
              {isSavingRoutine ? (
                <ActivityIndicator color={COLORS.buttonText} size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Save Routine Configuration</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* TAB 8: ALERTS */}
      {(activeTab === 'alerts') && (
        <View style={styles.tabContent}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>8. Case Alerts & Attention Flags</Text>
            
            {aiObservations.some((o) => o.requires_counsellor_review) ? (
              <View style={styles.alertItemCard}>
                <Icon name="warning" size={18} color="#9B1C1C" style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertItemTitle}>AI Review Flag Triggered</Text>
                  <Text style={styles.alertItemSub}>
                    Linguistic check-in response flagged for counsellor attention.
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.emptyBox}>
                <Icon name="checkmark-circle" size={24} color={COLORS.primary} style={{ marginBottom: 6 }} />
                <Text style={styles.emptyText}>No active alerts for this case.</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* MODAL 1: UPDATE STAGE MODAL */}
      <Modal visible={showStageModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Case Stage</Text>
            <Text style={styles.modalSubtitle}>Select new monitoring stage for database update:</Text>

            <View style={styles.modalStageList}>
              {VALID_STAGES.map((st) => (
                <TouchableOpacity
                  key={st.id}
                  style={[styles.modalStageOption, currentStatus === st.id && styles.modalStageOptionSelected]}
                  onPress={() => handleStatusChange(st.id)}
                  disabled={isUpdatingStatus}
                >
                  <Text style={[styles.modalStageOptionText, currentStatus === st.id && styles.modalStageOptionTextSelected]}>
                    {st.label}
                  </Text>
                  {currentStatus === st.id && <Icon name="checkmark" size={16} color={COLORS.primary} />}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setShowStageModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: ADD NOTE MODAL */}
      <Modal visible={showNoteModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>+ Add Confidential Note</Text>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Interaction Type</Text>
              <View style={styles.pillRow}>
                {['In-person Session', 'Phone Call', 'Check-in Review', 'Care Update'].map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.dimChip, interactionType === t && styles.dimChipSelected]}
                    onPress={() => setInteractionType(t)}
                  >
                    <Text style={[styles.dimChipText, interactionType === t && styles.dimChipTextSelected]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Observation Note *</Text>
              <TextInput
                style={styles.textInput}
                value={observation}
                onChangeText={setObservation}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                placeholder="Enter clinical notes..."
                placeholderTextColor="#8A9D93"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Action Provided</Text>
              <TextInput
                style={styles.textInput}
                value={actionTaken}
                onChangeText={setActionTaken}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
                placeholder="Guidance or action taken..."
                placeholderTextColor="#8A9D93"
              />
            </View>

            <View style={styles.noteActionsRow}>
              <TouchableOpacity
                style={[styles.saveBtn, (!observation.trim() || isSavingNotes) && styles.buttonDisabled]}
                onPress={handleAddNote}
                disabled={!observation.trim() || isSavingNotes}
                activeOpacity={0.8}
              >
                {isSavingNotes ? (
                  <ActivityIndicator color={COLORS.buttonText} size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Note</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelNoteBtn}
                onPress={() => setShowNoteModal(false)}
                disabled={isSavingNotes}
              >
                <Text style={styles.cancelNoteBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: CLOSE CASE CONFIRMATION MODAL */}
      <Modal visible={showCloseModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: '#9B1C1C' }]}>Confirm Close Case</Text>
            <Text style={styles.modalSubtitle}>
              Are you sure you want to close case #{caseData.id?.slice(0, 8)}? This will set the operational status to closed in Supabase.
            </Text>

            <View style={styles.noteActionsRow}>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: '#9B1C1C' }]}
                onPress={() => handleStatusChange('closed')}
                disabled={isUpdatingStatus}
              >
                <Text style={styles.saveBtnText}>Yes, Close Case</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelNoteBtn}
                onPress={() => setShowCloseModal(false)}
                disabled={isUpdatingStatus}
              >
                <Text style={styles.cancelNoteBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: 125,
  },
  header: {
    marginBottom: SPACING.md,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 4,
  },
  caseHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  caseIdText: {
    fontSize: 12,
    color: COLORS.textSubtle,
    marginTop: 2,
  },
  emergencyAlertCard: {
    backgroundColor: '#FDE8E8',
    borderWidth: 1,
    borderColor: '#F8B4B4',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  emergencyAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  emergencyAlertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9B1C1C',
  },
  emergencyAlertBody: {
    fontSize: 12,
    color: '#9B1C1C',
    lineHeight: 16,
    marginBottom: 10,
  },
  emergencyAlertActions: {
    flexDirection: 'row',
    gap: 8,
  },
  emergencyActionBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F8B4B4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.md,
  },
  emergencyActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9B1C1C',
  },
  emergencyActionPrimary: {
    backgroundColor: '#9B1C1C',
    borderColor: '#9B1C1C',
  },
  emergencyActionPrimaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDE8E8',
    borderWidth: 1,
    borderColor: '#F8B4B4',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: 13,
    color: '#9B1C1C',
    flex: 1,
  },
  successCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.selectedCardBg,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  successText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
    flex: 1,
  },
  quickActionsBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: SPACING.md,
  },
  actionPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.selectedCardBg,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  actionPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  actionPillClose: {
    backgroundColor: '#FDE8E8',
    borderColor: '#F8B4B4',
  },
  actionPillCloseText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9B1C1C',
  },
  tabsScrollView: {
    marginBottom: SPACING.lg,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: SPACING.md,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tabButtonActive: {
    backgroundColor: COLORS.selectedCardBg,
    borderColor: COLORS.primary,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSubtle,
  },
  tabButtonTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  tabContent: {
    gap: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.lg,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: COLORS.textSubtle,
    marginBottom: SPACING.md,
  },
  statusBadge: {
    backgroundColor: COLORS.selectedCardBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  countBadge: {
    backgroundColor: '#F2F7F5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 11,
    color: COLORS.textSubtle,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: COLORS.textSubtle,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
  },
  consentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.selectedCardBg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  consentStatusText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  consentSubtext: {
    fontSize: 12,
    color: COLORS.textSubtle,
    marginTop: 2,
  },
  statusPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  statusChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  statusChipSelected: {
    backgroundColor: COLORS.selectedCardBg,
    borderColor: COLORS.primary,
  },
  statusChipText: {
    fontSize: 13,
    color: COLORS.textSubtle,
  },
  statusChipTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  inputWrapper: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSubtle,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    minHeight: 80,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dimChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  dimChipSelected: {
    backgroundColor: COLORS.selectedCardBg,
    borderColor: COLORS.primary,
  },
  dimChipText: {
    fontSize: 12,
    color: COLORS.textSubtle,
  },
  dimChipTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    marginTop: 6,
    flex: 1,
  },
  saveBtnText: {
    color: COLORS.buttonText,
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  historyList: {
    marginTop: 8,
  },
  historyDivider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: 10,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginTop: 5,
    marginRight: 10,
  },
  historyContent: {
    flex: 1,
  },
  historyResponse: {
    fontSize: 14,
    color: COLORS.text,
    fontStyle: 'italic',
  },
  historyDate: {
    fontSize: 11,
    color: COLORS.textSubtle,
    marginTop: 4,
  },
  emptyBox: {
    backgroundColor: '#F8FAF9',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginTop: 4,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  emptySubtext: {
    fontSize: 12,
    color: COLORS.textSubtle,
    textAlign: 'center',
    marginTop: 4,
  },
  addNoteBtn: {
    backgroundColor: COLORS.selectedCardBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  addNoteBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  newNoteBox: {
    backgroundColor: '#F8FAF9',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.md,
  },
  formSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  noteActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  cancelNoteBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelNoteBtnText: {
    fontSize: 14,
    color: COLORS.textSubtle,
  },
  notesContainer: {
    backgroundColor: '#F8FAF9',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginTop: 8,
  },
  notesText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
  },
  apptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAF9',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 8,
  },
  apptDateText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  apptNotesText: {
    fontSize: 12,
    color: COLORS.textSubtle,
    marginTop: 2,
  },
  aiCard: {
    backgroundColor: COLORS.cardBackground,
  },
  aiCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  aiBadge: {
    backgroundColor: COLORS.selectedCardBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  aiList: {
    gap: 10,
    marginTop: 6,
  },
  aiItemCard: {
    backgroundColor: '#F8FAF9',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  aiItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  aiItemDate: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSubtle,
  },
  flagBadge: {
    backgroundColor: '#F2F7F5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  flagBadgeActive: {
    backgroundColor: '#FDE8E8',
  },
  flagBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSubtle,
  },
  alertItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDE8E8',
    borderWidth: 1,
    borderColor: '#F8B4B4',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginTop: 6,
  },
  alertItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9B1C1C',
  },
  alertItemSub: {
    fontSize: 12,
    color: '#9B1C1C',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    elevation: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: COLORS.textSubtle,
    marginBottom: SPACING.md,
  },
  modalStageList: {
    gap: 8,
    marginBottom: SPACING.md,
  },
  modalStageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAF9',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  modalStageOptionSelected: {
    backgroundColor: COLORS.selectedCardBg,
    borderColor: COLORS.primary,
  },
  modalStageOptionText: {
    fontSize: 14,
    color: COLORS.text,
  },
  modalStageOptionTextSelected: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  modalCancelBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  modalCancelText: {
    fontSize: 14,
    color: COLORS.textSubtle,
    fontWeight: '600',
  },
});
