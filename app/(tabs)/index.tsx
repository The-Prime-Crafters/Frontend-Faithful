import { API_BASE_URL, API_ENDPOINTS } from '@/constants/API';
import { useLoading } from '@/contexts/LoadingContext';
import { useAppUsage, useStreak, useTodayUsage } from '@/hooks/useAppUsage';
import ActivityTrackerService from '@/utils/activityTracker';
import AppSessionTracker from '@/utils/appSessionTracker';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  LayoutAnimation,
  Platform, SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View
} from 'react-native';
import { useTTS } from '../../hooks/useTTS';

/* ───── Constants ───── */
const { width, height } = Dimensions.get('window');
const PRIMARY_COLOR    = '#7b4d62';
const SECONDARY_COLOR  = '#ce703f';
const WHITE            = '#FFFFFF';
const OFF_WHITE        = '#f8f9fa';
const SOFT_GRAY        = '#e9ecef';
const DARK_GRAY        = '#495057';
const BLACK            = '#000000';
const LIGHT_PURPLE     = '#e3d5ca';
const LIGHT_ORANGE     = '#f4e4d6';
const SUCCESS_COLOR    = '#28a745';

const STATUS_BAR_OFFSET = Platform.OS === 'android'
  ? (StatusBar.currentHeight ?? 24) + 10
  : 10;

/* Mock data - will be updated with dynamic data */
const cardsData = [
  { 
    id: '1', 
    title: 'Daily Verse',  
    description: 'Your daily scripture reading.',
    content: `"For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life." - John 3:16

This verse reminds us of God's immense love for humanity. Through Jesus Christ, we are offered salvation and eternal life. Take a moment to reflect on this profound truth and how it applies to your life today.`
  },
  { 
    id: '2', 
    title: 'Prayer Time',  
    description: 'Suggested prayer based on the day.',
    content: `Heavenly Father, thank you for this new day and the blessings you have given me. Help me to walk in your ways and to be a light to others. Guide my thoughts, words, and actions so they may bring glory to your name. In Jesus' name, Amen.`
  },
  { 
    id: '3', 
    title: 'Reflection',   
    description: 'Take a moment to reflect.',
    content: `Today's Reflection: Gratitude

Take a moment to think about three things you're grateful for today. It could be something as simple as a warm cup of coffee or as profound as the love of family and friends. Gratitude opens our hearts to see God's blessings in our daily lives.`
  },
];

/* Enable LayoutAnimation on Android */
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/* Helper function to normalize book names */
const normalizeBookName = (bookName: string): string => {
  const bookNameMap: { [key: string]: string } = {
    'Matt': 'Matthew',
    'Matt.': 'Matthew',
    'Mark': 'Mark',
    'Luke': 'Luke',
    'John': 'John',
    // Add more mappings as needed
  };
  
  return bookNameMap[bookName] || bookName;
};

interface CardData {
  id: string;
  title: string;
  description: string;
  content: string;
}

interface DailyPrayerData {
  version: string;
  category: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  reference: string;
  prayedAt: string;
  remainingVerses: number;
  totalVersesInCategory: number;
}

interface PrayerStory {
  id: string;
  userId: string;
  userName: string;
  userPicture?: string;
  content: string;
  createdAt: string;
  responsesCount: number;
  isAnonymous: boolean;
}

export default function HomeScreen() {
  const { showLoading, hideLoading } = useLoading();
  const [selectedCard,setSelectedCard] = useState<string | null>('1'); // First card always opened
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [showReadModal, setShowReadModal] = useState(false);
  const [currentReadContent, setCurrentReadContent] = useState('');
  const [currentReadTitle, setCurrentReadTitle] = useState('');
  const [showTTSModal, setShowTTSModal] = useState(false);
  const [currentTTSContent, setCurrentTTSContent] = useState('');
  const [currentTTSTitle, setCurrentTTSTitle] = useState('');
  const [dailyPrayer, setDailyPrayer] = useState<DailyPrayerData | null>(null);
  const [lastPrayerFetch, setLastPrayerFetch] = useState<number | null>(null);
  const [dailyVerse, setDailyVerse] = useState<DailyPrayerData | null>(null);
  const [lastVerseFetch, setLastVerseFetch] = useState<number | null>(null);
  const [dailyReflection, setDailyReflection] = useState<any>(null);
  const [lastReflectionFetch, setLastReflectionFetch] = useState<number | null>(null);
  const [availableThemes, setAvailableThemes] = useState<string[]>([]);
  const [currentTheme, setCurrentTheme] = useState<string>('');
  
  // Prayer stories state
  const [prayerStories, setPrayerStories] = useState<any[]>([]);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [lastStoriesFetch, setLastStoriesFetch] = useState<number | null>(null);
  
  // View More modal state
  const [showViewMoreModal, setShowViewMoreModal] = useState(false);
  const [viewMoreContent, setViewMoreContent] = useState('');
  const [viewMoreTitle, setViewMoreTitle] = useState('');
  
  const [userData, setUserData] = useState<any>(null);
  const [welcomeOpacity] = useState(new Animated.Value(0));
  
  // Usage and Streak data from hooks (local) - real-time updates every second
  const appUsage = useAppUsage(1000); // Update every 1 second
  const todayUsage = useTodayUsage(1000); // Update every 1 second
  const streakData = useStreak();
  
  
  // Backend API data
  const [backendUsage, setBackendUsage] = useState<any>(null);
  const [backendStreak, setBackendStreak] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  
  // TTS functionality
  const {
    isPlaying,
    isPaused,
    currentText,
    progress,
    settings,
    availableVoices,
    speak,
    togglePlayPause,
    stop,
    updateSettings,
  } = useTTS();

  // Voice selection state
  const [selectedVoice, setSelectedVoice] = useState<string | undefined>(settings.voice);
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);

  // Activity tracking state
  const [cardReadTimers, setCardReadTimers] = useState<{[key: string]: NodeJS.Timeout | null}>({});
  const [cardReadStartTimes, setCardReadStartTimes] = useState<{[key: string]: number}>({});
  const [completedActivities, setCompletedActivities] = useState<Set<string>>(new Set());
  const sessionTracker = AppSessionTracker.getInstance();

  // Sync selected voice with settings
  useEffect(() => {
    setSelectedVoice(settings.voice);
  }, [settings.voice]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(cardReadTimers).forEach(timer => {
        if (timer) clearTimeout(timer);
      });
    };
  }, [cardReadTimers]);

  // Calculate gamification metrics
  const [backendDailyGoals, setBackendDailyGoals] = useState<any>(null);

  // Load backend daily goals from cache
  useEffect(() => {
    const loadBackendGoals = async () => {
      try {
        const cached = await SecureStore.getItemAsync('sessionData');
        if (cached) {
          const data = JSON.parse(cached);
          if (data.dailyGoals) {
            setBackendDailyGoals(data.dailyGoals);
          }
        }
      } catch (error) {
        console.error('Error loading backend goals:', error);
      }
    };
    loadBackendGoals();
  }, []);

  const calculateDailyProgress = () => {
    // Use backend data if available
    if (backendDailyGoals) {
      return {
        completedGoals: backendDailyGoals.completedGoals,
        totalGoals: backendDailyGoals.totalGoals,
        progressPercentage: backendDailyGoals.progressPercentage,
        allMissionsComplete: backendDailyGoals.completedGoals === backendDailyGoals.totalGoals,
        goals: backendDailyGoals.goals,
      };
    }

    // Fallback to local calculation
    const completedGoals = [dailyVerse, dailyPrayer, dailyReflection].filter(Boolean).length;
    const totalGoals = 3;
    const progressPercentage = (completedGoals / totalGoals) * 100;
    
    return {
      completedGoals,
      totalGoals,
      progressPercentage,
      allMissionsComplete: completedGoals === totalGoals,
      goals: [],
    };
  };

  const dailyProgress = calculateDailyProgress();
  const enhancedStreakData = {
    ...streakData,
    ...dailyProgress,
    level: streakData?.level,
    totalXP: streakData?.totalXP,
    todayXP: streakData?.todayXP,
    xpToNextLevel: streakData?.xpToNextLevel,
    streakMessage: streakData?.streakMessage, // Add streak message from API
  };

  // Debug: Log XP data to see what we're getting
  useEffect(() => {
    if (streakData) {
      console.log('🎮 Home Screen XP Data:');
      console.log('  - Total XP:', streakData.totalXP);
      console.log('  - Today XP:', streakData.todayXP);
      console.log('  - Level:', streakData.level);
      console.log('  - XP to Next Level:', streakData.xpToNextLevel);
      console.log('  - Current Streak:', streakData.currentStreak);
    }
  }, [streakData?.totalXP, streakData?.todayXP, streakData?.level]);

  // Celebration effect when all missions complete
  useEffect(() => {
    if (dailyProgress.allMissionsComplete) {
      console.log('🎉 All missions complete! Show celebration!');
      // Add confetti/celebration animation here if needed
    }
  }, [dailyProgress.allMissionsComplete]);

  

  /* ───── Dynamic Cards Data ───── */
  const getCardsData = () => [
    { 
      id: '1', 
      title: 'Daily Verse',  
      description: dailyVerse 
          ? `Today's scripture from ${normalizeBookName(dailyVerse.book)}` 
          : 'Your daily scripture reading.',
      content: dailyVerse 
          ? `"${dailyVerse.text}" - ${dailyVerse.reference}

This verse from ${normalizeBookName(dailyVerse.book)} reminds us of God's truth and guidance. Take a moment to reflect on how this scripture speaks to your heart today.`
          : `"For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life." - John 3:16

This verse reminds us of God's immense love for humanity. Through Jesus Christ, we are offered salvation and eternal life. Take a moment to reflect on this profound truth and how it applies to your life today.`
    },
    { 
      id: '2', 
      title: 'Daily Prayer',  
      description: dailyPrayer 
          ? `Today's ${dailyPrayer.category} verse` 
          : 'Suggested prayer based on the day.',
      content: dailyPrayer 
          ? `"${dailyPrayer.text}" - ${dailyPrayer.reference}

This ${dailyPrayer.category} verse from ${normalizeBookName(dailyPrayer.book)} reminds us of God's presence and care. Take a moment to reflect on how this scripture speaks to your heart today.

Progress: ${dailyPrayer.totalVersesInCategory - dailyPrayer.remainingVerses + 1} of ${dailyPrayer.totalVersesInCategory} verses in this category.`
          : `Heavenly Father, thank you for this new day and the blessings you have given me. Help me to walk in your ways and to be a light to others. Guide my thoughts, words, and actions so they may bring glory to your name. In Jesus' name, Amen.`
    },
    { 
      id: '3', 
      title: 'Daily Reflection',   
      description: dailyReflection 
          ? `Today's reflection on ${currentTheme}` 
          : 'Take a moment to reflect.',
      content: dailyReflection 
          ? `Today's Reflection: ${currentTheme}

${dailyReflection.content || dailyReflection.reflection || `Take a moment to reflect on ${currentTheme} and how it applies to your life today. Consider the ways this theme has appeared in your experiences and what God might be teaching you through it.`}`
          : `Today's Reflection: Gratitude

Take a moment to think about three things you're grateful for today. It could be something as simple as a warm cup of coffee or as profound as the love of family and friends. Gratitude opens our hearts to see God's blessings in our daily lives.`
    },
  ];

  /* ───── Effects ───── */
  useEffect(() => {
    // Load stored prayer, verse, reflection data and check if we need to fetch new data
    loadStoredPrayerData();
    loadStoredVerseData();
    loadStoredReflectionData();
    loadUserData();
    
    // Defer API calls to after UI renders
    const deferredInit = setTimeout(() => {
    fetchPrayerStories();
    
    // Fetch usage and streak data
    fetchUsageData();
    fetchStreakData();
    }, 500); // Wait 500ms for UI to render first
    
    // Start activity tracking
    const activityTracker = ActivityTrackerService.getInstance();
    activityTracker.startStudySession();
    activityTracker.checkAndResetForNewDay();
    
    // Animate welcome message
    Animated.timing(welcomeOpacity, {
      toValue: 1,
      duration: 800,
      delay: 300,
      useNativeDriver: true,
    }).start();
    
    // Mark first load as complete after initialization
    if (isFirstLoad) {
      setIsFirstLoad(false);
    }
    
    // Cleanup: stop study session and sync data when component unmounts
    return () => {
      clearTimeout(deferredInit);
      activityTracker.stopStudySession();
      activityTracker.syncWithAPI();
    };
  }, []);

  // Refresh prayer stories when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Force refresh prayer stories when user returns to home screen
      fetchPrayerStories(true);
      
      // Check if Bible version was changed
      checkBibleVersionChange();
      
      // Reload user data in case profile picture was updated
      loadUserData();
    }, [])
  );

  // Check if Bible version was changed in Account Settings
  const checkBibleVersionChange = async () => {
    try {
      const bibleVersionChanged = await SecureStore.getItemAsync('bibleVersionChanged');
      
      if (bibleVersionChanged === 'true') {
        console.log('📖 Bible version changed detected! Hard refreshing all daily content...');
        
        // Clear the flag
        await SecureStore.deleteItemAsync('bibleVersionChanged');
        
        // Hard refresh all daily content
        showLoading('Refreshing with new Bible version...');
        
        // Clear all cached data
        setDailyVerse(null);
        setDailyPrayer(null);
        setDailyReflection(null);
        setLastVerseFetch(null);
        setLastPrayerFetch(null);
        setLastReflectionFetch(null);
        
        // Fetch fresh data
        await Promise.all([
          fetchDailyVerse('comfort', false),
          fetchDailyPrayer('comfort', false),
          fetchDailyReflection('gratitude', false)
        ]);
        
        hideLoading();
        
        console.log('✅ All daily content refreshed with new Bible version!');
      }
    } catch (error) {
      console.error('❌ Error checking Bible version change:', error);
      hideLoading();
    }
  };

  // Check every minute if we need to fetch new daily prayer, verse, reflection, or study plan
  useEffect(() => {
    const interval = setInterval(() => {
      checkAndFetchDailyPrayer();
      checkAndFetchDailyVerse();
      checkAndFetchDailyReflection();
      fetchPrayerStories();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [lastPrayerFetch, lastVerseFetch, lastReflectionFetch, lastStoriesFetch]);

  /* ───── Daily Prayer Storage & Auto-refresh ───── */
  const loadStoredPrayerData = async () => {
    try {
      // Load stored prayer data
      const storedPrayer = await SecureStore.getItemAsync('dailyPrayerData');
      const storedFetchTime = await SecureStore.getItemAsync('lastPrayerFetch');
      
      if (storedPrayer && storedFetchTime) {
        const prayerData = JSON.parse(storedPrayer);
        const fetchTime = parseInt(storedFetchTime);
        
        setDailyPrayer(prayerData);
        setLastPrayerFetch(fetchTime);
        
        console.log('📱 Loaded stored daily prayer data from:', new Date(fetchTime).toLocaleString());
        
        // Check if 24 hours have passed
        checkAndFetchDailyPrayer(fetchTime);
      } else {
        // No stored data, fetch immediately
        console.log('📱 No stored prayer data, fetching immediately');
        fetchDailyPrayer('comfort');
      }
    } catch (error) {
      console.error('❌ Error loading stored prayer data:', error);
      // Fallback to immediate fetch
      fetchDailyPrayer('comfort');
    }
  };

  const checkAndFetchDailyPrayer = async (lastFetchTime?: number) => {
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const timeToCheck = lastFetchTime || lastPrayerFetch;
    
    if (timeToCheck) {
      const hoursPassed = (now - timeToCheck) / (1000 * 60 * 60);
      console.log(`⏰ Daily Prayer: ${hoursPassed.toFixed(2)} hours since last fetch`);
    }
    
    // Production: Check if 24 hours have passed
    if (!timeToCheck || (now - timeToCheck) >= twentyFourHours) {
      console.log('🔄 24 hours passed, fetching new daily prayer');
      await fetchDailyPrayer('comfort');
    } else {
      console.log('⏭️  Skipping daily prayer fetch - using cached data');
    }
  };

  const savePrayerData = async (prayerData: DailyPrayerData) => {
    try {
      const now = Date.now();
      await SecureStore.setItemAsync('dailyPrayerData', JSON.stringify(prayerData));
      await SecureStore.setItemAsync('lastPrayerFetch', now.toString());
      
      setLastPrayerFetch(now);
      console.log('💾 Saved daily prayer data and timestamp');
    } catch (error) {
      console.error('❌ Error saving prayer data:', error);
    }
  };

  /* ───── Daily Verse Storage & Auto-refresh ───── */
  const loadStoredVerseData = async () => {
    try {
      // Load stored verse data
      const storedVerse = await SecureStore.getItemAsync('dailyVerseData');
      const storedFetchTime = await SecureStore.getItemAsync('lastVerseFetch');
      
      if (storedVerse && storedFetchTime) {
        const verseData = JSON.parse(storedVerse);
        const fetchTime = parseInt(storedFetchTime);
        
        setDailyVerse(verseData);
        setLastVerseFetch(fetchTime);
        
        console.log('📱 Loaded stored daily verse data from:', new Date(fetchTime).toLocaleString());
        
        // Check if 24 hours have passed
        checkAndFetchDailyVerse(fetchTime);
      } else {
        // No stored data, fetch immediately
        console.log('📱 No stored verse data, fetching immediately');
        fetchDailyVerse('comfort');
      }
    } catch (error) {
      console.error('❌ Error loading stored verse data:', error);
      // Fallback to immediate fetch
      fetchDailyVerse('comfort');
    }
  };

  const checkAndFetchDailyVerse = async (lastFetchTime?: number) => {
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const timeToCheck = lastFetchTime || lastVerseFetch;
    
    if (timeToCheck) {
      const hoursPassed = (now - timeToCheck) / (1000 * 60 * 60);
      console.log(`⏰ Daily Verse: ${hoursPassed.toFixed(2)} hours since last fetch`);
    }
    
    // Production: Check if 24 hours have passed
    if (!timeToCheck || (now - timeToCheck) >= twentyFourHours) {
      console.log('🔄 24 hours passed, fetching new daily verse');
      await fetchDailyVerse('comfort');
    } else {
      console.log('⏭️  Skipping daily verse fetch - using cached data');
    }
  };

  const saveVerseData = async (verseData: DailyPrayerData) => {
    try {
      const now = Date.now();
      await SecureStore.setItemAsync('dailyVerseData', JSON.stringify(verseData));
      await SecureStore.setItemAsync('lastVerseFetch', now.toString());
      
      setLastVerseFetch(now);
      console.log('💾 Saved daily verse data and timestamp');
    } catch (error) {
      console.error('❌ Error saving verse data:', error);
    }
  };

  /* ───── Daily Reflection Storage & Auto-refresh ───── */
  const loadStoredReflectionData = async () => {
    try {
      // Load stored reflection data
      const storedReflection = await SecureStore.getItemAsync('dailyReflectionData');
      const storedFetchTime = await SecureStore.getItemAsync('lastReflectionFetch');
      const storedTheme = await SecureStore.getItemAsync('currentReflectionTheme');
      
      if (storedReflection && storedFetchTime && storedTheme) {
        const reflectionData = JSON.parse(storedReflection);
        const fetchTime = parseInt(storedFetchTime);
        
        setDailyReflection(reflectionData);
        setLastReflectionFetch(fetchTime);
        setCurrentTheme(storedTheme);
        
        console.log('📱 Loaded stored daily reflection data from:', new Date(fetchTime).toLocaleString(), 'Theme:', storedTheme);
        
        // Check if 24 hours have passed
        checkAndFetchDailyReflection(fetchTime);
      } else {
        // No stored data, fetch themes first then reflection
        console.log('📱 No stored reflection data, fetching themes and reflection');
        await fetchReflectionThemes();
      }
    } catch (error) {
      console.error('❌ Error loading stored reflection data:', error);
      // Fallback to fetch themes
      await fetchReflectionThemes();
    }
  };

  const checkAndFetchDailyReflection = async (lastFetchTime?: number) => {
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const timeToCheck = lastFetchTime || lastReflectionFetch;
    
    if (timeToCheck) {
      const hoursPassed = (now - timeToCheck) / (1000 * 60 * 60);
      console.log(`⏰ Daily Reflection: ${hoursPassed.toFixed(2)} hours since last fetch`);
    }
    
    if (!timeToCheck || (now - timeToCheck) >= twentyFourHours) {
      console.log('🔄 24 hours have passed, fetching new daily reflection with random theme');
      await fetchReflectionThemes();
    }
  };

  const saveReflectionData = async (reflectionData: any, theme: string) => {
    try {
      const now = Date.now();
      await SecureStore.setItemAsync('dailyReflectionData', JSON.stringify(reflectionData));
      await SecureStore.setItemAsync('lastReflectionFetch', now.toString());
      await SecureStore.setItemAsync('currentReflectionTheme', theme);
      
      setLastReflectionFetch(now);
      setCurrentTheme(theme);
      console.log('💾 Saved daily reflection data and timestamp with theme:', theme);
    } catch (error) {
      console.error('❌ Error saving reflection data:', error);
    }
  };

  /* ───── Daily Reflection API ───── */
  const fetchReflectionThemes = async () => {
    try {
      // HARDCODED FOR NOW - Comment out API call
      console.log('💭 Using hardcoded reflection theme');
      
      const hardcodedThemes = ['Hope', 'Faith', 'Love', 'Peace', 'Gratitude', 'Strength'];
      const randomTheme = hardcodedThemes[Math.floor(Math.random() * hardcodedThemes.length)];
      
      console.log('🎯 Selected random theme:', randomTheme);
      await fetchDailyReflection(randomTheme);
      
      /* COMMENTED OUT - API CALL
      const token = await SecureStore.getItemAsync('authToken');
      
      if (!token) {
        console.log('No auth token found for reflection themes');
      return;
    }

      console.log('🔄 Fetching reflection themes...');
      const response = await fetch(API_ENDPOINTS.REFLECTION_THEMES, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Reflection themes fetched successfully:', result);
      
      if (result.success && result.data && result.data.themes && Array.isArray(result.data.themes)) {
        setAvailableThemes(result.data.themes);
        
        const randomThemeObj = result.data.themes[Math.floor(Math.random() * result.data.themes.length)];
        const randomTheme = randomThemeObj.name || randomThemeObj.id || randomThemeObj;
        console.log('🎲 Selected random theme:', randomTheme);
        
        await fetchDailyReflection(randomTheme);
      } else {
        console.log('❌ No reflection themes received');
        console.log('Response structure:', result);
      }
      */
    } catch (error) {
      console.error('❌ Error fetching reflection themes:', error);
    }
  };

  const fetchDailyReflection = async (theme: string, showLoader: boolean = false) => {
    try {
      if (showLoader) {
        showLoading('Loading daily reflection...');
      }
      
      // HARDCODED FOR NOW - Comment out API call
      console.log('💭 Using hardcoded daily reflection for theme:', theme);
      
      const reflectionTexts: { [key: string]: string } = {
        'Hope': 'Hope is the anchor of the soul. In Christ, we find hope that never disappoints, a promise of eternal life, and the assurance that God works all things together for good.',
        'Faith': 'Faith is being sure of what we hope for and certain of what we do not see. Through faith, we please God and receive His promises.',
        'Love': 'God is love. His love for us is unconditional, eternal, and transformative. When we abide in His love, we can love others as He has loved us.',
        'Peace': 'The peace of God, which transcends all understanding, guards our hearts and minds in Christ Jesus. This peace is not as the world gives, but a deep assurance of His presence.',
        'Gratitude': 'Give thanks in all circumstances, for this is God\'s will for you in Christ Jesus. A grateful heart recognizes God\'s blessings and draws us closer to Him.',
        'Strength': 'I can do all things through Christ who strengthens me. In our weakness, His strength is made perfect, and His grace is sufficient for us.',
      };
      
      const hardcodedReflection = {
        theme: theme,
        text: reflectionTexts[theme] || 'Take time today to reflect on God\'s goodness and faithfulness in your life.',
        reference: 'Romans 15:13',
        verse: 'May the God of hope fill you with all joy and peace as you trust in him, so that you may overflow with hope by the power of the Holy Spirit.',
        date: new Date().toISOString(),
      };
      
      setDailyReflection(hardcodedReflection);
      await saveReflectionData(hardcodedReflection, theme);
      
      /* COMMENTED OUT - API CALL
      const token = await SecureStore.getItemAsync('authToken');
      
      if (!token) {
        console.log('No auth token found for daily reflection');
        return;
      }

      console.log('🔄 Fetching daily reflection for theme:', theme);
      const response = await fetch(`${API_ENDPOINTS.DAILY_REFLECTION}?theme=${theme}&version=en-asv`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Daily reflection fetched successfully:', result);
      
      if (result.success && result.data) {
        setDailyReflection(result.data);
        await saveReflectionData(result.data, theme);
      } else {
        console.log('❌ No daily reflection data received');
      }
      */
    } catch (error) {
      console.error('❌ Error fetching daily reflection:', error);
    } finally {
      if (showLoader) {
        hideLoading();
      }
    }
  };

  /* ───── Prayer Stories API ───── */
  const fetchPrayerStories = async (forceRefresh = false) => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        return;
      }
      
      const response = await fetch(API_ENDPOINTS.PRAYER_REQUESTS, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Check different possible data structures
        let requests = null;
        if (data.data && data.data.requests) {
          requests = data.data.requests;
        } else if (data.requests) {
          requests = data.requests;
        } else if (data.data && Array.isArray(data.data)) {
          requests = data.data;
        } else if (Array.isArray(data)) {
          requests = data;
        }
        
        if (requests && Array.isArray(requests)) {
          // Process all prayers and group by user
          const allPrayers = requests.map((prayer: any) => ({
              id: prayer.id,
            userId: prayer.user_id,
            userName: prayer.is_anonymous ? 'Anonymous' : (prayer.display_name || prayer.author_name || 'Anonymous'),
            userPicture: prayer.is_anonymous ? null : (prayer.display_picture || prayer.author_picture),
              title: prayer.title,
              description: prayer.description,
              content: prayer.description || prayer.title || 'Prayer request',
              createdAt: prayer.created_at,
              responsesCount: prayer.response_count || 0,
            isAnonymous: prayer.is_anonymous || false,
              category: prayer.category,
              isUrgent: prayer.is_urgent || false,
              status: prayer.status,
            // Full prayer data for detailed display
              fullPrayerData: prayer
          }));

          // Group stories by user (anonymous stories are kept separate)
          const groupedStories = new Map();
          
          allPrayers.forEach((prayer: any) => {
            // Create a unique key for grouping
            // Anonymous prayers are grouped separately, even if from same user
            const groupKey = prayer.isAnonymous 
              ? `anonymous_${prayer.id}` // Each anonymous story is its own group
              : `user_${prayer.userId}`; // Same user stories are grouped together
            
            if (!groupedStories.has(groupKey)) {
              groupedStories.set(groupKey, {
                groupId: groupKey,
                userId: prayer.userId,
                userName: prayer.userName,
                userPicture: prayer.userPicture,
                isAnonymous: prayer.isAnonymous,
                stories: []
              });
            }
            
            groupedStories.get(groupKey).stories.push(prayer);
          });

          // Convert to array and sort by most recent story in each group
          const stories = Array.from(groupedStories.values())
            .map(group => ({
              ...group,
              // Sort stories within group by creation date (newest first)
              stories: group.stories.sort((a: any, b: any) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              ),
              // Use the most recent story's data for display
              id: group.stories[0].id,
              title: group.stories[0].title,
              description: group.stories[0].description,
              content: group.stories[0].content,
              createdAt: group.stories[0].createdAt,
              responsesCount: group.stories[0].responsesCount,
              category: group.stories[0].category,
              isUrgent: group.stories[0].isUrgent,
              status: group.stories[0].status,
              fullPrayerData: group.stories[0].fullPrayerData
            }))
            .sort((a: any, b: any) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
            .slice(0, 5); // Take only the first 5 groups
          
          setPrayerStories(stories);
          setLastStoriesFetch(Date.now());
        }
      }
    } catch (error) {
      console.error('Error fetching prayer stories:', error);
    }
  };

  // Story viewer functions
  const openStoryViewer = (story: any, index: number) => {
    // Set the first story in the group as the current story
    const firstStory = story.stories && story.stories.length > 0 ? story.stories[0] : story;
    setSelectedStory(firstStory);
    setCurrentStoryIndex(index);
    setShowStoryViewer(true);
  };

  const closeStoryViewer = () => {
    setShowStoryViewer(false);
    setSelectedStory(null);
    setCurrentStoryIndex(0);
  };

  // View More functions
  const openViewMore = (title: string, content: string) => {
    setViewMoreTitle(title);
    setViewMoreContent(content);
    setShowViewMoreModal(true);
  };

  const closeViewMore = () => {
    setShowViewMoreModal(false);
    setViewMoreContent('');
    setViewMoreTitle('');
  };

  // Calculate if content should show "View More" based on screen coverage
  const shouldShowViewMore = (content: string) => {
    if (!content) return false;
    
    // Estimate text height based on content length and line height
    const lineHeight = 24; // Based on prayerCardDescription lineHeight
    const maxWidth = width - 80; // Account for padding
    const charsPerLine = Math.floor(maxWidth / 12); // Approximate characters per line
    const estimatedLines = Math.ceil(content.length / charsPerLine);
    const estimatedHeight = estimatedLines * lineHeight;
    
    // 80% of screen height minus header space (profile pic area)
    const availableHeight = (height * 0.8) - 200; // 200px for header and margins
    
    return estimatedHeight > availableHeight;
  };

  const goToNextStory = () => {
    const currentGroup = prayerStories[currentStoryIndex];
    const currentStoryInGroup = selectedStory;
    
    // Check if there are more stories in the current group
    if (currentGroup?.stories && currentGroup.stories.length > 1) {
      const currentStoryIndexInGroup = currentGroup.stories.findIndex((s: any) => s.id === currentStoryInGroup?.id);
      if (currentStoryIndexInGroup < currentGroup.stories.length - 1) {
        // Move to next story in current group
        setSelectedStory(currentGroup.stories[currentStoryIndexInGroup + 1]);
        return;
      }
    }
    
    // Move to next group
    if (currentStoryIndex < prayerStories.length - 1) {
      const nextGroup = prayerStories[currentStoryIndex + 1];
      setCurrentStoryIndex(currentStoryIndex + 1);
      setSelectedStory(nextGroup.stories && nextGroup.stories.length > 0 ? nextGroup.stories[0] : nextGroup);
      } else {
        closeStoryViewer();
    }
  };

  const goToPreviousStory = () => {
    const currentGroup = prayerStories[currentStoryIndex];
    const currentStoryInGroup = selectedStory;
    
    // Check if there are previous stories in the current group
    if (currentGroup?.stories && currentGroup.stories.length > 1) {
      const currentStoryIndexInGroup = currentGroup.stories.findIndex((s: any) => s.id === currentStoryInGroup?.id);
      if (currentStoryIndexInGroup > 0) {
        // Move to previous story in current group
        setSelectedStory(currentGroup.stories[currentStoryIndexInGroup - 1]);
        return;
      }
    }
    
    // Move to previous group
    if (currentStoryIndex > 0) {
      const prevGroup = prayerStories[currentStoryIndex - 1];
      setCurrentStoryIndex(currentStoryIndex - 1);
      setSelectedStory(prevGroup.stories && prevGroup.stories.length > 0 ? prevGroup.stories[0] : prevGroup);
    }
  };

  // Debug modal state
  useEffect(() => {
    console.log('🔍 MODAL STATE DEBUG:', {
      showStoryViewer,
      selectedStory: !!selectedStory,
      selectedStoryData: selectedStory ? {
        id: selectedStory.id,
        title: selectedStory.title,
        description: selectedStory.description,
        userName: selectedStory.userName
      } : null
    });
  }, [showStoryViewer, selectedStory]);

  // Get category icon (same as prayer screen)
  const getCategoryIcon = (category: string) => {
    const categoryIcons: { [key: string]: string } = {
      'Health': 'medical',
      'Family': 'people',
      'Work': 'briefcase',
      'Relationships': 'heart',
      'Spiritual': 'leaf',
      'Financial': 'card',
      'Education': 'school',
      'Other': 'ellipsis-horizontal'
    };
    return categoryIcons[category] || 'ellipsis-horizontal';
  };

  /* ───── User Data Loading ───── */
  const loadUserData = async () => {
    try {
      // First, load from SecureStore (fast)
      const userDataString = await SecureStore.getItemAsync('userData');
      if (userDataString) {
        const user = JSON.parse(userDataString);
        setUserData(user);
        console.log('👤 User data loaded:', user.name);
      }
      
      // Then, fetch fresh data from API to get latest profile picture
      try {
        const token = await SecureStore.getItemAsync('authToken');
        if (token) {
          const profileResponse = await fetch(`${API_BASE_URL}/api/users/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            const freshUser = profileData.user || profileData;
            
            // Update user data with fresh profile picture
            const updatedUser = {
              ...(userDataString ? JSON.parse(userDataString) : {}),
              picture: freshUser.picture, // Always use latest picture from backend
              name: freshUser.name || (userDataString ? JSON.parse(userDataString).name : ''),
              email: freshUser.email || (userDataString ? JSON.parse(userDataString).email : ''),
            };
            
            // Save to SecureStore and state
            await SecureStore.setItemAsync('userData', JSON.stringify(updatedUser));
            setUserData(updatedUser);
            console.log('✅ Profile picture refreshed from backend');
          }
        }
      } catch (apiError) {
        console.log('⚠️ Could not fetch fresh profile data, using cached data');
      }
    } catch (error) {
      console.error('❌ Error loading user data:', error);
    }
  };

  /* ───── Fetch Usage Data from Backend ───── */
  const fetchUsageData = async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        console.log('❌ No auth token found for usage data');
        return;
      }
      
      console.log('🔄 Fetching usage data from backend...');
      const response = await fetch(`${API_BASE_URL}/api/users/profile/usage`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Usage data fetched:', data);
        if (data.success && data.usage) {
          setBackendUsage(data.usage);
        }
      } else {
        console.log('❌ Failed to fetch usage data:', response.status);
      }
    } catch (error) {
      console.error('💥 Error fetching usage data:', error);
    }
  };

  /* ───── Fetch Streak Data from Backend ───── */
  const fetchStreakData = async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        console.log('❌ No auth token found for streak data');
        return;
      }
      
      console.log('🔄 Fetching streak data from backend...');
      const response = await fetch(`${API_BASE_URL}/api/users/profile/streak`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Streak data fetched:', data);
        if (data.success && data.streak) {
          setBackendStreak(data.streak);
        }
      } else {
        console.log('❌ Failed to fetch streak data:', response.status);
      }
    } catch (error) {
      console.error('💥 Error fetching streak data:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  /* ───── Greeting Helper ───── */
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  /* ───── Format Time Helper ───── */
  const formatTime = (seconds: number) => {
    if (!seconds || seconds < 60) return `${Math.floor(seconds || 0)}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };



  /* ───── Daily Verse API ───── */
  const fetchDailyVerse = async (category: string = 'comfort', showLoader: boolean = false) => {
    try {
      if (showLoader) {
        showLoading('Loading daily verse...');
      }
      
      const token = await SecureStore.getItemAsync('authToken');
      
      if (!token) {
        hideLoading();
        return;
      }

      // Using the new dedicated daily verse endpoint
      const apiUrl = API_ENDPOINTS.DAILY_VERSE;
      
      console.log('📖 Fetching daily verse from:', apiUrl);
      
      // Bible version is automatically detected from user's profile token
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📖 Response Status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Daily verse API response:', JSON.stringify(result, null, 2));
      
      if (result.success && result.data) {
        // Transform API response to match expected format
        const verseData = {
          version: result.data.bible || result.data.version || 'KJV',
          category: result.data.category || 'inspiration',
          book: result.data.passage?.split(' ')[0] || result.data.book || 'John',
          chapter: result.data.chapter || 3,
          verse: result.data.verse || 16,
          text: result.data.text || result.data.verseText,
          reference: result.data.reference || result.data.passage || result.data.verseReference,
          prayedAt: result.data.prayedAt || result.data.date || new Date().toISOString(),
          remainingVerses: result.data.remainingVerses || 100,
          totalVersesInCategory: result.data.totalVerses || 150,
        };
        
        console.log('📝 Transformed verse data:', verseData);
        console.log('📖 Setting daily verse state with version:', verseData.version);
        console.log('📄 Verse text length:', verseData.text?.length, 'characters');
        
        setDailyVerse(verseData);
        await saveVerseData(verseData);
        
        console.log('✅ Daily verse state updated successfully');
      } else {
        console.log('❌ No daily verse data received');
      }
    } catch (error) {
      console.error('❌ Error fetching daily verse:', error);
    } finally {
      if (showLoader) {
        hideLoading();
      }
    }
  };

  /* ───── Daily Prayer API ───── */
  const fetchDailyPrayer = async (category: string = 'comfort', showLoader: boolean = false) => {
    try {
      if (showLoader) {
        showLoading('Loading daily prayer...');
      }
      
      const token = await SecureStore.getItemAsync('authToken');
      
      if (!token) {
        console.log('❌ No auth token found for daily prayer');
        hideLoading();
        return;
      }

      const apiUrl = `${API_ENDPOINTS.DAILY_PRAYER}?category=${category}`;
      console.log('🙏 ═══════════════════════════════════════');
      console.log('🙏 FETCHING DAILY PRAYER');
      console.log('🙏 Endpoint:', apiUrl);
      console.log('🙏 Category:', category);
      console.log('🙏 Bible version: Auto-detected from user token');
      console.log('🙏 ═══════════════════════════════════════');
      
      // Bible version is automatically detected from user's profile token
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('🙏 Response Status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Daily prayer API response:', JSON.stringify(result, null, 2));
      
      if (result.success && result.data) {
        // Transform API response to match expected format
        const prayerData = {
          version: result.data.bible || 'KJV',
          category: result.data.category,
          book: result.data.passage?.split(' ')[0] || 'Psalm',
          chapter: 23,
          verse: 1,
          text: result.data.text,
          reference: result.data.reference || result.data.passage,
          prayedAt: result.data.prayedAt || new Date().toISOString(),
          remainingVerses: 80,
          totalVersesInCategory: 120,
        };
        
        setDailyPrayer(prayerData);
        await savePrayerData(prayerData);
      } else {
        console.log('❌ No daily prayer data received');
      }
    } catch (error) {
      console.error('❌ Error fetching daily prayer:', error);
    } finally {
      if (showLoader) {
        hideLoading();
      }
    }
  };



  /* Toggle card expand */
  const toggleCard = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const wasOpen = selectedCard === id;
    setSelectedCard(prev => (prev === id ? null : id));

    if (!wasOpen) {
      // Card is being OPENED - start tracking read time
      const startTime = Date.now();
      setCardReadStartTimes(prev => ({ ...prev, [id]: startTime }));

      // Set a timer: if user keeps card open for 8+ seconds, count as "read"
      const timer = setTimeout(() => {
        trackCardRead(id);
      }, 8000); // 8 seconds

      setCardReadTimers(prev => ({ ...prev, [id]: timer }));
    } else {
      // Card is being CLOSED - clear the timer
      if (cardReadTimers[id]) {
        clearTimeout(cardReadTimers[id]);
        setCardReadTimers(prev => ({ ...prev, [id]: null }));
      }
    }
  };

  /* Track when user reads a card (keeps it open for 8+ seconds) */
  const trackCardRead = (cardId: string) => {
    const activityKey = `${cardId}_read`;
    
    // Don't track if already completed
    if (completedActivities.has(activityKey)) {
      return;
    }

    let activityType: 'daily_verse' | 'daily_prayer' | 'daily_reflection' | undefined;
    let xpEarned = 10;

    if (cardId === '1') {
      activityType = 'daily_verse';
    } else if (cardId === '2') {
      activityType = 'daily_prayer';
    } else if (cardId === '3') {
      activityType = 'daily_reflection';
    }

    if (activityType) {
      sessionTracker.trackActivity(activityType, xpEarned, {
        action: 'read',
        cardId,
        duration: 8,
      });

      // Mark as completed
      setCompletedActivities(prev => new Set(prev).add(activityKey));
      console.log(`✅ Tracked: ${activityType} (read) (+${xpEarned} XP)`);
    }
  };

  /* Track when user listens to a card (TTS) */
  const trackCardListen = (cardId: string) => {
    const activityKey = `${cardId}_listen`;
    
    // Don't track if already completed
    if (completedActivities.has(activityKey)) {
      return;
    }

    let activityType: 'daily_verse' | 'daily_prayer' | 'daily_reflection' | undefined;
    let xpEarned = 15; // More XP for listening

    if (cardId === '1') {
      activityType = 'daily_verse';
    } else if (cardId === '2') {
      activityType = 'daily_prayer';
    } else if (cardId === '3') {
      activityType = 'daily_reflection';
    }

    if (activityType) {
      sessionTracker.trackActivity(activityType, xpEarned, {
        action: 'listen',
        cardId,
      });

      // Mark as completed
      setCompletedActivities(prev => new Set(prev).add(activityKey));
      console.log(`✅ Tracked: ${activityType} (listen) (+${xpEarned} XP)`);
    }
  };

  /* Handle read action */
  const handleRead = (cardTitle: string) => {
    // Find the card data and show in modal
    const currentCardsData = getCardsData();
    const card = currentCardsData.find(c => c.title === cardTitle);
    if (card) {
      setCurrentReadTitle(card.title);
      setCurrentReadContent(card.content);
      setShowReadModal(true);
      
      // Track activity based on card type
      const activityTracker = ActivityTrackerService.getInstance();
      if (cardTitle.includes('Prayer') || cardTitle.includes('prayer')) {
        activityTracker.trackPrayerSaid();
      } else if (cardTitle.includes('Verse') || cardTitle.includes('verse')) {
        activityTracker.trackVerseRead();
      } else if (cardTitle.includes('Reflection') || cardTitle.includes('reflection')) {
        activityTracker.trackReflectionCompleted();
      }
    }
  };

  /* Handle listen action */
  const handleListen = async (cardTitle: string) => {
    try {
      // Check if user has set a voice preference
      let savedVoiceId = await SecureStore.getItemAsync('userVoiceId');
      
      // If not in SecureStore, try loading from TTS settings (which loads from API)
      if (!savedVoiceId && settings.voice) {
        savedVoiceId = settings.voice;
      }
      
      if (!savedVoiceId) {
        // No voice set - prompt user to go to settings
        Alert.alert(
          'Set Voice Preference',
          'Please set your preferred voice in Account Settings before using read-aloud features.',
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Go to Settings',
              onPress: () => {
                // Navigate to account settings
                router.push('/account-settings');
              }
            }
          ]
        );
        return;
      }
      
      // Voice is set - proceed with TTS
    const currentCardsData = getCardsData();
    const card = currentCardsData.find(c => c.title === cardTitle);
    if (card) {
      setCurrentTTSTitle(card.title);
      setCurrentTTSContent(card.content);
        
        // Update TTS settings to ensure voice is set
        updateSettings({ voice: savedVoiceId });
        
        // Show modal and start playing with saved voice
        setShowTTSModal(true);
        
        // Small delay to ensure modal is rendered before speaking
        setTimeout(() => {
          speak(card.content, { voice: savedVoiceId });
          
          // Track listen activity
          trackCardListen(card.id);
        }, 100);
      
      // Track activity based on card type
      const activityTracker = ActivityTrackerService.getInstance();
      if (cardTitle.includes('Prayer') || cardTitle.includes('prayer')) {
        activityTracker.trackPrayerSaid();
      } else if (cardTitle.includes('Verse') || cardTitle.includes('verse')) {
        activityTracker.trackVerseRead();
      } else if (cardTitle.includes('Reflection') || cardTitle.includes('reflection')) {
        activityTracker.trackReflectionCompleted();
      }
      }
    } catch (error) {
      console.error('❌ Error in handleListen:', error);
      Alert.alert('Error', 'Failed to start read-aloud. Please try again.');
    }
  };

  /* Handle TTS actions */
  const handleTTSToggle = () => {
    togglePlayPause();
  };

  const handleTTSStop = () => {
    stop();
  };

  const handleTTSClose = () => {
    stop();
    setShowTTSModal(false);
  };

  // Voice selection handlers
  const handleVoiceSelect = (voiceId: string) => {
    setSelectedVoice(voiceId);
    updateSettings({ voice: voiceId });
    setShowVoiceSelector(false);
    
    // After voice selection, show TTS modal and start playing
    setShowTTSModal(true);
    speak(currentTTSContent, { voice: voiceId });
  };

  const handleVoiceChange = () => {
    if (isPlaying) {
      // If currently playing, restart with new voice
      speak(currentText, { voice: selectedVoice });
    }
  };







  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* ───── Top Bar ───── */}
          <View style={styles.topBar}>
          {/* Profile icon */}
          <TouchableOpacity 
            style={styles.profileIconContainer}
            activeOpacity={0.7}
          >
            {userData?.picture ? (
              <Image 
                source={{ uri: userData.picture }} 
                style={styles.profileImage}
                resizeMode="cover"
                onError={() => {
                  console.log('❌ Failed to load profile image, falling back to icon');
                  setUserData((prev: any) => ({ ...prev, picture: null }));
                }}
              />
            ) : (
              <View style={styles.iconContainer}>
                <Ionicons name="person" size={40} color={DARK_GRAY} />
        </View>
            )}
          </TouchableOpacity>

          {/* Welcome Message */}
          <Animated.View style={[styles.welcomeContainer, { opacity: welcomeOpacity }]}>
            <LinearGradient
              colors={['rgba(123, 77, 98, 0.1)', 'rgba(206, 112, 63, 0.1)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.glassBackground}
            >
              <View style={styles.glassCard}>
                <Text style={styles.welcomeText}>
                  {getGreeting()}, {userData?.name?.split(' ')[0] || 'Friend'}! 👋
                </Text>
                <Text style={styles.welcomeSubtext}>
                  Ready for your spiritual journey today?
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>

        {/* ───── Body ───── */}
        <View style={styles.cardsContainer}>
          {/* ───── Streak & Progress Header ───── */}
          {!loadingStats && (
            <View style={styles.gamificationHeader}>
                  <LinearGradient
                colors={['#2C1B47', '#5B3A7D', '#8B5A9E']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                style={styles.streakCard}
                  >
                {/* Top Stats Row */}
                <View style={styles.topStatsRow}>
                  <View style={styles.streakBadge}>
                    <Ionicons name="flame" size={24} color="#FF6B35" />
                    <View>
                      <Text style={styles.streakNumber}>{enhancedStreakData?.currentStreak || 0}</Text>
                      <Text style={styles.streakDaysLabel}>Day Streak</Text>
                </View>
                </View>
                  
                  <View style={styles.levelBadgeNew}>
                    <Ionicons name="star" size={20} color="#FFD700" />
                    <View>
                      <Text style={styles.levelNumberNew}>Level {enhancedStreakData?.level || 1}</Text>
                      <Text style={styles.levelLabelNew}>Rank</Text>
                    </View>
                </View>
              </View>

                {/* Level Progress Bar */}
                {enhancedStreakData?.xpToNextLevel ? (
                  <View style={styles.levelProgressContainer}>
                    <View style={styles.levelProgressHeader}>
                      <Text style={styles.levelProgressTitle}>Level Progress</Text>
                      <Text style={styles.levelProgressXP}>
                        {enhancedStreakData.totalXP || 0} / {(enhancedStreakData.totalXP || 0) + (enhancedStreakData.xpToNextLevel || 0)} XP
                  </Text>
                </View>
                    <View style={styles.levelProgressBarBg}>
                      <LinearGradient
                        colors={['#FFD700', '#FFA500']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[
                          styles.levelProgressBarFill, 
                        { width: `${Math.min(100, ((enhancedStreakData.totalXP || 0) / ((enhancedStreakData.totalXP || 0) + (enhancedStreakData.xpToNextLevel || 1))) * 100)}%` }
                        ]}
                      />
                    </View>
                    <Text style={styles.levelProgressDetail}>
                      {enhancedStreakData.xpToNextLevel} XP to Level {(enhancedStreakData.level || 1) + 1}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.levelProgressContainer}>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontSize: 12 }}>
                      Loading progress...
                    </Text>
            </View>
          )}

                {/* Bottom Stats Grid */}
                <View style={styles.bottomStatsGrid}>
                  <View style={styles.statItem}>
                    <Ionicons name="trophy" size={18} color="#FFD700" />
                    <Text style={styles.statValue}>{enhancedStreakData?.longestStreak || 0}</Text>
                    <Text style={styles.statLabel}>Best Streak</Text>
              </View>
                  
                  <View style={styles.statDivider} />
                  
                  <View style={styles.statItem}>
                    <Ionicons name="time" size={18} color="#A78BFA" />
                    <Text style={styles.statValue}>{formatTime(todayUsage?.seconds || 0)}</Text>
                    <Text style={styles.statLabel}>Today</Text>
                </View>
              
                  <View style={styles.statDivider} />
                  
                  <View style={styles.statItem}>
                    <Ionicons name="calendar" size={18} color="#60A5FA" />
                    <Text style={styles.statValue}>{enhancedStreakData?.totalActiveDays || 0}</Text>
                    <Text style={styles.statLabel}>Total Days</Text>
                </View>
                  </View>
              </LinearGradient>
                  </View>
          )}

          {/* ───── Daily Missions (Cards) ───── */}
          <View style={styles.missionsHeader}>
            <Ionicons name="clipboard" size={20} color={PRIMARY_COLOR} />
            <Text style={styles.missionsTitle}>Today's Spiritual Missions</Text>
              </View>
              

          {getCardsData().map((item, index) => {
            const expanded = selectedCard === item.id;
            const missionNumber = index + 1;
            
            // Check if mission is complete from backend
            let missionComplete = false;
            if (dailyProgress.goals && dailyProgress.goals.length > 0) {
              const goalType = item.id === '1' ? 'daily_verse' : 
                              item.id === '2' ? 'daily_prayer' : 
                              'daily_reflection';
              const goal = dailyProgress.goals.find((g: any) => g.type === goalType);
              missionComplete = goal?.completed || false;
            }
            
            return (
              <TouchableOpacity key={item.id} onPress={() => toggleCard(item.id)} activeOpacity={0.9}>
                <LinearGradient
                  colors={[PRIMARY_COLOR, SECONDARY_COLOR]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={[
                    styles.cardBase,
                    expanded ? styles.cardExpanded : styles.cardCollapsed,
                  ]}
                >
                  {/* Mission Badge */}
                  <View style={styles.missionBadge}>
                    <Text style={styles.missionNumber}>Mission {missionNumber}</Text>
                    {missionComplete && (
                      <View style={styles.completeBadge}>
                        <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                        <Text style={styles.completeText}>Completed</Text>
                      </View>
                    )}
                  </View>

                  {/* Card header with chevron */}
                  <View style={styles.cardHeader}>
                    <View style={styles.cardTitleRow}>
                      <Ionicons 
                        name={
                          item.id === '1' ? 'book' : 
                          item.id === '2' ? 'heart' : 
                          'bulb'
                        } 
                        size={22} 
                        color={WHITE} 
                      />
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    </View>
                    <Ionicons
                      name={expanded ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={WHITE}
                    />
                  </View>

                  {expanded && (
                    <>
                      <Text style={styles.cardDesc}>{item.description}</Text>
                      <Text style={styles.cardContent}>{item.content}</Text>
                      <View style={styles.actionRow}>
                        <TouchableOpacity 
                          style={styles.actionButton}
                          onPress={() => handleRead(item.title)}
                        >
                          <Ionicons name="book" size={16} color={PRIMARY_COLOR} />
                          <Text style={styles.actionText}>Read</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[
                            styles.actionButton,
                            currentText === item.content && isPlaying && styles.actionButtonActive
                          ]}
                          onPress={() => {
                            if (currentText === item.content && (isPlaying || isPaused)) {
                              handleTTSToggle();
                            } else {
                              handleListen(item.title);
                            }
                          }}
                        >
                          <Ionicons 
                            name={
                              currentText === item.content && isPlaying 
                                ? (isPaused ? 'play' : 'pause') 
                                : 'headset'
                            } 
                            size={16} 
                            color={PRIMARY_COLOR} 
                          />
                          <Text style={styles.actionText}>
                            {currentText === item.content && isPlaying 
                              ? (isPaused ? 'Play' : 'Pause') 
                              : 'Listen'
                            }
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ───── Achievements & Milestones ───── */}
        {enhancedStreakData && enhancedStreakData.currentStreak >= 3 && (
          <View style={styles.achievementsSection}>
            <View style={styles.achievementsHeader}>
              <Ionicons name="trophy" size={20} color="#FFD700" />
              <Text style={styles.achievementsTitle}>Your Achievements</Text>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.achievementsScroll}
            >
              {/* Streak Milestones */}
              {[3, 7, 14, 30, 60, 100].map((days) => {
                const achieved = (enhancedStreakData.longestStreak || 0) >= days;
                return (
                  <View 
                    key={days}
                    style={[
                      styles.achievementCard,
                      achieved ? styles.achievementAchieved : styles.achievementLocked
                    ]}
                  >
                    <View style={styles.achievementBadge}>
                      <Ionicons 
                        name={achieved ? "medal" : "lock-closed"} 
                        size={32} 
                        color={achieved ? "#FFD700" : "#999"} 
                      />
                    </View>
                    <Text style={[
                      styles.achievementName,
                      achieved && styles.achievementNameAchieved
                    ]}>
                      {days} Day Streak
                    </Text>
                    {achieved && (
                      <Text style={styles.achievementDate}>Unlocked! 🎉</Text>
                    )}
                  </View>
                );
              })}
              
              {/* Daily Completion Achievement */}
              {dailyProgress.allMissionsComplete && (
                <View style={[styles.achievementCard, styles.achievementAchieved]}>
                  <View style={styles.achievementBadge}>
                    <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
                  </View>
                  <Text style={[styles.achievementName, styles.achievementNameAchieved]}>
                    Daily Complete
                  </Text>
                  <Text style={styles.achievementDate}>Today! ✅</Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}

        {/* ───── Prayer and Care Circle - Instagram Style ───── */}
        {prayerStories.length > 0 && (
          <LinearGradient
            colors={['rgba(123, 77, 98, 0.1)', 'rgba(206, 112, 63, 0.1)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.storiesGlassBackground}
          >
            <View style={styles.storiesGlassCard}>
              <View style={styles.storiesHeader}>
                <Text style={styles.storiesTitle}>Prayer and Care Circle</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/prayer')}>
                  <Text style={styles.storiesViewAll}>View All</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.storiesScrollContainer}
              >
                {prayerStories.map((story, index) => (
                  <TouchableOpacity 
                    key={story.id} 
                    style={styles.storyCircle}
                    activeOpacity={0.8}
                    onPress={() => openStoryViewer(story, index)}
                  >
                    <View style={styles.storyRing}>
                      <View style={styles.storyAvatarContainer}>
                        {story.userPicture ? (
                          <Image 
                            source={{ uri: story.userPicture }} 
                            style={styles.storyAvatar}
                          />
                        ) : (
                        <View style={styles.storyAvatarPlaceholder}>
                          <Ionicons name="person" size={20} color={WHITE} />
                        </View>
                        )}
                      </View>
                      {/* Multiple stories indicator */}
                      {story.stories && story.stories.length > 1 && (
                        <View style={styles.multipleStoriesBadge}>
                          <Text style={styles.multipleStoriesText}>{story.stories.length}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.storyUserName} numberOfLines={1}>
                      {story.isAnonymous ? 'Anonymous' : story.userName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </LinearGradient>
        )}
        </View>
      </ScrollView>

      {/* Custom Read Modal */}
      {showReadModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.readModalContent}>
            <LinearGradient
              colors={[PRIMARY_COLOR, SECONDARY_COLOR]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.readModalGradient}
            >
              <View style={styles.readModalHeader}>
                <Text style={styles.readModalTitle}>{currentReadTitle}</Text>
                <TouchableOpacity onPress={() => setShowReadModal(false)}>
                  <Ionicons name="close" size={24} color={WHITE} />
                </TouchableOpacity>
              </View>
              <Text style={styles.readModalText}>{currentReadContent}</Text>
            </LinearGradient>
          </View>
        </View>
      )}

      {/* TTS Modal */}
      {showTTSModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.ttsModalContent}>
            <LinearGradient
              colors={[PRIMARY_COLOR, SECONDARY_COLOR]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ttsModalGradient}
            >
              <View style={styles.ttsModalHeader}>
                <View style={styles.ttsTitleContainer}>
                  <Ionicons name="headset" size={24} color={WHITE} style={{ marginRight: 8 }} />
                  <Text style={styles.ttsModalTitle}>{currentTTSTitle}</Text>
                </View>
                <TouchableOpacity onPress={handleTTSClose}>
                  <Ionicons name="close" size={24} color={WHITE} />
                </TouchableOpacity>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${progress}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>{Math.round(progress)}%</Text>
              </View>

              {/* TTS Controls */}
              <View style={styles.ttsControls}>
                <TouchableOpacity 
                  style={styles.ttsControlButton}
                  onPress={handleTTSToggle}
                >
                  <Ionicons 
                    name={isPlaying ? (isPaused ? 'play' : 'pause') : 'play'} 
                    size={32} 
                    color={WHITE} 
                  />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.ttsControlButton, styles.ttsStopButton]}
                  onPress={handleTTSStop}
                >
                  <Ionicons name="stop" size={24} color={WHITE} />
                </TouchableOpacity>
              </View>

              {/* Status Text */}
              <Text style={styles.ttsStatusText}>
                {isPlaying ? (isPaused ? 'Paused - Click to resume' : 'Playing...') : 'Ready to play'}
              </Text>

              {/* Content Preview */}
              <View style={styles.ttsContentPreview}>
                <Text style={styles.ttsContentText} numberOfLines={3}>
                  {currentTTSContent}
                </Text>
              </View>
            </LinearGradient>
          </View>
        </View>
      )}

      {/* Voice Selector Modal */}
      {showVoiceSelector && (
        <View style={styles.modalOverlay}>
          <View style={styles.voiceModalContent}>
            <LinearGradient
              colors={[PRIMARY_COLOR, SECONDARY_COLOR]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.voiceModalGradient}
            >
              <View style={styles.voiceModalHeader}>
                <Text style={styles.voiceModalTitle}>Select Voice</Text>
                <TouchableOpacity onPress={() => setShowVoiceSelector(false)}>
                  <Ionicons name="close" size={24} color={WHITE} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.voiceList} showsVerticalScrollIndicator={false}>
                {/* Default Voice Option */}
                <TouchableOpacity 
                  style={[
                    styles.voiceOption,
                    !selectedVoice && styles.voiceOptionSelected
                  ]}
                  onPress={() => handleVoiceSelect('')}
                >
                  <View style={styles.voiceOptionContent}>
                    <Ionicons name="volume-high" size={20} color={WHITE} />
                    <Text style={styles.voiceOptionName}>Default Voice</Text>
                  </View>
                  {!selectedVoice && (
                    <Ionicons name="checkmark" size={20} color={WHITE} />
                  )}
                </TouchableOpacity>

                {/* Available Voices */}
                {availableVoices.map((voice) => (
                  <TouchableOpacity 
                    key={voice.identifier}
                    style={[
                      styles.voiceOption,
                      selectedVoice === voice.identifier && styles.voiceOptionSelected
                    ]}
                    onPress={() => handleVoiceSelect(voice.identifier)}
                  >
                    <View style={styles.voiceOptionContent}>
                      <Ionicons name="person" size={20} color={WHITE} />
                      <View style={styles.voiceInfo}>
                        <Text style={styles.voiceOptionName}>
                          {voice.name || 'Unknown Voice'}
                        </Text>
                        <Text style={styles.voiceOptionDetails}>
                          {`${voice.language || 'Unknown'}${voice.quality ? ` • ${voice.quality}` : ''}`}
                        </Text>
                      </View>
                    </View>
                    {selectedVoice === voice.identifier && (
                      <Ionicons name="checkmark" size={20} color={WHITE} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </LinearGradient>
          </View>
        </View>
      )}

      {/* Story Viewer Modal */}
      {showStoryViewer && selectedStory && (
        <View style={styles.storyModalOverlay}>
          <View style={styles.storyModalContainer}>
            {/* Story Header */}
            <View style={styles.storyHeader}>
              <View style={styles.storyUserInfo}>
                <View style={styles.storyUserAvatar}>
                  {selectedStory.userPicture ? (
                    <Image 
                      source={{ uri: selectedStory.userPicture }} 
                      style={styles.storyUserAvatarImage}
                    />
                  ) : (
                    <View style={styles.storyUserAvatarPlaceholder}>
                      <Ionicons name="person" size={24} color={WHITE} />
                    </View>
                  )}
                </View>
                <View style={styles.storyUserDetails}>
                  <Text style={styles.storyModalUserName}>{selectedStory.userName}</Text>
                  <Text style={styles.storyTime}>
                    {new Date(selectedStory.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={closeStoryViewer} style={styles.storyCloseButton}>
                <Ionicons name="close" size={24} color={WHITE} />
              </TouchableOpacity>
            </View>

            {/* Story Content */}
            <ScrollView style={styles.storyContent} showsVerticalScrollIndicator={false}>
              {/* Prayer Card */}
              <View style={styles.prayerStoryCard}>
                {/* Card Header */}
                <View style={styles.prayerCardHeader}>
                  {/* Meta Badges */}
                  <View style={styles.prayerCardMeta}>
                    {selectedStory?.isUrgent && (
                      <View style={styles.prayerCardUrgentBadge}>
                        <Ionicons name="flash" size={12} color={WHITE} />
                        <Text style={styles.prayerCardUrgentText}>Urgent</Text>
                      </View>
                    )}
                    {selectedStory?.category && (
                      <View style={styles.prayerCardCategoryBadge}>
                        <Ionicons name={getCategoryIcon(selectedStory.category) as any} size={12} color={WHITE} />
                        <Text style={styles.prayerCardCategoryText}>{selectedStory.category}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Prayer Content */}
                <View style={styles.prayerCardContent}>
                  <Text style={styles.prayerCardTitle}>{selectedStory?.title || 'No Title'}</Text>
                  <Text 
                    style={styles.prayerCardDescription}
                    numberOfLines={shouldShowViewMore(selectedStory?.description || '') ? 6 : undefined}
                    ellipsizeMode="tail"
                  >
                    {selectedStory?.description || 'No Description'}
                  </Text>
                  {shouldShowViewMore(selectedStory?.description || '') && (
                    <TouchableOpacity 
                      style={styles.viewMoreButton}
                      onPress={() => openViewMore(selectedStory.title, selectedStory.description)}
                    >
                      <Text style={styles.viewMoreText}>View More</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Reply Action */}
                <View style={styles.prayerCardActions}>
                  <TouchableOpacity 
                    style={styles.prayerCardReplyButton}
                    onPress={() => {
                      closeStoryViewer();
                      router.push(`/(tabs)/prayer?postId=${selectedStory?.id}&autoOpenModal=true`);
                    }}
                  >
                    <Ionicons name="chatbubbles-outline" size={16} color={WHITE} />
                    <Text style={styles.prayerCardReplyText}>Reply</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            {/* Navigation Controls - Floating */}
            <View style={styles.storyNavigationFloating}>
              <TouchableOpacity 
                onPress={goToPreviousStory}
                style={[styles.storyNavButtonFloating, (() => {
                  const currentGroup = prayerStories[currentStoryIndex];
                  const currentStoryInGroup = selectedStory;
                  
                  // Check if we're at the first story in the first group
                  if (currentStoryIndex === 0) {
                    if (currentGroup?.stories && currentGroup.stories.length > 1) {
                      const currentStoryIndexInGroup = currentGroup.stories.findIndex((s: any) => s.id === currentStoryInGroup?.id);
                      return currentStoryIndexInGroup === 0;
                    }
                    return true; // First group, first story
                  }
                  return false;
                })() && styles.storyNavButtonFloatingDisabled]}
                disabled={(() => {
                  const currentGroup = prayerStories[currentStoryIndex];
                  const currentStoryInGroup = selectedStory;
                  
                  // Check if we're at the first story in the first group
                  if (currentStoryIndex === 0) {
                    if (currentGroup?.stories && currentGroup.stories.length > 1) {
                      const currentStoryIndexInGroup = currentGroup.stories.findIndex((s: any) => s.id === currentStoryInGroup?.id);
                      return currentStoryIndexInGroup === 0;
                    }
                    return true; // First group, first story
                  }
                  return false;
                })()}
              >
                <Ionicons name="chevron-back" size={18} color={WHITE} />
              </TouchableOpacity>
              
              <View style={styles.storyProgressFloating}>
                <Text style={styles.storyProgressFloatingText}>
                  {(() => {
                    const currentGroup = prayerStories[currentStoryIndex];
                    const currentStoryInGroup = selectedStory;
                    let currentStoryIndexInGroup = 0;
                    let totalStoriesInGroup = 1;
                    
                    if (currentGroup?.stories && currentGroup.stories.length > 1) {
                      currentStoryIndexInGroup = currentGroup.stories.findIndex((s: any) => s.id === currentStoryInGroup?.id);
                      totalStoriesInGroup = currentGroup.stories.length;
                    }
                    
                    return `${currentStoryIndexInGroup + 1}/${totalStoriesInGroup}`;
                  })()}
                </Text>
              </View>
              
              <TouchableOpacity 
                onPress={goToNextStory}
                style={[styles.storyNavButtonFloating, (() => {
                  const currentGroup = prayerStories[currentStoryIndex];
                  const currentStoryInGroup = selectedStory;
                  
                  // Check if we're at the last story in the last group
                  if (currentStoryIndex === prayerStories.length - 1) {
                    if (currentGroup?.stories && currentGroup.stories.length > 1) {
                      const currentStoryIndexInGroup = currentGroup.stories.findIndex((s: any) => s.id === currentStoryInGroup?.id);
                      return currentStoryIndexInGroup === currentGroup.stories.length - 1;
                    }
                    return true; // Last group, last story
                  }
                  return false;
                })() && styles.storyNavButtonFloatingDisabled]}
                disabled={(() => {
                  const currentGroup = prayerStories[currentStoryIndex];
                  const currentStoryInGroup = selectedStory;
                  
                  // Check if we're at the last story in the last group
                  if (currentStoryIndex === prayerStories.length - 1) {
                    if (currentGroup?.stories && currentGroup.stories.length > 1) {
                      const currentStoryIndexInGroup = currentGroup.stories.findIndex((s: any) => s.id === currentStoryInGroup?.id);
                      return currentStoryIndexInGroup === currentGroup.stories.length - 1;
                    }
                    return true; // Last group, last story
                  }
                  return false;
                })()}
              >
                <Ionicons name="chevron-forward" size={18} color={WHITE} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* View More Modal */}
      {showViewMoreModal && (
        <View style={styles.viewMoreModalOverlay}>
          <View style={styles.viewMoreModalContainer}>
            <View style={styles.viewMoreModalHeader}>
              <Text style={styles.viewMoreModalTitle}>{viewMoreTitle}</Text>
              <TouchableOpacity onPress={closeViewMore} style={styles.viewMoreCloseButton}>
                <Ionicons name="close" size={24} color={WHITE} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.viewMoreModalContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.viewMoreModalText}>{viewMoreContent}</Text>
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

/* ───────────────────────── Styles ───────────────────────── */
const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#f5f7fa'  // Subtle background for glassmorphism
  },
  container: {
    flex: 1, 
    backgroundColor: 'transparent',
    paddingHorizontal: 24, 
    paddingTop: STATUS_BAR_OFFSET,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  cardsContainer: {
    paddingBottom: 40,
  },

  /* Top Bar */
  topBar: {
    flexDirection: 'row', 
    alignItems: 'center',
    marginBottom: 32,
    paddingLeft: 0,
    paddingRight: 20,
  },

  /* Body content */
  contentContainer: { paddingBottom: 40 },

  /* Cards - Glassmorphism Design */
  cardBase: {
    borderRadius: 24, 
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',  // Semi-transparent white
    backdropFilter: 'blur(20px)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',  // Subtle white border
    overflow: 'hidden',
  },
  cardCollapsed: { 
    paddingVertical: 16, 
    paddingHorizontal: 20 
  },
  cardExpanded:  { 
    padding: 22 
  },
  
  // Gamification Styles
  gamificationHeader: {
    marginBottom: 24,
  },
  streakCard: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  // New Elegant Design Styles
  topStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
    flex: 1,
  },
  streakNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: WHITE,
    fontFamily: 'serif',
  },
  streakDaysLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'serif',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  levelBadgeNew: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  levelNumberNew: {
    fontSize: 24,
    fontWeight: 'bold',
    color: WHITE,
    fontFamily: 'serif',
  },
  levelLabelNew: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'serif',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  levelProgressContainer: {
    marginBottom: 20,
  },
  levelProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  levelProgressTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'serif',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  levelProgressXP: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFD700',
    fontFamily: 'serif',
  },
  levelProgressBarBg: {
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  levelProgressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  levelProgressDetail: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'serif',
    textAlign: 'center',
  },
  bottomStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: WHITE,
    fontFamily: 'serif',
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'serif',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  streakTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  streakInfo: {
    flex: 1,
  },
  levelBadgeContainer: {
    alignItems: 'flex-end',
  },
  levelBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 2,
    borderColor: '#FFD700',
    flex: 1,
  },
  levelLabel: {
    color: '#FFD700',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: 'serif',
    textTransform: 'uppercase',
  },
  levelValue: {
    color: WHITE,
    fontSize: 20,
    fontWeight: '800',
    fontFamily: 'serif',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  xpProgressMini: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  xpText: {
    color: WHITE,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'serif',
  },
  xpProgressSection: {
    marginBottom: 16,
  },
  xpProgressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  xpProgressLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'serif',
  },
  xpProgressNext: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'serif',
  },
  xpProgressDetail: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    fontWeight: '500',
    fontFamily: 'serif',
    textAlign: 'center',
    marginTop: 6,
  },
  xpProgressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpProgressBarFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  streakLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    fontFamily: 'serif',
    marginBottom: 4,
  },
  streakValue: {
    color: WHITE,
    fontSize: 32,
    fontWeight: '800',
    fontFamily: 'serif',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  streakMessage: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'serif',
    marginTop: 4,
    fontStyle: 'italic',
  },
  freezeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  freezeText: {
    color: WHITE,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'serif',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'serif',
  },
  progressPercentage: {
    color: WHITE,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'serif',
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 6,
  },
  progressDetail: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    fontFamily: 'serif',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  miniStat: {
    alignItems: 'center',
    gap: 4,
  },
  miniStatValue: {
    color: WHITE,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'serif',
  },
  miniStatLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    fontFamily: 'serif',
  },
  missionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  missionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PRIMARY_COLOR,
    fontFamily: 'serif',
  },
  motivationalCard: {
    backgroundColor: 'rgba(123, 77, 98, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: PRIMARY_COLOR,
  },
  motivationalText: {
    color: PRIMARY_COLOR,
    fontSize: 14,
    fontFamily: 'serif',
    lineHeight: 20,
    fontWeight: '500',
  },
  
  // Achievements
  achievementsSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  achievementsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  achievementsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK_GRAY,
    fontFamily: 'serif',
  },
  achievementsScroll: {
    paddingRight: 20,
    gap: 12,
  },
  achievementCard: {
    width: 120,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
  },
  achievementLocked: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  achievementAchieved: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderColor: '#FFD700',
  },
  achievementBadge: {
    marginBottom: 8,
  },
  achievementName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    textAlign: 'center',
    fontFamily: 'serif',
  },
  achievementNameAchieved: {
    color: DARK_GRAY,
  },
  achievementDate: {
    fontSize: 11,
    color: PRIMARY_COLOR,
    marginTop: 4,
    fontFamily: 'serif',
  },
  
  missionBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  missionNumber: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: 'serif',
  },
  completeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  completeText: {
    color: '#4CAF50',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'serif',
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 215, 0, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    marginTop: 8,
    marginBottom: 12,
  },
  xpText: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'serif',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  cardTitle: {
    color: WHITE, 
    fontSize: 19, 
    fontWeight: '700', 
    fontFamily: 'serif',
    letterSpacing: 0.4,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cardDesc: {
    marginVertical: 16, 
    color: 'rgba(255,255,255,0.95)',
    fontSize: 15, 
    fontFamily: 'serif',
    lineHeight: 23,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardContent: {
    marginVertical: 18, 
    color: WHITE,
    fontSize: 15, 
    fontFamily: 'serif',
    lineHeight: 25,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  actionRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-evenly', 
    marginTop: 18,
    gap: 14,
  },
  actionButton: {
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255, 255, 255, 0.9)',  // Glassmorphic button
    paddingVertical: 13, 
    paddingHorizontal: 26, 
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  actionText: {
    color: PRIMARY_COLOR, 
    marginLeft: 8, 
    fontWeight: '700',
    fontFamily: 'serif', 
    fontSize: 15,
  },
  actionButtonActive: {
    backgroundColor: 'rgba(227, 213, 202, 0.95)',
    borderWidth: 1.5,
    borderColor: PRIMARY_COLOR,
  },

  /* Modal Styles - Glassmorphism */
  modalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',  // Lighter overlay for glassmorphism
    justifyContent: 'center', alignItems: 'center',
    zIndex: 1000,
  },
  readModalContent: {
    width: width * 0.9,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',  // Glassmorphic modal
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  readModalGradient: {
    padding: 24,
  },
  readModalHeader: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 16,
  },
  readModalTitle: {
    color: WHITE, fontSize: 20, fontWeight: 'bold', fontFamily: 'serif',
  },
  readModalText: {
    color: WHITE, fontSize: 16, fontFamily: 'serif', lineHeight: 24,
  },

  /* TTS Modal Styles - Glassmorphism */
  ttsModalContent: {
    width: width * 0.9,
    maxHeight: '80%',
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  ttsModalGradient: {
    padding: 26,
  },
  ttsModalHeader: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 24,
  },
  ttsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ttsModalTitle: {
    color: WHITE, 
    fontSize: 21, 
    fontWeight: '700', 
    fontFamily: 'serif',
    flex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: WHITE,
    borderRadius: 4,
  },
  progressText: {
    color: WHITE,
    fontSize: 13,
    textAlign: 'center',
    fontFamily: 'serif',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  ttsControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    gap: 32,
  },
  ttsControlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  ttsStopButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255,0,0,0.35)',
    borderColor: 'rgba(255,0,0,0.6)',
  },
  ttsStatusText: {
    color: WHITE,
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'serif',
    marginBottom: 18,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  ttsContentPreview: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  ttsContentText: {
    color: WHITE,
    fontSize: 15,
    fontFamily: 'serif',
    lineHeight: 22,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Change Voice Button Styles
  changeVoiceContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  changeVoiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  changeVoiceText: {
    color: WHITE,
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
    fontFamily: 'serif',
  },

  // Voice Selection Styles
  voiceSelectionContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    minWidth: 200,
    justifyContent: 'center',
  },
  voiceButtonText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '500',
    marginHorizontal: 8,
    fontFamily: 'serif',
  },

  // Voice Modal Styles
  voiceModalContent: {
    width: width * 0.9,
    maxHeight: '70%',
    borderRadius: 15,
    overflow: 'hidden',
  },
  voiceModalGradient: {
    padding: 20,
  },
  voiceModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  voiceModalTitle: {
    color: WHITE,
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'serif',
  },
  voiceList: {
    maxHeight: 300,
  },
  voiceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  voiceOptionSelected: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderColor: 'rgba(255,255,255,0.5)',
  },
  voiceOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  voiceInfo: {
    marginLeft: 12,
    flex: 1,
  },
  voiceOptionName: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'serif',
  },
  voiceOptionDetails: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontFamily: 'serif',
    marginTop: 2,
  },
  
  // Stats Dashboard Styles - Minimal
  statsContainer: {
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  statBoxMinimal: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },
  statGradientMinimal: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 75,
  },
  statValueMinimal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: WHITE,
    marginTop: 4,
    marginBottom: 2,
  },
  statLabelMinimal: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badgeContainerMinimal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,215,0,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
    alignSelf: 'center',
  },
  badgeTextMinimal: {
    fontSize: 11,
    fontWeight: '600',
    color: DARK_GRAY,
    marginLeft: 4,
  },
  
  // Daily Flow Timeframes Styles
  timeframesContainer: {
    marginBottom: 15,
  },
  timeframesCard: {
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  timeframesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  timeframesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: WHITE,
    marginLeft: 8,
  },
  timeframesSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
    lineHeight: 16,
  },
  timeframesList: {
    marginBottom: 8,
  },
  timeframeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  timeframeIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  timeframeContent: {
    flex: 1,
  },
  timeframeTask: {
    fontSize: 13,
    fontWeight: '500',
    color: WHITE,
    marginBottom: 1,
  },
  timeframeDuration: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  timeframesFooter: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  timeframesTotal: {
    fontSize: 12,
    fontWeight: '600',
    color: WHITE,
    textAlign: 'center',
  },
  
  // Profile Icon Container
  profileIconContainer: {
    marginLeft: 0,
    backgroundColor: 'transparent',
    borderRadius: 20,
    overflow: 'hidden',
  },
  // Profile Image Style
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  // Icon Container for fallback
  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Welcome Message Styles
  welcomeContainer: {
    flex: 1,
    marginLeft: 15,
  },
  glassBackground: {
    borderRadius: 20,
    padding: 2,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    // Glass effect for iOS
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    // Glass effect for Android
    elevation: 3,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: DARK_GRAY,
    fontFamily: 'serif',
    marginBottom: 2,
  },
  welcomeSubtext: {
    fontSize: 14,
    color: 'rgba(73, 80, 87, 0.8)',
    fontFamily: 'serif',
    fontStyle: 'italic',
  },
  
  // Prayer and Care Circle - Instagram Style
  storiesContainer: {
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    // Glass effect for iOS
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    // Glass effect for Android
    elevation: 3,
  },
  storiesGlassBackground: {
    borderRadius: 20,
    padding: 2,
    marginBottom: 20,
  },
  storiesGlassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    // Glass effect for iOS
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    // Glass effect for Android
    elevation: 3,
  },
  storiesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  storiesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: DARK_GRAY,
  },
  storiesViewAll: {
    fontSize: 14,
    color: PRIMARY_COLOR,
    fontWeight: '600',
  },
  storiesScrollContainer: {
    paddingLeft: 8,
  },
  storyCircle: {
    alignItems: 'center',
    marginRight: 12,
    width: 60,
  },
  storyRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    padding: 2,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  storyAvatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: OFF_WHITE,
  },
  storyAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  storyAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: SOFT_GRAY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyUserName: {
    fontSize: 11,
    fontWeight: '500',
    color: DARK_GRAY,
    textAlign: 'center',
    maxWidth: 50,
  },
  multipleStoriesBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: SECONDARY_COLOR,
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: WHITE,
  },
  multipleStoriesText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: WHITE,
  },
  
  // Story Viewer Modal
  storyModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    zIndex: 1000,
  },
  storyModalContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 100,
    paddingBottom: 40,
  },
  storyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  storyUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  storyUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    overflow: 'hidden',
    backgroundColor: OFF_WHITE,
    borderWidth: 2,
    borderColor: WHITE,
  },
  storyUserAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  storyUserAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SOFT_GRAY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyUserDetails: {
    flex: 1,
  },
  storyModalUserName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: WHITE,
    marginBottom: 2,
  },
  storyTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  storyCloseButton: {
    padding: 8,
  },
  storyContent: {
    flex: 1,
    width: '100%',
  },
  
  // Prayer Story Card
  prayerStoryCard: {
    width: '100%',
    maxWidth: width - 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(20px)',
    marginTop: 80, // Add space below the profile picture
    // Remove fixed height constraints
  },
  prayerCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  prayerCardAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  prayerCardAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  prayerCardAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: SOFT_GRAY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  prayerCardAuthorInfo: {
    flex: 1,
  },
  prayerCardAuthorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: WHITE,
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  prayerCardTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  prayerCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prayerCardUrgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  prayerCardUrgentText: {
    fontSize: 10,
    color: WHITE,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  prayerCardCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  prayerCardCategoryText: {
    fontSize: 10,
    color: WHITE,
    fontWeight: '500',
    marginLeft: 4,
  },
  prayerCardContent: {
    padding: 24,
    justifyContent: 'flex-start',
    minHeight: 120,
  },
  prayerCardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: WHITE,
    marginBottom: 16,
    lineHeight: 30,
    textAlign: 'left',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  prayerCardDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'left',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  prayerCardStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  prayerCardStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  prayerCardStatText: {
    fontSize: 14,
    color: WHITE,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  prayerCardActions: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  prayerCardActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(123, 77, 98, 0.8)',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 25,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  prayerCardActionText: {
    fontSize: 16,
    color: WHITE,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  prayerCardActionButtonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 25,
    gap: 8,
  },
  prayerCardActionTextSecondary: {
    fontSize: 16,
    color: WHITE,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  prayerCardReplyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(123, 77, 98, 0.8)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minWidth: 100,
  },
  prayerCardReplyText: {
    fontSize: 14,
    color: WHITE,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  storyMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  storyUrgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  storyUrgentText: {
    fontSize: 10,
    color: WHITE,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  storyCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  storyCategoryText: {
    fontSize: 10,
    color: WHITE,
    fontWeight: '500',
    marginLeft: 4,
  },
  storyStatusBadge: {
    backgroundColor: SUCCESS_COLOR,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  storyStatusText: {
    fontSize: 10,
    color: WHITE,
    fontWeight: '500',
  },
  storyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: DARK_GRAY,
    marginBottom: 12,
    lineHeight: 26,
  },
  storyDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: DARK_GRAY,
    marginBottom: 20,
  },
  storyStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  storyStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LIGHT_PURPLE,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  storyStatText: {
    fontSize: 12,
    color: DARK_GRAY,
    marginLeft: 6,
    fontWeight: '500',
  },
  storyNavigation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  storyNavButton: {
    padding: 16,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    minWidth: 60,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  storyNavButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  storyProgress: {
    flex: 1,
    alignItems: 'center',
  },
  storyProgressText: {
    fontSize: 14,
    color: WHITE,
    fontWeight: '500',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  
  // Floating Navigation Styles
  storyNavigationFloating: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  storyNavButtonFloating: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(123, 77, 98, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  storyNavButtonFloatingDisabled: {
    backgroundColor: 'rgba(123, 77, 98, 0.3)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  storyProgressFloating: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  storyProgressFloatingText: {
    fontSize: 12,
    color: WHITE,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // View More Modal Styles
  viewMoreButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  viewMoreText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  viewMoreModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    zIndex: 1001,
  },
  viewMoreModalContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 60,
  },
  viewMoreModalHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  viewMoreModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: WHITE,
    flex: 1,
    marginRight: 20,
  },
  viewMoreCloseButton: {
    padding: 8,
  },
  viewMoreModalContent: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 20,
    marginTop: 80,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  viewMoreModalText: {
    fontSize: 16,
    color: WHITE,
    lineHeight: 24,
  },
  
});

