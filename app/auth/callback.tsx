import { useRouter, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';

const PRIMARY_COLOR = '#7b4d62';
const WHITE = '#FFFFFF';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    processAuthCallback();
  }, []);

  const processAuthCallback = async () => {
    try {
      console.log('🔄 Processing auth callback...');
      console.log('📋 Callback params:', params);

      // Extract token and user data from URL parameters
      const token = params.token as string;
      const name = params.name as string;
      const email = params.email as string;
      const picture = params.picture as string;
      const userId = params.userId as string;

      if (!token) {
        throw new Error('No JWT token received in callback');
      }

      console.log('🔐 JWT Token received in callback:', token);
      console.log('📝 JWT Token length:', token.length);
      console.log('🔍 JWT Token preview:', token.substring(0, 50) + '...');
      console.log('👤 User data:', { name, email, userId });

      // Store token securely
      await SecureStore.setItemAsync('authToken', token);
      console.log('✅ JWT Token stored securely');

      // Store user data with sign-up date
      const userData = {
        name,
        email,
        picture,
        userId: parseInt(userId),
        signUpDate: new Date().toISOString()
      };

      await SecureStore.setItemAsync('userData', JSON.stringify(userData));
      console.log('✅ User data stored with sign-up date');

      // Show success message
      Alert.alert('Success', 'Welcome! You have been signed in successfully.', [
        {
          text: 'OK',
          onPress: () => {
            // Navigate to main app
            router.replace('/(tabs)');
          }
        }
      ]);

    } catch (error) {
      console.error('❌ Error processing auth callback:', error);
      Alert.alert('Error', 'Failed to complete sign-in. Please try again.', [
        {
          text: 'OK',
          onPress: () => {
            // Navigate back to onboarding
            router.replace('/(main)/onboarding');
          }
        }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.loadingText}>
        {isProcessing ? 'Completing sign-in...' : 'Processing complete'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PRIMARY_COLOR,
  },
  loadingText: {
    color: WHITE,
    fontSize: 18,
    fontWeight: '600',
  },
});
