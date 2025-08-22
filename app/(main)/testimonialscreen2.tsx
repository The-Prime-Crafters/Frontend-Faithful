import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { height, width } = Dimensions.get('window');

const PRIMARY_COLOR = '#7b4d62';
const SECONDARY_COLOR = '#ce703f';
const WHITE = '#FFFFFF';

const testimonials = [
  {
    id: 1,
    text: 'This app helped me find peace during my darkest days. The daily verses feel like they were chosen just for me.',
    author: 'Michael T.',
    location: 'New York, USA',
    rating: 5,
  },
  {
    id: 2,
    text: "I've tried many devotionals but none speak to my soul like this one. The insights are profound yet simple.",
    author: 'Sarah K.',
    location: 'London, UK',
    rating: 4,
  },
  {
    id: 3,
    text: 'As a busy mom, I love the short but powerful messages. They keep me centered throughout my chaotic days.',
    author: 'Jessica L.',
    location: 'Toronto, Canada',
    rating: 5,
  },
];

export default function TestimonialScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      // Start exit animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Change to next testimonial
        setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
        
        // Reset animations and start enter animation
        slideAnim.setValue(50);
        
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, 3500); // Change every 3.5 seconds

    return () => clearInterval(interval);
  }, [fadeAnim, scaleAnim, slideAnim]);

  const currentTestimonial = testimonials[currentIndex];

  const renderStars = (rating) => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map(i => (
          <FontAwesome
            key={i}
            name="star"
            size={20}
            color={i <= rating ? '#FFD700' : 'rgba(255,255,255,0.3)'}
            style={{ marginRight: 3 }}
          />
        ))}
      </View>
    );
  };

  return (
    <LinearGradient
      colors={[PRIMARY_COLOR, SECONDARY_COLOR]}
      style={styles.container}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>What Our Users Say</Text>
        <Text style={styles.headerSubtitle}>Real testimonials from real people</Text>
      </View>

      {/* Testimonial Card */}
      <View style={styles.testimonialContainer}>
        <Animated.View
          style={[
            styles.testimonialCard,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: slideAnim },
              ],
            },
          ]}
        >
          {renderStars(currentTestimonial.rating)}
          
          <Text style={styles.testimonialText}>
            "{currentTestimonial.text}"
          </Text>

          <View style={styles.authorContainer}>
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{currentTestimonial.author}</Text>
              <Text style={styles.authorLocation}>{currentTestimonial.location}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Pagination Dots */}
        <View style={styles.pagination}>
          {testimonials.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: index === currentIndex 
                    ? WHITE 
                    : 'rgba(255,255,255,0.3)',
                  width: index === currentIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>
      </View>

      {/* Stats Section */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>10K+</Text>
          <Text style={styles.statLabel}>Users</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>4.8★</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>500K+</Text>
          <Text style={styles.statLabel}>Prayers</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.joinText}>Join Our Community</Text>
        <Text style={styles.subText}>Start your spiritual journey today</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/(main)/chatscreen')}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },

  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 40,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: WHITE,
    fontFamily: 'serif',
    marginBottom: 8,
    textAlign: 'center',
  },

  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'serif',
    textAlign: 'center',
  },

  testimonialContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  testimonialCard: {
    borderRadius: 14,
    padding: 30,
    marginHorizontal: 20,
    minHeight: height * 0.35,
    justifyContent: 'center',
    alignItems: 'center',

    elevation: 6,
    width: width - 40,
  },

  starsRow: {
    flexDirection: 'row',
    marginBottom: 20,
    justifyContent: 'center',
  },

  testimonialText: {
    color: WHITE,
    fontSize: 18,
    lineHeight: 28,
    fontFamily: 'serif',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 30,
  },

  authorContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 20,
    width: '100%',
  },

  authorInfo: {
    alignItems: 'center',
  },

  authorName: {
    color: WHITE,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'serif',
    marginBottom: 4,
  },

  authorLocation: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontFamily: 'serif',
  },

  pagination: {
    flexDirection: 'row',
    marginTop: 30,
    alignItems: 'center',
  },

  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    transition: 'all 0.3s ease',
  },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
    paddingVertical: 20,
    marginTop: 20,
  },

  statItem: {
    alignItems: 'center',
    flex: 1,
  },

  statNumber: {
    color: WHITE,
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'serif',
  },

  statLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontFamily: 'serif',
    marginTop: 4,
  },

  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  footer: {
    padding: 24,
    alignItems: 'center',
  },

  joinText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: WHITE,
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'serif',
  },

  subText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'serif',
    lineHeight: 22,
  },

  button: {
    backgroundColor: WHITE,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  buttonText: {
    color: PRIMARY_COLOR,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'serif',
  },
});