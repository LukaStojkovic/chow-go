import { useState } from "react";
import { router } from "expo-router";
import { errorMessage } from "@/api/client";
import { Screen, ScreenHeader } from "@/components/ui/Screen";
import { AddressForm, toAddressForm, toAddressPayload } from "@/features/location/AddressForm";
import { LocationPicker } from "@/features/location/LocationPicker";
import { useAddAddress } from "@/hooks/Address/useAddresses";
import { toast } from "@/store/useToastStore";

/**
 * Pin first, details second.
 *
 * The pin is the only part checkout cannot work without, and asking for a
 * floor and a buzzer code before knowing where the building is puts the
 * throwaway fields in front of the load-bearing one.
 */
export default function NewAddress() {
  const addAddress = useAddAddress();

  const [location, setLocation] = useState(null);
  const [form, setForm] = useState(() => toAddressForm(null));
  const [step, setStep] = useState("map");

  async function save() {
    try {
      await addAddress.mutateAsync(toAddressPayload(form, location));
      toast.success("Address saved");
      router.back();
    } catch (error) {
      toast.error("Could not save the address", { description: errorMessage(error) });
    }
  }

  if (step === "map") {
    return (
      <Screen edges={["top", "bottom"]}>
        <ScreenHeader title="Add an address" subtitle="Tap the map to place the pin" />
        <LocationPicker
          initialPosition={location ? [location.lat, location.lng] : undefined}
          onConfirm={(picked) => {
            setLocation(picked);
            setStep("details");
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader
        title="Address details"
        subtitle="So the courier finds the door"
        onBack={() => setStep("map")}
      />
      <AddressForm
        value={form}
        onChange={setForm}
        address={location?.address}
        onEditLocation={() => setStep("map")}
        onSubmit={save}
        submitLabel="Save address"
        isSubmitting={addAddress.isPending}
      />
    </Screen>
  );
}
