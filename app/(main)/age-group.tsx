import BackButton from '@/components/BackButton';
import { API_ENDPOINTS } from '@/constants/API';
import { useLoading } from '@/contexts/LoadingContext';
import { Ionicons } from '@expo/vector-icons';
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
const SOFT_GRAY = '#e9ecef';

const STATUS_BAR_OFFSET = Platform.OS === 'android' ? 34 : 10;

const ageGroups = [
  { id: '1', label: '13-17' },
  { id: '2', label: '18-24' },
  { id: '3', label: '25-34' },
  { id: '4', label: '35-44' },
  { id: '5', label: '45-54' },
  { id: '6', label: '55-64' },
  { id: '7', label: '65+' },
];

export default function AgeGroupScreen() {
  const [selectedAge, setSelectedAge] = useState<string | null>(null);
  const router = useRouter();
  const { showLoading, hideLoading } = useLoading();

  const handleContinue = async () => {
    if (selectedAge) {
      try {
        showLoading('Updating preferences...');
        const token = await SecureStore.getItemAsync('authToken');
        
        if (!token) {
          Alert.alert('Error', 'Authentication required');
          return;
        }

        // Get the age group label from the selected ID
        const ageGroup = ageGroups.find(a => a.id === selectedAge);
        
        // Update user preferences with age group
        const response = await fetch(API_ENDPOINTS.USERS_PREFERENCES, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ageGroup: ageGroup?.label || 'Not specified',
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        console.log('✅ Age group updated successfully');
        router.push('/(main)/referral-source');
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
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>What stage of life are you in?</Text>
          <Text style={styles.headerSubtitle}>
            Understanding your life stage helps us provide relevant spiritual guidance
          </Text>
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '50%' }]} />
          </View>
          <Text style={styles.progressText}>Step 3 of 6</Text>
        </View>

        {/* Scrollable Age Group Cards */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
          <View style={styles.optionsContainer}>
            {ageGroups.map((group) => (
              <TouchableOpacity
                key={group.id}
                style={[
                  styles.optionCard,
                  { width: '100%' },
                  selectedAge === group.id && styles.selectedCard,
                ]}
                onPress={() => setSelectedAge(group.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedAge === group.id && styles.selectedText,
                  ]}
                >
                  {group.label}
                </Text>
                {selectedAge === group.id && (
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
              !selectedAge && styles.disabledButton,
            ]}
            onPress={handleContinue}
            disabled={!selectedAge}
          >
            <Text
              style={[
                styles.continueButtonText,
                !selectedAge && styles.disabledButtonText,
              ]}
            >
              Continue
            </Text>
            <Ionicons
              name="arrow-forward"
              size={20}
              color={selectedAge ? WHITE : SOFT_GRAY}
            />
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
    paddingTop: 80, // Add space for back button
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
  backButton: {
    top: 50,
    left: 20,
  },
}); 