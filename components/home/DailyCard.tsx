import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';

const { width } = Dimensions.get('window');
const PRIMARY_COLOR = '#7b4d62';
const SECONDARY_COLOR = '#ce703f';
const WHITE = '#FFFFFF';

interface DailyCardProps {
  title: string;
  description: string;
  content: string;
  onPress?: () => void;
  onRead?: () => void;
  onListen?: () => void;
}

const DailyCard: React.FC<DailyCardProps> = ({ title, description, content, onPress, onRead, onListen }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getCardIcon = () => {
    if (title.includes('Verse')) return 'book';
    if (title.includes('Prayer')) return 'heart';
    if (title.includes('Reflection')) return 'bulb';
    return 'star';
  };

  const getGradientColors = () => {
    if (title.includes('Verse')) return ['#7b4d62', '#9a6180'];
    if (title.includes('Prayer')) return ['#ce703f', '#e89060'];
    if (title.includes('Reflection')) return ['#5a4d7b', '#7a6198'];
    return ['#7b4d62', '#ce703f'];
  };

  return (
    <View style={styles.cardContainer}>
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        {/* Card Header - Pressable */}
        <Pressable
          onPress={() => setIsExpanded(!isExpanded)}
          style={({ pressed }) => [
            styles.cardHeader,
            pressed && styles.cardHeaderPressed
          ]}
        >
          <View style={styles.cardTitleRow}>
            <View style={styles.iconCircle}>
              <Ionicons name={getCardIcon() as any} size={24} color={WHITE} />
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.cardTitle}>{title}</Text>
              <Text style={styles.cardDescription}>{description}</Text>
            </View>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={WHITE}
          />
        </Pressable>

        {/* Expanded Content */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            <View style={styles.divider} />
            <Text style={styles.contentText}>{content}</Text>
            
            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <Pressable 
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && styles.actionButtonPressed
                ]}
                onPress={onRead}
              >
                <Ionicons name="book-outline" size={18} color={WHITE} />
                <Text style={styles.actionButtonText}>Read</Text>
              </Pressable>
              <Pressable 
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && styles.actionButtonPressed
                ]}
                onPress={onListen}
              >
                <Ionicons name="volume-high-outline" size={18} color={WHITE} />
                <Text style={styles.actionButtonText}>Listen</Text>
              </Pressable>
            </View>
          </View>
        )}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  cardGradient: {
    borderRadius: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  cardHeaderPressed: {
    opacity: 0.8,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  titleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: WHITE,
    marginBottom: 4,
    fontFamily: 'serif',
  },
  cardDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    fontFamily: 'serif',
  },
  expandedContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 16,
  },
  contentText: {
    fontSize: 15,
    color: WHITE,
    lineHeight: 24,
    marginBottom: 20,
    fontFamily: 'serif',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  actionButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    transform: [{ scale: 0.98 }],
  },
  actionButtonText: {
    color: WHITE,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'serif',
  },
});

export default DailyCard;
