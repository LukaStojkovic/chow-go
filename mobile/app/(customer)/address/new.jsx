import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation(["profile", "order", "basket", "errors", "common"]);
  const addAddress = useAddAddress();

  const [location, setLocation] = useState(null);
  const [form, setForm] = useState(() => toAddressForm(null));
  const [step, setStep] = useState("map");

  async function save() {
    try {
      await addAddress.mutateAsync(toAddressPayload(form, location));
      toast.success(t("profile:account.addressSaved"));
      router.back();
    } catch (error) {
      toast.error(t("profile:account.addressSaveFailed"), { description: errorMessage(error) });
    }
  }

  if (step === "map") {
    return (
      <Screen edges={["top", "bottom"]}>
        <ScreenHeader title={t("address.addTitle")} subtitle={t("address.tapMapHint")} />
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
        title={t("address.detailsTitle")}
        subtitle={t("address.detailsHint")}
        onBack={() => setStep("map")}
      />
      <AddressForm
        value={form}
        onChange={setForm}
        address={location?.address}
        onEditLocation={() => setStep("map")}
        onSubmit={save}
        submitLabel={t("address.save")}
        isSubmitting={addAddress.isPending}
      />
    </Screen>
  );
}
