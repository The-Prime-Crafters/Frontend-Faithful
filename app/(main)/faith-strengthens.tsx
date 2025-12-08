import BackButton from '@/components/BackButton';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Dimensions,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const PRIMARY_COLOR = '#7b4d62';
const SECONDARY_COLOR = '#ce703f';
const WHITE = '#FFFFFF';
const ACCENT_COLOR = '#f4a261';

const STATUS_BAR_OFFSET = Platform.OS === 'android' ? 34 : 10;

const faithData = [1, 2, 3, 4, 5, 6, 7]; // Sample data for 7 days
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const maxValue = Math.max(...faithData);

export default function FaithStrengthensScreen() {
  const router = useRouter();

  const handleContinue = () => {
    router.push('/(main)/bible-answers');
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
              top: `${Math.random() * 60 + 20}%`,
              animationDelay: `${Math.random() * 3}s`,
            },
          ]}
        />
      );
    }
    return <View style={styles.particlesWrapper}>{particles}</View>;
  };

  // Function to render custom chart bars
  const renderChart = () => {
    return (
      <View style={styles.chartContainer}>
        {/* Background decorative elements */}
        <View style={styles.chartBackground}>
          <View style={styles.decorativeCircle1} />
          <View style={styles.decorativeCircle2} />
        </View>
        
        {/* Grid lines */}
        <View style={styles.gridContainer}>
          <View style={styles.horizontalLine} />
          <View style={[styles.horizontalLine, { bottom: '25%' }]} />
          <View style={[styles.horizontalLine, { bottom: '50%' }]} />
          <View style={[styles.horizontalLine, { bottom: '75%' }]} />
        </View>
        
        {/* Chart bars */}
        <View style={styles.barsContainer}>
          {faithData.map((value, index) => (
            <View key={index} style={styles.barColumn}>
              <View style={[styles.bar, { height: `${Math.min((value / maxValue) * 70, 70)}%` }]}>
                <LinearGradient
                  colors={[ACCENT_COLOR, SECONDARY_COLOR, '#d4622a']}
                  style={styles.barGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                >
                  <View style={styles.barTop}>
                    <Text style={styles.barValue}>{value}</Text>
                  </View>
                </LinearGradient>
              </View>
              <Text style={styles.dayLabel}>{days[index]}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

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
        
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          {/* Floating particles */}
          <View style={styles.particlesContainer}>
            {renderParticles()}
          </View>

          <View style={styles.mainContent}>
            {/* Header section */}
            <View style={styles.headerSection}>
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                  style={styles.iconGradient}
                >
                  <Text style={styles.iconText}>🙏</Text>
                </LinearGradient>
              </View>
              
              <Text style={styles.title}>Faith Strengthens with Consistent Practice</Text>
              <Text style={styles.subtitle}>
                Every day brings you closer to God. Track your spiritual journey and witness your growth.
              </Text>
            </View>

            {/* Chart section */}
            <View style={styles.chartSection}>
              <View style={[styles.chartContainer, { width: '100%', maxWidth: 400 }]}>
                {renderChart()}
              </View>
              
              {/* Progress indicators */}
              <View style={[styles.progressIndicators, { width: '100%', maxWidth: 350 }]}>
                <View style={styles.progressItem}>
                  <Text style={styles.progressValue}>7</Text>
                  <Text style={styles.progressLabel}>Days</Text>
                </View>
                <View style={styles.progressDivider} />
                <View style={styles.progressItem}>
                  <Text style={styles.progressValue}>{faithData.reduce((a, b) => a + b, 0)}</Text>
                  <Text style={styles.progressLabel}>Total</Text>
                </View>
                <View style={styles.progressDivider} />
                <View style={styles.progressItem}>
                  <Text style={styles.progressValue}>{Math.round((faithData.reduce((a, b) => a + b, 0) / faithData.length) * 10) / 10}</Text>
                  <Text style={styles.progressLabel}>Average</Text>
                </View>
              </View>
            </View>
          </View>
          
          {/* Fixed bottom button */}
          <View style={styles.bottomSection}>
            <TouchableOpacity 
              style={styles.continueButton} 
              onPress={handleContinue}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[WHITE, 'rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.continueButtonText}>Continue</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
    width: 6,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60, // Add space for back button
  },
  headerSection: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 30,
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
    borderColor: 'rgba(255,255,255,0.3)',
  },
  iconText: {
    fontSize: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: WHITE,
    fontFamily: 'serif',
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    lineHeight: 34,
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
  chartSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartContainer: {
    width: '100%',
    height: 200,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  chartBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -20,
    right: -20,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.08)',
    bottom: -10,
    left: -10,
  },
  gridContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
  },
  horizontalLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    bottom: 0,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: '100%',
    width: '100%',
    paddingTop: 20,
  },
  barColumn: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    width: `${100 / days.length}%`,
  },
  bar: {
    width: '70%',
    borderRadius: 8,
    marginBottom: 15,
    overflow: 'hidden',
    minHeight: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  barGradient: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  barTop: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginTop: 4,
  },
  barValue: {
    color: WHITE,
    fontSize: 11,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  dayLabel: {
    color: WHITE,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'serif',
  },
  progressIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 20,
    width: '100%',
  },
  progressItem: {
    alignItems: 'center',
  },
  progressValue: {
    color: WHITE,
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'serif',
  },
  progressLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  progressDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 44 : 30,
    paddingTop: 20,
  },
  continueButton: {
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  continueButtonText: {
    color: PRIMARY_COLOR,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'serif',
    letterSpacing: 0.5,
    marginRight: 8,
  },
  backButton: {
    top: 50,
    left: 20,
  },
});