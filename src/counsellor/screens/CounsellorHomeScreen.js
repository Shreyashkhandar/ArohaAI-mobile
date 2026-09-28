import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Platform,
  StatusBar as RNStatusBar,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SPACING, BORDER_RADIUS } from '../../shared/theme/theme';
import Icon from '../../shared/components/Icon';
import { logout } from '../../shared/services/authService';
import { getCounsellorDashboardData } from '../services/dashboardService';
import AddUserCaseScreen from './AddUserCaseScreen';
import UserCaseDetailScreen from './UserCaseDetailScreen';

const STAGE_FILTERS = ['All', 'Active', 'Assessment', 'Follow-up', 'Closed'];

export default function CounsellorHomeScreen({
  profile,
  user,
  onLogoutSuccess,
  onNavigate,
}) {
  const [viewState, setViewState] = useState('home'); // 'home', 'add_user', 'view_case'
  const [selectedCase, setSelectedCase] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState('All');

  // Real Dashboard Metrics State
  const [activeCasesCount, setActiveCasesCount] = useState(0);
  const [upcomingFollowUpsCount, setUpcomingFollowUpsCount] = useState(0);
  const [casesNeedingReviewCount, setCasesNeedingReviewCount] = useState(0);
  const [overdueFollowUpsCount, setOverdueFollowUpsCount] = useState(0);

  // Real Feeds State
  const [needsAttentionItems, setNeedsAttentionItems] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [recentCheckIns, setRecentCheckIns] = useState([]);
  const [allCases, setAllCases] = useState([]);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await getCounsellorDashboardData();
      if (res && res.success && res.data) {
        const {
          activeCasesCount: activeCnt,
          upcomingFollowUpsCount: upcomingCnt,
          casesNeedingReviewCount: reviewCnt,
          overdueFollowUpsCount: overdueCnt,
          needsAttentionItems: attentionItems,
          upcomingAppointments: upcomingAppts,
          recentCheckIns: checkInsList,
          allCases: casesList,
        } = res.data;

        setActiveCasesCount(activeCnt || 0);
        setUpcomingFollowUpsCount(upcomingCnt || 0);
        setCasesNeedingReviewCount(reviewCnt || 0);
        setOverdueFollowUpsCount(overdueCnt || 0);

        setNeedsAttentionItems(attentionItems || []);
        setUpcomingAppointments(upcomingAppts || []);
        setRecentCheckIns(checkInsList || []);
        setAllCases(casesList || []);
      } else {
        setErrorMessage(res?.message || 'Unable to load dashboard information.');
      }
    } catch (err) {
      console.warn('[CounsellorHomeScreen] loadDashboard error:', err.message);
      setErrorMessage('Unable to load your dashboard right now. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadDashboard();
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      if (onLogoutSuccess) {
        onLogoutSuccess();
      }
    } catch (err) {
      console.warn('Logout error:', err.message);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleSelectCase = (caseObj) => {
    if (!caseObj) return;
    if (onNavigate) {
      onNavigate('view_case', caseObj);
    } else {
      setSelectedCase(caseObj);
      setViewState('view_case');
    }
  };

  const handleOpenAddUser = () => {
    if (onNavigate) {
      onNavigate('add_user');
    } else {
      setViewState('add_user');
    }
  };

  const handleOpenProfile = () => {
    if (onNavigate) {
      onNavigate('profile');
    }
  };

  const handleViewAllCases = () => {
    if (onNavigate) {
      onNavigate('cases');
    }
  };

  // Dynamic Time Greeting
  const getGreetingTime = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Dynamic Formatted Date
  const getFormattedDate = () => {
    try {
      const options = { weekday: 'long', day: 'numeric', month: 'long' };
      return new Date().toLocaleDateString('en-US', options);
    } catch (e) {
      return '';
    }
  };

  const counsellorName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || '';
  const greetingText = counsellorName ? `${getGreetingTime()}, ${counsellorName}` : `${getGreetingTime()}, Counsellor`;

  // Filtered Cases for "Your Cases" Section
  const filteredCases = allCases.filter((c) => {
    const matchesSearch =
      !searchQuery.trim() ||
      (c.userName && c.userName.toLowerCase().includes(searchQuery.toLowerCase().trim())) ||
      (c.id && c.id.toLowerCase().includes(searchQuery.toLowerCase().trim()));

    if (!matchesSearch) return false;

    if (selectedStageFilter === 'All') return true;
    const currentStatus = String(c.status || 'active').toLowerCase();
    const filterLower = selectedStageFilter.toLowerCase();

    if (filterLower === 'active') return currentStatus === 'active';
    if (filterLower === 'assessment') return currentStatus === 'assessment';
    if (filterLower === 'follow-up') return currentStatus === 'follow_up' || currentStatus === 'follow-up';
    if (filterLower === 'closed') return currentStatus === 'closed';

    return true;
  });

  if (viewState === 'add_user' && !onNavigate) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <AddUserCaseScreen
          onCancel={() => setViewState('home')}
          onCaseCreated={() => {
            loadDashboard();
            setViewState('home');
          }}
        />
      </SafeAreaView>
    );
  }

  if (viewState === 'view_case' && selectedCase && !onNavigate) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <UserCaseDetailScreen
          caseData={selectedCase}
          onBack={() => {
            setSelectedCase(null);
            setViewState('home');
          }}
          onCaseUpdated={() => {
            loadDashboard();
          }}
        />
      </SafeAreaView>
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
        {/* HEADER BAR */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.greetingTitle}>{greetingText}</Text>
              <Text style={styles.greetingSubtitle}>Here's your case overview.</Text>
            </View>

            <TouchableOpacity
              onPress={handleOpenProfile}
              activeOpacity={0.8}
              style={styles.profileAvatarBtn}
              accessibilityRole="button"
              accessibilityLabel="Counsellor Profile"
            >
              <Icon name="person-circle-outline" size={38} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.dateRow}>
            <Icon name="calendar-outline" size={14} color={COLORS.textSubtle} style={{ marginRight: 6 }} />
            <Text style={styles.dateText}>Today - {getFormattedDate()}</Text>
          </View>
        </View>

        {/* ERROR BANNERS / RETRY */}
        {Boolean(errorMessage) && (
          <View style={styles.errorCard}>
            <Icon name="alert-circle-outline" size={20} color="#9B1C1C" style={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.errorTitle}>Unable to load your dashboard</Text>
              <Text style={styles.errorSubtitle}>{errorMessage}</Text>
            </View>
            <TouchableOpacity style={styles.retryBtn} onPress={loadDashboard} activeOpacity={0.8}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* LOADING STATE */}
        {isLoading && !isRefreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading dashboard metrics...</Text>
          </View>
        ) : (
          <>
            {/* 1. REAL SUMMARY CARDS (2x2 GRID) */}
            <View style={styles.statsGrid}>
              <TouchableOpacity
                style={styles.statCard}
                onPress={() => setSelectedStageFilter('Active')}
                activeOpacity={0.8}
              >
                <View style={styles.statCardHeader}>
                  <Icon name="folder-open-outline" size={18} color={COLORS.primary} />
                </View>
                <Text style={styles.statNumber}>{activeCasesCount}</Text>
                <Text style={styles.statLabel}>Active Cases</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statCard}
                onPress={handleViewAllCases}
                activeOpacity={0.8}
              >
                <View style={styles.statCardHeader}>
                  <Icon name="calendar-outline" size={18} color={COLORS.primary} />
                </View>
                <Text style={styles.statNumber}>{upcomingFollowUpsCount}</Text>
                <Text style={styles.statLabel}>Upcoming Follow-ups</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statCard, casesNeedingReviewCount > 0 && styles.statCardAttention]}
                onPress={() => setSelectedStageFilter('All')}
                activeOpacity={0.8}
              >
                <View style={styles.statCardHeader}>
                  <Icon
                    name="alert-circle-outline"
                    size={18}
                    color={casesNeedingReviewCount > 0 ? '#9B1C1C' : COLORS.primary}
                  />
                </View>
                <Text style={[styles.statNumber, casesNeedingReviewCount > 0 && { color: '#9B1C1C' }]}>
                  {casesNeedingReviewCount}
                </Text>
                <Text style={[styles.statLabel, casesNeedingReviewCount > 0 && { color: '#9B1C1C', fontWeight: '700' }]}>
                  Need Review
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statCard, overdueFollowUpsCount > 0 && styles.statCardAttention]}
                onPress={handleViewAllCases}
                activeOpacity={0.8}
              >
                <View style={styles.statCardHeader}>
                  <Icon
                    name="time-outline"
                    size={18}
                    color={overdueFollowUpsCount > 0 ? '#9B1C1C' : COLORS.primary}
                  />
                </View>
                <Text style={[styles.statNumber, overdueFollowUpsCount > 0 && { color: '#9B1C1C' }]}>
                  {overdueFollowUpsCount}
                </Text>
                <Text style={[styles.statLabel, overdueFollowUpsCount > 0 && { color: '#9B1C1C', fontWeight: '700' }]}>
                  Overdue Follow-ups
                </Text>
              </TouchableOpacity>
            </View>

            {/* QUICK ACTION: REGISTER NEW VICTIM */}
            <View style={styles.quickActionCard}>
              <View style={styles.quickActionContent}>
                <View style={styles.quickActionIconWrapper}>
                  <Icon name="person-add-outline" size={24} color={COLORS.primary} />
                </View>
                <View style={styles.quickActionTextContainer}>
                  <Text style={styles.quickActionTitle}>Register New Victim</Text>
                  <Text style={styles.quickActionSubtitle}>
                    Create a profile, record consent and open a case.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.registerButton}
                onPress={handleOpenAddUser}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Register New Victim"
              >
                <Icon name="person-add-outline" size={16} color={COLORS.buttonText} style={{ marginRight: 6 }} />
                <Text style={styles.registerButtonText}>Register New Victim</Text>
              </TouchableOpacity>
            </View>

            {/* 2. NEEDS ATTENTION SECTION */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Needs Attention</Text>
                {needsAttentionItems.length > 0 && (
                  <View style={styles.attentionCountBadge}>
                    <Text style={styles.attentionCountText}>{needsAttentionItems.length} items</Text>
                  </View>
                )}
              </View>
              <Text style={styles.sectionSubtitle}>Administrative and monitoring actions requiring review.</Text>

              {needsAttentionItems.length > 0 ? (
                <View style={styles.cardList}>
                  {needsAttentionItems.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.attentionCard}
                      onPress={() => handleSelectCase(item.rawCase)}
                      activeOpacity={0.75}
                    >
                      <View style={styles.attentionCardLeft}>
                        <Icon name="alert-circle" size={16} color="#D97706" style={{ marginRight: 8, marginTop: 2 }} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.victimNameText}>{item.victimName}</Text>
                          <Text style={styles.caseIdSubtext}>Case #{String(item.caseId).slice(0, 8)}</Text>
                          <View style={styles.reasonBadge}>
                            <Text style={styles.reasonBadgeText}>{item.reason}</Text>
                          </View>
                          {item.dateInfo ? (
                            <Text style={styles.lastInteractionText}>{item.dateInfo}</Text>
                          ) : null}
                        </View>
                      </View>
                      <View style={styles.openCasePill}>
                        <Text style={styles.openCasePillText}>Open Case</Text>
                        <Icon name="chevron-forward" size={14} color={COLORS.primary} style={{ marginLeft: 2 }} />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyCard}>
                  <Icon name="checkmark-circle-outline" size={32} color={COLORS.primary} style={{ marginBottom: 6 }} />
                  <Text style={styles.emptyTitle}>You're all caught up</Text>
                  <Text style={styles.emptySubtitle}>No cases currently require administrative review.</Text>
                </View>
              )}
            </View>

            {/* 3. UPCOMING FOLLOW-UPS */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Upcoming Follow-ups</Text>
              <Text style={styles.sectionSubtitle}>Nearest scheduled victim sessions and reviews.</Text>

              {upcomingAppointments.length > 0 ? (
                <View style={styles.cardList}>
                  {upcomingAppointments.slice(0, 4).map((appt) => {
                    const apptDateStr = appt.appointment_date
                      ? new Date(appt.appointment_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                      : 'Scheduled';
                    return (
                      <TouchableOpacity
                        key={appt.id}
                        style={styles.appointmentCard}
                        onPress={() => handleSelectCase({ id: appt.user_id, user_id: appt.user_id, userName: appt.userName })}
                        activeOpacity={0.75}
                      >
                        <View style={styles.apptTimeBox}>
                          <Icon name="calendar" size={14} color={COLORS.primary} style={{ marginBottom: 2 }} />
                          <Text style={styles.apptTimeText}>{apptDateStr}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.victimNameText}>{appt.userName || 'Victim Record'}</Text>
                          <Text style={styles.apptPurposeText} numberOfLines={1}>
                            {appt.notes ? appt.notes.split('\n')[0] : 'Scheduled Follow-up Session'}
                          </Text>
                        </View>
                        <View style={styles.apptStatusBadge}>
                          <Text style={styles.apptStatusBadgeText}>{(appt.status || 'Scheduled').toUpperCase()}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.emptyCard}>
                  <Icon name="calendar-outline" size={32} color={COLORS.textSubtle} style={{ marginBottom: 6 }} />
                  <Text style={styles.emptyTitle}>No upcoming follow-ups</Text>
                  <Text style={styles.emptySubtitle}>Scheduled follow-up sessions will appear here.</Text>
                </View>
              )}
            </View>

            {/* 4. YOUR CASES SNAPSHOT WITH SEARCH & FILTER */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Your Cases</Text>
                <TouchableOpacity onPress={handleViewAllCases} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.viewAllText}>View all ({allCases.length})</Text>
                  <Icon name="arrow-forward" size={13} color={COLORS.primary} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>

              {/* SEARCH BAR */}
              <View style={styles.searchBarWrapper}>
                <Icon name="search-outline" size={16} color={COLORS.textSubtle} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by victim name or case ID..."
                  placeholderTextColor={COLORS.textSubtle}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  clearButtonMode="while-editing"
                />
              </View>

              {/* STAGE FILTERS */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterScrollView}
                contentContainerStyle={styles.filterChipContainer}
              >
                {STAGE_FILTERS.map((chip) => {
                  const isSelected = selectedStageFilter === chip;
                  return (
                    <TouchableOpacity
                      key={chip}
                      style={[styles.filterChip, isSelected && styles.filterChipSelected]}
                      onPress={() => setSelectedStageFilter(chip)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.filterChipText, isSelected && styles.filterChipTextSelected]}>
                        {chip}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {filteredCases.length > 0 ? (
                <View style={styles.cardList}>
                  {filteredCases.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={styles.caseCard}
                      onPress={() => handleSelectCase(c)}
                      activeOpacity={0.75}
                    >
                      <View style={styles.caseCardMain}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.victimNameText}>{c.userName || 'Victim Record'}</Text>
                          <Text style={styles.caseIdSubtext}>Case #{String(c.id).slice(0, 8)}</Text>
                        </View>
                        <View style={styles.stageBadge}>
                          <Text style={styles.stageBadgeText}>{String(c.status || 'Active').toUpperCase()}</Text>
                        </View>
                      </View>

                      <View style={styles.caseCardFooter}>
                        <Text style={styles.lastCheckInLabel}>
                          Last check-in: {c.recencyLabel || 'No check-in recorded'}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={[styles.lastCheckInLabel, { fontWeight: '600', marginRight: 4 }]}>
                            Next: {c.nextFollowUpStr}
                          </Text>
                          <Icon name="chevron-forward" size={14} color={COLORS.primary} />
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyCard}>
                  <Icon name="folder-open-outline" size={32} color={COLORS.textSubtle} style={{ marginBottom: 6 }} />
                  <Text style={styles.emptyTitle}>
                    {allCases.length === 0 ? 'No cases assigned' : 'No matching cases'}
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    {allCases.length === 0
                      ? 'Cases assigned to you will appear here.'
                      : 'Try adjusting your search query or filter chips.'}
                  </Text>
                </View>
              )}
            </View>

            {/* 5. RECENT CHECK-INS */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Recent Check-ins</Text>
              <Text style={styles.sectionSubtitle}>Latest check-in updates from your assigned cases.</Text>

              {recentCheckIns.length > 0 ? (
                <View style={styles.activityTimeline}>
                  {recentCheckIns.map((ci) => (
                    <TouchableOpacity
                      key={ci.id}
                      style={styles.activityItem}
                      onPress={() => handleSelectCase(ci.rawCase)}
                      activeOpacity={0.75}
                    >
                      <View style={styles.activityIconCircle}>
                        <Icon name="checkmark-circle-outline" size={14} color={COLORS.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.activityDescText}>{ci.victimName}</Text>
                        <Text style={styles.activityMetaText}>
                          Check-in submitted - {ci.recency}
                        </Text>
                      </View>
                      <Icon name="chevron-forward" size={14} color={COLORS.textSubtle} />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyCard}>
                  <Icon name="time-outline" size={32} color={COLORS.textSubtle} style={{ marginBottom: 6 }} />
                  <Text style={styles.emptyTitle}>No recent check-ins recorded</Text>
                  <Text style={styles.emptySubtitle}>Victim check-in entries will appear here.</Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight || 0 : 0,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl + 24,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.1,
  },
  greetingSubtitle: {
    fontSize: 13,
    color: COLORS.textSubtle,
    marginTop: 2,
  },
  profileAvatarBtn: {
    padding: 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSubtle,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDE8E8',
    borderWidth: 1,
    borderColor: '#F8B4B4',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9B1C1C',
  },
  errorSubtitle: {
    fontSize: 12,
    color: '#9B1C1C',
    marginTop: 2,
  },
  retryBtn: {
    backgroundColor: '#9B1C1C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.md,
    marginLeft: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  loadingBox: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSubtle,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: SPACING.xl,
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.md,
  },
  statCardAttention: {
    backgroundColor: '#FDE8E8',
    borderColor: '#F8B4B4',
  },
  statCardHeader: {
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSubtle,
  },
  quickActionCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  quickActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  quickActionIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.selectedCardBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  quickActionTextContainer: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: COLORS.textSubtle,
    marginTop: 2,
    lineHeight: 16,
  },
  registerButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  registerButtonText: {
    color: COLORS.buttonText,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  sectionContainer: {
    marginBottom: SPACING.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.textSubtle,
    marginBottom: SPACING.md,
  },
  attentionCountBadge: {
    backgroundColor: '#FDE8E8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  attentionCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9B1C1C',
  },
  cardList: {
    gap: 10,
  },
  attentionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.md,
  },
  attentionCardLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    paddingRight: 10,
  },
  attentionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9B1C1C',
    marginTop: 6,
    marginRight: 10,
  },
  victimNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  caseIdSubtext: {
    fontSize: 11,
    color: COLORS.textSubtle,
    marginTop: 1,
  },
  reasonBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FDE8E8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  reasonBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9B1C1C',
  },
  lastInteractionText: {
    fontSize: 11,
    color: COLORS.textSubtle,
    marginTop: 4,
  },
  openCasePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.selectedCardBg,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  openCasePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  appointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.md,
  },
  apptTimeBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.selectedCardBg,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.md,
    marginRight: 12,
  },
  apptTimeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  apptPurposeText: {
    fontSize: 12,
    color: COLORS.textSubtle,
    marginTop: 2,
  },
  apptStatusBadge: {
    backgroundColor: '#F2F7F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  apptStatusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
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
    marginTop: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
  },
  filterScrollView: {
    marginBottom: SPACING.md,
  },
  filterChipContainer: {
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
  activityTimeline: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.md,
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.selectedCardBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  activityDescText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  activityMetaText: {
    fontSize: 11,
    color: COLORS.textSubtle,
    marginTop: 2,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  caseCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.md,
  },
  caseCardMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  stageBadge: {
    backgroundColor: COLORS.selectedCardBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  stageBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  caseCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F2F7F5',
    paddingTop: 6,
  },
  lastCheckInLabel: {
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
});
