import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import React, { useEffect, useRef, useState } from 'react';
import {
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

const STATUS_BAR_OFFSET = Platform.OS === 'android'
  ? (StatusBar.currentHeight ?? 24) + 10
  : 10;

/* Mock data */
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
  { 
    id: '4', 
    title: 'Study Plan',   
    description: 'Track your study progress.',
    content: `Weekly Bible Study Plan:

Monday: Read John 1-3
Tuesday: Reflect on John 3:16-17
Wednesday: Study the concept of God's love
Thursday: Pray for understanding
Friday: Share insights with others
Weekend: Rest and meditate on what you've learned

Remember: Consistency is key to spiritual growth.`
  },
];

/* Enable LayoutAnimation on Android */
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface CardData {
  id: string;
  title: string;
  description: string;
  content: string;
}

export default function HomeScreen() {
  const [showSearch,  setShowSearch]   = useState(false);
  const [query,       setQuery]        = useState('');
  const [selectedCard,setSelectedCard] = useState<string | null>('1'); // First card always opened
  const [searchResults, setSearchResults] = useState<CardData[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showReadModal, setShowReadModal] = useState(false);
  const [currentReadContent, setCurrentReadContent] = useState('');
  const [currentReadTitle, setCurrentReadTitle] = useState('');
  

  
  const searchWidth   = useRef(new Animated.Value(0)).current;

  /* ───── Local Search ───── */
  const handleSearch = () => {
    const trimmed = query.trim();

    if (!trimmed) {
      setShowResults(false);
      setSearchResults([]);
      return;
    }

    const lower = trimmed.toLowerCase();
    const matches = cardsData.filter(card =>
      card.title.toLowerCase().includes(lower) ||
      card.description.toLowerCase().includes(lower)
    );

    setSearchResults(matches);
    setShowResults(true);
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

  /* Handle read action */
  const handleRead = (cardTitle: string) => {
    // Find the card data and show in modal
    const card = cardsData.find(c => c.title === cardTitle);
    if (card) {
      setCurrentReadTitle(card.title);
      setCurrentReadContent(card.content);
      setShowReadModal(true);
    }
  };

  /* Handle listen action */
  const handleListen = (cardTitle: string) => {
    // Future implementation for text-to-speech
    console.log(`Listen functionality for: ${cardTitle} - to be implemented`);
  };







  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* ───── Top Bar ───── */}
        <View style={styles.topBar}>
          {/* Profile icon */}
          <TouchableOpacity>
            <Ionicons name="person-circle" size={40} color={DARK_GRAY} />
          </TouchableOpacity>

          {/* Animated search bar */}
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
            <Ionicons name="search" size={20} color={DARK_GRAY} style={{ marginRight: 6 }} />
            <TextInput
              placeholder="Search..."
              placeholderTextColor={DARK_GRAY}
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </Animated.View>

          {/* Toggle search visibility */}
          <TouchableOpacity onPress={() => setShowSearch(p => !p)}>
            <Ionicons name={showSearch ? 'close' : 'search'} size={26} color={DARK_GRAY} />
          </TouchableOpacity>
        </View>

        {/* ───── Search Results ───── */}
        {showSearch && showResults && (
          <View style={styles.resultsContainer}>
            {searchResults.length > 0 ? (
              searchResults.map(item => (
                <Text key={item.id} style={styles.resultsText}>
                  {item.title}: {item.description}
                </Text>
              ))
            ) : (
              <Text style={styles.resultsText}>No matching results.</Text>
            )}

            <TouchableOpacity
              style={styles.closeResults}
              onPress={() => setShowResults(false)}
            >
              <Ionicons name="close" size={20} color={DARK_GRAY} />
            </TouchableOpacity>
          </View>
        )}

        {/* ───── Body ───── */}
        <FlatList
          data={cardsData}
          keyExtractor={item => item.id}
          style={{ flex: 1 }}
          contentContainerStyle={styles.contentContainer}
          ListHeaderComponent={
            <>

              

            </>
          }
          renderItem={({ item }) => {
            const expanded = selectedCard === item.id;
            return (
              <TouchableOpacity onPress={() => toggleCard(item.id)} activeOpacity={0.9}>
                <LinearGradient
                  colors={[PRIMARY_COLOR, SECONDARY_COLOR]}
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
                          style={styles.actionButton}
                          onPress={() => handleListen(item.title)}
                        >
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
      </View>

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
    </SafeAreaView>
  );
}

/* ───────────────────────── Styles ───────────────────────── */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: OFF_WHITE },
  container: {
    flex: 1, backgroundColor: OFF_WHITE,
    paddingHorizontal: 20, paddingTop: STATUS_BAR_OFFSET,
  },
  resultsContainer: {
    marginTop: 10,
    padding: 15,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  resultsText: {
    color: BLACK,
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
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    height: 40, marginHorizontal: 10, paddingHorizontal: 10,
    backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 12,
    overflow: 'hidden',
  },
  searchInput: { flex: 1, color: BLACK, fontFamily: 'serif' },

  /* Body content */
  contentContainer: { paddingBottom: 30 },





  /* Cards */
  cardBase: {
    borderRadius: 12, marginBottom: 15,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.2)',
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
  cardContent: {
    marginVertical: 10, color: WHITE,
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

  /* Modal Styles */
  modalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center',
    zIndex: 1000,
  },
  readModalContent: {
    width: width * 0.9,
    borderRadius: 15,
    overflow: 'hidden',
  },
  readModalGradient: {
    padding: 20,
  },
  readModalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 10,
  },
  readModalTitle: {
    color: WHITE, fontSize: 20, fontWeight: 'bold', fontFamily: 'serif',
  },
  readModalText: {
    color: WHITE, fontSize: 16, fontFamily: 'serif', lineHeight: 24,
  },
});
