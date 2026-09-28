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
  Platform,
  Alert,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../shared/theme/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../../shared/components/Icon';
import { getCounsellorCases } from '../services/caseService';
import {
  getCounsellorAppointments,
  completeAppointment,
  cancelAppointment,
} from '../services/appointmentService';
import ScheduleAppointmentScreen from './ScheduleAppointmentScreen';
import AppointmentDetailScreen from './AppointmentDetailScreen';

const FILTER_TABS = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past' },
  { id: 'all', label: 'All' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

export default function CounsellorAppointmentsScreen({ onSelectCase, onBack }) {
  const [activeFilter, setActiveFilter] = useState('upcoming');
  const [searchQuery, setSearchQuery] = useState('');

  const [cases, setCases] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Sub-view State
  const [subView, setSubView] = useState(null); // null | 'detail' | 'schedule'
  const [selectedAppt, setSelectedAppt] = useState(null);

  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setErrorMessage('');

    try {
      const [casesRes, apptsRes] = await Promise.all([
        getCounsellorCases(),
        getCounsellorAppointments(),
      ]);

      const casesList = Array.isArray(casesRes) ? casesRes : casesRes?.cases || [];
      setCases(casesList);
      setAppointments(apptsRes || []);
    } catch (err) {
      console.warn('[CounsellorAppointmentsScreen] load error:', err.message);
      setErrorMessage('Unable to load appointments. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    loadData(true);
  };

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  // Filter & Search Logic
  const filteredAppointments = appointments.filter((appt) => {
    const matchesSearch =
      !searchQuery.trim() ||
      (appt.userName && appt.userName.toLowerCase().includes(searchQuery.toLowerCase().trim())) ||
      (appt.id && appt.id.toLowerCase().includes(searchQuery.toLowerCase().trim()));

    if (!matchesSearch) return false;

    const statusLower = (appt.status || 'scheduled').toLowerCase();
    const apptDate = appt.appointment_date ? new Date(appt.appointment_date).getTime() : 0;
    const isFutureOrToday = apptDate >= todayStart;

    if (activeFilter === 'upcoming') {
      return statusLower === 'scheduled' && isFutureOrToday;
    }
    if (activeFilter === 'past') {
      return statusLower === 'completed' || statusLower === 'cancelled' || !isFutureOrToday;
    }
    if (activeFilter === 'completed') {
      return statusLower === 'completed';
    }
    if (activeFilter === 'cancelled') {
      return statusLower === 'cancelled';
    }

    return true; // 'all'
  });

  if (subView === 'schedule') {
    return (
      <ScheduleAppointmentScreen
        caseData={null}
        onBack={() => setSubView(null)}
        onScheduled={() => {
          setSubView(null);
          loadData();
        }}
      />
    );
  }

  if (subView === 'detail' && selectedAppt) {
    const targetCase = cases.find((c) => c.id === selectedAppt.case_id || c.user_id === selectedAppt.user_id);
    return (
      <AppointmentDetailScreen
        appointment={selectedAppt}
        caseData={targetCase}
        onBack={() => {
          setSelectedAppt(null);
          setSubView(null);
        }}
        onOpenCase={(appt) => {
          if (onSelectCase) {
            onSelectCase(targetCase || { id: appt.case_id, user_id: appt.user_id });
          }
        }}
        onUpdated={() => {
          loadData();
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* HEADER */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7} accessibilityLabel="Go back">
            <Icon name="arrow-back" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        )}
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Appointments</Text>
          <Text style={styles.headerSubtitle}>Follow-up schedule and session management</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* SEARCH BAR */}
        <View style={styles.searchBarWrapper}>
          <Icon name="search-outline" size={16} color={COLORS.textSubtle} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search appointments by victim name..."
            placeholderTextColor={COLORS.textSubtle}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>

        {/* FILTER CHIPS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScrollView}
          contentContainerStyle={styles.filterContainer}
        >
          {FILTER_TABS.map((tab) => {
            const isSelected = activeFilter === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.filterChip, isSelected && styles.filterChipSelected]}
                onPress={() => setActiveFilter(tab.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextSelected]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ERROR BANNER */}
        {Boolean(errorMessage) && (
          <View style={styles.errorCard}>
            <Icon name="alert-circle-outline" size={18} color="#D32F2F" style={{ marginRight: 6 }} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* LOADING INDICATOR */}
        {isLoading && !isRefreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading appointments...</Text>
          </View>
        ) : filteredAppointments.length > 0 ? (
          <View style={styles.cardList}>
            {filteredAppointments.map((appt) => {
              const statusLower = (appt.status || 'scheduled').toLowerCase();
              const dateStr = appt.appointment_date
                ? new Date(appt.appointment_date).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Scheduled';

              const statusBg =
                statusLower === 'completed'
                  ? '#E8F5E9'
                  : statusLower === 'cancelled'
                  ? '#FFEBEE'
                  : '#E1F5FE';
              const statusColor =
                statusLower === 'completed'
                  ? '#2E7D32'
                  : statusLower === 'cancelled'
                  ? '#D32F2F'
                  : '#0288D1';

              return (
                <TouchableOpacity
                  key={appt.id}
                  style={styles.apptCard}
                  onPress={() => {
                    setSelectedAppt(appt);
                    setSubView('detail');
                  }}
                  activeOpacity={0.75}
                >
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardDateBox}>
                      <Icon name="calendar-outline" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
                      <Text style={styles.cardDateText}>{dateStr}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                      <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                        {statusLower.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.victimNameText}>{appt.userName || 'Victim Record'}</Text>
                  <Text style={styles.notesText} numberOfLines={2}>
                    {appt.notes || 'Routine Follow-up Session'}
                  </Text>

                  <View style={styles.cardFooterRow}>
                    <Text style={styles.viewDetailsText}>View Appointment Details</Text>
                    <Icon name="chevron-forward" size={14} color={COLORS.primary} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Icon name="calendar-outline" size={36} color={COLORS.textSubtle} style={{ marginBottom: 8 }} />
            <Text style={styles.emptyTitle}>
              {activeFilter === 'upcoming' ? 'No upcoming appointments' : 'No past appointments'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeFilter === 'upcoming'
                ? 'Scheduled follow-up sessions will appear here.'
                : 'Completed and cancelled appointments will be listed here.'}
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
    marginRight: SPACING.xs,
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
    paddingBottom: 125,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    marginBottom: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  filterScrollView: {
    marginBottom: SPACING.md,
  },
  filterContainer: {
    flexDirection: 'row',
  },
  filterChip: {
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginRight: 6,
  },
  filterChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 12,
    color: COLORS.textSubtle,
    fontWeight: '500',
  },
  filterChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
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
  },
  loadingBox: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: COLORS.textSubtle,
  },
  cardList: {
    gap: 10,
  },
  apptCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardDateBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardDateText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  victimNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 12,
    color: COLORS.textSubtle,
    lineHeight: 16,
    marginBottom: 8,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    paddingTop: 8,
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  emptyCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.xl,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  emptySubtitle: {
    fontSize: 12,
    color: COLORS.textSubtle,
    textAlign: 'center',
    marginTop: 4,
  },
});
