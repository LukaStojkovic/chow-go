import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { Crosshair, MapPin } from "lucide-react-native";
import { Map, MapMarker, toRegion } from "@/components/map/Map";
import { Button, IconButton } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { useDetectLocation } from "@/hooks/Location/useDetectLocation";
import { useReverseGeocode } from "@/hooks/Location/useReverseGeocode";
import { useDeliveryStore } from "@/store/useDeliveryStore";
import { useTokens } from "@/theme/useTokens";
import { AddressAutocomplete } from "./AddressAutocomplete";

// Far enough out that a wrong guess is obviously a wrong guess, rather than a
// street somewhere the customer has never been.
const WORLD = toRegion([25, 12], 120);
const STREET = 0.006;

/**
 * Drop a pin on the map to say where the food goes.
 *
 * Three ways in, because none of them covers everyone: tap the map (the only
 * one that works for a building with no usable street address), search for a
 * street, or take the GPS fix. Whichever is used, the pin is what gets saved -
 * the address text is a label for it, and the coordinates are what decides
 * which restaurants can deliver.
 */
export function LocationPicker({
  initialPosition,
  onConfirm,
  confirmLabel = "Confirm location",
  isConfirming = false,
}) {
  const storeCoordinates = useDeliveryStore((state) => state.coordinates);
  const { detect, isDetecting } = useDetectLocation();
  const { color, elevation, scheme } = useTokens();

  const [pin, setPin] = useState(initialPosition ?? null);
  // Kept apart from the pin: tapping recentres nothing, so the map does not
  // slide out from under the thumb that just tapped it.
  const [camera, setCamera] = useState(
    initialPosition ?? (storeCoordinates ? [storeCoordinates.lat, storeCoordinates.lon] : null),
  );
  // What search or the GPS fix already named, shown until the lookup for the
  // pin's own coordinates comes back.
  const [chosenAddress, setChosenAddress] = useState(null);

  // The lookup runs on a settled pin. Dropping one is a single tap, but a
  // correction is three or four in a row, and each one would otherwise be a
  // request to a rate-limited geocoder.
  const [settled, setSettled] = useState(pin);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(pin), 450);
    return () => clearTimeout(timer);
  }, [pin]);

  const { data, isFetching } = useReverseGeocode(settled);
  const address = chosenAddress ?? data?.address ?? null;

  function moveTo(position, label = null) {
    setPin(position);
    setCamera(position);
    setChosenAddress(label);
  }

  // Nothing to centre on means a world view, which helps nobody - so ask for
  // the fix the customer would have reached for anyway. Declining still leaves
  // search and the map itself.
  const asked = useRef(false);
  useEffect(() => {
    if (asked.current || camera) return;
    asked.current = true;
    detect().then((result) => {
      if (result) moveTo([result.coordinates.lat, result.coordinates.lon], result.address);
    });
  }, []);

  return (
    <View className="flex-1">
      <View className="flex-1 overflow-hidden">
        <Map
          style={{ flex: 1 }}
          initialRegion={camera ? toRegion(camera, STREET) : WORLD}
          onMapPress={(position) => {
            setPin(position);
            setChosenAddress(null);
          }}
        >
          <MapMarker id="address-pin" position={pin}>
            <View
              style={{ backgroundColor: color.primary }}
              className="h-11 w-11 items-center justify-center rounded-full border-[3px] border-scrim-foreground"
            >
              <MapPin size={20} color={color["primary-foreground"]} />
            </View>
          </MapMarker>
        </Map>

        <View className="absolute left-5 right-5 top-3">
          <AddressAutocomplete
            label={null}
            placeholder="Search for a street"
            onSelect={({ address: found, lat, lon }) => moveTo([lat, lon], found)}
          />
        </View>

        <View style={elevation.raised[scheme]} className="absolute bottom-4 right-5 rounded-full">
          <IconButton
            icon={Crosshair}
            variant="surface"
            size={48}
            label="Use my current location"
            disabled={isDetecting}
            onPress={() =>
              detect().then((result) => {
                if (result)
                  moveTo([result.coordinates.lat, result.coordinates.lon], result.address);
              })
            }
          />
        </View>
      </View>

      <View style={elevation.raised[scheme]} className="gap-3 rounded-t-xl bg-card px-5 pb-4 pt-4">
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-subtle">
            <MapPin size={18} color={color.primary} />
          </View>
          <View className="flex-1">
            <Text variant="label-sm" tone="muted">
              {pin ? "Delivering to" : "No pin yet"}
            </Text>
            <Text variant="body" numberOfLines={2}>
              {pin
                ? (address ?? (isFetching ? "Looking up the address…" : "Dropped pin"))
                : "Tap the map, search, or use your location."}
            </Text>
          </View>
        </View>

        <Button
          size="lg"
          fullWidth
          disabled={!pin}
          loading={isConfirming}
          onPress={() => onConfirm({ lat: pin[0], lng: pin[1], address: address ?? "" })}
        >
          {confirmLabel}
        </Button>
      </View>
    </View>
  );
}
