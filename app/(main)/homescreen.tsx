import { queryGemini } from '@/utils/gemini';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Easing,
    FlatList,
    LayoutAnimation,
    Platform, SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    UIManager,
    View
} from 'react-native';

/* ───── Constants ───── */
const { width } = Dimensions.get('window');
const PRIMARY_COLOR    = '#7b4d62';
const SECONDARY_COLOR  = '#ce703f';
const WHITE            = '#FFFFFF';
const OFF_WHITE        = '#f8f9fa';
const SOFT_GRAY        = '#e9ecef';
const DARK_GRAY        = '#495057';
const BLACK            = '#000000';
const LIGHT_PURPLE     = '#e3d5ca';
const LIGHT_ORANGE     = '#f4e4d6';

// More vibrant gradient colors
const GRADIENT_START   = '#8b5a6b';
const GRADIENT_END     = '#d67a4a';

const STATUS_BAR_OFFSET = Platform.OS === 'android'
  ? (StatusBar.currentHeight ?? 24) + 10
  : 10;
const BOTTOM_BAR_HEIGHT = 70;

/* Bottom‑bar tabs */
const TABS = [
  { key: 'home',    label: 'Home',    icon: 'home' as const          },
  { key: 'reading', label: 'Reading', icon: 'book' as const          },
  { key: 'prayer',  label: 'Prayer',  icon: 'hand-left' as const     },
  { key: 'profile', label: 'Profile', icon: 'person-circle' as const },
];

/* Mock data */
const streakDates     = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const currentDayIndex = 3;
const progressPercent = Math.round(((currentDayIndex + 1) / streakDates.length) * 100);
const cardsData = [
  { id: '1', title: 'Daily Verse',  description: 'Your daily scripture reading.' },
  { id: '2', title: 'Prayer Time',  description: 'Suggested prayer based on the day.' },
  { id: '3', title: 'Reflection',   description: 'Take a moment to reflect.' },
  { id: '4', title: 'Study Plan',   description: 'Track your study progress.' }, // NEW
];

/* Enable LayoutAnimation on Android */
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HomeScreen() {
  const [showSearch,  setShowSearch]  = useState(false);
  const [query,       setQuery]       = useState('');
  const [selectedCard,setSelectedCard]= useState<string | null>(null);
  const [activeTab,   setActiveTab]   = useState('home');
  const [searchResults, setSearchResults] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchWidth   = useRef(new Animated.Value(0)).current;
  const handleAISearch = async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    setShowResults(false);
    
    try {
      // Create a prompt that understands your app structure
      const prompt = `
        You are an assistant for a Bible app with the following features:
        - Daily Verse (scripture reading)
        - Prayer Time (suggested prayers)
        - Reflection (meditation prompts)
        - Study Plan (Bible study tracking)
        
        The user asked: "${query}"
        
        Based on this query, determine:
        1. Which feature best matches the query (home, reading, prayer, profile)
        2. A helpful response guiding them to that feature
        3. Any specific actions they might take
        
        Format your response as:
        [tab]: The tab to direct them to
        [response]: Your helpful answer
      `;
      
      const result = await queryGemini(prompt);
      setSearchResults(result);
      setShowResults(true);
      
      // Extract the tab suggestion if provided
      const tabMatch = result.match(/\[tab\]:\s*(.+)/i);
      if (tabMatch && TABS.some(tab => tab.key === tabMatch[1].trim())) {
        setTimeout(() => setActiveTab(tabMatch[1].trim()), 1500);
      }
    } catch (error) {
      setSearchResults("Sorry, I couldn't process your request. Please try again.");
      setShowResults(true);
    } finally {
      setIsSearching(false);
    }
  };

  /* Animate search bar */
  useEffect(() => {
    Animated.timing(searchWidth, {
      toValue: showSearch ? 1 : 0,
      duration: 250,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [showSearch]);

  /* Toggle card expand */
  const toggleCard = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedCard(prev => (prev === id ? null : id));
  };

  const todayLabel = new Date().toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={[PRIMARY_COLOR, '#8b5a73', SECONDARY_COLOR]}
        style={styles.container}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        {/* ───── Top Bar ───── */}
        <View style={styles.topBar}>
          <LinearGradient
            colors={[GRADIENT_START, GRADIENT_END]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileIconContainer}
          >
            <TouchableOpacity>
              <Ionicons name="person-circle" size={40} color={WHITE} />
            </TouchableOpacity>
          </LinearGradient>

          <Animated.View
            style={[
              styles.searchBar,
              {
                width: searchWidth.interpolate({
                  inputRange: [0, 1], outputRange: [0, width - 110],
                }),
                opacity: searchWidth,
              },
            ]}
          >
            <LinearGradient
              colors={[GRADIENT_START, GRADIENT_END]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.searchBarGradient}
            >
              <Ionicons name="search" size={20} color={WHITE} style={{ marginRight: 6 }} />
              <TextInput
                placeholder="Ask me anything about the app..." 
                placeholderTextColor="rgba(255,255,255,0.7)" 
                style={styles.searchInput}
                value={query} 
                onChangeText={setQuery}
                onSubmitEditing={handleAISearch}
                returnKeyType="search"
              />
            </LinearGradient>
          </Animated.View>

          <LinearGradient
            colors={[GRADIENT_START, GRADIENT_END]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.searchIconContainer}
          >
            <TouchableOpacity onPress={() => setShowSearch(p => !p)}>
              <Ionicons name={showSearch ? 'close' : 'search'} size={26} color={WHITE} />
            </TouchableOpacity>
          </LinearGradient>
        </View>
        
        {showSearch && (
          <View style={styles.resultsContainer}>
            {isSearching ? (
              <ActivityIndicator size="small" color={WHITE} />
            ) : showResults && searchResults ? (
              <>
                <Text style={styles.resultsText}>
                  {searchResults.replace(/\[tab\]:\s*.+/i, '').trim()}
                </Text>
                <TouchableOpacity 
                  style={styles.closeResults} 
                  onPress={() => setShowResults(false)}
                >
                  <Ionicons name="close" size={20} color={WHITE} />
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        )}
        
        {/* ───── Body ───── */}
        <FlatList
          data={cardsData}
          keyExtractor={item => item.id}
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.contentContainer,
            { paddingBottom: BOTTOM_BAR_HEIGHT + 20 },
          ]}
          ListHeaderComponent={
            <>
              {/* Streak circles */}
              <View style={styles.streakContainer}>
                {streakDates.map((d, idx) => {
                  const isPast  = idx < currentDayIndex;
                  const isToday = idx === currentDayIndex;
                  return (
                    <View
                      key={idx}
                      style={styles.dayCircle}
                    >
                      {isToday ? (
                        <LinearGradient
                          colors={[GRADIENT_START, GRADIENT_END]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.todayGradient}
                        >
                          <Text style={styles.todayText}>{d}</Text>
                        </LinearGradient>
                      ) : isPast ? (
                        <LinearGradient
                          colors={[GRADIENT_START, GRADIENT_END]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.pastGradient}
                        >
                          <Text style={styles.pastText}>{d}</Text>
                        </LinearGradient>
                      ) : (
                        <Text style={styles.dayText}>{d}</Text>
                      )}
                    </View>
                  );
                })}
              </View>

              {/* Progress bar */}
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Progress for {todayLabel}</Text>
                <Text style={styles.progressPercent}>{progressPercent}%</Text>
              </View>
              <View style={styles.progressLineContainer}>
                <LinearGradient
                  colors={[GRADIENT_START, GRADIENT_END]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.progressLine, { width: `${progressPercent}%` }]}
                />
              </View>
            </>
          }
          renderItem={({ item }) => {
            const expanded = selectedCard === item.id;
            return (
              <TouchableOpacity onPress={() => toggleCard(item.id)} activeOpacity={0.9}>
                <LinearGradient
                  colors={[GRADIENT_START, GRADIENT_END]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={[
                    styles.cardBase,
                    expanded ? styles.cardExpanded : styles.cardCollapsed,
                  ]}
                >
                  {/* Card header with chevron */}
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Ionicons
                      name={expanded ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={WHITE}
                    />
                  </View>

                  {expanded && (
                    <>
                      <Text style={styles.cardDesc}>{item.description}</Text>
                      <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.actionButton}>
                          <Ionicons name="book" size={16} color={PRIMARY_COLOR} />
                          <Text style={styles.actionText}>Read</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton}>
                          <Ionicons name="headset" size={16} color={PRIMARY_COLOR} />
                          <Text style={styles.actionText}>Listen</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            );
          }}
        />
        
        {/* ───── Bottom Tab Bar ───── */}
        <View style={styles.bottomBar}>
          {TABS.map(tab => {
            const focused = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key} style={styles.tabItem}
                onPress={() => setActiveTab(tab.key)} activeOpacity={0.8}
              >
                <Ionicons
                  name={focused ? tab.icon : `${tab.icon}-outline`}
                  size={24}
                  color={focused ? PRIMARY_COLOR : DARK_GRAY}
                />
                <Text style={[styles.tabLabel, { color: focused ? PRIMARY_COLOR : DARK_GRAY }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

/* ───────────────────────── Styles ───────────────────────── */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: OFF_WHITE },
  container: {
    flex: 1,
    paddingHorizontal: 20, paddingTop: STATUS_BAR_OFFSET,
  },
  resultsContainer: {
    marginTop: 10,
    padding: 15,
    borderRadius: 12,
    backgroundColor: LIGHT_PURPLE,
    borderWidth: 1,
    borderColor: '#d4c4b7',
  },
  resultsText: {
    color: DARK_GRAY,
    fontFamily: 'serif',
    fontSize: 14,
    lineHeight: 20,
  },
  closeResults: {
    position: 'absolute',
    right: 10,
    top: 10,
  },

  /* Top Bar */
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 18,
  },
  profileIconContainer: {
    borderRadius: 25,
    padding: 5,
  },
  searchBar: {
    height: 40, marginHorizontal: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  searchBarGradient: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10,
    height: '100%',
  },
  searchIconContainer: {
    borderRadius: 20,
    padding: 5,
  },
  searchInput: { 
    flex: 1, 
    color: WHITE, 
    fontFamily: 'serif',
    fontSize: 16,
  },

  /* Body content */
  contentContainer: { paddingBottom: 30 },

  /* Streak circles */
  streakContainer: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10,
  },
  dayCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: SOFT_GRAY, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d4c4b7',
    overflow: 'hidden',
  },
  todayGradient: {
    width: '100%', height: '100%', borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  pastGradient: {
    width: '100%', height: '100%', borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    opacity: 0.8,
  },
  dayText:   { color: DARK_GRAY, fontFamily: 'serif', fontWeight: 'bold' },
  todayText: { color: WHITE, fontFamily: 'serif', fontWeight: 'bold' },
  pastText:  { color: WHITE, fontFamily: 'serif', fontWeight: 'bold' },

  /* Progress */
  progressHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 4,
  },
  progressLabel:   { color: DARK_GRAY, fontFamily: 'serif', fontSize: 14 },
  progressPercent: { color: DARK_GRAY, fontFamily: 'serif', fontWeight: 'bold', fontSize: 14 },
  progressLineContainer: {
    height: 4, borderRadius: 2, marginBottom: 20,
    overflow: 'hidden', backgroundColor: SOFT_GRAY,
  },
  progressLine: { 
    height: '100%',
    borderRadius: 2,
  },

  /* Cards */
  cardBase: {
    borderRadius: 12, marginBottom: 15,
    borderWidth: 1, borderColor: SOFT_GRAY,
  },
  cardCollapsed: { paddingVertical: 12, paddingHorizontal: 16 },
  cardExpanded:  { padding: 20 },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  cardTitle: {
    color: WHITE, fontSize: 16, fontWeight: 'bold', fontFamily: 'serif',
  },
  cardDesc: {
    marginVertical: 10, color: 'rgba(255,255,255,0.8)',
    fontSize: 14, fontFamily: 'serif',
  },
  actionRow: { flexDirection: 'row', justifyContent: 'space-evenly', marginTop: 4 },
  actionButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: WHITE,
    paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20,
  },
  actionText: {
    color: PRIMARY_COLOR, marginLeft: 6, fontWeight: 'bold',
    fontFamily: 'serif', fontSize: 14,
  },

  /* Bottom Tab Bar */
  bottomBar: {
    height: BOTTOM_BAR_HEIGHT,
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: SOFT_GRAY,
    backgroundColor: OFF_WHITE,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  tabItem: { alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 12, marginTop: 2, fontFamily: 'serif', color: DARK_GRAY },
});
