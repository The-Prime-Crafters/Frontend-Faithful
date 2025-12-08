import BackButton from '@/components/BackButton';
import { API_ENDPOINTS } from '@/constants/API';
import { useLoading } from '@/contexts/LoadingContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useState } from 'react';
import {
  Alert,
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

const STATUS_BAR_OFFSET = Platform.OS === 'android' ? 34 : 10;

const options = [
  { id: '1', label: 'Study the Bible' },
  { id: '2', label: 'Overcome Sufferings & Challenges' },
];

export default function BibleAnswersScreen() {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const { showLoading, hideLoading } = useLoading();

  const handleContinue = async () => {
    if (selectedOption) {
      try {
        showLoading('Updating preferences...');
        const token = await SecureStore.getItemAsync('authToken');
        
        if (!token) {
          Alert.alert('Error', 'Authentication required');
          return;
        }

        // Get the bible answers option from the selected ID
        const option = options.find(o => o.id === selectedOption);
        
        // Update user preferences with bible answers
        const response = await fetch(API_ENDPOINTS.USERS_PREFERENCES, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bibleAnswers: option?.label || 'Not specified',
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        console.log('✅ Bible answers updated successfully');
        router.push('/(main)/bible-specific');
      } catch (error) {
        console.error('❌ Error updating preferences:', error);
        Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update preferences');
      } finally {
        hideLoading();
      }
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
        {/* Back Button */}
        <BackButton 
          onPress={() => router.back()}
          style={styles.backButton}
        />
        
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '83.33%' }]} />
          </View>
          <Text style={styles.progressText}>Step 5 of 6</Text>
        </View>

        <View style={styles.centeredContent}>
          <Text style={styles.title}>The Bible has answers for any upcoming trial</Text>
          <Text style={styles.subtitle}>
            Find wisdom and strength for every challenge ahead.
          </Text>

          {options.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionButton,
                { width: '90%', maxWidth: 400 },
                selectedOption === option.id && styles.selectedOptionButton,
              ]}
              onPress={() => setSelectedOption(option.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.optionText}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Continue Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !selectedOption && styles.disabledButton,
            ]}
            onPress={handleContinue}
            disabled={!selectedOption}
          >
            <Text
              style={[
                styles.continueButtonText,
                !selectedOption && styles.disabledButtonText,
              ]}
            >
              Continue
            </Text>
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
    paddingHorizontal: 20,
    paddingTop: STATUS_BAR_OFFSET,
  },
  progressContainer: {
    marginBottom: 30,
    marginTop: 10,
    paddingTop: 60, // Add space for back button
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
  centeredContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: WHITE,
    fontFamily: 'serif',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    fontFamily: 'serif',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
    maxWidth: width * 0.85,
  },
  optionButton: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingVertical: 24,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  selectedOptionButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderColor: WHITE,
  },
  optionText: {
    color: WHITE,
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'serif',
    textAlign: 'center',
  },
  footer: {
    paddingVertical: 30,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
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
    color: '#ccc',
  },
  backButton: {
    top: 50,
    left: 20,
  },
}); 