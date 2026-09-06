import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, errorMessage } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { useAddresses } from "@/hooks/Address/useAddresses";
import { useDetectLocation } from "@/hooks/Location/useDetectLocation";
import { useDeliveryStore } from "@/store/useDeliveryStore";
import { toast } from "@/store/useToastStore";

export default function EditAddress() {
  const { addressId } = useLocalSearchParams();
  const { data } = useAddresses();
  const queryClient = useQueryClient();
  const { detect, isDetecting } = useDetectLocation();
  const coordinates = useDeliveryStore((state) => state.coordinates);

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

  const save = useMutation({
    mutationFn: () =>
      api.put(`/delivery-address/${addressId}`, {
        address: fullAddress.trim(),
        label: label.trim() || "Home",
        type: existing?.addressType ?? "apartment",
        notes: notes.trim() || undefined,
        // Only sent when the pin was actually moved; otherwise the stored
        // coordinates stay as they are.
        ...(coordinates ? { location: { lat: coordinates.lat, lng: coordinates.lon } } : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveryAddresses"] });
      toast.success("Address updated");
      router.back();
    },
    onError: (error) =>
      toast.error("Could not update the address", { description: errorMessage(error) }),
  });

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

        <Button variant="outline" loading={isDetecting} onPress={detect}>
          Update pin to my current location
        </Button>

        <View className="pt-2">
          <Button
            size="lg"
            loading={save.isPending}
            disabled={!fullAddress.trim()}
            onPress={() => save.mutate()}
          >
            Save changes
          </Button>
        </View>
      </ScrollView>
    </Screen>
  );
}
