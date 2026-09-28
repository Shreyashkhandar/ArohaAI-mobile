import React from 'react';
import { View, StyleSheet } from 'react-native';

/**
 * Pure React Native zero-dependency Icon component.
 * Renders vector geometric icons cleanly across Android, iOS, and Web without emojis or external dependencies.
 */
export default function Icon({ name, size = 20, color = '#5B7C8D', style }) {
  const half = size / 2;

  switch (name) {
    case 'home':
    case 'home-outline':
    case 'grid':
    case 'grid-outline':
      return (
        <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: size * 0.8, height: size * 0.8, gap: 2, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ width: size * 0.35 - 1, height: size * 0.35 - 1, backgroundColor: color, borderRadius: 2 }} />
            <View style={{ width: size * 0.35 - 1, height: size * 0.35 - 1, backgroundColor: color, borderRadius: 2 }} />
            <View style={{ width: size * 0.35 - 1, height: size * 0.35 - 1, backgroundColor: color, borderRadius: 2 }} />
            <View style={{ width: size * 0.35 - 1, height: size * 0.35 - 1, backgroundColor: color, borderRadius: 2 }} />
          </View>
        </View>
      );

    case 'folder':
    case 'folder-open':
    case 'folder-open-outline':
    case 'folder-outline':
      return (
        <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: size * 0.85,
              height: size * 0.65,
              borderRadius: 3,
              borderWidth: 1.5,
              borderColor: color,
              backgroundColor: name.includes('outline') ? 'transparent' : color,
              marginTop: 2,
            }}
          >
            <View
              style={{
                position: 'absolute',
                top: -4,
                left: 0,
                width: size * 0.4,
                height: 4,
                backgroundColor: color,
                borderTopLeftRadius: 2,
                borderTopRightRadius: 2,
              }}
            />
          </View>
        </View>
      );

    case 'person-add':
    case 'person-add-outline':
      return (
        <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: size * 0.32,
              height: size * 0.32,
              borderRadius: (size * 0.32) / 2,
              borderWidth: 1.5,
              borderColor: color,
              marginBottom: 1,
            }}
          />
          <View
            style={{
              width: size * 0.6,
              height: size * 0.3,
              borderTopLeftRadius: size * 0.3,
              borderTopRightRadius: size * 0.3,
              borderWidth: 1.5,
              borderColor: color,
            }}
          />
          <View style={{ position: 'absolute', right: 0, top: 2, width: 2, height: 8, backgroundColor: color }} />
          <View style={{ position: 'absolute', right: -3, top: 5, width: 8, height: 2, backgroundColor: color }} />
        </View>
      );

    case 'calendar':
    case 'calendar-outline':
    case 'calendar-sharp':
      return (
        <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: size * 0.8,
              height: size * 0.75,
              borderRadius: 3,
              borderWidth: 1.5,
              borderColor: color,
              backgroundColor: name.includes('outline') ? 'transparent' : color,
            }}
          >
            <View style={{ height: size * 0.2, backgroundColor: color, width: '100%' }} />
          </View>
        </View>
      );

    case 'notifications':
    case 'notifications-outline':
    case 'bell':
      return (
        <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: size * 0.6,
              height: size * 0.6,
              borderTopLeftRadius: size * 0.3,
              borderTopRightRadius: size * 0.3,
              borderWidth: 1.5,
              borderColor: color,
              backgroundColor: name.includes('outline') ? 'transparent' : color,
            }}
          />
          <View style={{ width: size * 0.8, height: 2, backgroundColor: color, borderRadius: 1 }} />
          <View style={{ width: size * 0.25, height: 2, backgroundColor: color, marginTop: 1, borderRadius: 1 }} />
        </View>
      );

    case 'checkin':
    case 'document-text':
    case 'document-text-outline':
    case 'clipboard':
    case 'clipboard-outline':
    case 'list-outline':
      return (
        <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: size * 0.7,
              height: size * 0.85,
              borderRadius: 3,
              borderWidth: 1.5,
              borderColor: color,
              backgroundColor: name.includes('outline') ? 'transparent' : color,
              padding: 2,
              justifyContent: 'space-around',
            }}
          >
            <View style={{ height: 1.5, width: '70%', backgroundColor: name.includes('outline') ? color : '#FFFFFF' }} />
            <View style={{ height: 1.5, width: '85%', backgroundColor: name.includes('outline') ? color : '#FFFFFF' }} />
            <View style={{ height: 1.5, width: '50%', backgroundColor: name.includes('outline') ? color : '#FFFFFF' }} />
          </View>
        </View>
      );

    case 'person':
    case 'person-outline':
    case 'profile':
      return (
        <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: size * 0.38,
              height: size * 0.38,
              borderRadius: (size * 0.38) / 2,
              borderWidth: 1.5,
              borderColor: color,
              backgroundColor: name.includes('outline') ? 'transparent' : color,
              marginBottom: 1,
            }}
          />
          <View
            style={{
              width: size * 0.75,
              height: size * 0.35,
              borderTopLeftRadius: size * 0.35,
              borderTopRightRadius: size * 0.35,
              borderWidth: 1.5,
              borderColor: color,
              backgroundColor: name.includes('outline') ? 'transparent' : color,
            }}
          />
        </View>
      );

    case 'checkmark':
    case 'checkmark-circle':
    case 'checkmark-circle-outline':
    case 'shield-checkmark':
      return (
        <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: color,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: size * 0.45,
                height: size * 0.25,
                borderColor: '#FFFFFF',
                borderLeftWidth: 2,
                borderBottomWidth: 2,
                transform: [{ rotate: '-45deg' }],
                marginBottom: 2,
              }}
            />
          </View>
        </View>
      );

    case 'alert-circle':
    case 'alert-circle-outline':
    case 'warning':
      return (
        <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: size * 0.85,
              height: size * 0.85,
              borderRadius: (size * 0.85) / 2,
              borderWidth: 1.5,
              borderColor: color,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View style={{ width: 2, height: size * 0.35, backgroundColor: color, borderRadius: 1 }} />
            <View style={{ width: 2.5, height: 2.5, borderRadius: 1.25, backgroundColor: color, marginTop: 2 }} />
          </View>
        </View>
      );

    case 'time':
    case 'time-outline':
    case 'clock':
    case 'history':
      return (
        <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: size * 0.85,
              height: size * 0.85,
              borderRadius: (size * 0.85) / 2,
              borderWidth: 1.5,
              borderColor: color,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View style={{ position: 'absolute', top: size * 0.18, width: 1.5, height: size * 0.25, backgroundColor: color }} />
            <View style={{ position: 'absolute', right: size * 0.18, width: size * 0.22, height: 1.5, backgroundColor: color }} />
          </View>
        </View>
      );

    case 'chevron-left':
    case 'arrow-back':
      return (
        <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: size * 0.35,
              height: size * 0.35,
              borderLeftWidth: 2,
              borderBottomWidth: 2,
              borderColor: color,
              transform: [{ rotate: '45deg' }],
            }}
          />
        </View>
      );

    case 'chevron-right':
    case 'chevron-forward':
    case 'arrow-forward':
      return (
        <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: size * 0.35,
              height: size * 0.35,
              borderRightWidth: 2,
              borderTopWidth: 2,
              borderColor: color,
              transform: [{ rotate: '45deg' }],
            }}
          />
        </View>
      );

    case 'dot':
    case 'separator':
      return (
        <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: size * 0.3,
              height: size * 0.3,
              borderRadius: (size * 0.3) / 2,
              backgroundColor: color,
            }}
          />
        </View>
      );

    case 'search':
      return (
        <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: size * 0.55,
              height: size * 0.55,
              borderRadius: (size * 0.55) / 2,
              borderWidth: 1.5,
              borderColor: color,
            }}
          />
          <View
            style={{
              position: 'absolute',
              bottom: size * 0.1,
              right: size * 0.1,
              width: size * 0.3,
              height: 1.5,
              backgroundColor: color,
              transform: [{ rotate: '45deg' }],
            }}
          />
        </View>
      );

    case 'leaf':
    case 'leaf-outline':
      return (
        <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: size * 0.7,
              height: size * 0.7,
              borderTopLeftRadius: size * 0.7,
              borderBottomRightRadius: size * 0.7,
              borderWidth: 1.5,
              borderColor: color,
              backgroundColor: name.includes('outline') ? 'transparent' : color,
            }}
          />
        </View>
      );

    case 'mail':
    case 'mail-outline':
      return (
        <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: size * 0.8,
              height: size * 0.55,
              borderRadius: 2,
              borderWidth: 1.5,
              borderColor: color,
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: size * 0.4,
                height: size * 0.4,
                borderLeftWidth: 1.5,
                borderBottomWidth: 1.5,
                borderColor: color,
                transform: [{ rotate: '-45deg' }],
                marginTop: -size * 0.22,
              }}
            />
          </View>
        </View>
      );

    case 'call':
    case 'call-outline':
      return (
        <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: size * 0.65,
              height: size * 0.65,
              borderRadius: size * 0.25,
              borderWidth: 1.5,
              borderColor: color,
              transform: [{ rotate: '45deg' }],
            }}
          />
        </View>
      );

    case 'shield':
    case 'shield-outline':
    case 'shield-checkmark-outline':
      return (
        <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: size * 0.65,
              height: size * 0.75,
              borderTopLeftRadius: size * 0.3,
              borderTopRightRadius: size * 0.3,
              borderBottomLeftRadius: size * 0.35,
              borderBottomRightRadius: size * 0.35,
              borderWidth: 1.5,
              borderColor: color,
            }}
          />
        </View>
      );

    case 'log-out':
    case 'log-out-outline':
      return (
        <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: size * 0.5,
              height: size * 0.7,
              borderLeftWidth: 1.5,
              borderTopWidth: 1.5,
              borderBottomWidth: 1.5,
              borderColor: color,
              borderRadius: 2,
            }}
          />
          <View
            style={{
              position: 'absolute',
              right: 2,
              width: size * 0.4,
              height: 1.5,
              backgroundColor: color,
            }}
          />
        </View>
      );

    case 'settings':
    case 'settings-outline':
    case 'options':
      return (
        <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: size * 0.5,
              height: size * 0.5,
              borderRadius: (size * 0.5) / 2,
              borderWidth: 1.5,
              borderColor: color,
              backgroundColor: name.includes('outline') ? 'transparent' : color,
            }}
          />
        </View>
      );

    default:
      return (
        <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: size * 0.4,
              height: size * 0.4,
              borderRadius: (size * 0.4) / 2,
              backgroundColor: color,
            }}
          />
        </View>
      );
  }
}
