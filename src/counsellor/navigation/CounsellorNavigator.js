import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../../shared/theme/theme';
import Icon from '../../shared/components/Icon';

import CounsellorHomeScreen from '../screens/CounsellorHomeScreen';
import CounsellorCasesScreen from '../screens/CounsellorCasesScreen';
import AddUserCaseScreen from '../screens/AddUserCaseScreen';
import CounsellorAppointmentsScreen from '../screens/CounsellorAppointmentsScreen';
import CounsellorAlertsScreen from '../screens/CounsellorAlertsScreen';
import CounsellorProfileScreen from '../screens/CounsellorProfileScreen';
import UserCaseDetailScreen from '../screens/UserCaseDetailScreen';

const BOTTOM_TABS = [
  { id: 'home', label: 'Dashboard', icon: 'grid-outline' },
  { id: 'cases', label: 'Cases', icon: 'folder-open-outline' },
  { id: 'add_user', label: 'Register', icon: 'person-add-outline' },
  { id: 'appointments', label: 'Schedule', icon: 'calendar-outline' },
  { id: 'alerts', label: 'Alerts', icon: 'notifications-outline' },
  { id: 'profile', label: 'Profile', icon: 'person-outline' },
];

export default function CounsellorNavigator({ profile, user, onLogoutSuccess }) {
  const [currentTab, setCurrentTab] = useState('home');
  const [selectedCase, setSelectedCase] = useState(null);

  const handleNavigate = (screenName, caseObj = null) => {
    if (caseObj) {
      setSelectedCase(caseObj);
    }
    setCurrentTab(screenName);
  };

  const renderActiveScreen = () => {
    switch (currentTab) {
      case 'home':
        return (
          <CounsellorHomeScreen
            profile={profile}
            user={user}
            onLogoutSuccess={onLogoutSuccess}
            onNavigate={handleNavigate}
          />
        );

      case 'cases':
        return (
          <CounsellorCasesScreen
            onSelectCase={(caseObj) => handleNavigate('view_case', caseObj)}
            onAddNewVictim={() => handleNavigate('add_user')}
          />
        );

      case 'add_user':
        return (
          <AddUserCaseScreen
            onCancel={() => handleNavigate('home')}
            onCaseCreated={(newCase) => handleNavigate('view_case', newCase)}
          />
        );

      case 'appointments':
        return (
          <CounsellorAppointmentsScreen
            onBack={() => handleNavigate('home')}
          />
        );

      case 'alerts':
        return (
          <CounsellorAlertsScreen
            onSelectCase={(caseObj) => handleNavigate('view_case', caseObj)}
            onBack={() => handleNavigate('home')}
          />
        );

      case 'profile':
        return (
          <CounsellorProfileScreen
            profile={profile}
            user={user}
            onLogoutSuccess={onLogoutSuccess}
            onBack={() => handleNavigate('home')}
          />
        );

      case 'view_case':
        return (
          <UserCaseDetailScreen
            caseData={selectedCase}
            onBack={() => handleNavigate('cases')}
            onCaseUpdated={() => {
              // Trigger reload if needed
            }}
          />
        );

      default:
        return (
          <CounsellorHomeScreen
            profile={profile}
            user={user}
            onLogoutSuccess={onLogoutSuccess}
            onNavigate={handleNavigate}
          />
        );
    }
  };

  // Hide bottom bar when in victim registration wizard or detailed case view for maximum screen area
  const hideBottomBar = currentTab === 'add_user' || currentTab === 'view_case';

  return (
    <View style={styles.container}>
      <View style={styles.contentArea}>{renderActiveScreen()}</View>

      {!hideBottomBar && (
        <SafeAreaView edges={['bottom']} style={styles.tabBarSafeArea}>
          <View style={styles.tabBar}>
            {BOTTOM_TABS.map((tab) => {
              const isSelected = currentTab === tab.id;
              const iconName = isSelected ? tab.icon.replace('-outline', '') : tab.icon;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={styles.tabItem}
                  onPress={() => handleNavigate(tab.id)}
                  activeOpacity={0.7}
                  accessibilityRole="tab"
                  accessibilityLabel={tab.label}
                  accessibilityState={{ selected: isSelected }}
                >
                  <Icon
                    name={iconName}
                    size={20}
                    color={isSelected ? COLORS.primary : COLORS.textSubtle}
                  />
                  <Text
                    style={[styles.tabLabel, isSelected && styles.tabLabelActive]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentArea: {
    flex: 1,
  },
  tabBarSafeArea: {
    backgroundColor: COLORS.cardBackground,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  tabBar: {
    flexDirection: 'row',
    height: 56,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: SPACING.xs,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.textSubtle,
    marginTop: 3,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});
