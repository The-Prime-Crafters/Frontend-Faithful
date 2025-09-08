import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const PRIMARY_COLOR = '#7b4d62';
const SECONDARY_COLOR = '#ce703f';
const WHITE = '#FFFFFF';
const OFF_WHITE = '#f8f9fa';
const SOFT_GRAY = '#e9ecef';
const DARK_GRAY = '#495057';
const BLACK = '#000000';
const LIGHT_PURPLE = '#e3d5ca';
const LIGHT_ORANGE = '#f4e4d6';

const STATUS_BAR_OFFSET = Platform.OS === 'android'
  ? (StatusBar.currentHeight ?? 24) + 10
  : 10;

const profileStats = [
  { label: 'Days Streak', value: '7', icon: 'flame' },
  { label: 'Verses Read', value: '156', icon: 'book' },
  { label: 'Prayers Said', value: '89', icon: 'heart' },
  { label: 'Study Hours', value: '24', icon: 'time' },
];

const menuItems = [
  { id: '1', title: 'Account Settings', icon: 'settings', description: 'Manage your account' },
  { id: '2', title: 'Reading History', icon: 'time', description: 'View your reading progress' },
  { id: '3', title: 'Prayer Journal', icon: 'journal', description: 'Your prayer notes' },
  { id: '4', title: 'Study Plans', icon: 'calendar', description: 'Manage study schedules' },
  { id: '5', title: 'Notifications', icon: 'notifications', description: 'App notifications' },
  { id: '6', title: 'Help & Support', icon: 'help-circle', description: 'Get help' },
];

export default function ProfileScreen() {
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userDataString = await SecureStore.getItemAsync('userData');
      if (userDataString) {
        const user = JSON.parse(userDataString);
        setUserData(user);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? You will need to sign in again to access your account.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear all authentication data
              await SecureStore.deleteItemAsync('authToken');
              await SecureStore.deleteItemAsync('userData');
              await SecureStore.deleteItemAsync('userUsageData');
              
              // Log the logout action
              console.log('🔐 User signed out successfully');
              console.log('🗑️ Auth token cleared');
              console.log('🗑️ User data cleared');
              console.log('🗑️ Usage data cleared');
              
              // Clear local state
              setUserData(null);
              
              // Redirect to onboarding screen
              router.replace('/(main)/onboarding');
              
            } catch (error) {
              console.error('❌ Error during sign out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
              <ScrollView 
          style={styles.container} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity>
            <Ionicons name="settings" size={30} color={WHITE} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <LinearGradient
          colors={[PRIMARY_COLOR, SECONDARY_COLOR]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileCard}
        >
          <View style={styles.profileImage}>
            {userData?.picture ? (
              <Image 
                source={{ uri: userData.picture }} 
                style={styles.profileImageInner}
                resizeMode="cover"
              />
            ) : (
              <Ionicons name="person" size={40} color={PRIMARY_COLOR} />
            )}
          </View>
          <Text style={styles.profileName}>
            {userData?.name || 'User'}
          </Text>
          <Text style={styles.profileEmail}>
            {userData?.email || 'user@example.com'}
          </Text>
          <Text style={styles.memberSince}>
            Member since {userData?.signUpDate ? 
              new Date(userData.signUpDate).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long' 
              }) : 
              new Date().getFullYear()
            }
          </Text>
        </LinearGradient>

        {/* Stats Grid */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.statsGrid}>
            {profileStats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <Ionicons name={stat.icon as any} size={24} color={PRIMARY_COLOR} />
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          {menuItems.map((item) => (
            <TouchableOpacity key={item.id} style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <Ionicons name={item.icon as any} size={24} color={WHITE} />
                <View style={styles.menuItemText}>
                  <Text style={styles.menuItemTitle}>{item.title}</Text>
                  <Text style={styles.menuItemDescription}>{item.description}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={20} color={WHITE} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: OFF_WHITE,
  },
  container: {
    flex: 1,
    backgroundColor: OFF_WHITE,
    paddingHorizontal: 20,
    paddingTop: STATUS_BAR_OFFSET,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    color: DARK_GRAY,
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'serif',
  },
  profileCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: SOFT_GRAY,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileImageInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileName: {
    color: WHITE,
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'serif',
    marginBottom: 4,
  },
  profileEmail: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontFamily: 'serif',
    marginBottom: 8,
  },
  memberSince: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontFamily: 'serif',
  },
  statsSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: DARK_GRAY,
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'serif',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: LIGHT_PURPLE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d4c4b7',
  },
  statValue: {
    color: DARK_GRAY,
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'serif',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    color: '#6c757d',
    fontSize: 14,
    fontFamily: 'serif',
  },
  menuSection: {
    marginBottom: 30,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LIGHT_PURPLE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#d4c4b7',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    marginLeft: 16,
    flex: 1,
  },
  menuItemTitle: {
    color: DARK_GRAY,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'serif',
    marginBottom: 2,
  },
  menuItemDescription: {
    color: '#6c757d',
    fontSize: 14,
    fontFamily: 'serif',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc3545', // Red background for sign out
    borderRadius: 12,
    padding: 16,
    marginBottom: 100, // Increased margin to clear tab bar
    borderWidth: 1,
    borderColor: '#c82333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'serif',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: OFF_WHITE,
  },
  loadingText: {
    color: DARK_GRAY,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'serif',
  },
}); 