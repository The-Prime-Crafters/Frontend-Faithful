import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
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

const STATUS_BAR_OFFSET = Platform.OS === 'android'
  ? (StatusBar.currentHeight ?? 24) + 10
  : 10;

const SUPPORT_EMAIL = 'support@faithfulcompanion.ai';
const SUPPORT_WEBSITE = 'https://faithfulcompanion.ai';

export default function HelpSupportScreen() {
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const handleEmailSupport = () => {
    const subject = encodeURIComponent('Support Request - Faithful Companion App');
    const body = encodeURIComponent('Please describe your issue or question:\n\n');

    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`)
      .catch(() => {
        Alert.alert(
          'Email Support',
          `Please send your support request to:\n\n${SUPPORT_EMAIL}`,
          [
            {
              text: 'Copy Email',
              onPress: () => {
                // You would use Clipboard API here if needed
                Alert.alert('Email', SUPPORT_EMAIL);
              }
            },
            { text: 'OK' }
          ]
        );
      });
  };

  const handleVisitWebsite = () => {
    Linking.openURL(SUPPORT_WEBSITE).catch(() => {
      Alert.alert('Error', 'Unable to open website');
    });
  };

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const faqItems = [
    {
      id: '1',
      question: 'How do I update my profile information?',
      answer: 'Go to your Profile tab, tap on "Account Settings", and you can update your personal information, denomination, Bible version, and other preferences.'
    },
    {
      id: '2',
      question: 'How does the prayer request system work?',
      answer: 'You can create prayer requests from the Prayer tab. Choose to make them public or private, and other users can respond with prayers, encouragement, or testimonies. You can also view and respond to others\' prayer requests.'
    },
    {
      id: '3',
      question: 'What is the streak system?',
      answer: 'The streak system tracks your daily engagement with the app. Complete activities like reading the Bible, praying, or reflecting to maintain your streak. You also get streak freezes to protect your progress if you miss a day.'
    },
    {
      id: '4',
      question: 'How do I change my Bible version?',
      answer: 'Go to Profile > Account Settings, and select your preferred Bible version from the available options. This will update all Bible readings throughout the app.'
    },
    {
      id: '5',
      question: 'Can I delete my prayer requests?',
      answer: 'Yes, you can manage your prayer requests from the Prayer tab by selecting "My Prayers". From there, you can view, edit, or delete your requests.'
    },
    {
      id: '6',
      question: 'How do I report a problem or bug?',
      answer: `If you encounter any technical issues, please contact us at ${SUPPORT_EMAIL} with a description of the problem and any relevant screenshots.`
    }
  ];

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={PRIMARY_COLOR} />

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with Back Button */}
          <View style={styles.headerContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <View style={styles.backIconContainer}>
                <Ionicons
                  name="arrow-back"
                  size={24}
                  color={PRIMARY_COLOR}
                />
              </View>
            </TouchableOpacity>

            <View style={styles.header}>
              <Text style={styles.headerTitle}>Help & Support</Text>
              <Text style={styles.headerSubtitle}>
                Get help and find answers to your questions
              </Text>
            </View>
          </View>
          {/* Contact Support Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Us</Text>

            <TouchableOpacity
              style={styles.contactCard}
              onPress={handleEmailSupport}
            >
              <View style={styles.contactIconContainer}>
                <Ionicons name="mail" size={24} color={PRIMARY_COLOR} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>Email Support</Text>
                <Text style={styles.contactSubtitle}>{SUPPORT_EMAIL}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={DARK_GRAY} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactCard}
              onPress={handleVisitWebsite}
            >
              <View style={styles.contactIconContainer}>
                <Ionicons name="globe" size={24} color={PRIMARY_COLOR} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>Visit Our Website</Text>
                <Text style={styles.contactSubtitle}>{SUPPORT_WEBSITE}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={DARK_GRAY} />
            </TouchableOpacity>
          </View>

          {/* FAQ Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

            {faqItems.map((faq) => (
              <View key={faq.id} style={styles.faqItem}>
                <TouchableOpacity
                  style={styles.faqQuestion}
                  onPress={() => toggleFAQ(faq.id)}
                >
                  <Text style={styles.faqQuestionText}>{faq.question}</Text>
                  <Ionicons
                    name={expandedFAQ === faq.id ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={PRIMARY_COLOR}
                  />
                </TouchableOpacity>
                {expandedFAQ === faq.id && (
                  <View style={styles.faqAnswer}>
                    <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* App Info Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App Information</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Version</Text>
                <Text style={styles.infoValue}>1.0.0</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Platform</Text>
                <Text style={styles.infoValue}>{Platform.OS === 'ios' ? 'iOS' : 'Android'}</Text>
              </View>
            </View>
          </View>

          {/* Help Message */}
          <View style={styles.helpMessage}>
            <Ionicons name="information-circle" size={24} color={PRIMARY_COLOR} />
            <Text style={styles.helpMessageText}>
              We're here to help! If you have any questions or need assistance,
              please don't hesitate to reach out to our support team.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: OFF_WHITE,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  headerContainer: {
    marginTop: STATUS_BAR_OFFSET,
    marginBottom: 20,
  },
  backButton: {
    marginBottom: 20,
  },
  backIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: SOFT_GRAY,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    marginTop: 10,
  },
  headerTitle: {
    color: DARK_GRAY,
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'serif',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: '#6c757d',
    fontSize: 16,
    fontFamily: 'serif',
    opacity: 0.8,
  },
  section: {
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
    marginBottom: 15,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  contactIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${PRIMARY_COLOR}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: BLACK,
    marginBottom: 4,
  },
  contactSubtitle: {
    fontSize: 14,
    color: DARK_GRAY,
  },
  faqItem: {
    backgroundColor: WHITE,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: BLACK,
    marginRight: 12,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: SOFT_GRAY,
  },
  faqAnswerText: {
    fontSize: 14,
    color: DARK_GRAY,
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: WHITE,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: SOFT_GRAY,
  },
  infoLabel: {
    fontSize: 15,
    color: DARK_GRAY,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: BLACK,
  },
  helpMessage: {
    flexDirection: 'row',
    backgroundColor: `${PRIMARY_COLOR}10`,
    borderRadius: 12,
    padding: 16,
    marginVertical: 20,
    alignItems: 'flex-start',
  },
  helpMessageText: {
    flex: 1,
    fontSize: 14,
    color: DARK_GRAY,
    lineHeight: 20,
    marginLeft: 12,
  },
});

