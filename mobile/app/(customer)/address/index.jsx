import { ScrollView, View } from "react-native";
import { router } from "expo-router";
import { Crosshair, MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react-native";
import { MAX_SAVED_ADDRESSES } from "@chowgo/shared/constants";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button, IconButton } from "@/components/ui/Button";
import { Inset, PressableCard } from "@/components/ui/Card";
import { Screen, ScreenHeader } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { useAddresses, useDeleteAddress, useSetDefaultAddress } from "@/hooks/Address/useAddresses";
import { useDetectLocation } from "@/hooks/Location/useDetectLocation";
import { useDeliveryStore } from "@/store/useDeliveryStore";
import { toast } from "@/store/useToastStore";
import { useTokens } from "@/theme/useTokens";

export default function Addresses() {
  const addresses = useAddresses();
  const setDefault = useSetDefaultAddress();
  const removeAddress = useDeleteAddress();
  const { detect, isDetecting } = useDetectLocation();
  const activeAddress = useDeliveryStore((state) => state.address);
  const setLocation = useDeliveryStore((state) => state.setLocation);
  const { color } = useTokens();

  const saved = addresses.data ?? [];
  const atLimit = saved.length >= MAX_SAVED_ADDRESSES;

  // Tapping one points the feed at it. Distinct from "default", which is what
  // checkout preselects next time - this is where you are ordering to now.
  function deliverTo(entry) {
    setLocation({
      address: entry.fullAddress,
      coordinates: {
        lat: entry.location.coordinates[1],
        lon: entry.location.coordinates[0],
      },
    });
    toast.success(`Delivering to ${entry.label ?? "this address"}`);
  }

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader
        title="Delivery addresses"
        subtitle={`${saved.length} of ${MAX_SAVED_ADDRESSES} saved`}
      />

      <ScrollView contentContainerClassName="gap-3 px-5 pb-8" showsVerticalScrollIndicator={false}>
        {saved.length ? (
          saved.map((entry) => (
            <PressableCard
              key={entry._id}
              className="flex-row items-center gap-3"
              onPress={() => deliverTo(entry)}
            >
              <View className="flex-1 gap-1">
                <View className="flex-row items-center gap-2">
                  <Text variant="h3" numberOfLines={1}>
                    {entry.label ?? "Address"}
                  </Text>
                  {entry.fullAddress === activeAddress ? (
                    <Badge tone="mint" size="sm" icon={MapPin}>
                      Delivering here
                    </Badge>
                  ) : null}
                  {entry.isDefault ? (
                    <Badge tone="neutral" size="sm" icon={Star}>
                      Default
                    </Badge>
                  ) : null}
                </View>
                <Text variant="body-sm" tone="muted" numberOfLines={2}>
                  {entry.fullAddress}
                </Text>
                {!entry.isDefault ? (
                  <Button
                    variant="mint"
                    size="sm"
                    className="mt-1 self-start"
                    onPress={() => setDefault.mutate(entry._id)}
                  >
                    Make default
                  </Button>
                ) : null}
              </View>

              <View className="gap-2">
                <IconButton
                  icon={Pencil}
                  variant="muted"
                  size={36}
                  label={`Edit ${entry.label ?? "address"}`}
                  onPress={() => router.push(`/(customer)/address/${entry._id}`)}
                />

                <IconButton
                  icon={Trash2}
                  variant="muted"
                  size={36}
                  label={`Delete ${entry.label ?? "address"}`}
                  onPress={() => removeAddress.mutate(entry._id)}
                />
              </View>
            </PressableCard>
          ))
        ) : (
          <EmptyState
            icon={MapPin}
            title="No saved addresses"
            description="Add one so checkout already knows where to send your order."
          />
        )}

        {atLimit ? (
          <Inset tone="warning">
            <Text variant="body-sm" className="text-warning">
              You have saved the maximum of {MAX_SAVED_ADDRESSES} addresses. Delete one to add
              another.
            </Text>
          </Inset>
        ) : (
          <Button
            size="lg"
            fullWidth
            className="mt-2"
            onPress={() => router.push("/(customer)/address/new")}
          >
            <View className="flex-row items-center gap-2">
              <Plus size={18} color={color["primary-foreground"]} />
              <Text variant="body-lg" className="font-jakarta-bold text-primary-foreground">
                Add an address
              </Text>
            </View>
          </Button>
        )}

        {/* Ordering from somewhere that is not worth saving - a park, a
            friend's flat - still needs the feed pointed at it. */}
        <Button variant="mint" size="lg" loading={isDetecting} onPress={detect}>
          <View className="flex-row items-center gap-2">
            <Crosshair size={17} color={color.primary} />
            <Text variant="label" tone="primary">
              Deliver to my current location
            </Text>
          </View>
        </Button>
      </ScrollView>
    </Screen>
  );
}
