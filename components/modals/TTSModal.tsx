import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const { width, height } = Dimensions.get('window');
const PRIMARY_COLOR = '#7b4d62';
const SECONDARY_COLOR = '#ce703f';
const WHITE = '#FFFFFF';

interface TTSModalProps {
  visible: boolean;
  title: string;
  content: string;
  onClose: () => void;
  isPlaying?: boolean;
  isPaused?: boolean;
  progress?: number;
  onTogglePlayPause?: () => void;
  onStop?: () => void;
}

const TTSModal: React.FC<TTSModalProps> = ({ 
  visible, 
  title, 
  content, 
  onClose,
  isPlaying = false,
  isPaused = false,
  progress = 0,
  onTogglePlayPause,
  onStop
}) => {
  if (!visible) return null;
  
  // Normalize progress to 0-1 range (in case it's passed as 0-100)
  const normalizedProgress = progress > 1 ? progress / 100 : progress;
  
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
                <Ionicons name="volume-high" size={24} color={WHITE} style={styles.headerIcon} />
                <Text style={styles.title}>{title || 'Listening'}</Text>
              </View>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={28} color={WHITE} />
              </Pressable>
            </View>

            {/* Progress Bar */}
            {normalizedProgress > 0 && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${normalizedProgress * 100}%` }]} />
                </View>
                <Text style={styles.progressText}>{Math.round(normalizedProgress * 100)}%</Text>
              </View>
            )}

            {/* TTS Controls */}
            <View style={styles.controlsContainer}>
              <Text style={styles.statusText}>
                {isPlaying && !isPaused ? '🎵 Playing...' : isPaused ? '⏸️ Paused' : '⏹️ Stopped'}
              </Text>
              
              <View style={styles.controls}>
                {onTogglePlayPause && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.controlButton,
                      styles.playPauseButton,
                      pressed && styles.controlButtonPressed
                    ]}
                    onPress={onTogglePlayPause}
                  >
                    <Ionicons 
                      name={isPlaying && !isPaused ? 'pause' : 'play'} 
                      size={32} 
                      color={WHITE} 
                    />
                  </Pressable>
                )}
                
                {onStop && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.controlButton,
                      styles.stopButton,
                      pressed && styles.controlButtonPressed
                    ]}
                    onPress={onStop}
                  >
                    <Ionicons name="stop" size={24} color={WHITE} />
                  </Pressable>
                )}
              </View>
            </View>

            {/* Content Preview */}
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={true}
            >
              <Text style={styles.contentLabel}>Reading:</Text>
              <Text style={styles.content}>{content || 'No content available'}</Text>
            </ScrollView>
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
    height: height * 0.7,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: WHITE,
    fontFamily: 'serif',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  progressContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: WHITE,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: WHITE,
    textAlign: 'center',
    fontFamily: 'serif',
  },
  controlsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    color: WHITE,
    marginBottom: 20,
    fontWeight: '600',
    fontFamily: 'serif',
  },
  controls: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'center',
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  playPauseButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  stopButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  controlButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    transform: [{ scale: 0.95 }],
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 10,
  },
  contentLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 12,
    fontWeight: '600',
    fontFamily: 'serif',
  },
  content: {
    fontSize: 15,
    color: WHITE,
    lineHeight: 24,
    fontFamily: 'serif',
  },
});

export default TTSModal;
