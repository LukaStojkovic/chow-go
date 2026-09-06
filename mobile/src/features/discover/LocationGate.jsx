import { View } from "react-native";
import { MapPin } from "lucide-react-native";
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
    <Screen className="items-center justify-center gap-5 p-8">
      <MapPin size={40} strokeWidth={1.5} color={color["muted-foreground"]} />
      <View className="items-center gap-2">
        <Text variant="h2" className="text-center">
          Where are we delivering?
        </Text>
        <Text variant="body" tone="muted" className="text-center">
          We use your location to show restaurants that deliver to you.
        </Text>
      </View>
      <Button size="lg" loading={isDetecting} onPress={detect} className="self-stretch">
        Use my current location
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
