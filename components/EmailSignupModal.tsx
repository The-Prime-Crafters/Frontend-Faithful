import { AntDesign } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const PRIMARY_COLOR = '#7b4d62'; // Purple
const SECONDARY_COLOR = '#ce703f'; // Orange
const WHITE = '#FFFFFF';

interface EmailSignupModalProps {
  visible: boolean;
  onClose: () => void;
  onSignup: (userData: { name: string; email: string; password: string }) => void;
}

const EmailSignupModal: React.FC<EmailSignupModalProps> = ({ visible, onClose, onSignup }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      // Call the parent component's signup handler
      await onSignup({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });
      
      // Reset form on success
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
      });
      
      // Close modal (success message will be shown by parent)
      onClose();
    } catch (error) {
      // Error handling is done by the parent component
      console.error('Signup error in modal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.modalWrapper}>
          <LinearGradient
            colors={[PRIMARY_COLOR, SECONDARY_COLOR]}
            style={styles.modalContainer}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity 
                onPress={onClose} 
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <AntDesign name="close" size={32} color={WHITE} />
              </TouchableOpacity>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join our community of believers</Text>
            </View>

            {/* Scrollable Form */}
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
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
                        name={showPassword ? 'eye' : 'eyeo'}
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
                        name={showConfirmPassword ? 'eye' : 'eyeo'}
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
                      <AntDesign name="loading1" size={20} color={PRIMARY_COLOR} />
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
          </LinearGradient>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  modalContainer: {
    width: width * 0.92,
    maxHeight: height * 0.85,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  header: {
    padding: 16,
    paddingTop: 20,
    alignItems: 'center',
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    right: 15,
    padding: 5,
    zIndex: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: WHITE,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 5,
  },
  inputContainer: {
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: WHITE,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: PRIMARY_COLOR,
    fontWeight: '500',
  },
  eyeButton: {
    padding: 4,
  },
  signupButton: {
    marginTop: 16,
    marginBottom: 12,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
  },
  disabledButton: {
    opacity: 0.6,
  },
  signupButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
    marginLeft: 10,
  },
  termsText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 15,
    paddingHorizontal: 5,
  },
});

export default EmailSignupModal;
