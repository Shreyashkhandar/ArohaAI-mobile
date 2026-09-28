import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { COLORS } from '../../shared/theme/theme';
import Icon from '../../shared/components/Icon';

const DEFAULT_ROUTINE = [
  { id: '1', title: 'Wake up on time', description: 'Start your day at a consistent time.' },
  { id: '2', title: 'Have regular meals', description: 'Nourish your body throughout the day.' },
  { id: '3', title: 'Take a short walk', description: 'Get fresh air and light movement.' },
  { id: '4', title: 'Read or relax', description: 'Spend 15 minutes engaging in quiet relaxation.' },
  { id: '5', title: 'Stay connected', description: 'Reach out to a friend, family member, or counsellor.' },
  { id: '6', title: 'Sleep on time', description: 'Rest well to support your physical and mental health.' },
];

export default function UserRoutineScreen() {
  const [completedItems, setCompletedItems] = useState({});

  const toggleItem = (id) => {
    setCompletedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const completedCount = Object.values(completedItems).filter(Boolean).length;
  const totalCount = DEFAULT_ROUTINE.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wellbeing Routine</Text>
        <Text style={styles.headerSubtitle}>
          Daily activities designed to support your regular structure and wellbeing.
        </Text>
      </View>

      {/* Progress Card */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeaderRow}>
          <Text style={styles.progressTitle}>Today's Progress</Text>
          <Text style={styles.progressBadgeText}>
            {completedCount} of {totalCount} completed
          </Text>
        </View>

        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>

        <Text style={styles.progressSubtitle}>
          {progressPercent === 100
            ? 'Great job! You have completed all routine activities today.'
            : 'Keep going at your own comfortable pace.'}
        </Text>
      </View>

      {/* Routine List Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Daily Activities</Text>
        {DEFAULT_ROUTINE.map((item, index) => {
          const isDone = !!completedItems[item.id];
          return (
            <React.Fragment key={item.id}>
              {index > 0 && <View style={styles.divider} />}
              <TouchableOpacity
                style={styles.routineItemRow}
                onPress={() => toggleItem(item.id)}
                activeOpacity={0.7}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isDone }}
              >
                <View style={[styles.checkbox, isDone && styles.checkboxChecked]}>
                  {isDone && <Icon name="checkmark" size={14} color="#FFFFFF" />}
                </View>
                <View style={styles.itemTextContainer}>
                  <Text style={[styles.itemTitle, isDone && styles.itemTitleDone]}>
                    {item.title}
                  </Text>
                  <Text style={styles.itemDescription}>{item.description}</Text>
                </View>
              </TouchableOpacity>
            </React.Fragment>
          );
        })}
      </View>
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
  progressCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 20,
    marginBottom: 20,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  progressBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: '#EBF3F0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 5,
  },
  progressSubtitle: {
    fontSize: 13,
    color: COLORS.textSubtle,
    lineHeight: 18,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 20,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  routineItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F5F3',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    marginTop: 2,
    backgroundColor: COLORS.background,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemTextContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  itemTitleDone: {
    color: COLORS.textSubtle,
    textDecorationLine: 'line-through',
  },
  itemDescription: {
    fontSize: 13,
    color: COLORS.textSubtle,
    lineHeight: 18,
  },
});
