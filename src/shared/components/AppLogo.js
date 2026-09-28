import React from 'react';
import { StyleSheet, View, Image } from 'react-native';

export default function AppLogo({ size = 80, style }) {
  const getDimension = () => {
    if (typeof size === 'number') return { width: size, height: size };
    switch (size) {
      case 'small':
        return { width: 40, height: 40 };
      case 'medium':
        return { width: 72, height: 72 };
      case 'large':
        return { width: 100, height: 100 };
      default:
        return { width: 80, height: 80 };
    }
  };

  const dim = getDimension();

  return (
    <View style={[styles.container, style]}>
      <Image
        source={require('../../../assets/splash-icon.png')}
        style={[dim, styles.image]}
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
  image: {
    maxWidth: '100%',
    maxHeight: '100%',
  },
});
