import { useEffect, useRef, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { MapPin } from "lucide-react-native";
import { errorMessage } from "@/api/client";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Screen, ScreenHeader } from "@/components/ui/Screen";
import { AddressForm, toAddressForm, toAddressPayload } from "@/features/location/AddressForm";
import { LocationPicker } from "@/features/location/LocationPicker";
import { useAddresses, useUpdateAddress } from "@/hooks/Address/useAddresses";
import { toast } from "@/store/useToastStore";

export default function EditAddress() {
  const { addressId } = useLocalSearchParams();
  const { data } = useAddresses();
  const save = useUpdateAddress();

  const existing = (data ?? []).find((entry) => String(entry._id) === String(addressId));

  const [form, setForm] = useState(() => toAddressForm(existing));
  const [location, setLocation] = useState(null);
  // Editing opens on the details, unlike adding: the pin is usually already
  // right and it is the buzzer code that turned out to be wrong.
  const [step, setStep] = useState("details");

  // The list can still be in flight on a cold start straight into this screen,
  // so the form fills in once it lands - and only once, or a background refetch
  // would throw away whatever is half typed.
  const hydrated = useRef(false);
  useEffect(() => {
    if (!existing || hydrated.current) return;
    hydrated.current = true;
    setForm(toAddressForm(existing));
    setLocation({
      lat: existing.location.coordinates[1],
      lng: existing.location.coordinates[0],
      address: existing.fullAddress ?? "",
    });
  }, [existing]);

  async function persist() {
    try {
      await save.mutateAsync({ addressId, ...toAddressPayload(form, location) });
      toast.success("Address updated");
      router.back();
    } catch (error) {
      toast.error("Could not update the address", { description: errorMessage(error) });
    }
  }

  if (!existing) {
    return (
      <Screen>
        <ScreenHeader title="Edit address" />
        <EmptyState
          icon={MapPin}
          title="Address not found"
          description="This address no longer exists."
          actionLabel="Go back"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  if (step === "map") {
    return (
      <Screen edges={["top", "bottom"]}>
        <ScreenHeader
          title="Move the pin"
          subtitle="It decides which restaurants deliver here"
          onBack={() => setStep("details")}
        />
        <LocationPicker
          initialPosition={location ? [location.lat, location.lng] : undefined}
          confirmLabel="Use this location"
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
      <ScreenHeader title="Edit address" subtitle={existing.label ?? undefined} />
      <AddressForm
        value={form}
        onChange={setForm}
        address={location?.address}
        onEditLocation={() => setStep("map")}
        onSubmit={persist}
        submitLabel="Save changes"
        isSubmitting={save.isPending}
      />
    </Screen>
  );
}
