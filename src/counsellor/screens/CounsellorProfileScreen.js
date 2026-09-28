import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, BORDER_RADIUS } from '../../shared/theme/theme';
import Icon from '../../shared/components/Icon';
import ArohaLogo from '../../shared/components/ArohaLogo';
import { logout, resetPasswordForEmail } from '../../shared/services/authService';

export default function CounsellorProfileScreen({ profile, user, onLogoutSuccess }) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Counsellor';
  const email = profile?.email || user?.email || 'N/A';
  const role = (profile?.role || 'counsellor').toUpperCase();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      if (onLogoutSuccess) {
        onLogoutSuccess();
      }
    } catch (err) {
      setErrorMessage('Failed to log out cleanly. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email || email === 'N/A') return;
    setIsSendingReset(true);
    setMessage('');
    setErrorMessage('');

    try {
      await resetPasswordForEmail(email);
      setMessage(`Password reset email sent to ${email}. Please check your inbox.`);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to send password reset email.');
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Header Profile Card */}
      <View style={styles.headerCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitial}>{displayName.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.profileName}>{displayName}</Text>
        <Text style={styles.profileEmail}>{email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>VERIFIED COUNSELLOR</Text>
        </View>
      </View>

      {/* Messages */}
      {message ? (
        <View style={styles.messageCard}>
          <Icon name="checkmark" size={16} color={COLORS.primary} style={{ marginRight: 8 }} />
          <Text style={styles.messageText}>{message}</Text>
        </View>
      ) : null}

      {errorMessage ? (
        <View style={styles.errorCard}>
          <Icon name="warning" size={16} color="#9B1C1C" style={{ marginRight: 8 }} />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {/* Account Details Section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account Credentials & Identity</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Full Name</Text>
          <Text style={styles.infoValue}>{displayName}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email Address</Text>
          <Text style={styles.infoValue}>{email}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Assigned Role</Text>
          <Text style={styles.infoValueHighlight}>{role}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Organization / Portal</Text>
          <Text style={styles.infoValue}>Aroha Care Network (Counsellor Portal)</Text>
        </View>
      </View>

      {/* Security Actions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Security & Access Controls</Text>

        <TouchableOpacity
          style={styles.actionRow}
          onPress={handlePasswordReset}
          disabled={isSendingReset}
          activeOpacity={0.7}
        >
          <View style={styles.actionLeft}>
            <Icon name="lock-closed" size={18} color={COLORS.primary} style={{ marginRight: 10 }} />
            <Text style={styles.actionTitle}>Request Password Reset</Text>
          </View>
          {isSendingReset ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Icon name="arrow-forward" size={16} color={COLORS.textSubtle} />
          )}
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={[styles.logoutBtn, isLoggingOut && styles.btnDisabled]}
        onPress={handleLogout}
        disabled={isLoggingOut}
        activeOpacity={0.85}
      >
        {isLoggingOut ? (
          <ActivityIndicator color={COLORS.primary} size="small" />
        ) : (
          <>
            <Icon name="log-out" size={16} color={COLORS.primary} style={{ marginRight: 8 }} />
            <Text style={styles.logoutBtnText}>Log Out of Counsellor Account</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: 125,
  },
  headerCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.selectedCardBg,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  avatarInitial: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 13,
    color: COLORS.textSubtle,
    marginBottom: 10,
  },
  roleBadge: {
    backgroundColor: COLORS.selectedCardBg,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  messageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.selectedCardBg,
    borderWidth: 1,
    borderColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
  },
  messageText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
    flex: 1,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDE8E8',
    borderWidth: 1,
    borderColor: '#F8B4B4',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: 13,
    color: '#9B1C1C',
    flex: 1,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  infoRow: {
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  infoValueHighlight: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F2F7F5',
    marginVertical: 6,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingVertical: 14,
    marginTop: SPACING.xs,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  logoutBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },
});
