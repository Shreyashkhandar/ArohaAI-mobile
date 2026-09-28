import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../shared/theme/theme';
import Icon from '../../shared/components/Icon';
import { useI18n } from '../../shared/i18n';

export default function UserNavBar({ activeTab, onSelectTab }) {
  const { t } = useI18n();

  const tabs = [
    { id: 'home', labelKey: 'common.home', activeIcon: 'home', inactiveIcon: 'home-outline' },
    { id: 'checkin', labelKey: 'common.checkIn', activeIcon: 'document-text', inactiveIcon: 'document-text-outline' },
    { id: 'appointments', labelKey: 'home.upcomingAppointments', activeIcon: 'calendar', inactiveIcon: 'calendar-outline', fallbackLabel: 'Schedule' },
    { id: 'routine', labelKey: 'home.todaysRoutine', activeIcon: 'grid', inactiveIcon: 'grid-outline', fallbackLabel: 'Routine' },
    { id: 'profile', labelKey: 'common.profile', activeIcon: 'person', inactiveIcon: 'person-outline' },
  ];

  return (
    <View style={styles.navBarContainer}>
      <View style={styles.navBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const label = tab.fallbackLabel ? (tab.id === 'appointments' ? 'Schedule' : 'Routine') : t(tab.labelKey);

          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabButton, isActive && styles.activeTabButton]}
              onPress={() => onSelectTab(tab.id)}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${label} tab`}
            >
              <Icon
                name={isActive ? tab.activeIcon : tab.inactiveIcon}
                size={18}
                color={isActive ? COLORS.primary : COLORS.textSubtle}
                style={styles.tabIcon}
              />
              <Text
                style={[styles.tabLabel, isActive && styles.activeTabLabel]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navBarContainer: {
    backgroundColor: COLORS.cardBackground,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    paddingHorizontal: SPACING.xs,
    paddingTop: SPACING.xs,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    elevation: 4,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.md,
    marginHorizontal: 2,
  },
  activeTabButton: {
    backgroundColor: COLORS.selectedCardBg,
  },
  tabIcon: {
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.textSubtle,
    letterSpacing: 0.1,
  },
  activeTabLabel: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});
