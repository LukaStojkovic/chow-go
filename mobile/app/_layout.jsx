import "../global.css";

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import {
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { I18nextProvider, useTranslation } from "react-i18next";
import { i18next } from "@chowgo/shared/i18n";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { OfflineBanner } from "@/components/feedback/OfflineBanner";
import { Toaster } from "@/components/feedback/Toaster";
import { QueryProvider } from "@/providers/QueryProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { SocketProvider } from "@/realtime/SocketProvider";
import { usePushNotifications } from "@/notifications/usePushNotifications";
import { useGlobalSocketEvents } from "@/realtime/useGlobalSocketEvents";
import { useAuthStore } from "@/store/useAuthStore";
import { watchReduceMotion } from "@/store/useMotionStore";
import { useThemeStore } from "@/store/useThemeStore";
import { initMonitoring, reportError } from "@/lib/monitoring";
import { setupI18n } from "@/lib/i18n";
import { EmptyState } from "@/components/feedback/EmptyState";
import { View } from "react-native";

SplashScreen.preventAutoHideAsync();
initMonitoring();

// Expo Router renders this in place of any subtree that throws, instead of the
// white screen a release build would otherwise show.
export function ErrorBoundary({ error, retry }) {
  reportError(error, { boundary: "root" });
  return <RootErrorFallback retry={retry} />;
}

/**
 * Split from the boundary itself so it can call `useTranslation`: Expo
 * Router's `ErrorBoundary` export is invoked as a plain function, and a
 * boundary that only renders on a throw would otherwise be stuck in whichever
 * language was active when the error happened.
 */
function RootErrorFallback({ retry }) {
  const { t } = useTranslation("common");
  return (
    <View className="flex-1 items-center justify-center bg-surface px-6">
      <EmptyState
        title={t("error.startupTitle")}
        description={t("error.startupDescription")}
        actionLabel={t("actions.retry")}
        onAction={retry}
      />
    </View>
  );
}

function AppContent() {
  useGlobalSocketEvents();
  usePushNotifications();
  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  // Read from AsyncStorage, so the splash holds until it lands - starting in
  // the device language and correcting a tick later would flash the wrong copy
  // across the whole first screen.
  const [localeReady, setLocaleReady] = useState(false);

  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);

  // Theme preference is read from AsyncStorage asynchronously; holding the
  // splash until it lands avoids a flash of the wrong theme on cold start.
  const themeHydrated = useThemeStore.persist.hasHydrated();
  const ready = fontsLoaded && themeHydrated && localeReady && !isCheckingAuth;

  useEffect(() => {
    setupI18n().finally(() => setLocaleReady(true));
  }, []);

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
      <I18nextProvider i18n={i18next}>
        <QueryProvider>
          <ThemeProvider>
            <SocketProvider>
              <AppContent />
              <OfflineBanner />
              <Toaster />
            </SocketProvider>
          </ThemeProvider>
        </QueryProvider>
      </I18nextProvider>
    </GestureHandlerRootView>
  );
}
