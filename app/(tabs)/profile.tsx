import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
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
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
            <Ionicons name="person" size={40} color={PRIMARY_COLOR} />
          </View>
          <Text style={styles.profileName}>John Doe</Text>
          <Text style={styles.profileEmail}>john.doe@example.com</Text>
          <Text style={styles.memberSince}>Member since January 2024</Text>
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
        <TouchableOpacity style={styles.logoutButton}>
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
    marginBottom: 16,
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
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  logoutText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'serif',
    marginLeft: 8,
  },
}); 