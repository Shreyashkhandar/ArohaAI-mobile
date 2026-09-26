import React, { useRef } from 'react';
import {
  StyleSheet,
  Text,
  Animated,
  Pressable,
} from 'react-native';
import { COLORS } from '../theme/theme';

export default function RoleCard({
  title,
  onPress,
  accessibilityLabel,
  accessibilityHint,
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, styles.cardWrapper]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || title}
        accessibilityHint={accessibilityHint}
        style={({ pressed }) => [
          styles.cardContainer,
          pressed && styles.cardPressed,
        ]}
      >
        <Text style={styles.titleText}>{title}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    width: '100%',
    marginBottom: 16,
  },
  cardContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    minHeight: 76,
  },
  cardPressed: {
    backgroundColor: COLORS.selectedCardBg,
    borderColor: COLORS.selectedBorder,
    opacity: 0.95,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    letterSpacing: 0.3,
  },
});
