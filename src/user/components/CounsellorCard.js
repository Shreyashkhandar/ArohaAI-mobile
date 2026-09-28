import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../shared/theme/theme';
import Icon from '../../shared/components/Icon';
import { getAssignedCounsellor } from '../services/counsellorService';
import { useI18n } from '../../shared/i18n';

export default function CounsellorCard({ style }) {
  const { t } = useI18n();
  const [counsellor, setCounsellor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadCounsellor = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await getAssignedCounsellor();
      if (res && res.success) {
        setCounsellor(res.counsellor || null);
      } else {
        setErrorMessage(res?.message || t('counsellor.unableToLoadCounsellor'));
      }
    } catch (err) {
      console.warn('[CounsellorCard] Load exception:', err?.message);
      setErrorMessage(t('counsellor.unableToLoadCounsellor'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadCounsellor();
  }, [loadCounsellor]);

  const handleCallPress = () => {
    if (!counsellor || !counsellor.phone) return;

    const rawPhone = String(counsellor.phone).trim();
    const cleanPhone = rawPhone.replace(/[^\d+]/g, '');

    if (!cleanPhone) return;

    const counsellorName = counsellor.full_name || 'your counsellor';

    Alert.alert(
      t('counsellor.callConfirmTitle'),
      t('counsellor.callConfirmMsg', { name: counsellorName }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('counsellor.callCounsellor'),
          onPress: () => {
            Linking.openURL(`tel:${cleanPhone}`).catch((err) => {
              console.warn('[CounsellorCard] Linking error:', err?.message);
              Alert.alert('Unable to place call', 'Please try calling directly from your phone app.');
            });
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.card, style]}>
      <Text style={styles.cardHeaderTitle}>{t('counsellor.yourCounsellor')}</Text>

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingText}>{t('counsellor.loadingCounsellor')}</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.errorBox}>
          <Icon name="alert-circle" size={18} color="#9B1C1C" style={{ marginRight: 8 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
          <TouchableOpacity style={styles.retryBtn} onPress={loadCounsellor} activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : counsellor ? (
        <View style={styles.contentBody}>
          <View style={styles.counsellorInfoRow}>
            <View style={styles.avatarCircle}>
              <Icon name="person" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.counsellorName}>{counsellor.full_name || 'Assigned Counsellor'}</Text>
              <Text style={styles.counsellorSub}>{t('counsellor.assignedCounsellor')}</Text>

              <View style={styles.phoneRow}>
                <Icon name="call" size={13} color={COLORS.textSubtle} style={{ marginRight: 6 }} />
                <Text style={styles.phoneText}>
                  {counsellor.phone ? counsellor.phone : t('counsellor.phoneNotAvailable')}
                </Text>
              </View>
            </View>
          </View>

          {Boolean(counsellor.phone) ? (
            <TouchableOpacity
              style={styles.callButton}
              onPress={handleCallPress}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t('counsellor.callCounsellor')}
            >
              <Icon name="call" size={15} color={COLORS.buttonText} style={{ marginRight: 8 }} />
              <Text style={styles.callButtonText}>{t('counsellor.callCounsellor')}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.noPhoneBadge}>
              <Text style={styles.noPhoneText}>{t('counsellor.phoneNotAvailable')}</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.unassignedBox}>
          <Icon name="person-outline" size={26} color={COLORS.textSubtle} style={{ marginBottom: 6 }} />
          <Text style={styles.unassignedTitle}>{t('counsellor.counsellorNotAssignedTitle')}</Text>
          <Text style={styles.unassignedSub}>{t('counsellor.counsellorNotAssignedSub')}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    elevation: 1,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  cardHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: SPACING.md,
  },
  loadingBox: {
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 13,
    color: COLORS.textSubtle,
    fontWeight: '500',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF2F2',
    borderWidth: 1,
    borderColor: '#F8B4B4',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  errorText: {
    fontSize: 13,
    color: '#9B1C1C',
    fontWeight: '500',
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  contentBody: {
    width: '100%',
  },
  counsellorInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.selectedCardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
  },
  counsellorName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  counsellorSub: {
    fontSize: 12,
    color: COLORS.textSubtle,
    marginBottom: 4,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  callButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: 12,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  callButtonText: {
    color: COLORS.buttonText,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  noPhoneBadge: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  noPhoneText: {
    fontSize: 12,
    color: COLORS.textSubtle,
    fontWeight: '500',
  },
  unassignedBox: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  unassignedTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  unassignedSub: {
    fontSize: 13,
    color: COLORS.textSubtle,
    textAlign: 'center',
    lineHeight: 18,
  },
});
