import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { I18nProvider } from './src/shared/i18n';

export default function App() {
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <AppNavigator />
      </I18nProvider>
    </SafeAreaProvider>
  );
}
