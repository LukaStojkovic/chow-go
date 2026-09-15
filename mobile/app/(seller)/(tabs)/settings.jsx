import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Check, ImagePlus, Loader, LogOut, Store } from "lucide-react-native";
import { normalizeSchedule } from "@chowgo/shared/schedule";
import { errorMessage } from "@/api/client";
import { pickImages } from "@/api/uploads";
import { Skeleton } from "@/components/feedback/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LanguagePicker } from "@/features/settings/LanguagePicker";

import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { SectionHeader } from "@/components/ui/Section";
import { Text } from "@/components/ui/Text";
import { ScheduleEditor } from "@/features/seller/ScheduleEditor";
import { useOwnRestaurant, useUpdateRestaurant } from "@/hooks/Restaurants/useOwnRestaurant";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "@/store/useToastStore";
import { useTokens } from "@/theme/useTokens";

const AUTOSAVE_MS = 1000;

export default function SellerSettings() {
  const { t } = useTranslation(["seller", "profile", "order", "basket", "common"]);
  const { data, isLoading } = useOwnRestaurant();
  const update = useUpdateRestaurant();
  const logout = useAuthStore((state) => state.logout);
  const { color } = useTokens();

  const [draft, setDraft] = useState(null);
  const [saved, setSaved] = useState(false);
  const timer = useRef(null);
  // Nothing has changed on first render, so the initial hydrate must not
  // trigger a save.
  const dirty = useRef(false);

  useEffect(() => {
    if (!data || draft) return;
    setDraft({
      name: data.name ?? "",
      description: data.description ?? "",
      phone: data.phone ?? "",
      email: data.email ?? "",
      estimatedDeliveryTime: data.estimatedDeliveryTime ?? "",
      schedule: normalizeSchedule(data.schedule),
    });
  }, [data, draft]);

  // Debounced autosave, matching the web. A seller adjusting hours should not
  // have to find a save button, and a request per keystroke would be absurd.
  useEffect(() => {
    if (!draft || !dirty.current) return;

    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        await update.mutateAsync(draft);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (error) {
        toast.error(t("common:error.saveFailed"), { description: errorMessage(error) });
      }
    }, AUTOSAVE_MS);

    return () => clearTimeout(timer.current);
  }, [draft]);

  const edit = (patch) => {
    dirty.current = true;
    setDraft((current) => ({ ...current, ...patch }));
  };

  async function changeLogo() {
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
      toast.success(t("seller:settings.logoUpdated"));
    } catch (error) {
      toast.error(t("seller:settings.logoFailed"), { description: errorMessage(error) });
    }
  }

  if (isLoading || !draft) {
    return (
      <Screen edges={["top"]} className="gap-4 p-5">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-72 w-full rounded-lg" />
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
        {/* There is no save button - the form autosaves - so this badge is the
              only thing telling the seller their edit landed. */}
        <View className="flex-row items-end justify-between gap-3 pb-1">
          <SectionHeader
            title={t("settings.title")}
            size="lg"
            subtitle={t("settings.shortSubtitle")}
            className="flex-1"
          />

          {update.isPending ? (
            <Badge tone="neutral" icon={Loader} size="sm">
              {t("common:state.saving")}
            </Badge>
          ) : saved ? (
            <Badge tone="mint" icon={Check} size="sm">
              {t("settings.savedShort")}
            </Badge>
          ) : null}
        </View>

        <Card className="flex-row items-center gap-4">
          <View className="h-16 w-16 overflow-hidden rounded-md bg-muted">
            {data?.profilePicture ? (
              <Image source={data.profilePicture} style={{ flex: 1 }} contentFit="cover" />
            ) : (
              <View className="flex-1 items-center justify-center">
                <Store size={22} color={color["muted-foreground"]} />
              </View>
            )}
          </View>
          <View className="flex-1 gap-1">
            <Text variant="h3" numberOfLines={1}>
              {draft.name || t("settings.yourRestaurant")}
            </Text>
            <Text variant="caption" tone="muted">
              {t("settings.logoHint")}
            </Text>
          </View>
          <Button variant="mint" size="sm" onPress={changeLogo}>
            <View className="flex-row items-center gap-1.5">
              <ImagePlus size={15} color={color.primary} />
              <Text variant="label-sm" tone="primary">
                {t("settings.profile.logo")}
              </Text>
            </View>
          </Button>
        </Card>

        <Card className="gap-4">
          <View className="flex-row items-center gap-3">
            <Text variant="h3" className="flex-1">
              {t("settings.storefront")}
            </Text>
          </View>

          <Input
            label={t("settings.profile.name")}
            value={draft.name}
            onChangeText={(name) => edit({ name })}
          />

          <Input
            label={t("settings.profile.description")}
            value={draft.description}
            onChangeText={(description) => edit({ description })}
            multiline
          />

          <Input
            label={t("settings.profile.phone")}
            value={draft.phone}
            onChangeText={(phone) => edit({ phone })}
            keyboardType="phone-pad"
          />

          <Input
            label={t("settings.profile.email")}
            value={draft.email}
            onChangeText={(email) => edit({ email })}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label={t("settings.delivery.estimate")}
            value={draft.estimatedDeliveryTime}
            onChangeText={(estimatedDeliveryTime) => edit({ estimatedDeliveryTime })}
            placeholder={t("settings.delivery.estimatePlaceholder")}
            hint={t("settings.delivery.estimateShortHint")}
          />
        </Card>

        <Card className="gap-3">
          <View className="flex-row items-center gap-3">
            <View className="flex-1">
              <Text variant="h3">{t("settings.hours.heading")}</Text>
              <Text variant="caption" tone="muted">
                {t("settings.hours.allDayHint")}
              </Text>
            </View>
          </View>
          <ScheduleEditor
            schedule={draft.schedule}
            onChangeDay={(day, entry) => edit({ schedule: { ...draft.schedule, [day]: entry } })}
          />
        </Card>

        <LanguagePicker />

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
