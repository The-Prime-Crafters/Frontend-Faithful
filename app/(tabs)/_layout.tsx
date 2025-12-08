import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';

export default function TabLayout() {
  const { width, height } = Dimensions.get('window');
  const insets = useSafeAreaInsets();
  
  // Detect if tablet based on screen size
  const isTablet = width >= 768;
  
  // Calculate responsive tab bar height based on screen size
  const getTabBarHeight = () => {
    // Add extra padding for tablets to avoid gesture conflicts
    const tabletOffset = isTablet ? 20 : 0;
    
    const baseHeight = Platform.OS === 'ios' ? 90 : 70;
    const paddingBottom = Platform.OS === 'ios' ? 20 : 10;
    
    // For smaller screens, reduce height slightly
    if (width < 375) {
      return baseHeight - 10 + tabletOffset;
    }
    return baseHeight + tabletOffset;
  };

  // Calculate responsive icon size based on screen size
  const getIconSize = () => {
    if (width < 375) {
      return 20; // Smaller icons for smaller screens
    } else if (width < 414) {
      return 22; // Medium icons for medium screens
    }
    return 24; // Default size for larger screens
  };

  const iconSize = getIconSize();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#7b4d62',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.5)',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: {
          backgroundColor: '#000000',
          borderTopColor: 'rgba(255,255,255,0.15)',
          borderTopWidth: 1,
          height: getTabBarHeight(),
          paddingBottom: Platform.OS === 'ios' 
            ? Math.max(20, insets.bottom) + (isTablet ? 10 : 0)
            : Math.max(15, insets.bottom + 10) + (isTablet ? 10 : 0), // Add extra 10px for Android
          paddingHorizontal: width < 375 ? 8 : 16,
          marginBottom: isTablet ? 10 : 0,
          paddingTop: isTablet ? 12 : 8,
          position: 'absolute', // Ensure it stays above navigation
          bottom: 0,
          left: 0,
          right: 0,
        },
        // Increase hit slop for tablet to make taps more reliable above gesture area
        tabBarItemStyle: isTablet ? {
          paddingVertical: 8,
          marginVertical: 4,
        } : undefined,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'home' : 'home-outline'} 
              size={iconSize} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="reading"
        options={{
          title: 'Study',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'book' : 'book-outline'} 
              size={iconSize} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="prayer"
        options={{
          title: 'Prayer',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'hand-left' : 'hand-left-outline'} 
              size={iconSize} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'chatbubbles' : 'chatbubbles-outline'} 
              size={iconSize} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'person-circle' : 'person-circle-outline'} 
              size={iconSize} 
              color={color} 
            />
          ),
        }}
      />
    </Tabs>
  );
}
