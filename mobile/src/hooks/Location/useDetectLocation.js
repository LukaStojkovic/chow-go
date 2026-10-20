import { useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import { errorMessage } from "@/api/client";
import { reverseGeocode } from "@/services/apiLocation";
import { useDeliveryStore } from "@/store/useDeliveryStore";
import { t } from "@chowgo/shared/i18n";

import { toast } from "@/store/useToastStore";
import { useLocationPermission } from "./useLocationPermission";

export function useDetectLocation({ onRecovered } = {}) {
  const setLocation = useDeliveryStore((state) => state.setLocation);
  const [isDetecting, setIsDetecting] = useState(false);
  const permission = useLocationPermission("foreground");
  const waiting = useRef(false);
  const recovered = useRef(onRecovered);
  recovered.current = onRecovered;

  async function detect() {
    setIsDetecting(true);
    try {
      const result = await Location.requestForegroundPermissionsAsync();
      permission.update(result);
      if (result?.status !== "granted") {
        if (result?.canAskAgain === false) {
          waiting.current = true;
        } else {
          toast.warning(t("common:error.locationPermission"), {
            description: t("common:error.enableInSettingsOrType"),
          });
        }
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

  const detectRef = useRef(detect);
  detectRef.current = detect;

  useEffect(() => {
    if (permission.blocked) waiting.current = true;
  }, [permission.blocked]);

  useEffect(() => {
    if (!permission.granted || !waiting.current) return;
    waiting.current = false;
    detectRef.current().then((result) => {
      if (result) recovered.current?.(result);
    });
  }, [permission.granted]);

  return { detect, isDetecting, blocked: permission.blocked };
}
