import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Share, View } from "react-native";
import { Gift, Share2, TicketPercent } from "lucide-react-native";
import { formatPrice } from "@chowgo/shared/format";
import { normalizeReferralCode, referralLink, referralRewardsFor } from "@chowgo/shared/referral";
import { errorMessage } from "@/api/client";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Skeleton } from "@/components/feedback/Skeleton";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Screen, ScreenHeader } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { clearPendingReferral, useReferralApplyToast } from "@/features/referral/pendingReferral";
import { useApplyReferralCode, useMyReferral } from "@/hooks/Referral/useReferral";
import { WEB_URL } from "@/lib/config";
import { useTokens } from "@/theme/useTokens";

function StatTile({ label }) {
  return (
    <Card className="flex-1 p-3.5">
      <Text variant="label">{label}</Text>
    </Card>
  );
}

function ApplyCodeCard() {
  const { t } = useTranslation(["profile"]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState(null);
  const applyCode = useApplyReferralCode();
  const notify = useReferralApplyToast();

  const apply = () => {
    const code = normalizeReferralCode(draft);
    if (!code) return;
    setError(null);
    applyCode.mutate(code, {
      onSuccess: (result) => {
        setDraft("");
        clearPendingReferral();
        notify.success(result);
      },
      onError: (err) => setError(errorMessage(err)),
    });
  };

  return (
    <Card className="gap-3">
      <Text variant="label">{t("profile:referral.haveCode")}</Text>
      <View className="flex-row items-start gap-2">
        <Input
          containerClassName="flex-1"
          value={draft}
          onChangeText={(value) => {
            setDraft(value.toUpperCase());
            if (error) setError(null);
          }}
          placeholder={t("profile:referral.enterCodePlaceholder")}
          accessibilityLabel={t("profile:referral.enterCode")}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={16}
          returnKeyType="done"
          onSubmitEditing={apply}
          error={error}
        />
        <Button
          variant="mint"
          size="md"
          className="h-14"
          disabled={!draft.trim()}
          loading={applyCode.isPending}
          onPress={apply}
        >
          {t("profile:referral.apply")}
        </Button>
      </View>
    </Card>
  );
}

export default function Invite() {
  const { t } = useTranslation(["profile", "common"]);
  const { color } = useTokens();
  const referral = useMyReferral();
  const data = referral.data;
  const rewards = data?.rewards ?? referralRewardsFor(undefined);
  const money = (amount) => formatPrice(amount, { currency: rewards.currency });

  const share = () => {
    if (!data?.code) return;
    Share.share({
      message: t("profile:referral.shareMessage", {
        amount: money(rewards.friend),
        code: data.code,
        link: referralLink(WEB_URL, data.code),
      }),
    }).catch(() => {});
  };

  return (
    <Screen>
      <ScreenHeader title={t("profile:referral.title")} />
      {referral.isError ? (
        <EmptyState
          icon={Gift}
          title={t("common:error.generic")}
          actionLabel={t("common:actions.retry")}
          onAction={() => referral.refetch()}
        />
      ) : (
        <ScrollView
          contentContainerClassName="gap-4 px-5 pb-10"
          showsVerticalScrollIndicator={false}
        >
          <Card className="items-center gap-3 py-6">
            <Gift size={28} color={color.primary} />
            <Text variant="caption" tone="muted">
              {t("profile:referral.yourCode")}
            </Text>
            {data?.code ? (
              <Text variant="display" selectable className="tracking-widest">
                {data.code}
              </Text>
            ) : (
              <Skeleton className="h-10 w-48" />
            )}
            <Button size="lg" fullWidth disabled={!data?.code} onPress={share}>
              <View className="flex-row items-center gap-2">
                <Share2 size={18} color={color["primary-foreground"]} />
                <Text variant="body-lg" tone="inverse" className="font-jakarta-bold">
                  {t("profile:referral.share")}
                </Text>
              </View>
            </Button>
          </Card>

          <Text variant="body" tone="muted">
            {t("profile:referral.hint", {
              friend: money(rewards.friend),
              min: money(rewards.minSubtotal),
              referrer: money(rewards.referrer),
            })}
          </Text>

          {data ? (
            <View className="flex-row gap-2.5">
              <StatTile
                label={t("profile:referral.invited", { count: data.stats?.invited ?? 0 })}
              />
              <StatTile
                label={t("profile:referral.rewarded", { count: data.stats?.rewarded ?? 0 })}
              />
            </View>
          ) : null}

          {data?.appliedCode ? (
            <Card className="flex-row items-center gap-3">
              <TicketPercent size={20} color={color.primary} />
              <Text variant="body-sm" className="flex-1">
                {t("profile:referral.appliedCode", { code: data.appliedCode })}
              </Text>
            </Card>
          ) : data?.canApplyCode ? (
            <ApplyCodeCard />
          ) : null}
        </ScrollView>
      )}
    </Screen>
  );
}
