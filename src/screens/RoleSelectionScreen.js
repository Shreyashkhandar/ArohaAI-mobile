import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '../constants/colors';
import ArohaLogo from '../components/ArohaLogo';
import RoleCard from '../components/RoleCard';

export default function RoleSelectionScreen({ onSelectRole }) {
  const handleSelectUser = () => {
    if (onSelectRole) {
      onSelectRole('USER');
    }
  };

  const handleSelectCounsellor = () => {
    if (onSelectRole) {
      onSelectRole('COUNSELLOR');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        {/* Top/Center Logo */}
        <View style={styles.logoSection}>
          <ArohaLogo size={88} />
        </View>

        {/* Heading */}
        <View style={styles.headingSection}>
          <Text style={styles.headingText}>Welcome</Text>
        </View>

        {/* Role Cards */}
        <View style={styles.cardsSection}>
          <RoleCard
            title="User"
            onPress={handleSelectUser}
            accessibilityLabel="User"
            accessibilityHint="Navigates to User login screen"
          />

          <RoleCard
            title="Counsellor"
            onPress={handleSelectCounsellor}
            accessibilityLabel="Counsellor"
            accessibilityHint="Navigates to Counsellor login screen"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight || 0 : 0,
  },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  headingSection: {
    marginBottom: 48,
    alignItems: 'center',
  },
  headingText: {
    fontSize: 28,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  cardsSection: {
    width: '100%',
    alignItems: 'center',
  },
});
