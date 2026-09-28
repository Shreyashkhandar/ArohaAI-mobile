import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SPACING, BORDER_RADIUS } from '../../shared/theme/theme';
import Icon from '../../shared/components/Icon';
import { getCaseCheckIns } from '../services/checkinReviewService';
import { updateCaseNotes } from '../services/caseService';
import { appendNoteToHistory, formatDetailedNote } from '../services/noteService';
import { getCurrentAuthenticatedUser } from '../../shared/services/authService';
import CheckInDetailScreen from './CheckInDetailScreen';

export default function CounsellorCheckInHistoryScreen({
  userId,
  caseId,
  victimName = 'Victim Record',
  onBack,
}) {
  const [checkIns, setCheckIns] = useState([]);
  const [dateFilter, setDateFilter] = useState('all'); // 'all', '7days', '30days'
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedCheckIn, setSelectedCheckIn] = useState(null);

  // Review Note Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewNoteText, setReviewNoteText] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const loadHistory = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    try {
      const res = await getCaseCheckIns(userId, dateFilter);
      if (res && res.success) {
        setCheckIns(res.data || []);
      } else {
        setErrorMessage('Unable to load wellbeing history.');
      }
    } catch (err) {
      console.warn('[counsellorCheckInHistory] Load exception:', err.message);
      setErrorMessage('Unable to load wellbeing history.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userId, dateFilter]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadHistory();
  };

  const handleSaveReviewNote = async () => {
    if (!caseId || !reviewNoteText.trim()) {
      return;
    }

    const authUser = await getCurrentAuthenticatedUser();
    if (!authUser) {
      setErrorMessage('Counsellor session expired. Please sign in again.');
      return;
    }

    setIsSavingNote(true);
    setSuccessMsg('');

    try {
      const formattedEntry = formatDetailedNote({
        interactionDate: new Date().toLocaleDateString(),
        interactionType: 'Check-in Review Note',
        observation: reviewNoteText.trim(),
        actionTaken: 'Counsellor review logged for daily check-in.',
        followUpRequired: true,
        authorName: authUser.user_metadata?.full_name || authUser.email || 'Counsellor',
      });

      await updateCaseNotes(caseId, formattedEntry);
      setSuccessMsg('Review note saved to case record.');
      setReviewNoteText('');
      setShowReviewModal(false);
    } catch (err) {
      console.warn('[CounsellorCheckInHistoryScreen] Save note error:', err.message);
      setErrorMessage('Failed to save review note to case.');
    } finally {
      setIsSavingNote(false);
    }
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
    } catch (e) {
      return isoString;
    }
  };

  const formatShortDate = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (e) {
      return '';
    }
  };

  const latestCheckIn = checkIns.length > 0 ? checkIns[0] : null;
  const hasFlags = checkIns.some((c) => c.aiResult?.requires_counsellor_review);
  const trendLabel = hasFlags ? 'Review Suggested' : 'Stable';

  if (selectedCheckIn) {
    return (
      <CheckInDetailScreen
        checkIn={selectedCheckIn}
        victimName={victimName}
        caseId={caseId}
        onBack={() => setSelectedCheckIn(null)}
        onCaseNoteAdded={() => loadHistory()}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* 2. HEADER */}
        <View style={styles.header}>
          {onBack && (
            <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
              <Icon name="arrow-back" size={16} color={COLORS.primary} />
              <Text style={styles.backButtonText}>Back to Case Detail</Text>
            </TouchableOpacity>
          )}

          <View style={styles.victimHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.victimNameText}>{victimName}</Text>
              <Text style={styles.caseIdText}>Case #{caseId ? caseId.slice(0, 8) : 'ARH-1028'}</Text>
            </View>
          </View>

          <Text style={styles.headerTitle}>Wellbeing History</Text>
          <Text style={styles.headerSubtitle}>Review completed check-ins and assessment trends.</Text>
        </View>

        {/* 3. CURRENT MONITORING SUMMARY CARD */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Current Monitoring Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Latest Check-in</Text>
              <Text style={styles.summaryValue}>
                {latestCheckIn ? formatShortDate(latestCheckIn.created_at) : '—'}
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Current Indicator</Text>
              <Text style={[styles.summaryValue, hasFlags && { color: '#9B1C1C' }]}>
                {latestCheckIn?.assessmentIndicator || '—'}
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Trend</Text>
              <Text style={styles.summaryValue}>{checkIns.length > 0 ? trendLabel : '—'}</Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Last Interaction</Text>
              <Text style={styles.summaryValue}>
                {latestCheckIn ? formatDate(latestCheckIn.created_at).split(',')[0] : '—'}
              </Text>
            </View>
          </View>
        </View>

        {/* 7. HORIZONTAL TREND TIMELINE */}
        {checkIns.length > 1 && (
          <View style={styles.trendSection}>
            <Text style={styles.sectionTitle}>Wellbeing Trend History</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trendRow}>
              {checkIns.slice(0, 6).reverse().map((item, idx) => {
                const isFlagged = item.aiResult?.requires_counsellor_review;
                return (
                  <View key={item.id || idx} style={styles.trendNode}>
                    <Text style={styles.trendNodeDate}>{formatShortDate(item.created_at)}</Text>
                    <Icon name={isFlagged ? "alert-circle" : "checkmark-circle"} size={14} color={isFlagged ? "#9B1C1C" : COLORS.primary} style={{ marginVertical: 4 }} />
                    <Text style={[styles.trendNodeLabel, isFlagged && { color: '#9B1C1C', fontWeight: '700' }]}>
                      {isFlagged ? 'Review' : 'Regular'}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* 9. DATE FILTERS */}
        <View style={styles.filterRow}>
          {[
            { id: 'all', label: 'All History' },
            { id: '7days', label: '7 Days' },
            { id: '30days', label: '30 Days' },
          ].map((f) => {
            const isSelected = dateFilter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                style={[styles.filterChip, isSelected && styles.filterChipSelected]}
                onPress={() => setDateFilter(f.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextSelected]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* BANNERS */}
        {errorMessage ? (
          <View style={styles.errorCard}>
            <Icon name="alert-circle-outline" size={18} color="#9B1C1C" style={{ marginRight: 8 }} />
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadHistory} activeOpacity={0.8}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {successMsg ? (
          <View style={styles.successCard}>
            <Icon name="checkmark-circle-outline" size={16} color={COLORS.primary} style={{ marginRight: 8 }} />
            <Text style={styles.successText}>{successMsg}</Text>
          </View>
        ) : null}

        {/* 11. LOADING STATE */}
        {isLoading && !isRefreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading wellbeing history...</Text>
          </View>
        ) : checkIns.length > 0 ? (
          /* 4. CHRONOLOGICAL CHECK-IN TIMELINE */
          <View style={styles.timelineList}>
            {checkIns.map((item, index) => {
              const isFlagged = item.aiResult?.requires_counsellor_review;
              return (
                <TouchableOpacity
                  key={item.id || index}
                  style={[styles.checkInCard, isFlagged && styles.checkInCardFlagged]}
                  onPress={() => setSelectedCheckIn(item)}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardTopRow}>
                    <View style={styles.dateBox}>
                      <Icon name="calendar-outline" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
                      <Text style={styles.dateBoxText}>{formatDate(item.created_at)}</Text>
                    </View>
                    <View style={styles.statusBadge}>
                      <Icon name="checkmark-done-outline" size={12} color={COLORS.primary} style={{ marginRight: 3 }} />
                      <Text style={styles.statusBadgeText}>Completed</Text>
                    </View>
                  </View>

                  <Text style={styles.responseSummaryText} numberOfLines={2}>
                    "{item.response}"
                  </Text>

                  <View style={styles.cardBottomRow}>
                    <Text style={styles.indicatorLabelText}>
                      Monitoring Indicator: {isFlagged ? 'Review Suggested' : 'Regular'}
                    </Text>
                    <Icon name="chevron-forward-outline" size={14} color={COLORS.primary} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          /* 10. EMPTY STATE */
          <View style={styles.emptyCard}>
            <Icon name="calendar-outline" size={32} color={COLORS.textSubtle} style={{ marginBottom: 8 }} />
            <Text style={styles.emptyTitle}>No check-ins yet</Text>
            <Text style={styles.emptySubtitle}>Completed wellbeing check-ins will appear here.</Text>
          </View>
        )}
      </ScrollView>

      {/* 5. RESPONSE DETAILS MODAL */}
      <Modal visible={Boolean(selectedCheckIn)} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Check-in Details</Text>
              <TouchableOpacity onPress={() => setSelectedCheckIn(null)} style={{ padding: 4 }}>
                <Icon name="close-outline" size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {selectedCheckIn && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalMetaDate}>{formatDate(selectedCheckIn.created_at)}</Text>

                {/* 6. FREE-TEXT RESPONSE */}
                <View style={styles.responseSection}>
                  <Text style={styles.responseSectionTitle}>Victim's Response</Text>
                  <Text style={styles.responseBodyText}>
                    {selectedCheckIn.response ? `"${selectedCheckIn.response}"` : 'No written response provided.'}
                  </Text>
                </View>

                {/* 17. AI ASSESSMENT REVIEW */}
                <View style={styles.aiReviewSection}>
                  <Text style={styles.aiReviewTitle}>AI-Assisted Wellbeing Assessment Indicator</Text>
                  <Text style={styles.aiReviewExplanation}>
                    {selectedCheckIn.aiResult?.explanation || 'Regular wellbeing check-in response logged.'}
                  </Text>
                  {selectedCheckIn.aiResult?.requires_counsellor_review && (
                    <View style={styles.flagWarningBox}>
                      <Icon name="alert-circle-outline" size={16} color="#9B1C1C" style={{ marginRight: 6 }} />
                      <Text style={styles.flagWarningText}>Counsellor Review Suggested</Text>
                    </View>
                  )}
                </View>

                {/* 18. COUNSELLOR INTERPRETATION AREA */}
                <View style={styles.counsellorActionArea}>
                  <TouchableOpacity
                    style={styles.addReviewNoteBtn}
                    onPress={() => setShowReviewModal(true)}
                    activeOpacity={0.8}
                  >
                    <Icon name="create-outline" size={16} color={COLORS.buttonText} style={{ marginRight: 6 }} />
                    <Text style={styles.addReviewNoteBtnText}>+ Add Review Note</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* REVIEW NOTE INPUT MODAL */}
      <Modal visible={showReviewModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Counsellor Review Note</Text>
            <Text style={styles.modalSubtitle}>Document observation or intervention for case history:</Text>

            <TextInput
              style={styles.modalInput}
              value={reviewNoteText}
              onChangeText={setReviewNoteText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholder="Record observation, follow-up considerations, or action taken..."
              placeholderTextColor="#8A9D93"
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={[styles.modalSaveBtn, (!reviewNoteText.trim() || isSavingNote) && { opacity: 0.6 }]}
                onPress={handleSaveReviewNote}
                disabled={!reviewNoteText.trim() || isSavingNote}
              >
                {isSavingNote ? (
                  <ActivityIndicator color={COLORS.buttonText} size="small" />
                ) : (
                  <Text style={styles.modalSaveBtnText}>Save Note</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowReviewModal(false)}
                disabled={isSavingNote}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl + 24,
  },
  header: {
    marginBottom: SPACING.lg,
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
  victimHeaderRow: {
    marginBottom: 4,
  },
  victimNameText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  caseIdText: {
    fontSize: 12,
    color: COLORS.textSubtle,
    marginTop: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 6,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textSubtle,
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryItem: {
    width: '46%',
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSubtle,
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 2,
  },
  trendSection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  trendRow: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 8,
  },
  trendNode: {
    alignItems: 'center',
  },
  trendNodeDate: {
    fontSize: 11,
    color: COLORS.textSubtle,
    marginBottom: 4,
  },
  trendNodeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  trendNodeDotWarning: {
    backgroundColor: '#9B1C1C',
  },
  trendNodeLabel: {
    fontSize: 11,
    color: COLORS.textSubtle,
    marginTop: 4,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.md,
  },
  filterChip: {
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  filterChipSelected: {
    backgroundColor: COLORS.selectedCardBg,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 12,
    color: COLORS.textSubtle,
  },
  filterChipTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDE8E8',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#F8B4B4',
  },
  errorText: {
    fontSize: 13,
    color: '#9B1C1C',
    flex: 1,
  },
  retryBtn: {
    backgroundColor: '#9B1C1C',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.md,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  successCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.selectedCardBg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  successText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  loadingBox: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textSubtle,
    marginTop: 8,
  },
  timelineList: {
    gap: 10,
  },
  checkInCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.md,
  },
  checkInCardFlagged: {
    borderColor: '#F8B4B4',
    backgroundColor: '#FDF8F8',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  dateBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateBoxText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSubtle,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.selectedCardBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  responseSummaryText: {
    fontSize: 14,
    color: COLORS.text,
    fontStyle: 'italic',
    lineHeight: 18,
    marginBottom: 8,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F2F7F5',
    paddingTop: 6,
  },
  indicatorLabelText: {
    fontSize: 11,
    color: COLORS.textSubtle,
  },
  emptyCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  emptySubtitle: {
    fontSize: 12,
    color: COLORS.textSubtle,
    textAlign: 'center',
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
    padding: SPACING.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.textSubtle,
    marginBottom: 12,
  },
  modalMetaDate: {
    fontSize: 12,
    color: COLORS.textSubtle,
    marginBottom: 12,
  },
  responseSection: {
    backgroundColor: '#F8FAF9',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  responseSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSubtle,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  responseBodyText: {
    fontSize: 14,
    color: COLORS.text,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  aiReviewSection: {
    backgroundColor: COLORS.selectedCardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  aiReviewTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  aiReviewExplanation: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
  },
  flagWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  flagWarningText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9B1C1C',
  },
  counsellorActionArea: {
    marginTop: 8,
  },
  addReviewNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: 12,
  },
  addReviewNoteBtnText: {
    color: COLORS.buttonText,
    fontSize: 14,
    fontWeight: '700',
  },
  modalInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.md,
    padding: 12,
    fontSize: 14,
    color: COLORS.text,
    minHeight: 100,
    marginBottom: 12,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modalSaveBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalSaveBtnText: {
    color: COLORS.buttonText,
    fontSize: 14,
    fontWeight: '700',
  },
  modalCancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: 14,
    color: COLORS.textSubtle,
  },
});
