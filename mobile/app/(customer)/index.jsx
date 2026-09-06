import { View } from "react-native";
import { router } from "expo-router";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { useSocket } from "@/realtime/SocketProvider";
import { useAuthStore } from "@/store/useAuthStore";

// Placeholder home. Discovery lands next; this exists so the auth stack has
// somewhere real to land and so the socket can be seen connecting after login.
export default function CustomerHome() {
  const { authUser, logout } = useAuthStore();
  const { isConnected, isRegistered } = useSocket();

  return (
    <Screen className="gap-5 p-5">
      <View className="gap-1">
        <Text variant="h1">Chow &amp; Go</Text>
        <Text variant="body" tone="muted">
          {authUser ? `Signed in as ${authUser.name}` : "Browsing as a guest"}
        </Text>
      </View>

      {authUser ? (
        <Card className="gap-1">
          <Text variant="label">Realtime</Text>
          <Text variant="body-sm" tone={isConnected ? "success" : "muted"}>
            {isConnected ? "connected" : "not connected"}
            {isRegistered ? " · registered" : ""}
          </Text>
        </Card>
      ) : null}

      <View className="gap-3">
        <Button variant="outline" onPress={() => router.push("/dev")}>
          Design kitchen sink
        </Button>
        {authUser ? (
          <Button
            variant="ghost"
            onPress={async () => {
              await logout();
              router.replace("/(auth)/welcome");
            }}
          >
            Sign out
          </Button>
        ) : (
          <Button onPress={() => router.push("/(auth)/login")}>Sign in</Button>
        )}
      </View>
    </Screen>
  );
}
