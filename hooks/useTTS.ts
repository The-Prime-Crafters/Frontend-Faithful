import * as Speech from 'expo-speech';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useRef, useState } from 'react';

export interface TTSSettings {
  rate: number;
  pitch: number;
  voice?: string;
}

export interface TTSState {
  isPlaying: boolean;
  isPaused: boolean;
  currentText: string;
  progress: number;
  duration: number;
}

const DEFAULT_SETTINGS: TTSSettings = {
  rate: 0.8,
  pitch: 1.0,
};

export const useTTS = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [progress, setProgress] = useState(0);
  const [settings, setSettings] = useState<TTSSettings>(DEFAULT_SETTINGS);
  const [availableVoices, setAvailableVoices] = useState<Speech.Voice[]>([]);
  
  const speechIdRef = useRef<string | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pausePositionRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const totalPausedTimeRef = useRef<number>(0);

  // Load available voices on mount
  useEffect(() => {
    loadVoices();
    loadSavedVoicePreference();
  }, []);

  const loadSavedVoicePreference = async () => {
    try {
      // Try to load voice from SecureStore first (faster)
      const savedVoiceId = await SecureStore.getItemAsync('userVoiceId');
      if (savedVoiceId) {
        console.log('✅ Loaded saved voice from SecureStore:', savedVoiceId);
        setSettings(prev => ({ ...prev, voice: savedVoiceId }));
        return;
      }
      
      // Fallback: load from API
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        const response = await fetch('https://faithfulcompanion.ai/api/users/preferences', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const result = await response.json();
          const prefs = result.data || result.preferences;
          if (prefs?.voiceId) {
            console.log('✅ Loaded saved voice from API:', prefs.voiceId);
            setSettings(prev => ({ ...prev, voice: prefs.voiceId }));
            // Cache it for faster access next time
            await SecureStore.setItemAsync('userVoiceId', prefs.voiceId);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error loading voice preference:', error);
    }
  };

  const loadVoices = async () => {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      setAvailableVoices(voices);
    } catch (error) {
      // Silently handle errors
    }
  };

  const speak = async (text: string, options?: Partial<TTSSettings>, fromPosition: number = 0) => {
    try {
      // Stop any current speech
      if (isPlaying) {
        await stop();
      }

      setCurrentText(text);
      setIsPlaying(true);
      setIsPaused(false);
      
      // Reset timing references only if starting from beginning
      if (fromPosition === 0) {
        startTimeRef.current = Date.now();
        pausedTimeRef.current = 0;
        totalPausedTimeRef.current = 0;
        pausePositionRef.current = 0;
      } else {
        // When resuming, keep the existing timing but update start time
        startTimeRef.current = Date.now();
        pausePositionRef.current = fromPosition;
      }

      // Calculate text to speak based on position
      const textToSpeak = fromPosition > 0 ? text.substring(fromPosition) : text;
      const initialProgress = fromPosition > 0 ? (fromPosition / text.length) * 100 : 0;
      setProgress(initialProgress);

      const speechOptions: Speech.SpeechOptions = {
        rate: options?.rate ?? settings.rate,
        pitch: options?.pitch ?? settings.pitch,
        voice: options?.voice ?? settings.voice,
        onStart: () => {
          startProgressTracking();
        },
        onDone: () => {
          setIsPlaying(false);
          setIsPaused(false);
          setProgress(100);
          stopProgressTracking();
          // Reset position
          pausePositionRef.current = 0;
        },
        onStopped: () => {
          setIsPlaying(false);
          setIsPaused(false);
          stopProgressTracking();
        },
        onError: (error) => {
          setIsPlaying(false);
          setIsPaused(false);
          stopProgressTracking();
        },
      };

      await Speech.speak(textToSpeak, speechOptions);
      speechIdRef.current = 'speech_' + Date.now(); // Generate a unique ID
      
    } catch (error) {
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  const togglePlayPause = async () => {
    try {
      if (isPlaying && !isPaused) {
        // Pause: Calculate current position and stop
        const currentTime = Date.now();
        const elapsedTime = currentTime - startTimeRef.current - totalPausedTimeRef.current;
        
        // Estimate position based on speech rate and elapsed time
        const wordsPerMinute = 200 * settings.rate;
        const wordsPerSecond = wordsPerMinute / 60;
        const wordsRead = (elapsedTime / 1000) * wordsPerSecond;
        
        // Estimate character position (roughly 5 characters per word)
        const estimatedPosition = Math.min(
          pausePositionRef.current + (wordsRead * 5),
          currentText.length
        );
        
        pausePositionRef.current = Math.floor(estimatedPosition);
        pausedTimeRef.current = currentTime;
        
        // Stop current speech and mark as paused
        await Speech.stop();
        setIsPaused(true);
        stopProgressTracking();
        
      } else if (isPaused && currentText && currentText.length > 0) {
        // Resume: Continue from paused position
        const currentTime = Date.now();
        totalPausedTimeRef.current += currentTime - pausedTimeRef.current;
        
        setIsPaused(false);
        const resumePosition = pausePositionRef.current;
        await speak(currentText, undefined, resumePosition);
        
      } else if (!isPlaying && currentText && currentText.length > 0) {
        // Start: Begin new speech
        await speak(currentText);
      }
    } catch (error) {
      // Silently handle errors
    }
  };

  const stop = async () => {
    try {
      if (isPlaying) {
        await Speech.stop();
        setIsPlaying(false);
        setIsPaused(false);
        setProgress(0);
        setCurrentText('');
        stopProgressTracking();
        
        // Reset all position tracking
        pausePositionRef.current = 0;
        startTimeRef.current = 0;
        pausedTimeRef.current = 0;
        totalPausedTimeRef.current = 0;
      }
    } catch (error) {
      // Silently handle errors
    }
  };

  const startProgressTracking = () => {
    stopProgressTracking(); // Clear any existing interval
    
    // Calculate remaining text length
    const remainingText = currentText.substring(pausePositionRef.current);
    const estimatedDuration = Math.max(remainingText.length / (settings.rate * 10), 5); // Minimum 5 seconds
    const updateInterval = 100; // Update every 100ms
    const incrementPerUpdate = (100 / (estimatedDuration * 10)); // Spread over estimated duration
    
    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        const newProgress = Math.min(prev + incrementPerUpdate, 95);
        return newProgress;
      });
    }, updateInterval);
  };

  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const updateSettings = (newSettings: Partial<TTSSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopProgressTracking();
      if (isPlaying) {
        Speech.stop();
      }
    };
  }, []);

  return {
    // State
    isPlaying,
    isPaused,
    currentText,
    progress,
    settings,
    availableVoices,
    
    // Actions
    speak,
    togglePlayPause,
    stop,
    updateSettings,
    
    // Utils
    loadVoices,
  };
};
