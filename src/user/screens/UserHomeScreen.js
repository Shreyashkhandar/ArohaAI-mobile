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
import { COLORS, SPACING, BORDER_RADIUS } from '../../shared/theme/theme';
import ArohaLogo from '../../shared/components/ArohaLogo';
import Icon from '../../shared/components/Icon';
import UserNavBar from '../components/UserNavBar';
import CheckInScreen from './CheckInScreen';
import ProfileScreen from './ProfileScreen';
import UserAppointmentsScreen from './UserAppointmentsScreen';
import UserRoutineScreen from './UserRoutineScreen';
import RoutineSection from '../components/RoutineSection';
import AppointmentSection from '../components/AppointmentSection';
import CounsellorCard from '../components/CounsellorCard';
import { getUserProfile } from '../../shared/services/authService';
import { getTodayCheckIn } from '../services/checkinService';
import { getUpcomingAppointment } from '../services/appointmentService';
import { useI18n } from '../../shared/i18n';

export default function UserHomeScreen({ profile: initialProfile, user, onLogoutSuccess }) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState('home');
  const [profile, setProfile] = useState(initialProfile);
  const [todayCheckIn, setTodayCheckIn] = useState(null);
  const [appointment, setAppointment] = useState(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  const refreshUserData = useCallback(async () => {
    try {
      setIsCheckingStatus(true);
      const [checkInRecord, apptRecord] = await Promise.all([
        getTodayCheckIn(),
        getUpcomingAppointment(),
      ]);
      setTodayCheckIn(checkInRecord);
      setAppointment(apptRecord);
    } catch (err) {
      console.warn('[UserHomeScreen] Failed to fetch status data:', err?.message);
    } finally {
      setIsCheckingStatus(false);
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
          console.warn('[UserHomeScreen] Profile error:', err?.message);
        }
      }
    }
    loadData();
    refreshUserData();

    return () => {
      isMounted = false;
    };
  }, [user?.id, refreshUserData]);

  useEffect(() => {
    if (activeTab === 'home') {
      refreshUserData();
    }
  }, [activeTab, refreshUserData]);

  const getGreetingText = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('home.greetingMorning');
    if (hour < 17) return t('home.greetingAfternoon');
    return t('home.greetingEvening');
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const userInitial = displayName.charAt(0).toUpperCase();
  const isCheckedInToday = Boolean(todayCheckIn);

  const renderHomeContent = () => (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Header Bar */}
      <View style={styles.headerRow}>
        <ArohaLogo size={42} />
        <TouchableOpacity
          style={styles.avatarCircle}
          onPress={() => setActiveTab('profile')}
          activeOpacity={0.8}
          accessibilityLabel="Open profile"
        >
          <Text style={styles.avatarInitial}>{userInitial}</Text>
        </TouchableOpacity>
      </View>

      {/* Greeting Header */}
      <View style={styles.greetingSection}>
        <Text style={styles.greetingSub}>
          {t('home.greetingSub', { greeting: getGreetingText(), name: displayName })}
        </Text>
        <Text style={styles.greetingMain}>{t('home.homeSubtitle')}</Text>
      </View>

      {/* 2. Today's Check-in Card */}
      <View
        style={[
          styles.checkInBox,
          isCheckedInToday && styles.checkInBoxCompleted,
        ]}
      >
        <View style={styles.checkInHeaderRow}>
          <Text style={styles.checkInBadgeLabel}>
            {isCheckedInToday ? t('home.checkInCompleted') : t('home.todaysCheckIn')}
          </Text>
          {isCheckedInToday && (
            <Icon name="checkmark-circle" size={18} color={COLORS.primary} />
          )}
        </View>

        <Text style={styles.checkInTitle}>
          {isCheckedInToday
            ? t('home.checkInCompleted')
            : t('home.feelingTitle')}
        </Text>

        <Text style={styles.checkInSubtext}>
          {isCheckedInToday
            ? t('home.reflectionSavedSubtext')
            : t('home.checkInSubtext')}
        </Text>

        {isCheckingStatus ? (
          <ActivityIndicator color={COLORS.primary} size="small" style={styles.statusLoader} />
        ) : isCheckedInToday ? (
          <View style={styles.completedBadgeRow}>
            <Icon name="checkmark-circle-outline" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.completedBadgeText}>{t('checkin.checkInSubmittedTitle')}</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.checkInButton}
            onPress={() => setActiveTab('checkin')}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={t('common.checkIn')}
          >
            <Text style={styles.checkInButtonText}>{t('common.checkIn')}</Text>
            <Icon name="arrow-forward" size={14} color={COLORS.buttonText} style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        )}
      </View>

      {/* 3. YOUR COUNSELLOR Card */}
      <CounsellorCard />

      {/* 4. Upcoming Appointment Section */}
      <AppointmentSection appointment={appointment} isLoading={isCheckingStatus} />

      {/* 5. Routine Section */}
      <RoutineSection />
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.mainContainer}>
        <View style={styles.tabContentContainer}>
          {activeTab === 'home' && renderHomeContent()}
          {activeTab === 'checkin' && (
            <CheckInScreen
              onNavigateToHome={() => setActiveTab('home')}
              onCheckInComplete={() => {
                refreshUserData();
              }}
            />
          )}
          {activeTab === 'appointments' && (
            <UserAppointmentsScreen user={user} />
          )}
          {activeTab === 'routine' && (
            <UserRoutineScreen />
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
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.selectedCardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  greetingSection: {
    marginBottom: SPACING.xl,
  },
  greetingSub: {
    fontSize: 15,
    color: COLORS.textSubtle,
    fontWeight: '500',
    marginBottom: 4,
  },
  greetingMain: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.1,
  },
  checkInBox: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    elevation: 1,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  checkInBoxCompleted: {
    backgroundColor: '#F3F8F6',
    borderColor: COLORS.secondary,
  },
  checkInHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs + 2,
  },
  checkInBadgeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  checkInTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  checkInSubtext: {
    fontSize: 14,
    color: COLORS.textSubtle,
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  statusLoader: {
    paddingVertical: SPACING.sm,
  },
  completedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.selectedCardBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.md,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  completedBadgeText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  checkInButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    minHeight: 48,
  },
  checkInButtonText: {
    color: COLORS.buttonText,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
