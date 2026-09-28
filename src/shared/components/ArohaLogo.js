import React from 'react';
import { StyleSheet } from 'react-native';
import AppLogo from './AppLogo';

export default function ArohaLogo({ size = 80, style }) {
  return <AppLogo size={size} style={style} />;
}


const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
