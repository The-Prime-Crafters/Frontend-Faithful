import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    StyleSheet,
    View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface GlobalLoaderProps {
  visible: boolean;
  text?: string;
}

const PRIMARY_COLOR = '#7b4d62';
const SECONDARY_COLOR = '#ce703f';
const WHITE = '#FFFFFF';

export default function GlobalLoader({ visible, text = 'Loading...' }: GlobalLoaderProps) {
  const bookOpenAnimation = useRef(new Animated.Value(0)).current;
  const bookScaleAnimation = useRef(new Animated.Value(1)).current;
  const pageFlipAnimation = useRef(new Animated.Value(0)).current;
  const textOpacityAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      startAnimation();
    } else {
      resetAnimation();
    }
  }, [visible]);

  const startAnimation = () => {
    // Reset all animations
    bookOpenAnimation.setValue(0);
    bookScaleAnimation.setValue(1);
    pageFlipAnimation.setValue(0);
    textOpacityAnimation.setValue(0);

    // Create the book opening and closing sequence
    Animated.sequence([
      // Book opening
      Animated.timing(bookOpenAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      // Page flipping
      Animated.timing(pageFlipAnimation, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      // Text fade in
      Animated.timing(textOpacityAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // Hold for a moment
      Animated.delay(1000),
      // Page flip back
      Animated.timing(pageFlipAnimation, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      // Book closing
      Animated.timing(bookOpenAnimation, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      // Text fade out
      Animated.timing(textOpacityAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Loop the animation
      if (visible) {
        startAnimation();
      }
    });
  };

  const resetAnimation = () => {
    bookOpenAnimation.setValue(0);
    bookScaleAnimation.setValue(1);
    pageFlipAnimation.setValue(0);
    textOpacityAnimation.setValue(0);
  };

  // Book opening rotation (0 to 15 degrees)
  const bookRotation = bookOpenAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '15deg'],
  });

  // Page flip rotation (0 to 180 degrees)
  const pageRotation = pageFlipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  // Scale animation for breathing effect
  const scaleValue = bookScaleAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.1, 1],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Book Animation */}
          <View style={styles.bookContainer}>
            {/* Book Cover */}
            <Animated.View
              style={[
                styles.bookCover,
                {
                  transform: [
                    { rotateY: bookRotation },
                    { scale: scaleValue },
                  ],
                },
              ]}
            >
              <View style={styles.bookSpine} />
              <View style={styles.bookFront}>
                <Ionicons name="book" size={40} color={WHITE} />
              </View>
            </Animated.View>

            {/* Book Pages */}
            <Animated.View
              style={[
                styles.bookPages,
                {
                  transform: [
                    { rotateY: bookRotation },
                    { scale: scaleValue },
                  ],
                },
              ]}
            >
              {/* Page 1 */}
              <Animated.View
                style={[
                  styles.page,
                  styles.page1,
                  {
                    transform: [{ rotateY: pageRotation }],
                  },
                ]}
              >
                <View style={styles.pageContent}>
                  <View style={styles.textLine} />
                  <View style={[styles.textLine, styles.shortLine]} />
                  <View style={styles.textLine} />
                </View>
              </Animated.View>

              {/* Page 2 */}
              <Animated.View
                style={[
                  styles.page,
                  styles.page2,
                  {
                    transform: [{ rotateY: pageRotation }],
                  },
                ]}
              >
                <View style={styles.pageContent}>
                  <View style={styles.textLine} />
                  <View style={[styles.textLine, styles.shortLine]} />
                  <View style={styles.textLine} />
                </View>
              </Animated.View>
            </Animated.View>
          </View>

          {/* Loading Text */}
          <Animated.View
            style={[
              styles.textContainer,
              { opacity: textOpacityAnimation },
            ]}
          >
            <Animated.Text style={styles.loadingText}>
              {text}
            </Animated.Text>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookContainer: {
    width: 120,
    height: 80,
    position: 'relative',
    marginBottom: 30,
  },
  bookCover: {
    position: 'absolute',
    width: 120,
    height: 80,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  bookSpine: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 8,
    height: 80,
    backgroundColor: '#5a3a4a',
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  bookFront: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookPages: {
    position: 'absolute',
    width: 120,
    height: 80,
    backgroundColor: WHITE,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    zIndex: 2,
  },
  page: {
    position: 'absolute',
    width: 120,
    height: 80,
    backgroundColor: WHITE,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backfaceVisibility: 'hidden',
  },
  page1: {
    zIndex: 2,
  },
  page2: {
    zIndex: 1,
    transform: [{ rotateY: '180deg' }],
  },
  pageContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  textLine: {
    height: 2,
    backgroundColor: '#d0d0d0',
    marginVertical: 3,
    borderRadius: 1,
  },
  shortLine: {
    width: '60%',
  },
  textContainer: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: WHITE,
    fontFamily: 'serif',
    textAlign: 'center',
  },
});
