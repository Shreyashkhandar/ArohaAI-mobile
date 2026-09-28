import React from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../shared/theme/theme';
import { useI18n } from '../../shared/i18n';

export default function CheckInTextInput({
  value,
  onChangeText,
  maxLength = 500,
  disabled = false,
  onClear,
}) {
  const { t } = useI18n();
  const currentLength = value ? value.length : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>{t('checkin.tellCounsellorQuestion')}</Text>

      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.textInput}
          placeholder={t('checkin.tellCounsellorPlaceholder')}
          placeholderTextColor="#8A9D93"
          value={value}
          onChangeText={onChangeText}
          multiline
          numberOfLines={4}
          maxLength={maxLength}
          textAlignVertical="top"
          editable={!disabled}
          accessibilityLabel="Optional message for counsellor"
        />

        <View style={styles.footerRow}>
          {value ? (
            <TouchableOpacity
              onPress={onClear}
              disabled={disabled}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('common.clearText')}
            >
              <Text style={styles.clearButtonText}>{t('common.clearText')}</Text>
            </TouchableOpacity>
          ) : (
            <View />
          )}

          <Text style={styles.counterText}>
            {currentLength} / {maxLength}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.xl,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  inputWrapper: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.md,
  },
  textInput: {
    fontSize: 15,
    color: COLORS.text,
    minHeight: 90,
    lineHeight: 22,
    paddingTop: 0,
    paddingBottom: SPACING.sm,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F2F7F5',
    paddingTop: SPACING.xs + 4,
    marginTop: SPACING.xs,
  },
  clearButtonText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  counterText: {
    fontSize: 12,
    color: COLORS.textSubtle,
    fontWeight: '500',
  },
});
