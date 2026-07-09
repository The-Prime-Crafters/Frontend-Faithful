import { AntDesign } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

const PRIMARY_COLOR = '#7b4d62'; // Purple
const SECONDARY_COLOR = '#ce703f'; // Orange
const WHITE = '#FFFFFF';

interface SuccessModalProps {
  visible: boolean;
  title: string;
  message: string;
  onClose?: () => void;
  autoCloseDuration?: number;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  visible,
  title,
  message,
  onClose,
  autoCloseDuration = 2000,
}) => {
  // Use useRef to persist animated values across renders
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto close after duration
      if (autoCloseDuration > 0) {
        const timer = setTimeout(() => {
          handleClose();
        }, autoCloseDuration);

        return () => clearTimeout(timer);
      }
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onClose) onClose();
    });
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            styles.modalWrapper,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={[PRIMARY_COLOR, SECONDARY_COLOR]}
            style={styles.modalContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Success Icon with pulse animation */}
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <AntDesign name="check-circle" size={64} color={WHITE} />
              </View>
            </View>

            {/* Title */}
            <Text style={styles.title}>{title}</Text>

            {/* Message */}
            <Text style={styles.message}>{message}</Text>

            {/* Decorative elements */}
            <View style={styles.sparklesContainer}>
              <AntDesign name="star" size={16} color="rgba(255,255,255,0.6)" style={styles.sparkle1} />
              <AntDesign name="star" size={12} color="rgba(255,255,255,0.4)" style={styles.sparkle2} />
              <AntDesign name="star" size={14} color="rgba(255,255,255,0.5)" style={styles.sparkle3} />
            </View>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalWrapper: {
    width: width * 0.85,
  },
  modalContainer: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconCircle: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 50,
    padding: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: WHITE,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    lineHeight: 24,
  },
  sparklesContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  sparkle1: {
    position: 'absolute',
    top: 30,
    right: 40,
  },
  sparkle2: {
    position: 'absolute',
    top: 50,
    left: 35,
  },
  sparkle3: {
    position: 'absolute',
    bottom: 40,
    right: 50,
  },
});

export default SuccessModal;

