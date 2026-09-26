import React from 'react';
import { StyleSheet, View, Image } from 'react-native';

export default function ArohaLogo({ size = 80, style }) {
  return (
    <View style={[styles.container, style]}>
      <Image
        source={require('../../../assets/icon.png')}
        style={{ width: size, height: size }}
        resizeMode="contain"
        accessibilityLabel="ArohaAI Logo"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
