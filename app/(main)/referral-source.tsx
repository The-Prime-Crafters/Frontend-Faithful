import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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

const { width } = Dimensions.get('window');

const PRIMARY_COLOR = '#7b4d62';
const SECONDARY_COLOR = '#ce703f';
const WHITE = '#FFFFFF';
const SOFT_GRAY = '#e9ecef';

const STATUS_BAR_OFFSET = Platform.OS === 'android' ? 34 : 10;

const referralSources = [
  { id: '1', label: 'Friend or Family' },
  { id: '2', label: 'Social Media' },
  { id: '3', label: 'Search Engine (Google, Bing, etc.)' },
  { id: '4', label: 'Church or Community' },
  { id: '5', label: 'App Store' },
  { id: '6', label: 'Other' },
];

export default function ReferralSourceScreen() {
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const router = useRouter();

  const handleContinue = () => {
    if (selectedSource) {
      // Save selectedSource if needed
      router.push('/(main)/faith-strengthens');
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
          <Text style={styles.headerTitle}>How did you hear about us?</Text>
          <Text style={styles.headerSubtitle}>
            We'd love to know how you found Faithful Companion
          </Text>
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '66.66%' }]} />
          </View>
          <Text style={styles.progressText}>Step 4 of 6</Text>
        </View>

        {/* Scrollable Referral Source Options */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
          <View style={styles.optionsContainer}>
            {referralSources.map((source) => (
              <TouchableOpacity
                key={source.id}
                style={[
                  styles.optionCard,
                  { width: '100%' },
                  selectedSource === source.id && styles.selectedCard,
                ]}
                onPress={() => setSelectedSource(source.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedSource === source.id && styles.selectedText,
                  ]}
                >
                  {source.label}
                </Text>
                {selectedSource === source.id && (
                  <Ionicons name="checkmark-circle" size={24} color={WHITE} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        {/* Fixed Footer Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !selectedSource && styles.disabledButton,
            ]}
            onPress={handleContinue}
            disabled={!selectedSource}
          >
            <Text
              style={[
                styles.continueButtonText,
                !selectedSource && styles.disabledButtonText,
              ]}
            >
              Continue
            </Text>
            <Ionicons
              name="arrow-forward"
              size={20}
              color={selectedSource ? WHITE : SOFT_GRAY}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => router.push('/(main)/faith-strengthens')}
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
  optionsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  optionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: WHITE,
  },
  optionText: {
    fontSize: 18,
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