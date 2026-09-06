import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { errorMessage } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { useAddresses, useUpdateAddress } from "@/hooks/Address/useAddresses";
import { AddressAutocomplete } from "@/features/location/AddressAutocomplete";
import { useDetectLocation } from "@/hooks/Location/useDetectLocation";
import { useDeliveryStore } from "@/store/useDeliveryStore";
import { toast } from "@/store/useToastStore";

export default function EditAddress() {
  const { addressId } = useLocalSearchParams();
  const { data } = useAddresses();
  const { detect, isDetecting } = useDetectLocation();
  const coordinates = useDeliveryStore((state) => state.coordinates);
  const setLocation = useDeliveryStore((state) => state.setLocation);

  const existing = (data ?? []).find((entry) => String(entry._id) === String(addressId));

  const [label, setLabel] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!existing) return;
    setLabel(existing.label ?? "");
    setFullAddress(existing.fullAddress ?? "");
    setNotes(existing.notes ?? "");
  }, [existing]);

  const save = useUpdateAddress();

  async function persist() {
    try {
      await save.mutateAsync({
        addressId,
        address: fullAddress.trim(),
        label: label.trim() || "Home",
        type: existing?.addressType ?? "apartment",
        notes: notes.trim() || undefined,
        // Only sent when the pin was actually moved; otherwise the stored
        // coordinates stay as they are.
        ...(coordinates ? { location: { lat: coordinates.lat, lng: coordinates.lon } } : {}),
      });
      toast.success("Address updated");
      router.back();
    } catch (error) {
      toast.error("Could not update the address", { description: errorMessage(error) });
    }
  }

  if (!existing) {
    return (
      <Screen className="items-center justify-center p-8">
        <Text variant="body" tone="muted">
          This address no longer exists.
        </Text>
      </Screen>
    );
  }

  return (
    <Screen edges={["bottom"]}>
      <ScrollView contentContainerClassName="gap-4 p-5" keyboardShouldPersistTaps="handled">
        <Input label="Label" value={label} onChangeText={setLabel} placeholder="Home" />
        <Input
          label="Address"
          value={fullAddress}
          onChangeText={setFullAddress}
          placeholder="Street and number"
        />
        <Input
          label="Delivery notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Buzzer code, which door, anything else"
          multiline
          maxLength={200}
          className="h-20 py-3"
          style={{ textAlignVertical: "top" }}
        />

        <View className="gap-3 rounded-md border border-border bg-card p-4">
          <Text variant="label">Move the pin</Text>
          <Text variant="caption" tone="muted">
            The pin decides which restaurants can deliver here.
          </Text>
          <Button variant="outline" loading={isDetecting} onPress={detect}>
            Use my current location
          </Button>
          <AddressAutocomplete
            label="Or search for it"
            onSelect={({ address, lat, lon }) => {
              setFullAddress(address);
              setLocation({ address, coordinates: { lat, lon } });
            }}
          />
        </View>

        <View className="pt-2">
          <Button
            size="lg"
            loading={save.isPending}
            disabled={!fullAddress.trim()}
            onPress={persist}
          >
            Save changes
          </Button>
        </View>
      </ScrollView>
    </Screen>
  );
}
