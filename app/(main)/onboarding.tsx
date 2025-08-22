// import { AntDesign } from '@expo/vector-icons';
// import { LinearGradient } from 'expo-linear-gradient';
// import { useRouter } from 'expo-router';
// import React from 'react';
// import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// const { width, height } = Dimensions.get('window');

// const PRIMARY_COLOR = '#7b4d62'; // Purple
// const SECONDARY_COLOR = '#ce703f'; // Orange
// const WHITE = '#FFFFFF';

// const OnboardingScreen = ({ navigation }: { navigation: any }) => {
//   const router = useRouter();

//   return (
//     <LinearGradient
//       colors={[PRIMARY_COLOR, SECONDARY_COLOR]}
//       style={styles.container}
//       start={{ x: 0.5, y: 0 }}
//       end={{ x: 0.5, y: 1 }}
//     >
//       <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} showsVerticalScrollIndicator={false}>
//       <View style={styles.content}>
//         {/* Logo */}
//         <View style={[styles.logoContainer, { width: '100%', alignItems: 'center' }]}> {/* Responsive logo */}
//           <Image 
//             source={require('../../assets/images/logo.png')}
//             style={[styles.logo, { maxWidth: 200, width: '60%', height: undefined, aspectRatio: 1 }]}
//             resizeMode="contain"
//           />
//         </View>

//         {/* Heading */}
//         <View style={styles.headingContainer}>
//           <Text style={styles.heading}>Spiritual Guidance</Text>
//           <Text style={styles.subheading}>Find peace and wisdom through sacred texts</Text>
//         </View>

//         {/* Rating Card */}
//         <View style={[styles.ratingCard, { width: '100%', maxWidth: 400 }]}> {/* Responsive card */}
//           <View style={styles.starsContainer}>
//             {[1, 2, 3, 4, 5].map((i) => (
//               <AntDesign key={i} name="star" size={24} color="#FFD700" />
//             ))}
//           </View>
//           <Text style={styles.ratingText}>Rated 4.9 by 10,000+ users</Text>
//           <Text style={styles.reviewText}>
//             "This app transformed my spiritual journey. The insights are profound yet accessible."
//           </Text>
//           <Text style={styles.reviewAuthor}>- Sarah J.</Text>
//         </View>

//         {/* Buttons */}
//         <View style={styles.buttonContainer}>
//           <TouchableOpacity 
//             style={[styles.button, styles.googleButton]}
//             onPress={() => router.push('/(main)/testimonialscreen2')}
//           >
//             <AntDesign name="google" size={20} color={PRIMARY_COLOR} />
//             <Text style={[styles.buttonText, styles.googleButtonText]}>Sign up with Google</Text>
//           </TouchableOpacity>

//           <TouchableOpacity 
//             style={[styles.button, styles.guestButton]}
//             onPress={() => router.push('/(main)/testimonialscreen2')}
//             >
//             <Text style={[styles.buttonText, styles.guestButtonText]}>Continue as Guest</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//       </ScrollView>
//     </LinearGradient>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     paddingHorizontal: 24,
//   },
//   content: {
//     flex: 1,
//     justifyContent: 'space-around',
//     paddingVertical: 40,
//   },
//   logoContainer: {
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   logo: {
//     width: width * 0.4,
//     height: width * 0.4,
//   },
//   headingContainer: {
//     alignItems: 'center',
//     marginBottom: 30,
//   },
//   heading: {
//     fontSize: 32,
//     fontWeight: 'bold',
//     color: WHITE,
//     fontFamily: 'serif',
//     marginBottom: 10,
//     textAlign: 'center',
//     textShadowColor: 'rgba(0, 0, 0, 0.3)',
//     textShadowOffset: { width: 1, height: 1 },
//     textShadowRadius: 2,
//   },
//   subheading: {
//     fontSize: 16,
//     color: 'rgba(255, 255, 255, 0.8)',
//     fontFamily: 'serif',
//     textAlign: 'center',
//     lineHeight: 22,
//     maxWidth: '80%',
//   },
//   ratingCard: {
//     backgroundColor: 'rgba(255, 255, 255, 0.15)',
//     borderRadius: 20,
//     padding: 24,
//     marginHorizontal: 10,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.2)',
//     alignItems: 'center',
//     marginBottom: 30,
//   },
//   starsContainer: {
//     flexDirection: 'row',
//     marginBottom: 8,
//   },
//   ratingText: {
//     color: WHITE,
//     fontSize: 16,
//     fontFamily: 'serif',
//     marginBottom: 16,
//   },
//   reviewText: {
//     color: WHITE,
//     fontSize: 15,
//     fontFamily: 'serif',
//     textAlign: 'center',
//     lineHeight: 22,
//     fontStyle: 'italic',
//     marginBottom: 8,
//   },
//   reviewAuthor: {
//     color: WHITE,
//     fontSize: 14,
//     fontFamily: 'serif',
//     alignSelf: 'flex-end',
//     opacity: 0.8,
//   },
//   buttonContainer: {
//     width: '100%',
//   },
//   button: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 16,
//     borderRadius: 12,
//     marginBottom: 16,
//   },
//   googleButton: {
//     backgroundColor: WHITE,
//   },
//   guestButton: {
//     backgroundColor: 'transparent',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.5)',
//   },
//   buttonText: {
//     fontSize: 16,
//     fontWeight: '600',
//     marginLeft: 10,
//   },
//   googleButtonText: {
//     color: PRIMARY_COLOR,
//   },
//   guestButtonText: {
//     color: WHITE,
//   },
// });

// export default OnboardingScreen; 
import { AntDesign } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

const PRIMARY_COLOR = '#7b4d62'; // Purple
const SECONDARY_COLOR = '#ce703f'; // Orange
const WHITE = '#FFFFFF';

const OnboardingScreen = () => {
  const router = useRouter();

  return (
    <LinearGradient
      colors={[PRIMARY_COLOR, SECONDARY_COLOR]}
      style={styles.container}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.headingContainer}>
          <Text style={styles.heading}>Spiritual Guidance</Text>
          <Text style={styles.subheading}>Find peace and wisdom through sacred texts</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((i) => (
              <AntDesign key={i} name="star" size={24} color="#FFD700" />
            ))}
          </View>
          <Text style={styles.cardText}>Rated 4.9 by 10,000+ users</Text>
          <Text style={styles.review}>"This app transformed my spiritual journey. The insights are profound yet accessible."</Text>
          <Text style={styles.author}>- Sarah J.</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.googleButton]}
            onPress={() => router.push('/(main)/testimonialscreen2')}
          >
            <AntDesign name="google" size={20} color={PRIMARY_COLOR} />
            <Text style={[styles.buttonText, styles.googleButtonText]}>Sign up with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.guestButton]}
            onPress={() => router.push('/(main)/testimonialscreen2')}
          >
            <Text style={[styles.buttonText, styles.guestButtonText]}>Continue as Guest</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: width * 0.5,
    height: width * 0.5,
  },
  headingContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  heading: {
    fontSize: 32,
    fontWeight: 'bold',
    color: WHITE,
    textAlign: 'center',
    marginBottom: 10,
  },
  subheading: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    maxWidth: '85%',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 30,
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
  },
  starsRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  cardText: {
    color: WHITE,
    fontSize: 16,
    marginBottom: 10,
  },
  review: {
    color: WHITE,
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: 6,
  },
  author: {
    color: WHITE,
    fontSize: 13,
    alignSelf: 'flex-end',
    opacity: 0.8,
  },
  buttonContainer: {
    marginTop: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  googleButton: {
    backgroundColor: WHITE,
  },
  guestButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: WHITE,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  googleButtonText: {
    color: PRIMARY_COLOR,
  },
  guestButtonText: {
    color: WHITE,
  },
});

export default OnboardingScreen;
