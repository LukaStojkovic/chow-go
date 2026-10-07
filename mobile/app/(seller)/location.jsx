import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { router } from "expo-router";
import { errorMessage } from "@/api/client";
import { Skeleton } from "@/components/feedback/Skeleton";
import { Screen, ScreenHeader } from "@/components/ui/Screen";
import { LocationPicker } from "@/features/location/LocationPicker";
import { useOwnRestaurant, useUpdateRestaurant } from "@/hooks/Restaurants/useOwnRestaurant";
import { toast } from "@/store/useToastStore";

export default function RestaurantLocation() {
  const { t } = useTranslation(["seller", "common"]);
  const { data } = useOwnRestaurant();
  const update = useUpdateRestaurant();

  const [lng, lat] = data?.location?.coordinates ?? [];
  const initialPosition = Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : undefined;

  async function save({ lat: pinLat, lng: pinLng }) {
    try {
      await update.mutateAsync({ location: { lat: pinLat, lng: pinLng } });
      toast.success(t("settings.location.pinSaved"));
      router.back();
    } catch (error) {
      toast.error(t("common:error.saveFailed"), { description: errorMessage(error) });
    }
  }

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader title={t("settings.location.pinHeading")} subtitle={t("settings.location.pinHint")} />
      {data ? (
        <LocationPicker
          initialPosition={initialPosition}
          confirmLabel={t("settings.location.savePin")}
          isConfirming={update.isPending}
          onConfirm={save}
        />
      ) : (
        <View className="flex-1 px-5">
          <Skeleton className="h-full w-full rounded-lg" />
        </View>
      )}
    </Screen>
  );
}
