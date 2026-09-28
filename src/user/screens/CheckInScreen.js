import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../shared/theme/theme';
import Icon from '../../shared/components/Icon';
import CheckInMoodSelector from '../components/CheckInMoodSelector';
import CheckInTextInput from '../components/CheckInTextInput';
import { submitCheckIn } from '../services/checkinService';
import { useI18n } from '../../shared/i18n';

export default function CheckInScreen({ onNavigateToHome, onCheckInComplete }) {
  const { t } = useI18n();
  const [selectedMood, setSelectedMood] = useState(null);
  const [reflectionText, setReflectionText] = useState('');
  const [wantsContact, setWantsContact] = useState(null); // null, true, false
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async () => {
    if (!selectedMood || isSubmitting) return;

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const parts = [`Feeling: ${selectedMood}`];
      if (reflectionText.trim()) {
        parts.push(`Message to counsellor: ${reflectionText.trim()}`);
      }
      if (wantsContact !== null) {
        parts.push(`Contact requested: ${wantsContact ? 'Yes' : 'No'}`);
      }

      const fullResponse = parts.join(' | ');

      await submitCheckIn(fullResponse);
      setIsSuccess(true);
      if (onCheckInComplete) {
        onCheckInComplete();
      }
    } catch (err) {
      setErrorMessage(
        err?.message || t('checkin.saveErrorMessage')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnToHome = () => {
    if (onNavigateToHome) {
      onNavigateToHome();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardView}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Navigation Header */}
        <View style={styles.headerBar}>
          {onNavigateToHome && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleReturnToHome}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
            >
              <Icon name="arrow-back" size={16} color={COLORS.primary} />
              <Text style={styles.backButtonText}>{t('common.home')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.screenTitle}>{t('checkin.title')}</Text>
          <Text style={styles.screenSubtitle}>
            {t('checkin.headerSub')}
          </Text>
        </View>

        {/* Error Banner */}
        {errorMessage ? (
          <View style={styles.errorCard}>
            <Icon name="shield" size={16} color="#9B1C1C" style={{ marginRight: 8 }} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {isSuccess ? (
          /* Confirmation / Success State */
          <View style={styles.successCard}>
            <View style={styles.successIconCircle}>
              <Icon name="checkmark" size={30} color={COLORS.primary} />
            </View>

            <Text style={styles.successTitle}>{t('checkin.checkInSubmittedTitle')}</Text>
            <Text style={styles.successSubtitle}>
              {t('checkin.checkInSubmittedMessage')}
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleReturnToHome}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t('common.backToHome')}
            >
              <Text style={styles.primaryButtonText}>{t('common.backToHome')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Current Check-In Form */
          <View style={styles.formContainer}>
            {/* Section 1: Mood Selector */}
            <CheckInMoodSelector
              selectedMood={selectedMood}
              onSelectMood={(mood) => {
                setSelectedMood(mood);
                if (errorMessage) setErrorMessage('');
              }}
              disabled={isSubmitting}
            />

            {/* Section 2: Optional Text Message for Counsellor */}
            <CheckInTextInput
              value={reflectionText}
              onChangeText={setReflectionText}
              disabled={isSubmitting}
              onClear={() => setReflectionText('')}
            />

            {/* Section 3: Contact Request Option */}
            <View style={styles.contactSection}>
              <Text style={styles.sectionLabel}>{t('checkin.contactRequestQuestion')}</Text>
              <View style={styles.contactChoiceRow}>
                <TouchableOpacity
                  style={[
                    styles.contactChip,
                    wantsContact === true && styles.contactChipSelected,
                  ]}
                  onPress={() => setWantsContact(true)}
                  disabled={isSubmitting}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.contactChipText,
                      wantsContact === true && styles.contactChipTextSelected,
                    ]}
                  >
                    {t('common.yes')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.contactChip,
                    wantsContact === false && styles.contactChipSelected,
                  ]}
                  onPress={() => setWantsContact(false)}
                  disabled={isSubmitting}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.contactChipText,
                      wantsContact === false && styles.contactChipTextSelected,
                    ]}
                  >
                    {t('common.no')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Privacy & Security Note */}
            <View style={styles.privacyCard}>
              <Icon name="shield-outline" size={16} color={COLORS.primary} style={styles.privacyIcon} />
              <Text style={styles.privacyText}>
                {t('checkin.privacyComfortNote')}
              </Text>
            </View>

            {/* Primary Submit Button */}
            <TouchableOpacity
              style={[
                styles.primaryButton,
                (!selectedMood || isSubmitting) && styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!selectedMood || isSubmitting}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t('checkin.submitCheckIn')}
            >
              {isSubmitting ? (
                <ActivityIndicator color={COLORS.buttonText} size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>{t('checkin.submitCheckIn')}</Text>
              )}
            </TouchableOpacity>

            {onNavigateToHome && (
              <TouchableOpacity
                style={styles.cancelLink}
                onPress={handleReturnToHome}
                disabled={isSubmitting}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelLinkText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl + 20,
  },
  headerBar: {
    marginBottom: SPACING.sm,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 4,
  },
  titleSection: {
    marginBottom: SPACING.lg,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
    letterSpacing: 0.1,
  },
  screenSubtitle: {
    fontSize: 14,
    color: COLORS.textSubtle,
    lineHeight: 20,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF2F2',
    borderWidth: 1,
    borderColor: '#F8B4B4',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  errorText: {
    flex: 1,
    color: '#9B1C1C',
    fontSize: 13,
    fontWeight: '500',
  },
  formContainer: {
    width: '100%',
  },
  contactSection: {
    marginBottom: SPACING.xl,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  contactChoiceRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  contactChip: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  contactChipSelected: {
    backgroundColor: COLORS.selectedCardBg,
    borderColor: COLORS.primary,
    borderWidth: 1.5,
  },
  contactChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  contactChipTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F4F8F6',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: '#E2ECE7',
  },
  privacyIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  privacyText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSubtle,
    lineHeight: 18,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: COLORS.buttonText,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  cancelLink: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.xs,
    alignItems: 'center',
  },
  cancelLinkText: {
    fontSize: 14,
    color: COLORS.textSubtle,
    fontWeight: '500',
  },
  successCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.xl,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  successIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.selectedCardBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 14,
    color: COLORS.textSubtle,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.xl,
  },
});
