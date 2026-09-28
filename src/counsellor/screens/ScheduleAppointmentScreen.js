import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../shared/theme/theme';
import Icon from '../../shared/components/Icon';
import { getCurrentAuthenticatedUser } from '../../shared/services/authService';
import { createFollowUpAppointment, isFutureOrTodayDate } from '../services/appointmentService';

const SESSION_TYPES = [
  'Routine Follow-up',
  'Clinical Review',
  'Check-in Assessment',
  'Crisis Support',
  'Other',
];

const TIME_PRESETS = ['09:00 AM', '10:30 AM', '02:00 PM', '04:00 PM'];

export default function ScheduleAppointmentScreen({
  caseData,
  victimProfile,
  onBack,
  onScheduled,
}) {
  const victimName = victimProfile?.full_name || caseData?.userName || caseData?.user_profile?.full_name || 'Victim Record';
  const caseIdDisplay = caseData?.id ? `Case #${String(caseData.id).substring(0, 8)}` : 'Case Details';
  const userId = caseData?.user_id || caseData?.id;

  // Form State
  const [apptDate, setApptDate] = useState(getTodayISOString());
  const [apptTime, setApptTime] = useState('10:30 AM');
  const [sessionType, setSessionType] = useState('Routine Follow-up');
  const [notes, setNotes] = useState('');

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  function getTodayISOString() {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }

  function handleQuickDateSelect(daysAhead) {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    setApptDate(d.toISOString().split('T')[0]);
  }

  const handleSave = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!userId) {
      setErrorMessage('Target victim user record is required.');
      return;
    }

    if (!apptDate || !apptDate.trim()) {
      setErrorMessage('Please select a valid appointment date.');
      return;
    }

    // Validate future/today date
    if (!isFutureOrTodayDate(apptDate.trim())) {
      setErrorMessage('Please select a future date and time.');
      return;
    }

    const authUser = await getCurrentAuthenticatedUser();
    if (!authUser) {
      setErrorMessage('Your session has expired. Please sign in again.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await createFollowUpAppointment({
        userId,
        caseId: caseData?.id,
        appointmentDate: apptDate.trim(),
        time: apptTime,
        type: sessionType,
        notes: notes.trim(),
      });

      if (res.success) {
        setSuccessMessage('Follow-up appointment scheduled successfully.');
        setTimeout(() => {
          if (onScheduled) onScheduled(res.appointment);
          else if (onBack) onBack();
        }, 600);
      } else {
        setErrorMessage(res.message || 'Unable to schedule the follow-up.');
      }
    } catch (err) {
      console.warn('[ScheduleAppointmentScreen] Save error:', err.message);
      setErrorMessage(err.message || 'Unable to schedule the follow-up.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7} accessibilityLabel="Go back">
          <Icon name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Schedule Follow-up</Text>
          <Text style={styles.headerSubtitle}>
            {victimName} ({caseIdDisplay})
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Banner Alert Messages */}
        {Boolean(errorMessage) && (
          <View style={styles.errorCard}>
            <Icon name="alert-circle-outline" size={20} color={COLORS.error || '#D32F2F'} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {Boolean(successMessage) && (
          <View style={styles.successCard}>
            <Icon name="checkmark-circle-outline" size={20} color={COLORS.success || '#2E7D32'} />
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        )}

        {/* 1. DATE SELECTION */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Icon name="calendar-outline" size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>APPOINTMENT DATE</Text>
            <Text style={styles.requiredStar}>*</Text>
          </View>
          <Text style={styles.fieldHint}>Enter or select the scheduled follow-up date (YYYY-MM-DD):</Text>
          <TextInput
            style={styles.textInput}
            value={apptDate}
            onChangeText={setApptDate}
            placeholder="2026-10-05"
            placeholderTextColor={COLORS.textSubtle}
          />
          <View style={styles.quickDateRow}>
            <Text style={styles.quickDateLabel}>Quick Select:</Text>
            <TouchableOpacity style={styles.quickDateBtn} onPress={() => handleQuickDateSelect(0)}>
              <Text style={styles.quickDateBtnText}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickDateBtn} onPress={() => handleQuickDateSelect(1)}>
              <Text style={styles.quickDateBtnText}>Tomorrow</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickDateBtn} onPress={() => handleQuickDateSelect(3)}>
              <Text style={styles.quickDateBtnText}>+3 Days</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickDateBtn} onPress={() => handleQuickDateSelect(7)}>
              <Text style={styles.quickDateBtnText}>+1 Week</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. TIME SELECTION */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Icon name="time-outline" size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>APPOINTMENT TIME</Text>
          </View>
          <Text style={styles.fieldHint}>Select scheduled session start time:</Text>
          <TextInput
            style={styles.textInput}
            value={apptTime}
            onChangeText={setApptTime}
            placeholder="10:30 AM"
            placeholderTextColor={COLORS.textSubtle}
          />
          <View style={styles.quickDateRow}>
            {TIME_PRESETS.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.quickDateBtn, apptTime === t && styles.quickTimeBtnActive]}
                onPress={() => setApptTime(t)}
              >
                <Text style={[styles.quickDateBtnText, apptTime === t && styles.quickTimeBtnTextActive]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 3. SESSION PURPOSE / TYPE */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Icon name="clipboard-outline" size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>SESSION PURPOSE</Text>
          </View>
          <Text style={styles.fieldHint}>Select follow-up category:</Text>
          <View style={styles.chipContainer}>
            {SESSION_TYPES.map((type) => {
              const isSelected = sessionType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.chip, isSelected && styles.chipActive]}
                  onPress={() => setSessionType(type)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{type}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 4. PURPOSE / NOTES */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Icon name="document-text-outline" size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>PURPOSE & AGENDA NOTES</Text>
          </View>
          <Text style={styles.fieldHint}>Add a short note about the purpose of this follow-up:</Text>
          <TextInput
            style={[styles.textInput, styles.multilineInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add a short note about the purpose of this follow-up."
            placeholderTextColor={COLORS.textSubtle}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* FOOTER ACTIONS */}
      <View style={styles.footerContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onBack}
          disabled={isSubmitting}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Scheduling...</Text>
            </View>
          ) : (
            <View style={styles.loadingRow}>
              <Icon name="calendar-sharp" size={18} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Schedule Follow-up</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: Platform.OS === 'ios' ? 48 : 16,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  backButton: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textSubtle,
    marginTop: 2,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 13,
    marginLeft: SPACING.xs,
    flex: 1,
  },
  successCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  successText: {
    color: '#2E7D32',
    fontSize: 13,
    marginLeft: SPACING.xs,
    flex: 1,
  },
  sectionCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginLeft: SPACING.xs,
    letterSpacing: 0.5,
  },
  requiredStar: {
    color: COLORS.error || '#D32F2F',
    marginLeft: 4,
    fontWeight: '700',
  },
  fieldHint: {
    fontSize: 12,
    color: COLORS.textSubtle,
    marginBottom: SPACING.sm,
  },
  textInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  multilineInput: {
    minHeight: 90,
  },
  quickDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    flexWrap: 'wrap',
  },
  quickDateLabel: {
    fontSize: 11,
    color: COLORS.textSubtle,
    marginRight: SPACING.xs,
  },
  quickDateBtn: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 6,
    marginVertical: 2,
  },
  quickDateBtnText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
  },
  quickTimeBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  quickTimeBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  chip: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    margin: 4,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  footerContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.cardBackground,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginRight: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSubtle,
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
