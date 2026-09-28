import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../shared/theme/theme';
import { useI18n } from '../../shared/i18n';

export const MOOD_OPTIONS = [
  { id: "I'm feeling okay", labelKey: 'checkin.feelingOkayOption' },
  { id: "I'm having a difficult day", labelKey: 'checkin.feelingDifficultDayOption' },
  { id: "I'm struggling", labelKey: 'checkin.feelingStrugglingOption' },
  { id: "I need support", labelKey: 'checkin.feelingNeedSupportOption' },
];

export default function CheckInMoodSelector({ selectedMood, onSelectMood, disabled }) {
  const { t } = useI18n();

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>{t('checkin.question')}</Text>
      <View style={styles.optionsList}>
        {MOOD_OPTIONS.map((option) => {
          const isSelected = selectedMood === option.id;
          const translatedLabel = t(option.labelKey);
          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionPill,
                isSelected && styles.optionPillSelected,
              ]}
              onPress={() => onSelectMood(option.id)}
              disabled={disabled}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={translatedLabel}
            >
              <View
                style={[
                  styles.radioIndicator,
                  isSelected && styles.radioIndicatorSelected,
                ]}
              >
                {isSelected && <View style={styles.radioDot} />}
              </View>

              <Text
                style={[
                  styles.optionPillText,
                  isSelected && styles.optionPillTextSelected,
                ]}
              >
                {translatedLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.xl,
  },
  sectionLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm + 4,
  },
  optionsList: {
    gap: SPACING.xs + 4,
  },
  optionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 52,
  },
  optionPillSelected: {
    backgroundColor: COLORS.selectedCardBg,
    borderColor: COLORS.primary,
    borderWidth: 1.5,
  },
  radioIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.textSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioIndicatorSelected: {
    borderColor: COLORS.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  optionPillText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
    flexShrink: 1,
  },
  optionPillTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});
