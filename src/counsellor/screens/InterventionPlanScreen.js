import React, { useState, useEffect } from 'react';
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
import { createIntervention, updateIntervention } from '../services/interventionService';

const SUPPORT_CATEGORIES = [
  'Counselling',
  'Psychosocial Support',
  'Referral',
  'Safety Planning',
  'Family / Community Support',
  'Legal / Social Support',
  'Other',
];

const STATUS_OPTIONS = [
  { id: 'planned', label: 'Planned', color: COLORS.info || '#29B6F6' },
  { id: 'active', label: 'Active', color: COLORS.success || '#66BB6A' },
  { id: 'completed', label: 'Completed', color: COLORS.primary || '#5B7C8D' },
  { id: 'paused', label: 'Paused', color: COLORS.warning || '#FFA726' },
];

export default function InterventionPlanScreen({
  caseData,
  victimProfile,
  initialIntervention = null,
  onBack,
  onSaved,
}) {
  const isEditing = Boolean(initialIntervention && initialIntervention.id);

  // Form State
  const [supportType, setSupportType] = useState(initialIntervention?.support_type || 'Counselling');
  const [supportObjective, setSupportObjective] = useState(initialIntervention?.support_objective || '');
  const [actionTaken, setActionTaken] = useState(initialIntervention?.action_taken || '');
  const [nextSteps, setNextSteps] = useState(initialIntervention?.next_steps || '');
  const [reviewDate, setReviewDate] = useState(initialIntervention?.review_date || getDefaultReviewDate());
  const [status, setStatus] = useState(initialIntervention?.status || 'active');

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  function getDefaultReviewDate() {
    const d = new Date();
    d.setDate(d.getDate() + 7); // Default 1 week from today
    return formatDateDisplay(d);
  }

  function formatDateDisplay(d) {
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  const handleQuickDateSelect = (daysAhead) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    setReviewDate(formatDateDisplay(d));
  };

  const handleSave = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    // Validation: Support objective is required
    if (!supportObjective || !supportObjective.trim()) {
      setErrorMessage('Please enter the support objective before saving.');
      return;
    }

    if (!caseData || !caseData.id) {
      setErrorMessage('Case record is invalid or missing.');
      return;
    }

    // Auth verification
    const authUser = await getCurrentAuthenticatedUser();
    if (!authUser) {
      setErrorMessage('Your session has expired. Please sign in again.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        case_id: caseData.id,
        user_id: caseData.user_id,
        support_type: supportType,
        support_objective: supportObjective.trim(),
        action_taken: actionTaken.trim(),
        next_steps: nextSteps.trim(),
        review_date: reviewDate.trim(),
        status,
      };

      let result;
      if (isEditing) {
        result = await updateIntervention(initialIntervention.id, payload);
      } else {
        result = await createIntervention(payload);
      }

      if (result.success) {
        setSuccessMessage(isEditing ? 'Intervention plan updated successfully.' : 'Intervention plan created successfully.');
        setTimeout(() => {
          if (onSaved) onSaved(result.data);
        }, 600);
      } else {
        setErrorMessage(result.message || 'Unable to save the intervention plan.');
      }
    } catch (err) {
      console.warn('[InterventionPlanScreen] Save error:', err.message);
      setErrorMessage('An unexpected error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const victimName = victimProfile?.full_name || caseData?.user_profile?.full_name || 'Victim';
  const caseIdDisplay = caseData?.id ? `Case #${String(caseData.id).substring(0, 8)}` : 'Case Details';

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7} accessibilityLabel="Go back">
          <Icon name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Edit Intervention Plan' : 'Intervention Plan'}
          </Text>
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

        {/* 1. SUPPORT TYPE */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Icon name="clipboard-outline" size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>SUPPORT TYPE</Text>
          </View>
          <Text style={styles.fieldHint}>Select the primary intervention category:</Text>
          <View style={styles.chipContainer}>
            {SUPPORT_CATEGORIES.map((cat) => {
              const isSelected = supportType === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, isSelected && styles.chipActive]}
                  onPress={() => setSupportType(cat)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 2. PLAN OBJECTIVE */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Icon name="flag-outline" size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>SUPPORT OBJECTIVE</Text>
            <Text style={styles.requiredStar}>*</Text>
          </View>
          <Text style={styles.fieldHint}>Describe the immediate support objective for this case:</Text>
          <TextInput
            style={[styles.textInput, styles.multilineInput]}
            value={supportObjective}
            onChangeText={setSupportObjective}
            placeholder="Describe the immediate support objective."
            placeholderTextColor={COLORS.textSubtle}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* 3. INTERVENTION DETAILS */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Icon name="medical-outline" size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>INTERVENTION / ACTION TAKEN</Text>
          </View>
          <Text style={styles.fieldHint}>Document specific interventions or clinical actions performed:</Text>
          <TextInput
            style={[styles.textInput, styles.multilineInput]}
            value={actionTaken}
            onChangeText={setActionTaken}
            placeholder="Provided supportive counselling and discussed available support resources."
            placeholderTextColor={COLORS.textSubtle}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* 4. NEXT STEPS */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Icon name="arrow-forward-circle-outline" size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>NEXT STEPS</Text>
          </View>
          <Text style={styles.fieldHint}>Outline follow-up actions and ongoing monitoring plans:</Text>
          <TextInput
            style={[styles.textInput, styles.multilineInput]}
            value={nextSteps}
            onChangeText={setNextSteps}
            placeholder="Review wellbeing check-in during the next appointment."
            placeholderTextColor={COLORS.textSubtle}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* 5. NEXT REVIEW DATE */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Icon name="calendar-outline" size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>NEXT REVIEW DATE</Text>
          </View>
          <Text style={styles.fieldHint}>Scheduled review date for intervention assessment:</Text>
          <TextInput
            style={styles.textInput}
            value={reviewDate}
            onChangeText={setReviewDate}
            placeholder="e.g., 30 September 2026"
            placeholderTextColor={COLORS.textSubtle}
          />
          <View style={styles.quickDateRow}>
            <Text style={styles.quickDateLabel}>Quick Select:</Text>
            <TouchableOpacity style={styles.quickDateBtn} onPress={() => handleQuickDateSelect(7)}>
              <Text style={styles.quickDateBtnText}>+1 Week</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickDateBtn} onPress={() => handleQuickDateSelect(14)}>
              <Text style={styles.quickDateBtnText}>+2 Weeks</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickDateBtn} onPress={() => handleQuickDateSelect(30)}>
              <Text style={styles.quickDateBtnText}>+1 Month</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 6. INTERVENTION STATUS */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Icon name="pulse-outline" size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>INTERVENTION STATUS</Text>
          </View>
          <View style={styles.statusChipRow}>
            {STATUS_OPTIONS.map((opt) => {
              const isSelected = status === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.statusChip,
                    isSelected && { backgroundColor: opt.color, borderColor: opt.color },
                  ]}
                  onPress={() => setStatus(opt.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.statusChipText, isSelected && styles.statusChipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
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
              <Text style={styles.saveButtonText}>Saving...</Text>
            </View>
          ) : (
            <View style={styles.loadingRow}>
              <Icon name="checkmark-sharp" size={18} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>
                {isEditing ? 'Update Intervention Plan' : 'Save Intervention Plan'}
              </Text>
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
    minHeight: 80,
  },
  quickDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
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
  },
  quickDateBtnText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
  },
  statusChipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.sm,
    marginHorizontal: 3,
    backgroundColor: COLORS.background,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  statusChipTextActive: {
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
