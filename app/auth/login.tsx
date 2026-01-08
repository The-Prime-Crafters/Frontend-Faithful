import BackButton from '@/components/BackButton';
import SuccessModal from '@/components/SuccessModal';
import { API_ENDPOINTS } from '@/constants/API';
import { checkProfileCompletion } from '@/utils/profileCompletion';
import { AntDesign } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

// Calculate safe padding based on device
const getStatusBarHeight = () => {
  if (Platform.OS === 'android') {
    return StatusBar.currentHeight || 24;
  }
  // For iOS, SafeAreaView handles it automatically
  return 0;
};

const getResponsivePadding = () => {
  // Adjust padding based on screen height
  if (height < 700) {
    return 20; // Smaller devices (iPhone SE, etc)
  } else if (height < 800) {
    return 30; // Medium devices (iPhone 12/13, etc)
  } else {
    return 40; // Larger devices (iPhone Pro Max, etc)
  }
};

const PRIMARY_COLOR = '#7b4d62'; // Purple
const SECONDARY_COLOR = '#ce703f'; // Orange
const WHITE = '#FFFFFF';

const LoginScreen = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    if (!formData.password) {
      Alert.alert('Error', 'Please enter your password');
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      console.log('🔐 Starting login process...');
      
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
        }),
      });

      // Handle non-JSON responses
      let responseData;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          // Backend returned non-JSON (HTML/text)
          const errorText = await response.text();
          console.error('❌ Backend returned non-JSON response:', errorText);
          throw new Error(`Server error (${response.status}): ${errorText.substring(0, 100)}`);
        }
      } catch (parseError) {
        if (parseError instanceof Error && parseError.message.includes('Server error')) {
          throw parseError;
        }
        console.error('❌ Error parsing login response:', parseError);
        throw new Error(`Server error (${response.status}): Unable to parse response`);
      }

      if (!response.ok) {
        const errorMessage = responseData.message || responseData.error || 'Login failed';
        console.error('❌ Login API error:', responseData);
        throw new Error(errorMessage);
      }

      console.log('✅ Login successful:', responseData);

      const userDataToStore = {
        name: responseData.user?.name || responseData.name,
        email: responseData.user?.email || formData.email,
        userId: responseData.user?.id || responseData.userId,
        token: responseData.token || responseData.access_token,
        picture: responseData.user?.picture || null, // Include profile picture from backend
        signUpDate: responseData.user?.createdAt || new Date().toISOString(),
        signupMethod: 'email'
      };

      if (userDataToStore.token) {
        await SecureStore.setItemAsync('authToken', userDataToStore.token);
      }
      await SecureStore.setItemAsync('userData', JSON.stringify(userDataToStore));
      
      console.log('✅ User data stored successfully');
      
      // Show success modal
      setShowSuccessModal(true);
      
      // Login successful - go to main app
      // User already has an account, no need for onboarding
      setTimeout(() => {
        console.log('✅ Login successful, redirecting to main app');
            router.replace('/(tabs)');
      }, 2200);
    } catch (error) {
      console.error('❌ Login error:', error);
      
      let errorMessage = 'Failed to sign in. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('email') || error.message.includes('password')) {
          errorMessage = 'Invalid email or password. Please check your credentials.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('Login Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={[PRIMARY_COLOR, SECONDARY_COLOR]}
        style={styles.container}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        <BackButton />
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/images/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to your account</Text>
            </View>

            {/* Form */}
            <View style={styles.formContainer}>
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <AntDesign name="mail" size={20} color={PRIMARY_COLOR} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor="rgba(123, 77, 98, 0.6)"
                    value={formData.email}
                    onChangeText={(value) => handleInputChange('email', value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrapper}>
                  <AntDesign name="lock" size={20} color={PRIMARY_COLOR} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor="rgba(123, 77, 98, 0.6)"
                    value={formData.password}
                    onChangeText={(value) => handleInputChange('password', value)}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    <AntDesign
                      name={showPassword ? 'eye' : 'eyeo'}
                      size={20}
                      color={PRIMARY_COLOR}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.disabledButton]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={[WHITE, 'rgba(255,255,255,0.9)']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isLoading ? (
                    <AntDesign name="loading1" size={20} color={PRIMARY_COLOR} />
                  ) : (
                    <AntDesign name="login" size={20} color={PRIMARY_COLOR} />
                  )}
                  <Text style={styles.loginButtonText}>
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Forgot Password */}
              <TouchableOpacity style={styles.forgotPasswordButton}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Success Modal */}
        <SuccessModal
          visible={showSuccessModal}
          title="Welcome Back!"
          message="You have been signed in successfully"
          onClose={() => setShowSuccessModal(false)}
          autoCloseDuration={2000}
        />
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Math.min(width * 0.07, 28),
    paddingTop: getResponsivePadding() + getStatusBarHeight(),
    paddingBottom: Math.max(height * 0.05, 20),
    minHeight: height,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: height < 700 ? 15 : 20,
    marginTop: height < 700 ? 10 : 20,
  },
  logo: {
    width: Math.min(width * 0.25, 100),
    height: Math.min(width * 0.25, 100),
  },
  header: {
    alignItems: 'center',
    marginBottom: height < 700 ? 24 : 36,
  },
  title: {
    fontSize: height < 700 ? 24 : 28,
    fontWeight: 'bold',
    color: WHITE,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: height < 700 ? 14 : 15,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: height < 700 ? 16 : 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: WHITE,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: PRIMARY_COLOR,
    fontWeight: '500',
  },
  eyeButton: {
    padding: 8,
  },
  loginButton: {
    marginTop: 24,
    marginBottom: 16,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
    marginLeft: 10,
  },
  forgotPasswordButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;

