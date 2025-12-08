import { useLoading } from '@/contexts/LoadingContext';
import ActivityTrackerService from '@/utils/activityTracker';
import { checkProfileCompletion } from '@/utils/profileCompletion';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

export default function Index() {
  const router = useRouter();
  const { showLoading, hideLoading } = useLoading();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    checkExistingAuth();
    
    // Set up app state change listener for activity tracking
    const handleAppStateChange = (nextAppState: string) => {
      const activityTracker = ActivityTrackerService.getInstance();
      
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App is going to background, stop study session and sync data
        activityTracker.stopStudySession();
        activityTracker.syncWithAPI();
      } else if (nextAppState === 'active') {
        // App is becoming active, start study session
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
      showLoading('Checking authentication...');
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        // Log the existing JWT token for debugging
        console.log('🔐 Existing JWT token found on app startup:', token);
        console.log('📝 Existing JWT token length:', token.length);
        console.log('🔍 Existing JWT token preview:', token.substring(0, 50) + '...');
        
        // Check if user has completed profile setup
        const profileStatus = await checkProfileCompletion();
        console.log('📊 Profile completion status on startup:', profileStatus);
        
        if (profileStatus.isComplete) {
          console.log('✅ Profile complete, redirecting to main app');
          router.replace('/(tabs)');
        } else {
          console.log('⚠️ Profile incomplete, redirecting to onboarding');
          router.replace('/(main)/testimonialscreen2');
        }
      } else {
        console.log('❌ No existing token found on app startup, redirecting to onboarding');
        router.replace('/(main)/onboarding');
      }
    } catch (error) {
      console.error('❌ Error checking existing auth on app startup:', error);
      router.replace('/(main)/onboarding');
    } finally {
      hideLoading();
      setIsCheckingAuth(false);
    }
  };

  return null; // This should never render as we always redirect
}
