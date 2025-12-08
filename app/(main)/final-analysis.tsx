import BackButton from '@/components/BackButton';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Animated,
    Dimensions,
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
const ACCENT_COLOR = '#f4a261';

const STATUS_BAR_OFFSET = Platform.OS === 'android' ? 34 : 10;

const PROCESSING_STEPS = [
  'Processing your answers...',
  'Analyzing your goals...',
  'Creating personalized experience...'
];

const PROGRESS_BARS = [
  { label: 'Profile', key: 'profile' },
  { label: 'Goals', key: 'goals' },
  { label: 'Personalization', key: 'personalization' }
];

export default function FinalAnalysisScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [progressValues] = useState({
    profile: new Animated.Value(0),
    goals: new Animated.Value(0),
    personalization: new Animated.Value(0)
  });

  const handleGetStarted = () => {
    router.push('/(tabs)'); // or wherever you want to navigate
  };

  // Function to render floating particles
  const renderParticles = () => {
    const particles = [];
    for (let i = 0; i < 8; i++) {
      particles.push(
        <View
          key={i}
          style={[
            styles.particle,
            {
              left: `${Math.random() * 80 + 10}%`,
              top: `${Math.random() * 70 + 15}%`,
            },
          ]}
        />
      );
    }
    return <View style={styles.particlesWrapper}>{particles}</View>;
  };

  // Animate progress bars with random percentages
  const animateProgressBars = () => {
    const animations = Object.keys(progressValues).map((key, index) => {
      const randomPercentage = Math.random() * 40 + 60; // 60-100%
      return Animated.timing(progressValues[key], {
        toValue: randomPercentage,
        duration: 2000 + (index * 500),
        useNativeDriver: false,
      });
    });

    Animated.stagger(300, animations).start();
  };

  // Handle step progression and animations
  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < PROCESSING_STEPS.length - 1) {
          return prev + 1;
        } else {
          clearInterval(stepInterval);
          setTimeout(() => {
            setIsComplete(true);
          }, 1500);
          return prev;
        }
      });
    }, 2500);

    // Start progress bar animations
    setTimeout(() => {
      animateProgressBars();
    }, 500);

    return () => clearInterval(stepInterval);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={[PRIMARY_COLOR, '#8b5a73', SECONDARY_COLOR]}
        style={styles.container}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        {/* Back Button */}
        <BackButton 
          onPress={() => router.back()}
          style={styles.backButton}
        />
        
        {/* Floating particles */}
        <View style={styles.particlesContainer}>
          {renderParticles()}
        </View>

        <View style={styles.content}>
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                style={styles.iconGradient}
              >
                <Text style={styles.iconText}>✨</Text>
              </LinearGradient>
            </View>
            
            <Text style={styles.title}>Almost Ready!</Text>
            <Text style={styles.subtitle}>
              We're setting up your personalized biblical guidance experience
            </Text>
          </View>

          {/* Progress Bars Section */}
          <View style={styles.progressSection}>
            {PROGRESS_BARS.map((bar, index) => (
              <View key={bar.key} style={styles.progressItem}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>{bar.label}</Text>
                  <Text style={styles.progressPercentage}>
                    <Animated.Text>
                      {progressValues[bar.key]._value.toFixed(0)}%
                    </Animated.Text>
                  </Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <Animated.View
                    style={[
                      styles.progressBarFill,
                      {
                        width: progressValues[bar.key].interpolate({
                          inputRange: [0, 100],
                          outputRange: ['0%', '100%'],
                          extrapolate: 'clamp',
                        }),
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>

          {/* Processing Messages */}
          <View style={styles.processingSection}>
            <Text style={styles.processingText}>
              {PROCESSING_STEPS[currentStep]}
            </Text>
            <View style={styles.loadingDots}>
              <View style={[styles.dot, styles.dot1]} />
              <View style={[styles.dot, styles.dot2]} />
              <View style={[styles.dot, styles.dot3]} />
            </View>
          </View>
        </View>

        {/* Footer Section */}
        {isComplete && (
          <View style={styles.footer}>
            <Text style={styles.readyText}>
              🎉 Let's start this journey together!
            </Text>
            <TouchableOpacity
              style={styles.getStartedButton}
              onPress={handleGetStarted}
              activeOpacity={0.8}
            >
              <Text style={styles.getStartedButtonText}>
                Get Started
              </Text>
            </TouchableOpacity>
          </View>
        )}
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
  particlesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  particlesWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 50,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  iconText: {
    fontSize: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: WHITE,
    fontFamily: 'serif',
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontFamily: 'serif',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: width * 0.85,
    paddingHorizontal: 10,
  },
  progressSection: {
    width: '100%',
    marginBottom: 50,
  },
  progressItem: {
    marginBottom: 25,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'serif',
  },
  progressPercentage: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontFamily: 'serif',
    fontWeight: '500',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: WHITE,
    borderRadius: 4,
    shadowColor: WHITE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  processingSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  processingText: {
    fontSize: 18,
    color: WHITE,
    fontFamily: 'serif',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  loadingDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: WHITE,
    marginHorizontal: 4,
    opacity: 0.4,
  },
  dot1: {
    animationDelay: '0s',
  },
  dot2: {
    animationDelay: '0.2s',
  },
  dot3: {
    animationDelay: '0.4s',
  },
  footer: {
    paddingVertical: 30,
    paddingBottom: Platform.OS === 'ios' ? 44 : 30,
    alignItems: 'center',
  },
  readyText: {
    fontSize: 18,
    color: WHITE,
    fontFamily: 'serif',
    textAlign: 'center',
    marginBottom: 25,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  getStartedButton: {
    width: '100%',
    backgroundColor: WHITE,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  getStartedButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
    fontFamily: 'serif',
    letterSpacing: 0.5,
  },
  backButton: {
    top: 50,
    left: 20,
  },
});