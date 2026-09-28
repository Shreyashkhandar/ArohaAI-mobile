import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SPACING, BORDER_RADIUS } from '../../shared/theme/theme';
import Icon from '../../shared/components/Icon';
import { getCounsellorAIObservations } from '../services/caseService';

export default function AssessmentHistoryScreen({ userId, caseId, victimName, onBack }) {
  const [assessments, setAssessments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [reviewedItems, setReviewedItems] = useState({});

  const loadAssessments = async () => {
    if (!userId) {
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }
    setErrorMessage('');
    try {
      const data = await getCounsellorAIObservations(userId);
      setAssessments(data || []);
    } catch (err) {
      console.warn('[AssessmentHistoryScreen] Load error:', err.message);
      setErrorMessage('Failed to load assessment history.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAssessments();
  }, [userId]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadAssessments();
  };

  const toggleReviewStatus = (id) => {
    setReviewedItems((prev) => ({
      ...prev,
      [id]: prev[id] === 'Reviewed' ? 'Pending Review' : 'Reviewed',
    }));
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'Date unknown';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return isoString;
    }
  };

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
        {/* Header */}
        <View style={styles.header}>
          {onBack && (
            <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7} accessibilityLabel="Go back">
              <Icon name="arrow-back" size={16} color={COLORS.primary} />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Clinical & AI Assessment History</Text>
          <Text style={styles.headerSubtitle}>
            {victimName ? `Case Assessment Records for ${victimName}` : 'Longitudinal assessment indicators and counsellor evaluations.'}
          </Text>
        </View>

        {/* Disclaimer Banner */}
        <View style={styles.disclaimerBox}>
          <Icon name="information-circle-outline" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
          <Text style={styles.disclaimerText}>
            AI-derived findings are supporting wellbeing indicators for clinical reference, not medical diagnoses.
          </Text>
        </View>

        {/* Error Banner */}
        {errorMessage ? (
          <View style={styles.errorCard}>
            <Icon name="alert-circle-outline" size={16} color="#9B1C1C" style={{ marginRight: 8 }} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* List Content */}
        {isLoading ? (
          <ActivityIndicator color={COLORS.primary} size="small" style={{ marginVertical: 32 }} />
        ) : assessments.length > 0 ? (
          <View style={styles.listContainer}>
            {assessments.map((item, idx) => {
              const reviewState = reviewedItems[item.id] || (item.requires_counsellor_review ? 'Follow-up Required' : 'Reviewed');
              const isFlagged = item.requires_counsellor_review;

              return (
                <View key={item.id || idx} style={styles.assessmentCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.typeBadge}>
                      <Icon name="analytics-outline" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
                      <Text style={styles.typeBadgeText}>Wellbeing Indicator Log</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        reviewState === 'Follow-up Required' && styles.statusBadgeWarning,
                        reviewState === 'Reviewed' && styles.statusBadgeSuccess,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          reviewState === 'Follow-up Required' && styles.statusBadgeTextWarning,
                          reviewState === 'Reviewed' && styles.statusBadgeTextSuccess,
                        ]}
                      >
                        {reviewState.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.timestampText}>{formatDate(item.created_at)}</Text>

                  <View style={styles.sectionDivider} />

                  <Text style={styles.sectionLabel}>AI-Generated Wellbeing Indicator</Text>
                  <Text style={styles.explanationText}>
                    {item.explanation || 'Recorded regular linguistic response indicator.'}
                  </Text>

                  {item.indicators ? (
                    <View style={styles.indicatorsRow}>
                      <Text style={styles.indicatorsText}>
                        Indicators: {typeof item.indicators === 'string' ? item.indicators : JSON.stringify(item.indicators)}
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.cardFooter}>
                    <TouchableOpacity
                      style={styles.reviewActionBtn}
                      onPress={() => toggleReviewStatus(item.id)}
                      activeOpacity={0.8}
                    >
                      <Icon
                        name={reviewState === 'Reviewed' ? 'checkmark-circle' : 'time-outline'}
                        size={16}
                        color={COLORS.primary}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.reviewActionText}>
                        {reviewState === 'Reviewed' ? 'Mark Pending Review' : 'Mark as Reviewed'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Icon name="clipboard-outline" size={32} color={COLORS.textSubtle} style={{ marginBottom: 8 }} />
            <Text style={styles.emptyText}>No assessment logs recorded yet</Text>
            <Text style={styles.emptySubtext}>
              Assessment records will accumulate as the victim completes daily check-in logs over time.
            </Text>
          </View>
        )}
      </ScrollView>
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
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textSubtle,
    marginTop: 2,
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.selectedCardBg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.md,
  },
  disclaimerText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
    flex: 1,
    lineHeight: 16,
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
  },
  listContainer: {
    gap: SPACING.md,
  },
  assessmentCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  statusBadge: {
    backgroundColor: '#F2F7F5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeWarning: {
    backgroundColor: '#FDE8E8',
  },
  statusBadgeSuccess: {
    backgroundColor: COLORS.selectedCardBg,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSubtle,
  },
  statusBadgeTextWarning: {
    color: '#9B1C1C',
  },
  statusBadgeTextSuccess: {
    color: COLORS.primary,
  },
  timestampText: {
    fontSize: 11,
    color: COLORS.textSubtle,
    marginBottom: 8,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  explanationText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  indicatorsRow: {
    backgroundColor: '#F8FAF9',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginTop: 8,
  },
  indicatorsText: {
    fontSize: 12,
    color: COLORS.textSubtle,
  },
  cardFooter: {
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    alignItems: 'flex-end',
  },
  reviewActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.selectedCardBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  reviewActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  emptyCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: COLORS.textSubtle,
    textAlign: 'center',
    lineHeight: 18,
  },
});
