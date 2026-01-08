import { API_ENDPOINTS } from '@/constants/API';
import { AntDesign } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import { Alert, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// This is required for the auth session to complete properly
WebBrowser.maybeCompleteAuthSession();

const { width } = Dimensions.get('window');

const PRIMARY_COLOR = '#7b4d62'; // Purple
const SECONDARY_COLOR = '#ce703f'; // Orange
const WHITE = '#FFFFFF';

const OnboardingScreen = () => {
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const googleSignIn = async () => {
    if (isSigningIn) return; // Prevent multiple calls
    
    setIsSigningIn(true);
    try {
      console.log('🟢🟢🟢 STARTING GOOGLE SIGN-IN 🟢🟢🟢');
      
      // Step 1: Get OAuth URL from your API
      console.log('🔗 Fetching OAuth URL from backend...');
      console.log('🌐 URL:', `${API_ENDPOINTS.GOOGLE_AUTH_URL}?platform=mobile`);
      const response = await fetch(`${API_ENDPOINTS.GOOGLE_AUTH_URL}?platform=mobile`);
      
      // Check if response is OK
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Backend error:', response.status, response.statusText);
        console.error('❌ Response body:', errorText.substring(0, 500));
        throw new Error(`Backend returned ${response.status}: ${response.statusText}. Please check if the backend server is running.`);
      }
      
      const data = await response.json();
      const url = data.url;
      
      if (!url) {
        console.error('❌ No URL in response:', data);
        throw new Error('Backend did not return an OAuth URL');
      }
      
      console.log('🔗 Got OAuth URL from backend');
      
      // Step 2: Open OAuth in browser with callback URL
      console.log('📱 Opening WebBrowser for OAuth...');
      console.log('🔗 Backend will redirect to: faithfulcompanion://auth/callback');
      
      // Use openAuthSessionAsync for OAuth flow
      // In Expo Go, the redirect may not work automatically
      const result = await WebBrowser.openAuthSessionAsync(
        url,
        'faithfulcompanion://auth/callback'
      );
      
      console.log('✅ Auth session completed');
      console.log('🔍 Result type:', result.type);
      
      // Handle different result types
      if (result.type === 'success') {
        console.log('✅ OAuth flow completed successfully');
        console.log('🔗 Callback URL:', result.url);
      } else if (result.type === 'cancel') {
        console.log('❌ User cancelled the OAuth flow');
        Alert.alert('Cancelled', 'Sign in was cancelled');
      } else if (result.type === 'dismiss') {
        // Browser was dismissed - auth may have succeeded
        // The deep link handler will process it
        console.log('⚠️ Browser dismissed - waiting for auth callback...');
        Alert.alert(
          'Almost there!',
          'If you signed in successfully, the app should update automatically. If not, please try again.',
          [{ text: 'OK' }]
        );
      } else {
        console.log('⚠️ OAuth flow ended with type:', result.type);
      }
    } catch (error) {
      console.error('💥💥💥 GOOGLE SIGN-IN ERROR 💥💥💥');
      console.error('Error type:', typeof error);
      console.error('Error message:', (error as any)?.message);
      console.error('Error stack:', (error as any)?.stack);
      console.error('Full error:', JSON.stringify(error, null, 2));
      Alert.alert('Error', `Failed to sign in with Google: ${(error as any)?.message || 'Unknown error'}`);
    } finally {
      console.log('🔄 Resetting isSigningIn state');
      setIsSigningIn(false);
    }
  };

  return (
    <LinearGradient
      colors={[PRIMARY_COLOR, SECONDARY_COLOR]}
      style={styles.container}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.headingContainer}>
          <Text style={styles.heading}>Faithful Companion</Text>
          <Text style={styles.subheading}>Your personal journey of faith, growth, and community awaits</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((i) => (
              <AntDesign key={i} name="star" size={24} color="#FFD700" />
            ))}
          </View>
          <Text style={styles.cardText}>Rated 4.9 by 15,000+ believers</Text>
          <Text style={styles.review}>"Faithful has become my daily companion. The prayer community and personalized devotions have deepened my relationship with God in ways I never expected."</Text>
          <Text style={styles.author}>- Maria Rodriguez</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.googleButton, isSigningIn && styles.disabledButton]}
            onPress={googleSignIn}
            disabled={isSigningIn}
          >
            <AntDesign name="google" size={20} color={PRIMARY_COLOR} />
            <Text style={[styles.buttonText, styles.googleButtonText]}>
              {isSigningIn ? 'Signing in...' : 'Sign up with Google'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.emailButton]}
            onPress={() => router.push('/auth/signup')}
          >
            <AntDesign name="mail" size={20} color={WHITE} />
            <Text style={[styles.buttonText, styles.emailButtonText]}>
              Sign up with Email
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.loginButton]}
            onPress={() => router.push('/auth/login')}
          >
            <AntDesign name="login" size={20} color={WHITE} />
            <Text style={[styles.buttonText, styles.loginButtonText]}>
              Already have an account? Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: width * 0.35,
    height: width * 0.35,
  },
  headingContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  heading: {
    fontSize: 32,
    fontWeight: 'bold',
    color: WHITE,
    textAlign: 'center',
    marginBottom: 10,
  },
  subheading: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    maxWidth: '85%',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 30,
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
  },
  starsRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  cardText: {
    color: WHITE,
    fontSize: 16,
    marginBottom: 10,
  },
  review: {
    color: WHITE,
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: 6,
  },
  author: {
    color: WHITE,
    fontSize: 13,
    alignSelf: 'flex-end',
    opacity: 0.8,
  },
  buttonContainer: {
    marginTop: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  googleButton: {
    backgroundColor: WHITE,
  },
  emailButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  loginButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  googleButtonText: {
    color: PRIMARY_COLOR,
  },
  emailButtonText: {
    color: WHITE,
  },
  loginButtonText: {
    color: WHITE,
    fontSize: 14,
  },
});

export default OnboardingScreen;

