import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Dimensions,
  Image,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

const PRIMARY_COLOR = '#7b4d62';
const SECONDARY_COLOR = '#ce703f';
const WHITE = '#FFFFFF';
const SOFT_GRAY = '#e9ecef';

const STATUS_BAR_OFFSET = Platform.OS === 'android' ? 34 : 10;

export default function SmartNotificationsScreen() {
  const router = useRouter();

  const handleAllow = () => {
    // Here you could request notification permissions if desired
    router.push('/(main)/referral-source');
  };

  const handleNoThanks = () => {
    router.push('/(main)/referral-source');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={[PRIMARY_COLOR, '#8b5a73', SECONDARY_COLOR]}
        style={styles.container}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        <View style={styles.centeredContent}>
          {/* App Logo */}
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Stay Inspired with Smart Notifications</Text>
          <Text style={styles.subtitle}>
            Get timely reminders, daily verses, and personalized spiritual insights.
          </Text>

          {/* Feature List */}
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>• Daily inspirational quotes</Text>
            <Text style={styles.featureItem}>• Prayer reminders</Text>
            <Text style={styles.featureItem}>• Personalized spiritual insights</Text>
          </View>

          <View style={styles.card}>
            <Ionicons name="notifications" size={40} color={PRIMARY_COLOR} style={{ marginBottom: 12 }} />
            <Text style={styles.cardTitle}>
              "Faithful Companion" wants to send you notifications
            </Text>
            <Text style={styles.cardText}>
              Allow notifications to receive daily inspiration and important updates.
            </Text>
            <TouchableOpacity style={styles.allowButton} onPress={handleAllow}>
              <Text style={styles.allowButtonText}>Allow</Text>
            </TouchableOpacity>
          </View>

          {/* No Thanks Button */}
          <TouchableOpacity style={styles.noThanksButton} onPress={handleNoThanks}>
            <Text style={styles.noThanksText}>No thanks</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PRIMARY_COLOR,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: STATUS_BAR_OFFSET,
  },
  centeredContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 70,
    height: 70,
    marginBottom: 18,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: WHITE,
    fontFamily: 'serif',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    fontFamily: 'serif',
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 22,
    maxWidth: width * 0.85,
  },
  featureList: {
    marginBottom: 28,
    alignItems: 'flex-start',
    width: '90%',
    maxWidth: 350,
  },
  featureItem: {
    color: WHITE,
    fontSize: 15,
    fontFamily: 'serif',
    marginBottom: 4,
    opacity: 0.92,
  },
  card: {
    backgroundColor: WHITE,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    width: width * 0.9,
    maxWidth: 400,
    marginBottom: 18,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PRIMARY_COLOR,
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'serif',
  },
  cardText: {
    fontSize: 15,
    color: '#444',
    textAlign: 'center',
    marginBottom: 22,
    fontFamily: 'serif',
  },
  allowButton: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 40,
  },
  allowButtonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'serif',
  },
  noThanksButton: {
    marginTop: 8,
    alignItems: 'center',
  },
  noThanksText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    fontFamily: 'serif',
    textDecorationLine: 'underline',
  },
  progressContainer: {
    position: 'absolute',
    top: STATUS_BAR_OFFSET + 10,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 1,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    marginBottom: 5,
  },
  progressFill: {
    height: '100%',
    backgroundColor: WHITE,
    borderRadius: 4,
  },
  progressText: {
    color: WHITE,
    fontSize: 14,
    fontFamily: 'serif',
  },
}); 