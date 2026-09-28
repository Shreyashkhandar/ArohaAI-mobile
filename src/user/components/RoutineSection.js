import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../shared/theme/theme';
import Icon from '../../shared/components/Icon';
import { useI18n } from '../../shared/i18n';
import { fetchTodayRoutines, toggleRoutineCompletion } from '../services/routineService';

const ROUTINE_KEY_MAP = {
  '1': 'routine.wakeUp',
  '2': 'routine.regularMeals',
  '3': 'routine.shortWalk',
  '4': 'routine.relaxation',
  '5': 'routine.stayConnected',
  '6': 'routine.sleepOnTime',
};

export default function RoutineSection() {
  const { t } = useI18n();
  const [routines, setRoutines] = useState([]);
  const [completedMap, setCompletedMap] = useState({});

  useEffect(() => {
    let isMounted = true;
    async function loadRoutines() {
      const items = await fetchTodayRoutines();
      if (isMounted) {
        setRoutines(items);
      }
    }
    loadRoutines();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggle = async (id) => {
    const nextState = await toggleRoutineCompletion(id, !!completedMap[id]);
    setCompletedMap((prev) => ({
      ...prev,
      [id]: nextState,
    }));
  };

  const completedCount = Object.values(completedMap).filter(Boolean).length;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{t('home.todaysRoutine')}</Text>
        <Text style={styles.counterText}>
          {completedCount} of {routines.length} {t('home.itemsDone')}
        </Text>
      </View>

      <View style={styles.listCard}>
        {routines.map((item, index) => {
          const isDone = !!completedMap[item.id];
          const i18nKey = ROUTINE_KEY_MAP[item.id] || item.key;
          const translatedTitle = t(i18nKey) || item.defaultTitle;

          return (
            <React.Fragment key={item.id}>
              {index > 0 && <View style={styles.divider} />}
              <TouchableOpacity
                style={styles.row}
                onPress={() => handleToggle(item.id)}
                activeOpacity={0.7}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isDone }}
                accessibilityLabel={`${translatedTitle}, ${isDone ? 'completed' : 'not completed'}`}
              >
                <Icon
                  name={isDone ? 'checkmark-circle' : 'ellipse-outline'}
                  size={20}
                  color={isDone ? COLORS.primary : COLORS.textSubtle}
                  style={styles.icon}
                />
                <Text
                  style={[
                    styles.itemText,
                    isDone && styles.itemTextDone,
                  ]}
                >
                  {translatedTitle}
                </Text>
              </TouchableOpacity>
            </React.Fragment>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm + 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  counterText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  listCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  icon: {
    marginRight: 12,
  },
  itemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
  itemTextDone: {
    color: COLORS.textSubtle,
    textDecorationLine: 'line-through',
  },
  divider: {
    height: 1,
    backgroundColor: '#F2F7F5',
  },
});
