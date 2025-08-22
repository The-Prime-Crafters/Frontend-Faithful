import { Ionicons } from '@expo/vector-icons';
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
  title: string;
  participants: number;
  topic: string;
  nextSession: string;
  isActive: boolean;
  conferenceUrl?: string;
  isConferenceActive: boolean;
  createdAt: string;
}

// Initial study groups data
const initialStudyGroups: StudyGroup[] = [
  {
    id: '1',
    title: 'Gospel of John Study',
    participants: 8,
    topic: 'Understanding God\'s Love',
    nextSession: 'Today, 7:00 PM',
    isActive: true,
    conferenceUrl: 'https://meet.google.com/abc-defg-hij',
    isConferenceActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Psalms & Wisdom',
    participants: 12,
    topic: 'Finding Peace in Difficult Times',
    nextSession: 'Tomorrow, 6:30 PM',
    isActive: true,
    conferenceUrl: 'https://meet.google.com/xyz-uvwq-rst',
    isConferenceActive: false,
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    title: 'Epistles of Paul',
    participants: 6,
    topic: 'Grace and Faith',
    nextSession: 'Wednesday, 8:00 PM',
    isActive: false,
    conferenceUrl: 'https://meet.google.com/mno-pqrs-tuv',
    isConferenceActive: false,
    createdAt: new Date().toISOString()
  }
];

// Function to generate random meet link
const generateMeetLink = (): string => {
  const generateRandomCode = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < 3; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };
  
  return `https://meet.google.com/${generateRandomCode()}-${generateRandomCode()}-${generateRandomCode()}`;
};

export default function ReadingScreen() {
  const [showStudyModal, setShowStudyModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
  const [newGroupTitle, setNewGroupTitle] = useState('');
  const [newGroupTopic, setNewGroupTopic] = useState('');
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // Load study groups from SecureStore on component mount
  useEffect(() => {
    loadStudyGroups();
  }, []);

  const loadStudyGroups = async () => {
    try {
      const storedGroups = await SecureStore.getItemAsync('studyGroups');
      if (storedGroups) {
        setStudyGroups(JSON.parse(storedGroups));
      } else {
        await SecureStore.setItemAsync('studyGroups', JSON.stringify(initialStudyGroups));
        setStudyGroups(initialStudyGroups);
      }
    } catch (error) {
      console.error('Error loading study groups:', error);
      setStudyGroups(initialStudyGroups);
    } finally {
      setLoading(false);
    }
  };

  const saveStudyGroups = async (groups: StudyGroup[]) => {
    try {
      await SecureStore.setItemAsync('studyGroups', JSON.stringify(groups));
    } catch (error) {
      console.error('Error saving study groups:', error);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupTitle.trim() || !newGroupTopic.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const newGroup: StudyGroup = {
      id: Date.now().toString(),
      title: newGroupTitle.trim(),
      participants: 1, // Creator is the first participant
      topic: newGroupTopic.trim(),
      nextSession: 'TBD',
      isActive: true,
      conferenceUrl: generateMeetLink(),
      isConferenceActive: true, // New groups have active conferences
      createdAt: new Date().toISOString()
    };

    const updatedGroups = [newGroup, ...studyGroups];
    setStudyGroups(updatedGroups);
    await saveStudyGroups(updatedGroups);

    // Reset form and close modal
    setShowCreateModal(false);
    setNewGroupTitle('');
    setNewGroupTopic('');

    Alert.alert(
      'Success', 
      `Study group "${newGroup.title}" created successfully!\nMeet Link: ${newGroup.conferenceUrl}`
    );
  };

  const handleJoinGroup = (group: StudyGroup) => {
    setSelectedGroup(group);
    setShowStudyModal(true);
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

  const handleToggleConference = async (groupId: string) => {
    const updatedGroups = studyGroups.map(group => 
      group.id === groupId 
        ? { ...group, isConferenceActive: !group.isConferenceActive }
        : group
    );
    
    setStudyGroups(updatedGroups);
    await saveStudyGroups(updatedGroups);
    
    // Update selected group if it's currently displayed
    if (selectedGroup && selectedGroup.id === groupId) {
      const updatedSelectedGroup = updatedGroups.find(g => g.id === groupId);
      setSelectedGroup(updatedSelectedGroup || null);
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Bible Study</Text>
          <Ionicons name="people" size={30} color={DARK_GRAY} />
        </View>

        {/* Welcome Section */}
        <LinearGradient
          colors={[PRIMARY_COLOR, SECONDARY_COLOR]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.welcomeCard}
        >
          <Text style={styles.welcomeTitle}>Join a Study Group</Text>
          <Text style={styles.welcomeSubtitle}>
            Connect with others in meaningful Bible study discussions guided by AI
          </Text>
        </LinearGradient>

        {/* Bible Study Section */}
        <View style={styles.studySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available Groups ({studyGroups.length})</Text>
          </View>
          <TouchableOpacity 
            style={[styles.createButton, { width: '100%', justifyContent: 'center', marginBottom: 16, alignSelf: 'center' }]} 
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={20} color={WHITE} />
            <Text style={styles.createButtonText}>Create Group</Text>
          </TouchableOpacity>

          {/* Study Groups List */}
          <View style={[styles.groupsContainer, { flexDirection: 'column' }]}> 
            {studyGroups.map((group, idx) => (
              <TouchableOpacity
                key={group.id}
                style={[styles.groupCard, { width: '100%', marginBottom: idx === studyGroups.length - 1 ? 0 : 12 }]}
                onPress={() => handleJoinGroup(group)}
              >
                <View style={styles.groupHeader}>
                  <Text style={styles.groupTitle}>{group.title}</Text>
                  <View style={[
                    styles.statusIndicator,
                    { backgroundColor: group.isActive ? '#28a745' : '#6c757d' }
                  ]}>
                    <Text style={styles.statusText}>
                      {group.isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.groupTopic}>{group.topic}</Text>
                <View style={styles.groupDetails}>
                  <View style={styles.detailItem}>
                    <Ionicons name="people" size={16} color={DARK_GRAY} />
                    <Text style={styles.detailText}>{group.participants} members</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="time" size={16} color={DARK_GRAY} />
                    <Text style={styles.detailText}>{group.nextSession}</Text>
                  </View>
                </View>
                
                {/* Conference Status */}
                <View style={styles.conferenceSection}>
                  <View style={styles.conferenceStatus}>
                    <Ionicons 
                      name="videocam" 
                      size={16} 
                      color={group.isConferenceActive ? '#28a745' : '#6c757d'} 
                    />
                    <Text style={[
                      styles.conferenceStatusText,
                      { color: group.isConferenceActive ? '#28a745' : '#6c757d' }
                    ]}>
                      {group.isConferenceActive ? 'Conference Active' : 'Conference Inactive'}
                    </Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={[
                      styles.joinButton,
                      group.isConferenceActive ? styles.joinButtonActive : styles.joinButtonInactive
                    ]}
                    onPress={() => {
                      if (group.isConferenceActive && group.conferenceUrl) {
                        handleJoinConference(group.conferenceUrl);
                      }
                    }}
                    disabled={!group.isConferenceActive}
                  >
                    <Ionicons 
                      name="videocam" 
                      size={16} 
                      color={group.isConferenceActive ? WHITE : '#6c757d'} 
                    />
                    <Text style={[
                      styles.joinButtonText,
                      { color: group.isConferenceActive ? WHITE : '#6c757d' }
                    ]}>
                      Join Conference
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Create Study Group Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Study Group</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Group Title (e.g., Gospel of Matthew Study)"
              value={newGroupTitle}
              onChangeText={setNewGroupTitle}
              placeholderTextColor="#6c757d"
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Study Topic/Theme (e.g., Understanding Jesus' Parables)"
              value={newGroupTopic}
              onChangeText={setNewGroupTopic}
              placeholderTextColor="#6c757d"
              multiline
              numberOfLines={3}
            />

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color={PRIMARY_COLOR} />
              <Text style={styles.infoText}>
                A Google Meet link will be automatically generated for your group
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.createGroupButton]}
                onPress={handleCreateGroup}
              >
                <Text style={styles.createGroupButtonText}>Create Group</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Study Group Session Modal */}
      <Modal
        visible={showStudyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowStudyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sessionModalContent}>
            <View style={styles.sessionHeader}>
              <Text style={styles.sessionTitle}>
                {selectedGroup?.title || 'Study Session'}
              </Text>
              <TouchableOpacity onPress={() => setShowStudyModal(false)}>
                <Ionicons name="close" size={24} color={DARK_GRAY} />
              </TouchableOpacity>
            </View>

            <View style={styles.aiModerator}>
              <LinearGradient
                colors={[PRIMARY_COLOR, SECONDARY_COLOR]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.aiModeratorCard}
              >
                <Ionicons name="bulb" size={24} color={WHITE} />
                <Text style={styles.aiModeratorText}>
                  AI Moderator: "Welcome to our study session! Today we're exploring {selectedGroup?.topic || 'God\'s love'}. 
                  Let's begin with prayer and then dive into our discussion."
                </Text>
              </LinearGradient>
            </View>

            <View style={styles.conferenceInfo}>
              <Text style={styles.conferenceInfoTitle}>Conference Details:</Text>
              <Text style={styles.conferenceInfoText}>
                Link: {selectedGroup?.conferenceUrl || 'Not available'}
              </Text>
              <Text style={styles.conferenceInfoText}>
                Status: {selectedGroup?.isConferenceActive ? 'Active' : 'Inactive'}
              </Text>
            </View>

            <View style={styles.sessionActions}>
              <TouchableOpacity 
                style={[
                  styles.sessionButton,
                  selectedGroup?.isConferenceActive ? styles.sessionButtonActive : styles.sessionButtonInactive
                ]}
                onPress={() => {
                  if (selectedGroup?.isConferenceActive && selectedGroup?.conferenceUrl) {
                    handleJoinConference(selectedGroup.conferenceUrl);
                  }
                }}
                disabled={!selectedGroup?.isConferenceActive}
              >
                <Ionicons 
                  name="videocam" 
                  size={20} 
                  color={selectedGroup?.isConferenceActive ? WHITE : '#6c757d'} 
                />
                <Text style={[
                  styles.sessionButtonText,
                  { color: selectedGroup?.isConferenceActive ? WHITE : '#6c757d' }
                ]}>
                  Join Google Meet
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.sessionButton}>
                <Ionicons name="book" size={20} color={WHITE} />
                <Text style={styles.sessionButtonText}>Study Materials</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.sessionButton, styles.toggleButton]}
                onPress={() => {
                  if (selectedGroup) {
                    handleToggleConference(selectedGroup.id);
                  }
                }}
              >
                <Ionicons 
                  name={selectedGroup?.isConferenceActive ? "pause" : "play"} 
                  size={20} 
                  color={WHITE} 
                />
                <Text style={styles.sessionButtonText}>
                  {selectedGroup?.isConferenceActive ? 'End Conference' : 'Start Conference'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  studySection: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    color: DARK_GRAY,
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'serif',
  },
  groupsContainer: {
    marginBottom: 20,
  },
  groupCard: {
    backgroundColor: WHITE,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: SOFT_GRAY,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupTitle: {
    color: DARK_GRAY,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'serif',
    flex: 1,
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: WHITE,
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'serif',
  },
  groupTopic: {
    color: DARK_GRAY,
    fontSize: 16,
    fontFamily: 'serif',
    marginBottom: 16,
    lineHeight: 22,
  },
  groupDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    color: DARK_GRAY,
    fontSize: 14,
    fontFamily: 'serif',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: WHITE,
    padding: 24,
    borderRadius: 16,
    width: '85%',
    maxHeight: '80%',
  },
  modalTitle: {
    color: DARK_GRAY,
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'serif',
    marginBottom: 20,
  },
  input: {
    backgroundColor: OFF_WHITE,
    padding: 16,
    borderRadius: 8,
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LIGHT_PURPLE,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoText: {
    color: DARK_GRAY,
    fontSize: 14,
    fontFamily: 'serif',
    marginLeft: 8,
    flex: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
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
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'serif',
  },
  sessionModalContent: {
    backgroundColor: WHITE,
    padding: 24,
    borderRadius: 16,
    width: '85%',
    maxHeight: '80%',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sessionTitle: {
    color: DARK_GRAY,
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'serif',
    flex: 1,
  },
  aiModerator: {
    marginBottom: 24,
  },
  aiModeratorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    borderRadius: 12,
  },
  aiModeratorText: {
    color: WHITE,
    fontSize: 16,
    fontFamily: 'serif',
    marginLeft: 12,
    lineHeight: 22,
    flex: 1,
  },
  conferenceInfo: {
    backgroundColor: OFF_WHITE,
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  conferenceInfoTitle: {
    color: DARK_GRAY,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'serif',
    marginBottom: 8,
  },
  conferenceInfoText: {
    color: DARK_GRAY,
    fontSize: 14,
    fontFamily: 'serif',
    marginBottom: 4,
  },
  sessionActions: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  sessionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    marginBottom: 8,
  },
  sessionButtonText: {
    color: WHITE,
    marginLeft: 8,
    fontWeight: 'bold',
    fontFamily: 'serif',
    fontSize: 14,
  },
  toggleButton: {
    backgroundColor: SECONDARY_COLOR,
  },
  conferenceSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: SOFT_GRAY,
  },
  conferenceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  conferenceStatusText: {
    fontSize: 14,
    fontFamily: 'serif',
    marginLeft: 6,
    fontWeight: '500',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  joinButtonActive: {
    backgroundColor: PRIMARY_COLOR,
    borderColor: PRIMARY_COLOR,
  },
  joinButtonInactive: {
    backgroundColor: SOFT_GRAY,
    borderColor: SOFT_GRAY,
  },
  joinButtonText: {
    fontSize: 14,
    fontFamily: 'serif',
    fontWeight: 'bold',
    marginLeft: 6,
  },
  sessionButtonActive: {
    backgroundColor: PRIMARY_COLOR,
  },
  sessionButtonInactive: {
    backgroundColor: SOFT_GRAY,
  },
});