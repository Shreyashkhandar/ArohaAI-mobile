import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../shared/theme/theme';
import Icon from '../../shared/components/Icon';
import { completeIntervention } from '../services/interventionService';

const STATUS_BADGES = {
  planned: { label: 'Planned', color: '#0288D1', bg: '#E1F5FE' },
  active: { label: 'Active', color: '#2E7D32', bg: '#E8F5E9' },
  completed: { label: 'Completed', color: '#5B7C8D', bg: '#ECEFF1' },
  paused: { label: 'Paused', color: '#EF6C00', bg: '#FFF3E0' },
};

export default function InterventionDetailScreen({
  intervention,
  victimProfile,
  caseData,
  onBack,
  onEdit,
  onUpdated,
}) {
  const [currentIntervention, setCurrentIntervention] = useState(intervention);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!currentIntervention) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Intervention details not available.</Text>
        <TouchableOpacity style={styles.backButtonSimple} onPress={onBack}>
          <Text style={styles.backButtonTextSimple}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusKey = (currentIntervention.status || 'active').toLowerCase();
  const badgeConfig = STATUS_BADGES[statusKey] || STATUS_BADGES.active;
  const isCompleted = statusKey === 'completed';

  const handleMarkCompleted = async () => {
    setIsUpdating(true);
    setErrorMessage('');
    try {
      const res = await completeIntervention(currentIntervention.id, caseData?.id);
      if (res.success) {
        const updated = { ...currentIntervention, status: 'completed' };
        setCurrentIntervention(updated);
        setShowCompleteModal(false);
        if (onUpdated) onUpdated(updated);
      } else {
        setErrorMessage(res.message || 'Failed to complete intervention.');
      }
    } catch (err) {
      console.warn('[InterventionDetailScreen] Mark completed error:', err.message);
      setErrorMessage('Unable to complete intervention.');
    } finally {
      setIsUpdating(false);
    }
  };

  const victimName = victimProfile?.full_name || caseData?.user_profile?.full_name || 'Victim';
  const createdDateDisplay = currentIntervention.created_at
    ? new Date(currentIntervention.created_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'N/A';

  const updatedDateDisplay = currentIntervention.updated_at
    ? new Date(currentIntervention.updated_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'N/A';

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7} accessibilityLabel="Go back">
          <Icon name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Intervention Record</Text>
          <Text style={styles.headerSubtitle}>{victimName}</Text>
        </View>
        {!isCompleted && (
          <TouchableOpacity
            style={styles.headerEditBtn}
            onPress={() => onEdit(currentIntervention)}
            activeOpacity={0.7}
          >
            <Icon name="create-outline" size={18} color={COLORS.primary} />
            <Text style={styles.headerEditText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {Boolean(errorMessage) && (
          <View style={styles.errorCard}>
            <Icon name="alert-circle-outline" size={20} color={COLORS.error || '#D32F2F'} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* STATUS & TYPE CARD */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeaderRow}>
            <View style={[styles.badge, { backgroundColor: badgeConfig.bg }]}>
              <Text style={[styles.badgeText, { color: badgeConfig.color }]}>
                {badgeConfig.label}
              </Text>
            </View>
            <Text style={styles.typeLabel}>{currentIntervention.support_type || 'Counselling'}</Text>
          </View>
        </View>

        {/* SUPPORT OBJECTIVE */}
        <View style={styles.detailCard}>
          <View style={styles.sectionHeaderRow}>
            <Icon name="flag-outline" size={18} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Support Objective</Text>
          </View>
          <Text style={styles.bodyText}>{currentIntervention.support_objective || 'None recorded'}</Text>
        </View>

        {/* ACTION TAKEN */}
        <View style={styles.detailCard}>
          <View style={styles.sectionHeaderRow}>
            <Icon name="medical-outline" size={18} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Action Taken</Text>
          </View>
          <Text style={styles.bodyText}>{currentIntervention.action_taken || 'No action details provided.'}</Text>
        </View>

        {/* NEXT STEPS */}
        <View style={styles.detailCard}>
          <View style={styles.sectionHeaderRow}>
            <Icon name="arrow-forward-circle-outline" size={18} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Next Steps</Text>
          </View>
          <Text style={styles.bodyText}>{currentIntervention.next_steps || 'No next steps specified.'}</Text>
        </View>

        {/* SCHEDULE & REVIEW */}
        <View style={styles.detailCard}>
          <View style={styles.sectionHeaderRow}>
            <Icon name="calendar-outline" size={18} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Schedule & Review</Text>
          </View>
          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Next Review Date</Text>
              <Text style={styles.metaValue}>{currentIntervention.review_date || 'Not scheduled'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Created Date</Text>
              <Text style={styles.metaValue}>{createdDateDisplay}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Last Updated</Text>
              <Text style={styles.metaValue}>{updatedDateDisplay}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* FOOTER ACTION BUTTON */}
      {!isCompleted && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.completeBtn}
            onPress={() => setShowCompleteModal(true)}
            activeOpacity={0.8}
          >
            <Icon name="checkmark-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.completeBtnText}>Mark Completed</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* CONFIRM COMPLETION MODAL */}
      <Modal visible={showCompleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Icon name="checkmark-circle" size={40} color={COLORS.primary} />
            <Text style={styles.modalTitle}>Mark Completed</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to mark this intervention plan as completed?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowCompleteModal(false)}
                disabled={isUpdating}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleMarkCompleted}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmText}>Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.background,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSubtle,
    marginBottom: SPACING.md,
  },
  backButtonSimple: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: BORDER_RADIUS.sm,
  },
  backButtonTextSimple: {
    color: '#FFFFFF',
    fontWeight: '600',
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
  headerEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  headerEditText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 4,
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
  statusCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  statusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  detailCard: {
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
    marginBottom: SPACING.xs,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginLeft: SPACING.xs,
  },
  bodyText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 20,
    marginTop: 4,
  },
  metaGrid: {
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  metaLabel: {
    fontSize: 12,
    color: COLORS.textSubtle,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  footer: {
    padding: SPACING.md,
    backgroundColor: COLORS.cardBackground,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.md,
  },
  completeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  modalMessage: {
    fontSize: 14,
    color: COLORS.textSubtle,
    textAlign: 'center',
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginRight: SPACING.xs,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSubtle,
  },
  modalConfirmBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    marginLeft: SPACING.xs,
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
