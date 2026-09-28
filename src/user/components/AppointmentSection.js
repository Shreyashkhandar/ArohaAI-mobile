import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../shared/theme/theme';
import Icon from '../../shared/components/Icon';
import { useI18n } from '../../shared/i18n';

export default function AppointmentSection({ appointment, isLoading }) {
  const { t } = useI18n();

  const formatDate = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t('home.upcomingAppointments')}</Text>

      <View style={styles.card}>
        {appointment ? (
          <View style={styles.appointmentContent}>
            <View style={styles.badgeRow}>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>Confirmed</Text>
              </View>
            </View>

            <View style={styles.row}>
              <Icon name="document-text" size={18} color={COLORS.primary} style={styles.icon} />
              <View style={styles.meta}>
                <Text style={styles.dateText}>{formatDate(appointment.appointment_date)}</Text>
                <Text style={styles.subText}>Counsellor session</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.emptyContent}>
            <Icon name="document-text-outline" size={24} color={COLORS.textSubtle} style={{ marginBottom: 6 }} />
            <Text style={styles.emptyTitle}>
              {t('home.noAppointmentsYet')}
            </Text>
            <Text style={styles.emptySub}>
              {t('home.scheduleContactInfo')}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs + 4,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.lg,
  },
  appointmentContent: {
    width: '100%',
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
  },
  statusBadge: {
    backgroundColor: COLORS.selectedCardBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  icon: {
    marginRight: 12,
  },
  meta: {
    flex: 1,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  subText: {
    fontSize: 13,
    color: COLORS.textSubtle,
    marginTop: 2,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textSubtle,
    textAlign: 'center',
    lineHeight: 18,
  },
});
