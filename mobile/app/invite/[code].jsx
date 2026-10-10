import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { Gift } from "lucide-react-native";
import { formatPrice } from "@chowgo/shared/format";
import { referralRewardsFor } from "@chowgo/shared/referral";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { savePendingReferral } from "@/features/referral/pendingReferral";
import { homeForRole } from "@/navigation/homeForRole";
import { useAuthStore } from "@/store/useAuthStore";
import { useTokens } from "@/theme/useTokens";

export default function InviteLink() {
  const { t } = useTranslation(["profile", "auth"]);
  const { color } = useTokens();
  const { code } = useLocalSearchParams();
  const authUser = useAuthStore((state) => state.authUser);
  const [stored, setStored] = useState(false);

  useEffect(() => {
    let active = true;
    savePendingReferral(Array.isArray(code) ? code[0] : code).finally(() => {
      if (active) setStored(true);
    });
    return () => {
      active = false;
    };
  }, [code]);

  if (!stored) return null;
  if (authUser) return <Redirect href={homeForRole(authUser.role)} />;

  const rewards = referralRewardsFor(undefined);
  const money = (amount) => formatPrice(amount, { currency: rewards.currency });

  return (
    <Screen className="justify-center gap-6 px-6">
      <View className="items-center gap-3">
        <Gift size={40} color={color.primary} />
        <Text variant="h1" className="text-center">
          {t("profile:referral.landingTitle")}
        </Text>
        <Text variant="body" tone="muted" className="text-center">
          {t("profile:referral.landingBody", {
            amount: money(rewards.friend),
            min: money(rewards.minSubtotal),
          })}
        </Text>
        <Text variant="caption" tone="muted" className="text-center">
          {t("profile:referral.pending")}
        </Text>
      </View>
      <Button size="lg" fullWidth onPress={() => router.replace("/(auth)/register")}>
        {t("auth:register.submit")}
      </Button>
      <Button variant="ghost" size="md" fullWidth onPress={() => router.replace("/(customer)")}>
        {t("profile:referral.landingCta")}
      </Button>
    </Screen>
  );
}
