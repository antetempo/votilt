import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { BottomNavigation } from '../src/components/BottomNavigation';
import { AppNavigationProvider } from '../src/lib/navigation';
import { QueryClientProvider } from '@tanstack/react-query';
import {
  useFonts,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { SessionProvider, queryClient } from '../src/lib/session';
import { colors } from '../src/theme/tokens';
import { useReducedMotion } from 'react-native-reanimated';

export default function Layout() {
  const reducedMotion = useReducedMotion();
  const [fontsLoaded, fontError] = useFonts({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
    Inter_400Regular,
    Inter_600SemiBold,
  });
  if (!fontsLoaded && !fontError) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <StatusBar style="light" />
          <AppNavigationProvider>
            <View style={{ flex: 1 }}>
              <Stack
                screenOptions={{
                  animation: reducedMotion ? 'none' : 'default',
                  headerStyle: { backgroundColor: colors.bg },
                  headerTintColor: colors.text,
                  headerShadowVisible: false,
                  contentStyle: { backgroundColor: colors.bg },
                  headerBackTitle: 'Indietro',
                  headerBackImageSource: require('../assets/icons/ui/back-native.png'),
                }}
              >
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="duel/[id]"
                  options={{
                    headerShown: false,
                    presentation: 'card',
                    gestureEnabled: false,
                    animation: reducedMotion ? 'none' : 'fade',
                  }}
                />
              </Stack>
            </View>
            <BottomNavigation />
          </AppNavigationProvider>
        </SessionProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
