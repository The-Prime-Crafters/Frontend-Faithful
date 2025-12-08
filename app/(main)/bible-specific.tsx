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
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

const PRIMARY_COLOR = '#7b4d62';
const SECONDARY_COLOR = '#ce703f';
const WHITE = '#FFFFFF';
const ACCENT_COLOR = '#f4a261';

const STATUS_BAR_OFFSET = Platform.OS === 'android' ? 34 : 10;

export default function BibleSpecificScreen() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const { showLoading, hideLoading } = useLoading();

  const handleContinue = async () => {
    if (input.trim()) {
      try {
        showLoading('Saving preferences...');
        const token = await SecureStore.getItemAsync('authToken');
        
        if (!token) {
          Alert.alert('Error', 'Authentication required');
          return;
        }

        // Update user preferences with bible specific input
        const response = await fetch(API_ENDPOINTS.USERS_PREFERENCES, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bibleSpecific: input.trim(),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        console.log('✅ Bible specific preferences saved successfully');
        router.replace('/(tabs)');
      } catch (error) {
        console.error('❌ Error saving preferences:', error);
        Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save preferences');
      } finally {
        hideLoading();
      }
    }
  };

  // Function to render floating particles
  const renderParticles = () => {
    const particles = [];
    for (let i = 0; i < 6; i++) {
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

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Progress Indicator */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={[WHITE, 'rgba(255,255,255,0.9)']}
                  style={[styles.progressFill, { width: '100%' }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
              <Text style={styles.progressText}>Step 6 of 6</Text>
            </View>

            {/* Header with icon */}
            <View style={styles.headerSection}>
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                  style={styles.iconGradient}
                >
                  <Text style={styles.iconText}>📖</Text>
                </LinearGradient>
              </View>
              
              <Text style={styles.title}>The Bible is vast</Text>
              <Text style={styles.subtitle}>
                Let us know what specific part of your life you want guidance on.
              </Text>
            </View>

            {/* Enhanced input section */}
            <View style={styles.inputSection}>
              <View style={styles.inputLabel}>
                <Text style={styles.labelText}>Share your thoughts</Text>
                <Text style={styles.characterCount}>{input.length}/500</Text>
              </View>
              
              <View style={[
                styles.inputContainer,
                isFocused && styles.inputContainerFocused
              ]}>
                <TextInput
                  style={styles.input}
                  placeholder="I'm looking for guidance on..."
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  value={input}
                  onChangeText={setInput}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  maxLength={500}
                />
                {!input && (
                  <View style={styles.placeholderHint}>
                    <Text style={styles.hintText}>
                      Examples: "Marriage", "Career decisions", "Parenting", "Finding purpose"
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Spacer for better scrolling */}
            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Simple Continue Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !input.trim() && styles.disabledButton,
            ]}
            onPress={handleContinue}
            disabled={!input.trim()}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.continueButtonText,
                !input.trim() && styles.disabledButtonText,
              ]}
            >
              Continue
            </Text>
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
  particlesContainer: {
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
  particlesWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  progressContainer: {
    marginBottom: 30,
    marginTop: 10,
    paddingTop: 60, // Add space for back button
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'serif',
    textAlign: 'center',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconGradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  iconText: {
    fontSize: 28,
  },
  title: {
    fontSize: 28,
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
  inputSection: {
    width: '100%',
    paddingHorizontal: 0,
  },
  inputLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  labelText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'serif',
  },
  characterCount: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontFamily: 'serif',
  },
  inputContainer: {
    position: 'relative',
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  inputContainerFocused: {
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'rgba(255,255,255,0.15)',
    shadowColor: WHITE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  input: {
    minHeight: 120,
    maxHeight: 180,
    color: WHITE,
    fontSize: 16,
    fontFamily: 'serif',
    padding: 20,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  placeholderHint: {
    position: 'absolute',
    bottom: 15,
    left: 20,
    right: 20,
  },
  hintText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  footer: {
    paddingVertical: 20,
    paddingBottom: Platform.OS === 'ios' ? 44 : 30,
    alignItems: 'center',
  },
  continueButton: {
    width: '100%',
    backgroundColor: WHITE,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    shadowOpacity: 0.1,
    elevation: 2,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
    fontFamily: 'serif',
    letterSpacing: 0.5,
  },
  disabledButtonText: {
    color: 'rgba(139, 90, 115, 0.6)',
  },
  backButton: {
    top: 50,
    left: 20,
  },
});