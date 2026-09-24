import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import * as SplashScreenModule from 'expo-splash-screen';
import ArohaLogo from '../components/ArohaLogo';
import { COLORS } from '../constants/colors';

// Prevent native splash screen from autohiding until ready
SplashScreenModule.preventAutoHideAsync().catch(() => {});

export default function SplashScreen({ onFinish }) {
  useEffect(() => {
    let timer;
    async function prepare() {
      try {
        await SplashScreenModule.hideAsync();
      } catch (e) {
        // Ignore if already hidden
      } finally {
        timer = setTimeout(() => {
          if (onFinish) onFinish();
        }, 1200);
      }
    }
    prepare();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [onFinish]);

  return (
    <View style={styles.container}>
      <ArohaLogo size={100} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
