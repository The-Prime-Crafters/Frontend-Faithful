import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { API_ENDPOINTS } from '@/constants/API';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
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
  currentMembers?: string | number; // From API response
  conferenceUrl?: string;
  createdAt?: string;
  scheduledTime?: string; // For backward compatibility
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
}

interface GroupDashboardScreenProps {
  onBack: () => void;
  selectedGroup?: StudyGroup | null; // Optional: if coming from a specific group
}

export default function GroupDashboardScreen({ onBack, selectedGroup: initialSelectedGroup }: GroupDashboardScreenProps) {
  const router = useRouter();
  const [ownedGroups, setOwnedGroups] = useState<StudyGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
  const [joinRequests, setJoinRequests] = useState<Record<string, JoinRequest[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    console.log('🎯 GroupDashboardScreen - initialSelectedGroup:', initialSelectedGroup);
    
    // If we have an initial selected group, set it and load its join requests
    if (initialSelectedGroup) {
      console.log('✅ Setting up dashboard for specific group:', initialSelectedGroup.title);
      setSelectedGroup(initialSelectedGroup);
      setOwnedGroups([initialSelectedGroup]); // Show this group in the list
      loadJoinRequests(initialSelectedGroup.id);
      setExpandedGroups(new Set([initialSelectedGroup.id])); // Auto-expand the selected group
      setLoading(false);
    } else {
      console.log('📋 Loading all owned groups');
      loadOwnedGroups();
    }
  }, [initialSelectedGroup]);

  const loadOwnedGroups = async () => {
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        console.log('❌ No auth token found');
        setOwnedGroups([]);
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
        console.log('📊 API Response:', JSON.stringify(data, null, 2));
        
        // Handle different possible response structures
        const groups = data.data || data.groups || data || [];
        const groupsArray = Array.isArray(groups) ? groups : [];
        
        // Filter for owned groups (where userRole is 'admin')
        const ownedGroupsArray = groupsArray.filter((group: any) => 
          group.userRole === 'admin' || group.userRole === 'owner' || group.isOwner === true
        );
        
        setOwnedGroups(ownedGroupsArray);
        console.log('✅ Owned groups loaded:', ownedGroupsArray.length, 'out of', groupsArray.length, 'total groups');
      } else {
        console.error('❌ Failed to load owned groups');
        Alert.alert('Error', 'Failed to load your study groups');
      }
    } catch (error) {
      console.error('❌ Error loading owned groups:', error);
      Alert.alert('Error', 'Failed to load study groups');
    } finally {
      setLoading(false);
    }
  };

  const toggleGroupExpansion = async (groupId: string) => {
    const newExpandedGroups = new Set(expandedGroups);
    if (expandedGroups.has(groupId)) {
      newExpandedGroups.delete(groupId);
    } else {
      newExpandedGroups.add(groupId);
      // Load join requests when expanding
      await loadJoinRequests(groupId);
    }
    setExpandedGroups(newExpandedGroups);
  };

  const loadJoinRequests = async (groupId: string) => {
    try {
      setActionLoading(groupId);
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) return;

      const response = await fetch(API_ENDPOINTS.getStudyGroupJoinRequests(groupId), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📊 Join Requests API Response:', JSON.stringify(data, null, 2));
        
        // Handle different possible response structures
        const requests = data.data?.requests || data.requests || data.data || data || [];
        const requestsArray = Array.isArray(requests) ? requests : [];
        
        // Store requests for this specific group
        setJoinRequests(prev => ({
          ...prev,
          [groupId]: requestsArray
        }));
        console.log('✅ Join requests loaded for group', groupId, ':', requestsArray.length);
      } else {
        console.error('❌ Failed to load join requests');
        Alert.alert('Error', 'Failed to load join requests');
      }
    } catch (error) {
      console.error('❌ Error loading join requests:', error);
      Alert.alert('Error', 'Failed to load join requests');
    } finally {
      setActionLoading(null);
    }
  };

  const handleJoinRequestAction = async (requestId: number, action: 'accept' | 'reject', groupId: string) => {
    try {
      setActionLoading(requestId.toString());
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) return;

      const response = await fetch(API_ENDPOINTS.getStudyGroupJoinRequestRespond(groupId, requestId), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: action
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Join request ${action}ed:`, result);
        Alert.alert('Success', `Join request ${action}ed successfully`);
        
        // Refresh join requests for all groups that have requests loaded
        const groupIds = Object.keys(joinRequests);
        for (const groupId of groupIds) {
          await loadJoinRequests(groupId);
        }
      } else {
        const error = await response.json();
        console.error(`❌ Failed to ${action} join request:`, error);
        Alert.alert('Error', error.message || `Failed to ${action} join request`);
      }
    } catch (error) {
      console.error(`❌ Error ${action}ing join request:`, error);
      Alert.alert('Error', `Failed to ${action} join request`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    Alert.alert(
      'Delete Study Group',
      'Are you sure you want to delete this study group? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(groupId);
              const token = await SecureStore.getItemAsync('authToken');
              if (!token) return;

              const response = await fetch(API_ENDPOINTS.getStudyGroup(groupId), {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });

              if (response.ok) {
                console.log('✅ Study group deleted successfully');
                Alert.alert('Success', 'Study group deleted successfully');
                await loadOwnedGroups();
                setShowGroupDetails(false);
                setSelectedGroup(null);
              } else {
                const error = await response.json();
                console.error('❌ Failed to delete study group:', error);
                Alert.alert('Error', error.message || 'Failed to delete study group');
              }
            } catch (error) {
              console.error('❌ Error deleting study group:', error);
              Alert.alert('Error', 'Failed to delete study group');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOwnedGroups();
    setRefreshing(false);
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={BLACK} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Group Dashboard</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={styles.loadingText}>Loading your groups...</Text>
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
        <Text style={styles.headerTitle}>Group Dashboard</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color={PRIMARY_COLOR} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {!ownedGroups || ownedGroups.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={DARK_GRAY} />
            <Text style={styles.emptyTitle}>
              {initialSelectedGroup ? 'Group Not Found' : 'No Groups Found'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {initialSelectedGroup 
                ? 'This group may have been deleted or you no longer have access to it.'
                : 'You haven\'t created any study groups yet.'
              }
            </Text>
            {!initialSelectedGroup && (
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => {
                  onBack();
                  // Navigate to create group screen
                }}
              >
                <Text style={styles.createButtonText}>Create Your First Group</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>
              {initialSelectedGroup ? 'Group Management' : `Your Study Groups (${(ownedGroups || []).length})`}
            </Text>
            {(ownedGroups || []).map((group) => {
              console.log('🎯 Rendering group:', group.title, 'userRole:', group.userRole);
              const isExpanded = expandedGroups.has(group.id);
              const groupRequests = joinRequests[group.id] || [];
              const pendingRequests = groupRequests.filter(req => req.status === 'pending');
              
              return (
              <View key={group.id} style={styles.groupCard}>
                <TouchableOpacity
                  style={styles.groupHeaderTouchable}
                  onPress={() => {
                    setSelectedGroup(group);
                    setShowGroupDetails(true);
                  }}
                >
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
                  
                  {group.isRecurring && (
                    <View style={styles.infoItem}>
                      <Ionicons name="repeat-outline" size={16} color={DARK_GRAY} />
                      <Text style={styles.infoText}>
                        {group.frequency} - {group.daysOfWeek?.map(day => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]).join(', ')}
                      </Text>
                    </View>
                  )}
                </View>

                </TouchableOpacity>

                {/* Join Requests Section */}
                <View style={styles.joinRequestsSection}>
                  <TouchableOpacity 
                    style={styles.expandButton}
                    onPress={() => toggleGroupExpansion(group.id)}
                  >
                    <View style={styles.expandButtonContent}>
                      <Ionicons 
                        name="people-outline" 
                        size={16} 
                        color={PRIMARY_COLOR} 
                      />
                      <Text style={styles.expandButtonText}>
                        Join Requests ({pendingRequests.length} pending)
                      </Text>
                      <Ionicons 
                        name={isExpanded ? "chevron-up" : "chevron-down"} 
                        size={16} 
                        color={DARK_GRAY} 
                      />
                    </View>
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.joinRequestsList}>
                      {actionLoading === group.id ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator size="small" color={PRIMARY_COLOR} />
                          <Text style={styles.loadingText}>Loading requests...</Text>
                        </View>
                      ) : groupRequests.length === 0 ? (
                        <View style={styles.emptyRequestsContainer}>
                          <Text style={styles.emptyRequestsText}>No join requests yet</Text>
                        </View>
                      ) : (
                        groupRequests.map((request) => (
                          <View key={request.id} style={styles.requestItem}>
                            <View style={styles.requestHeader}>
                              <View style={styles.requestUser}>
                                <View style={styles.avatar}>
                                  <Text style={styles.avatarText}>
                                    {request.name.charAt(0).toUpperCase()}
                                  </Text>
                                </View>
                                <View style={styles.requestUserInfo}>
                                  <Text style={styles.requestName}>{request.name}</Text>
                                  <Text style={styles.requestEmail}>{request.email}</Text>
                                </View>
                              </View>
                              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                                <Ionicons 
                                  name={getStatusIcon(request.status)} 
                                  size={12} 
                                  color={WHITE} 
                                />
                                <Text style={styles.statusText}>{request.status}</Text>
                              </View>
                            </View>

                            {request.message && (
                              <Text style={styles.requestMessage}>"{request.message}"</Text>
                            )}

                            <View style={styles.requestInfo}>
                              <Text style={styles.requestDate}>
                                {formatDateTime(request.requested_at)}
                              </Text>
                            </View>

                            {request.status === 'pending' && (
                              <View style={styles.requestActions}>
                                <TouchableOpacity
                                  style={[styles.requestButton, styles.acceptButton]}
                                  onPress={() => handleJoinRequestAction(request.id, 'accept', group.id)}
                                  disabled={actionLoading === request.id.toString()}
                                >
                                  {actionLoading === request.id.toString() ? (
                                    <ActivityIndicator size="small" color={WHITE} />
                                  ) : (
                                    <>
                                      <Ionicons name="checkmark" size={14} color={WHITE} />
                                      <Text style={styles.requestButtonText}>Accept</Text>
                                    </>
                                  )}
                                </TouchableOpacity>
                                
                                <TouchableOpacity
                                  style={[styles.requestButton, styles.rejectButton]}
                                  onPress={() => handleJoinRequestAction(request.id, 'reject', group.id)}
                                  disabled={actionLoading === request.id.toString()}
                                >
                                  {actionLoading === request.id.toString() ? (
                                    <ActivityIndicator size="small" color={WHITE} />
                                  ) : (
                                    <>
                                      <Ionicons name="close" size={14} color={WHITE} />
                                      <Text style={styles.requestButtonText}>Reject</Text>
                                    </>
                                  )}
                                </TouchableOpacity>
                              </View>
                            )}
                          </View>
                        ))
                      )}
                    </View>
                  )}
                </View>
              </View>
              );
            })}
          </>
        )}
      </ScrollView>

      {/* Group Details Modal */}
      <Modal
        visible={showGroupDetails}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowGroupDetails(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowGroupDetails(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={BLACK} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Group Details</Text>
            <TouchableOpacity
              onPress={() => selectedGroup && handleDeleteGroup(selectedGroup.id)}
              style={styles.deleteButton}
              disabled={actionLoading === selectedGroup?.id}
            >
              {actionLoading === selectedGroup?.id ? (
                <ActivityIndicator size="small" color={SECONDARY_COLOR} />
              ) : (
                <Ionicons name="trash-outline" size={24} color={SECONDARY_COLOR} />
              )}
            </TouchableOpacity>
          </View>

          {selectedGroup && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.detailCard}>
                <Text style={styles.detailTitle}>{selectedGroup.title || 'Untitled Group'}</Text>
                <Text style={styles.detailDescription}>{selectedGroup.description || 'No description available'}</Text>
                
                <View style={styles.detailInfo}>
                  <View style={styles.detailItem}>
                    <Ionicons name="calendar-outline" size={20} color={PRIMARY_COLOR} />
                    <View style={styles.detailItemContent}>
                      <Text style={styles.detailLabel}>Scheduled Time</Text>
                      <Text style={styles.detailValue}>
                        {formatDateTime(selectedGroup.scheduledTime || selectedGroup.startTime)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailItem}>
                    <Ionicons name="people-outline" size={20} color={PRIMARY_COLOR} />
                    <View style={styles.detailItemContent}>
                      <Text style={styles.detailLabel}>Members</Text>
                      <Text style={styles.detailValue}>
                        {Number(selectedGroup.currentMembers) || selectedGroup.memberCount || 0}/{selectedGroup.maxParticipants || selectedGroup.maxMembers}
                      </Text>
                    </View>
                  </View>

                  {selectedGroup.isRecurring && (
                    <View style={styles.detailItem}>
                      <Ionicons name="repeat-outline" size={20} color={PRIMARY_COLOR} />
                      <View style={styles.detailItemContent}>
                        <Text style={styles.detailLabel}>Recurrence</Text>
                        <Text style={styles.detailValue}>
                          {selectedGroup.frequency} - {selectedGroup.daysOfWeek?.map(day => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]).join(', ')}
                        </Text>
                      </View>
                    </View>
                  )}

                  {selectedGroup.conferenceUrl && (
                    <View style={styles.detailItem}>
                      <Ionicons name="videocam-outline" size={20} color={PRIMARY_COLOR} />
                      <View style={styles.detailItemContent}>
                        <Text style={styles.detailLabel}>Conference Link</Text>
                        <Text style={styles.detailValue} numberOfLines={1}>
                          {selectedGroup.conferenceUrl}
                        </Text>
                      </View>
                    </View>
                  )}

                  <View style={styles.detailItem}>
                    <Ionicons name="time-outline" size={20} color={PRIMARY_COLOR} />
                    <View style={styles.detailItemContent}>
                      <Text style={styles.detailLabel}>Created</Text>
                      <Text style={styles.detailValue}>
                        {selectedGroup.createdAt ? formatDateTime(selectedGroup.createdAt) : 'Unknown'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

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
    borderBottomColor: '#E0E0E0',
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
  content: {
    flex: 1,
    padding: isTablet ? 24 : 16,
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
  createButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  createButtonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: BLACK,
    marginBottom: 16,
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
  groupHeaderTouchable: {
    // No additional styles needed
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
  groupActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  manageButton: {
    backgroundColor: PRIMARY_COLOR,
  },
  actionButtonText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  joinRequestsSection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: LIGHT_GRAY,
    paddingTop: 16,
  },
  expandButton: {
    backgroundColor: LIGHT_PURPLE,
    borderRadius: 8,
    padding: 12,
  },
  expandButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expandButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PRIMARY_COLOR,
    flex: 1,
    marginLeft: 8,
  },
  joinRequestsList: {
    marginTop: 12,
  },
  emptyRequestsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyRequestsText: {
    fontSize: 14,
    color: DARK_GRAY,
    fontStyle: 'italic',
  },
  requestItem: {
    backgroundColor: SOFT_GRAY,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: OFF_WHITE,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: BLACK,
  },
  deleteButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  detailCard: {
    backgroundColor: WHITE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: BLACK,
    marginBottom: 8,
  },
  detailDescription: {
    fontSize: 16,
    color: DARK_GRAY,
    marginBottom: 16,
    lineHeight: 22,
  },
  detailInfo: {
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK_GRAY,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: BLACK,
  },
  requestCard: {
    backgroundColor: WHITE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  requestUser: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
  requestUserInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
    color: BLACK,
  },
  requestEmail: {
    fontSize: 14,
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
    marginBottom: 12,
    paddingLeft: 4,
  },
  requestInfo: {
    marginBottom: 12,
  },
  requestDate: {
    fontSize: 12,
    color: DARK_GRAY,
    marginBottom: 4,
  },
  requestActions: {
    flexDirection: isSmallScreen ? 'column' : 'row',
    gap: isSmallScreen ? 8 : 12,
  },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: SUCCESS_COLOR,
  },
  rejectButton: {
    backgroundColor: SECONDARY_COLOR,
  },
  requestButtonText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});
