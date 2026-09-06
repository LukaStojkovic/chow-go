import { useEffect, useRef, useState } from "react";
import { ScrollView, View } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Check, ImagePlus, Loader, LogOut } from "lucide-react-native";
import { normalizeSchedule } from "@chowgo/shared/schedule";
import { errorMessage } from "@/api/client";
import { pickImages } from "@/api/uploads";
import { Skeleton } from "@/components/feedback/Skeleton";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
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
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </Screen>
    );
  }

  return (
    <Screen edges={["top"]}>
      <ScrollView contentContainerClassName="gap-6 p-5 pb-28" keyboardShouldPersistTaps="handled">
        <View className="flex-row items-center justify-between">
          <Text variant="h1">Settings</Text>
          <View className="h-5 flex-row items-center gap-1.5">
            {update.isPending ? (
              <>
                <Loader size={13} color={color["muted-foreground"]} />
                <Text variant="caption" tone="muted">
                  Saving
                </Text>
              </>
            ) : saved ? (
              <>
                <Check size={13} color={color.success} />
                <Text variant="caption" tone="success">
                  Saved
                </Text>
              </>
            ) : null}
          </View>
        </View>

        <View className="flex-row items-center gap-3">
          <View className="h-16 w-16 overflow-hidden rounded-md bg-muted">
            {data?.profilePicture ? (
              <Image source={data.profilePicture} style={{ flex: 1 }} contentFit="cover" />
            ) : null}
          </View>
          <Button variant="outline" size="sm" onPress={changeLogo}>
            <View className="flex-row items-center gap-2">
              <ImagePlus size={15} color={color.foreground} />
              <Text variant="label">Change logo</Text>
            </View>
          </Button>
        </View>

        <View className="gap-4">
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
            className="h-20 py-3"
            style={{ textAlignVertical: "top" }}
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
        </View>

        <View className="gap-2">
          <Text variant="h3">Opening hours</Text>
          <Text variant="caption" tone="muted">
            Set the same opening and closing time to stay open around the clock.
          </Text>
          <ScheduleEditor
            schedule={draft.schedule}
            onChangeDay={(day, entry) => edit({ schedule: { ...draft.schedule, [day]: entry } })}
          />
        </View>

        <Button
          variant="outline"
          onPress={async () => {
            await logout();
            router.replace("/(auth)/welcome");
          }}
        >
          <View className="flex-row items-center gap-2">
            <LogOut size={16} color={color.foreground} />
            <Text variant="label">Sign out</Text>
          </View>
        </Button>
      </ScrollView>
    </Screen>
  );
}
