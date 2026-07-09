try {
  require('react-native-reanimated');
} catch {
  // Reanimated native module unavailable (e.g. Expo Go version mismatch).
  // The app will still work — animations fall back to JS driver.
}
