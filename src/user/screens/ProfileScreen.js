import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../shared/theme/theme';
import Icon from '../../shared/components/Icon';
import { logout, getUserProfile } from '../../shared/services/authService';
import { getAssignedCounsellor } from '../services/counsellorService';
import { useI18n } from '../../shared/i18n';

export default function ProfileScreen({ profile: initialProfile, user, onLogoutSuccess }) {
  const { t, language, setLanguage } = useI18n();
  const [profile, setProfile] = useState(initialProfile);
  const [counsellor, setCounsellor] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (user?.id) {
        try {
          setIsLoadingProfile(true);
          const [freshData, counsellorRes] = await Promise.all([
            getUserProfile(user.id),
            getAssignedCounsellor(),
          ]);
          if (isMounted) {
            if (freshData) setProfile(freshData);
            if (counsellorRes && counsellorRes.success) {
              setCounsellor(counsellorRes.counsellor);
            }
          }
        } catch (err) {
          console.warn('[ProfileScreen] Load error:', err?.message);
        } finally {
          if (isMounted) setIsLoadingProfile(false);
        }
      }
    }

    loadData();
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
      console.warn('Logout error:', err?.message);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const fullName = profile?.full_name || user?.user_metadata?.full_name || 'User Account';
  const email = profile?.email || user?.email || 'N/A';
  const phone = profile?.phone || 'Not provided';
  const userInitial = fullName.charAt(0).toUpperCase();

  const counsellorName = counsellor ? counsellor.full_name : t('profile.notAssigned');
  const counsellorPhone = counsellor && counsellor.phone ? counsellor.phone : t('counsellor.phoneNotAvailable');

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Title Header */}
      <View style={styles.headerTitleSection}>
        <Text style={styles.screenTitle}>{t('profile.title')}</Text>
      </View>

      {/* User Identity Card */}
      <View style={styles.userCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitial}>{userInitial}</Text>
        </View>
        <View style={styles.userMeta}>
          <Text style={styles.userName}>{fullName}</Text>
          <Text style={styles.userEmail}>{email}</Text>
        </View>
        {isLoadingProfile && (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginLeft: 8 }} />
        )}
      </View>

      {/* Language Preference Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeading}>{t('profile.languagePreference')}</Text>
        <View style={styles.languageOptionsRow}>
          {[
            { code: 'en', label: 'English' },
            { code: 'hi', label: 'Hindi (हिंदी)' },
            { code: 'mr', label: 'Marathi (मराठी)' },
          ].map((lang) => {
            const isSelected = language === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.langChip,
                  isSelected && styles.langChipSelected,
                ]}
                onPress={() => setLanguage(lang.code)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <Text
                  style={[
                    styles.langChipText,
                    isSelected && styles.langChipTextSelected,
                  ]}
                >
                  {lang.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Section 1: Personal Information */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeading}>{t('profile.accountSection')}</Text>

        <View style={styles.listCard}>
          {/* Row 1: Name */}
          <View style={styles.listRow}>
            <Icon name="person" size={18} color={COLORS.primary} style={styles.rowIcon} />
            <Text style={styles.rowLabel}>{t('profile.fullName')}</Text>
            <Text style={styles.rowValue}>{fullName}</Text>
          </View>

          <View style={styles.rowDivider} />

          {/* Row 2: Email */}
          <View style={styles.listRow}>
            <Icon name="mail" size={18} color={COLORS.primary} style={styles.rowIcon} />
            <Text style={styles.rowLabel}>{t('profile.email')}</Text>
            <Text style={styles.rowValue}>{email}</Text>
          </View>

          <View style={styles.rowDivider} />

          {/* Row 3: Phone */}
          <View style={styles.listRow}>
            <Icon name="call" size={18} color={COLORS.primary} style={styles.rowIcon} />
            <Text style={styles.rowLabel}>{t('profile.phone')}</Text>
            <Text style={styles.rowValue}>{phone}</Text>
          </View>

          <View style={styles.rowDivider} />

          {/* Row 4: Privacy & Protection */}
          <View style={styles.listRow}>
            <Icon name="shield" size={18} color={COLORS.primary} style={styles.rowIcon} />
            <Text style={styles.rowLabel}>{t('profile.privacyConsent')}</Text>
            <Text style={styles.rowValue}>{t('profile.protectedText')}</Text>
          </View>
        </View>
      </View>

      {/* Section 2: Support Information */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeading}>{t('profile.supportSection')}</Text>

        <View style={styles.listCard}>
          {/* Row 1: Assigned Counsellor */}
          <View style={styles.listRow}>
            <Icon name="person" size={18} color={COLORS.primary} style={styles.rowIcon} />
            <Text style={styles.rowLabel}>{t('profile.assignedCounsellor')}</Text>
            <Text style={[styles.rowValue, counsellor && { fontWeight: '700', color: COLORS.text }]}>
              {counsellorName}
            </Text>
          </View>

          <View style={styles.rowDivider} />

          {/* Row 2: Counsellor Phone */}
          <View style={styles.listRow}>
            <Icon name="call" size={18} color={COLORS.primary} style={styles.rowIcon} />
            <Text style={styles.rowLabel}>{t('profile.counsellorPhone')}</Text>
            <Text style={styles.rowValue}>{counsellorPhone}</Text>
          </View>

          <View style={styles.rowDivider} />

          {/* Row 3: Case / Support Status */}
          <View style={styles.listRow}>
            <Icon name="folder-open" size={18} color={COLORS.primary} style={styles.rowIcon} />
            <Text style={styles.rowLabel}>{t('profile.caseStatus')}</Text>
            <Text style={[styles.rowValue, { color: COLORS.primary, fontWeight: '700' }]}>
              {counsellor ? t('profile.activeCareCase') : t('profile.notAssigned')}
            </Text>
          </View>
        </View>
      </View>

      {/* Section 3: Privacy Information */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeading}>{t('profile.privacyInfoTitle')}</Text>
        <View style={styles.privacyCard}>
          <Text style={styles.privacyText}>
            {t('profile.privacyInfoBody')}
          </Text>
        </View>
      </View>

      {/* Section 4: Sign Out */}
      <View style={styles.sectionContainer}>
        <TouchableOpacity
          style={[styles.logoutRow, isLoggingOut && styles.buttonDisabled]}
          onPress={handleLogout}
          disabled={isLoggingOut}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          {isLoggingOut ? (
            <ActivityIndicator color={COLORS.primary} size="small" />
          ) : (
            <>
              <Icon name="log-out" size={18} color={COLORS.primary} style={{ marginRight: 10 }} />
              <Text style={styles.logoutText}>{t('common.signOut')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl + 20,
  },
  headerTitleSection: {
    marginBottom: SPACING.md,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.1,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.selectedCardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary,
  },
  userMeta: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.textSubtle,
  },
  sectionContainer: {
    marginBottom: SPACING.xl,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: SPACING.xs + 2,
    marginLeft: 4,
  },
  languageOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs + 2,
  },
  langChip: {
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minHeight: 44,
    justifyContent: 'center',
  },
  langChipSelected: {
    backgroundColor: COLORS.selectedCardBg,
    borderColor: COLORS.primary,
  },
  langChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text,
  },
  langChipTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  listCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingHorizontal: SPACING.md,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  rowIcon: {
    marginRight: 12,
  },
  rowLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSubtle,
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F2F7F5',
  },
  privacyCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.md,
  },
  privacyText: {
    fontSize: 13,
    color: COLORS.textSubtle,
    lineHeight: 19,
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingVertical: 14,
    minHeight: 48,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },
});
