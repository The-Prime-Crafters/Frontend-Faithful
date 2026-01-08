import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

/**
 * Auth Callback Screen
 * 
 * This screen handles the OAuth callback from Google authentication.
 * It extracts the token and user data from the URL query parameters,
 * saves them to SecureStore, and navigates to the main app.
 * 
 * URL format: faithfulcompanion://auth/callback?token=...&name=...&email=...&picture=...&userId=...
 */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    handleAuthCallback();
  }, []);

  const handleAuthCallback = async () => {
    try {
      console.log('🔐 Auth callback screen loaded');
      console.log('📋 Route params:', params);
      
      // Try to get query params from multiple sources
      let queryParams: any = null;
      
      // 1. First try route params (most reliable for expo-router)
      if (params && Object.keys(params).length > 0) {
        console.log('✅ Using route params');
        queryParams = params;
      } else {
        // 2. Fallback to Linking API
        const url = await Linking.getInitialURL();
        console.log('🔗 Linking URL:', url);
        
        if (url) {
          const parsed = Linking.parse(url);
          queryParams = parsed.queryParams;
          console.log('✅ Using Linking params');
        }
      }
      
      console.log('📋 Final query params:', queryParams);
      
      if (!queryParams || Object.keys(queryParams).length === 0) {
        console.error('❌ No query parameters found');
        setStatus('error');
        setErrorMessage('No authentication data received');
        Alert.alert(
          'Error',
          'No authentication data received. Please try signing in again.',
          [{ text: 'OK', onPress: () => router.replace('/(main)/onboarding') }]
        );
        return;
      }

      // Check for error parameter first
      const error = queryParams?.error as string;
      const errorDescription = queryParams?.error_description as string;
      const message = queryParams?.message as string;

      if (error) {
        console.error('❌ OAuth error:', error);
        const fullErrorMessage = errorDescription || message || error || 'Authentication failed';
        setStatus('error');
        setErrorMessage(fullErrorMessage);
        
        Alert.alert(
          'Authentication Failed',
          fullErrorMessage,
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(main)/onboarding'),
            },
          ]
        );
        return;
      }

      // Extract authentication data
      const token = queryParams?.token as string;
      const name = queryParams?.name as string;
      const email = queryParams?.email as string;
      const picture = queryParams?.picture as string;
      const userId = queryParams?.userId as string;

      console.log('📦 Extracted data:', {
        hasToken: !!token,
        tokenLength: token?.length,
        name,
        email,
        userId,
      });

      if (!token) {
        console.error('❌ No token found in URL');
        setStatus('error');
        setErrorMessage('No authentication token received');
        
        Alert.alert(
          'Authentication Failed',
          'No authentication token received. Please try again.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(main)/onboarding'),
            },
          ]
        );
        return;
      }

      // Save token to SecureStore
      console.log('💾 Saving auth token...');
      await SecureStore.setItemAsync('authToken', token);
      console.log('✅ Token saved successfully');

      // Save user data if available
      if (name && email && userId) {
        const userData = {
          name,
          email,
          picture: picture || '',
          userId: parseInt(userId),
          signUpDate: new Date().toISOString(),
          signupMethod: 'google',
        };

        console.log('💾 Saving user data...');
        await SecureStore.setItemAsync('userData', JSON.stringify(userData));
        console.log('✅ User data saved:', { name, email, userId });
      } else {
        console.warn('⚠️ Incomplete user data:', { name, email, userId });
      }

      // Show success status briefly
      setStatus('success');

      // For Google OAuth users, skip onboarding and go directly to main app
      // They already provided their basic info through Google
      console.log('✅ Google OAuth sign-up complete - redirecting to main app');
      console.log('💡 User can complete additional preferences from Account Settings if needed');
      
      // Small delay to show success message
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 500);

    } catch (error) {
      console.error('💥 Error handling auth callback:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      setStatus('error');
      setErrorMessage(errorMsg);
      
      Alert.alert(
        'Error',
        `Failed to complete authentication: ${errorMsg}`,
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(main)/onboarding'),
          },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      {status === 'processing' && (
        <>
          <ActivityIndicator size="large" color="#7b4d62" />
          <Text style={styles.text}>Completing sign in...</Text>
          <Text style={styles.subtext}>Please wait</Text>
        </>
      )}

      {status === 'success' && (
        <>
          <Text style={styles.successText}>✅</Text>
          <Text style={styles.text}>Success!</Text>
          <Text style={styles.subtext}>Redirecting you to the app...</Text>
        </>
      )}

      {status === 'error' && (
        <>
          <Text style={styles.errorText}>❌</Text>
          <Text style={styles.text}>Authentication Failed</Text>
          <Text style={styles.subtext}>{errorMessage}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    textAlign: 'center',
  },
  subtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  successText: {
    fontSize: 60,
  },
  errorText: {
    fontSize: 60,
  },
});

