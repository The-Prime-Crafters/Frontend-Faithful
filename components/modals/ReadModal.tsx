import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const { width, height } = Dimensions.get('window');
const PRIMARY_COLOR = '#7b4d62';
const SECONDARY_COLOR = '#ce703f';
const WHITE = '#FFFFFF';

interface ReadModalProps {
  visible: boolean;
  title: string;
  content: string;
  onClose: () => void;
}

const ReadModal: React.FC<ReadModalProps> = ({ visible, title, content, onClose }) => {
  if (!visible) return null;
  
  return (
    <Modal 
      visible={visible} 
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={[PRIMARY_COLOR, SECONDARY_COLOR]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.titleContainer}>
                <Ionicons name="book-outline" size={24} color={WHITE} style={styles.headerIcon} />
                <Text style={styles.title}>{title || 'Reading'}</Text>
              </View>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={28} color={WHITE} />
              </Pressable>
            </View>

            {/* Content */}
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={true}
            >
              <Text style={styles.content}>{content || 'No content available'}</Text>
            </ScrollView>

            {/* Close Button */}
            <Pressable 
              style={({ pressed }) => [
                styles.bottomButton,
                pressed && styles.bottomButtonPressed
              ]}
              onPress={onClose}
            >
              <Text style={styles.bottomButtonText}>Close</Text>
            </Pressable>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 9999,
  },
  modalContainer: {
    width: width * 0.9,
    height: height * 0.75,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    backgroundColor: PRIMARY_COLOR,
  },
  gradient: {
    flex: 1,
    paddingBottom: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    marginRight: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: WHITE,
    fontFamily: 'serif',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },
  content: {
    fontSize: 16,
    color: WHITE,
    lineHeight: 26,
    fontFamily: 'serif',
  },
  bottomButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  bottomButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  bottomButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: WHITE,
    fontFamily: 'serif',
  },
});

export default ReadModal;
