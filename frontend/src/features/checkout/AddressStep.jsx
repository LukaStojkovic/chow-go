/**
 * Delivery address selection.
 *
 * Auto-selects the default address so the common case needs no interaction,
 * but never hides the choice. A new address is added without leaving
 * checkout: in a sheet when some exist, inline when there are none yet, and
 * the saved one becomes the delivery address.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { MapPin, Plus, Settings2 } from "lucide-react";

import { titleCase } from "@chowgo/shared/format";
import { MAX_SAVED_ADDRESSES } from "@/lib/constants";
import { useDeliveryStore } from "@/store/useDeliveryStore";
import useGetDeliveryAddresses from "@/hooks/DeliveryAddress/useGetDeliveryAddresses";
import useAddDeliveryAddress from "@/hooks/DeliveryAddress/useAddDeliveryAddress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveSheet } from "@/components/basket/ResponsiveSheet";
import AddAddressModal from "@/components/Profile/AddAddressModal";
import { CheckoutSection, OptionRow } from "./CheckoutSection";

/**
 * @param {Object} props
 * @param {number} props.step
 * @param {{ addressId: string, message: string } | null} [props.outOfRange]
 */
export function AddressStep({ step, outOfRange = null }) {
  const { t } = useTranslation(["basket", "profile", "common"]);
  const queryClient = useQueryClient();
  const { deliveryAddresses, isLoadingAddresses } = useGetDeliveryAddresses();
  const { addDeliveryAddressAsync, isAddingDeliveryAddress } = useAddDeliveryAddress();
  const { selectedDeliveryAddress, setSelectedDeliveryAddress } = useDeliveryStore();
  const [isEditorOpen, setEditorOpen] = useState(false);
  const focusAddressId = useRef(null);
  const listRef = useRef(null);

  const addresses = useMemo(() => deliveryAddresses?.data ?? [], [deliveryAddresses]);
  const atLimit = addresses.length >= MAX_SAVED_ADDRESSES;
  const isEmpty = !isLoadingAddresses && addresses.length === 0;
  const selectedIsOutOfRange =
    Boolean(outOfRange) && outOfRange.addressId === selectedDeliveryAddress?._id;

  useEffect(() => {
    if (addresses.length === 0) return;

    const stillExists = addresses.some((a) => a._id === selectedDeliveryAddress?._id);
    if (stillExists) return;

    setSelectedDeliveryAddress(addresses.find((a) => a.isDefault) ?? addresses[0]);
  }, [addresses, selectedDeliveryAddress?._id, setSelectedDeliveryAddress]);

  useEffect(() => {
    if (!focusAddressId.current) return;
    const input = listRef.current?.querySelector(`#address-${CSS.escape(focusAddressId.current)}`);
    if (input) {
      input.focus();
      focusAddressId.current = null;
    }
  }, [addresses]);

  const handleSave = async (data) => {
    const wasEmpty = addresses.length === 0;
    const response = await addDeliveryAddressAsync({ data });
    const created = response?.address;
    if (created?._id) {
      queryClient.setQueryData(["deliveryAddresses"], (old) => {
        const list = old?.data ?? [];
        if (list.some((a) => a._id === created._id)) return old;
        return { ...(old ?? {}), data: [...list, created] };
      });
      setSelectedDeliveryAddress(created);
      if (wasEmpty) focusAddressId.current = created._id;
    }
    setEditorOpen(false);
  };

  const manageLink = (
    <Button variant="link" size="sm" asChild>
      <Link to="/profile">
        <Settings2 aria-hidden="true" />
        {t("addressForm.manage")}
      </Link>
    </Button>
  );

  const addButton = (
    <Button
      variant="link"
      size="sm"
      onClick={() => setEditorOpen(true)}
      aria-haspopup="dialog"
    >
      <Plus aria-hidden="true" />
      {t("addressForm.addNew")}
    </Button>
  );

  return (
    <CheckoutSection
      step={step}
      title={t("checkout.address.title")}
      isComplete={Boolean(selectedDeliveryAddress) && !selectedIsOutOfRange}
      action={addresses.length > 0 ? (atLimit ? manageLink : addButton) : null}
    >
      {isLoadingAddresses ? (
        <div className="space-y-2" aria-busy="true">
          <Skeleton className="h-16 w-full rounded-md" />
          <Skeleton className="h-16 w-full rounded-md" />
        </div>
      ) : isEmpty ? (
        <section
          aria-labelledby="checkout-new-address"
          className="border-border overflow-hidden rounded-md border"
        >
          <div className="flex items-start gap-3 p-4">
            <MapPin className="text-muted-foreground mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <div>
              <h3 id="checkout-new-address" className="text-h3">
                {t("checkout.address.emptyTitle")}
              </h3>
              <p className="text-body-sm text-muted-foreground mt-0.5">
                {t("addressForm.formHint")}
              </p>
            </div>
          </div>
          <div className="border-border border-t">
            <AddAddressModal
              isOpen
              onSave={handleSave}
              onClose={() => {}}
              isLoading={isAddingDeliveryAddress}
            />
          </div>
        </section>
      ) : (
        <div className="space-y-3">
          <fieldset ref={listRef} className="space-y-2">
            <legend className="sr-only">{t("profile:delivery.choose")}</legend>
            {addresses.map((address) => {
              const details = [
                address.buildingName,
                address.apartment && `Apt ${address.apartment}`,
                address.floor && `Floor ${address.floor}`,
              ]
                .filter(Boolean)
                .join(" - ");

              return (
                <OptionRow
                  key={address._id}
                  id={`address-${address._id}`}
                  name="delivery-address"
                  checked={selectedDeliveryAddress?._id === address._id}
                  onSelect={() => setSelectedDeliveryAddress(address)}
                  label={
                    address.isDefault
                      ? t("common:fallback.addressDefault", {
                          label: titleCase(address.label) || t("common:fallback.address"),
                        })
                      : titleCase(address.label) || t("common:fallback.address")
                  }
                  description={
                    <>
                      {address.fullAddress}
                      {details && (
                        <>
                          <br />
                          {details}
                        </>
                      )}
                    </>
                  }
                />
              );
            })}
          </fieldset>

          {selectedIsOutOfRange && (
            <div
              role="alert"
              className="border-destructive bg-destructive-subtle text-body-sm rounded-md border p-3"
            >
              <p className="text-foreground">{outOfRange.message}</p>
              <p className="text-muted-foreground mt-0.5">{t("addressForm.outOfRangeHint")}</p>
              {!atLimit && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setEditorOpen(true)}
                  aria-haspopup="dialog"
                >
                  <Plus aria-hidden="true" />
                  {t("addressForm.addNew")}
                </Button>
              )}
            </div>
          )}

          {atLimit && (
            <p className="text-caption text-muted-foreground">
              {t("addressForm.limit", { max: MAX_SAVED_ADDRESSES })}
            </p>
          )}
        </div>
      )}

      <ResponsiveSheet
        open={isEditorOpen && !isEmpty}
        onOpenChange={(next) => !next && setEditorOpen(false)}
        title={t("profile:address.addTitle")}
        description={t("profile:address.editorHint")}
      >
        {isEditorOpen && !isEmpty && (
          <AddAddressModal
            isOpen
            onSave={handleSave}
            onClose={() => setEditorOpen(false)}
            isLoading={isAddingDeliveryAddress}
          />
        )}
      </ResponsiveSheet>
    </CheckoutSection>
  );
}
