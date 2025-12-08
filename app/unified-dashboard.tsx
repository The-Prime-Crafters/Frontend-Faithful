import { API_ENDPOINTS } from '@/constants/API';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// Colors - Matching app theme
const PRIMARY_COLOR = '#7b4d62';
const SECONDARY_COLOR = '#ce703f';
const SUCCESS_COLOR = '#4CAF50';
const WARNING_COLOR = '#ce703f';
const WHITE = '#FFFFFF';
const OFF_WHITE = '#f8f9fa';
const SOFT_GRAY = '#e9ecef';
const LIGHT_GRAY = '#e9ecef';
const DARK_GRAY = '#495057';
const BLACK = '#000000';
const LIGHT_PURPLE = '#e3d5ca';
const LIGHT_ORANGE = '#f4e4d6';

// Responsive design
const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;
const isSmallScreen = screenWidth < 375;

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
  userRole?: string;
  memberCount?: number;
  maxMembers?: number;
  currentMembers?: string | number;
  conferenceUrl?: string;
  createdAt?: string;
  scheduledTime?: string;
  creatorEmail?: string;
  creatorName?: string;
  joinedAt?: string;
  isActive?: boolean;
}

interface JoinRequest {
  id: number;
  user_id: number;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  requested_at: string;
  responded_at?: string;
  name: string;
  email: string;
  picture?: string;
  group_id?: number;
  group_title?: string;
}

interface UnifiedDashboardScreenProps {
  onBack: () => void;
}

export default function UnifiedDashboardScreen({ onBack }: UnifiedDashboardScreenProps) {
  const router = useRouter();
  const [ownedGroups, setOwnedGroups] = useState<StudyGroup[]>([]);
  const [myJoinRequests, setMyJoinRequests] = useState<JoinRequest[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'groups' | 'requests'>('overview');
  
  // Group management state
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
  const [showManageModal, setShowManageModal] = useState(false);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  useEffect(() => {
    console.log('🚀 Unified Dashboard - Component mounted, loading data...');
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadOwnedGroups(),
        loadMyJoinRequests()
      ]);
      // Load incoming requests after owned groups are loaded
      await loadIncomingRequests();
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOwnedGroups = async () => {
    try {
      console.log('🔐 Unified Dashboard - Loading owned groups...');
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        console.log('❌ Unified Dashboard - No auth token found');
        return;
      }
      console.log('🔐 Unified Dashboard - Auth token found, making API call...');

      const response = await fetch(API_ENDPOINTS.STUDY_GROUPS, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📊 Unified Dashboard - API Response:', JSON.stringify(data, null, 2));
        const groups = data.data?.groups || data.groups || data.data || data || [];
        const groupsArray = Array.isArray(groups) ? groups : [];
        console.log('📊 All groups from API:', groupsArray.length);
        
        // Map API response to our interface
        const mappedGroups = groupsArray.map((group: any) => ({
          id: group.id.toString(),
          title: group.title,
          description: group.description,
          maxParticipants: group.max_participants,
          startTime: group.scheduled_time,
          durationMinutes: group.duration_minutes,
          attendeeEmails: group.attendee_emails || [],
          frequency: group.recurrence_pattern,
          interval: group.recurrence_interval,
          daysOfWeek: group.recurrence_days_of_week || [],
          endDate: group.recurrence_end_date,
          meetLink: group.meet_link,
          meetId: group.meet_id,
          theme: group.theme,
          isRecurring: group.is_recurring,
          userRole: group.user_role,
          memberCount: group.current_members ? Number(group.current_members) : 0,
          maxMembers: group.max_participants,
          currentMembers: group.current_members,
          conferenceUrl: group.meet_link,
          createdAt: group.created_at,
          scheduledTime: group.scheduled_time,
          creatorEmail: group.creator_email,
          creatorName: group.creator_name,
          joinedAt: group.joined_at,
          isActive: group.is_active,
        }));
        
        // Filter for owned groups
        const ownedGroupsArray = mappedGroups.filter((group: any) => {
          const isOwner = group.userRole === 'admin' || group.userRole === 'owner' || group.isOwner === true;
          console.log(`🔍 Group "${group.title}" - userRole: ${group.userRole}, isOwner: ${isOwner}`);
          return isOwner;
        });
        
        setOwnedGroups(ownedGroupsArray);
        console.log('✅ Unified Dashboard - Owned groups loaded:', ownedGroupsArray.length, 'out of', groupsArray.length, 'total groups');
      } else {
        console.error('❌ Failed to load owned groups');
      }
    } catch (error) {
      console.error('❌ Error loading owned groups:', error);
    }
  };

  const loadMyJoinRequests = async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) return;

      const response = await fetch(API_ENDPOINTS.STUDY_GROUPS_MY_JOIN_REQUESTS, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const requests = data.data?.requests || data.requests || data.data || data || [];
        const requestsArray = Array.isArray(requests) ? requests : [];
        setMyJoinRequests(requestsArray);
        console.log('✅ My join requests loaded:', requestsArray.length);
      } else {
        console.error('❌ Failed to load my join requests');
      }
    } catch (error) {
      console.error('❌ Error loading my join requests:', error);
    }
  };

  const loadIncomingRequests = async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) return;

      console.log('🔍 LOADING INCOMING REQUESTS FOR OWNED GROUPS');
      console.log('📊 Owned Groups Count:', ownedGroups.length);
      console.log('📊 Owned Groups:', ownedGroups.map(g => ({ id: g.id, title: g.title })));

      // Load join requests for all owned groups
      const allIncomingRequests: JoinRequest[] = [];
      
      for (let i = 0; i < ownedGroups.length; i++) {
        const group = ownedGroups[i];
        try {
          console.log(`🔍 Fetching requests for group: ${group.title} (${group.id})`);
          
          const response = await fetch(API_ENDPOINTS.getStudyGroupJoinRequests(group.id), {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          console.log(`📥 Response for group ${group.title}:`, response.status);

          if (response.ok) {
            const data = await response.json();
            console.log(`✅ RAW API RESPONSE FOR GROUP ${group.title}:`);
            console.log('📊 Full Response:', JSON.stringify(data, null, 2));
            
            const requests = data.data?.requests || data.requests || data.data || data || [];
            const requestsArray = Array.isArray(requests) ? requests : [];
            
            console.log(`📋 Requests found for ${group.title}:`, requestsArray.length);
            
            // Log each request for this group
            requestsArray.forEach((req: any, index: number) => {
              console.log(`📝 Request ${index + 1} for ${group.title}:`, {
                id: req.id,
                userName: req.userName,
                user_name: req.user_name,
                name: req.name,
                message: req.message,
                createdAt: req.createdAt,
                created_at: req.created_at,
                requested_at: req.requested_at,
                fullRequest: req
              });
            });
            
            // Add group title to each request
            const requestsWithGroupTitle = requestsArray.map((req: any) => ({
              ...req,
              group_title: group.title,
              group_id: group.id
            }));
            
            allIncomingRequests.push(...requestsWithGroupTitle);
          } else {
            // Handle different error status codes
            if (response.status === 429) {
              console.log(`⚠️ Rate limited for group ${group.title}, waiting before retry...`);
              // Wait 1 second before continuing to next group
              await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
              try {
                const errorData = await response.json();
                console.log(`❌ Failed to fetch requests for group ${group.title}:`, response.status);
                console.log('❌ Error Response:', JSON.stringify(errorData, null, 2));
              } catch (parseError) {
                console.log(`❌ Failed to parse error response for group ${group.title}:`, response.status);
                console.log('❌ Raw response text:', await response.text());
              }
            }
          }
          
          // Add small delay between requests to avoid rate limiting
          if (i < ownedGroups.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        } catch (error) {
          console.error(`💥 Error loading join requests for group ${group.id}:`, error);
          // Continue with next group even if this one fails
        }
      }
      
      console.log('📊 TOTAL INCOMING REQUESTS LOADED:', allIncomingRequests.length);
      console.log('📊 All Incoming Requests:', allIncomingRequests);
      
      setIncomingRequests(allIncomingRequests);
      console.log('✅ Incoming join requests loaded:', allIncomingRequests.length);
    } catch (error) {
      console.error('❌ Error loading incoming requests:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  // Group management functions
  const handleManageGroup = async (group: StudyGroup) => {
    setSelectedGroup(group);
    setShowManageModal(true);
    await fetchJoinRequests(group.id);
  };

  const fetchJoinRequests = async (groupId: string) => {
    try {
      setLoadingRequests(true);
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) return;

      console.log('🔍 FETCHING JOIN REQUESTS FOR GROUP:', groupId);
      console.log('📡 API Endpoint:', API_ENDPOINTS.getStudyGroupJoinRequests(groupId));

      const response = await fetch(API_ENDPOINTS.getStudyGroupJoinRequests(groupId), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📥 Response Status:', response.status);
      console.log('📥 Response Headers:', response.headers);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ RAW API RESPONSE FOR JOIN REQUESTS:');
        console.log('📊 Full Response:', JSON.stringify(data, null, 2));
        
        const requests = data.data?.requests || data.requests || data.data || data || [];
        console.log('📋 Extracted Requests:', requests);
        console.log('📋 Requests Count:', requests.length);
        
        // Log each request individually
        requests.forEach((request: any, index: number) => {
          console.log(`📝 Request ${index + 1}:`, {
            id: request.id,
            userName: request.userName,
            user_name: request.user_name,
            name: request.name,
            message: request.message,
            createdAt: request.createdAt,
            created_at: request.created_at,
            requested_at: request.requested_at,
            fullRequest: request
          });
        });
        
        setJoinRequests(requests);
      } else {
        if (response.status === 429) {
          console.log('⚠️ Rate limited when fetching join requests, waiting before retry...');
          // Wait 1 second and retry once
          await new Promise(resolve => setTimeout(resolve, 1000));
          // You could add a retry logic here if needed
        } else {
          try {
            const errorData = await response.json();
            console.log('❌ Failed to fetch join requests:', response.status);
            console.log('❌ Error Response:', JSON.stringify(errorData, null, 2));
          } catch (parseError) {
            console.log('❌ Failed to parse error response:', response.status);
            console.log('❌ Raw response text:', await response.text());
          }
        }
        setJoinRequests([]);
      }
    } catch (error) {
      console.error('💥 Error fetching join requests:', error);
      setJoinRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleRespondToRequest = async (requestId: string, action: 'approve' | 'reject') => {
    if (!selectedGroup) return;

    try {
      setActionLoading(requestId);
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) return;

      // Map frontend action to API action
      const apiAction = action === 'approve' ? 'accept' : action;
      
      console.log(`🔄 Responding to request ${requestId} with action: ${action} -> ${apiAction}`);
      console.log(`📡 API Endpoint: ${API_ENDPOINTS.getStudyGroupJoinRequestRespond(selectedGroup.id, requestId)}`);
      console.log(`📤 Request Body: ${JSON.stringify({ action: apiAction })}`);

      const response = await fetch(API_ENDPOINTS.getStudyGroupJoinRequestRespond(selectedGroup.id, requestId), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: apiAction }),
      });

      console.log(`📥 Response Status: ${response.status}`);

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Successfully ${apiAction}ed request:`, JSON.stringify(result, null, 2));
        // Refresh the join requests list
        await fetchJoinRequests(selectedGroup.id);
        // Refresh the main dashboard data
        await loadDashboardData();
      } else {
        const errorData = await response.json();
        console.log(`❌ Failed to ${apiAction} request:`, response.status);
        console.log(`❌ Error Response:`, JSON.stringify(errorData, null, 2));
      }
    } catch (error) {
      console.error(`Error ${action}ing request:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return WARNING_COLOR;
      case 'accepted': return SUCCESS_COLOR;
      case 'rejected': return SECONDARY_COLOR;
      default: return DARK_GRAY;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'time-outline';
      case 'accepted': return 'checkmark-circle-outline';
      case 'rejected': return 'close-circle-outline';
      default: return 'help-circle-outline';
    }
  };

  const getStats = () => {
    const pendingRequests = myJoinRequests.filter(req => req.status === 'pending');
    const acceptedRequests = myJoinRequests.filter(req => req.status === 'accepted');
    const rejectedRequests = myJoinRequests.filter(req => req.status === 'rejected');
    
    return {
      totalGroups: ownedGroups.length,
      totalRequests: myJoinRequests.length,
      pendingRequests: pendingRequests.length,
      acceptedRequests: acceptedRequests.length,
      rejectedRequests: rejectedRequests.length,
    };
  };

  const getAllRecentActivity = () => {
    const outgoingRequests = myJoinRequests.map(req => ({
      ...req,
      type: 'outgoing' as const,
      displayText: `Join request ${req.status} for ${req.group_title || 'group'}`,
      timestamp: req.requested_at
    }));

    const incomingRequestsWithType = incomingRequests.map(req => ({
      ...req,
      type: 'incoming' as const,
      displayText: `Join request ${req.status} for ${req.group_title || 'group'}`,
      timestamp: req.requested_at
    }));

    // Combine and sort by timestamp (most recent first)
    const allActivity = [...outgoingRequests, ...incomingRequestsWithType]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5); // Show last 5 activities

    return allActivity;
  };

  const renderOverviewTab = () => {
    const stats = getStats();
    
    return (
      <View style={styles.tabContent}>
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={24} color={PRIMARY_COLOR} />
            <Text style={styles.statNumber}>{stats.totalGroups}</Text>
            <Text style={styles.statLabel}>Groups Owned</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="time" size={24} color={WARNING_COLOR} />
            <Text style={styles.statNumber}>{stats.pendingRequests}</Text>
            <Text style={styles.statLabel}>Pending Requests</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={24} color={SUCCESS_COLOR} />
            <Text style={styles.statNumber}>{stats.acceptedRequests}</Text>
            <Text style={styles.statLabel}>Accepted</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => setActiveTab('groups')}
            >
              <Ionicons name="people" size={20} color={WHITE} />
              <Text style={styles.quickActionText}>Manage Groups</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => setActiveTab('requests')}
            >
              <Ionicons name="list" size={20} color={WHITE} />
              <Text style={styles.quickActionText}>View Requests</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.recentActivityContainer}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {getAllRecentActivity().map((activity, index) => (
            <View key={`${activity.type}-${activity.id}-${index}`} style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons 
                  name={activity.type === 'incoming' ? 'arrow-down' : 'arrow-up'} 
                  size={16} 
                  color={activity.type === 'incoming' ? PRIMARY_COLOR : SECONDARY_COLOR} 
                />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>
                  {activity.type === 'incoming' ? 'Incoming' : 'Outgoing'}: {activity.displayText}
                </Text>
                <Text style={styles.activityDate}>
                  {formatDateTime(activity.timestamp)}
                </Text>
              </View>
              <View style={[styles.activityStatusIcon, { backgroundColor: getStatusColor(activity.status) }]}>
                <Ionicons 
                  name={getStatusIcon(activity.status)} 
                  size={12} 
                  color={WHITE} 
                />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderGroupsTab = () => {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>My Groups ({ownedGroups.length})</Text>
        {ownedGroups.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={DARK_GRAY} />
            <Text style={styles.emptyTitle}>No Groups Found</Text>
            <Text style={styles.emptySubtitle}>
              You haven't created any study groups yet.
            </Text>
          </View>
        ) : (
          ownedGroups.map((group) => (
            <View key={group.id} style={styles.groupCard}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupTitle}>{group.title || 'Untitled Group'}</Text>
                <View style={styles.groupBadge}>
                  <Ionicons name="star" size={16} color={WARNING_COLOR} />
                  <Text style={styles.badgeText}>Owner</Text>
                </View>
              </View>
              
              <Text style={styles.groupDescription} numberOfLines={2}>
                {group.description || 'No description available'}
              </Text>
              
              <View style={styles.groupInfo}>
                <View style={styles.infoItem}>
                  <Ionicons name="calendar-outline" size={16} color={DARK_GRAY} />
                  <Text style={styles.infoText}>
                    {formatDateTime(group.scheduledTime || group.startTime)}
                  </Text>
                </View>
                
                <View style={styles.infoItem}>
                  <Ionicons name="people-outline" size={16} color={DARK_GRAY} />
                  <Text style={styles.infoText}>
                    {Number(group.currentMembers) || group.memberCount || 0}/{group.maxParticipants || group.maxMembers} members
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.manageButton}
                onPress={() => handleManageGroup(group)}
                activeOpacity={0.7}
              >
                <Ionicons name="settings-outline" size={16} color={WHITE} />
                <Text style={styles.manageButtonText}>Manage Group</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    );
  };

  const renderRequestsTab = () => {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>My Join Requests ({myJoinRequests.length})</Text>
        {myJoinRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="list-outline" size={64} color={DARK_GRAY} />
            <Text style={styles.emptyTitle}>No Requests Found</Text>
            <Text style={styles.emptySubtitle}>
              You haven't requested to join any groups yet.
            </Text>
          </View>
        ) : (
          myJoinRequests.map((request) => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <View style={styles.requestInfo}>
                  <Text style={styles.requestGroupTitle}>
                    {request.group_title || `Request #${request.id}`}
                  </Text>
                  <Text style={styles.requestDate}>
                    {formatDateTime(request.requested_at)}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                  <Ionicons 
                    name={getStatusIcon(request.status)} 
                    size={16} 
                    color={WHITE} 
                  />
                  <Text style={styles.statusText}>{request.status}</Text>
                </View>
              </View>

              {request.message && (
                <Text style={styles.requestMessage}>"{request.message}"</Text>
              )}

              <View style={styles.requestFooter}>
                <Text style={styles.requestStatus}>
                  Status: {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </Text>
                {request.responded_at && (
                  <Text style={styles.requestResponseDate}>
                    Responded: {formatDateTime(request.responded_at)}
                  </Text>
                )}
              </View>
            </View>
          ))
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={BLACK} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={BLACK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color={PRIMARY_COLOR} />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'overview' && styles.activeTabButton]}
          onPress={() => setActiveTab('overview')}
        >
          <Ionicons 
            name="grid-outline" 
            size={20} 
            color={activeTab === 'overview' ? WHITE : DARK_GRAY} 
          />
          <Text style={[styles.tabButtonText, activeTab === 'overview' && styles.activeTabButtonText]}>
            Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'groups' && styles.activeTabButton]}
          onPress={() => setActiveTab('groups')}
        >
          <Ionicons 
            name="people-outline" 
            size={20} 
            color={activeTab === 'groups' ? WHITE : DARK_GRAY} 
          />
          <Text style={[styles.tabButtonText, activeTab === 'groups' && styles.activeTabButtonText]}>
            Groups
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'requests' && styles.activeTabButton]}
          onPress={() => setActiveTab('requests')}
        >
          <Ionicons 
            name="list-outline" 
            size={20} 
            color={activeTab === 'requests' ? WHITE : DARK_GRAY} 
          />
          <Text style={[styles.tabButtonText, activeTab === 'requests' && styles.activeTabButtonText]}>
            Requests
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'groups' && renderGroupsTab()}
        {activeTab === 'requests' && renderRequestsTab()}
      </ScrollView>
      
      {/* Manage Group Modal */}
      {showManageModal && selectedGroup && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowManageModal(false)}
          />
          <View style={styles.modalContainer}>
            <View style={styles.modalDragHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Manage Group</Text>
              <TouchableOpacity 
                onPress={() => setShowManageModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={DARK_GRAY} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>{selectedGroup.title}</Text>
            
            <ScrollView 
              style={styles.requestsSection}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.requestsScrollContent}
            >
              <Text style={styles.requestsTitle}>
                Join Requests ({joinRequests.length})
              </Text>
              
              {loadingRequests ? (
                <View style={styles.modalLoadingContainer}>
                  <ActivityIndicator size="small" color={PRIMARY_COLOR} />
                  <Text style={styles.modalLoadingText}>Loading requests...</Text>
                </View>
              ) : joinRequests.length === 0 ? (
                <View style={styles.emptyRequestsContainer}>
                  <Ionicons name="checkmark-circle-outline" size={48} color={DARK_GRAY} />
                  <Text style={styles.emptyRequestsText}>No pending requests</Text>
                </View>
              ) : (
                joinRequests.map((request) => (
                  <View key={request.id} style={styles.modalRequestCard}>
                    <View style={styles.modalRequestInfo}>
                      <Text style={styles.modalRequestUserName}>
                        {request.userName || request.user_name || request.name || 'Anonymous'}
                      </Text>
                      <Text style={styles.modalRequestMessage}>{request.message || 'No message provided'}</Text>
                      <Text style={styles.modalRequestDate}>
                        {(() => {
                          const dateString = request.createdAt || request.created_at || request.requested_at;
                          if (!dateString) return 'Unknown date';
                          
                          try {
                            const date = new Date(dateString);
                            if (isNaN(date.getTime())) {
                              console.log('❌ Invalid date string:', dateString);
                              return 'Invalid date';
                            }
                            return date.toLocaleDateString();
                          } catch (error) {
                            console.log('❌ Date parsing error:', error, 'for date:', dateString);
                            return 'Invalid date';
                          }
                        })()}
                      </Text>
                    </View>
                    
                    <View style={styles.requestActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={() => handleRespondToRequest(request.id, 'reject')}
                        disabled={actionLoading === request.id}
                      >
                        {actionLoading === request.id ? (
                          <ActivityIndicator size="small" color={WHITE} />
                        ) : (
                          <>
                            <Ionicons name="close" size={16} color={WHITE} />
                            <Text style={styles.actionButtonText}>Reject</Text>
                          </>
                        )}
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.actionButton, styles.approveButton]}
                        onPress={() => handleRespondToRequest(request.id, 'approve')}
                        disabled={actionLoading === request.id}
                      >
                        {actionLoading === request.id ? (
                          <ActivityIndicator size="small" color={WHITE} />
                        ) : (
                          <>
                            <Ionicons name="checkmark" size={16} color={WHITE} />
                            <Text style={styles.actionButtonText}>Approve</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: OFF_WHITE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_GRAY,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: BLACK,
  },
  refreshButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: WHITE,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_GRAY,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTabButton: {
    backgroundColor: PRIMARY_COLOR,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK_GRAY,
    marginLeft: 6,
  },
  activeTabButtonText: {
    color: WHITE,
  },
  content: {
    flex: 1,
    padding: isTablet ? 24 : 16,
  },
  tabContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: DARK_GRAY,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: WHITE,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: PRIMARY_COLOR,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: DARK_GRAY,
    textAlign: 'center',
    marginTop: 4,
  },
  quickActionsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: BLACK,
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  recentActivityContainer: {
    backgroundColor: WHITE,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_GRAY,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: LIGHT_PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: BLACK,
    fontWeight: '500',
  },
  activityDate: {
    fontSize: 12,
    color: DARK_GRAY,
    marginTop: 2,
  },
  activityStatusIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: DARK_GRAY,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: DARK_GRAY,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  groupCard: {
    backgroundColor: WHITE,
    borderRadius: 12,
    padding: isTablet ? 20 : 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: BLACK,
    flex: 1,
    marginRight: 8,
  },
  groupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LIGHT_ORANGE,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: WARNING_COLOR,
    marginLeft: 4,
  },
  groupDescription: {
    fontSize: 14,
    color: DARK_GRAY,
    marginBottom: 12,
    lineHeight: 20,
  },
  groupInfo: {
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: DARK_GRAY,
    marginLeft: 8,
  },
  requestCard: {
    backgroundColor: WHITE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  requestInfo: {
    flex: 1,
  },
  requestGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: PRIMARY_COLOR,
  },
  requestDate: {
    fontSize: 12,
    color: DARK_GRAY,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: WHITE,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  requestMessage: {
    fontSize: 14,
    color: DARK_GRAY,
    fontStyle: 'italic',
    marginBottom: 8,
    paddingLeft: 4,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestStatus: {
    fontSize: 12,
    color: DARK_GRAY,
    fontWeight: '500',
  },
  requestResponseDate: {
    fontSize: 12,
    color: DARK_GRAY,
  },
  
  // Manage Group Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalDragHandle: {
    width: 40,
    height: 4,
    backgroundColor: SOFT_GRAY,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: DARK_GRAY,
  },
  closeButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    color: DARK_GRAY,
    marginBottom: 20,
  },
  requestsSection: {
    flex: 1,
    marginTop: 16,
  },
  requestsScrollContent: {
    paddingBottom: 20,
  },
  requestsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DARK_GRAY,
    marginBottom: 16,
  },
  modalLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalLoadingText: {
    marginLeft: 8,
    color: DARK_GRAY,
  },
  emptyRequestsContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyRequestsText: {
    fontSize: 16,
    color: DARK_GRAY,
    marginTop: 12,
  },
  modalRequestCard: {
    backgroundColor: WHITE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: SOFT_GRAY,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modalRequestInfo: {
    marginBottom: 12,
  },
  modalRequestUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: DARK_GRAY,
    marginBottom: 4,
  },
  modalRequestMessage: {
    fontSize: 14,
    color: DARK_GRAY,
    marginBottom: 8,
    lineHeight: 20,
  },
  modalRequestDate: {
    fontSize: 12,
    color: DARK_GRAY,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 4,
  },
  rejectButton: {
    backgroundColor: '#dc3545',
  },
  approveButton: {
    backgroundColor: SUCCESS_COLOR,
  },
  actionButtonText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Manage Group Button Styles
  manageButton: {
    backgroundColor: PRIMARY_COLOR,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    gap: 6,
  },
  manageButtonText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '600',
  },
});
