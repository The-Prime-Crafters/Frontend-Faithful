import { API_ENDPOINTS } from '@/constants/API';
import { useLoading } from '@/contexts/LoadingContext';
import NotificationService from '@/utils/notifications';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
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

const STATUS_BAR_OFFSET = Platform.OS === 'android'
  ? (StatusBar.currentHeight ?? 24) + 10
  : 10;

interface NotificationSettings {
  pushEnabled: boolean;
  journeyReminders: boolean;
  prayerUpdates: boolean;
  dailyVerse: boolean;
  dailyPrayer: boolean;
  dailyReflection: boolean;
}

export default function NotificationSettings() {
  const router = useRouter();
  const { showLoading, hideLoading } = useLoading();

  const [settings, setSettings] = useState<NotificationSettings>({
    pushEnabled: true,
    journeyReminders: true,
    prayerUpdates: true,
    dailyVerse: false,
    dailyPrayer: false,
    dailyReflection: false,
  });

  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      // Load from local storage first (fast)
      const localSettings = await SecureStore.getItemAsync('notificationSettings');
      if (localSettings) {
        const parsed = JSON.parse(localSettings);
        setSettings(parsed);
        console.log('✅ Loaded notification settings from local storage:', parsed);
      }

      // Optional: Also try to load from backend (for cross-device sync)
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) return;

      const response = await fetch(API_ENDPOINTS.USERS_PREFERENCES, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        const userData = result.user || result.data || result;

        if (userData.notificationSettings) {
          setSettings({
            ...settings,
            ...userData.notificationSettings
          });
          // Update local storage with backend data
          await SecureStore.setItemAsync('notificationSettings', JSON.stringify(userData.notificationSettings));
        }
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const handleToggle = async (key: keyof NotificationSettings) => {
    const newValue = !settings[key];

    // Optimistically update UI
    setSettings(prev => ({ ...prev, [key]: newValue }));

    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        Alert.alert('Error', 'Please sign in again');
        // Revert the change
        setSettings(prev => ({ ...prev, [key]: !newValue }));
        return;
      }

      // Handle local scheduled notifications
      if (key === 'dailyVerse') {
        if (newValue) {
          await NotificationService.scheduleDailyVerseNotification(8, 0); // 8:00 AM
        } else {
          await NotificationService.cancelDailyNotification('daily_verse');
        }
      } else if (key === 'dailyPrayer') {
        if (newValue) {
          await NotificationService.scheduleDailyPrayerNotification(12, 0); // 12:00 PM
        } else {
          await NotificationService.cancelDailyNotification('daily_prayer');
        }
      } else if (key === 'dailyReflection') {
        if (newValue) {
          await NotificationService.scheduleDailyReflectionNotification(20, 0); // 8:00 PM
        } else {
          await NotificationService.cancelDailyNotification('daily_reflection');
        }
      }

      // Update local state
      const newSettings = { ...settings, [key]: newValue };

      // Save to local storage (MOST IMPORTANT - this persists the toggle state)
      await SecureStore.setItemAsync('notificationSettings', JSON.stringify(newSettings));
      console.log(`✅ Notification setting saved locally: ${key} = ${newValue}`);

      // Save to backend (optional - backend may not support this yet)
      try {
        const response = await fetch(API_ENDPOINTS.USERS_PREFERENCES, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            notificationSettings: newSettings
          }),
        });

        if (response.ok) {
          console.log(`✅ Notification setting saved to backend: ${key} = ${newValue}`);
        } else {
          // Backend doesn't support this yet, but notification still works locally
          console.log(`⚠️ Backend doesn't support notification settings yet, but local notification is scheduled`);
        }
      } catch (backendError) {
        // Backend error is non-critical since notifications are scheduled locally
        console.log(`⚠️ Could not save to backend, but local notification is scheduled`);
      }

      // If enabling push notifications for the first time, request permissions
      if (key === 'pushEnabled' && newValue) {
        const pushToken = await NotificationService.registerForPushNotifications();
        if (!pushToken) {
          Alert.alert(
            'Permission Required',
            'Please enable notifications in your device settings to receive updates.',
            [{ text: 'OK' }]
          );
        } else {
          // Send push token to backend
          await savePushTokenToBackend(pushToken);
        }
      }

    } catch (error) {
      console.error('Error saving notification setting:', error);
      // Revert the change
      setSettings(prev => ({ ...prev, [key]: !newValue }));
      Alert.alert('Error', 'Failed to save notification settings');
    }
  };

  const savePushTokenToBackend = async (pushToken: string) => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) return;

      const response = await fetch(API_ENDPOINTS.USERS_PREFERENCES, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pushToken
        }),
      });

      if (response.ok) {
        console.log('✅ Push token saved to backend:', pushToken);
      }
    } catch (error) {
      console.error('❌ Error saving push token:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* Header with Back Button */}
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <View style={styles.backIconContainer}>
              <Ionicons
                name="arrow-back"
                size={24}
                color={PRIMARY_COLOR}
              />
            </View>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.headerTitle}>Notification Settings</Text>
            <Text style={styles.headerSubtitle}>
              Manage your notification preferences
            </Text>
          </View>
        </View>

        {/* Master Toggle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Push Notifications</Text>

          <View style={styles.settingCard}>
            <View style={styles.settingIconContainer}>
              <Ionicons name="notifications" size={24} color={PRIMARY_COLOR} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Enable Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive updates and reminders from Faithful Companion
              </Text>
            </View>
            <Switch
              value={settings.pushEnabled}
              onValueChange={() => handleToggle('pushEnabled')}
              trackColor={{ false: SOFT_GRAY, true: PRIMARY_COLOR }}
              thumbColor={WHITE}
            />
          </View>
        </View>

        {/* Active Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Notifications</Text>
          <Text style={styles.sectionDescription}>
            These notifications are currently enabled and working
          </Text>

          <View style={styles.settingCard}>
            <View style={styles.settingIconContainer}>
              <Ionicons name="book" size={24} color={PRIMARY_COLOR} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Daily Verse</Text>
              <Text style={styles.settingDescription}>
                Daily scripture inspiration
              </Text>
            </View>
            <Switch
              value={settings.dailyVerse}
              onValueChange={() => handleToggle('dailyVerse')}
              trackColor={{ false: SOFT_GRAY, true: PRIMARY_COLOR }}
              thumbColor={WHITE}
              disabled={!settings.pushEnabled}
            />
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingIconContainer}>
              <Ionicons name="heart" size={24} color={PRIMARY_COLOR} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Daily Prayer</Text>
              <Text style={styles.settingDescription}>
                Prayer reminders and prompts
              </Text>
            </View>
            <Switch
              value={settings.dailyPrayer}
              onValueChange={() => handleToggle('dailyPrayer')}
              trackColor={{ false: SOFT_GRAY, true: PRIMARY_COLOR }}
              thumbColor={WHITE}
              disabled={!settings.pushEnabled}
            />
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingIconContainer}>
              <Ionicons name="bulb" size={24} color={PRIMARY_COLOR} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Daily Reflection</Text>
              <Text style={styles.settingDescription}>
                Thoughtful spiritual reflections
              </Text>
            </View>
            <Switch
              value={settings.dailyReflection}
              onValueChange={() => handleToggle('dailyReflection')}
              trackColor={{ false: SOFT_GRAY, true: PRIMARY_COLOR }}
              thumbColor={WHITE}
              disabled={!settings.pushEnabled}
            />
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingIconContainer}>
              <Ionicons name="calendar" size={24} color={PRIMARY_COLOR} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Journey Reminders</Text>
              <Text style={styles.settingDescription}>
                7-day journey progress updates
              </Text>
            </View>
            <Switch
              value={settings.journeyReminders}
              onValueChange={() => handleToggle('journeyReminders')}
              trackColor={{ false: SOFT_GRAY, true: PRIMARY_COLOR }}
              thumbColor={WHITE}
              disabled={!settings.pushEnabled}
            />
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingIconContainer}>
              <Ionicons name="people" size={24} color={PRIMARY_COLOR} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Prayer Updates</Text>
              <Text style={styles.settingDescription}>
                Get notified when someone responds to your prayers
              </Text>
            </View>
            <Switch
              value={settings.prayerUpdates}
              onValueChange={() => handleToggle('prayerUpdates')}
              trackColor={{ false: SOFT_GRAY, true: PRIMARY_COLOR }}
              thumbColor={WHITE}
              disabled={!settings.pushEnabled}
            />
          </View>
        </View>

        {/* Info Text */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={DARK_GRAY} />
          <Text style={styles.infoText}>
            You can change these settings anytime. Notifications help you stay connected with your spiritual journey.
          </Text>
        </View>

        <View style={{ height: 40 }} />
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
  },
  headerContainer: {
    marginTop: STATUS_BAR_OFFSET,
    marginBottom: 20,
  },
  backButton: {
    marginBottom: 20,
  },
  backIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: SOFT_GRAY,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    marginTop: 10,
  },
  headerTitle: {
    color: DARK_GRAY,
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'serif',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: '#6c757d',
    fontSize: 16,
    fontFamily: 'serif',
    opacity: 0.8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
    fontFamily: 'serif',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 13,
    color: '#6c757d',
    fontFamily: 'serif',
    marginBottom: 12,
    lineHeight: 18,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: OFF_WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: DARK_GRAY,
    fontFamily: 'serif',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#6c757d',
    fontFamily: 'serif',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#e7f3ff',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: DARK_GRAY,
    fontFamily: 'serif',
    marginLeft: 12,
    lineHeight: 18,
  },
});

