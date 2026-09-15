import { useState } from "react";
import * as Location from "expo-location";
import { errorMessage } from "@/api/client";
import { reverseGeocode } from "@/services/apiLocation";
import { useDeliveryStore } from "@/store/useDeliveryStore";
import { t } from "@chowgo/shared/i18n";

import { toast } from "@/store/useToastStore";

export function useDetectLocation() {
  const setLocation = useDeliveryStore((state) => state.setLocation);
  const [isDetecting, setIsDetecting] = useState(false);

  async function detect() {
    setIsDetecting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        toast.warning(t("common:error.locationPermission"), {
          description: t("common:error.enableInSettingsOrType"),
        });
        return null;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coordinates = {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
      };

      // A failed lookup should not block ordering - coordinates are what the
      // feed actually needs, the address is only ever shown.
      let address = null;
      try {
        ({ address } = await reverseGeocode(coordinates));
      } catch {
        address = t("profile:address.currentLocation");
      }

      setLocation({ address, coordinates });
      return { address, coordinates };
    } catch (error) {
      toast.error(t("profile:address.locationFailed"), { description: errorMessage(error) });
      return null;
    } finally {
      setIsDetecting(false);
    }
  }

  return { detect, isDetecting };
}
