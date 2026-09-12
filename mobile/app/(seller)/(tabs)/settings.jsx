import { useEffect, useRef, useState } from "react";
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
        toast.error("Could not save", { description: errorMessage(error) });
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
      toast.warning("Photo access needed", { description: "Turn it on in Settings." });
      return;
    }
    if (!result.images.length) return;

    try {
      await update.mutateAsync({ profilePicture: result.images[0] });
      toast.success("Logo updated");
    } catch (error) {
      toast.error("Could not update the logo", { description: errorMessage(error) });
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
            title="Settings"
            size="lg"
            subtitle="Your storefront and hours"
            className="flex-1"
          />

          {update.isPending ? (
            <Badge tone="neutral" icon={Loader} size="sm">
              Saving
            </Badge>
          ) : saved ? (
            <Badge tone="mint" icon={Check} size="sm">
              Saved
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
              {draft.name || "Your restaurant"}
            </Text>
            <Text variant="caption" tone="muted">
              Shown on every card and order
            </Text>
          </View>
          <Button variant="mint" size="sm" onPress={changeLogo}>
            <View className="flex-row items-center gap-1.5">
              <ImagePlus size={15} color={color.primary} />
              <Text variant="label-sm" tone="primary">
                Logo
              </Text>
            </View>
          </Button>
        </Card>

        <Card className="gap-4">
          <View className="flex-row items-center gap-3">
            <Text variant="h3" className="flex-1">
              Storefront
            </Text>
          </View>

          <Input
            label="Restaurant name"
            value={draft.name}
            onChangeText={(name) => edit({ name })}
          />

          <Input
            label="Description"
            value={draft.description}
            onChangeText={(description) => edit({ description })}
            multiline
          />

          <Input
            label="Phone"
            value={draft.phone}
            onChangeText={(phone) => edit({ phone })}
            keyboardType="phone-pad"
          />

          <Input
            label="Email"
            value={draft.email}
            onChangeText={(email) => edit({ email })}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Delivery estimate"
            value={draft.estimatedDeliveryTime}
            onChangeText={(estimatedDeliveryTime) => edit({ estimatedDeliveryTime })}
            placeholder="30-45 min"
            hint="Shown on your restaurant card."
          />
        </Card>

        <Card className="gap-3">
          <View className="flex-row items-center gap-3">
            <View className="flex-1">
              <Text variant="h3">Opening hours</Text>
              <Text variant="caption" tone="muted">
                Same opening and closing time means open around the clock
              </Text>
            </View>
          </View>
          <ScheduleEditor
            schedule={draft.schedule}
            onChangeDay={(day, entry) => edit({ schedule: { ...draft.schedule, [day]: entry } })}
          />
        </Card>

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
              Sign out
            </Text>
          </View>
        </Button>
      
        <Button
          variant="ghost"
          size="md"
          fullWidth
          onPress={() => router.push("/delete-account")}
          accessibilityLabel="Delete my account"
        >
          <Text variant="caption" tone="muted">
            Delete my account
          </Text>
        </Button>
      </ScrollView>
    </Screen>
  );
}
