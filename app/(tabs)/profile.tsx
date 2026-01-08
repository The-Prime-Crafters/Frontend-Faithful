import AccountManagementModal from '@/components/AccountManagementModal';
import { API_BASE_URL, API_ENDPOINTS } from '@/constants/API';
import { useLoading } from '@/contexts/LoadingContext';
import { useAppUsage, useStreak } from '@/hooks/useAppUsage';
import ActivityTrackerService from '@/utils/activityTracker';
import { safeJsonParse } from '@/utils/safeJson';
import { Ionicons } from '@expo/vector-icons';
// import * as ImagePicker from 'expo-image-picker'; // COMMENTED OUT - IMAGE PICKER TEMPORARILY DISABLED
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const PRIMARY_COLOR = '#7b4d62';
const SECONDARY_COLOR = '#ce703f';
const WHITE = '#FFFFFF';
const OFF_WHITE = '#f8f9fa';
const SOFT_GRAY = '#e9ecef';
const DARK_GRAY = '#495057';
const BLACK = '#000000';
const LIGHT_PURPLE = '#e3d5ca';
const LIGHT_ORANGE = '#f4e4d6';

const STATUS_BAR_OFFSET = Platform.OS === 'android'
  ? (StatusBar.currentHeight ?? 24) + 10
  : 10;

// This will be replaced with dynamic stats

const menuItems = [
  { id: '1', title: 'Account Settings', icon: 'settings', description: 'Manage your account' },
  { id: '3', title: 'Prayer Journal', icon: 'journal', description: 'Your prayer notes' },
  { id: '4', title: 'Study Plans', icon: 'calendar', description: 'Manage study schedules' },
  { id: '5', title: 'Notifications', icon: 'notifications', description: 'App notifications' },
  { id: '6', title: 'Help & Support', icon: 'help-circle', description: 'Get help' },
];

// Custom Alert Component
interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  buttons: Array<{
    text: string;
    onPress: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>;
  onClose: () => void;
}

const CustomAlert = ({ visible, title, message, type, buttons, onClose }: CustomAlertProps) => {
  const getIconName = () => {
    switch (type) {
      case 'success': return 'checkmark-circle';
      case 'error': return 'close-circle';
      case 'warning': return 'warning';
      case 'info': return 'information-circle';
      default: return 'information-circle';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success': return '#4CAF50';
      case 'error': return '#F44336';
      case 'warning': return '#FF9800';
      case 'info': return '#2196F3';
      default: return '#2196F3';
    }
  };

  const getButtonStyle = (style?: string) => {
    switch (style) {
      case 'destructive': return styles.destructiveButton;
      case 'cancel': return styles.cancelButton;
      default: return styles.defaultButton;
    }
  };

  const getButtonTextStyle = (style?: string) => {
    switch (style) {
      case 'destructive': return styles.destructiveButtonText;
      case 'cancel': return styles.cancelButtonText;
      default: return styles.defaultButtonText;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.alertOverlay}>
        <View style={styles.alertContainer}>
          <View style={styles.alertHeader}>
            <Ionicons name={getIconName()} size={32} color={getIconColor()} />
            <Text style={styles.alertTitle}>{title}</Text>
          </View>
          
          <Text style={styles.alertMessage}>{message}</Text>
          
          <View style={styles.alertButtons}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.alertButton, getButtonStyle(button.style)]}
                onPress={() => {
                  if (button.onPress) {
                    button.onPress();
                  }
                  onClose();
                }}
              >
                <Text style={[styles.alertButtonText, getButtonTextStyle(button.style)]}>
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function ProfileScreen() {
  const [userData, setUserData] = useState<any>(null);
  const { showLoading, hideLoading } = useLoading();
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Streak and Usage data from hooks (local) - real-time updates
  const streakData = useStreak();
  const appUsage = useAppUsage(1000); // Update every 1 second for real-time display
  
  
  // Backend streak data
  const [backendStreak, setBackendStreak] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  
  // Custom alert state
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    buttons: Array<{
      text: string;
      onPress: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }>;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    buttons: []
  });
  const [profileStats, setProfileStats] = useState([
    { label: 'Current Streak', value: '0', icon: 'flame' },
    { label: 'Longest Streak', value: '0', icon: 'trophy' },
    { label: 'Study Hours', value: '0', icon: 'time' },
  ]);

  // Alert helper functions
  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info', buttons: Array<{
    text: string;
    onPress: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>) => {
    setAlertConfig({ visible: true, title, message, type, buttons });
  };

  const hideAlert = () => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  };

  const showSuccessAlert = (message: string, onPress?: () => void) => {
    showAlert('Success', message, 'success', [{ text: 'OK', onPress: onPress || (() => {}) }]);
  };

  const showErrorAlert = (message: string, onPress?: () => void) => {
    showAlert('Error', message, 'error', [{ text: 'OK', onPress: onPress || (() => {}) }]);
  };

  const showConfirmAlert = (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
    showAlert(title, message, 'warning', [
      { text: 'Cancel', onPress: onCancel || (() => {}), style: 'cancel' },
      { text: 'Confirm', onPress: onConfirm, style: 'destructive' }
    ]);
  };

  useEffect(() => {
    // Only show loader on first load
    loadUserData(isFirstLoad);
    fetchStreakData();
    if (isFirstLoad) {
      setIsFirstLoad(false);
    }
  }, []);

  // Update study hours whenever appUsage changes (for real-time updates)
  useEffect(() => {
    if (appUsage && appUsage.totalTimeSpent >= 0) {
      const totalTimeHours = Math.round((appUsage.totalTimeSpent / 3600) * 100) / 100;
      
      // Update only the Study Hours stat in the array
      setProfileStats(prevStats => {
        const updatedStats = [...prevStats];
        const studyHoursIndex = updatedStats.findIndex(stat => stat.label === 'Study Hours');
        
        if (studyHoursIndex !== -1) {
          updatedStats[studyHoursIndex] = {
            ...updatedStats[studyHoursIndex],
            value: totalTimeHours.toString()
          };
        }
        return updatedStats;
      });
    }
  }, [appUsage?.totalTimeSpent]);

  // Refresh stats when screen comes into focus (without loader)
  useFocusEffect(
    React.useCallback(() => {
      loadUserData(false); // Don't show loader on focus
      fetchStreakData();
    }, [])
  );

  const calculateStreak = (usageData: any) => {
    if (!usageData || !usageData.dailyUsage) return 0;
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    let streak = 0;
    
    // Check if user used app today
    if (usageData.dailyUsage[todayStr]) {
      streak = 1;
      
      // Count consecutive days backwards
      for (let i = 1; i < 365; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const checkDateStr = checkDate.toISOString().split('T')[0];
        
        if (usageData.dailyUsage[checkDateStr]) {
          streak++;
        } else {
          break;
        }
      }
    }
    
    return streak;
  };

  const calculateVersesRead = (usageData: any) => {
    if (!usageData || !usageData.dailyUsage) return 0;
    
    let versesRead = 0;
    Object.values(usageData.dailyUsage).forEach((day: any) => {
      if (day.versesRead) {
        versesRead += day.versesRead;
      }
    });
    
    return versesRead;
  };

  const calculatePrayersSaid = async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) return 0;
      
      const response = await fetch('https://d5025d32c714.ngrok-free.app/api/bible/daily-prayer', {  
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        // Count the number of prayers from the API response
        // Using totalVersesInCategory as it represents the total prayers in the category
        return result.data?.totalVersesInCategory || 0;
      }
    } catch (error) {
      // Silently handle errors
    }
    return 0;
  };

  const calculateStudyHours = (usageData: any) => {
    if (!usageData || !usageData.dailyUsage) return 0;
    
    let totalMinutes = 0;
    Object.values(usageData.dailyUsage).forEach((day: any) => {
      if (day.studyTime) {
        totalMinutes += day.studyTime;
      }
    });
    
    return Math.round(totalMinutes / 60 * 10) / 10; // Convert to hours, round to 1 decimal
  };

  /* ───── Fetch Streak Data from Backend ───── */
  const fetchStreakData = async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        setLoadingStats(false);
        return;
      }
      const response = await fetch(`${API_BASE_URL}/api/users/profile/streak`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.streak) {
          setBackendStreak(data.streak);
        }
      }
    } catch (error) {
      // Silently handle errors
    } finally {
      setLoadingStats(false);
    }
  };

  const loadUserData = async (showLoader: boolean = false) => {
    try {
      if (showLoader) {
        showLoading('Loading profile...');
      }
      
      // First, load from SecureStore (fast)
      const userDataString = await SecureStore.getItemAsync('userData');
      if (userDataString) {
        const user = safeJsonParse(userDataString, null);
        if (user) {
          setUserData(user);
        }
      }
      
      // Then, fetch fresh data from API to get latest profile picture
      try {
        const token = await SecureStore.getItemAsync('authToken');
        if (token) {
          const profileResponse = await fetch(`${API_BASE_URL}/api/users/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            const freshUser = profileData.user || profileData;
            
            // Update user data with fresh profile picture
            const existingUser = safeJsonParse(userDataString, {});
            const updatedUser = {
              ...existingUser,
              picture: freshUser.picture, // Always use latest picture from backend
              name: freshUser.name || existingUser.name || '',
              email: freshUser.email || existingUser.email || '',
            };
            
            // Save to SecureStore and state
            await SecureStore.setItemAsync('userData', JSON.stringify(updatedUser));
            setUserData(updatedUser);
            console.log('✅ Profile picture refreshed from backend');
          }
        }
      } catch (apiError) {
        console.log('⚠️ Could not fetch fresh profile data, using cached data');
      }
      
      const usageDataString = await SecureStore.getItemAsync('userUsageData');
      
      // Get activity tracker data
      const activityTracker = ActivityTrackerService.getInstance();
      await activityTracker.refreshStreakData(); // Refresh streak data from index screen
      const dailyActivity = activityTracker.getDailyActivity();
      const totalStudyMinutes = activityTracker.getTotalStudyMinutes();
      
      // Fetch prayer statistics from API
      let prayerStats = null;
      try {
        const token = await SecureStore.getItemAsync('authToken');
        if (token) {
          const response = await fetch(API_ENDPOINTS.PRAYER_STATS, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const result = await response.json();
            prayerStats = result.data;
          }
        }
      } catch (error) {
        // Silently handle errors
      }
      
      // Calculate stats using new streak system (prioritize backend data, then hook data)
      const usageData = usageDataString ? safeJsonParse(usageDataString, null) : null;
      const currentStreak = Number(streakData?.currentStreak || backendStreak?.currentStreak || dailyActivity.currentStreak || calculateStreak(usageData) || 0);
      const longestStreak = Number(streakData?.longestStreak || backendStreak?.longestStreak || 0);
      
      // Calculate total time in hours from seconds (appUsage.totalTimeSpent is in seconds)
      const totalTimeSeconds = Number(appUsage?.totalTimeSpent || 0);
      const totalTimeHours = Math.round((totalTimeSeconds / 3600) * 100) / 100; // Convert seconds to hours, round to 2 decimal places
      
      // Get XP and gamification data
      const totalXP = Number(appUsage?.totalXP || 0);
      const todayXP = Number(appUsage?.todayXP || 0);
      const level = Number(appUsage?.level || 1);
      const xpToNextLevel = Number(appUsage?.xpToNextLevel || 100);
      
      console.log('📊 Profile Stats Debug:');
      console.log('  - Total XP:', totalXP);
      console.log('  - Today XP:', todayXP);
      console.log('  - Level:', level);
      console.log('  - XP to Next Level:', xpToNextLevel);
      
      // Use prayer stats from API if available, otherwise fall back to activity tracker
      const prayersSaid = Number(prayerStats ? prayerStats.myStats.totalResponsesGiven : dailyActivity.prayersSaid || 0);
      
      // Set profile stats with XP and gamification data
      const stats = [
        { label: 'Level', value: level.toString(), icon: 'star' },
        { label: 'Total XP', value: totalXP.toString(), icon: 'flash' },
        { label: 'Today\'s XP', value: todayXP.toString(), icon: 'flash-outline' },
        { label: 'Current Streak', value: currentStreak.toString(), icon: 'flame' },
        { label: 'Longest Streak', value: longestStreak.toString(), icon: 'trophy' },
        { label: 'Study Hours', value: totalTimeHours.toString(), icon: 'time' },
      ];

      // Add prayer-related stats if available from API
      if (prayerStats && prayerStats.myStats) {
        stats.push(
          { label: 'Prayers Given', value: String(Number(prayerStats.myStats.totalResponsesGiven || 0)), icon: 'heart' },
          { label: 'Prayer Requests', value: String(Number(prayerStats.myStats.totalRequests || 0)), icon: 'create' },
          { label: 'Answered Prayers', value: String(Number(prayerStats.myStats.answeredRequests || 0)), icon: 'checkmark-circle' }
        );
      } else {
        // Fallback to activity tracker data
        stats.push({ label: 'Prayers Said', value: String(prayersSaid), icon: 'heart' });
      }

      setProfileStats(stats);
      
    } catch (error) {
      // Silently handle errors
    } finally {
      if (showLoader) {
        hideLoading();
      }
    }
  };

  const handleMenuPress = (itemId: string) => {
    switch (itemId) {
      case '1': // Account Settings
        router.push('/account-settings');
        break;
      case '3': // Prayer Journal
        router.push('/(tabs)/prayer?tab=my-prayers');
        break;
      case '4': // Study Plans
        router.push('/(tabs)/reading');
        break;
      case '5': // Notifications
        router.push('/notification-settings');
        break;
      case '6': // Help & Support
        router.push('/help-support');
        break;
      default:
        break;
    }
  };

  const handleAccountUpdate = (updatedData: any) => {
    setUserData(updatedData);
    setShowAccountModal(false);
  };

  // COMMENTED OUT - IMAGE PICKER TEMPORARILY DISABLED
  // const handleImagePicker = async () => {
  //   try {
  //     // Request permission
  //     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  //     
  //     if (status !== 'granted') {
  //       showErrorAlert('Sorry, we need camera roll permissions to change your profile picture.');
  //       return;
  //     }

  //     // Open image picker with aggressive compression
  //     const result = await ImagePicker.launchImageLibraryAsync({
  //       mediaTypes: ImagePicker.MediaTypeOptions.Images,
  //       allowsEditing: true,
  //       aspect: [1, 1],
  //       quality: 0.3, // Reduced from 0.8 to 0.3 for smaller file size
  //       base64: true,  // Get base64 directly
  //     });

  //     if (!result.canceled && result.assets[0]) {
  //       await uploadProfilePicture(result.assets[0]);
  //     }
  //   } catch (error) {
  //     console.error('Error picking image:', error);
  //     showErrorAlert('Failed to select image. Please try again.');
  //   }
  // };

  // COMMENTED OUT - IMAGE PICKER TEMPORARILY DISABLED
  // const uploadProfilePicture = async (asset: any) => {
  //   try {
  //     setUploadingImage(true);
  //     showLoading('Uploading profile picture...');

  //     const token = await SecureStore.getItemAsync('authToken');
  //     if (!token) {
  //       showErrorAlert('Please sign in to update your profile picture.');
  //       return;
  //     }

  //     // Use base64 from ImagePicker (already compressed)
  //     let base64 = asset.base64;
  //     
  //     if (!base64) {
  //       // Fallback: convert from URI if base64 not available
  //       const response = await fetch(asset.uri);
  //       const blob = await response.blob();
  //       base64 = await new Promise<string>((resolve, reject) => {
  //         const reader = new FileReader();
  //         reader.onloadend = () => {
  //           const result = reader.result as string;
  //           // Extract just the base64 part without the data:image prefix
  //           const base64Data = result.split(',')[1];
  //           resolve(base64Data);
  //         };
  //         reader.onerror = reject;
  //         reader.readAsDataURL(blob);
  //       });
  //     }

  //     // Add data URI prefix if not present
  //     const imageData = base64.startsWith('data:') 
  //       ? base64 
  //       : `data:image/jpeg;base64,${base64}`;

  //     // Check file size (base64 length * 0.75 gives approximate byte size)
  //     const fileSizeKB = (imageData.length * 0.75) / 1024;
  //     console.log(`📏 Image size: ${fileSizeKB.toFixed(2)} KB`);

  //     if (fileSizeKB > 100) {
  //       showErrorAlert('Image is too large. Please select a smaller image or crop it more.');
  //       return;
  //     }

  //     console.log('📸 Uploading profile picture...');
  //     console.log('📡 Endpoint:', API_ENDPOINTS.USERS_PROFILE_PICTURE);

  //     // Upload to backend
  //     const uploadResponse = await fetch(API_ENDPOINTS.USERS_PROFILE_PICTURE, {
  //       method: 'POST',
  //       headers: {
  //         'Authorization': `Bearer ${token}`,
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         picture: imageData,
  //       }),
  //     });

  //     if (uploadResponse.ok) {
  //       const result = await uploadResponse.json();
  //       console.log('✅ Profile picture updated:', result);

  //       // Update local user data
  //       const updatedUserData = {
  //         ...userData,
  //         picture: result.pictureUrl || imageData,
  //       };
  //       
  //       await SecureStore.setItemAsync('userData', JSON.stringify(updatedUserData));
  //       setUserData(updatedUserData);

  //       showSuccessAlert('Profile picture updated successfully!');
  //     } else {
  //       const error = await uploadResponse.json();
  //       console.error('❌ Failed to upload:', error);
  //       showErrorAlert(error.message || 'Failed to upload profile picture. The image might be too large.');
  //     }
  //   } catch (error) {
  //     console.error('❌ Error uploading image:', error);
  //     showErrorAlert('Failed to upload profile picture. Please try again with a smaller image.');
  //   } finally {
  //     setUploadingImage(false);
  //     hideLoading();
  //   }
  // };

  const handleLogout = async () => {
    showConfirmAlert(
      'Sign Out',
      'Are you sure you want to sign out? You will need to sign in again to access your account.',
      async () => {
        try {
          // Clear all authentication data
          await SecureStore.deleteItemAsync('authToken');
          await SecureStore.deleteItemAsync('userData');
          await SecureStore.deleteItemAsync('userUsageData');
          
          // Log the logout action
          
          // Clear local state
          setUserData(null);
          
          // Redirect to onboarding screen
          router.replace('/(main)/onboarding');
          
        } catch (error) {
          showErrorAlert('Failed to sign out. Please try again.');
        }
      }
    );
  };


  return (
    <SafeAreaView style={styles.safeArea}>
              <ScrollView 
          style={styles.container} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity>
            <Ionicons name="settings" size={30} color={WHITE} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <LinearGradient
          colors={[PRIMARY_COLOR, SECONDARY_COLOR]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileCard}
        >
          {/* COMMENTED OUT - IMAGE PICKER TEMPORARILY DISABLED */}
          {/* <TouchableOpacity 
            style={styles.profileImageContainer}
            onPress={handleImagePicker}
            disabled={uploadingImage}
        > */}
          <View style={styles.profileImageContainer}>
          <View style={styles.profileImage}>
              {uploadingImage ? (
                <ActivityIndicator size="large" color={WHITE} />
              ) : userData?.picture ? (
              <Image 
                source={{ uri: userData.picture }} 
                style={styles.profileImageInner}
                resizeMode="cover"
              />
            ) : (
              <Ionicons name="person" size={40} color={PRIMARY_COLOR} />
            )}
          </View>
            {/* <View style={styles.editImageButton}>
              <Ionicons name="camera" size={16} color={WHITE} />
            </View> */}
          </View>
          {/* </TouchableOpacity> */}
          <Text style={styles.profileName}>
            {userData?.name || 'User'}
          </Text>
          <Text style={styles.profileEmail}>
            {userData?.email || 'user@example.com'}
          </Text>
          <Text style={styles.memberSince}>
            Member since {userData?.signUpDate ? 
              new Date(userData.signUpDate).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long' 
              }) : 
              new Date().getFullYear()
            }
          </Text>
        </LinearGradient>

        {/* Stats Section - Commented Out */}
        {/* <View style={styles.statsSection}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="analytics" size={20} color={PRIMARY_COLOR} />
            <Text style={styles.sectionTitle}>Your Progress</Text>
          </View>
          
          <LinearGradient
            colors={['#7b4d62', '#8b5a73', '#9b6a84']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.xpCard}
          >
            <View style={styles.xpCardHeader}>
              <View style={styles.levelBadgeProfile}>
                <Ionicons name="star" size={24} color="#FFD700" />
                <Text style={styles.levelTextProfile}>Level {appUsage?.level || 1}</Text>
              </View>
              <View style={styles.todayXPBadge}>
                <Ionicons name="flash" size={16} color="#FFA500" />
                <Text style={styles.todayXPText}>+{appUsage?.todayXP || 0} Today</Text>
              </View>
            </View>
            
            <View style={styles.xpProgressProfile}>
              <View style={styles.xpProgressHeaderProfile}>
                <Text style={styles.xpProgressLabelProfile}>Progress to Next Level</Text>
                <Text style={styles.xpProgressValueProfile}>
                  {appUsage?.totalXP || 0} / {(appUsage?.totalXP || 0) + (appUsage?.xpToNextLevel || 100)} XP
                </Text>
              </View>
              <View style={styles.xpProgressBarBgProfile}>
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.xpProgressBarFillProfile,
                    { width: `${Math.min(100, ((appUsage?.totalXP || 0) / ((appUsage?.totalXP || 0) + (appUsage?.xpToNextLevel || 1))) * 100)}%` }
                  ]}
                />
              </View>
              <Text style={styles.xpProgressDetailProfile}>
                {appUsage?.xpToNextLevel || 100} XP needed for Level {(appUsage?.level || 1) + 1}
              </Text>
            </View>
            
            <View style={styles.xpStatsRow}>
              <View style={styles.xpStatItem}>
                <Ionicons name="flash" size={20} color="#FFD700" />
                <Text style={styles.xpStatValue}>{appUsage?.totalXP || 0}</Text>
                <Text style={styles.xpStatLabel}>Total XP</Text>
              </View>
              <View style={styles.xpStatDivider} />
              <View style={styles.xpStatItem}>
                <Ionicons name="flash-outline" size={20} color="#FFA500" />
                <Text style={styles.xpStatValue}>{appUsage?.todayXP || 0}</Text>
                <Text style={styles.xpStatLabel}>Today's XP</Text>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.statsGrid}>
            {profileStats.filter(stat => !['Level', 'Total XP', "Today's XP"].includes(stat.label)).map((stat, index) => (
              <View key={index} style={styles.statCardNew}>
                <View style={styles.statIconContainer}>
                  <Ionicons name={stat.icon as any} size={28} color={PRIMARY_COLOR} />
                </View>
                <Text style={styles.statValueNew}>{String(stat.value || '0')}</Text>
                <Text style={styles.statLabelNew} numberOfLines={2} ellipsizeMode="tail">
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
        </View> */}

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          {menuItems.map((item) => (
            <TouchableOpacity key={item.id} style={styles.menuItem} onPress={() => handleMenuPress(item.id)}>
              <View style={styles.menuItemLeft}>
                <Ionicons name={item.icon as any} size={24} color={WHITE} />
                <View style={styles.menuItemText}>
                  <Text style={styles.menuItemTitle}>{item.title}</Text>
                  <Text style={styles.menuItemDescription}>{item.description}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={20} color={WHITE} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Account Management Modal */}
      <AccountManagementModal
        visible={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        userData={userData}
        onUpdateSuccess={handleAccountUpdate}
      />

      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={hideAlert}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: OFF_WHITE,
  },
  container: {
    flex: 1,
    backgroundColor: OFF_WHITE,
    paddingHorizontal: 20,
    paddingTop: STATUS_BAR_OFFSET,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    color: DARK_GRAY,
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'serif',
  },
  profileCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: SOFT_GRAY,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 12,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: WHITE,
  },
  profileImageInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileName: {
    color: WHITE,
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'serif',
    marginBottom: 4,
  },
  profileEmail: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontFamily: 'serif',
    marginBottom: 8,
  },
  memberSince: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontFamily: 'serif',
  },
  statsSection: {
    marginBottom: 30,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    color: DARK_GRAY,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'serif',
  },
  // XP Card Styles
  xpCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  xpCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  levelBadgeProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  levelTextProfile: {
    fontSize: 18,
    fontWeight: 'bold',
    color: WHITE,
    fontFamily: 'serif',
  },
  todayXPBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 165, 0, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  todayXPText: {
    fontSize: 13,
    fontWeight: '600',
    color: WHITE,
    fontFamily: 'serif',
  },
  xpProgressProfile: {
    marginBottom: 20,
  },
  xpProgressHeaderProfile: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  xpProgressLabelProfile: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'serif',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  xpProgressValueProfile: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFD700',
    fontFamily: 'serif',
  },
  xpProgressBarBgProfile: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  xpProgressBarFillProfile: {
    height: '100%',
    borderRadius: 6,
  },
  xpProgressDetailProfile: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'serif',
    textAlign: 'center',
  },
  xpStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  xpStatItem: {
    alignItems: 'center',
    gap: 6,
  },
  xpStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: WHITE,
    fontFamily: 'serif',
  },
  xpStatLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'serif',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  xpStatDivider: {
    width: 1,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  // New Stats Grid Styles
  statCardNew: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(123, 77, 98, 0.1)',
  },
  statIconContainer: {
    backgroundColor: 'rgba(123, 77, 98, 0.1)',
    borderRadius: 12,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValueNew: {
    fontSize: 24,
    fontWeight: 'bold',
    color: DARK_GRAY,
    fontFamily: 'serif',
    marginBottom: 4,
  },
  statLabelNew: {
    fontSize: 10,
    color: '#666',
    fontFamily: 'serif',
    textAlign: 'center',
    lineHeight: 13,
    paddingHorizontal: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  menuSection: {
    marginBottom: 30,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LIGHT_PURPLE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#d4c4b7',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    marginLeft: 16,
    flex: 1,
  },
  menuItemTitle: {
    color: DARK_GRAY,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'serif',
    marginBottom: 2,
  },
  menuItemDescription: {
    color: '#6c757d',
    fontSize: 14,
    fontFamily: 'serif',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc3545', // Red background for sign out
    borderRadius: 12,
    padding: 16,
    marginBottom: 100, // Increased margin to clear tab bar
    borderWidth: 1,
    borderColor: '#c82333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'serif',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: OFF_WHITE,
  },
  loadingText: {
    color: DARK_GRAY,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'serif',
  },
  // Custom Alert Styles
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertContainer: {
    backgroundColor: WHITE,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    padding: 0,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: SOFT_GRAY,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: DARK_GRAY,
    fontFamily: 'serif',
    marginLeft: 12,
    flex: 1,
  },
  alertMessage: {
    fontSize: 16,
    color: DARK_GRAY,
    fontFamily: 'serif',
    lineHeight: 24,
    padding: 20,
  },
  alertButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  alertButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  defaultButton: {
    backgroundColor: PRIMARY_COLOR,
  },
  cancelButton: {
    backgroundColor: SOFT_GRAY,
  },
  destructiveButton: {
    backgroundColor: '#F44336',
  },
  alertButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'serif',
  },
  defaultButtonText: {
    color: WHITE,
  },
  cancelButtonText: {
    color: DARK_GRAY,
  },
  destructiveButtonText: {
    color: WHITE,
  },
}); 