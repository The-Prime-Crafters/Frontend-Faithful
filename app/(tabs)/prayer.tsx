import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
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
const LIGHT_PURPLE = '#e3d5ca';
const LIGHT_ORANGE = '#f4e4d6';

const STATUS_BAR_OFFSET = Platform.OS === 'android'
  ? (StatusBar.currentHeight ?? 24) + 10
  : 10;

const prayerCategories = [
  { id: '1', title: 'Morning Prayer', icon: 'sunny', description: 'Start your day with gratitude' },
  { id: '2', title: 'Evening Prayer', icon: 'moon', description: 'Reflect on your day' },
  { id: '3', title: 'Thanksgiving', icon: 'heart', description: 'Express gratitude' },
  { id: '4', title: 'Intercession', icon: 'people', description: 'Pray for others' },
  { id: '5', title: 'Confession', icon: 'refresh', description: 'Seek forgiveness' },
  { id: '6', title: 'Meditation', icon: 'leaf', description: 'Quiet reflection' },
];

export default function PrayerScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Prayer</Text>
          <Ionicons name="hand-left" size={30} color={WHITE} />
        </View>

        {/* Quick Prayer */}
        <LinearGradient
          colors={[PRIMARY_COLOR, SECONDARY_COLOR]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.quickPrayerCard}
        >
          <Text style={styles.cardTitle}>Today's Prayer</Text>
          <Text style={styles.prayerText}>
            "Lord, thank you for this new day. Help me to walk in your ways 
            and be a light to those around me. Guide my thoughts, words, and actions. Amen."
          </Text>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="play" size={20} color={PRIMARY_COLOR} />
              <Text style={styles.actionText}>Listen</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="heart" size={20} color={PRIMARY_COLOR} />
              <Text style={styles.actionText}>Save</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Prayer Categories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Prayer Categories</Text>
          <View style={styles.categoriesGrid}>
            {prayerCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  selectedCategory === category.id && styles.selectedCategory
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Ionicons 
                  name={category.icon as any} 
                  size={32} 
                  color={selectedCategory === category.id ? PRIMARY_COLOR : WHITE} 
                />
                <Text style={[
                  styles.categoryTitle,
                  selectedCategory === category.id && styles.selectedCategoryText
                ]}>
                  {category.title}
                </Text>
                <Text style={[
                  styles.categoryDescription,
                  selectedCategory === category.id && styles.selectedCategoryText
                ]}>
                  {category.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Prayer Timer */}
        <View style={styles.timerSection}>
          <Text style={styles.sectionTitle}>Prayer Timer</Text>
          <LinearGradient
            colors={['rgba(123, 77, 98, 0.3)', 'rgba(206, 112, 63, 0.3)']}
            style={styles.timerCard}
          >
            <View style={styles.timerDisplay}>
              <Text style={styles.timerText}>05:00</Text>
              <Text style={styles.timerLabel}>minutes</Text>
            </View>
            <View style={styles.timerControls}>
              <TouchableOpacity style={styles.timerButton}>
                <Ionicons name="play" size={24} color={WHITE} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.timerButton}>
                <Ionicons name="pause" size={24} color={WHITE} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.timerButton}>
                <Ionicons name="refresh" size={24} color={WHITE} />
              </TouchableOpacity>
            </View>
          </LinearGradient>
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
  headerTitle: {
    color: DARK_GRAY,
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'serif',
  },
  quickPrayerCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: SOFT_GRAY,
  },
  cardTitle: {
    color: WHITE,
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'serif',
    marginBottom: 16,
  },
  prayerText: {
    color: WHITE,
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'serif',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  actionText: {
    color: PRIMARY_COLOR,
    marginLeft: 8,
    fontWeight: 'bold',
    fontFamily: 'serif',
    fontSize: 14,
  },
  categoriesSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: DARK_GRAY,
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'serif',
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    backgroundColor: LIGHT_PURPLE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d4c4b7',
  },
  selectedCategory: {
    backgroundColor: LIGHT_ORANGE,
    borderColor: PRIMARY_COLOR,
  },
  categoryTitle: {
    color: DARK_GRAY,
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'serif',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  categoryDescription: {
    color: '#6c757d',
    fontSize: 12,
    fontFamily: 'serif',
    textAlign: 'center',
  },
  selectedCategoryText: {
    color: PRIMARY_COLOR,
  },
  timerSection: {
    marginBottom: 30,
  },
  timerCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: SOFT_GRAY,
  },
  timerDisplay: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timerText: {
    color: DARK_GRAY,
    fontSize: 48,
    fontWeight: 'bold',
    fontFamily: 'serif',
  },
  timerLabel: {
    color: '#6c757d',
    fontSize: 16,
    fontFamily: 'serif',
  },
  timerControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  timerButton: {
    backgroundColor: LIGHT_PURPLE,
    borderRadius: 25,
    padding: 12,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 