import "../global.css";

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { Stack } from "expo-router";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Toaster } from "@/components/feedback/Toaster";
import { QueryProvider } from "@/providers/QueryProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { SocketProvider } from "@/realtime/SocketProvider";
import { useGlobalSocketEvents } from "@/realtime/useGlobalSocketEvents";
import { useAuthStore } from "@/store/useAuthStore";
import { watchReduceMotion } from "@/store/useMotionStore";
import { useThemeStore } from "@/store/useThemeStore";

SplashScreen.preventAutoHideAsync();

function AppContent() {
  useGlobalSocketEvents();
  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);

  // Theme preference is read from AsyncStorage asynchronously; holding the
  // splash until it lands avoids a flash of the wrong theme on cold start.
  const themeHydrated = useThemeStore.persist.hasHydrated();
  const ready = fontsLoaded && themeHydrated && !isCheckingAuth;

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const subscription = watchReduceMotion();
    return () => subscription?.remove?.();
  }, []);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryProvider>
        <ThemeProvider>
          <SocketProvider>
            <AppContent />
            <Toaster />
          </SocketProvider>
        </ThemeProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}
