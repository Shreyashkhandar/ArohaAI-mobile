import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../../shared/theme/theme';
import { updateCaseNotes, getCounsellorAIObservations } from '../services/caseService';
import { getUserCheckInHistory } from '../../user/services/checkinService';

export default function UserCaseDetailScreen({ caseData, onBack, onCaseUpdated }) {
  const [notes, setNotes] = useState(caseData?.notes || '');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [checkIns, setCheckIns] = useState([]);
  const [isLoadingCheckIns, setIsLoadingCheckIns] = useState(true);
  const [aiObservations, setAiObservations] = useState([]);
  const [isLoadingAIObservations, setIsLoadingAIObservations] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (caseData?.user_id) {
        setIsLoadingCheckIns(true);
        setIsLoadingAIObservations(true);

        try {
          const [history, obs] = await Promise.all([
            getUserCheckInHistory(caseData.user_id),
            getCounsellorAIObservations(caseData.user_id),
          ]);

          if (isMounted) {
            setCheckIns(history);
            setAiObservations(obs);
          }
        } catch (err) {
          console.warn('[UserCaseDetailScreen] Load error:', err.message);
        } finally {
          if (isMounted) {
            setIsLoadingCheckIns(false);
            setIsLoadingAIObservations(false);
          }
        }
      } else {
        setIsLoadingCheckIns(false);
        setIsLoadingAIObservations(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [caseData?.user_id]);

  const handleSaveNotes = async () => {
    if (!caseData?.id) return;
    setErrorMessage('');
    setSuccessMessage('');
    setIsSaving(true);

    try {
      await updateCaseNotes(caseData.id, notes);
      setSuccessMessage('Case notes updated successfully.');
      setIsEditingNotes(false);
      if (onCaseUpdated) {
        onCaseUpdated();
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update case notes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
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
          <Text style={styles.backButtonText}>← Back to Users</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backButtonText}>← Back to Users</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{caseData?.userName || 'User Case Record'}</Text>
      </View>

      {/* Message Banners */}
      {errorMessage ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {successMessage ? (
        <View style={styles.successCard}>
          <Text style={styles.successText}>{successMessage}</Text>
        </View>
      ) : null}

      {/* Basic Case Information Card */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>User Information</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>
              {caseData?.status ? String(caseData.status).toUpperCase() : 'ACTIVE'}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>User Name</Text>
          <Text style={styles.infoValue}>{caseData?.userName || 'User Account'}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{caseData?.userEmail || 'N/A'}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone</Text>
          <Text style={styles.infoValue}>{caseData?.userPhone || 'Not provided'}</Text>
        </View>
      </View>

      {/* AI Observations Section (Counsellor-Only) */}
      <View style={[styles.card, styles.aiCard]}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.aiCardTitle}>AI Observations</Text>
          <View style={styles.aiBadge}>
            <Text style={styles.aiBadgeText}>Internal Service Boundary</Text>
          </View>
        </View>
        <Text style={styles.aiCardSubtitle}>Automated check-in processing observations.</Text>

        {isLoadingAIObservations ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={COLORS.primary} size="small" />
            <Text style={styles.loadingText}>Loading observations...</Text>
          </View>
        ) : aiObservations.length > 0 ? (
          <View style={styles.aiList}>
            {aiObservations.map((obs, idx) => (
              <View key={obs.id || idx} style={styles.aiItemCard}>
                <View style={styles.aiItemHeader}>
                  <Text style={styles.aiItemDate}>{formatDate(obs.created_at)}</Text>
                  <View style={[styles.flagBadge, obs.change_detected && styles.flagBadgeActive]}>
                    <Text style={styles.flagBadgeText}>
                      Change Detected: {obs.change_detected ? 'Yes' : 'No'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.aiItemExplanation}>{obs.explanation}</Text>

                <View style={styles.aiMetaRow}>
                  <Text style={styles.aiMetaText}>
                    Review Recommended: {obs.requires_counsellor_review ? 'Yes' : 'No'}
                  </Text>
                  {Array.isArray(obs.indicators) && obs.indicators.length > 0 ? (
                    <Text style={styles.aiMetaText}>
                      Indicators: {obs.indicators.join(', ')}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No observations available yet.</Text>
          </View>
        )}
      </View>

      {/* Case Notes Section */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Case Notes</Text>
          {!isEditingNotes && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => {
                setErrorMessage('');
                setSuccessMessage('');
                setIsEditingNotes(true);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.editButtonText}>Update Notes</Text>
            </TouchableOpacity>
          )}
        </View>

        {isEditingNotes ? (
          <View>
            <TextInput
              style={styles.textInput}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              editable={!isSaving}
              placeholder="Enter ongoing case notes..."
              placeholderTextColor="#8A9D93"
            />
            <View style={styles.editActionsRow}>
              <TouchableOpacity
                style={[styles.saveButton, isSaving && styles.buttonDisabled]}
                onPress={handleSaveNotes}
                disabled={isSaving}
                activeOpacity={0.8}
              >
                {isSaving ? (
                  <ActivityIndicator color={COLORS.buttonText} size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Notes</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelEditButton}
                onPress={() => {
                  setNotes(caseData?.notes || '');
                  setIsEditingNotes(false);
                }}
                disabled={isSaving}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelEditButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.notesContainer}>
            <Text style={styles.notesText}>
              {caseData?.notes ? caseData.notes : 'No case notes recorded yet.'}
            </Text>
          </View>
        )}
      </View>

      {/* Check-in History Timeline */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Check-in History</Text>
        <Text style={styles.cardSubtitle}>User's recorded daily wellbeing responses.</Text>

        {isLoadingCheckIns ? (
          <ActivityIndicator color={COLORS.primary} size="small" style={{ marginVertical: 16 }} />
        ) : checkIns.length > 0 ? (
          <View style={styles.historyList}>
            {checkIns.map((item, index) => (
              <React.Fragment key={item.id || index}>
                {index > 0 && <View style={styles.historyDivider} />}
                <View style={styles.historyRow}>
                  <View style={styles.historyDot} />
                  <View style={styles.historyContent}>
                    <Text style={styles.historyResponse}>"{item.response}"</Text>
                    <Text style={styles.historyDate}>{formatDate(item.created_at)}</Text>
                  </View>
                </View>
              </React.Fragment>
            ))}
          </View>
        ) : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No check-ins yet</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  backButton: {
    paddingVertical: 6,
    marginBottom: 8,
  },
  backButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  errorCard: {
    backgroundColor: '#FDF2F2',
    borderWidth: 1,
    borderColor: '#F8B4B4',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  errorText: {
    color: '#9B1C1C',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  successCard: {
    backgroundColor: '#F0F7F4',
    borderWidth: 1,
    borderColor: COLORS.secondary,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  successText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 22,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 20,
  },
  aiCard: {
    backgroundColor: '#F4F7F9',
    borderColor: '#D4E2E6',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  aiCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.primary,
  },
  aiCardSubtitle: {
    fontSize: 13,
    color: COLORS.textSubtle,
    marginBottom: 16,
  },
  aiBadge: {
    backgroundColor: '#E2ECF0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  aiBadgeText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  aiList: {
    gap: 10,
  },
  aiItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 14,
  },
  aiItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  aiItemDate: {
    fontSize: 12,
    color: COLORS.textSubtle,
    fontWeight: '600',
  },
  flagBadge: {
    backgroundColor: '#F0F5F3',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  flagBadgeActive: {
    backgroundColor: '#FFF4E5',
  },
  flagBadgeText: {
    fontSize: 11,
    color: COLORS.text,
    fontWeight: '600',
  },
  aiItemExplanation: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  aiMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  aiMetaText: {
    fontSize: 12,
    color: COLORS.textSubtle,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textSubtle,
  },
  emptyBox: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSubtle,
    fontWeight: '500',
  },
  cardSubtitle: {
    fontSize: 13,
    color: COLORS.textSubtle,
    marginBottom: 16,
  },
  statusBadge: {
    backgroundColor: COLORS.selectedCardBg,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  statusBadgeText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  infoRow: {
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#EBF2F0',
    marginVertical: 10,
  },
  editButton: {
    backgroundColor: COLORS.selectedCardBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  editButtonText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  notesContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  notesText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
  },
  textInput: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 14,
    fontSize: 14,
    color: COLORS.text,
    minHeight: 110,
    marginBottom: 14,
  },
  editActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: COLORS.buttonText,
    fontSize: 14,
    fontWeight: '600',
  },
  cancelEditButton: {
    marginLeft: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cancelEditButtonText: {
    color: COLORS.textSubtle,
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  historyList: {
    marginTop: 4,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  historyDivider: {
    height: 1,
    backgroundColor: '#F0F5F3',
  },
  historyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    marginTop: 6,
    marginRight: 14,
  },
  historyContent: {
    flex: 1,
  },
  historyResponse: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 12,
    color: COLORS.textSubtle,
  },
});
