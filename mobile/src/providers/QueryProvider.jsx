import NetInfo from "@react-native-community/netinfo";
import {
  QueryClient,
  QueryClientProvider,
  focusManager,
  onlineManager,
} from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AppState } from "react-native";

import { registerQueryClient } from "@/lib/i18n";

// The web runs staleTime: 0 and leans on socket-driven invalidation. A
// backgrounded phone drops that socket far harder than a hidden browser tab, so
// foreground and reconnect have to trigger a refetch here.
onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => {
    setOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
  }),
);

export function QueryProvider({ children }) {
  const [client] = useState(() => {
    const created = new QueryClient({
      defaultOptions: {
        queries: { staleTime: 0, retry: 1, refetchOnWindowFocus: true },
      },
    });

    // Lets the language switcher drop cached view models: the shared adapters
    // resolve their copy when they run, so a cached order would otherwise keep
    // the labels it was built with.
    registerQueryClient(created);
    return created;
  });

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (status) => {
      focusManager.setFocused(status === "active");
    });
    return () => subscription.remove();
  }, []);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
