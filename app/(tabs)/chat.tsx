import { queryGemini } from '@/utils/gemini';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
}

const suggestedQuestions = [
  "Tell me about your spiritual journey",
  "What's on your heart today?",
  "How can I pray for you?",
  "What questions do you have about faith?",
  "Share something you're grateful for",
  "What's challenging your faith right now?"
];

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your faithful companion. I'm here to help you explore the Bible, discuss Christian faith, and answer your spiritual questions. What would you like to know today?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Create conversation context from recent messages
      const recentMessages = messages.slice(-4); // Last 4 messages for context
      const conversationContext = recentMessages.map(msg => 
        `${msg.isUser ? 'User' : 'AI'}: ${msg.text}`
      ).join('\n');

      // Create a Christian-focused prompt for the AI
      const christianPrompt = `You are a faithful Christian companion having a spiritual conversation. 

Previous conversation:
${conversationContext}

User just said: "${text}"

Respond as a caring spiritual friend with these guidelines:
- Keep responses SHORT and conversational (2-3 sentences max)
- Show you understand the ongoing conversation
- Ask brief follow-up questions to continue the dialogue
- Be warm and encouraging
- Reference Scripture briefly if relevant
- Focus on listening and supporting their journey

Keep it natural and brief - this is a chat, not a sermon.`;

      const response = await queryGemini(christianPrompt);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
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

  useEffect(() => {
    // Scroll to bottom when new messages are added
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Faithful Companion</Text>
          <Ionicons name="chatbubbles" size={30} color={WHITE} />
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
                  ? [SECONDARY_COLOR, PRIMARY_COLOR]
                  : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
                }
                style={styles.messageBubble}
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

        {/* Suggested Questions */}
        {messages.length === 1 && (
          <View style={styles.suggestedQuestionsContainer}>
            <Text style={styles.suggestedTitle}>Try asking:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {suggestedQuestions.map((question, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestedQuestion}
                  onPress={() => handleSuggestedQuestion(question)}
                >
                  <Text style={styles.suggestedQuestionText}>{question}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: STATUS_BAR_OFFSET,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: SOFT_GRAY,
  },
  headerTitle: {
    color: DARK_GRAY,
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'serif',
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
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: SOFT_GRAY,
  },
  suggestedTitle: {
    color: DARK_GRAY,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'serif',
    marginBottom: 12,
  },
  suggestedQuestion: {
    backgroundColor: LIGHT_PURPLE,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#d4c4b7',
  },
  suggestedQuestionText: {
    color: DARK_GRAY,
    fontSize: 14,
    fontFamily: 'serif',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
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