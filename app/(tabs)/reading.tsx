import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import JoinGroupsScreen from '../join-groups';



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

// Types
interface StudyGroup {
  id: string;
  title?: string;
  description?: string;
  maxParticipants: number;
  startTime: string;
  durationMinutes: number;
  attendeeEmails?: string[];
  frequency?: string;
  interval?: number;
  daysOfWeek?: number[];
  endDate?: string;
  meetLink?: string;
  meetId?: string;
  theme?: string;
  isRecurring: boolean;
  createdAt: string;
  // Additional fields from API
  userRole?: string;
  joinedAt?: string;
  creatorName?: string;
  creatorEmail?: string;
  currentMembers?: string;
  isActive?: boolean;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasStudyGroup: boolean;
  studyGroups: StudyGroup[];
}

// Calendar utilities
const getDaysInMonth = (date: Date): Date[] => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  
  const days: Date[] = [];
  
  // Add previous month's trailing days
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }
  
  // Add current month's days
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month, day));
  }
  
  // Add next month's leading days to fill the grid
  const remainingDays = 42 - days.length; // 6 weeks * 7 days
  for (let day = 1; day <= remainingDays; day++) {
    days.push(new Date(year, month + 1, day));
  }
  
  return days;
};

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

// Days of week for recurring events
const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

// Get user's timezone
const getUserTimezone = (): string => {
  try {
    // Use built-in JavaScript Intl API to get timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    console.log('🌍 Detected timezone:', timezone);
    return timezone || 'UTC';
  } catch (error) {
    console.error('Error getting timezone:', error);
    return 'UTC';
  }
};

export default function ReadingScreen() {
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showDateOptionsModal, setShowDateOptionsModal] = useState(false);
  const [showJoinGroupsScreen, setShowJoinGroupsScreen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
  
  // Date/Time picker states
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [startDateTime, setStartDateTime] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  
  // Form states
  const [isRecurring, setIsRecurring] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    maxParticipants: 10,
    startTime: '',
    durationMinutes: 60,
    attendeeEmails: '',
    frequency: 'weekly',
    interval: 1,
    daysOfWeek: [] as number[],
    endDate: ''
  });
  
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [userStudyGroups, setUserStudyGroups] = useState<StudyGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStudyGroups, setFilteredStudyGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  // Load study groups from SecureStore on component mount
  useEffect(() => {
    loadStudyGroups();
  }, []);

  // Filter study groups based on search query and user data
  useEffect(() => {
    filterUserStudyGroups();
  }, [studyGroups, searchQuery]);

  // Filter study groups when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStudyGroups(userStudyGroups);
    } else {
      const filtered = userStudyGroups.filter(group => {
        const title = group.title || '';
        const description = group.description || '';
        const creatorName = group.creatorName || '';
        const query = searchQuery.toLowerCase();
        
        return title.toLowerCase().includes(query) ||
               description.toLowerCase().includes(query) ||
               creatorName.toLowerCase().includes(query);
      });
      setFilteredStudyGroups(filtered);
    }
  }, [userStudyGroups, searchQuery]);

    const loadStudyGroups = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        console.log('❌ No auth token found');
        setStudyGroups([]);
        setLoading(false);
        return;
      }

      console.log('🔄 Fetching study groups from API...');
      const response = await fetch('https://33df0b2b10af.ngrok-free.app/api/study-groups', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Study groups fetched successfully:', data);
        
        if (data.success && data.data && data.data.groups) {
          // Map API response to our StudyGroup interface
          const normalizedGroups = data.data.groups.map((group: any) => ({
            id: group.id.toString(),
            title: group.title || 'Untitled Study Group',
            description: group.description || 'No description',
            maxParticipants: group.max_participants || 10,
            startTime: group.scheduled_time || group.next_occurrence,
            durationMinutes: group.duration_minutes || 60,
            attendeeEmails: [], // API doesn't return attendee emails in this endpoint
            frequency: group.recurrence_pattern || 'weekly',
            interval: group.recurrence_interval || 1,
            daysOfWeek: group.recurrence_days_of_week || [],
            endDate: group.recurrence_end_date,
            meetLink: group.meet_link,
            meetId: group.meet_id,
            theme: group.theme,
            isRecurring: group.is_recurring || false,
            createdAt: group.created_at,
            // Additional fields from API
            userRole: group.user_role,
            joinedAt: group.joined_at,
            creatorName: group.creator_name,
            creatorEmail: group.creator_email,
            currentMembers: group.current_members,
            isActive: group.is_active
          }));
          setStudyGroups(normalizedGroups);
          console.log('📚 Loaded study groups from API:', normalizedGroups.length);
        } else {
          console.log('⚠️ No study groups data in response');
          setStudyGroups([]);
        }
      } else {
        console.error('❌ Failed to fetch study groups:', response.status);
        setStudyGroups([]);
      }
    } catch (error) {
      console.error('❌ Error loading study groups from API:', error);
      setStudyGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshStudyGroups = () => {
    loadStudyGroups(false); // Don't show loading spinner for manual refresh
  };

  const handleDeleteStudyGroup = async (groupId: string) => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        Alert.alert('Error', 'Please sign in to delete study groups');
        return;
      }

      // Show confirmation dialog
      Alert.alert(
        'Delete Study Group',
        'Are you sure you want to delete this study group? This action cannot be undone.',
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
                console.log('🗑️ Deleting study group:', groupId);
                const response = await fetch(`https://33df0b2b10af.ngrok-free.app/api/study-groups/${groupId}`, {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                });

                if (response.ok) {
                  const result = await response.json();
                  console.log('✅ Study group deleted successfully:', result);
                  
                  // Refresh the study groups list
                  await loadStudyGroups();
                  
                  // Close the modal if it's open
                  setShowGroupModal(false);
                  setSelectedGroup(null);
                  
                  Alert.alert('Success', 'Study group deleted successfully!');
                } else {
                  const error = await response.json();
                  console.error('❌ Failed to delete study group:', error);
                  Alert.alert('Error', error.message || 'Failed to delete study group');
                }
              } catch (error) {
                console.error('❌ Error deleting study group:', error);
                Alert.alert('Error', 'Failed to delete study group. Please try again.');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('❌ Error in delete confirmation:', error);
      Alert.alert('Error', 'An error occurred. Please try again.');
    }
  };

  const filterUserStudyGroups = async () => {
    try {
      const userData = await SecureStore.getItemAsync('userData');
      if (userData) {
        const user = JSON.parse(userData);
        const userEmail = user.email;
        
        // Filter study groups where user is either the creator or has a role
        const userGroups = studyGroups.filter(group => {
          // Check if user is the creator or has a role in the group
          const isCreator = group.creatorEmail === userEmail;
          const hasRole = group.userRole && group.userRole !== 'none';
          return isCreator || hasRole;
        });
        
        setUserStudyGroups(userGroups);
      } else {
        setUserStudyGroups([]);
      }
    } catch (error) {
      console.error('Error filtering user study groups:', error);
      setUserStudyGroups([]);
    }
  };



  // Calendar functions
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const getStudyGroupsForDate = (date: Date): StudyGroup[] => {
    return userStudyGroups.filter(group => {
      const groupDate = new Date(group.startTime);
      return groupDate.toDateString() === date.toDateString();
    });
  };

  const handleDatePress = (date: Date) => {
    setSelectedDate(date);
    setShowDateOptionsModal(true);
  };

  const handleJoinGroups = () => {
    setShowDateOptionsModal(false);
    setShowJoinGroupsScreen(true);
  };

  const handleCreateGroup = () => {
    setShowDateOptionsModal(false);
    if (selectedDate) {
      // Open create modal with pre-filled date
      const dateTime = new Date(selectedDate);
      // If the selected date is today, use current time, otherwise default to 7 PM
      const today = new Date();
      if (selectedDate.toDateString() === today.toDateString()) {
        // Use current time for today's date
        dateTime.setHours(today.getHours(), today.getMinutes(), 0, 0);
      } else {
        // Default to 7 PM for future dates
        dateTime.setHours(19, 0, 0, 0);
      }
      setStartDateTime(dateTime);
      setFormData(prev => ({
        ...prev,
        startTime: dateTime.toISOString()
      }));
      setShowCreateModal(true);
    }
  };

  const handleCreateStudyGroup = async () => {
    try {
      setIsCreatingGroup(true);
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        Alert.alert('Error', 'Please sign in to create study groups');
        setIsCreatingGroup(false);
        return;
      }

      const userData = await SecureStore.getItemAsync('userData');
      if (!userData) {
        Alert.alert('Error', 'User data not found. Please sign in again.');
        setIsCreatingGroup(false);
        return;
      }
      
      const user = JSON.parse(userData);
      const userEmail = user.email;
      
      const attendeeEmails = formData.attendeeEmails
        .split(',')
        .map(email => email.trim())
        .filter(email => email.length > 0);
      
      // Add user's email to attendee list if not already included
      if (!attendeeEmails.includes(userEmail)) {
        attendeeEmails.push(userEmail);
      }

      const requestData = {
        title: formData.title,
        description: formData.description,
        maxParticipants: formData.maxParticipants,
        durationMinutes: formData.durationMinutes,
        attendeeEmails
      };

      // Get user's timezone
      const userTimezone = getUserTimezone();
      console.log('🌍 User timezone:', userTimezone);

      let response;
      if (isRecurring) {
        // Create recurring study group
        const recurringData = {
          ...requestData,
          startTime: formData.startTime,
          frequency: formData.frequency,
          interval: formData.interval,
          daysOfWeek: formData.daysOfWeek,
          endDate: formData.endDate
        };
        
        response = await fetch('https://33df0b2b10af.ngrok-free.app/api/study-groups/create-recurring', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-Timezone': userTimezone
          },
          body: JSON.stringify(recurringData)
        });
      } else {
        // Create one-time study group
        const oneTimeData = {
          ...requestData,
          scheduledTime: formData.startTime
        };
        
        response = await fetch('https://33df0b2b10af.ngrok-free.app/api/study-groups/create', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-Timezone': userTimezone
          },
          body: JSON.stringify(oneTimeData)
        });
      }

      if (response.ok) {
        const result = await response.json();
    const newGroup: StudyGroup = {
          id: result.data.id.toString(),
          title: result.data.title,
          description: result.data.description,
          maxParticipants: result.data.maxParticipants,
          startTime: result.data.startTime || result.data.scheduledTime,
          durationMinutes: result.data.durationMinutes,
          attendeeEmails: Array.isArray(result.data.attendeeEmails) ? result.data.attendeeEmails : [],
          frequency: result.data.frequency,
          interval: result.data.interval,
          daysOfWeek: result.data.daysOfWeek,
          endDate: result.data.endDate,
          meetLink: result.data.meetLink,
          meetId: result.data.meetId,
          theme: result.data.theme,
          isRecurring: isRecurring,
          createdAt: result.data.createdAt
        };

        // Refresh study groups from API instead of updating local state
        await loadStudyGroups();

    setShowCreateModal(false);
        resetForm();
        Alert.alert('Success', 'Study group created successfully!');
      } else {
        const error = await response.json();
        Alert.alert('Error', error.message || 'Failed to create study group');
      }
    } catch (error) {
      console.error('Error creating study group:', error);
      Alert.alert('Error', 'Failed to create study group. Please try again.');
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      maxParticipants: 10,
      startTime: '',
      durationMinutes: 60,
      attendeeEmails: '',
      frequency: 'weekly',
      interval: 1,
      daysOfWeek: [],
      endDate: ''
    });
    setIsRecurring(false);
    setStartDateTime(new Date());
    setEndDate(new Date());
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      const newDateTime = new Date(startDateTime);
      newDateTime.setFullYear(selectedDate.getFullYear());
      newDateTime.setMonth(selectedDate.getMonth());
      newDateTime.setDate(selectedDate.getDate());
      setStartDateTime(newDateTime);
      setFormData(prev => ({ ...prev, startTime: newDateTime.toISOString() }));
    }
  };

  const handleStartTimeChange = (event: any, selectedTime?: Date) => {
    setShowStartTimePicker(false);
    if (selectedTime) {
      const newDateTime = new Date(startDateTime);
      newDateTime.setHours(selectedTime.getHours());
      newDateTime.setMinutes(selectedTime.getMinutes());
      setStartDateTime(newDateTime);
      setFormData(prev => ({ ...prev, startTime: newDateTime.toISOString() }));
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
      setFormData(prev => ({ ...prev, endDate: selectedDate.toISOString().split('T')[0] }));
    }
  };

  const handleJoinConference = async (conferenceUrl: string) => {
    try {
      const supported = await Linking.canOpenURL(conferenceUrl);
      if (supported) {
        await Linking.openURL(conferenceUrl);
      } else {
        Alert.alert('Error', 'Cannot open the conference link');
      }
    } catch (error) {
      console.error('Error opening conference link:', error);
      Alert.alert('Error', 'Failed to open conference link');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={styles.headerTitle}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const calendarDays = getDaysInMonth(currentDate);
  const today = new Date();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Study Groups</Text>
          {/* <TouchableOpacity 
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={20} color={WHITE} />
            <Text style={styles.createButtonText}>Create</Text>
          </TouchableOpacity> */}
        </View>

        {/* Welcome Section */}
        <LinearGradient
          colors={[PRIMARY_COLOR, SECONDARY_COLOR]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.welcomeCard}
        >
          <Text style={styles.welcomeTitle}>My Study Groups</Text>
          <Text style={styles.welcomeSubtitle}>
            Click on any date to create a study group or view existing ones
          </Text>
        </LinearGradient>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={DARK_GRAY} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search your study groups..."
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

        {/* Calendar Section */}
        <View style={styles.calendarSection}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={() => navigateMonth('prev')}>
              <Ionicons name="chevron-back" size={24} color={DARK_GRAY} />
            </TouchableOpacity>
            <Text style={styles.monthYear}>
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Text>
            <TouchableOpacity onPress={() => navigateMonth('next')}>
              <Ionicons name="chevron-forward" size={24} color={DARK_GRAY} />
            </TouchableOpacity>
          </View>

          {/* Days of week header */}
          <View style={styles.daysOfWeekHeader}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <Text key={day} style={styles.dayHeader}>{day}</Text>
            ))}
          </View>

          {/* Calendar grid */}
          <View style={styles.calendarGrid}>
            {calendarDays.map((date, index) => {
              const isCurrentMonth = date.getMonth() === currentDate.getMonth();
              const isToday = date.toDateString() === today.toDateString();
              const hasStudyGroup = getStudyGroupsForDate(date).length > 0;
              const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();

              return (
          <TouchableOpacity 
                  key={index}
                  style={[
                    styles.calendarDay,
                    !isCurrentMonth && styles.calendarDayOtherMonth,
                    isToday && styles.calendarDayToday,
                    hasStudyGroup && styles.calendarDayWithGroup,
                    isSelected && styles.calendarDaySelected
                  ]}
                  onPress={() => handleDatePress(date)}
                >
                  <Text style={[
                    styles.calendarDayText,
                    !isCurrentMonth && styles.calendarDayTextOtherMonth,
                    isToday && styles.calendarDayTextToday,
                    isSelected && styles.calendarDayTextSelected
                  ]}>
                    {date.getDate()}
                  </Text>
                  {hasStudyGroup && (
                    <View style={styles.studyGroupIndicator} />
                  )}
          </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Selected Date Info */}
        {selectedDate && (
          <View style={styles.selectedDateInfo}>
            <Text style={styles.selectedDateTitle}>
              {formatDate(selectedDate)}
            </Text>
            {getStudyGroupsForDate(selectedDate).length > 0 ? (
              <View style={styles.studyGroupsList}>
                {getStudyGroupsForDate(selectedDate).map((group, index) => (
              <TouchableOpacity
                key={group.id}
                    style={styles.studyGroupItem}
                    onPress={() => {
                      setSelectedGroup(group);
                      setShowGroupModal(true);
                    }}
                    onLongPress={() => {
                      // Show delete option for admin users
                      if (group.userRole === 'admin') {
                        Alert.alert(
                          'Study Group Options',
                          'What would you like to do?',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { 
                              text: 'View Details', 
                              onPress: () => {
                                setSelectedGroup(group);
                                setShowGroupModal(true);
                              }
                            },
                            { 
                              text: 'Delete', 
                              style: 'destructive',
                              onPress: () => handleDeleteStudyGroup(group.id)
                            }
                          ]
                        );
                      } else {
                        // For non-admin users, just show details
                        setSelectedGroup(group);
                        setShowGroupModal(true);
                      }
                    }}
                  >
                    <View style={styles.studyGroupInfo}>
                      <Text style={styles.studyGroupTitle}>{group.title || 'Untitled Study Group'}</Text>
                      {group.creatorName && (
                        <Text style={styles.creatorName}>Created by {group.creatorName}</Text>
                      )}
                      
                      <View style={styles.studyGroupDateTime}>
                        <View style={styles.dateTimeRow}>
                          <Ionicons name="calendar" size={16} color={PRIMARY_COLOR} />
                          <Text style={styles.studyGroupDate}>
                            {formatDayOfWeek(new Date(group.startTime))}, {formatDateShort(new Date(group.startTime))}
                    </Text>
                  </View>
                        <View style={styles.dateTimeRow}>
                          <Ionicons name="time" size={16} color={PRIMARY_COLOR} />
                          <Text style={styles.studyGroupTime}>
                            {formatTime(new Date(group.startTime))} ({group.durationMinutes} min)
                          </Text>
                </View>
                  </View>
                      
                      <Text style={styles.studyGroupDescription}>{group.description || 'No description'}</Text>
                    
                    <View style={styles.studyGroupMeta}>
                      <View style={styles.metaRow}>
                        <Ionicons name="people" size={14} color={SOFT_GRAY} />
                        <Text style={styles.metaText}>
                          {group.currentMembers || '0'}/{group.maxParticipants} members
                        </Text>
                      </View>
                      {group.isRecurring && (
                        <View style={styles.metaRow}>
                          <Ionicons name="repeat" size={14} color={SOFT_GRAY} />
                          <Text style={styles.metaText}>Recurring</Text>
                        </View>
                      )}
                      {group.userRole && (
                        <View style={styles.metaRow}>
                          <Ionicons name="person" size={14} color={SOFT_GRAY} />
                          <Text style={styles.metaText}>{group.userRole}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                    <Ionicons name="chevron-forward" size={20} color={DARK_GRAY} />
                  </TouchableOpacity>
                ))}
                </View>
            ) : (
              <Text style={styles.noStudyGroupsText}>
                No study groups scheduled for this date. Tap the date to create one!
              </Text>
            )}
          </View>
        )}

        {/* My Study Groups Section */}
        <View style={styles.myStudyGroupsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              My Study Groups ({filteredStudyGroups.length})
            </Text>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={refreshStudyGroups}
            >
              <Ionicons name="refresh" size={20} color={PRIMARY_COLOR} />
            </TouchableOpacity>
          </View>
                  
          {filteredStudyGroups.length > 0 ? (
            <View style={styles.studyGroupsList}>
              {filteredStudyGroups.map((group, index) => (
                  <TouchableOpacity 
                  key={group.id}
                  style={styles.studyGroupItem}
                    onPress={() => {
                    setSelectedGroup(group);
                    setShowGroupModal(true);
                  }}
                  onLongPress={() => {
                    // Show delete option for admin users
                    if (group.userRole === 'admin') {
                      Alert.alert(
                        'Study Group Options',
                        'What would you like to do?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { 
                            text: 'View Details', 
                            onPress: () => {
                              setSelectedGroup(group);
                              setShowGroupModal(true);
                            }
                          },
                          { 
                            text: 'Delete', 
                            style: 'destructive',
                            onPress: () => handleDeleteStudyGroup(group.id)
                          }
                        ]
                      );
                    } else {
                      // For non-admin users, just show details
                      setSelectedGroup(group);
                      setShowGroupModal(true);
                    }
                  }}
                >
                  <View style={styles.studyGroupInfo}>
                    <Text style={styles.studyGroupTitle}>{group.title || 'Untitled Study Group'}</Text>
                    {group.creatorName && (
                      <Text style={styles.creatorName}>Created by {group.creatorName}</Text>
                    )}
                    
                    <View style={styles.studyGroupDateTime}>
                      <View style={styles.dateTimeRow}>
                        <Ionicons name="calendar" size={16} color={PRIMARY_COLOR} />
                        <Text style={styles.studyGroupDate}>
                          {formatDayOfWeek(new Date(group.startTime))}, {formatDateShort(new Date(group.startTime))}
                    </Text>
                </View>
                      <View style={styles.dateTimeRow}>
                        <Ionicons name="time" size={16} color={PRIMARY_COLOR} />
                        <Text style={styles.studyGroupTime}>
                          {formatTime(new Date(group.startTime))} ({group.durationMinutes} min)
                        </Text>
                      </View>
                    </View>
                    
                    <Text style={styles.studyGroupDescription}>{group.description || 'No description'}</Text>
                    <View style={styles.studyGroupMeta}>
                      <View style={styles.metaRow}>
                        <Ionicons name="people" size={14} color={SOFT_GRAY} />
                        <Text style={styles.metaText}>
                          {group.currentMembers || '0'}/{group.maxParticipants} members
                        </Text>
                      </View>
                      {group.isRecurring && (
                        <View style={styles.metaRow}>
                          <Ionicons name="repeat" size={14} color={SOFT_GRAY} />
                          <Text style={styles.metaText}>Recurring</Text>
                        </View>
                      )}
                      {group.userRole && (
                        <View style={styles.metaRow}>
                          <Ionicons name="person" size={14} color={SOFT_GRAY} />
                          <Text style={styles.metaText}>{group.userRole}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={DARK_GRAY} />
              </TouchableOpacity>
            ))}
          </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={SOFT_GRAY} />
              <Text style={styles.emptyStateTitle}>
                {searchQuery ? 'No matching study groups' : 'No study groups yet'}
              </Text>
              <Text style={styles.emptyStateText}>
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : 'Create your first study group by clicking on a calendar date'
                }
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Create Study Group Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Study Group</Text>
              <TouchableOpacity onPress={() => {
                setShowCreateModal(false);
                resetForm();
              }}>
                <Ionicons name="close" size={24} color={DARK_GRAY} />
              </TouchableOpacity>
            </View>
            
            {/* Recurring Toggle */}
            <View style={styles.recurringToggle}>
              <Text style={styles.recurringLabel}>Recurring Study Group</Text>
              <Switch
                value={isRecurring}
                onValueChange={setIsRecurring}
                trackColor={{ false: SOFT_GRAY, true: PRIMARY_COLOR }}
                thumbColor={WHITE}
              />
            </View>
            
            <TextInput
              style={styles.input}
              placeholder="Study Group Title"
              value={formData.title}
              onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
              placeholderTextColor="#6c757d"
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description"
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholderTextColor="#6c757d"
              multiline
              numberOfLines={3}
            />

            <View style={styles.rowInputs}>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Max Participants</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10"
                  value={formData.maxParticipants.toString()}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, maxParticipants: parseInt(text) || 10 }))}
                  placeholderTextColor="#6c757d"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Duration (minutes)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="60"
                  value={formData.durationMinutes.toString()}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, durationMinutes: parseInt(text) || 60 }))}
                  placeholderTextColor="#6c757d"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Start Date & Time</Text>
            <View style={styles.dateTimePickerContainer}>
              <TouchableOpacity 
                style={styles.dateTimePickerButton}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Ionicons name="calendar" size={20} color={PRIMARY_COLOR} />
                <Text style={styles.dateTimePickerText}>
                  {startDateTime.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.dateTimePickerButton}
                onPress={() => setShowStartTimePicker(true)}
              >
                <Ionicons name="time" size={20} color={PRIMARY_COLOR} />
                <Text style={styles.dateTimePickerText}>
                  {startDateTime.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.timezoneInfo}>
              <Ionicons name="globe" size={16} color={PRIMARY_COLOR} />
              <Text style={styles.timezoneText}>
                Timezone: {getUserTimezone()}
              </Text>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Attendee Emails (comma-separated)"
              value={formData.attendeeEmails}
              onChangeText={(text) => setFormData(prev => ({ ...prev, attendeeEmails: text }))}
              placeholderTextColor="#6c757d"
            />

            {isRecurring && (
              <>
                <View style={styles.rowInputs}>
                  <View style={styles.halfInput}>
                    <Text style={styles.inputLabel}>Frequency</Text>
                    <View style={styles.pickerDropdownContainer}>
                      <TouchableOpacity
                        style={styles.pickerDropdownButton}
                        onPress={() => {
                          // You can implement a picker here
                          Alert.alert('Frequency', 'Select frequency', [
                            { text: 'Weekly', onPress: () => setFormData(prev => ({ ...prev, frequency: 'weekly' })) },
                            { text: 'Monthly', onPress: () => setFormData(prev => ({ ...prev, frequency: 'monthly' })) }
                          ]);
                        }}
                      >
                        <Text style={styles.pickerText}>{formData.frequency}</Text>
                        <Ionicons name="chevron-down" size={16} color={DARK_GRAY} />
                      </TouchableOpacity>
            </View>
                  </View>
                  <View style={styles.halfInput}>
                    <Text style={styles.inputLabel}>Interval</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="1"
                      value={formData.interval.toString()}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, interval: parseInt(text) || 1 }))}
                      placeholderTextColor="#6c757d"
                      keyboardType="numeric"
                    />
                  </View>
            </View>

                <Text style={styles.inputLabel}>Days of Week (for weekly)</Text>
                <View style={styles.daysOfWeekContainer}>
                  {DAYS_OF_WEEK.map((day, index) => (
              <TouchableOpacity 
                      key={day}
                style={[
                        styles.dayButton,
                        formData.daysOfWeek.includes(index) && styles.dayButtonSelected
                ]}
                onPress={() => {
                        const newDays = formData.daysOfWeek.includes(index)
                          ? formData.daysOfWeek.filter(d => d !== index)
                          : [...formData.daysOfWeek, index];
                        setFormData(prev => ({ ...prev, daysOfWeek: newDays }));
                      }}
                    >
                <Text style={[
                        styles.dayButtonText,
                        formData.daysOfWeek.includes(index) && styles.dayButtonTextSelected
                ]}>
                        {day.substring(0, 3)}
                </Text>
              </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>End Date</Text>
                <TouchableOpacity 
                  style={styles.dateTimePickerButton}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Ionicons name="calendar" size={20} color={PRIMARY_COLOR} />
                  <Text style={styles.dateTimePickerText}>
                    {endDate.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </Text>
              </TouchableOpacity>
              </>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.modalButton, 
                  styles.createGroupButton,
                  isCreatingGroup && styles.disabledButton
                ]}
                onPress={handleCreateStudyGroup}
                disabled={isCreatingGroup}
              >
                {isCreatingGroup ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.createGroupButtonText}>Creating...</Text>
                  </View>
                ) : (
                  <Text style={styles.createGroupButtonText}>
                    {isRecurring ? 'Create Recurring' : 'Create One-time'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
        
        {/* Native Date/Time Pickers */}
        {showStartDatePicker && (
          <DateTimePicker
            value={startDateTime}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleStartDateChange}
            minimumDate={new Date()}
          />
        )}
        
        {showStartTimePicker && (
          <DateTimePicker
            value={startDateTime}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleStartTimeChange}
          />
        )}
        
        {showEndDatePicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleEndDateChange}
            minimumDate={startDateTime}
          />
        )}
      </Modal>

      {/* Study Group Details Modal */}
      <Modal
        visible={showGroupModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowGroupModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.groupModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedGroup?.title || 'Untitled Study Group'}
                </Text>
              <TouchableOpacity onPress={() => setShowGroupModal(false)}>
                <Ionicons name="close" size={24} color={DARK_GRAY} />
              </TouchableOpacity>
            </View>

            {selectedGroup && (
              <>
                <View style={styles.groupDetails}>
                  <Text style={styles.groupDetailText}>
                    <Text style={styles.groupDetailLabel}>Description: </Text>
                    {selectedGroup.description || 'No description'}
                  </Text>
                  <Text style={styles.groupDetailText}>
                    <Text style={styles.groupDetailLabel}>Date: </Text>
                    {formatDayOfWeek(new Date(selectedGroup.startTime))}, {formatDateShort(new Date(selectedGroup.startTime))}
                  </Text>
                  <Text style={styles.groupDetailText}>
                    <Text style={styles.groupDetailLabel}>Time: </Text>
                    {formatTime(new Date(selectedGroup.startTime))} ({selectedGroup.durationMinutes} minutes)
                  </Text>
                  <Text style={styles.groupDetailText}>
                    <Text style={styles.groupDetailLabel}>Max Participants: </Text>
                    {selectedGroup.maxParticipants}
                  </Text>
                  <Text style={styles.groupDetailText}>
                    <Text style={styles.groupDetailLabel}>Type: </Text>
                    {selectedGroup.isRecurring ? 'Recurring' : 'One-time'}
                  </Text>
                  {(selectedGroup.meetLink || !selectedGroup.isRecurring) && (
                    <Text style={styles.groupDetailText}>
                      <Text style={styles.groupDetailLabel}>Meet Link: </Text>
                      {selectedGroup.meetLink || 'Meeting link will be generated when you join'}
                    </Text>
                  )}
                </View>

                <View style={styles.groupActions}>
                  {(selectedGroup.meetLink || !selectedGroup.isRecurring) && (
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => {
                        const meetingUrl = selectedGroup.meetLink || 
                          `https://meet.google.com/new?title=${encodeURIComponent(selectedGroup.title || 'Study Group')}`;
                        handleJoinConference(meetingUrl);
                      }}
                    >
                      <Ionicons name="videocam" size={20} color={WHITE} />
                      <Text style={styles.actionButtonText}>Join Meeting</Text>
                    </TouchableOpacity>
                  )}
                  
                  {/* Show delete button only if user is admin/creator */}
                  {selectedGroup.userRole === 'admin' && (
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDeleteStudyGroup(selectedGroup.id)}
                    >
                      <Ionicons name="trash" size={20} color={WHITE} />
                      <Text style={styles.actionButtonText}>Delete Group</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Date Options Modal */}
      <Modal
        visible={showDateOptionsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDateOptionsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dateOptionsModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedDate ? formatDate(selectedDate) : 'Selected Date'}
              </Text>
              <TouchableOpacity onPress={() => setShowDateOptionsModal(false)}>
                <Ionicons name="close" size={24} color={DARK_GRAY} />
              </TouchableOpacity>
            </View>

            <View style={styles.dateOptionsContent}>
              <Text style={styles.dateOptionsSubtitle}>
                What would you like to do on this date?
              </Text>

              <View style={styles.dateOptionsButtons}>
                <TouchableOpacity 
                  style={[styles.dateOptionButton, styles.joinButton]}
                  onPress={handleJoinGroups}
                >
                  <Ionicons name="people" size={24} color={WHITE} />
                  <Text style={styles.dateOptionButtonText}>
                    Join Groups on {selectedDate ? formatDateShort(selectedDate) : 'this date'}
                  </Text>
                  <Text style={styles.dateOptionSubtext}>
                    {getStudyGroupsForDate(selectedDate || new Date()).length} groups available
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.dateOptionButton, styles.createButton]}
                  onPress={handleCreateGroup}
                >
                  <Ionicons name="add-circle" size={24} color={WHITE} />
                  <Text style={styles.dateOptionButtonText}>
                    Create Group on {selectedDate ? formatDateShort(selectedDate) : 'this date'}
                  </Text>
                  <Text style={styles.dateOptionSubtext}>
                    Start a new study group
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Join Groups Modal */}
      <Modal
        visible={showJoinGroupsScreen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowJoinGroupsScreen(false)}
      >
        {selectedDate && (
          <JoinGroupsScreen 
            selectedDate={selectedDate}
            onBack={() => setShowJoinGroupsScreen(false)}
          />
        )}
      </Modal>
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  createButtonText: {
    color: WHITE,
    marginLeft: 6,
    fontWeight: 'bold',
    fontFamily: 'serif',
    fontSize: 14,
  },
  welcomeCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: SOFT_GRAY,
  },
  welcomeTitle: {
    color: WHITE,
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'serif',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontFamily: 'serif',
    lineHeight: 22,
  },
  // Search Bar Styles
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
  // Timezone Info
  timezoneInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: LIGHT_PURPLE,
    borderRadius: 8,
  },
  timezoneText: {
    fontSize: 14,
    color: DARK_GRAY,
    fontFamily: 'serif',
    marginLeft: 8,
    fontWeight: '500',
  },
  // Date/Time Picker Styles
  dateTimePickerContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  dateTimePickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: OFF_WHITE,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: SOFT_GRAY,
  },
  dateTimePickerText: {
    fontSize: 16,
    color: DARK_GRAY,
    fontFamily: 'serif',
    marginLeft: 8,
    flex: 1,
  },

  // Calendar Styles
  calendarSection: {
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
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthYear: {
    fontSize: 20,
    fontWeight: 'bold',
    color: DARK_GRAY,
    fontFamily: 'serif',
  },
  daysOfWeekHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    color: DARK_GRAY,
    fontFamily: 'serif',
    paddingVertical: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderRadius: 8,
    marginBottom: 4,
  },
  calendarDayOtherMonth: {
    opacity: 0.3,
  },
  calendarDayToday: {
    backgroundColor: PRIMARY_COLOR,
  },
  calendarDaySelected: {
    backgroundColor: SECONDARY_COLOR,
    borderWidth: 2,
    borderColor: PRIMARY_COLOR,
  },
  calendarDayWithGroup: {
    backgroundColor: LIGHT_PURPLE,
  },
  calendarDayText: {
    fontSize: 16,
    color: DARK_GRAY,
    fontFamily: 'serif',
  },
  calendarDayTextOtherMonth: {
    color: SOFT_GRAY,
  },
  calendarDayTextToday: {
    color: WHITE,
    fontWeight: 'bold',
  },
  calendarDayTextSelected: {
    color: WHITE,
    fontWeight: 'bold',
  },
  studyGroupIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PRIMARY_COLOR,
  },
  // Selected Date Info
  selectedDateInfo: {
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
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: DARK_GRAY,
    fontFamily: 'serif',
    marginBottom: 16,
  },
  studyGroupsList: {
    gap: 12,
  },
  studyGroupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: OFF_WHITE,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SOFT_GRAY,
  },
  studyGroupInfo: {
    flex: 1,
  },
  studyGroupTitle: {
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
  studyGroupDateTime: {
    marginVertical: 8,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  studyGroupDate: {
    fontSize: 14,
    color: PRIMARY_COLOR,
    fontFamily: 'serif',
    marginLeft: 8,
    fontWeight: '600',
  },
  studyGroupTime: {
    fontSize: 14,
    color: PRIMARY_COLOR,
    fontFamily: 'serif',
    marginLeft: 8,
  },
  studyGroupDescription: {
    fontSize: 14,
    color: DARK_GRAY,
    fontFamily: 'serif',
    marginTop: 8,
  },
  noStudyGroupsText: {
    fontSize: 16,
    color: DARK_GRAY,
    fontFamily: 'serif',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // My Study Groups Section
  myStudyGroupsSection: {
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: OFF_WHITE,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: DARK_GRAY,
    fontFamily: 'serif',
  },
  studyGroupMeta: {
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
  studyGroupMetaText: {
    fontSize: 12,
    color: SOFT_GRAY,
    fontFamily: 'serif',
  },
  // Empty State
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: WHITE,
    borderRadius: 16,
    width: '90%',
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: SOFT_GRAY,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: DARK_GRAY,
    fontFamily: 'serif',
  },
  // Form Styles
  recurringToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: SOFT_GRAY,
  },
  recurringLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: DARK_GRAY,
    fontFamily: 'serif',
  },
  input: {
    backgroundColor: OFF_WHITE,
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: SOFT_GRAY,
    fontSize: 16,
    fontFamily: 'serif',
    color: DARK_GRAY,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK_GRAY,
    fontFamily: 'serif',
    marginHorizontal: 20,
    marginBottom: 8,
  },
  rowInputs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  pickerDropdownContainer: {
    backgroundColor: OFF_WHITE,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: SOFT_GRAY,
    marginBottom: 16,
  },
  pickerDropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  pickerText: {
    fontSize: 16,
    color: DARK_GRAY,
    fontFamily: 'serif',
  },
  daysOfWeekContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  dayButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: SOFT_GRAY,
    backgroundColor: OFF_WHITE,
  },
  dayButtonSelected: {
    backgroundColor: PRIMARY_COLOR,
    borderColor: PRIMARY_COLOR,
  },
  dayButtonText: {
    fontSize: 14,
    color: DARK_GRAY,
    fontFamily: 'serif',
  },
  dayButtonTextSelected: {
    color: WHITE,
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: SOFT_GRAY,
  },
  cancelButtonText: {
    color: DARK_GRAY,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'serif',
  },
  createGroupButton: {
    backgroundColor: PRIMARY_COLOR,
  },
  createGroupButtonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'serif',
  },
  disabledButton: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Group Details Modal
  groupModalContent: {
    backgroundColor: WHITE,
    borderRadius: 16,
    width: '85%',
    maxHeight: '80%',
  },
  groupDetails: {
    padding: 20,
  },
  groupDetailText: {
    fontSize: 16,
    color: DARK_GRAY,
    fontFamily: 'serif',
    marginBottom: 12,
    lineHeight: 22,
  },
  groupDetailLabel: {
    fontWeight: 'bold',
  },
  groupActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: SOFT_GRAY,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: '#dc3545', // Red color for delete
    marginTop: 12,
  },
  actionButtonText: {
    color: WHITE,
    marginLeft: 8,
    fontWeight: 'bold',
    fontFamily: 'serif',
    fontSize: 16,
  },
  // Date Options Modal Styles
  dateOptionsModalContent: {
    backgroundColor: WHITE,
    borderRadius: 16,
    width: '90%',
    maxHeight: '70%',
  },
  dateOptionsContent: {
    padding: 20,
  },
  dateOptionsSubtitle: {
    fontSize: 16,
    color: DARK_GRAY,
    fontFamily: 'serif',
    textAlign: 'center',
    marginBottom: 24,
  },
  dateOptionsButtons: {
    gap: 16,
  },
  dateOptionButton: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  joinButton: {
    backgroundColor: PRIMARY_COLOR,
  },
  createButton: {
    backgroundColor: SECONDARY_COLOR,
  },
  dateOptionButtonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'serif',
    marginTop: 8,
    textAlign: 'center',
  },
  dateOptionSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontFamily: 'serif',
    marginTop: 4,
    textAlign: 'center',
  },
});