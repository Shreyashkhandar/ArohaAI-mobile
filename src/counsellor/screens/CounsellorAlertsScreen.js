import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, BORDER_RADIUS } from '../../shared/theme/theme';
import Icon from '../../shared/components/Icon';
import { getCounsellorCases } from '../services/caseService';

export default function CounsellorAlertsScreen({ onSelectCase, onBack }) {
  const [alerts, setAlerts] = useState([]);
  const [reviewedAlertIds, setReviewedAlertIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadAlerts = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const res = await getCounsellorCases();
      const casesList = Array.isArray(res) ? res : res?.cases || [];

      // Generate structured system alerts from case monitoring status
      const generatedAlerts = [];

      casesList.forEach((c) => {
        if (c.requiresReview) {
          generatedAlerts.push({
            id: `alert-review-${c.id}`,
            caseData: c,
            type: 'AI Review Required',
            severity: 'HIGH',
            title: `AI Observation Flagged for ${c.userName}`,
            description: 'Recent check-in responses indicate potential distress indicators requiring counsellor review.',
            createdAt: c.lastCheckIn || c.created_at,
          });
        }

        if (!c.lastCheckIn) {
          generatedAlerts.push({
            id: `alert-nocheckin-${c.id}`,
            caseData: c,
            type: 'Missed Check-in',
            severity: 'MEDIUM',
            title: `No Recent Check-in for ${c.userName}`,
            description: 'Victim has not recorded a daily check-in since case establishment.',
            createdAt: c.created_at,
          });
        }

        if (String(c.status).toLowerCase() === 'assessment') {
          generatedAlerts.push({
            id: `alert-assessment-${c.id}`,
            caseData: c,
            type: 'Assessment Pending',
            severity: 'INFO',
            title: `Baseline Evaluation Open for ${c.userName}`,
            description: 'Case remains in initial baseline evaluation stage.',
            createdAt: c.created_at,
          });
        }
      });

      setAlerts(generatedAlerts);
    } catch (err) {
      // Technical log suppressed from UI
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const handleMarkReviewed = (alertId) => {
    setReviewedAlertIds((prev) => [...prev, alertId]);
  };

  const activeAlerts = alerts.filter((a) => !reviewedAlertIds.includes(a.id));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backButton} accessibilityLabel="Go back">
              <Icon name="arrow-back" size={20} color={COLORS.text} />
            </TouchableOpacity>
          )}
          <View style={styles.headerIconCircle}>
            <Icon name="notifications" size={20} color={COLORS.primary} />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>System Alerts</Text>
            <Text style={styles.subtitle}>
              {activeAlerts.length} active monitoring {activeAlerts.length === 1 ? 'alert' : 'alerts'} requiring attention.
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => loadAlerts(true)} tintColor={COLORS.primary} />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={COLORS.primary} size="large" />
            <Text style={styles.loadingText}>Scanning monitoring alerts...</Text>
          </View>
        ) : activeAlerts.length > 0 ? (
          <View style={styles.alertList}>
            {activeAlerts.map((a) => {
              const isHigh = a.severity === 'HIGH';
              const isMed = a.severity === 'MEDIUM';

              return (
                <View
                  key={a.id}
                  style={[
                    styles.alertCard,
                    isHigh && styles.alertCardHigh,
                    isMed && styles.alertCardMed,
                  ]}
                >
                  <View style={styles.alertHeader}>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeBadgeText}>{a.type.toUpperCase()}</Text>
                    </View>
                    <View
                      style={[
                        styles.severityBadge,
                        isHigh && { backgroundColor: '#FDE8E8', borderColor: '#F8B4B4' },
                        isMed && { backgroundColor: '#FEF08A', borderColor: '#FDE047' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.severityText,
                          isHigh && { color: '#9B1C1C' },
                          isMed && { color: '#854D0E' },
                        ]}
                      >
                        {a.severity} SEVERITY
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.alertTitle}>{a.title}</Text>
                  <Text style={styles.alertDescription}>{a.description}</Text>

                  <View style={styles.alertFooter}>
                    <Text style={styles.timestamp}>
                      Recorded: {a.createdAt ? new Date(a.createdAt).toLocaleString() : 'Recent'}
                    </Text>

                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.reviewBtn}
                        onPress={() => handleMarkReviewed(a.id)}
                        activeOpacity={0.7}
                      >
                        <Icon name="checkmark" size={12} color={COLORS.textSubtle} style={{ marginRight: 4 }} />
                        <Text style={styles.reviewBtnText}>Mark Reviewed</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.viewCaseBtn}
                        onPress={() => onSelectCase(a.caseData)}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.viewCaseBtnText}>View Case</Text>
                        <Icon name="arrow-forward" size={12} color={COLORS.buttonText} style={{ marginLeft: 4 }} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Icon name="checkmark-circle" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>All Alerts Resolved</Text>
            <Text style={styles.emptySubtitle}>
              There are currently no active alerts or unreviewed case notifications.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 10,
    padding: 4,
  },
  headerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.selectedCardBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSubtle,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: 125,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textSubtle,
    marginTop: 8,
  },
  alertList: {
    gap: SPACING.md,
    width: '100%',
  },
  alertCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.md,
    width: '100%',
  },
  alertCardHigh: {
    borderColor: '#F8B4B4',
  },
  alertCardMed: {
    borderColor: '#FDE047',
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    backgroundColor: COLORS.selectedCardBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  severityBadge: {
    backgroundColor: COLORS.selectedCardBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  alertDescription: {
    fontSize: 13,
    color: COLORS.textSubtle,
    lineHeight: 18,
    marginBottom: 10,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F2F7F5',
    paddingTop: 10,
  },
  timestamp: {
    fontSize: 11,
    color: COLORS.textSubtle,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  reviewBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSubtle,
  },
  viewCaseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  viewCaseBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.buttonText,
  },
  emptyCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.xl,
    alignItems: 'center',
    marginTop: SPACING.md,
    width: '100%',
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.selectedCardBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textSubtle,
    textAlign: 'center',
  },
});
