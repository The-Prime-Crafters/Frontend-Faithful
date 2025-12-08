import { AVPlaybackStatus, ResizeMode, Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';

const { width, height } = Dimensions.get('window');

const PRIMARY_COLOR = '#7b4d62';
const SECONDARY_COLOR = '#ce703f';

export default function SplashScreen() {
  const router = useRouter();
  const videoRef = useRef<Video>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isVideoFinished, setIsVideoFinished] = useState(false);

  useEffect(() => {
    // Navigate to main app after video finishes or timeout
    const timer = setTimeout(() => {
      navigateToMain();
    }, 5000); // 5 second timeout as fallback

    return () => clearTimeout(timer);
  }, []);

  const navigateToMain = () => {
    router.replace('/onboarding');
  };

  const handleVideoLoad = () => {
    setIsVideoLoaded(true);
  };

  const handleVideoEnd = () => {
    setIsVideoFinished(true);
    navigateToMain();
  };

  const handleVideoError = (error: any) => {
    console.log('Video error:', error);
    // If video fails to load, navigate to main app after a short delay
    setTimeout(() => {
      navigateToMain();
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[PRIMARY_COLOR, SECONDARY_COLOR]}
        style={styles.gradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }} showsVerticalScrollIndicator={false}>
        {/* Video Player */}
        <Video
          ref={videoRef}
          source={require('../assets/videos/splash-video.mp4')}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          shouldPlay={true}
          isLooping={false}
          isMuted={true}
          onLoad={handleVideoLoad}
          onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
            if (status.isLoaded && status.didJustFinish) {
              handleVideoEnd();
            }
          }}
          onError={handleVideoError}
        />
        {/* Fallback content if video doesn't load */}
        {!isVideoLoaded && (
          <View style={[styles.fallbackContainer, { width: '100%', alignItems: 'center' }]}> {/* Responsive fallback */}
            <Text style={styles.fallbackText}>Faithful Companion</Text>
            <Text style={styles.fallbackSubtext}>Loading...</Text>
          </View>
        )}
        {/* Loading indicator */}
        <View style={styles.loadingContainer}>
          <View style={styles.loadingDot} />
          <View style={styles.loadingDot} />
          <View style={styles.loadingDot} />
        </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  fallbackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'serif',
    textAlign: 'center',
    marginBottom: 10,
  },
  fallbackSubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'serif',
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 100,
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 4,
    opacity: 0.6,
  },
}); 