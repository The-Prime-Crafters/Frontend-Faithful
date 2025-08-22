import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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

const { width } = Dimensions.get('window');

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

const denominations = [
  { id: '1', name: 'Roman Catholic Church', icon: 'business' },
  { id: '2', name: 'Eastern Orthodox Church', icon: 'business' },
  { id: '3', name: 'Anglican Communion', icon: 'business' },
  { id: '4', name: 'Baptist Churches', icon: 'business' },
  { id: '5', name: 'Lutheran Churches', icon: 'business' },
  { id: '6', name: 'Methodist Churches', icon: 'business' },
  { id: '7', name: 'Pentecostalism', icon: 'business' },
  { id: '8', name: 'Presbyterian and Reformed Churches', icon: 'business' },
  { id: '9', name: 'Seventh-day Adventist Church', icon: 'business' },
  { id: '10', name: 'Jehovah\'s Witnesses', icon: 'business' },
];

export default function DenominationScreen() {
  const [selectedDenomination, setSelectedDenomination] = useState<string | null>(null);
  const router = useRouter();

  const handleContinue = () => {
    if (selectedDenomination) {
      // Here you could save the selected denomination to user preferences
      router.push('/(main)/bible-version');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={[PRIMARY_COLOR, '#8b5a73', SECONDARY_COLOR]}
        style={styles.container}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Choose Your Denomination</Text>
          <Text style={styles.headerSubtitle}>
            This helps us provide more relevant spiritual guidance
          </Text>
        </View>
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '16.66%' }]} />
          </View>
          <Text style={styles.progressText}>Step 1 of 6</Text>
        </View>
        {/* Scrollable Cards */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
          <View style={styles.denominationsContainer}>
            {denominations.map((denomination) => (
              <TouchableOpacity
                key={denomination.id}
                style={[
                  styles.denominationCard,
                  { width: '100%' },
                  selectedDenomination === denomination.id && styles.selectedCard
                ]}
                onPress={() => setSelectedDenomination(denomination.id)}
                activeOpacity={0.7}
              >
                <View style={styles.cardContent}>
                  <View style={styles.iconContainer}>
                    <Ionicons 
                      name={denomination.icon as any} 
                      size={24} 
                      color={WHITE} 
                    />
                  </View>
                  <Text style={[
                    styles.denominationName,
                    selectedDenomination === denomination.id && styles.selectedText
                  ]}>
                    {denomination.name}
                  </Text>
                  {selectedDenomination === denomination.id && (
                    <Ionicons name="checkmark-circle" size={24} color={WHITE} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        {/* Fixed Footer Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !selectedDenomination && styles.disabledButton
            ]}
            onPress={handleContinue}
            disabled={!selectedDenomination}
          >
            <Text style={[
              styles.continueButtonText,
              !selectedDenomination && styles.disabledButtonText
            ]}>
              Continue
            </Text>
            <Ionicons 
              name="arrow-forward" 
              size={20} 
              color={selectedDenomination ? WHITE : SOFT_GRAY} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.skipButton}
            onPress={() => router.push('/(main)/bible-version')}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
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
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: WHITE,
    fontFamily: 'serif',
    textAlign: 'center',
    marginBottom: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'serif',
    textAlign: 'center',
    lineHeight: 22,
  },
  progressContainer: {
    marginBottom: 30,
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
  scrollContainer: {
    flex: 1,
  },
  denominationsContainer: {
    paddingBottom: 20,
  },
  denominationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  selectedCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: WHITE,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  denominationName: {
    flex: 1,
    fontSize: 16,
    color: WHITE,
    fontFamily: 'serif',
    fontWeight: '500',
  },
  selectedText: {
    fontWeight: 'bold',
  },
  footer: {
    paddingVertical: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WHITE,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
    fontFamily: 'serif',
    marginRight: 8,
  },
  disabledButtonText: {
    color: SOFT_GRAY,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontFamily: 'serif',
  },
}); 