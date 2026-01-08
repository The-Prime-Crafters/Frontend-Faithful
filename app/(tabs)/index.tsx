import DailyCard from '@/components/home/DailyCard';
import ReadModal from '@/components/modals/ReadModal';
import TTSModal from '@/components/modals/TTSModal';
import ViewMoreModal from '@/components/modals/ViewMoreModal';
import { API_BASE_URL, API_ENDPOINTS } from '@/constants/API';
import { useLoading } from '@/contexts/LoadingContext';
import { useAppUsage, useStreak, useTodayUsage } from '@/hooks/useAppUsage';
import { useDailyContent } from '@/hooks/useDailyContent';
import ActivityTrackerService from '@/utils/activityTracker';
import { fetchPrayerStories as fetchPrayerStoriesApi } from '@/utils/api/prayerStories';
import AppSessionTracker from '@/utils/appSessionTracker';
import { safeJsonParse } from '@/utils/safeJson';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
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
const PRIMARY_COLOR = '#7b4d62';
const SECONDARY_COLOR = '#ce703f';
const WHITE = '#FFFFFF';
const OFF_WHITE = '#f8f9fa';
const SOFT_GRAY = '#e9ecef';
const DARK_GRAY = '#495057';
const BLACK = '#000000';
const LIGHT_PURPLE = '#e3d5ca';
const LIGHT_ORANGE = '#f4e4d6';
const SUCCESS_COLOR = '#28a745';

const STATUS_BAR_OFFSET = Platform.OS === 'android'
  ? (StatusBar.currentHeight ?? 24) + 10
  : 10;

/* Enable LayoutAnimation on Android */
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/* Helper function to parse book name from passage reference */
const parseBookFromPassage = (passage: string): string => {
  if (!passage) return 'Unknown';
  
  // Handle multi-word books like "1 John", "2 Corinthians", "Song of Solomon"
  // Pattern: optional number + space + book name + space + chapter:verse
  const match = passage.match(/^(\d*\s*[A-Za-z]+(?:\s+of\s+[A-Za-z]+)?)/i);
  
  if (match && match[1]) {
    return match[1].trim();
  }
  
  // Fallback: just take the first word
  return passage.split(' ')[0];
};

/* Helper function to normalize book names */
const normalizeBookName = (bookName: string): string => {
  if (!bookName) return 'Unknown';
  
  const bookNameMap: { [key: string]: string } = {
    // Old Testament
    'Gen': 'Genesis', 'Gen.': 'Genesis',
    'Exod': 'Exodus', 'Exod.': 'Exodus', 'Ex': 'Exodus', 'Ex.': 'Exodus',
    'Lev': 'Leviticus', 'Lev.': 'Leviticus',
    'Num': 'Numbers', 'Num.': 'Numbers',
    'Deut': 'Deuteronomy', 'Deut.': 'Deuteronomy', 'Dt': 'Deuteronomy',
    'Josh': 'Joshua', 'Josh.': 'Joshua',
    'Judg': 'Judges', 'Judg.': 'Judges',
    'Ruth': 'Ruth',
    '1 Sam': '1 Samuel', '1Sam': '1 Samuel', '1 Sam.': '1 Samuel',
    '2 Sam': '2 Samuel', '2Sam': '2 Samuel', '2 Sam.': '2 Samuel',
    '1 Kgs': '1 Kings', '1Kgs': '1 Kings', '1 Kgs.': '1 Kings', '1 Ki': '1 Kings',
    '2 Kgs': '2 Kings', '2Kgs': '2 Kings', '2 Kgs.': '2 Kings', '2 Ki': '2 Kings',
    '1 Chr': '1 Chronicles', '1Chr': '1 Chronicles', '1 Chr.': '1 Chronicles',
    '2 Chr': '2 Chronicles', '2Chr': '2 Chronicles', '2 Chr.': '2 Chronicles',
    'Ezra': 'Ezra',
    'Neh': 'Nehemiah', 'Neh.': 'Nehemiah',
    'Esth': 'Esther', 'Esth.': 'Esther',
    'Job': 'Job',
    'Ps': 'Psalms', 'Ps.': 'Psalms', 'Psa': 'Psalms', 'Psalm': 'Psalms',
    'Prov': 'Proverbs', 'Prov.': 'Proverbs', 'Pr': 'Proverbs',
    'Eccl': 'Ecclesiastes', 'Eccl.': 'Ecclesiastes', 'Ecc': 'Ecclesiastes',
    'Song': 'Song of Solomon', 'Song.': 'Song of Solomon', 'SS': 'Song of Solomon',
    'Isa': 'Isaiah', 'Isa.': 'Isaiah', 'Is': 'Isaiah',
    'Jer': 'Jeremiah', 'Jer.': 'Jeremiah',
    'Lam': 'Lamentations', 'Lam.': 'Lamentations',
    'Ezek': 'Ezekiel', 'Ezek.': 'Ezekiel', 'Eze': 'Ezekiel',
    'Dan': 'Daniel', 'Dan.': 'Daniel',
    'Hos': 'Hosea', 'Hos.': 'Hosea',
    'Joel': 'Joel',
    'Amos': 'Amos',
    'Obad': 'Obadiah', 'Obad.': 'Obadiah',
    'Jonah': 'Jonah', 'Jon': 'Jonah',
    'Mic': 'Micah', 'Mic.': 'Micah',
    'Nah': 'Nahum', 'Nah.': 'Nahum',
    'Hab': 'Habakkuk', 'Hab.': 'Habakkuk',
    'Zeph': 'Zephaniah', 'Zeph.': 'Zephaniah', 'Zep': 'Zephaniah',
    'Hag': 'Haggai', 'Hag.': 'Haggai',
    'Zech': 'Zechariah', 'Zech.': 'Zechariah', 'Zec': 'Zechariah',
    'Mal': 'Malachi', 'Mal.': 'Malachi',
    
    // New Testament
    'Matt': 'Matthew', 'Matt.': 'Matthew', 'Mt': 'Matthew',
    'Mark': 'Mark', 'Mk': 'Mark',
    'Luke': 'Luke', 'Lk': 'Luke',
    'John': 'John', 'Jn': 'John',
    'Acts': 'Acts',
    'Rom': 'Romans', 'Rom.': 'Romans',
    '1 Cor': '1 Corinthians', '1Cor': '1 Corinthians', '1 Cor.': '1 Corinthians',
    '2 Cor': '2 Corinthians', '2Cor': '2 Corinthians', '2 Cor.': '2 Corinthians',
    'Gal': 'Galatians', 'Gal.': 'Galatians',
    'Eph': 'Ephesians', 'Eph.': 'Ephesians',
    'Phil': 'Philippians', 'Phil.': 'Philippians',
    'Col': 'Colossians', 'Col.': 'Colossians',
    '1 Thess': '1 Thessalonians', '1Thess': '1 Thessalonians', '1 Thess.': '1 Thessalonians',
    '2 Thess': '2 Thessalonians', '2Thess': '2 Thessalonians', '2 Thess.': '2 Thessalonians',
    '1 Tim': '1 Timothy', '1Tim': '1 Timothy', '1 Tim.': '1 Timothy',
    '2 Tim': '2 Timothy', '2Tim': '2 Timothy', '2 Tim.': '2 Timothy',
    'Titus': 'Titus', 'Tit': 'Titus',
    'Phlm': 'Philemon', 'Phlm.': 'Philemon',
    'Heb': 'Hebrews', 'Heb.': 'Hebrews',
    'Jas': 'James', 'Jas.': 'James', 'Jam': 'James',
    '1 Pet': '1 Peter', '1Pet': '1 Peter', '1 Pet.': '1 Peter',
    '2 Pet': '2 Peter', '2Pet': '2 Peter', '2 Pet.': '2 Peter',
    '1 John': '1 John', '1John': '1 John', '1 Jn': '1 John', '1Jn': '1 John',
    '2 John': '2 John', '2John': '2 John', '2 Jn': '2 John', '2Jn': '2 John',
    '3 John': '3 John', '3John': '3 John', '3 Jn': '3 John', '3Jn': '3 John',
    'Jude': 'Jude',
    'Rev': 'Revelation', 'Rev.': 'Revelation',
    
    // Already full names (passthrough - only books not already defined)
    'Genesis': 'Genesis', 'Exodus': 'Exodus', 'Leviticus': 'Leviticus', 'Numbers': 'Numbers', 'Deuteronomy': 'Deuteronomy',
    'Joshua': 'Joshua', 'Judges': 'Judges', '1 Samuel': '1 Samuel', '2 Samuel': '2 Samuel',
    '1 Kings': '1 Kings', '2 Kings': '2 Kings', '1 Chronicles': '1 Chronicles', '2 Chronicles': '2 Chronicles',
    'Nehemiah': 'Nehemiah', 'Esther': 'Esther', 'Psalms': 'Psalms', 'Proverbs': 'Proverbs',
    'Ecclesiastes': 'Ecclesiastes', 'Song of Solomon': 'Song of Solomon', 'Isaiah': 'Isaiah', 'Jeremiah': 'Jeremiah',
    'Lamentations': 'Lamentations', 'Ezekiel': 'Ezekiel', 'Daniel': 'Daniel', 'Hosea': 'Hosea',
    'Obadiah': 'Obadiah', 'Micah': 'Micah', 'Nahum': 'Nahum', 'Habakkuk': 'Habakkuk',
    'Zephaniah': 'Zephaniah', 'Haggai': 'Haggai', 'Zechariah': 'Zechariah', 'Malachi': 'Malachi',
    'Matthew': 'Matthew', 'Romans': 'Romans', '1 Corinthians': '1 Corinthians', '2 Corinthians': '2 Corinthians',
    'Galatians': 'Galatians', 'Ephesians': 'Ephesians', 'Philippians': 'Philippians', 'Colossians': 'Colossians',
    '1 Thessalonians': '1 Thessalonians', '2 Thessalonians': '2 Thessalonians', '1 Timothy': '1 Timothy',
    '2 Timothy': '2 Timothy', 'Philemon': 'Philemon', 'Hebrews': 'Hebrews', 'James': 'James',
    '1 Peter': '1 Peter', '2 Peter': '2 Peter', 'Revelation': 'Revelation',
  };

  return bookNameMap[bookName] || bookName;
};

/* Helper function to normalize a full reference (e.g., "Jer 29:11" -> "Jeremiah 29:11") */
const normalizeReference = (reference: string): string => {
  if (!reference) return '';
  
  // Extract the book name from the reference
  const bookPart = parseBookFromPassage(reference);
  const normalizedBook = normalizeBookName(bookPart);
  
  // Replace the book part with the normalized version
  return reference.replace(bookPart, normalizedBook);
};

/* Helper function to clean verse text from special characters */
const cleanVerseText = (text: string): string => {
  if (!text) return '';
  
  let cleanedText = text;
  
  // Remove leading verse numbers like "1. ", "2. ", "1 ", "2 "
  cleanedText = cleanedText.replace(/^\d+\.?\s*/, '');
  
  // Remove leading brackets and special characters
  cleanedText = cleanedText.replace(/^["'„"'‚«»\[\]\(\)\{\}\s\u201C\u201D\u2018\u2019\u00AB\u00BB]+/, '');
  
  // Remove trailing cross-references like "1 John 4:9 : See John 3:16"
  // This pattern looks for a book abbreviation followed by chapter:verse at the end
  cleanedText = cleanedText.replace(/\s+\d*\s*[A-Za-z]+\.?\s+\d+:\d+\s*:.*$/i, '');
  
  // Remove any other trailing reference patterns like ": See [reference]"
  cleanedText = cleanedText.replace(/\s*:\s*See\s+.*$/i, '');
  
  // Trim any remaining leading/trailing whitespace
  return cleanedText.trim();
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
  const [selectedCard, setSelectedCard] = useState<string | null>('1'); // First card always opened
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
  const {
    data: prayerStories,
    loading: loadingPrayerStories,
    error: prayerStoriesError
  } = useDailyContent(fetchPrayerStoriesApi, [], []);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);

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
  const [cardReadTimers, setCardReadTimers] = useState<{ [key: string]: NodeJS.Timeout | null }>({});
  const [cardReadStartTimes, setCardReadStartTimes] = useState<{ [key: string]: number }>({});
  const [completedActivities, setCompletedActivities] = useState<Set<string>>(new Set());
  const sessionTracker = AppSessionTracker.getInstance();
  const isMounted = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync selected voice with settings
  useEffect(() => {
    setSelectedVoice(settings.voice);
  }, [settings.voice]);

  // Cleanup timers and abort controllers on unmount
  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
      
      // Clear all timers
      Object.values(cardReadTimers).forEach(timer => {
        if (timer) clearTimeout(timer);
      });
      
      // Abort any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Stop TTS if playing
      if (isPlaying) {
        stop();
      }
    };
  }, []);

  // Calculate gamification metrics
  const [backendDailyGoals, setBackendDailyGoals] = useState<any>(null);

  // Load backend daily goals from cache
  useEffect(() => {
    const loadBackendGoals = async () => {
      if (!isMounted.current) return;
      
      try {
        const cached = await SecureStore.getItemAsync('sessionData');
        if (cached && isMounted.current) {
          const data = safeJsonParse(cached, null);
          if (data?.dailyGoals) {
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
        ? `"${cleanVerseText(dailyVerse.text)}" - ${normalizeReference(dailyVerse.reference)}

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
        ? `"${cleanVerseText(dailyPrayer.text)}" - ${normalizeReference(dailyPrayer.reference)}

This ${dailyPrayer.category} verse from ${normalizeBookName(dailyPrayer.book)} reminds us of God's presence and care. Take a moment to reflect on how this scripture speaks to your heart today.`
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

  const cardsData = useMemo(() => getCardsData(), [dailyVerse, dailyPrayer, dailyReflection, currentTheme]);

  /* ───── Effects ───── */
  useEffect(() => {
    // Load stored prayer, verse, reflection data and check if we need to fetch new data
    loadStoredPrayerData();
    loadStoredVerseData();
    loadStoredReflectionData();
    loadUserData();

    // Defer API calls to after UI renders
    const deferredInit = setTimeout(() => {
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
      // Note: Prayer stories are managed by useDailyContent hook
      // They will refresh automatically when the hook's dependencies change

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
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [lastPrayerFetch, lastVerseFetch, lastReflectionFetch]);

  /* ───── Daily Prayer Storage & Auto-refresh ───── */
  const loadStoredPrayerData = async () => {
    try {
      // Load stored prayer data
      const storedPrayer = await SecureStore.getItemAsync('dailyPrayerData');
      const storedFetchTime = await SecureStore.getItemAsync('lastPrayerFetch');

      if (storedPrayer && storedFetchTime) {
        const prayerData = safeJsonParse(storedPrayer, null);
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
    // FORCE REFRESH ENABLED FOR TESTING
    if (true) {
      // Original condition: if (!timeToCheck || (now - timeToCheck) >= twentyFourHours) {
      console.log('🔄 Force refreshing daily prayer for testing');
      await fetchDailyPrayer('comfort');
    } else {
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
        const verseData = safeJsonParse(storedVerse, null);
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
    // FORCE REFRESH ENABLED FOR TESTING
    if (true) {
      // Original condition: if (!timeToCheck || (now - timeToCheck) >= twentyFourHours) {
      console.log('🔄 Force refreshing daily verse for testing');
      await fetchDailyVerse('comfort');
    } else {
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
        const reflectionData = safeJsonParse(storedReflection, null);
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
    if (!prayerStories || prayerStories.length === 0) {
      closeStoryViewer();
      return;
    }

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
    if (!prayerStories || prayerStories.length === 0) {
      return;
    }

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
        const user = safeJsonParse(userDataString, null);
        if (user) {
          setUserData(user);
          console.log('👤 User data loaded:', user.name);
        }
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
            const existingUser = safeJsonParse(userDataString, {});
            const updatedUser = {
              ...existingUser,
              picture: freshUser.picture, // Always use latest picture from backend
              name: freshUser.name || existingUser.name || '',
              email: freshUser.email || existingUser.email || '',
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
      console.log('🔍 DAILY VERSE RESPONSE:', JSON.stringify(result, null, 2));

      if (result.success && result.data) {
        // Transform API response to match expected format
        const verseData = {
          version: result.data.bible || result.data.version || 'KJV',
          category: result.data.category || 'inspiration',
          book: parseBookFromPassage(result.data.passage || result.data.reference || ''),
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
          book: parseBookFromPassage(result.data.passage || result.data.reference || ''),
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

  /* Handle read action */
  const handleRead = (cardTitle: string) => {
    console.log('📖 handleRead called for:', cardTitle);
    // Find the card data and show in modal
    const card = cardsData.find(c => c.title === cardTitle);
    console.log('📖 Card found:', !!card);
    if (card) {
      console.log('📖 Card data:', {
        title: card.title,
        contentLength: card.content?.length,
        contentPreview: card.content?.substring(0, 50)
      });
      console.log('📖 Setting modal state...');
      setCurrentReadTitle(card.title);
      setCurrentReadContent(card.content);
      setShowReadModal(true);
      console.log('📖 Modal state set:', {
        showReadModal: true,
        currentReadTitle: card.title,
        currentReadContentLength: card.content?.length
      });

      // Track activity based on card type
      const activityTracker = ActivityTrackerService.getInstance();
      if (cardTitle.includes('Prayer') || cardTitle.includes('prayer')) {
        activityTracker.trackPrayerSaid();
      } else if (cardTitle.includes('Verse') || cardTitle.includes('verse')) {
        activityTracker.trackVerseRead();
      } else if (cardTitle.includes('Reflection') || cardTitle.includes('reflection')) {
        activityTracker.trackReflectionCompleted();
      }
    } else {
      console.log('❌ Card not found!');
    }
  };

  /* Handle listen action */
  const handleListen = async (cardTitle: string) => {
    console.log('🔊 handleListen called for:', cardTitle);
    try {
      // Check if user has set a voice preference
      let savedVoiceId = await SecureStore.getItemAsync('userVoiceId');
      console.log('🔊 Saved voice ID:', savedVoiceId);

      // If not in SecureStore, try loading from TTS settings (which loads from API)
      if (!savedVoiceId && settings.voice) {
        savedVoiceId = settings.voice;
        console.log('🔊 Using voice from settings:', savedVoiceId);
      }

      if (!savedVoiceId) {
        console.log('❌ No voice configured, showing alert');
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
      const card = cardsData.find(c => c.title === cardTitle);
      console.log('🔊 Card found:', !!card);
      if (card) {
        console.log('🔊 Card data:', {
          title: card.title,
          contentLength: card.content?.length,
          contentPreview: card.content?.substring(0, 50)
        });
        console.log('🔊 Setting TTS modal state...');
        setCurrentTTSTitle(card.title);
        setCurrentTTSContent(card.content);

        // Update TTS settings to ensure voice is set
        updateSettings({ voice: savedVoiceId });

        // Show modal and start playing with saved voice
        setShowTTSModal(true);
        console.log('🔊 TTS Modal state set to true');

        // Small delay to ensure modal is rendered before speaking
        setTimeout(() => {
          console.log('🔊 Starting TTS with voice:', savedVoiceId);
          speak(card.content, { voice: savedVoiceId });
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
      } else {
        console.log('❌ Card not found!');
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

            {cardsData.map(card => (
              <DailyCard
                key={card.id}
                title={card.title}
                description={card.description}
                content={card.content}
                onPress={() => setSelectedCard(card.id)}
                onRead={() => handleRead(card.title)}
                onListen={() => handleListen(card.title)}
              />
            ))}
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
          {prayerStories && prayerStories.length > 0 && (
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
      <ReadModal
        visible={showReadModal}
        title={currentReadTitle}
        content={currentReadContent}
        onClose={() => setShowReadModal(false)}
      />

      {/* TTS Modal */}
      <TTSModal
        visible={showTTSModal}
        title={currentTTSTitle}
        content={currentTTSContent}
        onClose={handleTTSClose}
        isPlaying={isPlaying}
        isPaused={isPaused}
        progress={progress}
        onTogglePlayPause={handleTTSToggle}
        onStop={handleTTSStop}
      />

      {/* View More Modal */}
      <ViewMoreModal
        visible={showViewMoreModal}
        title={viewMoreTitle}
        content={viewMoreContent}
        onClose={() => setShowViewMoreModal(false)}
      />

      {/* Story Viewer Modal */}
      {showStoryViewer && selectedStory && (
        <ReadModal
          visible={showStoryViewer}
          title={selectedStory.isAnonymous ? 'Anonymous Prayer Story' : `${selectedStory.userName}'s Prayer Story`}
          content={selectedStory.content}
          onClose={closeStoryViewer}
        />
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
    paddingBottom: 120,
  },
  cardsContainer: {
    // paddingBottom removed to fix gap between cards and next section
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
  contentContainer: { paddingBottom: 120 },

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
  cardExpanded: {
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
    paddingBottom: 120,
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
    paddingBottom: 120,
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

