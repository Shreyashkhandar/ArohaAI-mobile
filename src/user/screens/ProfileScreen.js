import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { COLORS } from '../../shared/theme/theme';
import ArohaLogo from '../../shared/components/ArohaLogo';
import { logout, getUserProfile } from '../../shared/services/authService';

export default function ProfileScreen({ profile: initialProfile, user, onLogoutSuccess }) {
  const [profile, setProfile] = useState(initialProfile);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadFreshProfile() {
      if (user?.id) {
        try {
          setIsLoadingProfile(true);
          const freshData = await getUserProfile(user.id);
          if (isMounted && freshData) {
            setProfile(freshData);
          }
        } catch (err) {
          console.warn('[ProfileScreen] Profile fetch error:', err.message);
        } finally {
          if (isMounted) setIsLoadingProfile(false);
        }
      }
    }

    loadFreshProfile();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

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

  const fullName = profile?.full_name || user?.user_metadata?.full_name || 'Not provided';
  const email = profile?.email || user?.email || 'Not provided';
  const phone = profile?.phone || 'Not provided';
  const role = profile?.role ? String(profile.role).toLowerCase() : 'user';

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <ArohaLogo size={64} style={styles.logoMargin} />
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Account details & preferences</Text>
      </View>

      {/* Profile Card */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>User Information</Text>
          {isLoadingProfile && (
            <ActivityIndicator size="small" color={COLORS.primary} />
          )}
        </View>

        {/* Full Name */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Full Name</Text>
          <Text style={styles.infoValue}>{fullName}</Text>
        </View>

        <View style={styles.divider} />

        {/* Email */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{email}</Text>
        </View>

        <View style={styles.divider} />

        {/* Phone */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone</Text>
          <Text style={styles.infoValue}>{phone}</Text>
        </View>

        <View style={styles.divider} />

        {/* Account Role */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Account Role</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>
              {role === 'user' ? 'User' : role.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      {/* Logout Card */}
      <View style={styles.logoutCard}>
        <Text style={styles.logoutTitle}>Account Session</Text>
        <Text style={styles.logoutSubtitle}>
          Log out securely from your current session on this device.
        </Text>

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
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoMargin: {
    marginBottom: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSubtle,
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
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
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
  divider: {
    height: 1,
    backgroundColor: '#EBF2F0',
    marginVertical: 10,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.selectedCardBg,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  roleBadgeText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  logoutCard: {
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
  },
  logoutTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  logoutSubtitle: {
    fontSize: 13,
    color: COLORS.textSubtle,
    marginBottom: 18,
    lineHeight: 18,
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
    minHeight: 52,
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
