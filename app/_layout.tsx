import { Stack } from 'expo-router';
import 'react-native-reanimated';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index"
        options={{ 
          headerShown: false,
        }} 
      />
      {/* <Stack.Screen 
        name="splash" 
        options={{ 
          headerShown: false,
        }} 
      /> */}
      
      <Stack.Screen 
        name="(main)" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="auth/callback" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}