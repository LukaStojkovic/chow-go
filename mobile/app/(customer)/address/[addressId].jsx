import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation(["profile", "order", "basket", "errors", "common"]);
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
      toast.success(t("profile:account.addressUpdated"));
      router.back();
    } catch (error) {
      toast.error(t("profile:account.addressUpdateFailed"), {
        description: errorMessage(error),
      });
    }
  }

  if (!existing) {
    return (
      <Screen>
        <ScreenHeader title={t("address.editTitle")} />
        <EmptyState
          icon={MapPin}
          title={t("errors:address.notFound")}
          description={t("address.goneDescription")}
          actionLabel={t("common:actions.goBack")}
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  if (step === "map") {
    return (
      <Screen edges={["top", "bottom"]}>
        <ScreenHeader
          title={t("address.movePin")}
          subtitle={t("address.movePinHint")}
          onBack={() => setStep("details")}
        />
        <LocationPicker
          initialPosition={location ? [location.lat, location.lng] : undefined}
          confirmLabel={t("address.useLocation")}
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
      <ScreenHeader title={t("address.editTitle")} subtitle={existing.label ?? undefined} />
      <AddressForm
        value={form}
        onChange={setForm}
        address={location?.address}
        onEditLocation={() => setStep("map")}
        onSubmit={persist}
        submitLabel={t("common:actions.saveChanges")}
        isSubmitting={save.isPending}
      />
    </Screen>
  );
}
