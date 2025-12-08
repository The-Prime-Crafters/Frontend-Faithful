import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width, height } = Dimensions.get('window');

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

export default function WelcomeScreen() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={[PRIMARY_COLOR, '#8b5a73', SECONDARY_COLOR]}
        style={styles.container}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} showsVerticalScrollIndicator={false}>
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '100%' }]} />
          </View>
          <Text style={styles.progressText}>Step 4 of 4</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="heart" size={80} color={WHITE} />
          </View>

          {/* Welcome Text */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>Welcome to Faithful</Text>
            <Text style={styles.subtitle}>
              Your personalized faith journey begins now! We've tailored your experience to match your beliefs, creating a sacred space for growth, prayer, and community.
            </Text>
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <Ionicons name="book" size={24} color={WHITE} />
              <Text style={styles.featureText}>Personalized Devotions</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="chatbubbles" size={24} color={WHITE} />
              <Text style={styles.featureText}>Prayer Community</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="people" size={24} color={WHITE} />
              <Text style={styles.featureText}>Faith Groups</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="heart" size={24} color={WHITE} />
              <Text style={styles.featureText}>Spiritual Growth</Text>
            </View>
          </View>
        </View>
        </ScrollView>
        {/* Get Started Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={handleGetStarted}
          >
            <Text style={styles.getStartedText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={20} color={WHITE} />
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
  progressContainer: {
    marginBottom: 40,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    marginBottom: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: WHITE,
    borderRadius: 3,
  },
  progressText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontFamily: 'serif',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 40,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: WHITE,
    fontFamily: 'serif',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'serif',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  featuresContainer: {
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  featureText: {
    color: WHITE,
    fontSize: 16,
    fontFamily: 'serif',
    marginLeft: 15,
    fontWeight: '500',
  },
  footer: {
    paddingVertical: 30,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
  },
  getStartedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WHITE,
    borderRadius: 12,
    paddingVertical: 16,
  },
  getStartedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
    fontFamily: 'serif',
    marginRight: 8,
  },
}); 