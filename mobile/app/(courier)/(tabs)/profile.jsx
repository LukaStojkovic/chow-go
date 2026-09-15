import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import {
  Bike,
  ImagePlus,
  LogOut,
  Package,
  ShieldCheck,
  Star,
  UserRound,
} from "lucide-react-native";
import { errorMessage } from "@/api/client";
import { pickImages } from "@/api/uploads";
import { Skeleton } from "@/components/feedback/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { Button, IconButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

import { Screen } from "@/components/ui/Screen";
import { SectionHeader } from "@/components/ui/Section";
import { Text } from "@/components/ui/Text";
import { AppearanceSettings } from "@/features/settings/AppearanceSettings";
import { useCourierProfile, useUpdateCourierProfile } from "@/hooks/Courier/useCourier";
import { useAuthStore } from "@/store/useAuthStore";
import { useMotionStore } from "@/store/useMotionStore";
import { useThemeStore } from "@/store/useThemeStore";
import { toast } from "@/store/useToastStore";
import { useTokens } from "@/theme/useTokens";

// Keys, not copy: module scope runs before a language is picked.
const VERIFICATION = {
  verified: { tone: "mint", labelKey: "courier:verification.verified" },
  pending: { tone: "warning", labelKey: "courier:verification.awaiting" },
  rejected: { tone: "danger", labelKey: "courier:verification.rejected" },
};

export default function CourierProfile() {
  const { t } = useTranslation(["courier", "profile", "order", "basket", "seller", "auth", "common"]);
  const { data, isLoading } = useCourierProfile();
  const update = useUpdateCourierProfile();
  const logout = useAuthStore((state) => state.logout);
  const theme = useThemeStore();
  const motion = useMotionStore();
  const { color } = useTokens();

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    if (!data) return;
    setFullName(data.fullName ?? "");
    setPhoneNumber(data.phoneNumber ?? "");
  }, [data]);

  const dirty =
    data && (fullName !== (data.fullName ?? "") || phoneNumber !== (data.phoneNumber ?? ""));
  const verification = VERIFICATION[data?.verificationStatus] ?? {
    tone: "neutral",
    labelKey: "common:state.unknown",
  };

  async function changePhoto() {
    const result = await pickImages({ limit: 1 });
    if (result.status === "denied") {
      toast.warning(t("common:error.photoAccess"), {
        description: t("common:error.enableInSettings"),
      });
      return;
    }
    if (!result.images.length) return;

    try {
      await update.mutateAsync({ profilePicture: result.images[0] });
      toast.success(t("courier:verification.photoUpdated"));
    } catch (error) {
      toast.error(t("courier:verification.photoFailed"), { description: errorMessage(error) });
    }
  }

  if (isLoading) {
    return (
      <Screen edges={["top"]} className="gap-4 p-5">
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </Screen>
    );
  }

  return (
    <Screen edges={["top"]}>
      <ScrollView
        contentContainerClassName="gap-3 px-5 pb-32 pt-2"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader
          title={t("profile.title")}
          size="lg"
          subtitle={t("profile.subtitle")}
          className="pb-1"
        />

        <Card className="gap-4" elevation="raised">
          <View className="flex-row items-center gap-4">
            <View className="h-16 w-16 overflow-hidden rounded-full bg-muted">
              {data?.profilePicture ? (
                <Image source={data.profilePicture} style={{ flex: 1 }} contentFit="cover" />
              ) : (
                <View className="flex-1 items-center justify-center">
                  <UserRound size={26} color={color["muted-foreground"]} />
                </View>
              )}
            </View>

            <View className="flex-1 gap-1">
              <Text variant="h2" numberOfLines={1}>
                {data?.fullName}
              </Text>
              <View className="flex-row items-center gap-1.5">
                <Star size={13} color={color.rating} fill={color.rating} />
                <Text variant="body-sm" tone="muted">
                  {data?.averageRating || "New"} · {data?.totalDeliveries ?? 0} deliveries
                </Text>
              </View>
            </View>

            <IconButton
              icon={ImagePlus}
              variant="mint"
              label={t("profile:account.changePhoto")}
              onPress={changePhoto}
            />
          </View>

          <View className="flex-row flex-wrap gap-2">
            {/* Verification gates whether jobs can be claimed at all, so it is
                  stated plainly rather than buried in a settings list. */}
            <Badge tone={verification.tone} icon={ShieldCheck}>
              {t(verification.labelKey)}
            </Badge>
            {data?.vehicleType ? (
              <Badge tone="neutral" icon={Bike}>
                {data.vehicleType}
              </Badge>
            ) : null}
            <Badge tone="info" icon={Package}>
              {`${data?.totalDeliveries ?? 0} total`}
            </Badge>
          </View>
        </Card>

        <Card className="gap-4">
          <View className="flex-row items-center gap-3">
            <Text variant="h3" className="flex-1">
              {t("profile:account.personalDetails")}
            </Text>
          </View>

          <Input
            label={t("auth:fields.fullName")}
            value={fullName}
            onChangeText={setFullName}
            autoComplete="name"
          />

          <Input
            label={t("profile:account.phone")}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            autoComplete="tel"
          />

          <Button
            size="lg"
            fullWidth
            disabled={!dirty}
            loading={update.isPending}
            onPress={async () => {
              try {
                await update.mutateAsync({ fullName, phoneNumber });
                toast.success(t("courier:verification.profileUpdated"));
              } catch (error) {
                toast.error(t("common:error.saveFailed"), { description: errorMessage(error) });
              }
            }}
          >
            {t("common:actions.saveChanges")}
          </Button>
        </Card>

        <AppearanceSettings />

        <Button
          variant="outline"
          size="lg"
          fullWidth
          className="mt-2"
          onPress={async () => {
            await logout();
            router.replace("/(auth)/welcome");
          }}
        >
          <View className="flex-row items-center gap-2">
            <LogOut size={17} color={color.destructive} />
            <Text variant="label" tone="destructive">
              {t("profile:logOut.action")}
            </Text>
          </View>
        </Button>
      
        <Button
          variant="ghost"
          size="md"
          fullWidth
          onPress={() => router.push("/delete-account")}
          accessibilityLabel={t("profile:deleteAccount.confirm")}
        >
          <Text variant="caption" tone="muted">
            {t("profile:deleteAccount.confirm")}
          </Text>
        </Button>
      </ScrollView>
    </Screen>
  );
}
