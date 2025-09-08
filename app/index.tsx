import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function Index() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    checkExistingAuth();
  }, []);

  const checkExistingAuth = async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        // Log the existing JWT token for debugging
        console.log('🔐 Existing JWT token found on app startup:', token);
        console.log('📝 Existing JWT token length:', token.length);
        console.log('🔍 Existing JWT token preview:', token.substring(0, 50) + '...');
        console.log('🚀 Redirecting to tabs index...');
        router.replace('/(tabs)');
      } else {
        console.log('❌ No existing token found on app startup, redirecting to onboarding');
        router.replace('/(main)/onboarding');
      }
    } catch (error) {
      console.error('❌ Error checking existing auth on app startup:', error);
      router.replace('/(main)/onboarding');
    } finally {
      setIsCheckingAuth(false);
    }
  };

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return null; // This should never render as we always redirect
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#7b4d62',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
}); 