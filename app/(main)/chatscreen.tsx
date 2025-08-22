import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

const PRIMARY_COLOR = '#7b4d62'; // Purple
const SECONDARY_COLOR = '#ce703f'; // Orange
const GLASS_COLOR = 'rgba(255, 255, 255, 0.1)';

const messages = [
  {
    id: '1',
    sender: 'user',
    text: 'What does the Bible say about finding peace in difficult times?',
    time: '10:30 AM'
  },
  {
    id: '2',
    sender: 'app',
    text: '"Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid." - John 14:27. The Bible encourages us to find peace in God\'s promises during trials.',
    time: '10:32 AM'
  }
];

const ChatScreen = () => {
  const router = useRouter();

  return (
    <LinearGradient
      colors={[PRIMARY_COLOR, '#8b5a73', SECONDARY_COLOR]}
      style={styles.container}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <View style={{ flex: 1 }}>
        <ScrollView 
          contentContainerStyle={styles.chatContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.messagesWrapper}>
            {messages.map((message) => (
              <View 
                key={message.id} 
                style={[
                  styles.messageBubble,
                  message.sender === 'user' ? styles.userBubble : styles.appBubble
                ]}
              >
                <LinearGradient
                  colors={message.sender === 'user' 
                    ? [SECONDARY_COLOR, '#e38b5a'] 
                    : [PRIMARY_COLOR, '#8d526b']}
                  style={styles.glassMessage}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.messageText}>{message.text}</Text>
                  <Text style={styles.timeText}>{message.time}</Text>
                </LinearGradient>
                {/* Message tail */}
                <View style={[
                  styles.messageTail,
                  message.sender === 'user' 
                    ? styles.userMessageTail 
                    : styles.appMessageTail
                ]} />
              </View>
            ))}
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <Text style={styles.heading}>Deeper Spiritual Conversations</Text>
          <Text style={styles.subheading}>Continue your journey with more meaningful discussions</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/(main)/denomination')}
          >
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.buttonText}>Continue</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
  },
  chatContainer: {
    flexGrow: 1,
    paddingBottom: 20,
    paddingHorizontal: 10,
  },
  messagesWrapper: {
    paddingTop: 18,
  },
  messageBubble: {
    marginBottom: 24,
    maxWidth: '85%',
    minWidth: '20%',
    position: 'relative',
  },
  userBubble: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  appBubble: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  glassMessage: {
    borderRadius: 18,
    padding: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  messageTail: {
    position: 'absolute',
    width: 16,
    height: 16,
    bottom: -4,
    transform: [{ rotate: '45deg' }],
    borderRadius: 4,
    zIndex: -1,
  },
  userMessageTail: {
    right: -6,
    backgroundColor: '#e38b5a',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  appMessageTail: {
    left: -6,
    backgroundColor: '#8d526b',
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  messageText: {
    fontSize: 16,
    color: '#FFF',
    lineHeight: 22,
    fontFamily: 'serif',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  timeText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
    fontFamily: 'serif',
    alignSelf: 'flex-end',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    fontFamily: 'serif',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subheading: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'serif',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    borderRadius: 28,
    overflow: 'hidden',
    marginVertical: 10,
    width: '100%',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: PRIMARY_COLOR,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'serif',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});

export default ChatScreen;