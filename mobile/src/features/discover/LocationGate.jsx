import { View } from "react-native";
import { Crosshair, MapPin } from "lucide-react-native";
import { IconTile } from "@/components/ui/IconTile";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { AddressAutocomplete } from "@/features/location/AddressAutocomplete";
import { useDetectLocation } from "@/hooks/Location/useDetectLocation";
import { useDeliveryStore } from "@/store/useDeliveryStore";
import { useTokens } from "@/theme/useTokens";

// Every discovery endpoint is geo-scoped, so there is no useful feed to show
// before there are coordinates.
export function LocationGate() {
  const { detect, isDetecting } = useDetectLocation();
  const setLocation = useDeliveryStore((state) => state.setLocation);
  const { color } = useTokens();

  return (
    <Screen className="items-center justify-center gap-6 p-6">
      <IconTile icon={MapPin} tone="mint" size={80} round />
      <View className="items-center gap-2">
        <Text variant="h1" className="text-center">
          Where are we delivering?
        </Text>
        <Text variant="body-lg" tone="muted" className="text-center">
          Every kitchen on Chow delivers to a radius, so we need a point on the map before we can
          show you anything.
        </Text>
      </View>
      <Button size="lg" fullWidth loading={isDetecting} onPress={detect}>
        <View className="flex-row items-center gap-2">
          <Crosshair size={18} color={color["primary-foreground"]} />
          <Text variant="body-lg" className="font-jakarta-bold text-primary-foreground">
            Use my current location
          </Text>
        </View>
      </Button>

      <View className="w-full flex-row items-center gap-3">
        <View className="h-px flex-1 bg-border" />
        <Text variant="caption" tone="muted">
          or
        </Text>
        <View className="h-px flex-1 bg-border" />
      </View>

      <View className="w-full">
        <AddressAutocomplete
          label="Enter an address"
          onSelect={({ address, lat, lon }) => setLocation({ address, coordinates: { lat, lon } })}
        />
      </View>
    </Screen>
  );
}
