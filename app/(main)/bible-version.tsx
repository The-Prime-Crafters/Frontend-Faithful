import BackButton from '@/components/BackButton';
import { API_ENDPOINTS } from '@/constants/API';
import { useLoading } from '@/contexts/LoadingContext';
import { UserData, defaultUserData } from '@/types/UserData';
import { safeJsonParse } from '@/utils/safeJson';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import {
    Alert,
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
  { 
    id: '1', 
    name: 'New International Version (NIV)', 
    abbreviation: 'NIV', 
    description: 'Modern, easy to read',
    denominations: ['Evangelical', 'Methodist', 'Presbyterian', 'Baptist', 'Anglican', 'Catholic', 'Lutheran', 'Adventist', 'Other'],
    recommended: ['Evangelical', 'Methodist', 'Presbyterian', 'Baptist', 'Anglican']
  },
  { 
    id: '2', 
    name: 'New Living Translation (NLT)', 
    abbreviation: 'NLT', 
    description: 'Thought-for-thought translation',
    denominations: ['Evangelical', 'Methodist', 'Presbyterian', 'Baptist', 'Anglican', 'Catholic', 'Lutheran', 'Adventist', 'Other'],
    recommended: ['Evangelical', 'Methodist', 'Baptist']
  },
  { 
    id: '3', 
    name: 'American Standard-ASV1901 (ASV)', 
    abbreviation: 'ASV', 
    description: 'Classic American revision',
    denominations: ['Evangelical', 'Methodist', 'Presbyterian', 'Baptist', 'Anglican', 'Catholic', 'Lutheran', 'Adventist', 'Other'],
    recommended: ['Evangelical', 'Presbyterian', 'Baptist']
  },
  { 
    id: '4', 
    name: 'Bible in Basic English (BBE)', 
    abbreviation: 'BBE', 
    description: 'Simple, easy vocabulary',
    denominations: ['Evangelical', 'Methodist', 'Presbyterian', 'Baptist', 'Anglican', 'Catholic', 'Lutheran', 'Adventist', 'Other'],
    recommended: ['Evangelical', 'Methodist']
  },
  { 
    id: '5', 
    name: 'Darby English Bible (DARBY)', 
    abbreviation: 'DARBY', 
    description: 'Literal translation by John Darby',
    denominations: ['Evangelical', 'Methodist', 'Presbyterian', 'Baptist', 'Anglican', 'Catholic', 'Lutheran', 'Adventist', 'Other'],
    recommended: ['Evangelical', 'Presbyterian']
  },
  { 
    id: '6', 
    name: 'King James Version (KJV)', 
    abbreviation: 'KJV', 
    description: 'Traditional, formal English',
    denominations: ['Evangelical', 'Methodist', 'Presbyterian', 'Baptist', 'Anglican', 'Catholic', 'Lutheran', 'Adventist', 'Other'],
    recommended: ['Catholic', 'Evangelical', 'Methodist', 'Lutheran', 'Presbyterian', 'Anglican']
  },
  { 
    id: '7', 
    name: 'World English Bible (WEB)', 
    abbreviation: 'WEB', 
    description: 'Modern English update of ASV',
    denominations: ['Evangelical', 'Methodist', 'Presbyterian', 'Baptist', 'Anglican', 'Catholic', 'Lutheran', 'Adventist', 'Other'],
    recommended: ['Evangelical', 'Baptist', 'Methodist']
  },
  { 
    id: '8', 
    name: 'Young\'s Literal Translation (YLT)', 
    abbreviation: 'YLT', 
    description: 'Most literal word-for-word',
    denominations: ['Evangelical', 'Methodist', 'Presbyterian', 'Baptist', 'Anglican', 'Catholic', 'Lutheran', 'Adventist', 'Other'],
    recommended: ['Evangelical', 'Presbyterian']
  },
];

export default function BibleVersionScreen() {
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [userDenomination, setUserDenomination] = useState<string | null>(null);
  const [filteredVersions, setFilteredVersions] = useState(bibleVersions);
  const router = useRouter();
  const { showLoading, hideLoading } = useLoading();

  useEffect(() => {
    loadUserDenomination();
    // Use static versions only, no API fetch needed
  }, []);

  const loadUserDenomination = async () => {
    try {
      const userDataString = await SecureStore.getItemAsync('userData');
      if (userDataString) {
        const userData: UserData = safeJsonParse(userDataString, defaultUserData);
        // Get denomination from the last saved preferences
        const token = await SecureStore.getItemAsync('authToken');
        if (token) {
          const response = await fetch(API_ENDPOINTS.USERS_PREFERENCES, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const preferences = await response.json();
            const denomination = preferences.data?.denomination;
            if (denomination) {
              setUserDenomination(denomination);
              filterVersionsByDenomination(denomination);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading user denomination:', error);
    }
  };

  // No longer fetching from API - using static versions only
  // Backend is only used for saving user preferences

  const filterVersionsByDenomination = (denomination: string) => {
    const filtered = bibleVersions.filter(version => 
      version.denominations.includes(denomination)
    );
    setFilteredVersions(filtered);
  };

  const handleContinue = async () => {
    if (selectedVersion) {
      try {
        showLoading('Updating Bible version...');
        const token = await SecureStore.getItemAsync('authToken');
        
        if (!token) {
          Alert.alert('Error', 'Authentication required');
          return;
        }

        // Get the bible version abbreviation from the selected ID
        const version = filteredVersions.find(v => v.id === selectedVersion);
        
        if (!version) {
          Alert.alert('Error', 'Selected version not found');
          return;
        }

        // Update user's Bible version preference using the new API
        const response = await fetch(API_ENDPOINTS.BIBLE_USER_VERSION, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bibleVersion: version.abbreviation,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        console.log('✅ Bible version updated successfully:', version.abbreviation);
        router.push('/(main)/age-group');
      } catch (error) {
        console.error('❌ Error updating Bible version:', error);
        Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update Bible version');
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
          <Text style={styles.headerTitle}>
            {userDenomination ? `Recommended Bible Versions for ${userDenomination}` : 'Choose Your Bible Version'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {userDenomination 
              ? `These translations are commonly used and recommended for ${userDenomination} churches`
              : 'Select your preferred Bible translation for daily readings'
            }
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
            {filteredVersions.map((version) => {
              const isRecommended = userDenomination && version.recommended.includes(userDenomination);
              return (
                <TouchableOpacity
                  key={version.id}
                  style={[
                    styles.versionCard,
                    { width: '100%' },
                    selectedVersion === version.id && styles.selectedCard,
                    isRecommended && styles.recommendedCard
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
                      <View style={styles.titleRow}>
                        <Text style={[
                          styles.versionName,
                          selectedVersion === version.id && styles.selectedText
                        ]}>
                          {version.name}
                        </Text>
                        {isRecommended && (
                          <View style={styles.recommendedBadge}>
                            <Text style={styles.recommendedText}>Recommended</Text>
                          </View>
                        )}
                      </View>
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
              );
            })}
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  versionName: {
    fontSize: 16,
    color: WHITE,
    fontFamily: 'serif',
    fontWeight: '500',
    flex: 1,
  },
  recommendedBadge: {
    backgroundColor: SECONDARY_COLOR,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  recommendedText: {
    fontSize: 10,
    color: WHITE,
    fontFamily: 'serif',
    fontWeight: 'bold',
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
  recommendedCard: {
    borderColor: SECONDARY_COLOR,
    borderWidth: 1,
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: WHITE,
    fontSize: 16,
    fontFamily: 'serif',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  retryButtonText: {
    color: WHITE,
    fontSize: 14,
    fontFamily: 'serif',
    fontWeight: '500',
  },
});