import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  /**
   * Request notification permissions and get push token
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        return null;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return null;
      }

      // Get push token
      // Note: For production, get projectId from app.json extra.eas.projectId
      const token = await Notifications.getExpoPushTokenAsync();

      // Android specific channel setup
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#7b4d62',
        });

        // Create separate channels for different notification types
        await Notifications.setNotificationChannelAsync('daily-content', {
          name: 'Daily Content',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#7b4d62',
          description: 'Daily verse, prayer, and reflection notifications',
        });

        await Notifications.setNotificationChannelAsync('reminders', {
          name: 'Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#ce703f',
          description: 'Journey and activity reminders',
        });
      }

      return token.data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Schedule daily verse notification
   */
  async scheduleDailyVerseNotification(hour: number = 8, minute: number = 0): Promise<void> {
    try {
      // Cancel any existing daily verse notifications
      const existingNotifications = await Notifications.getAllScheduledNotificationsAsync();
      for (const notification of existingNotifications) {
        if (notification.content.data?.type === 'daily_verse') {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }

      // Schedule daily notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📖 Daily Verse',
          body: "Today's scripture is ready! Start your day with God's Word.",
          data: { type: 'daily_verse' },
          sound: true,
          ...(Platform.OS === 'android' && { channelId: 'daily-content' }),
        },
        trigger: {
          hour,
          minute,
          repeats: true,
        },
      });

      console.log(`✅ Daily verse notification scheduled for ${hour}:${minute.toString().padStart(2, '0')}`);
    } catch (error) {
      console.error('❌ Error scheduling daily verse notification:', error);
    }
  }

  /**
   * Schedule daily prayer notification
   */
  async scheduleDailyPrayerNotification(hour: number = 12, minute: number = 0): Promise<void> {
    try {
      // Cancel any existing daily prayer notifications
      const existingNotifications = await Notifications.getAllScheduledNotificationsAsync();
      for (const notification of existingNotifications) {
        if (notification.content.data?.type === 'daily_prayer') {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }

      // Schedule daily notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🙏 Daily Prayer',
          body: 'Take a moment to pray and connect with God.',
          data: { type: 'daily_prayer' },
          sound: true,
          ...(Platform.OS === 'android' && { channelId: 'daily-content' }),
        },
        trigger: {
          hour,
          minute,
          repeats: true,
        },
      });

      console.log(`✅ Daily prayer notification scheduled for ${hour}:${minute.toString().padStart(2, '0')}`);
    } catch (error) {
      console.error('❌ Error scheduling daily prayer notification:', error);
    }
  }

  /**
   * Schedule daily reflection notification
   */
  async scheduleDailyReflectionNotification(hour: number = 20, minute: number = 0): Promise<void> {
    try {
      // Cancel any existing daily reflection notifications
      const existingNotifications = await Notifications.getAllScheduledNotificationsAsync();
      for (const notification of existingNotifications) {
        if (notification.content.data?.type === 'daily_reflection') {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }

      // Schedule daily notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💭 Daily Reflection',
          body: 'Reflect on your day and grow in faith.',
          data: { type: 'daily_reflection' },
          sound: true,
          ...(Platform.OS === 'android' && { channelId: 'daily-content' }),
        },
        trigger: {
          hour,
          minute,
          repeats: true,
        },
      });

      console.log(`✅ Daily reflection notification scheduled for ${hour}:${minute.toString().padStart(2, '0')}`);
    } catch (error) {
      console.error('❌ Error scheduling daily reflection notification:', error);
    }
  }

  /**
   * Cancel a specific type of daily notification
   */
  async cancelDailyNotification(type: 'daily_verse' | 'daily_prayer' | 'daily_reflection'): Promise<void> {
    try {
      const existingNotifications = await Notifications.getAllScheduledNotificationsAsync();
      for (const notification of existingNotifications) {
        if (notification.content.data?.type === type) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
          console.log(`✅ Cancelled ${type} notifications`);
        }
      }
    } catch (error) {
      console.error(`❌ Error cancelling ${type} notifications:`, error);
    }
  }

  /**
   * Schedule a welcome notification
   */
  async scheduleWelcomeNotification(userName?: string): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🙏 Welcome to Faithful Companion!',
          body: userName 
            ? `Hi ${userName}! We're excited to journey with you. Start your 7-day spiritual journey today!`
            : "We're excited to journey with you. Start your 7-day spiritual journey today!",
          data: { type: 'welcome' },
          sound: true,
        },
        trigger: {
          seconds: 3, // Show after 3 seconds
        },
      });
    } catch (error) {
      // Silently handle error
    }
  }

  /**
   * Schedule a day completion celebration notification
   */
  async scheduleDayCompletionNotification(day: number): Promise<void> {
    try {
      const messages = [
        { title: '🎉 Day 1 Complete!', body: "Amazing start! God's love is with you on this journey." },
        { title: '✨ Day 2 Complete!', body: "You're building a beautiful habit of faith. Keep going!" },
        { title: '🌟 Day 3 Complete!', body: "Halfway through! Your dedication is inspiring." },
        { title: '💪 Day 4 Complete!', body: "Strong progress! God is working in your life." },
        { title: '🔥 Day 5 Complete!', body: "Almost there! Your spiritual growth is evident." },
        { title: '🙌 Day 6 Complete!', body: "One more day! You're doing incredible work." },
        { title: '🏆 Journey Complete!', body: "You finished all 7 days! God has blessed your commitment. Ready to go deeper?" },
      ];

      const message = messages[day - 1] || messages[6];

      await Notifications.scheduleNotificationAsync({
        content: {
          title: message.title,
          body: message.body,
          data: { type: 'day-complete', day },
          sound: true,
        },
        trigger: {
          seconds: 1, // Show immediately
        },
      });
    } catch (error) {
      // Silently handle error
    }
  }

  /**
   * Schedule a reminder to continue the journey
   */
  async scheduleJourneyReminderNotification(nextDay: number): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📖 Your Journey Awaits',
          body: `Day ${nextDay} is ready for you! Take a few minutes to connect with God today.`,
          data: { type: 'reminder', day: nextDay },
          sound: true,
        },
        trigger: {
          seconds: 86400, // 24 hours from now
        },
      });
    } catch (error) {
      // Silently handle error
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      // Silently handle error
    }
  }

  /**
   * Send an immediate local notification
   */
  async sendImmediateNotification(title: string, body: string, data?: any): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: true,
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      // Silently handle error
    }
  }
}

export default new NotificationService();

