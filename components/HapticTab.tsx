import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import { Dimensions } from 'react-native';

export function HapticTab(props: BottomTabBarButtonProps) {
  const { width } = Dimensions.get('window');
  
  // Detect if tablet
  const isTablet = width >= 768;
  
  // Adjust touch area based on screen size
  const getTouchAreaStyle = () => {
    if (isTablet) {
      return {
        minHeight: 56, // Larger touch target for tablets
        paddingHorizontal: 12,
        paddingVertical: 8, // Extra vertical padding to lift above gesture area
      };
    } else if (width < 375) {
      return {
        minHeight: 44, // Minimum touch target
        paddingHorizontal: 4, // Reduce padding for smaller screens
      };
    }
    return {
      minHeight: 48,
      paddingHorizontal: 8,
    };
  };

  // Increase hitSlop for tablets to avoid gesture conflicts
  const getHitSlop = () => {
    if (isTablet) {
      return {
        top: 15,
        bottom: 15,
        left: 10,
        right: 10,
      };
    }
    return {
      top: 8,
      bottom: 8,
      left: 8,
      right: 8,
    };
  };

  return (
    <PlatformPressable
      {...props}
      hitSlop={getHitSlop()}
      style={[
        props.style,
        getTouchAreaStyle(),
      ]}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === 'ios') {
          // Add a soft haptic feedback when pressing down on the tabs.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}
