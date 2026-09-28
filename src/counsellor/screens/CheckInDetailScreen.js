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
import { updateCaseNotes } from '../services/caseService';
import { appendNoteToHistory, formatDetailedNote } from '../services/noteService';
import { getCurrentAuthenticatedUser } from '../../shared/services/authService';

export default function CheckInDetailScreen({
  checkIn,
  victimName = 'Victim Record',
  caseId,
  onBack,
  onCaseNoteAdded,
}) {
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!checkIn) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Check-in record details not available.</Text>
        <TouchableOpacity style={styles.backBtnSimple} onPress={onBack}>
          <Text style={styles.backBtnTextSimple}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const dateDisplay = checkIn.created_at
    ? new Date(checkIn.created_at).toLocaleString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Date Recorded';

  const aiResult = checkIn.aiResult || null;
  const requiresReview = aiResult?.requires_counsellor_review || false;

  const handleSaveNote = async () => {
    if (!caseId || !noteText.trim()) return;

    const authUser = await getCurrentAuthenticatedUser();
    if (!authUser) {
      setErrorMessage('Your session has expired. Please sign in again.');
      return;
    }

    setIsSavingNote(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const formattedEntry = formatDetailedNote({
        interactionDate: new Date().toLocaleDateString(),
        interactionType: 'Check-in Review Note',
        observation: noteText.trim(),
        actionTaken: `Reviewed check-in submitted on ${dateDisplay}.`,
        followUpRequired: true,
        authorName: authUser.user_metadata?.full_name || authUser.email || 'Counsellor',
      });

      await updateCaseNotes(caseId, formattedEntry);
      setSuccessMessage('Observation note saved to case record.');
      setNoteText('');
      setShowNoteModal(false);
      if (onCaseNoteAdded) onCaseNoteAdded();
    } catch (err) {
      console.warn('[CheckInDetailScreen] Save note error:', err.message);
      setErrorMessage('Failed to save note to case record.');
    } finally {
      setIsSavingNote(false);
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
          <Text style={styles.headerTitle}>Check-in Details</Text>
          <Text style={styles.headerSubtitle}>
            {victimName} {caseId ? `- Case #${String(caseId).substring(0, 8)}` : ''}
          </Text>
        </View>
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

        {/* DATE & TIME CARD */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon name="time-outline" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
              <Text style={styles.dateHeading}>{dateDisplay}</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>Submitted</Text>
            </View>
          </View>
        </View>

        {/* SECTION 1: RAW CHECK-IN RESPONSES */}
        <View style={styles.detailCard}>
          <View style={styles.sectionHeaderRow}>
            <Icon name="clipboard-outline" size={18} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Check-in Response</Text>
          </View>
          <View style={styles.responseBox}>
            <Text style={styles.responseText}>{checkIn.response || 'No response details recorded.'}</Text>
          </View>
        </View>

        {/* SECTION 2: SYSTEM ANALYSIS */}
        {aiResult && (
          <View style={styles.detailCard}>
            <View style={styles.sectionHeaderRow}>
              <Icon name="analytics-outline" size={18} color={COLORS.primary} />
              <Text style={styles.cardTitle}>System-generated assessment</Text>
            </View>

            {requiresReview && (
              <View style={styles.flagCard}>
                <Icon name="alert-circle" size={16} color="#9B1C1C" style={{ marginRight: 6 }} />
                <Text style={styles.flagText}>Requires Counsellor Review</Text>
              </View>
            )}

            {Array.isArray(aiResult.indicators) && aiResult.indicators.length > 0 && (
              <View style={styles.indicatorContainer}>
                <Text style={styles.subTitleLabel}>Observed Indicators:</Text>
                <View style={styles.chipRow}>
                  {aiResult.indicators.map((ind, idx) => (
                    <View key={idx} style={styles.indicatorChip}>
                      <Text style={styles.indicatorChipText}>{String(ind)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {Boolean(aiResult.explanation) && (
              <View style={{ marginTop: 8 }}>
                <Text style={styles.subTitleLabel}>Pattern Analysis Summary:</Text>
                <Text style={styles.explanationText}>{aiResult.explanation}</Text>
              </View>
            )}
          </View>
        )}

        {/* SECTION 3: COUNSELLOR CASE NOTE INTEGRATION */}
        {caseId && (
          <View style={styles.detailCard}>
            <View style={styles.sectionHeaderRow}>
              <Icon name="create-outline" size={18} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Counsellor Review Note</Text>
            </View>
            <Text style={styles.subTitleLabel}>
              Record an observation note in the case history following your review:
            </Text>
            <TouchableOpacity
              style={styles.addNoteBtn}
              onPress={() => setShowNoteModal(true)}
              activeOpacity={0.8}
            >
              <Icon name="add-circle-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.addNoteBtnText}>+ Add Case Note</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ADD NOTE MODAL */}
      <Modal visible={showNoteModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Case Note</Text>
            <Text style={styles.modalSubtitle}>
              Log a confidential review note for this check-in entry:
            </Text>
            <TextInput
              style={styles.modalInput}
              value={noteText}
              onChangeText={setNoteText}
              placeholder="Record counsellor observations and follow-up decisions..."
              placeholderTextColor={COLORS.textSubtle}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowNoteModal(false)}
                disabled={isSavingNote}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleSaveNote}
                disabled={isSavingNote}
              >
                {isSavingNote ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmText}>Save Note</Text>
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
  dateHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statusBadge: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7D32',
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
  responseBox: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    marginTop: 6,
  },
  responseText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  flagCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDE8E8',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.xs,
    marginTop: 4,
  },
  flagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9B1C1C',
  },
  subTitleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSubtle,
    marginBottom: 4,
    marginTop: 4,
  },
  indicatorContainer: {
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -3,
  },
  indicatorChip: {
    backgroundColor: COLORS.selectedCardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 12,
    paddingVertical: 3,
    paddingHorizontal: 8,
    margin: 3,
  },
  indicatorChipText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
  },
  explanationText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  addNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.xs,
  },
  addNoteBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
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
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.textSubtle,
    marginBottom: SPACING.md,
  },
  modalInput: {
    width: '100%',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    fontSize: 14,
    color: COLORS.textPrimary,
    minHeight: 90,
    marginBottom: SPACING.md,
  },
  modalActions: {
    flexDirection: 'row',
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
