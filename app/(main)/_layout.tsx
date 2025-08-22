import { Stack } from 'expo-router';

export default function MainLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        animation: 'none',
        presentation: 'modal'
      }}
    >
      <Stack.Screen name="denomination" />
      <Stack.Screen name="homescreen" />
      <Stack.Screen name="nextquestion" />
      <Stack.Screen name="chatscreen" />
      <Stack.Screen name="testimonialscreen2" />
      <Stack.Screen name="bible-version" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="final-analysis" />
      <Stack.Screen name="bible-specific" />
      <Stack.Screen name="faith-strengthens" />
      <Stack.Screen name="referral-source" />
      <Stack.Screen name="age-group" />
      <Stack.Screen name="bible-answers" />
      <Stack.Screen name="smart-notifications" />
    </Stack>
  );
} 