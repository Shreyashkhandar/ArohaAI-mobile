import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  StatusBar as RNStatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '../../shared/theme/theme';
import ArohaLogo from '../../shared/components/ArohaLogo';
import UserNavBar from '../components/UserNavBar';
import CheckInScreen from './CheckInScreen';
import ProfileScreen from './ProfileScreen';
import { getUserProfile } from '../../shared/services/authService';
import { getTodayCheckIn } from '../services/checkinService';

const STATIC_ROUTINE = [
  { id: '1', title: 'Wake up on time' },
  { id: '2', title: 'Have regular meals' },
  { id: '3', title: 'Take a short walk' },
  { id: '4', title: 'Read or relax' },
  { id: '5', title: 'Stay connected' },
  { id: '6', title: 'Sleep on time' },
];

export default function UserHomeScreen({ profile: initialProfile, user, onLogoutSuccess }) {
  const [activeTab, setActiveTab] = useState('home');
  const [profile, setProfile] = useState(initialProfile);
  const [completedItems, setCompletedItems] = useState({});
  const [todayCheckIn, setTodayCheckIn] = useState(null);
  const [isCheckingCheckInStatus, setIsCheckingCheckInStatus] = useState(true);

  const refreshTodayCheckInStatus = useCallback(async () => {
    try {
      setIsCheckingCheckInStatus(true);
      const record = await getTodayCheckIn();
      setTodayCheckIn(record);
    } catch (err) {
      console.warn('[UserHomeScreen] Failed to fetch today check-in status:', err.message);
    } finally {
      setIsCheckingCheckInStatus(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (user?.id) {
        try {
          const freshProfile = await getUserProfile(user.id);
          if (isMounted && freshProfile) {
            setProfile(freshProfile);
          }
        } catch (err) {
          console.warn('[UserHomeScreen] Profile fetch error:', err.message);
        }
      }
    }
    loadData();
    refreshTodayCheckInStatus();

    return () => {
      isMounted = false;
    };
  }, [user?.id, refreshTodayCheckInStatus]);

  useEffect(() => {
    if (activeTab === 'home') {
      refreshTodayCheckInStatus();
    }
  }, [activeTab, refreshTodayCheckInStatus]);

  const toggleRoutineItem = (id) => {
    setCompletedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const completedCount = Object.values(completedItems).filter(Boolean).length;
  const isCheckedInToday = Boolean(todayCheckIn);

  const renderHomeContent = () => (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.greetingSub}>{getGreeting()},</Text>
            <Text style={styles.greetingName}>{displayName}</Text>
          </View>
          <ArohaLogo size={52} />
        </View>
      </View>

      {/* Daily Check-in Card */}
      <View
        style={[
          styles.checkInCard,
          isCheckedInToday && styles.checkInCardCompleted,
        ]}
      >
        <View style={styles.checkInContent}>
          <Text style={styles.checkInStatusBadge}>
            {isCheckedInToday ? "Today's check-in completed" : "Complete today's check-in"}
          </Text>

          <Text style={styles.checkInTitle}>
            {isCheckedInToday
              ? `Feeling ${todayCheckIn?.response}`
              : 'How are you feeling today?'}
          </Text>

          <Text style={styles.checkInSubtitle}>
            {isCheckedInToday
              ? 'Your reflection for today has been saved. Thank you for taking a moment.'
              : 'Take a moment to check in with yourself.'}
          </Text>

          {isCheckingCheckInStatus ? (
            <ActivityIndicator color={COLORS.primary} size="small" style={styles.statusLoader} />
          ) : isCheckedInToday ? (
            <View style={styles.completedBadgeRow}>
              <Text style={styles.completedBadgeText}>✓ Check-in recorded</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.checkInButton}
              onPress={() => setActiveTab('checkin')}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Check in button"
            >
              <Text style={styles.checkInButtonText}>Check in</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Today's Routine Section */}
      <View style={styles.routineSection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Today's routine</Text>
          <Text style={styles.routineProgress}>
            {completedCount} of {STATIC_ROUTINE.length} done
          </Text>
        </View>

        <View style={styles.routineCard}>
          {STATIC_ROUTINE.map((item, index) => {
            const isDone = !!completedItems[item.id];
            return (
              <React.Fragment key={item.id}>
                {index > 0 && <View style={styles.routineDivider} />}
                <TouchableOpacity
                  style={styles.routineRow}
                  onPress={() => toggleRoutineItem(item.id)}
                  activeOpacity={0.7}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isDone }}
                  accessibilityLabel={item.title}
                >
                  <View
                    style={[
                      styles.checkbox,
                      isDone && styles.checkboxChecked,
                    ]}
                  >
                    {isDone && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text
                    style={[
                      styles.routineItemText,
                      isDone && styles.routineItemTextDone,
                    ]}
                  >
                    {item.title}
                  </Text>
                </TouchableOpacity>
              </React.Fragment>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.mainContainer}>
        {/* Render Tab Content */}
        <View style={styles.tabContentContainer}>
          {activeTab === 'home' && renderHomeContent()}
          {activeTab === 'checkin' && (
            <CheckInScreen
              onNavigateToHome={() => setActiveTab('home')}
              onCheckInComplete={() => {
                refreshTodayCheckInStatus();
              }}
            />
          )}
          {activeTab === 'profile' && (
            <ProfileScreen
              profile={profile}
              user={user}
              onLogoutSuccess={onLogoutSuccess}
            />
          )}
        </View>

        {/* Bottom Navigation */}
        <UserNavBar activeTab={activeTab} onSelectTab={setActiveTab} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight || 0 : 0,
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  tabContentContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
  },
  header: {
    marginBottom: 20,
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
  greetingSub: {
    fontSize: 16,
    color: COLORS.textSubtle,
    fontWeight: '500',
  },
  greetingName: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.2,
  },
  checkInCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 22,
    marginBottom: 24,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  checkInCardCompleted: {
    backgroundColor: '#F0F7F4',
    borderColor: COLORS.secondary,
  },
  checkInContent: {
    alignItems: 'flex-start',
  },
  checkInStatusBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  checkInTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  checkInSubtitle: {
    fontSize: 14,
    color: COLORS.textSubtle,
    marginBottom: 18,
    lineHeight: 20,
  },
  statusLoader: {
    paddingVertical: 10,
  },
  completedBadgeRow: {
    backgroundColor: COLORS.cardBackground,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  completedBadgeText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  checkInButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  checkInButtonText: {
    color: COLORS.buttonText,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  routineSection: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.2,
  },
  routineProgress: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  routineCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  routineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  routineDivider: {
    height: 1,
    backgroundColor: '#F0F5F3',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    backgroundColor: COLORS.background,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  routineItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
  routineItemTextDone: {
    color: COLORS.textSubtle,
    textDecorationLine: 'line-through',
  },
});
