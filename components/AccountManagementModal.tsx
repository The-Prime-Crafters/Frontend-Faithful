import { API_ENDPOINTS } from '@/constants/API';
import { useLoading } from '@/contexts/LoadingContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import {
    Alert,
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

interface UserData {
  name: string;
  email: string;
  profileImage?: string;
}

interface AccountManagementModalProps {
  visible: boolean;
  onClose: () => void;
  userData: UserData | null;
  onUpdateSuccess: (updatedData: UserData) => void;
}

const PRIMARY_COLOR = '#7b4d62';
const SECONDARY_COLOR = '#ce703f';
const WHITE = '#FFFFFF';
const SOFT_GRAY = '#8E8E93';
const DARK_GRAY = '#1C1C1E';

export default function AccountManagementModal({
  visible,
  onClose,
  userData,
  onUpdateSuccess,
}: AccountManagementModalProps) {
  const { showLoading, hideLoading } = useLoading();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    if (visible && userData) {
      setName(userData.name || '');
      setEmail(userData.email || '');
      setNameError('');
      setEmailError('');
    }
  }, [visible, userData]);

  const validateName = (name: string): boolean => {
    if (!name.trim()) {
      setNameError('Name is required');
      return false;
    }
    if (name.trim().length < 2) {
      setNameError('Name must be at least 2 characters');
      return false;
    }
    setNameError('');
    return true;
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(email.trim())) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleUpdateName = async () => {
    if (!validateName(name)) return;

    try {
      showLoading('Updating name...');
      const token = await SecureStore.getItemAsync('authToken');
      
      if (!token) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      const response = await fetch(API_ENDPOINTS.USERS_PROFILE, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Name updated successfully:', result);

      // Update local storage
      const updatedUserData = { ...userData, name: name.trim() };
      await SecureStore.setItemAsync('userData', JSON.stringify(updatedUserData));
      
      onUpdateSuccess(updatedUserData);
      Alert.alert('Success', 'Name updated successfully!');
    } catch (error) {
      console.error('❌ Error updating name:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update name');
    } finally {
      hideLoading();
    }
  };

  const handleUpdateEmail = async () => {
    if (!validateEmail(email)) return;

    try {
      showLoading('Updating email...');
      const token = await SecureStore.getItemAsync('authToken');
      
      if (!token) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      const response = await fetch(API_ENDPOINTS.USERS_EMAIL, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Email updated successfully:', result);

      // Update local storage
      const updatedUserData = { ...userData, email: email.trim() };
      await SecureStore.setItemAsync('userData', JSON.stringify(updatedUserData));
      
      onUpdateSuccess(updatedUserData);
      Alert.alert('Success', 'Email updated successfully!');
    } catch (error) {
      console.error('❌ Error updating email:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update email');
    } finally {
      hideLoading();
    }
  };

  const handleSaveAll = async () => {
    const isNameValid = validateName(name);
    const isEmailValid = validateEmail(email);

    if (!isNameValid || !isEmailValid) {
      Alert.alert('Validation Error', 'Please fix the errors before saving');
      return;
    }

    try {
      showLoading('Updating account...');
      const token = await SecureStore.getItemAsync('authToken');
      
      if (!token) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      // Update name
      const nameResponse = await fetch(API_ENDPOINTS.USERS_PROFILE, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!nameResponse.ok) {
        const errorData = await nameResponse.json();
        throw new Error(errorData.message || 'Failed to update name');
      }

      // Update email
      const emailResponse = await fetch(API_ENDPOINTS.USERS_EMAIL, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!emailResponse.ok) {
        const errorData = await emailResponse.json();
        throw new Error(errorData.message || 'Failed to update email');
      }

      console.log('✅ Account updated successfully');

      // Update local storage
      const updatedUserData = { ...userData, name: name.trim(), email: email.trim() };
      await SecureStore.setItemAsync('userData', JSON.stringify(updatedUserData));
      
      onUpdateSuccess(updatedUserData);
      Alert.alert('Success', 'Account updated successfully!');
    } catch (error) {
      console.error('❌ Error updating account:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update account');
    } finally {
      hideLoading();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={onClose} 
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={32} color={DARK_GRAY} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Manage Account</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Name Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Name</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, nameError ? styles.inputError : null]}
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (nameError) setNameError('');
                  }}
                  placeholder="Enter your name"
                  placeholderTextColor={SOFT_GRAY}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={[styles.updateButton, name.trim() === userData?.name ? styles.updateButtonDisabled : null]}
                  onPress={handleUpdateName}
                  disabled={name.trim() === userData?.name || !name.trim()}
                >
                  <Ionicons name="checkmark" size={20} color={WHITE} />
                </TouchableOpacity>
              </View>
              {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
            </View>

            {/* Email Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Email</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, emailError ? styles.inputError : null]}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (emailError) setEmailError('');
                  }}
                  placeholder="Enter your email"
                  placeholderTextColor={SOFT_GRAY}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={[styles.updateButton, email.trim() === userData?.email ? styles.updateButtonDisabled : null]}
                  onPress={handleUpdateEmail}
                  disabled={email.trim() === userData?.email || !email.trim()}
                >
                  <Ionicons name="checkmark" size={20} color={WHITE} />
                </TouchableOpacity>
              </View>
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            </View>

            {/* Save All Button */}
            <TouchableOpacity style={styles.saveAllButton} onPress={handleSaveAll}>
              <LinearGradient
                colors={[PRIMARY_COLOR, SECONDARY_COLOR]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveAllGradient}
              >
                <Ionicons name="save" size={20} color={WHITE} />
                <Text style={styles.saveAllText}>Save All Changes</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHITE,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  closeButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: DARK_GRAY,
  },
  placeholder: {
    width: 40,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DARK_GRAY,
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: DARK_GRAY,
    backgroundColor: '#F8F9FA',
  },
  inputError: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFF5F5',
  },
  updateButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
  },
  updateButtonDisabled: {
    backgroundColor: SOFT_GRAY,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 8,
  },
  saveAllButton: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveAllGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  saveAllText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
});
