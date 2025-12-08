import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Google Calendar OAuth Callback Handler
 * This screen is shown briefly after OAuth redirect
 * Then immediately redirects to the reading (study groups) tab
 */
export default function GoogleCalendarCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    console.log('📅 Google Calendar callback received');
    console.log('📋 Callback params:', params);
    
    const handleCallback = async () => {
      // Check if authentication was successful
      const success = params.success === 'true' || !params.error;
      
      if (success) {
        console.log('✅ Calendar authentication successful');
        
        // Set a flag to indicate calendar was just connected
        // The reading screen will check this flag and show success message
        await SecureStore.setItemAsync('calendarJustConnected', 'true');
      } else {
        console.log('❌ Calendar authentication failed:', params.error);
        await SecureStore.setItemAsync('calendarJustConnected', 'false');
      }
      
      // Small delay to ensure the flag is stored
      setTimeout(() => {
        console.log('🔄 Redirecting to reading tab (study groups)...');
        
        // Navigate to the reading tab where study groups are
        router.replace('/(tabs)/reading');
      }, 300);
    };
    
    handleCallback();
  }, [params]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#7b4d62" />
      <Text style={styles.text}>Connecting calendar...</Text>
      <Text style={styles.subtext}>Redirecting to study groups...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#495057',
    fontFamily: 'serif',
  },
  subtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#6c757d',
    fontFamily: 'serif',
  },
});

