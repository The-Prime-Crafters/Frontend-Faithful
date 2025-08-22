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

const bibleVersions = [
  { id: '1', name: 'King James Version (KJV)', abbreviation: 'KJV', description: 'Traditional, formal English' },
  { id: '2', name: 'New International Version (NIV)', abbreviation: 'NIV', description: 'Modern, easy to read' },
  { id: '3', name: 'New King James Version (NKJV)', abbreviation: 'NKJV', description: 'Updated KJV language' },
  { id: '4', name: 'English Standard Version (ESV)', abbreviation: 'ESV', description: 'Word-for-word translation' },
  { id: '5', name: 'New American Standard Bible (NASB)', abbreviation: 'NASB', description: 'Most literal translation' },
  { id: '6', name: 'New Living Translation (NLT)', abbreviation: 'NLT', description: 'Thought-for-thought translation' },
  { id: '7', name: 'Christian Standard Bible (CSB)', abbreviation: 'CSB', description: 'Optimal equivalence' },
  { id: '8', name: 'The Message (MSG)', abbreviation: 'MSG', description: 'Contemporary paraphrase' },
  { id: '9', name: 'Amplified Bible (AMP)', abbreviation: 'AMP', description: 'Expanded meanings' },
  { id: '10', name: 'New Revised Standard Version (NRSV)', abbreviation: 'NRSV', description: 'Scholarly translation' },
];

export default function BibleVersionScreen() {
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const router = useRouter();

  const handleContinue = () => {
    if (selectedVersion) {
      // Here you could save the selected Bible version to user preferences
      router.push('/(main)/age-group');
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
          <Text style={styles.headerTitle}>Choose Your Bible Version</Text>
          <Text style={styles.headerSubtitle}>
            Select your preferred Bible translation for daily readings
          </Text>
        </View>
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '33.33%' }]} />
          </View>
          <Text style={styles.progressText}>Step 2 of 6</Text>
        </View>
        {/* Scrollable Cards */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
          <View style={styles.versionsContainer}>
            {bibleVersions.map((version) => (
              <TouchableOpacity
                key={version.id}
                style={[
                  styles.versionCard,
                  { width: '100%' },
                  selectedVersion === version.id && styles.selectedCard
                ]}
                onPress={() => setSelectedVersion(version.id)}
                activeOpacity={0.7}
              >
                <View style={styles.cardContent}>
                  <View style={styles.iconContainer}>
                    <Ionicons 
                      name="book" 
                      size={24} 
                      color={WHITE} 
                    />
                  </View>
                  <View style={styles.versionInfo}>
                    <Text style={[
                      styles.versionName,
                      selectedVersion === version.id && styles.selectedText
                    ]}>
                      {version.name}
                    </Text>
                    <Text style={[
                      styles.versionDescription,
                      selectedVersion === version.id && styles.selectedDescription
                    ]}>
                      {version.description}
                    </Text>
                  </View>
                  {selectedVersion === version.id && (
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
              !selectedVersion && styles.disabledButton
            ]}
            onPress={handleContinue}
            disabled={!selectedVersion}
          >
            <Text style={[
              styles.continueButtonText,
              !selectedVersion && styles.disabledButtonText
            ]}>
              Continue
            </Text>
            <Ionicons 
              name="arrow-forward" 
              size={20} 
              color={selectedVersion ? WHITE : SOFT_GRAY} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.skipButton}
            onPress={() => router.push('/(main)/age-group')}
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
  versionsContainer: {
    paddingBottom: 20,
  },
  versionCard: {
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
  versionInfo: {
    flex: 1,
  },
  versionName: {
    fontSize: 16,
    color: WHITE,
    fontFamily: 'serif',
    fontWeight: '500',
    marginBottom: 4,
  },
  selectedText: {
    fontWeight: 'bold',
  },
  versionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'serif',
  },
  selectedDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
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