import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '../../shared/theme/theme';
import ArohaLogo from '../../shared/components/ArohaLogo';
import { logout } from '../../shared/services/authService';
import { getCounsellorCases } from '../services/caseService';
import AddUserCaseScreen from './AddUserCaseScreen';
import UserCaseDetailScreen from './UserCaseDetailScreen';

export default function CounsellorHomeScreen({ profile, user, onLogoutSuccess }) {
  const [viewState, setViewState] = useState('home'); // 'home', 'add_user', 'view_case'
  const [cases, setCases] = useState([]);
  const [isLoadingCases, setIsLoadingCases] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const fetchCases = useCallback(async () => {
    setIsLoadingCases(true);
    try {
      const data = await getCounsellorCases();
      setCases(data);
    } catch (err) {
      console.warn('[CounsellorHomeScreen] Error loading cases:', err.message);
    } finally {
      setIsLoadingCases(false);
    }
  }, []);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

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

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Counsellor';

  if (viewState === 'add_user') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <AddUserCaseScreen
          onCancel={() => setViewState('home')}
          onCaseCreated={() => {
            fetchCases();
            setViewState('home');
          }}
        />
      </SafeAreaView>
    );
  }

  if (viewState === 'view_case' && selectedCase) {
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
            fetchCases();
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
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.greetingSub}>Welcome,</Text>
              <Text style={styles.greetingName}>Counsellor {displayName}</Text>
            </View>
            <ArohaLogo size={52} />
          </View>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>Counsellor Portal</Text>
          </View>
        </View>

        {/* Action Header Card */}
        <View style={styles.actionCard}>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Assigned Cases</Text>
            <Text style={styles.actionSubtitle}>Manage and review user support cases.</Text>
          </View>
          <TouchableOpacity
            style={styles.addUserButton}
            onPress={() => setViewState('add_user')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Add User"
          >
            <Text style={styles.addUserButtonText}>+ Add User</Text>
          </TouchableOpacity>
        </View>

        {/* Users Section */}
        <View style={styles.usersSection}>
          <Text style={styles.sectionTitle}>Users</Text>

          {isLoadingCases ? (
            <ActivityIndicator color={COLORS.primary} size="medium" style={{ marginVertical: 20 }} />
          ) : cases.length > 0 ? (
            <View style={styles.userList}>
              {cases.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={styles.userCard}
                  onPress={() => {
                    setSelectedCase(c);
                    setViewState('view_case');
                  }}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`User case for ${c.userName}`}
                >
                  <View style={styles.userCardHeader}>
                    <Text style={styles.userNameText}>{c.userName}</Text>
                    <View style={styles.caseStatusBadge}>
                      <Text style={styles.caseStatusBadgeText}>
                        {c.status ? String(c.status).toUpperCase() : 'ACTIVE'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.userEmailText}>{c.userEmail}</Text>
                  {c.notes ? (
                    <Text style={styles.userNotesPreview} numberOfLines={1}>
                      Notes: {c.notes}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No users or cases assigned yet.</Text>
              <Text style={styles.emptySubtext}>Tap "+ Add User" above to create your first case.</Text>
            </View>
          )}
        </View>

        {/* Account Credentials & Logout */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Counsellor Credentials</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Full Name</Text>
            <Text style={styles.infoValue}>{profile?.full_name || 'Not provided'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{profile?.email || user?.email || 'N/A'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Verified Role</Text>
            <Text style={styles.infoValueHighlight}>{profile?.role?.toUpperCase() || 'COUNSELLOR'}</Text>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, isLoggingOut && styles.buttonDisabled]}
          onPress={handleLogout}
          activeOpacity={0.8}
          disabled={isLoggingOut}
          accessibilityRole="button"
          accessibilityLabel="Log Out"
        >
          {isLoggingOut ? (
            <ActivityIndicator color={COLORS.primary} size="small" />
          ) : (
            <Text style={styles.logoutButtonText}>Log Out</Text>
          )}
        </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  greetingSub: {
    fontSize: 15,
    color: COLORS.textSubtle,
    fontWeight: '500',
  },
  greetingName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.2,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EBF3F5',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  roleBadgeText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  actionCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 20,
    marginBottom: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  actionTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 13,
    color: COLORS.textSubtle,
  },
  addUserButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  addUserButtonText: {
    color: COLORS.buttonText,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  usersSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  userList: {
    gap: 12,
  },
  userCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 16,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
    marginBottom: 10,
  },
  userCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userNameText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  caseStatusBadge: {
    backgroundColor: COLORS.selectedCardBg,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  caseStatusBadgeText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  userEmailText: {
    fontSize: 13,
    color: COLORS.textSubtle,
  },
  userNotesPreview: {
    fontSize: 12,
    color: COLORS.textSubtle,
    marginTop: 6,
    fontStyle: 'italic',
  },
  emptyCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: COLORS.textSubtle,
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
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 18,
    letterSpacing: 0.2,
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
  infoValueHighlight: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: '#EBF2F0',
    marginVertical: 10,
  },
  logoutButton: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  logoutButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
