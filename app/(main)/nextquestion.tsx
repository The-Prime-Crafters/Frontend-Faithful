import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

const PRIMARY_COLOR = '#7b4d62';
const SECONDARY_COLOR = '#ce703f';
const WHITE = '#FFFFFF';

export default function NextQuestionScreen() {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const handleContinue = () => {
    // Navigate to main app (tabs) after onboarding
    router.replace('/(tabs)');
  };

  return (
    <LinearGradient
      colors={[PRIMARY_COLOR, '#8b5a73', SECONDARY_COLOR]}
      style={styles.container}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
      {/* Progress Bar - increased to 50% */}

      <View style={styles.content}>
        <Text style={styles.question}>How often do you read the Bible?</Text>
        <Text style={styles.subText}>This helps us recommend relevant content</Text>

        <View style={styles.optionsContainer}>
          {['Daily', 'Weekly', 'Monthly', 'Rarely'].map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionCard,
                { width: '48%' },
                selectedOption === index && styles.selectedOptionCard
              ]}
              onPress={() => setSelectedOption(index)}
            >
              <Text style={styles.optionTitle}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.button,
            !selectedOption && styles.disabledButton
          ]}
          onPress={handleContinue}
          disabled={!selectedOption}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 20,
    },
    progressContainer: {
      width: '100%',
      height: 6,
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: 3,
      marginTop: 40,
      marginBottom: 30,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      backgroundColor: WHITE,
      borderRadius: 3,
    },
    content: {
      flex: 1,
    },
    question: {
      fontSize: 24,
      fontWeight: 'bold',
      color: WHITE,
      fontFamily: 'serif',
      marginBottom: 10,
      textAlign: 'center',
    },
    subText: {
      fontSize: 16,
      color: 'rgba(255,255,255,0.8)',
      fontFamily: 'serif',
      textAlign: 'center',
      marginBottom: 30,
    },
    optionsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    optionCard: {
      width: '48%',
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: 12,
      padding: 20,
      marginBottom: 15,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    selectedOptionCard: {
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderColor: WHITE,
    },
    optionTitle: {
      color: WHITE,
      fontSize: 18,
      fontWeight: 'bold',
      fontFamily: 'serif',
      marginBottom: 5,
    },
    optionDescription: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: 14,
      fontFamily: 'serif',
    },
    footer: {
      paddingBottom: 30,
    },
    button: {
      backgroundColor: WHITE,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    disabledButton: {
      opacity: 0.5,
    },
    buttonText: {
      color: PRIMARY_COLOR,
      fontSize: 18,
      fontWeight: 'bold',
      fontFamily: 'serif',
    },
  });