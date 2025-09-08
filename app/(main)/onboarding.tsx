import { AntDesign } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import { Alert, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
      // Step 1: Get OAuth URL from your API
      const response = await fetch('https://33df0b2b10af.ngrok-free.app/api/auth/google/url?platform=mobile');
      const { url } = await response.json();
      
      // Step 2: Open OAuth in browser with callback URL
      const result = await WebBrowser.openAuthSessionAsync(
        url, 
        'exp://127.0.0.1:8081/--/auth/callback'
      );
      
      if (result.type === 'success') {
        console.log('✅ OAuth session completed successfully');
        console.log('🔗 Result URL:', result.url);
        
        // The backend will handle the token exchange and redirect to our callback
        // with the JWT token in the URL parameters. The callback screen will
        // process the token and navigate to the main app.
        
        // Check if the callback URL contains our auth callback
        if (result.url.includes('/auth/callback')) {
          console.log('🔄 Auth callback detected, processing...');
          // The callback screen will handle the rest
        } else {
          // Fallback: try to extract token from URL if it's in the callback
          const urlParams = new URLSearchParams(result.url.split('?')[1]);
          const token = urlParams.get('token');
          
          if (token) {
            console.log('🔐 JWT Token found in callback URL');
            await SecureStore.setItemAsync('authToken', token);
            
            // Extract user data from URL
            const name = urlParams.get('name');
            const email = urlParams.get('email');
            const picture = urlParams.get('picture');
            const userId = urlParams.get('userId');
            
            if (name && email && userId) {
              const userData = {
                name,
                email,
                picture,
                userId: parseInt(userId),
                signUpDate: new Date().toISOString()
              };
              
              await SecureStore.setItemAsync('userData', JSON.stringify(userData));
              console.log('✅ User data stored');
            }
            
            Alert.alert('Success', 'Welcome! You have been signed in successfully.');
            router.replace('/(tabs)');
          } else {
            throw new Error('No token found in callback URL');
          }
        }
      } else if (result.type === 'cancel') {
        console.log('User cancelled the sign-in process');
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      Alert.alert('Error', 'Failed to sign in with Google. Please try again.');
    } finally {
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
          <Text style={styles.heading}>Spiritual Guidance</Text>
          <Text style={styles.subheading}>Find peace and wisdom through sacred texts</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((i) => (
              <AntDesign key={i} name="star" size={24} color="#FFD700" />
            ))}
          </View>
          <Text style={styles.cardText}>Rated 4.9 by 10,000+ users</Text>
          <Text style={styles.review}>"This app transformed my spiritual journey. The insights are profound yet accessible."</Text>
          <Text style={styles.author}>- Sarah J.</Text>
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
            style={[styles.button, styles.guestButton]}
            onPress={() => router.push('/testimonialscreen2')}
          >
            <Text style={[styles.buttonText, styles.guestButtonText]}>Continue as Guest</Text>
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
    width: width * 0.5,
    height: width * 0.5,
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
  guestButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: WHITE,
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
  guestButtonText: {
    color: WHITE,
  },
});

export default OnboardingScreen;
