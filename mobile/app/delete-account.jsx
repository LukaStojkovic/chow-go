import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation(["profile", "order", "basket", "errors", "common"]);
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
      toast.success(t("profile:account.accountDeleted"));
      router.replace("/(auth)/welcome");
    } catch (error) {
      toast.error(t("profile:account.accountDeleteFailed"), {
        description: errorMessage(error),
      });
      setBusy(false);
    }
  }

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader title={t("deleteAccount.title")} onBack={() => router.back()} />

      <ScrollView
        contentContainerClassName="gap-5 px-5 pb-10"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <Text variant="body" tone="muted">
          {t("deleteAccount.body1")}
        </Text>

        <View className="gap-2 rounded-lg bg-muted p-4">
          <Text variant="label">{t("deleteAccount.whatIsKept")}</Text>
          <Text variant="caption" tone="muted">
            {t("deleteAccount.body2")}
          </Text>
        </View>

        <Text variant="caption" tone="muted">
          {t("deleteAccount.body3")}
        </Text>

        {needsPassword ? (
          <Input
            label={t("deleteAccount.confirmLabel")}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            textContentType="password"
            accessibilityLabel={t("deleteAccount.confirmLabel")}
          />
        ) : null}

        <Button
          variant={confirmed ? "outline" : "ghost"}
          size="md"
          fullWidth
          onPress={() => setConfirmed((value) => !value)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: confirmed }}
          accessibilityLabel={t("deleteAccount.understand")}
        >
          <Text variant="label" tone={confirmed ? "destructive" : "muted"}>
            {confirmed
              ? `✓ ${t("deleteAccount.understand")}`
              : t("deleteAccount.understand")}
          </Text>
        </Button>

        <Button
          variant="destructive"
          size="lg"
          fullWidth
          disabled={!canSubmit}
          loading={busy}
          onPress={onDelete}
          accessibilityLabel={t("deleteAccount.permanently")}
        >
          <Text variant="label" tone="inverse">
            {t("deleteAccount.confirm")}
          </Text>
        </Button>

        <Button variant="ghost" size="md" fullWidth onPress={() => router.back()}>
          <Text variant="label" tone="muted">
            {t("deleteAccount.cancel")}
          </Text>
        </Button>
      </ScrollView>
    </Screen>
  );
}
