import { API_ENDPOINTS } from '@/constants/API';
import { useLoading } from '@/contexts/LoadingContext';
import { UserData, defaultUserData } from '@/types/UserData';
import { checkGoogleCalendarAccess, isGoogleCalendarAccessError, requestGoogleCalendarAccess } from '@/utils/googleCalendarAuth';
import { safeJsonParse } from '@/utils/safeJson';
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
import GroupDashboardScreen from '../group-dashboard';
import JoinGroupsScreen from '../join-groups';
import UnifiedDashboardScreen from '../unified-dashboard';



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
  startTimeLocal?: string;
  scheduledTimeLocal?: string; // Backend sends this for display
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
  // Additional fields from API
  userRole?: string;
  joinedAt?: string;
  creatorName?: string;
  creatorEmail?: string;
  currentMembers?: string;
  isActive?: boolean;
  timezone?: string;
  requiresApproval?: boolean;
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

// Helper function to get timezone abbreviation
const getTimezoneAbbr = (tz?: string): string => {
  if (!tz) return '';
  
  const abbrs: Record<string, string> = {
    'America/New_York': 'ET',
    'America/Chicago': 'CT',
    'America/Denver': 'MT',
    'America/Los_Angeles': 'PT',
    'America/Anchorage': 'AKT',
    'Pacific/Honolulu': 'HT'
  };
  
  return abbrs[tz] || tz;
};

// Helper function to format time with timezone
const formatTimeWithTimezone = (dateString: string, timezone?: string): string => {
  const date = new Date(dateString);
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  // If timezone is provided, show it with abbreviation
  if (timezone) {
    const tzAbbr = getTimezoneAbbr(timezone);
    return `${timeStr} (${tzAbbr})`;
  }
  
  return timeStr;
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

// US Timezones for dropdown selection
// Note: Offsets shown are for Standard Time (winter). During Daylight Saving Time, most zones are 1 hour less negative.
// Eastern: UTC-5 (EST) / UTC-4 (EDT)
// Central: UTC-6 (CST) / UTC-5 (CDT)
// Mountain: UTC-7 (MST) / UTC-6 (MDT)
// Pacific: UTC-8 (PST) / UTC-7 (PDT)
// Alaska: UTC-9 (AKST) / UTC-8 (AKDT)
// Hawaii: UTC-10 (HST - no DST)
const US_TIMEZONES = [
  { label: 'Eastern Time (ET)', value: 'America/New_York', offset: 'UTC-5', offsetMinutes: -300 },
  { label: 'Central Time (CT)', value: 'America/Chicago', offset: 'UTC-6', offsetMinutes: -360 },
  { label: 'Mountain Time (MT)', value: 'America/Denver', offset: 'UTC-7', offsetMinutes: -420 },
  { label: 'Pacific Time (PT)', value: 'America/Los_Angeles', offset: 'UTC-8', offsetMinutes: -480 },
  { label: 'Alaska Time (AKT)', value: 'America/Anchorage', offset: 'UTC-9', offsetMinutes: -540 },
  { label: 'Hawaii Time (HT)', value: 'Pacific/Honolulu', offset: 'UTC-10', offsetMinutes: -600 },
];

// Helper function to convert local time to UTC based on selected timezone
const convertLocalToUTC = (localDate: Date, timezone: string): Date => {
  // Get the timezone info for the selected timezone
  const selectedTz = US_TIMEZONES.find(tz => tz.value === timezone);
  if (!selectedTz) {
    console.warn('⚠️ Timezone not found, using date as-is:', timezone);
    return localDate;
  }

  // Extract the date/time components that the user entered
  // These represent the time in the SELECTED timezone (not the user's system timezone)
  const year = localDate.getFullYear();
  const month = localDate.getMonth();
  const day = localDate.getDate();
  const hours = localDate.getHours();
  const minutes = localDate.getMinutes();
  
  // The user enters time thinking it's in the selected timezone
  // For example: "00:00" (midnight) in Eastern Time
  // We need to convert this to UTC
  
  // Step 1: Create a UTC date with the given year/month/day/hour/minute
  const utcDate = new Date(Date.UTC(year, month, day, hours, minutes, 0, 0));
  
  // Step 2: Apply the timezone offset
  // For timezones WEST of UTC (like US timezones), the offset is negative
  // Example: Eastern Time is UTC-5 (offsetMinutes = -300)
  // If user enters midnight (00:00) ET:
  //   UTC time = 00:00 - (-300 minutes) = 00:00 + 300 minutes = 05:00 UTC
  const tzOffsetMinutes = selectedTz.offsetMinutes;
  const actualUtcDate = new Date(utcDate.getTime() - (tzOffsetMinutes * 60 * 1000));
  
  console.log('🕐 Time Conversion:', {
    input: `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
    timezone: `${selectedTz.label} (${selectedTz.offset})`,
    offsetMinutes: tzOffsetMinutes,
    calculation: `Subtracting offset: ${tzOffsetMinutes} minutes`,
    utcResult: actualUtcDate.toISOString(),
    utcDateTime: `${actualUtcDate.toISOString().substring(0, 10)} ${actualUtcDate.toISOString().substring(11, 16)} UTC`
  });
  
  return actualUtcDate;
};

// Map of UTC offsets (in minutes) to IANA timezone names (common timezones)
const TIMEZONE_OFFSET_MAP: Record<string, string> = {
  '-720': 'Pacific/Auckland',      // UTC+12
  '-660': 'Pacific/Noumea',        // UTC+11
  '-600': 'Australia/Sydney',      // UTC+10
  '-540': 'Asia/Tokyo',            // UTC+9
  '-480': 'Asia/Singapore',        // UTC+8
  '-420': 'Asia/Bangkok',          // UTC+7
  '-360': 'Asia/Dhaka',            // UTC+6
  '-300': 'Asia/Karachi',          // UTC+5
  '-270': 'Asia/Kabul',            // UTC+4:30
  '-240': 'Asia/Dubai',            // UTC+4
  '-210': 'Asia/Tehran',           // UTC+3:30
  '-180': 'Europe/Moscow',         // UTC+3
  '-120': 'Europe/Athens',         // UTC+2
  '-60': 'Europe/Paris',           // UTC+1
  '0': 'Europe/London',            // UTC+0
  '60': 'Atlantic/Azores',         // UTC-1
  '120': 'America/Sao_Paulo',      // UTC-2
  '180': 'America/Argentina/Buenos_Aires', // UTC-3
  '240': 'America/New_York',       // UTC-4
  '300': 'America/Chicago',        // UTC-5
  '360': 'America/Denver',         // UTC-6
  '420': 'America/Los_Angeles',    // UTC-7
  '480': 'America/Anchorage',      // UTC-8
  '540': 'Pacific/Gambier',        // UTC-9
  '600': 'Pacific/Honolulu',       // UTC-10
};

// Get user's timezone (returns IANA timezone name like "America/New_York")
const getUserTimezone = (): string => {
  try {
    // First, get the timezone offset (more reliable than system settings)
    const offset = -new Date().getTimezoneOffset(); // Minutes (positive for east of UTC)
    
    // Try Intl API to get system timezone
    let systemTimezone: string | null = null;
    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      try {
        systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      } catch (intlError) {
      }
    }

    // Map offset to correct IANA timezone
    const offsetBasedTimezone = TIMEZONE_OFFSET_MAP[offset.toString()];
    
    // If offset matches Pakistan (UTC+5 = -300 minutes), use Asia/Karachi
    // Prioritize offset over system timezone for accuracy
    if (offset === -300 && offsetBasedTimezone) {
      return offsetBasedTimezone; // "Asia/Karachi"
    }
    
    // For other offsets, use offset-based timezone if available
    if (offsetBasedTimezone) {
      return offsetBasedTimezone;
    }

    // Fallback to system timezone if offset mapping not found
    if (systemTimezone && systemTimezone !== 'UTC') {
      return systemTimezone;
    }
    
    // Last resort: Use closest timezone based on offset
    const closestOffset = Object.keys(TIMEZONE_OFFSET_MAP)
      .map(Number)
      .reduce((prev, curr) =>
        Math.abs(curr - offset) < Math.abs(prev - offset) ? curr : prev
      );

    const closestTimezone = TIMEZONE_OFFSET_MAP[closestOffset.toString()];
    return closestTimezone;

  } catch (error) {
    console.error('❌ Error getting timezone:', error);
    return 'UTC';
  }
};

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
  if (!visible) return null;

  const getIconAndColor = () => {
    switch (type) {
      case 'success':
        return { icon: 'checkmark-circle', color: '#4CAF50' };
      case 'error':
        return { icon: 'close-circle', color: '#F44336' };
      case 'warning':
        return { icon: 'warning', color: '#FF9800' };
      case 'info':
        return { icon: 'information-circle', color: '#2196F3' };
      default:
        return { icon: 'information-circle', color: '#2196F3' };
    }
  };

  const { icon, color } = getIconAndColor();

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
            <Ionicons name={icon as any} size={32} color={color} />
            <Text style={styles.alertTitle}>{title}</Text>
          </View>
          <Text style={styles.alertMessage}>{message}</Text>
          <View style={styles.alertButtons}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.alertButton,
                  button.style === 'destructive' && styles.alertButtonDestructive,
                  button.style === 'cancel' && styles.alertButtonCancel,
                ]}
                onPress={() => {
                  button.onPress();
                  onClose();
                }}
              >
                <Text style={[
                  styles.alertButtonText,
                  button.style === 'destructive' && styles.alertButtonTextDestructive,
                  button.style === 'cancel' && styles.alertButtonTextCancel,
                ]}>
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

export default function ReadingScreen() {
  const { showLoading, hideLoading } = useLoading();

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showDateOptionsModal, setShowDateOptionsModal] = useState(false);
  const [showJoinGroupsScreen, setShowJoinGroupsScreen] = useState(false);
  const [showDashboardScreen, setShowDashboardScreen] = useState(false);

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
  const [showUnifiedDashboard, setShowUnifiedDashboard] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);

  // Date/Time picker states
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [startDateTime, setStartDateTime] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  
  // Time input state (for controlled inputs)
  const [hourInput, setHourInput] = useState('00');
  const [minuteInput, setMinuteInput] = useState('00');

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
  
  // Timezone selection state
  const [selectedTimezone, setSelectedTimezone] = useState<string>('America/New_York'); // Default to Eastern
  const [showTimezoneModal, setShowTimezoneModal] = useState(false);

  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [userStudyGroups, setUserStudyGroups] = useState<StudyGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStudyGroups, setFilteredStudyGroups] = useState<StudyGroup[]>([]);

  // Alert helper functions
  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info', buttons: Array<{
    text: string;
    onPress: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      type,
      buttons
    });
  };

  const hideAlert = () => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  };

  const showSuccessAlert = (message: string, onPress?: () => void) => {
    showAlert('Success', message, 'success', [
      { text: 'OK', onPress: onPress || (() => { }) }
    ]);
  };

  const showErrorAlert = (message: string, onPress?: () => void) => {
    showAlert('Error', message, 'error', [
      { text: 'OK', onPress: onPress || (() => { }) }
    ]);
  };

  const showConfirmAlert = (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
    showAlert(title, message, 'warning', [
      { text: 'Cancel', onPress: onCancel || (() => { }), style: 'cancel' },
      { text: 'Confirm', onPress: onConfirm, style: 'destructive' }
    ]);
  };

  // Load study groups from SecureStore on component mount
  useEffect(() => {
    loadStudyGroups();
  }, []);

  // Check if user just connected Google Calendar
  useEffect(() => {
    const checkCalendarConnection = async () => {
      try {
        const justConnected = await SecureStore.getItemAsync('calendarJustConnected');

        if (justConnected === 'true') {

          // Clear the flag
          await SecureStore.deleteItemAsync('calendarJustConnected');

          // Restore the selected date if it was stored
          const pendingDateStr = await SecureStore.getItemAsync('pendingCreateGroupDate');
          if (pendingDateStr) {
            const pendingDate = new Date(pendingDateStr);
            setSelectedDate(pendingDate);
            await SecureStore.deleteItemAsync('pendingCreateGroupDate');

            // Show success message and open create modal
            showSuccessAlert('Google Calendar access granted! You can now create study groups.', () => {
              // Set the date again and open the modal
              setSelectedDate(pendingDate);
              // Small delay to ensure state is updated
              setTimeout(() => {
                const dateTime = new Date(pendingDate);
                const today = new Date();

                if (pendingDate.toDateString() === today.toDateString()) {
                  dateTime.setHours(today.getHours(), today.getMinutes(), 0, 0);
                } else {
                  dateTime.setHours(0, 0, 0, 0); // Default to midnight for future dates
                }

                setStartDateTime(dateTime);
                setFormData(prev => ({
                  ...prev,
                  startTime: dateTime.toISOString()
                }));
                setShowCreateModal(true);
              }, 100);
            });
          } else {
            // No pending date, just show success message
            showSuccessAlert('Google Calendar access granted! You can now create study groups.');
          }
        } else if (justConnected === 'false') {
          // Calendar connection failed
          await SecureStore.deleteItemAsync('calendarJustConnected');
          await SecureStore.deleteItemAsync('pendingCreateGroupDate');
          showErrorAlert('Failed to connect Google Calendar. Please try again.');
        }
      } catch (error) {
        console.error('Error checking calendar connection:', error);
      }
    };

    checkCalendarConnection();
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

  const loadStudyGroups = async (showLoadingIndicator = true) => {
    try {
      if (showLoadingIndicator) {
        showLoading('Loading study groups...');
      }

      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        setStudyGroups([]);
        if (showLoadingIndicator) {
          hideLoading();
        }
        return;
      }

      
      const response = await fetch(API_ENDPOINTS.STUDY_GROUPS, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });


      if (response.ok) {
        const data = await response.json();

        if (data.success && data.data && data.data.groups) {
          
          // Map API response to our StudyGroup interface
          const normalizedGroups = data.data.groups.map((group: any, index: number) => {

            const mappedGroup = {
              id: group.id.toString(),
              title: group.title || 'Untitled Study Group',
              description: group.description || 'No description',
              maxParticipants: group.max_participants || group.maxParticipants || 10,
              startTime: group.scheduled_time || group.scheduledTime || group.next_occurrence || group.nextOccurrence,
              startTimeLocal: group.scheduled_time_local || group.scheduledTimeLocal || group.next_occurrence_local || group.nextOccurrenceLocal,
              scheduledTimeLocal: group.scheduled_time_local || group.scheduledTimeLocal || group.next_occurrence_local || group.nextOccurrenceLocal,
              durationMinutes: group.duration_minutes || group.durationMinutes || 60,
              attendeeEmails: [], // API doesn't return attendee emails in this endpoint
              frequency: group.recurrence_pattern || group.recurrencePattern || 'weekly',
              interval: group.recurrence_interval || group.recurrenceInterval || 1,
              daysOfWeek: group.recurrence_days_of_week || group.recurrenceDaysOfWeek || [],
              endDate: group.recurrence_end_date || group.recurrenceEndDate,
              endDateLocal: group.recurrence_end_date_local || group.recurrenceEndDateLocal,
              meetLink: group.meet_link || group.meetLink,
              meetId: group.meet_id || group.meetId,
              theme: group.theme,
              isRecurring: group.is_recurring || group.isRecurring || false,
              createdAt: group.created_at || group.createdAt,
              createdAtLocal: group.created_at_local || group.createdAtLocal,
              // Additional fields from API
              userRole: group.user_role || group.userRole,
              joinedAt: group.joined_at || group.joinedAt,
              creatorName: group.creator_name || group.creatorName,
              creatorEmail: group.creator_email || group.creatorEmail,
              currentMembers: group.current_members || group.currentMembers,
              isActive: group.is_active ?? group.isActive,
              timezone: group.timezone || group.timeZone,
              requiresApproval: group.requires_approval ?? group.requiresApproval
            };


            return mappedGroup;
          });
          
          setStudyGroups(normalizedGroups);
        } else {
          setStudyGroups([]);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ FETCH FAILED');
        console.error('📥 Status:', response.status, response.statusText);
        console.error('📥 Error Body:', errorText.substring(0, 500));
        setStudyGroups([]);
      }
    } catch (error) {
      console.error('💥 EXCEPTION DURING FETCH');
      console.error('Error type:', typeof error);
      console.error('Error message:', (error as any)?.message);
      console.error('Error stack:', (error as any)?.stack);
      console.error('Full error:', JSON.stringify(error, null, 2));
      setStudyGroups([]);
    } finally {
      if (showLoadingIndicator) {
        hideLoading();
      }
    }
  };

  const refreshStudyGroups = () => {
    loadStudyGroups(false); // Don't show loading spinner for manual refresh
  };

  const handleDeleteStudyGroup = async (groupId: string) => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        showErrorAlert('Please sign in to delete study groups');
        return;
      }

      // Show confirmation dialog
      showConfirmAlert(
        'Delete Study Group',
        'Are you sure you want to delete this study group? This action cannot be undone.',
        async () => {
          try {
            const response = await fetch(API_ENDPOINTS.getStudyGroup(groupId), {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });

            if (response.ok) {
              const result = await response.json();

              // Refresh the study groups list
              await loadStudyGroups();

              // Close the modal if it's open
              setShowGroupModal(false);
              setSelectedGroup(null);

              showSuccessAlert('Study group deleted successfully!');
            } else {
              const error = await response.json();
              console.error('❌ Failed to delete study group:', error);
              showErrorAlert(error.message || 'Failed to delete study group');
            }
          } catch (error) {
            console.error('❌ Error deleting study group:', error);
            showErrorAlert('Failed to delete study group. Please try again.');
          }
        }
      );
    } catch (error) {
      console.error('❌ Error in delete confirmation:', error);
      showErrorAlert('An error occurred. Please try again.');
    }
  };

  const filterUserStudyGroups = async () => {
    try {
      const userData = await SecureStore.getItemAsync('userData');
      if (userData) {
        const user = safeJsonParse<UserData>(userData, defaultUserData);
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

  const handleCreateGroup = async () => {
    setShowDateOptionsModal(false);

    // Check if user authenticated with Google - they already have calendar access
    try {
      const userDataString = await SecureStore.getItemAsync('userData');
      if (userDataString) {
        const userData = safeJsonParse<UserData>(userDataString, defaultUserData);

        // If user signed in with Google, they already have calendar access - skip the check
        if (userData.signupMethod === 'google') {
          openCreateModalWithDate();
          return;
        }
      }
    } catch (error) {
      console.error('Error checking signup method:', error);
    }

    // For email users, check if they have Google Calendar access
    showLoading('Checking authentication...');

    const hasCalendarAccess = await checkGoogleCalendarAccess();
    hideLoading();

    if (!hasCalendarAccess) {
      // User doesn't have Google Calendar access, prompt them to authenticate

      // Store the selected date so we can use it after authentication
      if (selectedDate) {
        await SecureStore.setItemAsync('pendingCreateGroupDate', selectedDate.toISOString());
      }

      showConfirmAlert(
        'Google Calendar Access Required',
        'To create study groups with Google Meet, you need to authenticate with Google Calendar. Would you like to authenticate now?',
        async () => {
          // User agreed to authenticate
          showLoading('Opening Google authentication...');
          const success = await requestGoogleCalendarAccess();
          hideLoading();

          if (success) {
            // Note: Success message will be shown when user returns to this screen
            // The useEffect will detect the calendar connection and show the message
          } else {
            showErrorAlert('Failed to authenticate with Google. Please try again.');
            // Clear the pending date since auth failed
            await SecureStore.deleteItemAsync('pendingCreateGroupDate');
          }
        },
        () => {
          // User cancelled
          showErrorAlert('Google Calendar access is required to create study groups with Google Meet.');
          // Clear the pending date since user cancelled
          SecureStore.deleteItemAsync('pendingCreateGroupDate').catch(() => { });
        }
      );
      return;
    }

    // User has calendar access, proceed to open the modal
    openCreateModalWithDate();
  };

  const openCreateModalWithDate = () => {
    if (selectedDate) {
      // Open create modal with pre-filled date
      const dateTime = new Date(selectedDate);
      // If the selected date is today, use current time, otherwise default to midnight
      const today = new Date();


      if (selectedDate.toDateString() === today.toDateString()) {
        // Use current time for today's date
        dateTime.setHours(today.getHours(), today.getMinutes(), 0, 0);
      } else {
        // Default to midnight for future dates
        dateTime.setHours(0, 0, 0, 0);
      }


      setStartDateTime(dateTime);
      
      // Initialize time input fields
      setHourInput(dateTime.getHours().toString().padStart(2, '0'));
      setMinuteInput(dateTime.getMinutes().toString().padStart(2, '0'));
      
      // Convert to UTC based on selected timezone
      const utcDateTime = convertLocalToUTC(dateTime, selectedTimezone);
      setFormData(prev => ({
        ...prev,
        startTime: utcDateTime.toISOString()
      }));

      setShowCreateModal(true);
    }
  };

  const handleCreateStudyGroup = async () => {
    try {

      showLoading('Creating study group...');
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        showErrorAlert('Please sign in to create study groups');
        hideLoading();
        return;
      }

      const userData = await SecureStore.getItemAsync('userData');
      if (!userData) {
        showErrorAlert('User data not found. Please sign in again.');
        hideLoading();
        return;
      }

      const user = safeJsonParse<UserData>(userData, defaultUserData);
      const userEmail = user.email;

      const attendeeEmails = formData.attendeeEmails
        .split(',')
        .map(email => email.trim())
        .filter(email => email.length > 0);


      // Add user's email to attendee list if not already included
      if (!attendeeEmails.includes(userEmail)) {
        attendeeEmails.push(userEmail);
      } else {
      }


      const requestData = {
        title: formData.title,
        description: formData.description,
        maxParticipants: formData.maxParticipants,
        durationMinutes: formData.durationMinutes,
        attendeeEmails
      };

      // Use the selected timezone from dropdown
      const userTimezone = selectedTimezone;

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

        console.log('📤 Sending Recurring Study Group Data:', {
          ...recurringData,
          timezone: userTimezone,
          startTimeUTC: recurringData.startTime,
          startTimeReadable: new Date(recurringData.startTime).toISOString()
        });

        response = await fetch(API_ENDPOINTS.STUDY_GROUPS_CREATE_RECURRING, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'x-timezone': userTimezone
          },
          body: JSON.stringify(recurringData)
        });
      } else {
        // Create one-time study group
        const oneTimeData = {
          ...requestData,
          scheduledTime: formData.startTime
        };

        console.log('📤 Sending One-Time Study Group Data:', {
          ...oneTimeData,
          timezone: userTimezone,
          scheduledTimeUTC: oneTimeData.scheduledTime,
          scheduledTimeReadable: new Date(oneTimeData.scheduledTime).toISOString()
        });

        response = await fetch(API_ENDPOINTS.STUDY_GROUPS_CREATE, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'x-timezone': userTimezone
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
          maxParticipants: result.data.maxParticipants || result.data.max_participants,
          startTime: result.data.startTime || result.data.scheduledTime || result.data.scheduled_time,
          durationMinutes: result.data.durationMinutes || result.data.duration_minutes,
          attendeeEmails: Array.isArray(result.data.attendeeEmails) 
            ? result.data.attendeeEmails 
            : Array.isArray(result.data.attendee_emails)
            ? result.data.attendee_emails
            : [],
          frequency: result.data.frequency || result.data.recurrence_pattern,
          interval: result.data.interval || result.data.recurrence_interval,
          daysOfWeek: result.data.daysOfWeek || result.data.recurrence_days_of_week,
          endDate: result.data.endDate || result.data.recurrence_end_date,
          meetLink: result.data.meetLink || result.data.meet_link,
          meetId: result.data.meetId || result.data.meet_id,
          theme: result.data.theme,
          isRecurring: isRecurring,
          createdAt: result.data.createdAt || result.data.created_at
        };


        // Refresh study groups from API instead of updating local state
        await loadStudyGroups();

        setShowCreateModal(false);
        resetForm();
        showSuccessAlert('Study group created successfully!');
      } else {
        const errorText = await response.text();
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { message: errorText };
        }
        

        // Check if error is due to missing Google Calendar access
        if (isGoogleCalendarAccessError(error)) {
          hideLoading();

          // Check if user is a Google user (they shouldn't see this error)
          try {
            const userDataString = await SecureStore.getItemAsync('userData');
            if (userDataString) {
              const userData = safeJsonParse<UserData>(userDataString, defaultUserData);

              // If user signed in with Google, this is a backend issue - show generic error
              if (userData.signupMethod === 'google') {
                console.error('❌ Google user received calendar access error - this should not happen');
                showErrorAlert('An error occurred while creating the study group. Please try again or contact support.');
                return;
              }
            }
          } catch (parseError) {
            console.error('Error checking signup method:', parseError);
          }

          // Show alert asking email user to authenticate with Google
          showConfirmAlert(
            'Google Calendar Access Required',
            'To create study groups with Google Meet, you need to grant Google Calendar access. Would you like to authenticate now?',
            async () => {
              // User agreed to authenticate
              showLoading('Opening Google authentication...');
              const success = await requestGoogleCalendarAccess();
              hideLoading();

              if (success) {
                showSuccessAlert('Google Calendar access granted! Please try creating the study group again.', () => {
                  // Optionally, you could automatically retry the creation here
                  // For now, just let the user manually retry
                });
              } else {
                showErrorAlert('Failed to authenticate with Google. Please try again.');
              }
            },
            () => {
              // User cancelled
              showErrorAlert('Google Calendar access is required to create study groups with Google Meet.');
            }
          );
        } else {
          showErrorAlert(error.message || 'Failed to create study group');
        }
      }
    } catch (error) {
      console.error('Error creating study group:', error);

      // Check if the caught error is also a Google Calendar access error
      if (isGoogleCalendarAccessError(error)) {
        hideLoading();

        // Check if user is a Google user (they shouldn't see this error)
        try {
          const userDataString = await SecureStore.getItemAsync('userData');
          if (userDataString) {
            const userData = safeJsonParse<UserData>(userDataString, defaultUserData);

            // If user signed in with Google, this is a backend issue - show generic error
            if (userData.signupMethod === 'google') {
              console.error('❌ Google user received calendar access error - this should not happen');
              showErrorAlert('An error occurred while creating the study group. Please try again or contact support.');
              return;
            }
          }
        } catch (parseError) {
          console.error('Error checking signup method:', parseError);
        }

        showConfirmAlert(
          'Google Calendar Access Required',
          'To create study groups with Google Meet, you need to grant Google Calendar access. Would you like to authenticate now?',
          async () => {
            showLoading('Opening Google authentication...');
            const success = await requestGoogleCalendarAccess();
            hideLoading();

            if (success) {
              showSuccessAlert('Google Calendar access granted! Please try creating the study group again.');
            } else {
              showErrorAlert('Failed to authenticate with Google. Please try again.');
            }
          },
          () => {
            showErrorAlert('Google Calendar access is required to create study groups with Google Meet.');
          }
        );
      } else {
        showErrorAlert('Failed to create study group. Please try again.');
      }
    } finally {
      hideLoading();
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
      
      // Convert local time to UTC based on selected timezone
      const utcDateTime = convertLocalToUTC(newDateTime, selectedTimezone);
      setFormData(prev => ({ ...prev, startTime: utcDateTime.toISOString() }));
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
      console.log('🎥 Opening conference URL:', conferenceUrl);
      
      // Validate and clean the URL
      let meetUrl = conferenceUrl.trim();
      
      // Ensure URL has protocol
      if (!meetUrl.startsWith('http://') && !meetUrl.startsWith('https://')) {
        meetUrl = 'https://' + meetUrl;
      }
      
      console.log('🎥 Cleaned URL:', meetUrl);
      
      try {
        // Try to open directly without canOpenURL check (more reliable)
        await Linking.openURL(meetUrl);
      } catch (linkError) {
        console.error('❌ Failed to open conference link:', linkError);
        showErrorAlert('Cannot open the meeting link. Please check if the link is valid or try opening it manually.');
      }
    } catch (error) {
      console.error('❌ Error opening conference link:', error);
      showErrorAlert('Failed to open conference link');
    }
  };


  const calendarDays = getDaysInMonth(currentDate);
  const today = new Date();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Study Groups</Text>
          <TouchableOpacity
            style={styles.manageButton}
            onPress={() => setShowUnifiedDashboard(true)}
          >
            <Ionicons name="analytics" size={20} color={WHITE} />
            <Text style={styles.manageButtonText}>Manage</Text>
          </TouchableOpacity>
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
                          {group.scheduledTimeLocal || group.startTimeLocal} {group.timezone && `(${group.timezone})`} - {group.durationMinutes} min
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.studyGroupDescription}>{group.description || 'No description'}</Text>

                      <View style={styles.studyGroupMeta}>
                        <View style={styles.metaRow}>
                          <Ionicons name="people" size={14} color={BLACK} />
                          <Text style={styles.metaText}>
                            {group.currentMembers || '0'}/{group.maxParticipants} members
                          </Text>
                        </View>
                        {group.isRecurring && (
                          <View style={styles.metaRow}>
                            <Ionicons name="repeat" size={14} color={BLACK} />
                            <Text style={styles.metaText}>Recurring</Text>
                          </View>
                        )}
                        {group.userRole && (
                          <View style={styles.metaRow}>
                            <Ionicons name="person" size={14} color={BLACK} />
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
                          {group.scheduledTimeLocal || group.startTimeLocal} {group.timezone && `(${group.timezone})`} - {group.durationMinutes} min
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.studyGroupDescription}>{group.description || 'No description'}</Text>
                    <View style={styles.studyGroupMeta}>
                      <View style={styles.metaRow}>
                        <Ionicons name="people" size={14} color={BLACK} />
                        <Text style={styles.metaText}>
                          {group.currentMembers || '0'}/{group.maxParticipants} members
                        </Text>
                      </View>
                      {group.isRecurring && (
                        <View style={styles.metaRow}>
                          <Ionicons name="repeat" size={14} color={BLACK} />
                          <Text style={styles.metaText}>Recurring</Text>
                        </View>
                      )}
                      {group.userRole && (
                        <View style={styles.metaRow}>
                          <Ionicons name="person" size={14} color={BLACK} />
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
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
              >
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

            <Text style={styles.inputLabel}>Start Date</Text>
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

            <Text style={styles.inputLabel}>Start Time</Text>
            <View style={styles.timeInputContainer}>
              <View style={styles.timeInputWrapper}>
                <TextInput
                  style={styles.timeInput}
                  placeholder="HH"
                  value={hourInput}
                  onChangeText={(text) => {
                    // Only allow numbers
                    const cleaned = text.replace(/[^0-9]/g, '');
                    setHourInput(cleaned);
                    
                    const hour = parseInt(cleaned);
                    if (!isNaN(hour) && hour >= 0 && hour <= 23) {
                      const newDateTime = new Date(startDateTime);
                      newDateTime.setHours(hour);
                      setStartDateTime(newDateTime);
                      
                      // Convert local time to UTC based on selected timezone
                      const utcDateTime = convertLocalToUTC(newDateTime, selectedTimezone);
                      setFormData(prev => ({ ...prev, startTime: utcDateTime.toISOString() }));
                    }
                  }}
                  onFocus={() => {
                    // When focused, sync with current time
                    setHourInput(startDateTime.getHours().toString().padStart(2, '0'));
                  }}
                  onBlur={() => {
                    // Ensure 2 digits on blur
                    if (hourInput.length === 1) {
                      setHourInput(hourInput.padStart(2, '0'));
                    } else if (hourInput === '') {
                      setHourInput(startDateTime.getHours().toString().padStart(2, '0'));
                    }
                  }}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholderTextColor="#6c757d"
                  returnKeyType="next"
                  selectTextOnFocus={true}
                />
                <Text style={styles.timeSeparator}>:</Text>
                <TextInput
                  style={styles.timeInput}
                  placeholder="MM"
                  value={minuteInput}
                  onChangeText={(text) => {
                    // Only allow numbers
                    const cleaned = text.replace(/[^0-9]/g, '');
                    setMinuteInput(cleaned);
                    
                    const minute = parseInt(cleaned);
                    if (!isNaN(minute) && minute >= 0 && minute <= 59) {
                      const newDateTime = new Date(startDateTime);
                      newDateTime.setMinutes(minute);
                      setStartDateTime(newDateTime);
                      
                      // Convert local time to UTC based on selected timezone
                      const utcDateTime = convertLocalToUTC(newDateTime, selectedTimezone);
                      setFormData(prev => ({ ...prev, startTime: utcDateTime.toISOString() }));
                    }
                  }}
                  onFocus={() => {
                    // When focused, sync with current time
                    setMinuteInput(startDateTime.getMinutes().toString().padStart(2, '0'));
                  }}
                  onBlur={() => {
                    // Ensure 2 digits on blur
                    if (minuteInput.length === 1) {
                      setMinuteInput(minuteInput.padStart(2, '0'));
                    } else if (minuteInput === '') {
                      setMinuteInput(startDateTime.getMinutes().toString().padStart(2, '0'));
                    }
                  }}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholderTextColor="#6c757d"
                  returnKeyType="done"
                  selectTextOnFocus={true}
                />
              </View>
              <Text style={styles.timeFormatHint}>24-hour format (00-23) - Tap to edit</Text>
            </View>

            <TouchableOpacity
              style={styles.timezoneSelector}
              onPress={() => setShowTimezoneModal(true)}
            >
              <Ionicons name="globe" size={16} color={PRIMARY_COLOR} />
              <Text style={styles.timezoneText}>
                {US_TIMEZONES.find(tz => tz.value === selectedTimezone)?.label || 'Eastern Time (ET)'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={DARK_GRAY} />
            </TouchableOpacity>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Attendee Emails</Text>
              <TextInput
                style={[styles.input, styles.emailInput]}
                placeholder="example@email.com, another@email.com"
                value={formData.attendeeEmails}
                onChangeText={(text) => setFormData(prev => ({ ...prev, attendeeEmails: text }))}
                placeholderTextColor="#6c757d"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.helperText}>
                Separate multiple emails with commas
              </Text>
            </View>

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
                  styles.createGroupButton
                ]}
                onPress={handleCreateStudyGroup}
              >
                <Text style={styles.createGroupButtonText}>
                  {isRecurring ? 'Recurring' : 'One-time'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* Native Date Pickers */}
        {showStartDatePicker && (
          <DateTimePicker
            value={startDateTime}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleStartDateChange}
            minimumDate={new Date()}
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

      {/* Timezone Selection Modal */}
      <Modal
        visible={showTimezoneModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTimezoneModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.timezoneModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Timezone</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowTimezoneModal(false)}
              >
                <Ionicons name="close" size={24} color={DARK_GRAY} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.timezoneList}>
              <Text style={styles.timezoneModalSubtitle}>
                Choose your timezone for this study group
              </Text>
              {US_TIMEZONES.map((timezone) => (
                <TouchableOpacity
                  key={timezone.value}
                  style={[
                    styles.timezoneOption,
                    selectedTimezone === timezone.value && styles.timezoneOptionSelected
                  ]}
                  onPress={() => {
                    setSelectedTimezone(timezone.value);
                    setShowTimezoneModal(false);
                  }}
                >
                  <View style={styles.timezoneOptionContent}>
                    <Text style={[
                      styles.timezoneOptionLabel,
                      selectedTimezone === timezone.value && styles.timezoneOptionLabelSelected
                    ]}>
                      {timezone.label}
                    </Text>
                    <Text style={styles.timezoneOptionOffset}>
                      {timezone.offset}
                    </Text>
                  </View>
                  {selectedTimezone === timezone.value && (
                    <Ionicons name="checkmark-circle" size={24} color={PRIMARY_COLOR} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
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
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowGroupModal(false)}
              >
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
                    {selectedGroup.scheduledTimeLocal || selectedGroup.startTimeLocal} {selectedGroup.timezone && `(${selectedGroup.timezone})`} ({selectedGroup.durationMinutes} minutes)
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

                  {/* Show dashboard button only if user is admin/creator */}
                  {selectedGroup.userRole === 'admin' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.dashboardButton]}
                      onPress={() => setShowDashboardScreen(true)}
                    >
                      <Ionicons name="analytics" size={20} color={WHITE} />
                      <Text style={styles.actionButtonText}>Manage Group</Text>
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
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowDateOptionsModal(false)}
              >
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
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.dateOptionButton, styles.dateOptionCreateButton]}
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

      {/* Group Dashboard Modal */}
      <Modal
        visible={showDashboardScreen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowDashboardScreen(false)}
      >
        <GroupDashboardScreen
          onBack={() => setShowDashboardScreen(false)}
          selectedGroup={selectedGroup}
        />
      </Modal>

      {/* Unified Dashboard Modal */}
      <Modal
        visible={showUnifiedDashboard}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowUnifiedDashboard(false)}
      >
        <UnifiedDashboardScreen
          onBack={() => setShowUnifiedDashboard(false)}
        />
      </Modal>

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
  scrollContent: {
    paddingBottom: 120, // Extra space at the bottom to avoid tab bar collision
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
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  manageButtonText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
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
  timezoneSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: OFF_WHITE,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: SOFT_GRAY,
  },
  timezoneText: {
    fontSize: 14,
    color: DARK_GRAY,
    fontFamily: 'serif',
    marginLeft: 8,
    fontWeight: '500',
    flex: 1,
  },
  timezoneModalContent: {
    backgroundColor: WHITE,
    borderRadius: 16,
    width: '90%',
    maxHeight: '70%',
  },
  timezoneModalSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    fontFamily: 'serif',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  timezoneList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  timezoneOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: OFF_WHITE,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  timezoneOptionSelected: {
    backgroundColor: LIGHT_PURPLE,
    borderColor: PRIMARY_COLOR,
  },
  timezoneOptionContent: {
    flex: 1,
  },
  timezoneOptionLabel: {
    fontSize: 16,
    color: DARK_GRAY,
    fontFamily: 'serif',
    fontWeight: '500',
    marginBottom: 4,
  },
  timezoneOptionLabelSelected: {
    color: PRIMARY_COLOR,
    fontWeight: 'bold',
  },
  timezoneOptionOffset: {
    fontSize: 12,
    color: '#6c757d',
    fontFamily: 'serif',
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
    marginHorizontal: 20,
    marginBottom: 16,
  },
  dateTimePickerText: {
    fontSize: 16,
    color: DARK_GRAY,
    fontFamily: 'serif',
    marginLeft: 8,
    flex: 1,
  },
  // Time Input Styles
  timeInputContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  timeInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: OFF_WHITE,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: SOFT_GRAY,
    justifyContent: 'center',
  },
  timeInput: {
    width: 60,
    fontSize: 24,
    fontWeight: '600',
    color: DARK_GRAY,
    textAlign: 'center',
    padding: 8,
    backgroundColor: WHITE,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: SOFT_GRAY,
  },
  timeSeparator: {
    fontSize: 28,
    fontWeight: 'bold',
    color: DARK_GRAY,
    marginHorizontal: 8,
  },
  timeFormatHint: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Calendar Styles
  calendarSection: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 12,
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
    marginBottom: 12,
  },
  monthYear: {
    fontSize: 20,
    fontWeight: 'bold',
    color: DARK_GRAY,
    fontFamily: 'serif',
  },
  daysOfWeekHeader: {
    flexDirection: 'row',
    marginBottom: 6,
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
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderRadius: 6,
    marginBottom: 2,
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
    marginBottom: 100,
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
    color: BLACK,
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
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: SOFT_GRAY,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: DARK_GRAY,
    fontFamily: 'serif',
    flex: 1,
    marginRight: 16,
    flexWrap: 'wrap',
  },
  modalCloseButton: {
    padding: 4,
    marginTop: -4,
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
  emailInput: {
    minHeight: 80,
    maxHeight: 120,
    paddingTop: 12,
    marginBottom: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  helperText: {
    fontSize: 13,
    color: '#6c757d',
    marginHorizontal: 20,
    marginBottom: 8,
    fontFamily: 'serif',
    fontStyle: 'italic',
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
    padding: 16,
    gap: 8,
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: SOFT_GRAY,
  },
  cancelButtonText: {
    color: DARK_GRAY,
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'serif',
    textAlign: 'center',
  },
  createGroupButton: {
    backgroundColor: PRIMARY_COLOR,
  },
  createGroupButtonText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'serif',
    textAlign: 'center',
    flexWrap: 'wrap',
  },
  disabledButton: {
    opacity: 0.6,
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
  dashboardButton: {
    backgroundColor: SECONDARY_COLOR, // Orange color for dashboard
    marginTop: 8,
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
  dateOptionCreateButton: {
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
  // Custom Alert Styles
  alertOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  alertContainer: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: DARK_GRAY,
    fontFamily: 'serif',
    marginLeft: 12,
  },
  alertMessage: {
    fontSize: 16,
    color: DARK_GRAY,
    fontFamily: 'serif',
    marginBottom: 20,
    lineHeight: 22,
  },
  alertButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  alertButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: PRIMARY_COLOR,
    minWidth: 80,
    alignItems: 'center',
  },
  alertButtonDestructive: {
    backgroundColor: '#dc3545',
  },
  alertButtonCancel: {
    backgroundColor: SOFT_GRAY,
  },
  alertButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: WHITE,
    fontFamily: 'serif',
  },
  alertButtonTextDestructive: {
    color: WHITE,
  },
  alertButtonTextCancel: {
    color: DARK_GRAY,
  },
});
