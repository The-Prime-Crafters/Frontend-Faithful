import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Linking,
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

export default function JoinGroupsScreen({ selectedDate, onBack }: JoinGroupsScreenProps) {
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

      // Format date for API (YYYY-MM-DD)
      const dateString = selectedDate.toISOString().split('T')[0];
      console.log('🔄 Fetching study groups for date:', dateString);
      
      const response = await fetch(`https://33df0b2b10af.ngrok-free.app/api/study-groups/public?date=${dateString}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Study groups fetched successfully:');
        console.log('📊 Raw API Response:', JSON.stringify(data, null, 2));
        
        if (data.success && data.data && data.data.groups) {
          console.log('🔍 Raw groups from API (before normalization):');
          data.data.groups.forEach((group: any, index: number) => {
            console.log(`Raw Group ${index + 1}:`, JSON.stringify(group, null, 2));
          });
          
          // Map API response to our StudyGroup interface
          const normalizedGroups = data.data.groups.map((group: any) => ({
            id: group.id.toString(),
            title: group.title || 'Untitled Study Group',
            description: group.description || 'No description',
            maxParticipants: group.max_participants || 10,
            startTime: group.scheduled_time || group.next_occurrence,
            durationMinutes: group.duration_minutes || 60,
            attendeeEmails: group.attendeeEmails || [],
            frequency: group.recurrence_pattern || 'weekly',
            interval: group.recurrence_interval || 1,
            daysOfWeek: group.recurrence_days_of_week || [],
            endDate: group.recurrence_end_date,
            meetLink: group.meet_link,
            meetId: group.meet_id,
            theme: group.theme,
            isRecurring: group.is_recurring || false,
            createdAt: group.created_at || new Date().toISOString(),
            userRole: group.userStatus?.role || group.user_role || null,
            joinedAt: group.userStatus?.joinedAt || group.user_joined_at || null,
            creatorName: group.creator_name,
            creatorEmail: group.creator_email,
            currentMembers: group.current_members?.toString() || '0',
            isActive: group.is_active !== false, // Default to true unless explicitly false
            // New fields from userStatus
            isMember: group.userStatus?.isMember || false,
            hasJoinRequest: group.userStatus?.hasJoinRequest || false,
            joinRequestStatus: group.userStatus?.joinRequestStatus || group.user_join_request_status || null,
            joinRequestMessage: group.userStatus?.joinRequestMessage || null,
            joinRequestedAt: group.userStatus?.joinRequestedAt || group.user_join_requested_at || null
          }));

          // No need to filter by date since API already returns groups for the specific date
          const groupsForDate = normalizedGroups;

          setStudyGroups(groupsForDate);
          console.log('📚 Loaded study groups for date:', groupsForDate.length);
          console.log('🔍 Detailed group data for debugging:');
          groupsForDate.forEach((group, index) => {
            console.log(`Group ${index + 1}:`, {
              id: group.id,
              title: group.title,
              isMember: group.isMember,
              joinedAt: group.joinedAt,
              userRole: group.userRole,
              hasJoinRequest: group.hasJoinRequest,
              joinRequestStatus: group.joinRequestStatus,
              creatorName: group.creatorName,
              attendeeEmails: group.attendeeEmails,
              currentMembers: group.currentMembers
            });
          });
        } else {
          console.log('⚠️ No study groups data in response');
          setStudyGroups([]);
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

  const handleJoinGroup = async (groupId: string) => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        Alert.alert('Error', 'Please sign in to join study groups');
        return;
      }

      console.log('🔄 Requesting to join study group:', groupId);
      const response = await fetch(`https://33df0b2b10af.ngrok-free.app/api/study-groups/${groupId}/request-join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'I would like to join this study group!'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Join request submitted successfully:', result);
        Alert.alert('Success', 'Your join request has been submitted! The group admin will review it.');
        // Refresh the groups list
        await loadStudyGroupsForDate();
      } else {
        const error = await response.json();
        console.error('❌ Failed to submit join request:', error);
        Alert.alert('Error', error.message || 'Failed to submit join request');
      }
    } catch (error) {
      console.error('❌ Error submitting join request:', error);
      Alert.alert('Error', 'Failed to submit join request. Please try again.');
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
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
          <Text style={styles.dateTitle}>{formatDate(selectedDate)}</Text>
          <Text style={styles.dateSubtitle}>
            {filteredGroups.length} study groups available
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
                          {formatTime(new Date(group.startTime))} ({group.durationMinutes} min)
                        </Text>
                      </View>
                    </View>
                    
                    <Text style={styles.groupDescription}>{group.description || 'No description'}</Text>
                    
                    <View style={styles.groupMeta}>
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
                        onPress={() => {
                          const meetingUrl = group.meetLink || 
                            `https://meet.google.com/new?title=${encodeURIComponent(group.title || 'Study Group')}`;
                          handleJoinConference(meetingUrl);
                        }}
                      >
                        <Ionicons name="videocam" size={16} color={WHITE} />
                        <Text style={styles.meetingButtonText}>Join Meeting</Text>
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
                  : `No study groups scheduled for ${formatDateShort(selectedDate)}`
                }
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
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
});
