import { API_ENDPOINTS } from '@/constants/API';
import { useLoading } from '@/contexts/LoadingContext';
import { UserData, defaultUserData } from '@/types/UserData';
import { safeJsonParse } from '@/utils/safeJson';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const PRIMARY_COLOR = '#7b4d62';
const SECONDARY_COLOR = '#ce703f';
const WHITE = '#FFFFFF';
const OFF_WHITE = '#f8f9fa';
const SOFT_GRAY = '#e9ecef';
const DARK_GRAY = '#495057';
const BLACK = '#000000';
const LIGHT_PURPLE = '#e3d5ca';

const STATUS_BAR_OFFSET = Platform.OS === 'android'
  ? (StatusBar.currentHeight ?? 24) + 10
  : 10;

// Bible versions - matching onboarding screen
const BIBLE_VERSIONS = [
  { id: 'NIV', name: 'New International Version (NIV)', description: 'Modern, easy to read' },
  { id: 'NLT', name: 'New Living Translation (NLT)', description: 'Thought-for-thought translation' },
  { id: 'ASV', name: 'American Standard-ASV1901 (ASV)', description: 'Classic American revision' },
  { id: 'BBE', name: 'Bible in Basic English (BBE)', description: 'Simple, easy vocabulary' },
  { id: 'DARBY', name: 'Darby English Bible (DARBY)', description: 'Literal translation by John Darby' },
  { id: 'KJV', name: 'King James Version (KJV)', description: 'Traditional, formal English' },
  { id: 'WEB', name: 'World English Bible (WEB)', description: 'Modern English update of ASV' },
  { id: 'YLT', name: 'Young\'s Literal Translation (YLT)', description: 'Most literal word-for-word' },
];

const AGE_GROUPS = [
  '13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'
];

const DENOMINATIONS = [
  'Catholic', 'Evangelical', 'Methodist', 'Adventist',
  'Lutheran', 'Presbyterian', 'Anglican', 'Other'
];

interface UserPreferences {
  name: string;
  email: string;
  bibleVersion: string;
  ageGroup: string;
  denomination: string;
  referralSource: string;
  voiceId: string;
  voiceName: string;
}

export default function AccountSettings() {
  const router = useRouter();
  const { showLoading, hideLoading } = useLoading();

  const [preferences, setPreferences] = useState<UserPreferences>({
    name: '',
    email: '',
    bibleVersion: 'KJV',
    ageGroup: '25-34',
    denomination: 'Other',
    referralSource: '',
    voiceId: '',
    voiceName: 'Default'
  });

  const [showBibleVersionModal, setShowBibleVersionModal] = useState(false);
  const [showAgeGroupModal, setShowAgeGroupModal] = useState(false);
  const [showDenominationModal, setShowDenominationModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<Speech.Voice[]>([]);
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);

  useEffect(() => {
    loadUserPreferences();
    loadAvailableVoices();
  }, []);

  // Stop any playing voice preview when modal closes
  useEffect(() => {
    if (!showVoiceModal) {
      stopVoicePreview();
    }
  }, [showVoiceModal]);

  const loadAvailableVoices = async () => {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      
      // Filter to only American English (en-US) and Spanish (es-US or es-ES)
      const filteredVoices = voices.filter(voice => 
        voice.language === 'en-US' ||     // American English only
        voice.language === 'es-US' ||     // Spanish (US)
        voice.language === 'es-ES'        // Spanish (Spain)
      );
      
      // Sort: American English first, then Spanish
      const sortedVoices = filteredVoices.sort((a, b) => {
        if (a.language === 'en-US' && b.language !== 'en-US') return -1;
        if (a.language !== 'en-US' && b.language === 'en-US') return 1;
        return a.name.localeCompare(b.name);
      });
      
      setAvailableVoices(sortedVoices);
      console.log('✅ Loaded', sortedVoices.length, 'voices (American English and Spanish only)');
    } catch (error) {
      console.error('❌ Error loading voices:', error);
    }
  };

  const previewVoice = async (voice: Speech.Voice) => {
    try {
      // Stop any currently playing preview
      await stopVoicePreview();

      setPreviewingVoiceId(voice.identifier);

      // Play a sample text with this voice
      const sampleText = "Hello, this is a preview of this voice reading the daily verse and prayer.";

      await Speech.speak(sampleText, {
        voice: voice.identifier,
        rate: 0.8,
        pitch: 1.0,
        onDone: () => {
          setPreviewingVoiceId(null);
        },
        onStopped: () => {
          setPreviewingVoiceId(null);
        },
        onError: () => {
          setPreviewingVoiceId(null);
        }
      });

      console.log('🔊 Playing voice preview:', voice.name);
    } catch (error) {
      console.error('❌ Error previewing voice:', error);
      setPreviewingVoiceId(null);
    }
  };

  const stopVoicePreview = async () => {
    try {
      await Speech.stop();
      setPreviewingVoiceId(null);
    } catch (error) {
      console.error('❌ Error stopping voice preview:', error);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '⚠️ Delete Account',
      'Are you absolutely sure you want to delete your account?\n\n' +
      'This action will:\n' +
      '• Permanently delete all your data\n' +
      '• Remove all prayer requests\n' +
      '• Delete chat history\n' +
      '• Remove you from study groups\n' +
      '• Cannot be undone\n\n' +
      'This action is PERMANENT and IRREVERSIBLE.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: () => confirmDeleteAccount(),
        },
      ],
      { cancelable: true }
    );
  };

  const confirmDeleteAccount = async () => {
    try {
      showLoading('Deleting account...');

      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        Alert.alert('Error', 'Please sign in again');
        hideLoading();
        return;
      }

      console.log('🗑️ Deleting user account...');
      const response = await fetch(API_ENDPOINTS.USERS_DELETE_ACCOUNT, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        console.log('✅ Account deleted successfully');

        // Clear all local data
        await SecureStore.deleteItemAsync('authToken');
        await SecureStore.deleteItemAsync('userData');
        await SecureStore.deleteItemAsync('userUsageData');
        await SecureStore.deleteItemAsync('userVoiceId');
        await SecureStore.deleteItemAsync('lastPrayerFetch');
        await SecureStore.deleteItemAsync('cachedPrayers');

        hideLoading();

        // Show success message
        Alert.alert(
          'Account Deleted',
          'Your account and all data have been permanently deleted. We\'re sorry to see you go.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Redirect to onboarding
                router.replace('/(main)/onboarding');
              },
            },
          ]
        );
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete account');
      }
    } catch (error) {
      console.error('❌ Error deleting account:', error);
      hideLoading();
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to delete account. Please try again or contact support.'
      );
    }
  };

  const loadUserPreferences = async () => {
    try {
      showLoading('Loading preferences...');

      const token = await SecureStore.getItemAsync('authToken');
      const userDataString = await SecureStore.getItemAsync('userData');

      if (!token) {
        Alert.alert('Error', 'Please sign in again');
        hideLoading();
        return;
      }

      // Load user data from secure store
      if (userDataString) {
        const userData = safeJsonParse<UserData>(userDataString, defaultUserData);
        setPreferences(prev => ({
          ...prev,
          name: userData.name || '',
          email: userData.email || ''
        }));
      }

      // Fetch profile data from backend (has bible_version, denomination, etc.)
      const profileResponse = await fetch(API_ENDPOINTS.USERS_PROFILE, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (profileResponse.ok) {
        const profileResult = await profileResponse.json();
        console.log('✅ Loaded profile:', profileResult);

        if (profileResult.user) {
          const user = profileResult.user;
          setPreferences(prev => ({
            ...prev,
            name: user.name || prev.name,
            email: user.email || prev.email,
            bibleVersion: user.bible_version || prev.bibleVersion,
            ageGroup: user.age_group || prev.ageGroup,
            denomination: user.denomination || prev.denomination,
            voiceId: user.voice_id || prev.voiceId,
            voiceName: user.voice_name || prev.voiceName
          }));
        }
      }

      // Also fetch preferences from backend (for faith areas, etc.)
      const response = await fetch(API_ENDPOINTS.USERS_PREFERENCES, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Loaded preferences:', result);

        if (result.data || result.preferences) {
          const prefs = result.data || result.preferences;
          setPreferences(prev => ({
            ...prev,
            referralSource: prefs.referral_source || prefs.referralSource || prev.referralSource,
          }));
        }
      }
    } catch (error) {
      console.error('❌ Error loading preferences:', error);
      Alert.alert('Error', 'Failed to load preferences');
    } finally {
      hideLoading();
    }
  };

  const savePreference = async (key: string, value: any) => {
    try {
      showLoading('Saving...');

      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        Alert.alert('Error', 'Please sign in again');
        hideLoading();
        return;
      }

      const response = await fetch(API_ENDPOINTS.USERS_PREFERENCES, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [key]: value }),
      });

      if (response.ok) {
        console.log(`✅ ${key} updated successfully`);
        Alert.alert('Success', 'Preference updated successfully');

        // Update local state
        setPreferences(prev => ({ ...prev, [key]: value }));

        // Update userData in secure store if it's name or email
        if (key === 'name' || key === 'email') {
          const userDataString = await SecureStore.getItemAsync('userData');
          if (userDataString) {
            const userData = safeJsonParse<UserData>(userDataString, defaultUserData);
            userData[key] = value;
            await SecureStore.setItemAsync('userData', JSON.stringify(userData));
          }
        }
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update preference');
      }
    } catch (error) {
      console.error('❌ Error saving preference:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save preference');
    } finally {
      hideLoading();
    }
  };

  const handleBibleVersionSelect = (version: string) => {
    saveBibleVersion(version);
    setShowBibleVersionModal(false);
  };

  const saveBibleVersion = async (version: string) => {
    try {
      showLoading('Updating Bible version...');

      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        Alert.alert('Error', 'Please sign in again');
        hideLoading();
        return;
      }

      // Use BIBLE_USER_VERSION endpoint to update Bible version
      // This ensures it updates for daily verse AND AI chat
      const response = await fetch(API_ENDPOINTS.BIBLE_USER_VERSION, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bibleVersion: version }),
      });

      if (response.ok) {
        console.log('✅ Bible version updated successfully');

        // Update local state
        setPreferences(prev => ({ ...prev, bibleVersion: version }));

        // Also update USERS_PREFERENCES for consistency
        await fetch(API_ENDPOINTS.USERS_PREFERENCES, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ bibleVersion: version }),
        });

        // HARD REFRESH: Clear cached daily content
        await SecureStore.deleteItemAsync('dailyVerse');
        await SecureStore.deleteItemAsync('dailyPrayer');
        await SecureStore.deleteItemAsync('dailyReflection');
        await SecureStore.deleteItemAsync('lastVerseFetch');
        await SecureStore.deleteItemAsync('lastPrayerFetch');
        await SecureStore.deleteItemAsync('lastReflectionFetch');

        // Update cached user data with new Bible version for AI chat
        const userDataString = await SecureStore.getItemAsync('userData');
        if (userDataString) {
          const userData = safeJsonParse<UserData>(userDataString, defaultUserData);
          userData.bibleVersion = version;
          await SecureStore.setItemAsync('userData', JSON.stringify(userData));
          console.log('✅ AI chat will now use:', version);
        }

        // Set a flag to trigger home screen refresh
        await SecureStore.setItemAsync('bibleVersionChanged', 'true');

        console.log('✅ Bible version updated:', version);
        console.log('✅ Cached data cleared, home screen will refresh');

        Alert.alert(
          'Success',
          `Bible version changed to ${version}. Your daily content will refresh automatically with the new version.`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate back to trigger refresh
                router.back();
              }
            }
          ]
        );

      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update Bible version');
      }
    } catch (error) {
      console.error('❌ Error saving Bible version:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save Bible version');
    } finally {
      hideLoading();
    }
  };

  const handleAgeGroupSelect = (age: string) => {
    savePreference('ageGroup', age);
    setShowAgeGroupModal(false);
  };

  const handleDenominationSelect = (denomination: string) => {
    savePreference('denomination', denomination);
    setShowDenominationModal(false);
  };

  const handleVoiceSelect = async (voice: Speech.Voice) => {
    // Save both voiceId and voiceName
    try {
      showLoading('Saving...');

      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        Alert.alert('Error', 'Please sign in again');
        hideLoading();
        return;
      }

      const response = await fetch(API_ENDPOINTS.USERS_PREFERENCES, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voiceId: voice.identifier,
          voiceName: voice.name
        }),
      });

      if (response.ok) {
        console.log('✅ Voice preference updated successfully');
        Alert.alert('Success', 'Voice preference updated successfully');

        // Update local state
        setPreferences(prev => ({
          ...prev,
          voiceId: voice.identifier,
          voiceName: voice.name
        }));

        // Cache voice in SecureStore for faster TTS loading
        await SecureStore.setItemAsync('userVoiceId', voice.identifier);
        console.log('✅ Voice cached in SecureStore');

        setShowVoiceModal(false);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update voice preference');
      }
    } catch (error) {
      console.error('❌ Error saving voice preference:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save voice preference');
    } finally {
      hideLoading();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header with Back Button */}
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <View style={styles.backIconContainer}>
              <Ionicons
                name="arrow-back"
                size={24}
                color={PRIMARY_COLOR}
              />
            </View>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.headerTitle}>Account Settings</Text>
            <Text style={styles.headerSubtitle}>
              Manage your profile and preferences
            </Text>
          </View>
        </View>

        {/* Profile Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>

          <View style={styles.settingCard}>
            <View style={styles.settingIconContainer}>
              <Ionicons name="person" size={24} color={PRIMARY_COLOR} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Name</Text>
              <Text style={styles.settingValue}>{preferences.name || 'Not set'}</Text>
            </View>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingIconContainer}>
              <Ionicons name="mail" size={24} color={PRIMARY_COLOR} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Email</Text>
              <Text style={styles.settingValue}>{preferences.email || 'Not set'}</Text>
            </View>
          </View>
        </View>

        {/* Bible Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bible Preferences</Text>

          <TouchableOpacity
            style={styles.settingCard}
            onPress={() => setShowBibleVersionModal(true)}
          >
            <View style={styles.settingIconContainer}>
              <Ionicons name="book" size={24} color={PRIMARY_COLOR} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Bible Version</Text>
              <Text style={styles.settingValue}>{preferences.bibleVersion || 'Not set'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={DARK_GRAY} />
          </TouchableOpacity>
        </View>

        {/* Audio Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audio Preferences</Text>

          <TouchableOpacity
            style={styles.settingCard}
            onPress={() => setShowVoiceModal(true)}
          >
            <View style={styles.settingIconContainer}>
              <Ionicons name="volume-high" size={24} color={PRIMARY_COLOR} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Read Aloud Voice</Text>
              <Text style={styles.settingValue}>
                {preferences.voiceName || 'Default'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={DARK_GRAY} />
          </TouchableOpacity>
        </View>

        {/* Personal Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <TouchableOpacity
            style={styles.settingCard}
            onPress={() => setShowAgeGroupModal(true)}
          >
            <View style={styles.settingIconContainer}>
              <Ionicons name="calendar" size={24} color={PRIMARY_COLOR} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Age Group</Text>
              <Text style={styles.settingValue}>{preferences.ageGroup || 'Not set'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={DARK_GRAY} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingCard}
            onPress={() => setShowDenominationModal(true)}
          >
            <View style={styles.settingIconContainer}>
              <Ionicons name="business" size={24} color={PRIMARY_COLOR} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Denomination</Text>
              <Text style={styles.settingValue}>{preferences.denomination || 'Not set'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={DARK_GRAY} />
          </TouchableOpacity>
        </View>

        {/* Danger Zone Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <Text style={styles.dangerZoneDescription}>
            Once you delete your account, there is no going back. Please be certain.
          </Text>

          <TouchableOpacity
            style={styles.deleteAccountButton}
            onPress={handleDeleteAccount}
          >
            <Ionicons name="trash" size={20} color="#fff" />
            <Text style={styles.deleteAccountText}>Delete My Account</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Bible Version Modal */}
      <Modal
        visible={showBibleVersionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBibleVersionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Bible Version</Text>
              <TouchableOpacity onPress={() => setShowBibleVersionModal(false)}>
                <Ionicons name="close" size={24} color={DARK_GRAY} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {BIBLE_VERSIONS.map((version) => (
                <TouchableOpacity
                  key={version.id}
                  style={[
                    styles.modalOption,
                    preferences.bibleVersion === version.id && styles.modalOptionSelected
                  ]}
                  onPress={() => handleBibleVersionSelect(version.id)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[
                      styles.modalOptionText,
                      preferences.bibleVersion === version.id && styles.modalOptionTextSelected
                    ]}>
                      {version.name}
                    </Text>
                    {version.description && (
                      <Text style={styles.bibleDescription}>
                        {version.description}
                      </Text>
                    )}
                  </View>
                  {preferences.bibleVersion === version.id && (
                    <Ionicons name="checkmark-circle" size={20} color={PRIMARY_COLOR} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Age Group Modal */}
      <Modal
        visible={showAgeGroupModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAgeGroupModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Age Group</Text>
              <TouchableOpacity onPress={() => setShowAgeGroupModal(false)}>
                <Ionicons name="close" size={24} color={DARK_GRAY} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {AGE_GROUPS.map((age) => (
                <TouchableOpacity
                  key={age}
                  style={[
                    styles.modalOption,
                    preferences.ageGroup === age && styles.modalOptionSelected
                  ]}
                  onPress={() => handleAgeGroupSelect(age)}
                >
                  <Text style={[
                    styles.modalOptionText,
                    preferences.ageGroup === age && styles.modalOptionTextSelected
                  ]}>
                    {age} years
                  </Text>
                  {preferences.ageGroup === age && (
                    <Ionicons name="checkmark-circle" size={20} color={PRIMARY_COLOR} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Denomination Modal */}
      <Modal
        visible={showDenominationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDenominationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Denomination</Text>
              <TouchableOpacity onPress={() => setShowDenominationModal(false)}>
                <Ionicons name="close" size={24} color={DARK_GRAY} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {DENOMINATIONS.map((denomination) => (
                <TouchableOpacity
                  key={denomination}
                  style={[
                    styles.modalOption,
                    preferences.denomination === denomination && styles.modalOptionSelected
                  ]}
                  onPress={() => handleDenominationSelect(denomination)}
                >
                  <Text style={[
                    styles.modalOptionText,
                    preferences.denomination === denomination && styles.modalOptionTextSelected
                  ]}>
                    {denomination}
                  </Text>
                  {preferences.denomination === denomination && (
                    <Ionicons name="checkmark-circle" size={20} color={PRIMARY_COLOR} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Voice Selection Modal */}
      <Modal
        visible={showVoiceModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowVoiceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Voice</Text>
              <TouchableOpacity onPress={() => setShowVoiceModal(false)}>
                <Ionicons name="close" size={24} color={DARK_GRAY} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <Text style={styles.modalSubtitle}>
                Select your preferred voice for read-aloud features
              </Text>

              {availableVoices.map((voice) => (
                <View
                  key={voice.identifier}
                  style={[
                    styles.modalOption,
                    preferences.voiceId === voice.identifier && styles.modalOptionSelected
                  ]}
                >
                  <TouchableOpacity
                    style={styles.voiceOptionContent}
                    onPress={() => handleVoiceSelect(voice)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[
                        styles.modalOptionText,
                        preferences.voiceId === voice.identifier && styles.modalOptionTextSelected
                      ]}>
                        {voice.name}
                      </Text>
                      <Text style={styles.voiceLanguage}>
                        {voice.language} • {voice.quality}
                      </Text>
                    </View>
                    {preferences.voiceId === voice.identifier && (
                      <Ionicons name="checkmark-circle" size={20} color={PRIMARY_COLOR} />
                    )}
                  </TouchableOpacity>

                  {/* Preview Button */}
                  <TouchableOpacity
                    style={styles.previewButton}
                    onPress={() => {
                      if (previewingVoiceId === voice.identifier) {
                        stopVoicePreview();
                      } else {
                        previewVoice(voice);
                      }
                    }}
                  >
                    <Ionicons
                      name={previewingVoiceId === voice.identifier ? "stop-circle" : "play-circle"}
                      size={28}
                      color={previewingVoiceId === voice.identifier ? SECONDARY_COLOR : PRIMARY_COLOR}
                    />
                  </TouchableOpacity>
                </View>
              ))}

              {availableVoices.length === 0 && (
                <View style={styles.emptyVoices}>
                  <Ionicons name="volume-mute" size={48} color={SOFT_GRAY} />
                  <Text style={styles.emptyVoicesText}>
                    No voices available. Please check your device settings.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: OFF_WHITE,
  },
  container: {
    flex: 1,
    backgroundColor: OFF_WHITE,
    paddingHorizontal: 20,
  },
  headerContainer: {
    marginTop: STATUS_BAR_OFFSET,
    marginBottom: 20,
  },
  backButton: {
    marginBottom: 20,
  },
  backIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: SOFT_GRAY,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    marginTop: 10,
  },
  headerTitle: {
    color: DARK_GRAY,
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'serif',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: '#6c757d',
    fontSize: 16,
    fontFamily: 'serif',
    opacity: 0.8,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: DARK_GRAY,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'serif',
    marginBottom: 12,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: SOFT_GRAY,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: LIGHT_PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    color: '#6c757d',
    fontSize: 14,
    fontFamily: 'serif',
    marginBottom: 4,
  },
  settingValue: {
    color: DARK_GRAY,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'serif',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: SOFT_GRAY,
  },
  modalTitle: {
    color: DARK_GRAY,
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'serif',
  },
  modalContent: {
    padding: 20,
  },
  modalSubtitle: {
    color: '#6c757d',
    fontSize: 14,
    fontFamily: 'serif',
    marginBottom: 16,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: OFF_WHITE,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modalOptionSelected: {
    backgroundColor: LIGHT_PURPLE,
    borderColor: PRIMARY_COLOR,
  },
  modalOptionText: {
    color: DARK_GRAY,
    fontSize: 16,
    fontFamily: 'serif',
    flex: 1,
  },
  modalOptionTextSelected: {
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: SOFT_GRAY,
  },
  saveButton: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'serif',
  },
  voiceLanguage: {
    color: '#6c757d',
    fontSize: 12,
    fontFamily: 'serif',
    marginTop: 4,
  },
  bibleDescription: {
    color: '#6c757d',
    fontSize: 12,
    fontFamily: 'serif',
    marginTop: 4,
  },
  voiceOptionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyVoices: {
    alignItems: 'center',
    padding: 40,
  },
  emptyVoicesText: {
    color: '#6c757d',
    fontSize: 14,
    fontFamily: 'serif',
    textAlign: 'center',
    marginTop: 16,
  },
  dangerZoneDescription: {
    color: '#6c757d',
    fontSize: 14,
    fontFamily: 'serif',
    marginBottom: 16,
    lineHeight: 20,
  },
  deleteAccountButton: {
    backgroundColor: '#dc3545',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  deleteAccountText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'serif',
  },
});

