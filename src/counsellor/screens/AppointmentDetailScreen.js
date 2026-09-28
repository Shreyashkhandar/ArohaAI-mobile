import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../shared/theme/theme';
import Icon from '../../shared/components/Icon';
import {
  completeAppointment,
  cancelAppointment,
  updateAppointment,
  isFutureOrTodayDate,
} from '../services/appointmentService';

const STATUS_BADGES = {
  scheduled: { label: 'Scheduled', color: '#0288D1', bg: '#E1F5FE' },
  completed: { label: 'Completed', color: '#2E7D32', bg: '#E8F5E9' },
  cancelled: { label: 'Cancelled', color: '#D32F2F', bg: '#FFEBEE' },
};

export default function AppointmentDetailScreen({
  appointment,
  caseData,
  onBack,
  onOpenCase,
  onUpdated,
}) {
  const [currentAppt, setCurrentAppt] = useState(appointment);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Confirm Modals State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState(''); // 'complete' | 'cancel'

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDate, setEditDate] = useState(currentAppt?.appointment_date || '');
  const [editTime, setEditTime] = useState('10:30 AM');
  const [editNotes, setEditNotes] = useState(currentAppt?.notes || '');

  if (!currentAppt) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Appointment record not available.</Text>
        <TouchableOpacity style={styles.backBtnSimple} onPress={onBack}>
          <Text style={styles.backBtnTextSimple}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusKey = (currentAppt.status || 'scheduled').toLowerCase();
  const badgeConfig = STATUS_BADGES[statusKey] || STATUS_BADGES.scheduled;
  const isScheduled = statusKey === 'scheduled';

  const victimName = currentAppt.userName || caseData?.userName || 'Victim Record';
  const caseIdDisplay = caseData?.id || currentAppt.case_id ? `Case #${String(caseData?.id || currentAppt.case_id).substring(0, 8)}` : 'Case Details';

  const createdDateStr = currentAppt.created_at
    ? new Date(currentAppt.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'N/A';

  const updatedDateStr = currentAppt.updated_at
    ? new Date(currentAppt.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'N/A';

  const handleActionConfirm = async () => {
    if (!actionType) return;
    setIsUpdating(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      let res;
      if (actionType === 'complete') {
        res = await completeAppointment(currentAppt.id);
        if (res.success) setSuccessMessage('Appointment marked as completed.');
      } else if (actionType === 'cancel') {
        res = await cancelAppointment(currentAppt.id);
        if (res.success) setSuccessMessage('Appointment cancelled.');
      }

      if (res && res.success) {
        const updated = { ...currentAppt, status: actionType === 'complete' ? 'completed' : 'cancelled' };
        setCurrentAppt(updated);
        setShowConfirmModal(false);
        if (onUpdated) onUpdated(updated);
      } else {
        setErrorMessage('Failed to update appointment status.');
      }
    } catch (err) {
      console.warn('[AppointmentDetailScreen] Status update error:', err.message);
      setErrorMessage(err.message || 'Unable to update appointment status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editDate.trim()) {
      setErrorMessage('Please enter an appointment date.');
      return;
    }

    if (!isFutureOrTodayDate(editDate.trim())) {
      setErrorMessage('Please select a future date and time.');
      return;
    }

    setIsUpdating(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await updateAppointment(currentAppt.id, {
        appointmentDate: editDate.trim(),
        time: editTime,
        notes: editNotes,
      });

      if (res.success) {
        const updated = {
          ...currentAppt,
          appointment_date: editDate.trim(),
          notes: `[Rescheduled] Time: ${editTime}${editNotes ? '\nNotes: ' + editNotes.trim() : ''}`,
          updated_at: new Date().toISOString(),
        };
        setCurrentAppt(updated);
        setShowEditModal(false);
        setSuccessMessage('Appointment rescheduled successfully.');
        if (onUpdated) onUpdated(updated);
      } else {
        setErrorMessage('Failed to update appointment.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Unable to update appointment.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7} accessibilityLabel="Go back">
          <Icon name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Appointment Details</Text>
          <Text style={styles.headerSubtitle}>{victimName} ({caseIdDisplay})</Text>
        </View>

        {onOpenCase && (
          <TouchableOpacity style={styles.headerOpenCaseBtn} onPress={() => onOpenCase(currentAppt)} activeOpacity={0.8}>
            <Text style={styles.headerOpenCaseText}>View Case</Text>
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

        {Boolean(successMessage) && (
          <View style={styles.successCard}>
            <Icon name="checkmark-circle-outline" size={20} color={COLORS.success || '#2E7D32'} />
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        )}

        {/* STATUS CARD */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeaderRow}>
            <View style={[styles.badge, { backgroundColor: badgeConfig.bg }]}>
              <Text style={[styles.badgeText, { color: badgeConfig.color }]}>
                {badgeConfig.label}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon name="calendar-outline" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
              <Text style={styles.apptDateHeading}>{currentAppt.appointment_date || 'Scheduled Date'}</Text>
            </View>
          </View>
        </View>

        {/* DETAILS CARD */}
        <View style={styles.detailCard}>
          <View style={styles.sectionHeaderRow}>
            <Icon name="person-outline" size={18} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Victim & Case Information</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Victim Name</Text>
            <Text style={styles.infoValue}>{victimName}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone Contact</Text>
            <Text style={styles.infoValue}>{currentAppt.userPhone || 'Not provided'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{currentAppt.userEmail || 'N/A'}</Text>
          </View>
        </View>

        {/* PURPOSE & NOTES */}
        <View style={styles.detailCard}>
          <View style={styles.sectionHeaderRow}>
            <Icon name="document-text-outline" size={18} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Session Purpose & Agenda</Text>
          </View>
          <Text style={styles.bodyNotes}>{currentAppt.notes || 'No session notes provided.'}</Text>
        </View>

        {/* RECORD AUDIT METADATA */}
        <View style={styles.detailCard}>
          <View style={styles.sectionHeaderRow}>
            <Icon name="time-outline" size={18} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Audit Record Metadata</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Created Date</Text>
            <Text style={styles.metaValue}>{createdDateStr}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Last Updated</Text>
            <Text style={styles.metaValue}>{updatedDateStr}</Text>
          </View>
        </View>
      </ScrollView>

      {/* FOOTER ACTIONS */}
      {isScheduled && (
        <View style={styles.footerContainer}>
          <TouchableOpacity
            style={styles.actionBtnOutline}
            onPress={() => {
              setEditDate(currentAppt.appointment_date || '');
              setShowEditModal(true);
            }}
            activeOpacity={0.8}
          >
            <Icon name="create-outline" size={16} color={COLORS.primary} />
            <Text style={styles.actionBtnOutlineText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnCancel}
            onPress={() => {
              setActionType('cancel');
              setShowConfirmModal(true);
            }}
            activeOpacity={0.8}
          >
            <Icon name="close-circle-outline" size={16} color="#D32F2F" />
            <Text style={styles.actionBtnCancelText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnComplete}
            onPress={() => {
              setActionType('complete');
              setShowConfirmModal(true);
            }}
            activeOpacity={0.8}
          >
            <Icon name="checkmark-circle-outline" size={16} color="#FFFFFF" />
            <Text style={styles.actionBtnCompleteText}>Mark Completed</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* CONFIRMATION MODAL */}
      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Icon
              name={actionType === 'complete' ? 'checkmark-circle' : 'alert-circle'}
              size={40}
              color={actionType === 'complete' ? COLORS.primary : '#D32F2F'}
            />
            <Text style={styles.modalTitle}>
              {actionType === 'complete' ? 'Mark Completed' : 'Cancel Appointment'}
            </Text>
            <Text style={styles.modalMessage}>
              {actionType === 'complete'
                ? 'Are you sure you want to mark this appointment as completed?'
                : 'Are you sure you want to cancel this appointment record?'}
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowConfirmModal(false)}
                disabled={isUpdating}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  actionType === 'cancel' && { backgroundColor: '#D32F2F' },
                ]}
                onPress={handleActionConfirm}
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

      {/* EDIT MODAL */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxWidth: 360, alignItems: 'stretch' }]}>
            <Text style={styles.modalTitle}>Reschedule Appointment</Text>
            <Text style={styles.modalMessage}>Update date, time or purpose notes:</Text>

            <Text style={styles.fieldLabel}>Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.modalInput}
              value={editDate}
              onChangeText={setEditDate}
              placeholder="2026-10-05"
            />

            <Text style={styles.fieldLabel}>Time</Text>
            <TextInput
              style={styles.modalInput}
              value={editTime}
              onChangeText={setEditTime}
              placeholder="10:30 AM"
            />

            <Text style={styles.fieldLabel}>Notes</Text>
            <TextInput
              style={[styles.modalInput, { minHeight: 70 }]}
              value={editNotes}
              onChangeText={setEditNotes}
              multiline
            />

            <View style={[styles.modalActions, { marginTop: 12 }]}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowEditModal(false)}
                disabled={isUpdating}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleSaveEdit}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmText}>Save Changes</Text>
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
  backBtnSimple: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: BORDER_RADIUS.sm,
  },
  backBtnTextSimple: {
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
  headerOpenCaseBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.selectedCardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  headerOpenCaseText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
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
  apptDateHeading: {
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 13,
    color: COLORS.textSubtle,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: 4,
  },
  bodyNotes: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 20,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
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
  footerContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.cardBackground,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  actionBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginRight: SPACING.xs,
  },
  actionBtnOutlineText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 4,
  },
  actionBtnCancel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    backgroundColor: '#FFEBEE',
    marginRight: SPACING.xs,
  },
  actionBtnCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D32F2F',
    marginLeft: 4,
  },
  actionBtnComplete: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
  },
  actionBtnCompleteText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 4,
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
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSubtle,
    marginTop: 8,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  modalInput: {
    width: '100%',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.textPrimary,
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
