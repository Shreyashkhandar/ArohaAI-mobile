import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../../shared/theme/theme';
import Icon from '../../shared/components/Icon';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { APP_CONFIG } from '../../shared/config/appConfig';
import { DEMO_APPOINTMENTS } from '../../shared/demo/demoData';

export default function UserAppointmentsScreen({ user }) {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadAppointments() {
      if (APP_CONFIG.presentationMode) {
        if (isMounted) {
          setAppointments(DEMO_APPOINTMENTS);
          setIsLoading(false);
        }
        return;
      }

      if (!user?.id || !isSupabaseConfigured()) {
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await supabase
          .from('appointments')
          .select('*')
          .eq('user_id', user.id)
          .order('scheduled_at', { ascending: true });

        if (isMounted) {
          setAppointments(data || []);
        }
      } catch (err) {
        console.warn('[UserAppointmentsScreen] Load error:', err.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadAppointments();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Counselling Appointments</Text>
        <Text style={styles.headerSubtitle}>
          Your scheduled support sessions and care follow-ups.
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loadingText}>Loading appointments...</Text>
        </View>
      ) : appointments.length > 0 ? (
        <View style={styles.list}>
          {appointments.map((item, idx) => (
            <View key={item.id || idx} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.title || 'Support Session'}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>
                    {item.status ? String(item.status).toUpperCase() : 'SCHEDULED'}
                  </Text>
                </View>
              </View>

              {item.scheduled_at ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                  <Icon name="calendar" size={16} color={COLORS.textSecondary} style={{ marginRight: 6 }} />
                  <Text style={styles.timeText}>
                    {new Date(item.scheduled_at).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              ) : null}

              {item.notes ? (
                <Text style={styles.notesText}>{item.notes}</Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Icon name="calendar" size={36} color={COLORS.primary} style={{ marginBottom: 12 }} />
          <Text style={styles.emptyTitle}>No upcoming appointments</Text>
          <Text style={styles.emptySubtitle}>
            When a counselling session is scheduled by your counsellor, details will appear here.
          </Text>
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
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSubtle,
    lineHeight: 20,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSubtle,
  },
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 20,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  statusBadge: {
    backgroundColor: COLORS.selectedCardBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  statusBadgeText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  notesText: {
    fontSize: 13,
    color: COLORS.textSubtle,
    lineHeight: 18,
  },
  emptyCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 28,
    alignItems: 'center',
    marginTop: 10,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSubtle,
    textAlign: 'center',
    lineHeight: 20,
  },
});
