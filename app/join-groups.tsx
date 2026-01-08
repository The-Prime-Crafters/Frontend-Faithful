import { API_ENDPOINTS } from '@/constants/API';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import {
  Linking,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
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

// Get user's timezone (prioritizes offset-based detection over system settings)
const getUserTimezone = (): string => {
  try {
    // First, get the timezone offset (more reliable than system settings)
    const offset = -new Date().getTimezoneOffset(); // Minutes (positive for east of UTC)
    
    // For Pakistan (UTC+5 = -300 minutes), always use Asia/Karachi
    if (offset === -300) {
      return 'Asia/Karachi';
    }
    
    // Common timezone mappings based on offset
    const OFFSET_MAP: Record<number, string> = {
      '-720': 'Pacific/Auckland',      // UTC+12
      '-660': 'Pacific/Noumea',        // UTC+11
      '-600': 'Australia/Sydney',      // UTC+10
      '-540': 'Asia/Tokyo',            // UTC+9
      '-480': 'Asia/Singapore',        // UTC+8
      '-420': 'Asia/Bangkok',          // UTC+7
      '-360': 'Asia/Dhaka',            // UTC+6
      '-300': 'Asia/Karachi',          // UTC+5 (Pakistan)
      '-270': 'Asia/Kabul',            // UTC+4:30
      '-240': 'Asia/Dubai',            // UTC+4
      '-180': 'Europe/Moscow',         // UTC+3
      '-120': 'Europe/Athens',         // UTC+2
      '-60': 'Europe/Paris',           // UTC+1
      '0': 'Europe/London',            // UTC+0
      '300': 'America/Chicago',        // UTC-5
      '360': 'America/Denver',         // UTC-6
      '420': 'America/Los_Angeles',    // UTC-7
    };
    
    const offsetBasedTimezone = OFFSET_MAP[offset];
    if (offsetBasedTimezone) {
      return offsetBasedTimezone;
    }
    
    // Try Intl API as fallback
    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      try {
        const intlTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (intlTimezone && intlTimezone !== 'UTC') {
          return intlTimezone;
        }
      } catch (intlError) {
        console.log('Intl API not available');
      }
    }
    
    return 'UTC';
  } catch (error) {
    console.error('Error getting timezone:', error);
    return 'UTC';
  }
};

// Types
interface StudyGroup {
  id: string;
  title?: string;
  description?: string;
  maxParticipants: number;
  startTime: string;
  startTimeLocal?: string;
  durationMinutes: number;
  attendeeEmails?: string[];
  frequency?: string;
  interval?: number;
  daysOfWeek?: number[];
  endDate?: string;
  endDateLocal?: string;
  // Google Meet fields
  meetLink?: string;
  meetId?: string;
  theme?: string;
  isRecurring: boolean;
  createdAt: string;
  createdAtLocal?: string;
  userRole?: string;
  joinedAt?: string;
  creatorName?: string;
  creatorEmail?: string;
  currentMembers?: string;
  isActive?: boolean;
  // New fields from userStatus
  isMember?: boolean;
  hasJoinRequest?: boolean;
  joinRequestStatus?: string | null;
  joinRequestMessage?: string | null;
  joinRequestedAt?: string | null;
  timezone?: string;
  requiresApproval?: boolean;
}

interface JoinGroupsScreenProps {
  selectedDate: Date;
  onBack: () => void;
}

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatDateShort = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const formatDayOfWeek = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long'
  });
};

// Custom Alert Component
interface AlertConfig {
  visible: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'confirm';
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

const CustomAlert = ({ config, onClose }: { config: AlertConfig; onClose: () => void }) => {
  if (!config.visible) return null;

  return (
    <View style={styles.alertOverlay}>
      <View style={styles.alertContainer}>
        <View style={styles.alertHeader}>
          <Text style={styles.alertTitle}>{config.title}</Text>
        </View>
        <Text style={styles.alertMessage}>{config.message}</Text>
        <View style={styles.alertButtons}>
          {config.type === 'confirm' && (
            <TouchableOpacity
              style={[styles.alertButton, styles.alertCancelButton]}
              onPress={() => {
                config.onCancel?.();
                onClose();
              }}
            >
              <Text style={styles.alertCancelButtonText}>
                {config.cancelText || 'Cancel'}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.alertButton,
              config.type === 'confirm' ? styles.alertConfirmButton : styles.alertPrimaryButton
            ]}
            onPress={() => {
              config.onConfirm?.();
              onClose();
            }}
          >
            <Text style={[
              styles.alertButtonText,
              config.type === 'confirm' ? styles.alertConfirmButtonText : styles.alertPrimaryButtonText
            ]}>
              {config.confirmText || (config.type === 'confirm' ? 'Confirm' : 'OK')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default function JoinGroupsScreen({ selectedDate, onBack }: JoinGroupsScreenProps) {
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom alert state
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({
    visible: false,
    title: '',
    message: '',
    type: 'info'
  });
  
  // Join message modal state
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [joinMessage, setJoinMessage] = useState('I would like to join this study group!');
  
  // Fallback state for showing all groups
  const [showingAllGroups, setShowingAllGroups] = useState(false);

  // Alert helper functions
  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setAlertConfig({
      visible: true,
      title,
      message,
      type
    });
  };

  const hideAlert = () => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  };

  const showSuccessAlert = (message: string) => {
    showAlert('Success', message, 'success');
  };

  const showErrorAlert = (message: string) => {
    showAlert('Error', message, 'error');
  };

  const showConfirmAlert = (title: string, message: string, onConfirm: () => void) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      type: 'confirm',
      onConfirm
    });
  };

  useEffect(() => {
    loadStudyGroupsForDate();
  }, [selectedDate]);

  const loadStudyGroupsForDate = async () => {
    try {
      setLoading(true);
      
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        console.log('❌ No auth token found');
        setStudyGroups([]);
        setLoading(false);
        return;
      }

      // Format date for API (YYYY-MM-DD) - using local date to avoid timezone issues
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      
      // Get user's timezone
      const userTimezone = getUserTimezone();
      console.log('🌍 User timezone:', userTimezone);
      
      console.log('🔄 Fetching study groups for date:', dateString);
      console.log('📅 Selected date object:', selectedDate);
      console.log('📅 Manual date construction:', `${year}-${month}-${day}`);
      
      // First, let's try to get all public groups without date filter to see what's available
      console.log('🔍 Fetching ALL public groups first...');
      const allGroupsResponse = await fetch(API_ENDPOINTS.STUDY_GROUPS_PUBLIC, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-timezone': userTimezone,
        },
      });
      
      let allGroupsData = null;
      if (allGroupsResponse.ok) {
        allGroupsData = await allGroupsResponse.json();
        console.log('📊 ALL public groups (no date filter):');
        if (allGroupsData.success && allGroupsData.data && allGroupsData.data.groups) {
          console.log(`Found ${allGroupsData.data.groups.length} total groups`);
          allGroupsData.data.groups.forEach((group: any, index: number) => {
            console.log(`Group ${index + 1}:`, {
              id: group.id,
              title: group.title,
              scheduled_time: group.scheduled_time,
              next_occurrence: group.next_occurrence,
              is_recurring: group.is_recurring,
              recurrence_pattern: group.recurrence_pattern
            });
          });
        }
      }
      
      // Now fetch with date filter
      const response = await fetch(`${API_ENDPOINTS.STUDY_GROUPS_PUBLIC}?date=${dateString}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-timezone': userTimezone,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Study groups fetched successfully:');
        console.log('📊 Raw API Response:', JSON.stringify(data, null, 2));
        
        let groupsForDate: any[] = [];
        
        if (data.success && data.data && data.data.groups) {
          console.log('🔍 Raw groups from API (before normalization):');
          console.log(`Found ${data.data.groups.length} groups for date ${dateString}`);
          
          // Map API response to our StudyGroup interface
          const normalizedGroups = data.data.groups.map((group: any) => ({
            id: group.id.toString(),
            title: group.title || 'Untitled Study Group',
            description: group.description || 'No description',
            maxParticipants: group.max_participants || 10,
            startTime: group.scheduled_time || group.next_occurrence,
            startTimeLocal: group.scheduled_time_local || group.next_occurrence_local,
            durationMinutes: group.duration_minutes || 60,
            attendeeEmails: group.attendeeEmails || [],
            frequency: group.recurrence_pattern || 'weekly',
            interval: group.recurrence_interval || 1,
            daysOfWeek: group.recurrence_days_of_week || [],
            endDate: group.recurrence_end_date,
            endDateLocal: group.recurrence_end_date_local,
            meetLink: group.meet_link,
            meetId: group.meet_id,
            theme: group.theme || 'General',
            isRecurring: group.is_recurring || false,
            createdAt: group.created_at || new Date().toISOString(),
            createdAtLocal: group.created_at_local,
            userRole: group.userStatus?.role || group.user_role || null,
            joinedAt: group.userStatus?.joinedAt || group.user_joined_at || null,
            creatorName: group.creator_name,
            creatorEmail: group.creator_email,
            currentMembers: group.current_members?.toString() || '0',
            isActive: group.is_active !== false,
            isMember: group.userStatus?.isMember || false,
            hasJoinRequest: group.userStatus?.hasJoinRequest || false,
            joinRequestStatus: group.userStatus?.joinRequestStatus || group.user_join_request_status || null,
            joinRequestMessage: group.userStatus?.joinRequestMessage || null,
            joinRequestedAt: group.userStatus?.joinRequestedAt || group.user_join_requested_at || null,
            timezone: group.timezone,
            requiresApproval: group.requires_approval
          }));

          groupsForDate = normalizedGroups;
          setStudyGroups(groupsForDate);
          setShowingAllGroups(false);
          console.log('📚 Loaded study groups for date:', groupsForDate.length);
        } else {
          console.log('⚠️ No study groups data in response');
          setStudyGroups([]);
        }
        
        // If no groups found for specific date, show all available groups as fallback
        if (groupsForDate.length === 0 && allGroupsData && allGroupsData.success && allGroupsData.data && allGroupsData.data.groups) {
          console.log('⚠️ No groups found for specific date, showing all available groups...');
          setShowingAllGroups(true);
          
          const allNormalizedGroups = allGroupsData.data.groups.map((group: any) => ({
            id: group.id.toString(),
            title: group.title || 'Untitled Study Group',
            description: group.description || 'No description',
            maxParticipants: group.max_participants || 10,
            startTime: group.scheduled_time || group.next_occurrence,
            startTimeLocal: group.scheduled_time_local || group.next_occurrence_local,
            durationMinutes: group.duration_minutes || 60,
            attendeeEmails: group.attendeeEmails || [],
            frequency: group.recurrence_pattern || 'weekly',
            interval: group.recurrence_interval || 1,
            daysOfWeek: group.recurrence_days_of_week || [],
            endDate: group.recurrence_end_date,
            endDateLocal: group.recurrence_end_date_local,
            meetLink: group.meet_link,
            meetId: group.meet_id,
            theme: group.theme || 'General',
            isRecurring: group.is_recurring || false,
            createdAt: group.created_at || new Date().toISOString(),
            createdAtLocal: group.created_at_local,
            userRole: group.userStatus?.role || group.user_role || null,
            joinedAt: group.userStatus?.joinedAt || group.user_joined_at || null,
            creatorName: group.creator_name,
            creatorEmail: group.creator_email,
            currentMembers: group.current_members?.toString() || '0',
            isActive: group.is_active !== false,
            isMember: group.userStatus?.isMember || false,
            hasJoinRequest: group.userStatus?.hasJoinRequest || false,
            joinRequestStatus: group.userStatus?.joinRequestStatus || group.user_join_request_status || null,
            joinRequestMessage: group.userStatus?.joinRequestMessage || null,
            joinRequestedAt: group.userStatus?.joinRequestedAt || group.user_join_requested_at || null,
            timezone: group.timezone,
            requiresApproval: group.requires_approval
          }));
          
          setStudyGroups(allNormalizedGroups);
          console.log('📚 Fallback: Loaded all available groups:', allNormalizedGroups.length);
        }
      } else {
        console.error('❌ Failed to fetch study groups:', response.status);
        setStudyGroups([]);
      }
    } catch (error) {
      console.error('❌ Error loading study groups for date:', error);
      setStudyGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = (groupId: string) => {
    setSelectedGroupId(groupId);
    setJoinMessage('I would like to join this study group!');
    setShowJoinModal(true);
  };

  const handleSubmitJoinRequest = async () => {
    if (!selectedGroupId) return;
    
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        showErrorAlert('Please sign in to join study groups');
        return;
      }

      console.log('🔄 REQUESTING TO JOIN STUDY GROUP');
      console.log('📋 Group ID:', selectedGroupId);
      console.log('📋 Join Message:', joinMessage.trim() || 'I would like to join this study group!');
      console.log('📡 API Endpoint:', API_ENDPOINTS.getStudyGroupRequestJoin(selectedGroupId));

      const requestBody = {
        message: joinMessage.trim() || 'I would like to join this study group!'
      };

      console.log('📤 Request Body:', JSON.stringify(requestBody, null, 2));

      const userTimezone = getUserTimezone();
      console.log('🌍 User timezone:', userTimezone);

      const response = await fetch(API_ENDPOINTS.getStudyGroupRequestJoin(selectedGroupId), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-timezone': userTimezone,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 Response Status:', response.status);
      console.log('📥 Response Headers:', response.headers);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ JOIN REQUEST SUBMITTED SUCCESSFULLY');
        console.log('📊 Full Response:', JSON.stringify(result, null, 2));
        
        showSuccessAlert('Your join request has been submitted! The group admin will review it.');
        
        // Refresh the groups list
        await loadStudyGroupsForDate();
        // Close modal
        setShowJoinModal(false);
        setSelectedGroupId(null);
      } else {
        const error = await response.json();
        console.log('❌ FAILED TO SUBMIT JOIN REQUEST');
        console.log('📥 Error Response:', JSON.stringify(error, null, 2));
        showErrorAlert(error.message || 'Failed to submit join request');
      }
    } catch (error) {
      console.log('💥 EXCEPTION CAUGHT');
      console.error('❌ Error submitting join request:', error);
      showErrorAlert('Failed to submit join request. Please try again.');
    }
  };

  const handleJoinConference = async (group: StudyGroup) => {
    try {
      console.log('🎥 Joining conference for group:', group.id);
      console.log('🔗 Meet link:', group.meetLink);

      if (group.meetLink) {
        // Validate and clean the URL
        let meetUrl = group.meetLink.trim();
        
        // Ensure URL has protocol
        if (!meetUrl.startsWith('http://') && !meetUrl.startsWith('https://')) {
          meetUrl = 'https://' + meetUrl;
        }
        
        console.log('🎥 Opening Google Meet:', meetUrl);
        
        try {
          // Try to open directly without canOpenURL check (more reliable)
          await Linking.openURL(meetUrl);
        } catch (linkError) {
          console.error('❌ Failed to open meet link:', linkError);
          showErrorAlert('Cannot open the meeting link. Please check if the link is valid or try opening it manually.');
        }
      } else {
        // Fallback: create a new Google Meet
        const meetingUrl = `https://meet.google.com/new`;
        console.log('🎥 Creating new Google Meet:', meetingUrl);
        
        try {
          await Linking.openURL(meetingUrl);
        } catch (linkError) {
          console.error('❌ Failed to create new meet:', linkError);
          showErrorAlert('Cannot open Google Meet. Please make sure you have a browser installed.');
        }
      }
    } catch (error) {
      console.error('❌ Error joining conference:', error);
      showErrorAlert('Failed to join video conference');
    }
  };

  const filteredGroups = studyGroups.filter(group => {
    if (searchQuery.trim() === '') return true;
    
    const title = group.title || '';
    const description = group.description || '';
    const creatorName = group.creatorName || '';
    const query = searchQuery.toLowerCase();
    
    return title.toLowerCase().includes(query) ||
           description.toLowerCase().includes(query) ||
           creatorName.toLowerCase().includes(query);
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={styles.headerTitle}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={DARK_GRAY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Join Groups</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Date Info */}
        <LinearGradient
          colors={[PRIMARY_COLOR, SECONDARY_COLOR]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.dateCard}
        >
          <Text style={styles.dateTitle}>
            {showingAllGroups ? 'All Available Groups' : formatDate(selectedDate)}
          </Text>
          <Text style={styles.dateSubtitle}>
            {showingAllGroups 
              ? `${filteredGroups.length} study groups available (no groups found for ${formatDateShort(selectedDate)})`
              : `${filteredGroups.length} study groups available`
            }
          </Text>
        </LinearGradient>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={DARK_GRAY} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search study groups..."
              placeholderTextColor="#6c757d"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={DARK_GRAY} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Study Groups List */}
        <View style={styles.groupsSection}>
          {filteredGroups.length > 0 ? (
            <View style={styles.groupsList}>
              {filteredGroups.map((group) => (
                <View key={group.id} style={styles.groupCard}>
                  <View style={styles.groupInfo}>
                    <Text style={styles.groupTitle}>{group.title || 'Untitled Study Group'}</Text>
                    {group.creatorName && (
                      <Text style={styles.creatorName}>Created by {group.creatorName}</Text>
                    )}
                    
                    <View style={styles.groupDateTime}>
                      <View style={styles.dateTimeRow}>
                        <Ionicons name="time" size={16} color={PRIMARY_COLOR} />
                        <Text style={styles.groupTime}>
                          {group.startTimeLocal || formatTime(new Date(group.startTime))} ({group.durationMinutes} min)
                        </Text>
                      </View>
                    </View>
                    
                    <Text style={styles.groupDescription}>{group.description || 'No description'}</Text>
                    
                    <View style={styles.groupMeta}>
                      <View style={styles.metaRow}>
                        <Ionicons name="people" size={14} color={BLACK} />
                        <Text style={[styles.metaText, { color: BLACK }]}>
                          {group.currentMembers || '0'}/{group.maxParticipants} members
                        </Text>
                      </View>
                      {group.isRecurring && (
                        <View style={styles.metaRow}>
                          <Ionicons name="repeat" size={14} color={BLACK} />
                          <Text style={[styles.metaText, { color: BLACK }]}>Recurring</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.groupActions}>
                    {group.isMember ? (
                      <View style={styles.joinedBadge}>
                        <Ionicons name="checkmark-circle" size={16} color={PRIMARY_COLOR} />
                        <Text style={styles.joinedText}>Joined</Text>
                      </View>
                    ) : group.hasJoinRequest ? (
                      <View style={styles.pendingBadge}>
                        <Ionicons name="time" size={16} color={SECONDARY_COLOR} />
                        <Text style={styles.pendingText}>
                          {group.joinRequestStatus === 'pending' ? 'Request Pending' : 
                           group.joinRequestStatus === 'accepted' ? 'Request Accepted' :
                           group.joinRequestStatus === 'rejected' ? 'Request Rejected' : 'Request Sent'}
                        </Text>
                      </View>
                    ) : (
                      <TouchableOpacity 
                        style={styles.joinButton}
                        onPress={() => handleJoinGroup(group.id)}
                      >
                        <Text style={styles.joinButtonText}>Join</Text>
                      </TouchableOpacity>
                    )}

                    {(group.meetLink || !group.isRecurring) && group.isMember && (
                      <TouchableOpacity 
                        style={styles.meetingButton}
                        onPress={() => handleJoinConference(group)}
                      >
                        <Ionicons 
                          name="logo-google" 
                          size={16} 
                          color={WHITE} 
                        />
                        <Text style={styles.meetingButtonText}>
                          Join Meeting
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={SOFT_GRAY} />
              <Text style={styles.emptyStateTitle}>
                {searchQuery ? 'No matching groups' : 'No groups available'}
              </Text>
              <Text style={styles.emptyStateText}>
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : showingAllGroups 
                    ? 'No study groups found for any date'
                    : `No study groups scheduled for ${formatDateShort(selectedDate)}`
                }
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Join Message Modal */}
      <Modal
        visible={showJoinModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowJoinModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.joinModalContainer}>
            <View style={styles.joinModalHeader}>
              <Text style={styles.joinModalTitle}>Join Study Group</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowJoinModal(false)}
              >
                <Ionicons name="close" size={24} color={DARK_GRAY} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.joinModalContent}>
              <Text style={styles.joinModalLabel}>Write a message to the group admin:</Text>
              <TextInput
                style={styles.joinMessageInput}
                value={joinMessage}
                onChangeText={setJoinMessage}
                placeholder="I would like to join this study group!"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              
              <View style={styles.joinModalButtons}>
                <TouchableOpacity
                  style={[styles.joinModalButton, styles.cancelButton]}
                  onPress={() => setShowJoinModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.joinModalButton, styles.submitButton]}
                  onPress={handleSubmitJoinRequest}
                >
                  <Text style={styles.submitButtonText}>Send Request</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Custom Alert */}
      <CustomAlert config={alertConfig} onClose={hideAlert} />
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: DARK_GRAY,
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'serif',
  },
  placeholder: {
    width: 40,
  },
  dateCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: SOFT_GRAY,
  },
  dateTitle: {
    color: WHITE,
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'serif',
    marginBottom: 8,
  },
  dateSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontFamily: 'serif',
    lineHeight: 22,
  },
  searchSection: {
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: SOFT_GRAY,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: DARK_GRAY,
    fontFamily: 'serif',
  },
  groupsSection: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  groupsList: {
    gap: 16,
  },
  groupCard: {
    backgroundColor: OFF_WHITE,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SOFT_GRAY,
  },
  groupInfo: {
    flex: 1,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: DARK_GRAY,
    fontFamily: 'serif',
    marginBottom: 4,
  },
  creatorName: {
    fontSize: 14,
    fontWeight: '600',
    color: PRIMARY_COLOR,
    fontFamily: 'serif',
    marginBottom: 8,
  },
  groupDateTime: {
    marginVertical: 8,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  groupTime: {
    fontSize: 14,
    color: PRIMARY_COLOR,
    fontFamily: 'serif',
    marginLeft: 8,
  },
  groupDescription: {
    fontSize: 14,
    color: DARK_GRAY,
    fontFamily: 'serif',
    marginTop: 8,
  },
  groupMeta: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: SOFT_GRAY,
    fontFamily: 'serif',
  },
  groupActions: {
    marginTop: 12,
    gap: 8,
  },
  joinButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinButtonText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'serif',
  },
  joinedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: LIGHT_PURPLE,
  },
  joinedText: {
    color: PRIMARY_COLOR,
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'serif',
    marginLeft: 4,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: LIGHT_ORANGE,
  },
  pendingText: {
    color: SECONDARY_COLOR,
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'serif',
    marginLeft: 4,
  },
  meetingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SECONDARY_COLOR,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  meetingButtonText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'serif',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: DARK_GRAY,
    fontFamily: 'serif',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: SOFT_GRAY,
    fontFamily: 'serif',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Join Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  joinModalContainer: {
    backgroundColor: WHITE,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  joinModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: SOFT_GRAY,
  },
  joinModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: DARK_GRAY,
    fontFamily: 'serif',
  },
  closeButton: {
    padding: 4,
  },
  joinModalContent: {
    padding: 20,
  },
  joinModalLabel: {
    fontSize: 16,
    color: DARK_GRAY,
    fontFamily: 'serif',
    marginBottom: 12,
  },
  joinMessageInput: {
    borderWidth: 1,
    borderColor: SOFT_GRAY,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'serif',
    color: DARK_GRAY,
    backgroundColor: OFF_WHITE,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  joinModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  joinModalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: SOFT_GRAY,
  },
  submitButton: {
    backgroundColor: PRIMARY_COLOR,
  },
  cancelButtonText: {
    color: DARK_GRAY,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'serif',
  },
  submitButtonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'serif',
  },
});
