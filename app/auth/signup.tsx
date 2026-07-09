import BackButton from '@/components/BackButton';
import SuccessModal from '@/components/SuccessModal';
import { API_ENDPOINTS } from '@/constants/API';
import NotificationService from '@/utils/notifications';
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

const SignupScreen = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    if (!formData.password) {
      Alert.alert('Error', 'Please enter a password');
      return false;
    }
    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      console.log('📧 Starting email signup process...');
      
      const response = await fetch(API_ENDPOINTS.SIGNUP, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        const errorMessage = responseData.message || responseData.error || 'Signup failed';
        console.error('❌ Signup API error:', responseData);
        throw new Error(errorMessage);
      }

      console.log('✅ Signup successful:', responseData);

      const userDataToStore = {
        name: responseData.user?.name || formData.name,
        email: responseData.user?.email || formData.email,
        userId: responseData.user?.id || responseData.userId,
        token: responseData.token || responseData.access_token,
        signUpDate: new Date().toISOString(),
        signupMethod: 'email'
      };

      if (userDataToStore.token) {
        await SecureStore.setItemAsync('authToken', userDataToStore.token);
      }
      await SecureStore.setItemAsync('userData', JSON.stringify(userDataToStore));
      
      console.log('✅ User data stored successfully');
      
      // Show success modal
      setShowSuccessModal(true);
      
      // Send welcome notification
      await NotificationService.scheduleWelcomeNotification(userDataToStore.name);
      
      // Signup successful - go to main app
      // User can set preferences later from Account Settings
      setTimeout(() => {
        console.log('✅ Signup successful, redirecting to main app');
        router.replace('/(tabs)');
      }, 2200);
    } catch (error) {
      console.error('❌ Email signup error:', error);
      
      let errorMessage = 'Failed to create account. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('email')) {
          errorMessage = 'This email is already registered. Please try signing in instead.';
        } else if (error.message.includes('password')) {
          errorMessage = 'Password does not meet requirements. Please try again.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('Signup Error', errorMessage);
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
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join our community of believers</Text>
            </View>

            {/* Form */}
            <View style={styles.formContainer}>
              {/* Name Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <AntDesign name="user" size={20} color={PRIMARY_COLOR} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor="rgba(123, 77, 98, 0.6)"
                    value={formData.name}
                    onChangeText={(value) => handleInputChange('name', value)}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
              </View>

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
                      name={showPassword ? 'eye' : 'eye-invisible'}
                      size={20}
                      color={PRIMARY_COLOR}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.inputWrapper}>
                  <AntDesign name="lock" size={20} color={PRIMARY_COLOR} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm your password"
                    placeholderTextColor="rgba(123, 77, 98, 0.6)"
                    value={formData.confirmPassword}
                    onChangeText={(value) => handleInputChange('confirmPassword', value)}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeButton}
                  >
                    <AntDesign
                      name={showConfirmPassword ? 'eye' : 'eye-invisible'}
                      size={20}
                      color={PRIMARY_COLOR}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Signup Button */}
              <TouchableOpacity
                style={[styles.signupButton, isLoading && styles.disabledButton]}
                onPress={handleSignup}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={[WHITE, 'rgba(255,255,255,0.9)']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isLoading ? (
                    <AntDesign name="loading" size={20} color={PRIMARY_COLOR} />
                  ) : (
                    <AntDesign name="user" size={20} color={PRIMARY_COLOR} />
                  )}
                  <Text style={styles.signupButtonText}>
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Terms */}
              <Text style={styles.termsText}>
                By creating an account, you agree to our Terms of Service and Privacy Policy
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Success Modal */}
        <SuccessModal
          visible={showSuccessModal}
          title="Welcome!"
          message="Account created successfully! Welcome to Faithful Companion!"
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
    marginBottom: height < 700 ? 20 : 28,
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
    marginBottom: height < 700 ? 12 : 16,
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
  signupButton: {
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
  signupButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
    marginLeft: 10,
  },
  termsText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },
});

export default SignupScreen;

