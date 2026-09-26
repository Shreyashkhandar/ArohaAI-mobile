import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { COLORS } from '../../shared/theme/theme';
import { submitCheckIn } from '../services/checkinService';

const PREDEFINED_OPTIONS = [
  { id: 'Good', label: 'Good', emoji: '😊' },
  { id: 'Okay', label: 'Okay', emoji: '😐' },
  { id: 'Not great', label: 'Not great', emoji: '🙁' },
  { id: 'Difficult', label: 'Difficult', emoji: '🌧️' },
];

export default function CheckInScreen({ onNavigateToHome, onCheckInComplete }) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async () => {
    if (!selectedOption || isSubmitting) return;

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await submitCheckIn(selectedOption);
      setIsSuccess(true);
      if (onCheckInComplete) {
        onCheckInComplete();
      }
    } catch (err) {
      setErrorMessage(err.message || 'Unable to submit check-in. Please try again.');
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
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Check-in</Text>
        <Text style={styles.headerSubtitle}>
          Take a moment for yourself today.
        </Text>
      </View>

      {/* Error Banner */}
      {errorMessage ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {isSuccess ? (
        /* Success State */
        <View style={styles.successCard}>
          <View style={styles.successBadge}>
            <Text style={styles.successBadgeIcon}>✓</Text>
          </View>
          <Text style={styles.successTitle}>Check-in recorded</Text>
          <Text style={styles.successSubtitle}>
            Thank you for checking in today. Your response has been saved securely.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleReturnToHome}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Return to Home"
          >
            <Text style={styles.primaryButtonText}>Return to Home</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Check-in Selection Card */
        <View style={styles.card}>
          <Text style={styles.questionTitle}>How are you feeling today?</Text>
          <Text style={styles.questionSubtitle}>
            Select the option that best describes your feeling.
          </Text>

          {/* Predefined Options */}
          <View style={styles.optionsContainer}>
            {PREDEFINED_OPTIONS.map((option) => {
              const isSelected = selectedOption === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionButton,
                    isSelected && styles.optionButtonSelected,
                  ]}
                  onPress={() => {
                    setSelectedOption(option.id);
                    if (errorMessage) setErrorMessage('');
                  }}
                  disabled={isSubmitting}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={option.label}
                >
                  <Text style={styles.optionEmoji}>{option.emoji}</Text>
                  <Text
                    style={[
                      styles.optionLabel,
                      isSelected && styles.optionLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.primaryButton,
              (!selectedOption || isSubmitting) && styles.buttonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!selectedOption || isSubmitting}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Submit Check-in"
          >
            {isSubmitting ? (
              <ActivityIndicator color={COLORS.buttonText} size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>Submit Check-in</Text>
            )}
          </TouchableOpacity>

          {onNavigateToHome && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleReturnToHome}
              disabled={isSubmitting}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={styles.cancelButtonText}>Return to Home</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
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
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.2,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSubtle,
    lineHeight: 20,
  },
  errorCard: {
    backgroundColor: '#FDF2F2',
    borderWidth: 1,
    borderColor: '#F8B4B4',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  errorText: {
    color: '#9B1C1C',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 24,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  questionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  questionSubtitle: {
    fontSize: 13,
    color: COLORS.textSubtle,
    marginBottom: 22,
    lineHeight: 18,
  },
  optionsContainer: {
    marginBottom: 24,
  },
  optionButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 54,
  },
  optionButtonSelected: {
    backgroundColor: COLORS.selectedCardBg,
    borderColor: COLORS.primary,
  },
  optionEmoji: {
    fontSize: 22,
    marginRight: 14,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  optionLabelSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: COLORS.buttonText,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  cancelButton: {
    marginTop: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    color: COLORS.textSubtle,
    fontWeight: '600',
  },
  successCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 28,
    alignItems: 'center',
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    marginVertical: 10,
  },
  successBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.selectedCardBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  successBadgeIcon: {
    fontSize: 28,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 14,
    color: COLORS.textSubtle,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
});
