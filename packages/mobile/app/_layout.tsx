import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { AuthProvider } from '../context/AuthContext';
import { View, StatusBar } from 'react-native';

import '../global.css';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Custom Theme to match Tailwind
const CinetronTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#8b5cf6', // Violet
    background: '#000000', // True Black
    card: '#0a0a0a', // Surface
    text: '#ffffff',
    border: '#27272a', // Zinc 800
    notification: '#E50914', // Netflix Red
  },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  return (
    <AuthProvider>
      <ThemeProvider value={CinetronTheme}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <Stack
             screenOptions={{
                headerStyle: { backgroundColor: '#000000' },
                headerTintColor: '#fff',
                contentStyle: { backgroundColor: '#000000' },
             }}
        >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
            <Stack.Screen name="media/[id]" options={{ headerShown: false, presentation: 'card' }} />
            <Stack.Screen name="player/[id]" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
      </ThemeProvider>
    </AuthProvider>
  );
}
