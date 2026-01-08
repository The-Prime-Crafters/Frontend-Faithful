import { API_ENDPOINTS } from '@/constants/API';
import AppSessionTracker from '@/utils/appSessionTracker';
import NotificationService from '@/utils/notifications';
import { queryOpenAI } from '@/utils/openai';
import { safeJsonParse } from '@/utils/safeJson';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  journeyDay?: number;
}

interface JourneyDay {
  day: number;
  theme: string;
  focus: string;
  scripturePrompt: string;
  reflectionPrompts: string[];
  completed: boolean;
}

interface UserProfile {
  bibleVersion: string;
  denomination: string;
  ageGroup: string;
  name: string;
}

const JOURNEY_DAYS: Omit<JourneyDay, 'completed'>[] = [
  {
    day: 1,
    theme: "Welcome & Foundation",
    focus: "Understanding God's Love",
    scripturePrompt: "God's unwavering love for you",
    reflectionPrompts: [
      "What does God's love mean to you?",
      "How have you experienced God's presence?",
      "What brought you to faith?"
    ]
  },
  {
    day: 2,
    theme: "Prayer & Communication",
    focus: "Building Your Prayer Life",
    scripturePrompt: "The power of prayer and talking with God",
    reflectionPrompts: [
      "How do you currently pray?",
      "What would you like to talk to God about?",
      "When do you feel closest to God?"
    ]
  },
  {
    day: 3,
    theme: "Scripture & Truth",
    focus: "Discovering God's Word",
    scripturePrompt: "How the Bible guides our lives",
    reflectionPrompts: [
      "What's your favorite Bible verse?",
      "How do you approach reading Scripture?",
      "What questions do you have about the Bible?"
    ]
  },
  {
    day: 4,
    theme: "Faith in Action",
    focus: "Living Out Your Beliefs",
    scripturePrompt: "Faith demonstrated through our daily lives",
    reflectionPrompts: [
      "How does your faith influence your choices?",
      "What spiritual practices are meaningful to you?",
      "Where do you see God working in your life?"
    ]
  },
  {
    day: 5,
    theme: "Community & Fellowship",
    focus: "Walking Together in Faith",
    scripturePrompt: "The importance of Christian community",
    reflectionPrompts: [
      "How do you connect with other believers?",
      "What role does church community play in your life?",
      "How can you encourage others in their faith?"
    ]
  },
  {
    day: 6,
    theme: "Challenges & Growth",
    focus: "Strengthening Through Trials",
    scripturePrompt: "Growing through life's difficulties",
    reflectionPrompts: [
      "What challenges are you facing right now?",
      "How has your faith helped you through hard times?",
      "What spiritual lessons have you learned?"
    ]
  },
  {
    day: 7,
    theme: "Purpose & Mission",
    focus: "Living Your Calling",
    scripturePrompt: "Discovering God's purpose for your life",
    reflectionPrompts: [
      "What do you feel called to do?",
      "How can you serve others with your gifts?",
      "What's your next step in your faith journey?"
    ]
  }
];

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentJourneyDay, setCurrentJourneyDay] = useState<number>(1);
  const [journeyProgress, setJourneyProgress] = useState<JourneyDay[]>([]);
  const [journeyIteration, setJourneyIteration] = useState<number>(1); // Track journey cycles
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  // Tab bar is hidden, so we just need to respect safe area
  // Reduced buffer to maximize chat space
  const inputPaddingBottom = isKeyboardVisible ? 10 : Math.max(10, insets.bottom + 2);

  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  // Load user profile and journey progress on mount
  useEffect(() => {
    loadUserProfile();
    loadJourneyProgress();
    loadJourneyIteration();
  }, []);

  // Reload profile when screen comes into focus (e.g., after Bible version change)
  useFocusEffect(
    useCallback(() => {
      loadUserProfile();
    }, [])
  );

  // Load messages when day changes
  useEffect(() => {
    if (userProfile && currentJourneyDay) {
      loadMessagesForDay(currentJourneyDay);
    }
  }, [currentJourneyDay, userProfile]);

  const loadUserProfile = async () => {
    try {
      // 1. Try to load from local cache first to avoid API rate limits
      const cachedData = await SecureStore.getItemAsync('userData');
      if (cachedData) {
        try {
          const userData = safeJsonParse(cachedData, null);
          if (userData) {
            const profile: UserProfile = {
              bibleVersion: userData.bibleVersion || userData.bible_version || 'NIV',
              denomination: userData.denomination || 'Christian',
              ageGroup: userData.ageGroup || userData.age_group || '',
              name: userData.name || 'friend'
            };
            console.log('✅ Chat - Loaded profile from cache (skipping API)');
            setUserProfile(profile);
            setLoadingProfile(false);
            return;
          }
        } catch (e) {
          console.log('⚠️ Chat - Cache parse error, falling back to API');
        }
      }

      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        console.log('❌ Chat - No auth token found');
        setLoadingProfile(false);
        return;
      }

      console.log('🔄 Chat - Fetching user profile...');
      const response = await fetch(API_ENDPOINTS.USERS_PROFILE, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📊 Chat - Profile response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('📦 Chat - Profile API response:', JSON.stringify(result, null, 2));

        // Handle different API response structures
        // API returns: { success: true, user: { bible_version: "BBE", ... } }
        const userData = result.user || result.data || result;

        const profile: UserProfile = {
          bibleVersion: userData.bible_version || userData.bibleVersion || 'NIV',
          denomination: userData.denomination || 'Christian',
          ageGroup: userData.age_group || userData.ageGroup || '',
          name: userData.name || 'friend'
        };

        console.log('✅ Chat - Loaded user profile:', profile);
        console.log('📖 Chat - Bible version is now:', profile.bibleVersion);
        setUserProfile(profile);
      } else {
        console.error('❌ Chat - Profile API returned error:', response.status);
        throw new Error(`Profile API returned ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Chat - Error loading profile:', error);

      // Try to load from cached userData as fallback
      try {
        const userDataString = await SecureStore.getItemAsync('userData');
        if (userDataString) {
          const userData = safeJsonParse(userDataString, null);
          if (userData) {
            const profile: UserProfile = {
              bibleVersion: userData.bibleVersion || userData.bible_version || 'NIV',
              denomination: userData.denomination || 'Christian',
              ageGroup: userData.ageGroup || userData.age_group || '',
              name: userData.name || 'friend'
            };
            console.log('✅ Chat - Loaded profile from cached userData:', profile);
            setUserProfile(profile);
            return;
          }
        }
      } catch (cacheError) {
        console.error('❌ Chat - Error loading cached userData:', cacheError);
      }

      // Final fallback to default profile
      console.log('⚠️ Chat - Using default profile');
      setUserProfile({
        bibleVersion: 'NIV',
        denomination: 'Christian',
        ageGroup: '',
        name: 'friend'
      });
    } finally {
      setLoadingProfile(false);
    }
  };

  const loadJourneyProgress = async () => {
    try {
      const stored = await SecureStore.getItemAsync('journeyProgress');
      if (stored) {
        const progress = safeJsonParse(stored, []);
        setJourneyProgress(progress);

        // Find current day (first incomplete day)
        const currentDay = progress.find((day: JourneyDay) => !day.completed);
        if (currentDay) {
          setCurrentJourneyDay(currentDay.day);
        } else {
          // All days complete, stay on day 7
          setCurrentJourneyDay(7);
        }
      } else {
        // Initialize journey
        const initialProgress = JOURNEY_DAYS.map(day => ({ ...day, completed: false }));
        setJourneyProgress(initialProgress);
        await SecureStore.setItemAsync('journeyProgress', JSON.stringify(initialProgress));
      }
    } catch (error) {
      // Initialize with default
      const initialProgress = JOURNEY_DAYS.map(day => ({ ...day, completed: false }));
      setJourneyProgress(initialProgress);
    }
  };

  const loadJourneyIteration = async () => {
    try {
      const stored = await SecureStore.getItemAsync('journeyIteration');
      if (stored) {
        setJourneyIteration(parseInt(stored));
      }
    } catch (error) {
      // Default to iteration 1
    }
  };

  const loadMessagesForDay = async (day: number) => {
    try {
      const storageKey = `journey_${journeyIteration}_day_${day}_messages`;
      const stored = await SecureStore.getItemAsync(storageKey);

      if (stored) {
        const storedMessages = safeJsonParse(stored, []);
        // Convert timestamp strings back to Date objects
        const messagesWithDates = storedMessages.map((msg: any) => ({
          ...msg,
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
        }));
        setMessages(messagesWithDates);
      } else {
        // No messages for this day yet, initialize with welcome message
        initializeWelcomeMessage(day);
      }
    } catch (error) {
      // If error loading, initialize with welcome message
      initializeWelcomeMessage(day);
    }
  };

  const saveMessagesForDay = async (day: number, messagesToSave: Message[]) => {
    try {
      const storageKey = `journey_${journeyIteration}_day_${day}_messages`;
      await SecureStore.setItemAsync(storageKey, JSON.stringify(messagesToSave));
    } catch (error) {
      // Silently handle save errors
    }
  };

  const initializeWelcomeMessage = (dayNumber?: number) => {
    const targetDay = dayNumber || currentJourneyDay;
    const currentDay = journeyProgress.find(day => day.day === targetDay);

    // Create different welcome messages for different journey iterations
    const getIterationGreeting = () => {
      if (journeyIteration === 1) {
        return "I'm here to journey with you";
      } else if (journeyIteration === 2) {
        return "Welcome back! Let's deepen our journey together";
      } else {
        return `Continuing our journey together (Journey ${journeyIteration})`;
      }
    };

    const welcomeText = currentDay
      ? `${journeyIteration > 1 ? '🔄 ' : ''}Welcome ${journeyIteration > 1 ? 'back ' : ''}to Day ${currentDay.day}: ${currentDay.theme}! 

${journeyIteration > 1 ? `This time, let's explore "${currentDay.focus}" from a fresh perspective.` : `Today's focus is "${currentDay.focus}".`}

${getIterationGreeting()}, using your preferred ${userProfile?.bibleVersion} Bible translation. 

${journeyIteration > 1 ? `Reflecting on your previous journey, ${currentDay.reflectionPrompts[0].toLowerCase()}` : currentDay.reflectionPrompts[0]}`
      : `Hello ${userProfile?.name}! I'm your faithful companion for this 7-day spiritual journey. 

I'll be using the ${userProfile?.bibleVersion} Bible translation in our conversations, tailored to your ${userProfile?.denomination} background.

Let's begin this journey together. What's on your heart today?`;

    const welcomeMessage: Message = {
      id: Date.now().toString(),
      text: welcomeText,
      isUser: false,
      timestamp: new Date(),
      journeyDay: targetDay
    };

    setMessages([welcomeMessage]);
    saveMessagesForDay(targetDay, [welcomeMessage]);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || !userProfile) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date(),
      journeyDay: currentJourneyDay
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Track AI chat activity
    const sessionTracker = AppSessionTracker.getInstance();
    sessionTracker.trackActivity('ai_chat', 5, {
      messageLength: text.trim().length,
      journeyDay: currentJourneyDay,
    });

    try {
      const currentDay = journeyProgress.find(day => day.day === currentJourneyDay);

      // Create conversation context from recent messages
      const recentMessages = messages.slice(-6); // Last 6 messages for context
      const conversationContext = recentMessages.map(msg =>
        `${msg.isUser ? 'User' : 'Companion'}: ${msg.text}`
      ).join('\n');

      // Create an enhanced, journey-aware prompt
      const enhancedPrompt = `You are a wise, compassionate Christian spiritual companion guiding someone through their 7-day faith journey.

CONTEXT:
- User's Name: ${userProfile.name}
- Bible Version: ${userProfile.bibleVersion} (ALWAYS reference Scripture from this translation)
- Denomination: ${userProfile.denomination}
- Age Group: ${userProfile.ageGroup}
- Journey Iteration: ${journeyIteration === 1 ? 'First time' : `Journey #${journeyIteration} (returning)`}
- Current Journey: Day ${currentJourneyDay}/7 - "${currentDay?.theme}"
- Today's Focus: "${currentDay?.focus}"
- Scripture Theme: ${currentDay?.scripturePrompt}
${journeyIteration > 1 ? '\n- Note: This user has completed this journey before. Offer deeper insights and build on previous reflection.' : ''}

CONVERSATION HISTORY:
${conversationContext}

USER'S LATEST MESSAGE: "${text}"

RESPOND WITH THESE GUIDELINES:
1. Keep responses brief and conversational (2-4 sentences)
2. Reference Scripture from ${userProfile.bibleVersion} Bible when relevant
3. Connect your response to today's theme: "${currentDay?.theme}"
4. Be warm, encouraging, and deeply empathetic
5. Ask thoughtful follow-up questions that deepen reflection
6. Acknowledge their denomination's perspective (${userProfile.denomination})
7. Use age-appropriate language and examples
8. If they share struggles, validate feelings before offering guidance
9. Weave in relevant theological insights naturally
10. Guide them toward spiritual growth without being preachy

TONE: Conversational friend who deeply understands Christian faith, speaks with gentle wisdom, and truly listens.

Remember: This is an intimate spiritual conversation, not a sermon. Be present, genuine, and supportive.`;

      const response = await queryOpenAI(enhancedPrompt);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
        journeyDay: currentJourneyDay
      };

      const updatedMessages = [...messages, userMessage, aiMessage];
      setMessages(updatedMessages);

      // Save messages to local storage
      await saveMessagesForDay(currentJourneyDay, updatedMessages);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble connecting right now. Let's try again in a moment. Your journey is important to me.",
        isUser: false,
        timestamp: new Date()
      };
      const updatedMessages = [...messages, userMessage, errorMessage];
      setMessages(updatedMessages);

      // Save even error messages
      await saveMessagesForDay(currentJourneyDay, updatedMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    sendMessage(inputText);
  };

  const handleSuggestedQuestion = (question: string) => {
    sendMessage(question);
  };

  const completeDay = async () => {
    const updatedProgress = journeyProgress.map(day =>
      day.day === currentJourneyDay ? { ...day, completed: true } : day
    );
    setJourneyProgress(updatedProgress);
    await SecureStore.setItemAsync('journeyProgress', JSON.stringify(updatedProgress));

    // Send day completion notification
    await NotificationService.scheduleDayCompletionNotification(currentJourneyDay);

    if (currentJourneyDay < 7) {
      // Schedule reminder for next day
      await NotificationService.scheduleJourneyReminderNotification(currentJourneyDay + 1);

      Alert.alert(
        'Day Complete! 🎉',
        `You've completed Day ${currentJourneyDay}! Ready to move to Day ${currentJourneyDay + 1}?`,
        [
          { text: 'Not Yet', style: 'cancel' },
          {
            text: 'Continue Journey',
            onPress: async () => {
              // Save current day messages
              await saveMessagesForDay(currentJourneyDay, messages);

              const nextDay = currentJourneyDay + 1;
              setCurrentJourneyDay(nextDay);
              // Messages will be loaded by the useEffect
            }
          }
        ]
      );
    } else {
      Alert.alert(
        'Journey Complete! 🙏',
        'You\'ve completed all 7 days! You can restart the journey or continue our conversation.',
        [
          { text: 'Keep Chatting', style: 'cancel' },
          {
            text: 'Start Fresh Journey',
            onPress: async () => {
              // Increment journey iteration for a fresh experience
              const newIteration = journeyIteration + 1;
              setJourneyIteration(newIteration);
              await SecureStore.setItemAsync('journeyIteration', newIteration.toString());

              // Reset progress for new journey
              const resetProgress = JOURNEY_DAYS.map(day => ({ ...day, completed: false }));
              setJourneyProgress(resetProgress);
              await SecureStore.setItemAsync('journeyProgress', JSON.stringify(resetProgress));

              // Start at day 1
              setCurrentJourneyDay(1);
              // Messages will be loaded by the useEffect with new iteration
            }
          }
        ]
      );
    }
  };

  const isDayAccessible = (day: number): boolean => {
    // Day 1 is always accessible
    if (day === 1) return true;

    // Check if previous day is completed
    const previousDay = journeyProgress.find(d => d.day === day - 1);
    return previousDay?.completed || false;
  };

  const navigateToDay = (day: number) => {
    if (day < 1 || day > 7) return;

    // Check if user can access this day
    if (!isDayAccessible(day)) {
      Alert.alert(
        'Day Locked 🔒',
        `Please complete Day ${day - 1} first before accessing Day ${day}.`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Save current day's messages before switching
    if (messages.length > 0) {
      saveMessagesForDay(currentJourneyDay, messages);
    }

    setCurrentJourneyDay(day);
    // Messages will be loaded by the useEffect
  };

  const getSuggestedQuestions = () => {
    const currentDay = journeyProgress.find(day => day.day === currentJourneyDay);
    return currentDay?.reflectionPrompts || [
      "What's on your heart today?",
      "How can I pray for you?",
      "What questions do you have about faith?"
    ];
  };

  useEffect(() => {
    // Scroll to bottom when new messages are added
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  if (loadingProfile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingScreen}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={styles.loadingScreenText}>Preparing your journey...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentDay = journeyProgress.find(day => day.day === currentJourneyDay);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header with Journey Day */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/')} style={{ marginRight: 12 }}>
            <Ionicons name="arrow-back" size={24} color={DARK_GRAY} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Your Companion</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.bibleVersion}>{userProfile?.bibleVersion}</Text>
            <Ionicons name="chatbubbles" size={28} color={DARK_GRAY} />
          </View>
        </View>

        {/* Journey Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            {[1, 2, 3, 4, 5, 6, 7].map((day) => {
              const isAccessible = isDayAccessible(day);
              const isCompleted = journeyProgress.find(d => d.day === day)?.completed;
              const isActive = day === currentJourneyDay;

              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.progressDot,
                    isActive && styles.progressDotActive,
                    isCompleted && styles.progressDotCompleted,
                    !isAccessible && styles.progressDotLocked
                  ]}
                  onPress={() => navigateToDay(day)}
                  disabled={!isAccessible}
                >
                  {!isAccessible ? (
                    <Ionicons name="lock-closed" size={16} color="rgba(255,255,255,0.5)" />
                  ) : (
                    <Text style={[
                      styles.progressDotText,
                      isActive && styles.progressDotTextActive,
                      isCompleted && styles.progressDotTextCompleted
                    ]}>
                      {day}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                message.isUser ? styles.userMessage : styles.aiMessage
              ]}
            >
              <LinearGradient
                colors={message.isUser
                  ? [PRIMARY_COLOR, PRIMARY_COLOR] // Solid color for user
                  : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
                }
                style={[
                  styles.messageBubble,
                  message.isUser && { borderWidth: 0 } // Remove border for user messages
                ]}
              >
                <Text style={[
                  styles.messageText,
                  message.isUser ? styles.userMessageText : styles.aiMessageText
                ]}>
                  {message.text}
                </Text>
                <Text style={[
                  styles.timestamp,
                  message.isUser ? styles.userTimestamp : styles.aiTimestamp
                ]}>
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </LinearGradient>
            </View>
          ))}

          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={PRIMARY_COLOR} />
              <Text style={styles.loadingText}>Thinking...</Text>
            </View>
          )}
        </ScrollView>

        {/* Suggested Questions and Actions */}
        <View style={styles.suggestedQuestionsContainer}>
          {messages.length <= 2 && (
            <>
              <Text style={styles.suggestedTitle}>Reflection prompts for today:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestedScroll}>
                {getSuggestedQuestions().map((question, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestedQuestion}
                    onPress={() => handleSuggestedQuestion(question)}
                  >
                    <Text style={styles.suggestedQuestionText}>{question}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          {messages.length > 2 && !journeyProgress.find(d => d.day === currentJourneyDay)?.completed && (
            <TouchableOpacity
              style={styles.completeDayButton}
              onPress={completeDay}
            >
              <Ionicons name="checkmark-circle" size={20} color={WHITE} />
              <Text style={styles.completeDayText}>Complete Day {currentJourneyDay}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Input */}
        <View style={[styles.inputContainer, { paddingBottom: inputPaddingBottom }]}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Share what's on your heart..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !inputText.trim() && styles.sendButtonDisabled
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
          >
            <Ionicons
              name="send"
              size={20}
              color={inputText.trim() ? WHITE : 'rgba(255,255,255,0.3)'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingScreenText: {
    marginTop: 12,
    fontSize: 16,
    color: DARK_GRAY,
    fontFamily: 'serif',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: STATUS_BAR_OFFSET,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: SOFT_GRAY,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    color: DARK_GRAY,
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: 'serif',
  },
  headerSubtitle: {
    color: PRIMARY_COLOR,
    fontSize: 14,
    fontFamily: 'serif',
    marginTop: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bibleVersion: {
    color: SECONDARY_COLOR,
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: LIGHT_ORANGE,
    borderRadius: 8,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: SOFT_GRAY,
  },
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: SOFT_GRAY,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: SOFT_GRAY,
  },
  progressDotActive: {
    backgroundColor: PRIMARY_COLOR,
    borderColor: PRIMARY_COLOR,
  },
  progressDotCompleted: {
    backgroundColor: SECONDARY_COLOR,
    borderColor: SECONDARY_COLOR,
  },
  progressDotLocked: {
    backgroundColor: 'rgba(200,200,200,0.5)',
    borderColor: 'rgba(200,200,200,0.5)',
    opacity: 0.5,
  },
  progressDotText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: DARK_GRAY,
  },
  progressDotTextActive: {
    color: WHITE,
  },
  progressDotTextCompleted: {
    color: WHITE,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  aiMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: SOFT_GRAY,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'serif',
  },
  userMessageText: {
    color: WHITE,
    fontWeight: '500',
  },
  aiMessageText: {
    color: DARK_GRAY,
  },
  timestamp: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 8,
    fontFamily: 'serif',
  },
  userTimestamp: {
    color: 'rgba(255,255,255,0.7)',
  },
  aiTimestamp: {
    color: '#6c757d',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: SOFT_GRAY,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  loadingText: {
    color: DARK_GRAY,
    marginLeft: 8,
    fontSize: 14,
    fontFamily: 'serif',
  },
  suggestedQuestionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: SOFT_GRAY,
    minHeight: 60,
  },
  suggestedTitle: {
    color: DARK_GRAY,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'serif',
    marginBottom: 10,
  },
  suggestedScroll: {
    maxHeight: 50,
  },
  suggestedQuestion: {
    backgroundColor: LIGHT_PURPLE,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#d4c4b7',
  },
  suggestedQuestionText: {
    color: DARK_GRAY,
    fontSize: 13,
    fontFamily: 'serif',
  },
  completeDayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SECONDARY_COLOR,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    gap: 8,
  },
  completeDayText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'serif',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: SOFT_GRAY,
  },
  textInput: {
    flex: 1,
    backgroundColor: WHITE,
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    color: DARK_GRAY,
    fontSize: 16,
    fontFamily: 'serif',
    maxHeight: 100,
    borderWidth: 1,
    borderColor: SOFT_GRAY,
  },
  sendButton: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 25,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  sendButtonDisabled: {
    backgroundColor: LIGHT_PURPLE,
  },
}); 