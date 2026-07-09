import ActivityTrackerService from '@/utils/activityTracker';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, StyleSheet, View } from 'react-native';

export default function Index() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    checkExistingAuth();
    
    const handleAppStateChange = (nextAppState: string) => {
      const activityTracker = ActivityTrackerService.getInstance();
      
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        activityTracker.stopStudySession();
        activityTracker.syncWithAPI();
      } else if (nextAppState === 'active') {
        activityTracker.startStudySession();
        activityTracker.checkAndResetForNewDay();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, []);

  const checkExistingAuth = async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        console.log('🔐 Existing JWT token found on app startup:', token);
        console.log('📝 Existing JWT token length:', token.length);
        console.log('🔍 Existing JWT token preview:', token.substring(0, 50) + '...');
        
        console.log('✅ User authenticated, redirecting to main app');
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

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#7b4d62" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});
