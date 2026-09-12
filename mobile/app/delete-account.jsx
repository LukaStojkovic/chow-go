import { useState } from "react";
import { ScrollView, View } from "react-native";
import { router } from "expo-router";

import { errorMessage } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Screen, ScreenHeader } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "@/store/useToastStore";

// Lives outside the role groups so all three roles reach the same screen.
// Required by App Store Review Guideline 5.1.1(v) and by Google Play, and it
// has to be findable in the app rather than only on a website.
export default function DeleteAccount() {
  const authUser = useAuthStore((state) => state.authUser);
  const deleteAccount = useAuthStore((state) => state.deleteAccount);

  const [password, setPassword] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);

  // A Google account has no password to re-enter; the session is the proof.
  const needsPassword = authUser?.authProvider !== "google";
  const canSubmit = confirmed && (!needsPassword || password.length > 0) && !busy;

  async function onDelete() {
    setBusy(true);
    try {
      await deleteAccount(needsPassword ? password : undefined);
      toast.success("Your account has been deleted");
      router.replace("/(auth)/welcome");
    } catch (error) {
      toast.error("Could not delete your account", { description: errorMessage(error) });
      setBusy(false);
    }
  }

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader title="Delete account" onBack={() => router.back()} />

      <ScrollView
        contentContainerClassName="gap-5 px-5 pb-10"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <Text variant="body" tone="muted">
          This cannot be undone. Your name, email, phone number and saved
          addresses are removed straight away, and you are signed out everywhere.
        </Text>

        <View className="gap-2 rounded-lg bg-muted p-4">
          <Text variant="label">What is kept</Text>
          <Text variant="caption" tone="muted">
            Past orders stay on record without your personal details, because
            they are also the restaurant's and the courier's receipts. Nobody can
            tell they were yours.
          </Text>
        </View>

        <Text variant="caption" tone="muted">
          If you have an order on its way, wait until it arrives — we cannot
          delete an account mid-delivery.
        </Text>

        {needsPassword ? (
          <Input
            label="Confirm your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            textContentType="password"
            accessibilityLabel="Confirm your password to delete your account"
          />
        ) : null}

        <Button
          variant={confirmed ? "outline" : "ghost"}
          size="md"
          fullWidth
          onPress={() => setConfirmed((value) => !value)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: confirmed }}
          accessibilityLabel="I understand this cannot be undone"
        >
          <Text variant="label" tone={confirmed ? "destructive" : "muted"}>
            {confirmed ? "✓ I understand this cannot be undone" : "I understand this cannot be undone"}
          </Text>
        </Button>

        <Button
          variant="destructive"
          size="lg"
          fullWidth
          disabled={!canSubmit}
          loading={busy}
          onPress={onDelete}
          accessibilityLabel="Permanently delete my account"
        >
          <Text variant="label" tone="inverse">
            Delete my account
          </Text>
        </Button>

        <Button variant="ghost" size="md" fullWidth onPress={() => router.back()}>
          <Text variant="label" tone="muted">
            Keep my account
          </Text>
        </Button>
      </ScrollView>
    </Screen>
  );
}
