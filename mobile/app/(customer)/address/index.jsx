import { useState } from "react";
import { ScrollView, View } from "react-native";
import { Star, Trash2 } from "lucide-react-native";
import { MAX_SAVED_ADDRESSES } from "@chowgo/shared/constants";
import { errorMessage } from "@/api/client";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { OptionRow } from "@/features/checkout/OptionRow";
import {
  useAddAddress,
  useAddresses,
  useDeleteAddress,
  useSetDefaultAddress,
} from "@/hooks/Address/useAddresses";
import { useDetectLocation } from "@/hooks/Location/useDetectLocation";
import { useDeliveryStore } from "@/store/useDeliveryStore";
import { toast } from "@/store/useToastStore";
import { useTokens } from "@/theme/useTokens";

export default function Addresses() {
  const addresses = useAddresses();
  const addAddress = useAddAddress();
  const setDefault = useSetDefaultAddress();
  const removeAddress = useDeleteAddress();
  const { detect, isDetecting } = useDetectLocation();
  const coordinates = useDeliveryStore((state) => state.coordinates);
  const storedAddress = useDeliveryStore((state) => state.address);
  const { color } = useTokens();

  const [label, setLabel] = useState("Home");
  const [fullAddress, setFullAddress] = useState("");

  const atLimit = (addresses.data?.length ?? 0) >= MAX_SAVED_ADDRESSES;

  async function save() {
    const text = fullAddress.trim() || storedAddress;
    if (!text || !coordinates) {
      toast.warning("Set a location first", {
        description: "Use your current location, then save it.",
      });
      return;
    }

    try {
      await addAddress.mutateAsync({
        address: text,
        label: label.trim() || "Home",
        type: "apartment",
        location: { lat: coordinates.lat, lng: coordinates.lon },
      });
      setFullAddress("");
      toast.success("Address saved");
    } catch (error) {
      toast.error("Could not save the address", { description: errorMessage(error) });
    }
  }

  return (
    <Screen edges={["bottom"]}>
      <ScrollView contentContainerClassName="gap-6 p-5" keyboardShouldPersistTaps="handled">
        <View className="gap-3">
          <Text variant="h3">Saved addresses</Text>
          {addresses.data?.length ? (
            addresses.data.map((entry) => (
              <View key={entry._id} className="flex-row items-center gap-2">
                <View className="flex-1">
                  <OptionRow
                    label={entry.label ?? "Address"}
                    description={entry.fullAddress}
                    selected={entry.isDefault}
                    onPress={() => setDefault.mutate(entry._id)}
                    trailing={
                      entry.isDefault ? (
                        <Star size={15} color={color.primary} fill={color.primary} />
                      ) : null
                    }
                  />
                </View>
                <Button
                  variant="ghost"
                  size="sm"
                  accessibilityLabel={`Delete ${entry.label ?? "address"}`}
                  onPress={() => removeAddress.mutate(entry._id)}
                >
                  <Trash2 size={16} color={color["muted-foreground"]} />
                </Button>
              </View>
            ))
          ) : (
            <EmptyState
              title="No saved addresses"
              description="Add one so checkout knows where to send your order."
            />
          )}
        </View>

        {atLimit ? (
          <Text variant="caption" tone="muted">
            You've saved the maximum of {MAX_SAVED_ADDRESSES} addresses.
          </Text>
        ) : (
          <View className="gap-3">
            <Text variant="h3">Add an address</Text>
            <Button variant="outline" loading={isDetecting} onPress={detect}>
              Use my current location
            </Button>
            {storedAddress ? (
              <Text variant="caption" tone="muted">
                Detected: {storedAddress}
              </Text>
            ) : null}
            <Input label="Label" value={label} onChangeText={setLabel} placeholder="Home" />
            <Input
              label="Address"
              value={fullAddress}
              onChangeText={setFullAddress}
              placeholder={storedAddress ?? "Street and number"}
              hint="Leave blank to use the detected address."
            />
            <Button loading={addAddress.isPending} onPress={save}>
              Save address
            </Button>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
