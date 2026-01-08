import ErrorBoundary from '@/components/ErrorBoundary';
import GlobalLoadingWrapper from '@/components/GlobalLoadingWrapper';
import { LoadingProvider } from '@/contexts/LoadingContext';
import AppSessionTracker from '@/utils/appSessionTracker';
import NotificationService from '@/utils/notifications';
import StreakTracker from '@/utils/streakTracker';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import 'react-native-reanimated';

export default function RootLayout() {
  const router = useRouter();
  const appState = useRef(AppState.currentState);
  const sessionTracker = useRef<AppSessionTracker | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    console.log('🎯 Initializing Faithful Companion app...');
    
    // Initialize session tracker (uses /api/users/app-session endpoint)
    // This handles: session tracking, streaks, XP, gamification, and usage stats
    sessionTracker.current = AppSessionTracker.getInstance();
    
    // Defer session start to allow UI to render first
    const sessionStartTimeout = setTimeout(() => {
      if (isMounted.current && sessionTracker.current) {
        sessionTracker.current.startSession();
      }
    }, 1000); // Wait 1 second before making API calls
    
    // Initialize streak tracker for legacy compatibility
    const streakTracker = StreakTracker.getInstance();
    
    // Initialize push notifications (defer to not block UI)
    const notificationTimeout = setTimeout(() => {
      if (isMounted.current) {
        const initializeNotifications = async () => {
          try {
            await NotificationService.registerForPushNotifications();
          } catch (error) {
            console.error('❌ Error initializing notifications:', error);
          }
        };
        initializeNotifications();
      }
    }, 2000); // Wait 2 seconds

    // Listen for app state changes (background/foreground)
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (!isMounted.current) return;
      
      console.log('📱 App state changed:', appState.current, '→', nextAppState);
      
      if (sessionTracker.current) {
        sessionTracker.current.handleAppStateChange(nextAppState);
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Handle deep links
    const handleDeepLink = async (event: { url: string }) => {
      if (!isMounted.current) return;
      
      const { url } = event;
      console.log('🔗 Deep link received:', url);
      
      try {
        if (url.includes('auth/callback') || url.includes('auth%2Fcallback')) {
          console.log('✅ Auth callback detected!');
          const { queryParams } = Linking.parse(url);
          console.log('📋 Query params:', queryParams);
          
          // Check for error parameter first
          const error = queryParams?.error as string;
          const errorDescription = queryParams?.error_description as string;
          
          if (error) {
            console.error('❌ OAuth error received:', error);
            console.error('Error description:', errorDescription);
            
            // Show error to user
            const errorMessage = errorDescription || error || 'Authentication failed';
            // We can't use Alert here directly, but we can log it
            // The user will see it in the WebBrowser result handler
            console.error('💥 Authentication error:', errorMessage);
            return;
          }
          
          const token = queryParams?.token as string;
          const name = queryParams?.name as string;
          const email = queryParams?.email as string;
          const picture = queryParams?.picture as string;
          const userId = queryParams?.userId as string;
          
          if (token) {
            console.log('💾 Storing auth data...');
            await SecureStore.setItemAsync('authToken', token);
            
            if (name && email && userId) {
              const userData = {
                name,
                email,
                picture,
                userId: parseInt(userId),
                signUpDate: new Date().toISOString(),
                signupMethod: 'google'
              };
              await SecureStore.setItemAsync('userData', JSON.stringify(userData));
              console.log('✅ User data stored:', { name, email, userId });
            }
            
            if (isMounted.current) {
              console.log('✅ Auth complete! Redirecting to main app...');
              router.replace('/(tabs)');
            }
          } else {
            console.error('❌ No token found in callback URL');
          }
        }
      } catch (error) {
        console.error('❌ Error handling deep link:', error);
      }
    };

    // Listen for incoming deep links
    const linkingSubscription = Linking.addEventListener('url', handleDeepLink);

    // Check if app was opened with a deep link
    Linking.getInitialURL().then((url) => {
      if (url && isMounted.current) {
        console.log('🔗 App opened with URL:', url);
        handleDeepLink({ url });
      }
    }).catch(error => {
      console.error('❌ Error getting initial URL:', error);
    });

    // Handle notification responses (when user taps on a notification)
    const notificationResponseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      if (!isMounted.current) return;
      
      console.log('📬 Notification tapped:', response.notification.request.content.data);
      const data = response.notification.request.content.data;
      
      try {
        // Handle different notification types
        if (data.type === 'prayer_response') {
          // Navigate to prayer tab and show the specific prayer request
          router.push({
            pathname: '/(tabs)/prayer',
            params: { 
              requestId: data.requestId,
              tab: 'my-prayers'
            }
          });
        } else if (data.type === 'journey_reminder' || data.type === 'day-complete') {
          // Navigate to chat/journey tab
          router.push('/(tabs)/chat');
        } else if (data.type === 'daily_verse') {
          // Navigate to home tab (where daily verse is displayed)
          router.push('/(tabs)/index');
        } else if (data.type === 'daily_prayer') {
          // Navigate to prayer tab
          router.push('/(tabs)/prayer');
        } else if (data.type === 'daily_reflection') {
          // Navigate to home tab (where reflections are)
          router.push('/(tabs)/index');
        }
      } catch (error) {
        console.error('❌ Error handling notification response:', error);
      }
    });

    // Handle notifications received while app is in foreground
    const notificationReceivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log('📬 Notification received:', notification.request.content);
    });

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up app...');
      isMounted.current = false;
      
      // Clear timeouts
      clearTimeout(sessionStartTimeout);
      clearTimeout(notificationTimeout);
      
      // Remove event listeners
      linkingSubscription.remove();
      subscription.remove();
      notificationResponseSubscription.remove();
      notificationReceivedSubscription.remove();
      
      // End session when app unmounts
      if (sessionTracker.current) {
        sessionTracker.current.endSession();
      }
    };
  }, []);

  return (
    <ErrorBoundary>
      <LoadingProvider>
        <GlobalLoadingWrapper>
          <Stack>
            <Stack.Screen 
              name="index"
              options={{ 
                headerShown: false,
              }} 
            />
            {/* <Stack.Screen 
              name="splash" 
              options={{ 
                headerShown: false,
              }} 
            /> */}
            
            <Stack.Screen 
              name="(main)" 
              options={{ 
                headerShown: false,
              }} 
            />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="auth" options={{ headerShown: false }} />
            <Stack.Screen 
              name="account-settings" 
              options={{ 
                headerShown: false,
              }} 
            />
            <Stack.Screen 
              name="notification-settings" 
              options={{ 
                headerShown: false,
              }} 
            />
            <Stack.Screen 
              name="help-support" 
              options={{ 
                headerShown: false,
              }} 
            />
            <Stack.Screen name="+not-found" />
          </Stack>
        </GlobalLoadingWrapper>
      </LoadingProvider>
    </ErrorBoundary>
  );
}