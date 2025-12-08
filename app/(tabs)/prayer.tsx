import { API_ENDPOINTS } from '@/constants/API';
import { useLoading } from '@/contexts/LoadingContext';
import AppSessionTracker from '@/utils/appSessionTracker';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    FlatList,
    Image,
    Modal,
    Platform,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const { width, height } = Dimensions.get('window');

const PRIMARY_COLOR = '#7b4d62';
const SECONDARY_COLOR = '#ce703f';
const WHITE = '#FFFFFF';
const OFF_WHITE = '#f8f9fa';
const SOFT_GRAY = '#e9ecef';
const DARK_GRAY = '#495057';
const BLACK = '#000000';

const STATUS_BAR_OFFSET = Platform.OS === 'android'
  ? (StatusBar.currentHeight ?? 24) + 10
  : 10;

interface PrayerRequest {
  id: number;
  title: string;
  description: string;
  category: string;
  is_anonymous: boolean;
  is_urgent: boolean;
  is_public: boolean;
  prayer_count: number;
  response_count: number;
  status: 'Active' | 'Answered' | 'Closed';
  created_at: string;
  responses?: PrayerResponse[];
  
  // Enhanced user information
  author_id?: number;
  author_name?: string;
  author_email?: string;
  author_picture?: string;
  author_denomination?: string;
  author_bible_version?: string;
  author_age_group?: string;
  display_name: string;
  display_picture?: string;
  display_denomination?: string;
  display_age_group?: string;
}

interface PrayerResponse {
  id: number;
  response_type: 'prayer' | 'encouragement' | 'testimony' | 'other';
  message?: string;
  is_anonymous: boolean;
  created_at: string;
  parent_response_id?: number;
  
  // Enhanced user information
  responder_id?: number;
  responder_name?: string;
  responder_email?: string;
  responder_picture?: string;
  responder_denomination?: string;
  responder_bible_version?: string;
  responder_age_group?: string;
  display_name: string;
  display_picture?: string;
  display_denomination?: string;
  display_age_group?: string;
  
  // Nested replies
  replies?: PrayerResponse[];
}

interface PrayerStats {
  myStats: {
    totalRequests: number;
    activeRequests: number;
    answeredRequests: number;
    urgentRequests: number;
    totalResponsesReceived: number;
    totalResponsesGiven: number;
    prayersGiven: number;
    encouragementsGiven: number;
    testimoniesGiven: number;
  };
  globalStats: {
    totalPublicRequests: number;
    activePublicRequests: number;
    urgentPublicRequests: number;
    totalGlobalResponses: number;
  };
}

const prayerCategories = [
  { value: 'General', label: 'General Prayer', icon: 'heart' },
  { value: 'Health', label: 'Health & Healing', icon: 'medical' },
  { value: 'Family', label: 'Family & Relationships', icon: 'people' },
  { value: 'Work', label: 'Work & Career', icon: 'briefcase' },
  { value: 'Relationships', label: 'Relationships', icon: 'heart-circle' },
  { value: 'Spiritual Growth', label: 'Spiritual Growth', icon: 'leaf' },
  { value: 'Financial', label: 'Financial', icon: 'card' },
  { value: 'Emotional', label: 'Emotional Support', icon: 'happy' },
  { value: 'Other', label: 'Other', icon: 'ellipsis-horizontal' },
];

const responseTypes = [
  { value: 'prayer', label: 'I\'m Praying', icon: 'heart', color: PRIMARY_COLOR },
  { value: 'encouragement', label: 'Encouragement', icon: 'thumbs-up', color: SECONDARY_COLOR },
  { value: 'testimony', label: 'Testimony', icon: 'star', color: '#4CAF50' },
  { value: 'other', label: 'Other', icon: 'chatbubble', color: DARK_GRAY },
];

// Shimmer effect component
const ShimmerEffect = ({ style, children }: { style: any; children: React.ReactNode }) => {
  const shimmerValue = new Animated.Value(0);

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    shimmer.start();
    return () => shimmer.stop();
  }, []);

  const opacity = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View style={[style, { opacity }]}>
      {children}
    </Animated.View>
  );
};

export default function PrayerScreen() {
  const { showLoading, hideLoading } = useLoading();
  const { tab, postId, autoOpenModal } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<'feed' | 'my-prayers' | 'stats'>('feed');
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>([]);
  const [myPrayerRequests, setMyPrayerRequests] = useState<PrayerRequest[]>([]);
  const [stats, setStats] = useState<PrayerStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  
  // Prayer request modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRequest, setNewRequest] = useState({
    title: '',
    description: '',
    category: 'General',
    isAnonymous: false,
    isUrgent: false,
    isPublic: true,
  });
  
  // Prayer response modal
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PrayerRequest | null>(null);
  const [responseData, setResponseData] = useState({
    responseType: 'prayer' as const,
    message: '',
    isAnonymous: false,
  });
  const [expandedPrayers, setExpandedPrayers] = useState<Set<number>>(new Set());
  const [loadingResponses, setLoadingResponses] = useState<Set<number>>(new Set());
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<PrayerResponse | null>(null);
  const [replyData, setReplyData] = useState({
    responseType: 'prayer' as 'prayer' | 'encouragement' | 'testimony' | 'other',
    message: '',
    isAnonymous: false,
  });
  
  // View More modal for long content
  const [showViewMoreModal, setShowViewMoreModal] = useState(false);
  const [viewMoreContent, setViewMoreContent] = useState('');
  const [viewMoreTitle, setViewMoreTitle] = useState('');
  
  // Custom Alert State
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [alertData, setAlertData] = useState({
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info' | 'warning',
    onConfirm: () => {},
  });
  
  // Filters
  const [filters, setFilters] = useState({
    category: 'All',
    status: 'All',
    sort: 'newest',
    search: '',
  });

  // Function to clear URL parameters after auto-opening modal
  const clearUrlParameters = () => {
    if (autoOpenModal === 'true') {
      // Replace current URL with clean version (only postId, no autoOpenModal)
      if (postId) {
        router.replace(`/(tabs)/prayer?postId=${postId}` as any);
      } else {
        router.replace('/(tabs)/prayer' as any);
      }
    }
  };

  // Function to close response modal and clear URL parameters
  const closeResponseModal = () => {
    setShowResponseModal(false);
    setSelectedRequest(null);
    setResponseData({
      responseType: 'prayer',
      message: '',
      isAnonymous: false,
    });
    clearUrlParameters();
  };

  // Function to show custom alert
  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', onConfirm?: () => void) => {
    setAlertData({
      title,
      message,
      type,
      onConfirm: onConfirm || (() => {}),
    });
    setShowCustomAlert(true);
  };

  useFocusEffect(
    useCallback(() => {
      loadUserData();
      loadPrayerFeed();
      loadStats();
    }, [])
  );

  // Handle tab parameter from URL
  useEffect(() => {
    if (tab === 'my-prayers') {
      setActiveTab('my-prayers');
      // Load my prayers if not already loaded
      if (myPrayerRequests.length === 0) {
        loadMyPrayers();
      }
    }
  }, [tab]);

  // Handle postId parameter from URL - expand specific prayer and auto-open modal
  useEffect(() => {
    if (postId && prayerRequests.length > 0) {
      const postIdNum = parseInt(postId as string);
      const targetPrayer = prayerRequests.find(prayer => prayer.id === postIdNum);
      
      if (targetPrayer) {
        // Auto-open response modal if autoOpenModal parameter is present
        if (autoOpenModal === 'true') {
          // Load full request details with responses and open modal
          loadPrayerRequestDetails(postIdNum).then(fullRequestData => {
            if (fullRequestData && fullRequestData.request) {
              setSelectedRequest(fullRequestData.request);
              setShowResponseModal(true);
            } else {
              setSelectedRequest(targetPrayer);
              setShowResponseModal(true);
            }
            // Clear URL parameters after opening modal
            clearUrlParameters();
          }).catch(error => {
            setSelectedRequest(targetPrayer);
            setShowResponseModal(true);
            // Clear URL parameters even after error
            clearUrlParameters();
          });
        } else {
          // Only expand the prayer if autoOpenModal is not present
          setExpandedPrayers(prev => new Set([...prev, postIdNum]));
        }
      }
    }
  }, [postId, prayerRequests, autoOpenModal]);

  const loadUserData = async () => {
    try {
      // First, load from SecureStore (fast)
      const userDataString = await SecureStore.getItemAsync('userData');
      if (userDataString) {
        const data = JSON.parse(userDataString);
        setUserData(data);
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
            const updatedUser = {
              ...(userDataString ? JSON.parse(userDataString) : {}),
              picture: freshUser.picture, // Always use latest picture from backend
              name: freshUser.name || (userDataString ? JSON.parse(userDataString).name : ''),
              email: freshUser.email || (userDataString ? JSON.parse(userDataString).email : ''),
            };
            
            // Save to SecureStore and state
            await SecureStore.setItemAsync('userData', JSON.stringify(updatedUser));
            setUserData(updatedUser);
            console.log('✅ Prayer - Profile picture refreshed from backend');
          }
        }
      } catch (apiError) {
        console.log('⚠️ Prayer - Could not fetch fresh profile data, using cached data');
      }
    } catch (error) {
      // Silently handle errors
    }
  };

  const loadPrayerFeed = async () => {
    try {
      showLoading('Loading prayers...');
      const token = await SecureStore.getItemAsync('authToken');
      
      if (!token) {
        return;
      }

      const queryParams = new URLSearchParams();
      if (filters.category !== 'All') queryParams.append('category', filters.category);
      if (filters.status !== 'All') queryParams.append('status', filters.status);
      if (filters.sort !== 'newest') queryParams.append('sort', filters.sort);
      if (filters.search) queryParams.append('search', filters.search);
      queryParams.append('page', '1');
      queryParams.append('limit', '20');

      const response = await fetch(`${API_ENDPOINTS.PRAYER_REQUESTS}?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        setPrayerRequests(result.data.requests || []);
      }
    } catch (error) {
      // Silently handle errors
    } finally {
      hideLoading();
    }
  };

  const loadMyPrayers = async () => {
    try {
      showLoading('Loading your prayers...');
      const token = await SecureStore.getItemAsync('authToken');
      
      if (!token) {
        setMyPrayerRequests([]);
        return;
      }

      const response = await fetch(API_ENDPOINTS.PRAYER_MY_REQUESTS, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        setMyPrayerRequests(result.data.requests || []);
      } else {
        setMyPrayerRequests([]);
      }
    } catch (error) {
      setMyPrayerRequests([]);
    } finally {
      hideLoading();
    }
  };

  const loadStats = async () => {
    try {
      showLoading('Loading prayer statistics...');
      const token = await SecureStore.getItemAsync('authToken');
      
      if (!token) {
        return;
      }

      const response = await fetch(API_ENDPOINTS.PRAYER_STATS, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        setStats(result.data);
      }
    } catch (error) {
      // Silently handle errors
    } finally {
      hideLoading();
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (activeTab === 'feed') {
      await loadPrayerFeed();
    } else if (activeTab === 'my-prayers') {
      await loadMyPrayers();
    } else if (activeTab === 'stats') {
      await loadStats();
    }
    setRefreshing(false);
  }, [activeTab]);

  const handleCreatePrayerRequest = async () => {
      if (!newRequest.title.trim()) {
        showAlert('Error', 'Please enter a prayer request title', 'error');
        return;
      }
      
      if (!newRequest.description.trim()) {
        showAlert('Error', 'Please enter a prayer request description', 'error');
        return;
      }

    try {
      showLoading('Creating prayer request...');
      const token = await SecureStore.getItemAsync('authToken');
      
      if (!token) {
        showAlert('Error', 'Authentication required', 'error');
        return;
      }

      // Convert camelCase to snake_case for API
      const apiPayload = {
        title: newRequest.title,
        description: newRequest.description,
        category: newRequest.category,
        is_anonymous: newRequest.isAnonymous,
        is_urgent: newRequest.isUrgent,
        is_public: newRequest.isPublic,
      };
      
      const response = await fetch(API_ENDPOINTS.PRAYER_REQUESTS, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiPayload),
      });

      if (response.ok) {
        const result = await response.json();
        showAlert('Success', 'Prayer request created successfully!', 'success', () => {
          setShowCreateModal(false);
        });
        // Reset form to default values
        setNewRequest({
          title: '',
          description: '',
          category: 'General',
          isAnonymous: false,
          isUrgent: false,
          isPublic: true,
        });
        await loadPrayerFeed();
        await loadMyPrayers();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create prayer request');
      }
    } catch (error) {
      showAlert('Error', error instanceof Error ? error.message : 'Failed to create prayer request', 'error');
    } finally {
      hideLoading();
    }
  };

  const handlePrayerResponse = async () => {
    if (!selectedRequest) {
      return;
    }

    if (!selectedRequest.id || isNaN(Number(selectedRequest.id))) {
      showAlert('Error', 'Invalid prayer request. Please try again.', 'error');
      setShowResponseModal(false);
      return;
    }

    if (!responseData.message.trim()) {
      showAlert('Error', 'Please enter a message for your response', 'error');
      return;
    }

    try {
      showLoading('Sending prayer response...');
      const token = await SecureStore.getItemAsync('authToken');
      
      if (!token) {
        showAlert('Error', 'Authentication required', 'error');
        return;
      }

      // Convert camelCase to snake_case for API
      const apiPayload = {
        response_type: responseData.responseType,
        message: responseData.message,
        is_anonymous: responseData.isAnonymous,
      };
      
      // Ensure ID is a number
      const requestId = Number(selectedRequest.id);
      
      const response = await fetch(`${API_ENDPOINTS.PRAYER_REQUESTS}/${requestId}/respond`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiPayload),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Track community engagement
        const sessionTracker = AppSessionTracker.getInstance();
        sessionTracker.trackActivity('community_engagement', 10, {
          type: 'prayer_response',
          responseType: responseData.responseType,
        });
        
        showAlert('Success', 'Prayer response sent successfully!', 'success', () => {
          closeResponseModal();
        });
        
        // Reload user data first to ensure latest profile picture is cached
        await loadUserData();
        
        // Then reload the prayer feed to get updated responses with correct display picture
        await loadPrayerFeed();
      } else {
        // Handle non-JSON error responses
        let errorMessage = 'Failed to send prayer response';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } else {
            // Backend returned non-JSON (HTML/text)
            const errorText = await response.text();
            console.error('❌ Backend returned non-JSON error:', errorText);
            errorMessage = `Server error (${response.status}): ${errorText.substring(0, 100)}`;
          }
        } catch (parseError) {
          console.error('❌ Error parsing error response:', parseError);
          errorMessage = `Server error (${response.status})`;
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      showAlert('Error', error instanceof Error ? error.message : 'Failed to send prayer response', 'error');
    } finally {
      hideLoading();
    }
  };

  const handleReply = async () => {
    if (!selectedResponse) return;

    try {
      showLoading('Sending reply...');
      const token = await SecureStore.getItemAsync('authToken');
      
      if (!token) {
        showAlert('Error', 'Authentication required', 'error');
        return;
      }

      // Convert camelCase to snake_case for API
      const apiPayload = {
        response_type: replyData.responseType,
        message: replyData.message,
        is_anonymous: replyData.isAnonymous,
      };
      
      const response = await fetch(API_ENDPOINTS.PRAYER_REPLY(selectedResponse.id), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiPayload),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Trigger backend to send push notification to prayer request author
        console.log('✅ Reply sent, backend should send notification to request author');
        
        showAlert('Success', 'Reply sent successfully!', 'success', () => {
          setShowReplyModal(false);
          setSelectedResponse(null);
        });
        setReplyData({
          responseType: 'prayer',
          message: '',
          isAnonymous: false,
        });
        
        // Reload user data first to ensure latest profile picture is cached
        await loadUserData();
        
        // Then reload the prayer feed to get updated responses with correct display picture
        await loadPrayerFeed();
      } else {
        // Handle non-JSON error responses
        let errorMessage = 'Failed to send reply';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } else {
            // Backend returned non-JSON (HTML/text)
            const errorText = await response.text();
            console.error('❌ Backend returned non-JSON error:', errorText);
            errorMessage = `Server error (${response.status}): ${errorText.substring(0, 100)}`;
          }
        } catch (parseError) {
          console.error('❌ Error parsing error response:', parseError);
          errorMessage = `Server error (${response.status})`;
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      showAlert('Error', error instanceof Error ? error.message : 'Failed to send reply', 'error');
    } finally {
      hideLoading();
    }
  };

  const openReplyModal = (response: PrayerResponse) => {
    setSelectedResponse(response);
    setShowReplyModal(true);
  };

  const loadPrayerRequestDetails = async (requestId: number) => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      
      if (!token) {
        return null;
      }

      const response = await fetch(`${API_ENDPOINTS.PRAYER_REQUESTS}/${requestId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        return result.data;
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  };

  const togglePrayerExpansion = async (prayerId: number) => {
    const newExpanded = new Set(expandedPrayers);
    if (newExpanded.has(prayerId)) {
      newExpanded.delete(prayerId);
      // Clear loading state when collapsing
      setLoadingResponses(prev => {
        const newSet = new Set(prev);
        newSet.delete(prayerId);
        return newSet;
      });
    } else {
      newExpanded.add(prayerId);
      
      // Set loading state immediately when expanding
      setLoadingResponses(prev => new Set(prev).add(prayerId));
      
      // Set a timeout to clear loading state after 10 seconds (fallback)
      const loadingTimeout = setTimeout(() => {
        setLoadingResponses(prev => {
          const newSet = new Set(prev);
          newSet.delete(prayerId);
          return newSet;
        });
      }, 10000);
      
      // Use different logic based on active tab
      if (activeTab === 'feed') {
        // Feed logic
        const prayer = prayerRequests.find(p => p.id === prayerId);
        
        if (prayer && (!prayer.responses || prayer.responses.length === 0)) {
          try {
            const fullRequest = await loadPrayerRequestDetails(prayerId);
            if (fullRequest) {
              setPrayerRequests(prev => 
                prev.map(p => p.id === prayerId ? { ...p, responses: fullRequest.responses } : p)
              );
            }
          } catch (error) {
            // Silently handle errors
          } finally {
            // Clear timeout and loading state after API call completes
            clearTimeout(loadingTimeout);
            setLoadingResponses(prev => {
              const newSet = new Set(prev);
              newSet.delete(prayerId);
              return newSet;
            });
          }
        } else if (prayer && prayer.responses && prayer.responses.length > 0) {
          // Prayer already has responses, clear loading immediately
          clearTimeout(loadingTimeout);
          setLoadingResponses(prev => {
            const newSet = new Set(prev);
            newSet.delete(prayerId);
            return newSet;
          });
        } else {
          // Prayer exists but no responses, clear loading state
          clearTimeout(loadingTimeout);
          setLoadingResponses(prev => {
            const newSet = new Set(prev);
            newSet.delete(prayerId);
            return newSet;
          });
        }
      } else if (activeTab === 'my-prayers') {
        // My Prayers logic - exact same as feed but for myPrayerRequests
        const prayer = myPrayerRequests.find(p => p.id === prayerId);
        
        if (prayer && (!prayer.responses || prayer.responses.length === 0)) {
          try {
            const fullRequest = await loadPrayerRequestDetails(prayerId);
            if (fullRequest) {
              setMyPrayerRequests(prev => 
                prev.map(p => p.id === prayerId ? { ...p, responses: fullRequest.responses } : p)
              );
            }
          } catch (error) {
            // Silently handle errors
          } finally {
            // Clear timeout and loading state after API call completes
            clearTimeout(loadingTimeout);
            setLoadingResponses(prev => {
              const newSet = new Set(prev);
              newSet.delete(prayerId);
              return newSet;
            });
          }
        } else if (prayer && prayer.responses && prayer.responses.length > 0) {
          // Prayer already has responses, clear loading immediately
          clearTimeout(loadingTimeout);
          setLoadingResponses(prev => {
            const newSet = new Set(prev);
            newSet.delete(prayerId);
            return newSet;
          });
        } else {
          // Prayer exists but no responses, clear loading state
          clearTimeout(loadingTimeout);
          setLoadingResponses(prev => {
            const newSet = new Set(prev);
            newSet.delete(prayerId);
            return newSet;
          });
        }
      }
    }
    
    setExpandedPrayers(newExpanded);
  };

  const handleDeletePrayer = async (prayerId: number, prayerTitle: string) => {
    // Confirm deletion using native Alert
    Alert.alert(
      'Delete Prayer Request',
      `Are you sure you want to delete "${prayerTitle}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              showLoading('Deleting prayer...');
              const token = await SecureStore.getItemAsync('authToken');
              
              if (!token) {
                showAlert('Error', 'Authentication required', 'error');
                return;
              }

              const response = await fetch(API_ENDPOINTS.PRAYER_DELETE(prayerId), {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });

              if (response.ok) {
                showAlert('Success', 'Prayer request deleted successfully!', 'success');
                
                // Remove from local state immediately for better UX
                setPrayerRequests(prev => prev.filter(p => p.id !== prayerId));
                setMyPrayerRequests(prev => prev.filter(p => p.id !== prayerId));
                
                // Reload lists to ensure sync with backend
                if (activeTab === 'feed') {
                  await loadPrayerFeed();
                } else if (activeTab === 'my-prayers') {
                  await loadMyPrayers();
                }
              } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete prayer request');
              }
            } catch (error) {
              console.error('Error deleting prayer:', error);
              showAlert('Error', error instanceof Error ? error.message : 'Failed to delete prayer request', 'error');
            } finally {
              hideLoading();
            }
          },
        },
      ]
    );
  };

  const openResponseModal = async (request: PrayerRequest) => {
    // Validate request has an ID
    if (!request || !request.id) {
      showAlert('Error', 'Invalid prayer request. Please try again.', 'error');
      return;
    }

    // Load full request details with responses
    const fullRequest = await loadPrayerRequestDetails(request.id);
    if (fullRequest && fullRequest.request && fullRequest.request.id) {
      setSelectedRequest(fullRequest.request);
    } else if (request.id) {
      // Fallback to the original request if API call fails but request has valid ID
      setSelectedRequest(request);
    } else {
      showAlert('Error', 'Unable to load prayer request details.', 'error');
      return;
    }
    setShowResponseModal(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const getCategoryIcon = (category: string) => {
    const cat = prayerCategories.find(c => c.value === category);
    return cat ? cat.icon : 'heart';
  };

  const getResponseTypeIcon = (type: string) => {
    const responseType = responseTypes.find(r => r.value === type);
    return responseType ? responseType.icon : 'heart';
  };

  const countAllResponses = (responses: PrayerResponse[]): number => {
    let count = responses.length;
    responses.forEach(response => {
      if (response.replies && response.replies.length > 0) {
        count += countAllResponses(response.replies);
      }
    });
    return count;
  };

  // View More functionality
  const shouldShowViewMore = (content: string) => {
    if (!content) return false;
    
    // Estimate text height based on content length and line height
    const lineHeight = 20; // Based on prayerDescription lineHeight
    const maxWidth = width - 80; // Account for padding
    const charsPerLine = Math.floor(maxWidth / 12); // Approximate characters per line
    const estimatedLines = Math.ceil(content.length / charsPerLine);
    const estimatedHeight = estimatedLines * lineHeight;
    
    // Show "View More" if content would exceed 3 lines (60px with 20px line height)
    const maxHeight = 60; // 3 lines * 20px line height
    
    return estimatedHeight > maxHeight;
  };

  const openViewMore = (title: string, content: string) => {
    console.log('🔍 Opening View More Modal');
    console.log('📝 Title:', title);
    console.log('📄 Content length:', content?.length || 0);
    setViewMoreTitle(title || 'Prayer Request');
    setViewMoreContent(content || 'No content available');
    setShowViewMoreModal(true);
  };

  const closeViewMore = () => {
    setShowViewMoreModal(false);
    setViewMoreContent('');
    setViewMoreTitle('');
  };

  const renderResponse = (response: PrayerResponse, depth: number = 0) => (
    <View key={response.id} style={styles.commentItem}>
      <View style={[styles.commentCard, depth > 0 && styles.replyCard]}>
        <View style={styles.commentHeader}>
          <View style={styles.commentAuthor}>
            {response.display_picture ? (
              <Image source={{ uri: response.display_picture }} style={styles.commentAvatar} />
            ) : (
              <View style={styles.commentAvatarPlaceholder}>
                <Ionicons name="person" size={12} color={WHITE} />
              </View>
            )}
            <View style={styles.commentAuthorInfo}>
              <Text style={styles.commentAuthorName}>
                {response.is_anonymous ? 'Anonymous' : response.display_name}
              </Text>
              <Text style={styles.commentTime}>{formatDate(response.created_at)}</Text>
            </View>
          </View>
          <View style={styles.commentTypeBadge}>
            <Ionicons name={getResponseTypeIcon(response.response_type) as any} size={10} color={WHITE} />
            <Text style={styles.commentTypeText}>
              {responseTypes.find(r => r.value === response.response_type)?.label}
            </Text>
          </View>
        </View>
        {response.message && (
          <Text style={styles.commentMessage}>{response.message}</Text>
        )}
        <TouchableOpacity 
          style={styles.replyButton}
          onPress={() => openReplyModal(response)}
        >
          <Ionicons name="arrow-undo" size={14} color={PRIMARY_COLOR} />
          <Text style={styles.replyButtonText}>Reply</Text>
        </TouchableOpacity>
      </View>
      {response.replies && response.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {response.replies.map((reply) => renderResponse(reply, depth + 1))}
        </View>
      )}
    </View>
  );

  const renderPrayerRequest = ({ item }: { item: PrayerRequest }) => {
    // Debug: Check if delete button should show
    const shouldShowDelete = userData && item.author_id === userData.userId;
    if (shouldShowDelete) {
      console.log('✅ Should show delete button for prayer:', item.id, 'User ID:', userData.userId, 'Author ID:', item.author_id);
    }
    
    return (
    <View style={styles.prayerCardWrapper}>
      <View style={styles.prayerCard}>
        <View style={styles.prayerHeader}>
          <View style={styles.prayerAuthor}>
          {item.display_picture ? (
            <Image source={{ uri: item.display_picture }} style={styles.authorAvatar} />
          ) : (
              <View style={styles.authorAvatarPlaceholder}>
                <Ionicons name="person" size={20} color={WHITE} />
              </View>
            )}
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>
                {item.is_anonymous ? 'Anonymous' : (item.display_name || item.author_name || 'Unknown User')}
              </Text>
              <View style={styles.authorMeta}>
                <Text style={styles.prayerTime}>{formatDate(item.created_at)}</Text>
              </View>
            </View>
          </View>
        <View style={styles.prayerMeta}>
          {item.is_urgent && (
            <View style={styles.urgentBadge}>
              <Ionicons name="flash" size={12} color={WHITE} />
              <Text style={styles.urgentText}>Urgent</Text>
            </View>
          )}
          <View style={styles.categoryBadge}>
            <Ionicons name={getCategoryIcon(item.category) as any} size={12} color={WHITE} />
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
          {/* Delete button - only show for user's own prayers */}
          {userData && item.author_id === userData.userId && (
            <TouchableOpacity
              style={styles.deletePrayerButton}
              onPress={() => {
                console.log('🗑️ Delete button pressed for prayer:', item.id, item.title);
                handleDeletePrayer(item.id, item.title);
              }}
            >
              <Ionicons name="trash-outline" size={16} color="#F44336" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <Text style={styles.prayerTitle}>{item.title}</Text>
      <Text style={styles.prayerDescription} numberOfLines={3}>
        {item.description}
      </Text>
      {shouldShowViewMore(item.description) && (
        <TouchableOpacity 
          style={styles.viewMoreButton}
          onPress={() => openViewMore(item.title, item.description)}
        >
          <Text style={styles.viewMoreText}>View More</Text>
        </TouchableOpacity>
      )}
      
      
      <View style={styles.prayerActions}>
        <TouchableOpacity 
          style={[
            styles.commentsButton,
            loadingResponses.has(item.id) && styles.commentsButtonLoading
          ]}
          onPress={async () => {
            // Prevent multiple rapid clicks
            if (loadingResponses.has(item.id)) {
              return;
            }
            
            await togglePrayerExpansion(item.id);
          }}
        >
          <Ionicons 
            name={loadingResponses.has(item.id) ? "hourglass-outline" : "chatbubble-outline"} 
            size={16} 
            color={loadingResponses.has(item.id) ? PRIMARY_COLOR : DARK_GRAY} 
          />
          <Text style={[
            styles.commentsButtonText,
            loadingResponses.has(item.id) && styles.commentsButtonTextLoading
          ]}>
            {loadingResponses.has(item.id) 
              ? 'Loading...'
              : item.responses && item.responses.length > 0 
                ? `${countAllResponses(item.responses)} ${countAllResponses(item.responses) === 1 ? 'response' : 'responses'}`
                : `${item.response_count} ${item.response_count === 1 ? 'response' : 'responses'}`
            }
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.respondButton}
          onPress={() => openResponseModal(item)}
        >
          <Ionicons name="heart" size={16} color={WHITE} />
          <Text style={styles.respondButtonText}>Pray & Respond</Text>
        </TouchableOpacity>
      </View>

      {/* Comments Section */}
      {expandedPrayers.has(item.id) && (
        <View style={styles.commentsSection}>
          {loadingResponses.has(item.id) ? (
            <View style={styles.commentsLoadingContainer}>
              <Text style={styles.commentsTitle}>Loading Responses...</Text>
              <View style={styles.loadingIndicator}>
                <Ionicons name="hourglass-outline" size={24} color={PRIMARY_COLOR} />
                <Text style={styles.loadingText}>Please wait while we load the responses</Text>
              </View>
              {[1, 2, 3].map((index) => (
                <View key={index} style={styles.commentSkeleton}>
                  <ShimmerEffect style={styles.skeletonAvatar}>
                    <View style={styles.skeletonAvatar} />
                  </ShimmerEffect>
                  <View style={styles.skeletonContent}>
                    <View style={styles.skeletonHeader}>
                      <ShimmerEffect style={styles.skeletonName}>
                        <View style={styles.skeletonName} />
                      </ShimmerEffect>
                      <ShimmerEffect style={styles.skeletonTime}>
                        <View style={styles.skeletonTime} />
                      </ShimmerEffect>
                    </View>
                    <ShimmerEffect style={styles.skeletonMessage}>
                      <View style={styles.skeletonMessage} />
                    </ShimmerEffect>
                    <ShimmerEffect style={styles.skeletonMessageShort}>
                      <View style={styles.skeletonMessageShort} />
                    </ShimmerEffect>
                  </View>
                </View>
              ))}
            </View>
          ) : item.responses && item.responses.length > 0 ? (
            <>
              <Text style={styles.commentsTitle}>Responses ({countAllResponses(item.responses)})</Text>
              {item.responses.map((response) => renderResponse(response))}
            </>
          ) : (
            <View style={styles.noResponses}>
              <Ionicons name="chatbubble-outline" size={24} color={BLACK} />
              <Text style={styles.noResponsesText}>No responses yet</Text>
            </View>
          )}
        </View>
      )}
      </View>
    </View>
    );
  };

  const renderEmptyFeed = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyStateIcon}>
        <Ionicons name="heart-outline" size={64} color="rgba(255,255,255,0.6)" />
      </View>
      <Text style={styles.emptyStateTitle}>No Prayers Yet</Text>
      <Text style={styles.emptyStateMessage}>
        Be the first to share a prayer request and inspire others in the community to pray together.
      </Text>
      <TouchableOpacity 
        style={styles.emptyStateButton}
        onPress={() => setShowCreateModal(true)}
      >
        <Ionicons name="add" size={20} color={WHITE} />
        <Text style={styles.emptyStateButtonText}>Share Your First Prayer</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyMyPrayers = () => {
    return (
      <View style={styles.emptyStateContainer}>
        <View style={styles.emptyStateIcon}>
          <Ionicons name="person-outline" size={64} color="rgba(255,255,255,0.6)" />
        </View>
        <Text style={styles.emptyStateTitle}>Your Prayer Journey Starts Here</Text>
        <Text style={styles.emptyStateMessage}>
          Share your prayer requests and let the community support you in prayer. Every prayer matters.
        </Text>
        <TouchableOpacity 
          style={styles.emptyStateButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="heart" size={20} color={WHITE} />
          <Text style={styles.emptyStateButtonText}>Create Your First Prayer</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderStats = () => {
    if (!stats) {
      return (
        <View style={styles.statsContainer}>
          <View style={styles.emptyStatsContainer}>
            <Ionicons name="stats-chart-outline" size={48} color="rgba(255,255,255,0.6)" />
            <Text style={styles.emptyStatsText}>No statistics available</Text>
            <Text style={styles.emptyStatsSubtext}>Tap refresh to load your prayer statistics</Text>
          </View>
        </View>
      );
    }

    return (
      <ScrollView style={styles.statsContainer} showsVerticalScrollIndicator={false}>
        {/* Personal Prayer Activity */}
        <View style={styles.statsSection}>
          <Text style={styles.statsSectionTitle}>My Prayer Activity</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="create" size={24} color={PRIMARY_COLOR} />
              <Text style={styles.statNumber}>{stats.myStats.totalRequests}</Text>
              <Text style={styles.statLabel}>Total Requests</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="time" size={24} color="#FF9800" />
              <Text style={styles.statNumber}>{stats.myStats.activeRequests}</Text>
              <Text style={styles.statLabel}>Active Now</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              <Text style={styles.statNumber}>{stats.myStats.answeredRequests}</Text>
              <Text style={styles.statLabel}>Answered</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="flash" size={24} color={SECONDARY_COLOR} />
              <Text style={styles.statNumber}>{stats.myStats.urgentRequests}</Text>
              <Text style={styles.statLabel}>Urgent</Text>
            </View>
          </View>
        </View>

        {/* Response Activity */}
        <View style={styles.statsSection}>
          <Text style={styles.statsSectionTitle}>My Responses</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="chatbubble" size={24} color="#2196F3" />
              <Text style={styles.statNumber}>{stats.myStats.totalResponsesReceived}</Text>
              <Text style={styles.statLabel}>Received</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="chatbubbles" size={24} color="#4CAF50" />
              <Text style={styles.statNumber}>{stats.myStats.totalResponsesGiven}</Text>
              <Text style={styles.statLabel}>Given</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="heart" size={24} color={SECONDARY_COLOR} />
              <Text style={styles.statNumber}>{stats.myStats.prayersGiven}</Text>
              <Text style={styles.statLabel}>Prayers</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="thumbs-up" size={24} color="#2196F3" />
              <Text style={styles.statNumber}>{stats.myStats.encouragementsGiven}</Text>
              <Text style={styles.statLabel}>Encouragements</Text>
            </View>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="book" size={24} color="#9C27B0" />
              <Text style={styles.statNumber}>{stats.myStats.testimoniesGiven}</Text>
              <Text style={styles.statLabel}>Testimonies</Text>
            </View>
          </View>
        </View>

        {/* Community Impact */}
        <View style={styles.statsSection}>
          <Text style={styles.statsSectionTitle}>Community Impact</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="people" size={24} color={PRIMARY_COLOR} />
              <Text style={styles.statNumber}>{stats.globalStats.totalPublicRequests}</Text>
              <Text style={styles.statLabel}>Total Requests</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="time" size={24} color="#FF9800" />
              <Text style={styles.statNumber}>{stats.globalStats.activePublicRequests}</Text>
              <Text style={styles.statLabel}>Active Now</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="flash" size={24} color={SECONDARY_COLOR} />
              <Text style={styles.statNumber}>{stats.globalStats.urgentPublicRequests}</Text>
              <Text style={styles.statLabel}>Urgent</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="chatbubbles" size={24} color="#4CAF50" />
              <Text style={styles.statNumber}>{stats.globalStats.totalGlobalResponses}</Text>
              <Text style={styles.statLabel}>Total Responses</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={[PRIMARY_COLOR, '#8b5a73', SECONDARY_COLOR]}
        style={styles.container}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Live Prayer</Text>
            <Text style={styles.headerSubtitle}>Pray together, grow together</Text>
          </View>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={20} color={WHITE} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'feed' && styles.activeTab]}
            onPress={() => setActiveTab('feed')}
          >
            <Ionicons name="home" size={20} color={activeTab === 'feed' ? WHITE : 'rgba(255,255,255,0.6)'} />
            <Text style={[styles.tabText, activeTab === 'feed' && styles.activeTabText]}>Feed</Text>
            </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'my-prayers' && styles.activeTab]}
            onPress={() => {
              setActiveTab('my-prayers');
              // Only load if we haven't loaded yet or if data is empty
              if (myPrayerRequests.length === 0) {
                loadMyPrayers();
              }
            }}
          >
            <Ionicons name="person" size={20} color={activeTab === 'my-prayers' ? WHITE : 'rgba(255,255,255,0.6)'} />
            <Text style={[styles.tabText, activeTab === 'my-prayers' && styles.activeTabText]}>My Prayers</Text>
            </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'stats' && styles.activeTab]}
            onPress={() => {
              setActiveTab('stats');
              loadStats();
            }}
          >
            <Ionicons name="stats-chart" size={20} color={activeTab === 'stats' ? WHITE : 'rgba(255,255,255,0.6)'} />
            <Text style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>Stats</Text>
            </TouchableOpacity>
          </View>

        {/* Content */}
        <View style={styles.content}>
          {activeTab === 'feed' && (
            <FlatList
              data={prayerRequests}
              renderItem={renderPrayerRequest}
              keyExtractor={(item) => item.id.toString()}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
              ListEmptyComponent={renderEmptyFeed}
              style={{ flex: 1 }}
            />
          )}
          
          {activeTab === 'my-prayers' && (
            <FlatList
              data={myPrayerRequests}
              renderItem={renderPrayerRequest}
              keyExtractor={(item) => `my-${item.id}`}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
              ListEmptyComponent={renderEmptyMyPrayers}
              style={{ flex: 1 }}
            />
          )}
          
          {activeTab === 'stats' && renderStats()}
        </View>

        {/* Create Prayer Request Modal */}
        <Modal
          visible={showCreateModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowCreateModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color={DARK_GRAY} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Create Prayer Request</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Title *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newRequest.title}
                  onChangeText={(text) => {
                    setNewRequest({ ...newRequest, title: text });
                  }}
                  placeholder="Enter prayer request title"
                  placeholderTextColor={BLACK}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description *</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={newRequest.description}
                  onChangeText={(text) => {
                    setNewRequest({ ...newRequest, description: text });
                  }}
                  placeholder="Describe your prayer request in detail..."
                  placeholderTextColor={BLACK}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {prayerCategories.map((category) => (
              <TouchableOpacity
                      key={category.value}
                style={[
                        styles.categoryChip,
                        newRequest.category === category.value && styles.selectedCategoryChip
                ]}
                      onPress={() => setNewRequest({ ...newRequest, category: category.value })}
              >
                <Ionicons 
                  name={category.icon as any} 
                        size={16} 
                        color={newRequest.category === category.value ? WHITE : DARK_GRAY} 
                />
                <Text style={[
                        styles.categoryChipText,
                        newRequest.category === category.value && styles.selectedCategoryChipText
                ]}>
                        {category.label}
                </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.toggleGroup}>
                <Text style={styles.toggleExplanation}>
                  💡 Anonymous prayers are automatically public to share with the community
                </Text>
                <TouchableOpacity
                  style={styles.toggleItem}
                  onPress={() => {
                    const newAnonymous = !newRequest.isAnonymous;
                    setNewRequest({ 
                      ...newRequest, 
                      isAnonymous: newAnonymous,
                      // If posting anonymously, automatically make it public
                      isPublic: newAnonymous ? true : newRequest.isPublic
                    });
                  }}
                >
                  <Ionicons 
                    name={newRequest.isAnonymous ? "checkmark-circle" : "ellipse-outline"} 
                    size={20} 
                    color={newRequest.isAnonymous ? PRIMARY_COLOR : DARK_GRAY} 
                  />
                  <Text style={styles.toggleText}>Post anonymously</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.toggleItem}
                  onPress={() => setNewRequest({ ...newRequest, isUrgent: !newRequest.isUrgent })}
                >
                  <Ionicons 
                    name={newRequest.isUrgent ? "checkmark-circle" : "ellipse-outline"} 
                    size={20} 
                    color={newRequest.isUrgent ? SECONDARY_COLOR : DARK_GRAY} 
                  />
                  <Text style={styles.toggleText}>Mark as urgent</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.toggleItem,
                    newRequest.isAnonymous && styles.disabledToggleItem
                  ]}
                  onPress={() => {
                    // Don't allow changing public status if anonymous
                    if (!newRequest.isAnonymous) {
                      setNewRequest({ ...newRequest, isPublic: !newRequest.isPublic });
                    }
                  }}
                >
                  <Ionicons 
                    name={newRequest.isPublic ? "checkmark-circle" : "ellipse-outline"} 
                    size={20} 
                    color={newRequest.isAnonymous ? SOFT_GRAY : (newRequest.isPublic ? "#4CAF50" : DARK_GRAY)} 
                  />
                <Text style={[
                    styles.toggleText,
                    newRequest.isAnonymous && styles.disabledToggleText
                ]}>
                    Make public {newRequest.isAnonymous && "(auto-enabled for anonymous)"}
                </Text>
              </TouchableOpacity>
          </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <View style={styles.formStatus}>
                <Text style={styles.formStatusText}>
                  Title: {newRequest.title ? '✓' : '✗'} | Description: {newRequest.description ? '✓' : '✗'}
                </Text>
        </View>
              <TouchableOpacity
                style={[
                  styles.createButtonLarge,
                  (!newRequest.title.trim() || !newRequest.description.trim()) && styles.disabledButton
                ]}
                onPress={handleCreatePrayerRequest}
                disabled={!newRequest.title.trim() || !newRequest.description.trim()}
              >
                <Ionicons name="heart" size={20} color={WHITE} />
                <Text style={styles.createButtonText}>Create Prayer Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Prayer Response Modal */}
        <Modal
          visible={showResponseModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={closeResponseModal}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closeResponseModal}>
                <Ionicons name="close" size={24} color={DARK_GRAY} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Pray & Respond</Text>
              <View style={{ width: 24 }} />
            </View>

            {selectedRequest && (
              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Response Type</Text>
                  <View style={styles.responseTypeGrid}>
                    {responseTypes.map((type) => (
                      <TouchableOpacity
                        key={type.value}
                        style={[
                          styles.responseTypeCard,
                          responseData.responseType === type.value && styles.selectedResponseTypeCard
                        ]}
                        onPress={() => setResponseData({ ...responseData, responseType: type.value as any })}
                      >
                        <Ionicons 
                          name={type.icon as any} 
                          size={24} 
                          color={responseData.responseType === type.value ? WHITE : type.color} 
                        />
                <Text style={[
                          styles.responseTypeText,
                          responseData.responseType === type.value && styles.selectedResponseTypeText
                ]}>
                          {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Message *</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    value={responseData.message}
                    onChangeText={(text) => setResponseData({ ...responseData, message: text })}
                    placeholder="Add a message of encouragement or prayer..."
                    placeholderTextColor={BLACK}
                    multiline
                    numberOfLines={6}
                  />
            </View>

                <TouchableOpacity
                  style={styles.toggleItem}
                  onPress={() => setResponseData({ ...responseData, isAnonymous: !responseData.isAnonymous })}
                >
                  <Ionicons 
                    name={responseData.isAnonymous ? "checkmark-circle" : "ellipse-outline"} 
                    size={20} 
                    color={responseData.isAnonymous ? PRIMARY_COLOR : DARK_GRAY} 
                  />
                  <Text style={styles.toggleText}>Respond anonymously</Text>
              </TouchableOpacity>
              </ScrollView>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[
                  styles.createButtonLarge,
                  !responseData.message.trim() && styles.disabledButton
                ]}
                onPress={handlePrayerResponse}
                disabled={!responseData.message.trim()}
              >
                <Ionicons name="heart" size={20} color={WHITE} />
                <Text style={styles.createButtonText}>Send Response</Text>
              </TouchableOpacity>
            </View>
        </View>
        </Modal>

        {/* Reply Modal */}
        <Modal
          visible={showReplyModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowReplyModal(false)}
        >
          <LinearGradient
            colors={[PRIMARY_COLOR, SECONDARY_COLOR]}
            style={styles.modalOverlay}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Reply to Response</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowReplyModal(false)}
                >
                  <Ionicons name="close" size={24} color={WHITE} />
                </TouchableOpacity>
            </View>

              {selectedResponse && (
                <View style={styles.replyPreview}>
                  <View style={styles.replyPreviewHeader}>
                    <Text style={styles.replyPreviewAuthor}>
                      {selectedResponse.is_anonymous ? 'Anonymous' : selectedResponse.display_name}
                    </Text>
                    <Text style={styles.replyPreviewTime}>
                      {formatDate(selectedResponse.created_at)}
                    </Text>
                  </View>
                  <Text style={styles.replyPreviewMessage} numberOfLines={2}>
                    {selectedResponse.message}
                  </Text>
                </View>
              )}

              <ScrollView style={styles.modalContent}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Response Type</Text>
                  <View style={styles.responseTypeGrid}>
                    {responseTypes.map((type) => (
                      <TouchableOpacity
                        key={type.value}
                        style={[
                          styles.responseTypeOption,
                          replyData.responseType === type.value && styles.selectedResponseType
                        ]}
                        onPress={() => setReplyData({ ...replyData, responseType: type.value as 'prayer' | 'encouragement' | 'testimony' | 'other' })}
                      >
                        <Ionicons name={type.icon as any} size={20} color={replyData.responseType === type.value ? WHITE : PRIMARY_COLOR} />
                        <Text style={[
                          styles.responseTypeText,
                          replyData.responseType === type.value && styles.selectedResponseTypeText
                        ]}>
                          {type.label}
                        </Text>
              </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Message (Optional)</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    value={replyData.message}
                    onChangeText={(text) => setReplyData({ ...replyData, message: text })}
                    placeholder="Add a reply..."
                    placeholderTextColor={BLACK}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.toggleGroup}>
                  <TouchableOpacity
                    style={styles.toggleItem}
                    onPress={() => setReplyData({ ...replyData, isAnonymous: !replyData.isAnonymous })}
                  >
                    <View style={[styles.checkbox, replyData.isAnonymous && styles.checkedBox]}>
                      {replyData.isAnonymous && <Ionicons name="checkmark" size={16} color={WHITE} />}
                    </View>
                    <Text style={styles.toggleText}>Reply anonymously</Text>
              </TouchableOpacity>
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.createButtonLarge}
                  onPress={handleReply}
                >
                  <Ionicons name="arrow-undo" size={20} color={WHITE} />
                  <Text style={styles.createButtonText}>Send Reply</Text>
              </TouchableOpacity>
            </View>
        </View>
            </LinearGradient>
          </Modal>

        {/* Custom Alert Modal */}
        <Modal
          visible={showCustomAlert}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCustomAlert(false)}
        >
          <View style={styles.alertOverlay}>
            <View style={styles.alertContainer}>
              <LinearGradient
                colors={
                  alertData.type === 'success' 
                    ? ['#4CAF50', '#45a049']
                    : alertData.type === 'error'
                    ? ['#f44336', '#d32f2f']
                    : alertData.type === 'warning'
                    ? ['#ff9800', '#f57c00']
                    : ['#2196F3', '#1976D2']
                }
                style={styles.alertGradient}
              >
                <View style={styles.alertContent}>
                  <View style={styles.alertIconContainer}>
                    <Ionicons
                      name={
                        alertData.type === 'success' 
                          ? 'checkmark-circle'
                          : alertData.type === 'error'
                          ? 'close-circle'
                          : alertData.type === 'warning'
                          ? 'warning'
                          : 'information-circle'
                      }
                      size={48}
                      color={WHITE}
                    />
                  </View>
                  
                  <Text style={styles.alertTitle}>{alertData.title}</Text>
                  <Text style={styles.alertMessage}>{alertData.message}</Text>
                  
                  <TouchableOpacity
                    style={styles.alertButton}
                    onPress={() => {
                      setShowCustomAlert(false);
                      alertData.onConfirm();
                    }}
                  >
                    <Text style={styles.alertButtonText}>OK</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          </View>
        </Modal>

        {/* View More Modal - Simplified */}
        <Modal
          visible={showViewMoreModal}
          animationType="slide"
          transparent={false}
          onRequestClose={closeViewMore}
        >
          <SafeAreaView style={styles.viewMoreModalSafeArea}>
            <View style={styles.viewMoreModalFullScreen}>
              {/* Header */}
              <View style={styles.viewMoreModalSimpleHeader}>
                <Text style={styles.viewMoreModalSimpleTitle} numberOfLines={2}>
                  {viewMoreTitle || 'Prayer Request'}
                </Text>
                <TouchableOpacity onPress={closeViewMore} style={styles.viewMoreModalSimpleCloseButton}>
                  <Ionicons name="close-circle" size={32} color={PRIMARY_COLOR} />
                  </TouchableOpacity>
                </View>

              {/* Content */}
              <ScrollView 
                style={styles.viewMoreModalSimpleContent}
                contentContainerStyle={styles.viewMoreModalSimpleContentContainer}
                showsVerticalScrollIndicator={true}
              >
                <Text style={styles.viewMoreModalSimpleText}>
                  {viewMoreContent || 'No content available'}
                </Text>
                </ScrollView>
            </View>
          </SafeAreaView>
        </Modal>
            </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PRIMARY_COLOR,
  },
  container: {
    flex: 1,
    paddingTop: STATUS_BAR_OFFSET,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: WHITE,
    fontFamily: 'serif',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'serif',
    marginTop: 4,
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  activeTab: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    marginLeft: 6,
  },
  activeTabText: {
    color: WHITE,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    width: '100%',
  },
  listContainer: {
    paddingBottom: 20,
  },
  prayerCardWrapper: {
    width: '100%',
    paddingHorizontal: 0,
  },
  prayerCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    width: '100%',
    maxWidth: '100%',
    flex: 1,
  },
  prayerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  prayerAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  authorAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: DARK_GRAY,
  },
  authorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  prayerTime: {
    fontSize: 12,
    color: DARK_GRAY,
  },
  prayerMeta: {
    alignItems: 'flex-end',
  },
  deletePrayerButton: {
    marginTop: 8,
    padding: 4,
    borderRadius: 4,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SECONDARY_COLOR,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  urgentText: {
    color: WHITE,
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: WHITE,
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  prayerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: DARK_GRAY,
    marginBottom: 8,
  },
  prayerDescription: {
    fontSize: 14,
    color: DARK_GRAY,
    lineHeight: 20,
    marginBottom: 16,
  },
  prayerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  commentsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: OFF_WHITE,
  },
  commentsButtonText: {
    color: DARK_GRAY,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  commentsButtonLoading: {
    backgroundColor: 'rgba(123, 77, 98, 0.1)',
    borderWidth: 1,
    borderColor: PRIMARY_COLOR,
  },
  commentsButtonTextLoading: {
    color: PRIMARY_COLOR,
    fontWeight: '600',
  },
  respondButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  respondButtonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  commentsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: SOFT_GRAY,
    width: '100%',
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: DARK_GRAY,
    marginBottom: 12,
  },
  commentItem: {
    width: '100%',
    marginBottom: 8,
  },
  commentCard: {
    backgroundColor: OFF_WHITE,
    borderRadius: 8,
    padding: 12,
    width: '100%',
  },
  replyCard: {
    marginLeft: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderLeftWidth: 3,
    borderLeftColor: PRIMARY_COLOR,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    width: '100%',
  },
  commentAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    maxWidth: '80%',
  },
  commentAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  commentAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  commentAuthorInfo: {
    flex: 1,
    minWidth: 0,
  },
  commentAuthorName: {
    fontSize: 12,
    fontWeight: '600',
    color: DARK_GRAY,
  },
  commentTime: {
    fontSize: 10,
    color: DARK_GRAY,
    marginTop: 2,
  },
  commentTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexShrink: 0,
  },
  commentTypeText: {
    color: WHITE,
    fontSize: 8,
    fontWeight: '600',
    marginLeft: 2,
  },
  commentMessage: {
    fontSize: 12,
    color: DARK_GRAY,
    lineHeight: 16,
    width: '100%',
    marginBottom: 8,
  },
  commentsLoadingContainer: {
    width: '100%',
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 14,
    color: DARK_GRAY,
    marginLeft: 8,
    fontStyle: 'italic',
  },
  commentSkeleton: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 0,
    marginBottom: 8,
  },
  skeletonAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
    marginRight: 8,
  },
  skeletonContent: {
    flex: 1,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  skeletonName: {
    width: 80,
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    marginRight: 8,
  },
  skeletonTime: {
    width: 50,
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
  },
  skeletonMessage: {
    width: '90%',
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    marginBottom: 4,
  },
  skeletonMessageShort: {
    width: '60%',
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
  },
  noResponses: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  noResponsesText: {
    fontSize: 14,
    color: DARK_GRAY,
    marginLeft: 8,
    fontStyle: 'italic',
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(123, 77, 98, 0.1)',
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  replyButtonText: {
    fontSize: 12,
    color: PRIMARY_COLOR,
    marginLeft: 4,
    fontWeight: '500',
  },
  repliesContainer: {
    marginTop: 8,
    width: '100%',
  },
  replyPreview: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  replyPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  replyPreviewAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: WHITE,
  },
  replyPreviewTime: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  replyPreviewMessage: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  closeButton: {
    padding: 8,
  },
  responseTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PRIMARY_COLOR,
    backgroundColor: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
  },
  selectedResponseType: {
    backgroundColor: PRIMARY_COLOR,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: PRIMARY_COLOR,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: PRIMARY_COLOR,
  },
  statsContainer: {
    flex: 1,
  },
  emptyStatsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStatsText: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 16,
    fontFamily: 'serif',
    textAlign: 'center',
  },
  emptyStatsSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 8,
    textAlign: 'center',
  },
  statsSection: {
    marginBottom: 24,
  },
  statsSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: WHITE,
    marginBottom: 16,
    fontFamily: 'serif',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: DARK_GRAY,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: DARK_GRAY,
    marginTop: 4,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: WHITE,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: SOFT_GRAY,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: DARK_GRAY,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: DARK_GRAY,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: SOFT_GRAY,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: DARK_GRAY,
    backgroundColor: OFF_WHITE,
  },
  textArea: {
    height: 150,
    textAlignVertical: 'top',
  },
  categoryScroll: {
    marginTop: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: OFF_WHITE,
    marginRight: 8,
    borderWidth: 1,
    borderColor: SOFT_GRAY,
  },
  selectedCategoryChip: {
    backgroundColor: PRIMARY_COLOR,
    borderColor: PRIMARY_COLOR,
  },
  categoryChipText: {
    fontSize: 14,
    color: DARK_GRAY,
    marginLeft: 6,
  },
  selectedCategoryChipText: {
    color: WHITE,
  },
  toggleGroup: {
    marginTop: 20,
  },
  toggleExplanation: {
    fontSize: 12,
    color: DARK_GRAY,
    fontStyle: 'italic',
    marginBottom: 12,
    textAlign: 'center',
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  toggleText: {
    fontSize: 16,
    color: DARK_GRAY,
    marginLeft: 12,
  },
  disabledToggleItem: {
    opacity: 0.6,
  },
  disabledToggleText: {
    color: DARK_GRAY,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: SOFT_GRAY,
  },
  createButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 16,
    borderRadius: 12,
  },
  createButtonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  formStatus: {
    marginBottom: 12,
    alignItems: 'center',
  },
  formStatusText: {
    fontSize: 12,
    color: DARK_GRAY,
    fontFamily: 'monospace',
  },
  disabledButton: {
    opacity: 0.5,
  },
  requestPreview: {
    backgroundColor: OFF_WHITE,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  requestAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  requestAuthorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  requestAuthorAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  requestAuthorInfo: {
    flex: 1,
  },
  requestAuthorName: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK_GRAY,
  },
  requestAuthorMeta: {
    fontSize: 12,
    color: DARK_GRAY,
    marginTop: 2,
  },
  requestMeta: {
    alignItems: 'flex-end',
  },
  urgentBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SECONDARY_COLOR,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 4,
  },
  urgentTextSmall: {
    color: WHITE,
    fontSize: 8,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  categoryBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryTextSmall: {
    color: WHITE,
    fontSize: 8,
    fontWeight: '600',
    marginLeft: 2,
  },
  requestPreviewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: DARK_GRAY,
    marginBottom: 8,
  },
  requestPreviewDescription: {
    fontSize: 14,
    color: DARK_GRAY,
    lineHeight: 20,
    marginBottom: 12,
  },
  requestStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: SOFT_GRAY,
  },
  statItemSmall: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statTextSmall: {
    fontSize: 11,
    color: BLACK,
    marginLeft: 4,
  },
  responsesSection: {
    marginBottom: 20,
  },
  responsesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: DARK_GRAY,
    marginBottom: 12,
  },
  responseCard: {
    backgroundColor: WHITE,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: SOFT_GRAY,
  },
  responseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  responseAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  responseAuthorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  responseAuthorAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  responseAuthorInfo: {
    flex: 1,
  },
  responseAuthorName: {
    fontSize: 12,
    fontWeight: '600',
    color: DARK_GRAY,
  },
  responseTime: {
    fontSize: 10,
    color: DARK_GRAY,
    marginTop: 2,
  },
  responseTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  responseTypeText: {
    color: BLACK,
    fontSize: 8,
    fontWeight: '600',
    marginLeft: 2,
  },
  responseMessage: {
    fontSize: 12,
    color: DARK_GRAY,
    lineHeight: 16,
  },
  responseTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  responseTypeCard: {
    width: '48%',
    backgroundColor: OFF_WHITE,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: SOFT_GRAY,
  },
  selectedResponseTypeCard: {
    backgroundColor: PRIMARY_COLOR,
    borderColor: PRIMARY_COLOR,
  },
  selectedResponseTypeText: {
    color: BLACK,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyStateIcon: {
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: WHITE,
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'serif',
  },
  emptyStateMessage: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  emptyStateButtonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Custom Alert Styles
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  alertContainer: {
    width: '100%',
    maxWidth: 350,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  alertGradient: {
    padding: 0,
  },
  alertContent: {
    padding: 30,
    alignItems: 'center',
  },
  alertIconContainer: {
    marginBottom: 20,
  },
  alertTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: WHITE,
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'serif',
  },
  alertMessage: {
    fontSize: 16,
    color: WHITE,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
    opacity: 0.9,
  },
  alertButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  alertButtonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
  
  // View More Button Styles
  viewMoreButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  viewMoreText: {
    color: PRIMARY_COLOR,
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  
  // View More Modal Styles
  // View More Modal - Simplified Styles
  viewMoreModalSafeArea: {
    flex: 1,
    backgroundColor: WHITE,
  },
  viewMoreModalFullScreen: {
    flex: 1,
    backgroundColor: WHITE,
  },
  viewMoreModalSimpleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 10,
    borderBottomWidth: 2,
    borderBottomColor: PRIMARY_COLOR,
    backgroundColor: WHITE,
  },
  viewMoreModalSimpleTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
    marginRight: 15,
    fontFamily: 'serif',
  },
  viewMoreModalSimpleCloseButton: {
    padding: 5,
  },
  viewMoreModalSimpleContent: {
    flex: 1,
    backgroundColor: WHITE,
  },
  viewMoreModalSimpleContentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  viewMoreModalSimpleText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 26,
    fontFamily: 'serif',
  },
}); 