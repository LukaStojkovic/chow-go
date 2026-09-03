/**
 * Delivery address selection.
 *
 * Auto-selects the default address so the common case needs no interaction,
 * but never hides the choice. With no saved address at all this is a genuine
 * blocker, so it says so and links straight to where one is added.
 */

import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { MapPin, Plus } from "lucide-react";

import { titleCase } from "@/lib/format";
import { useDeliveryStore } from "@/store/useDeliveryStore";
import useGetDeliveryAddresses from "@/hooks/DeliveryAddress/useGetDeliveryAddresses";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/StateViews";
import { CheckoutSection, OptionRow } from "./CheckoutSection";

/**
 * @param {Object} props
 * @param {number} props.step
 */
export function AddressStep({ step }) {
  const { deliveryAddresses, isLoadingAddresses } = useGetDeliveryAddresses();
  const { selectedDeliveryAddress, setSelectedDeliveryAddress } = useDeliveryStore();

  // Memoised so the `?? []` fallback does not produce a new array identity on
  // every render and re-run the auto-select effect below.
  const addresses = useMemo(() => deliveryAddresses?.data ?? [], [deliveryAddresses]);

  useEffect(() => {
    if (addresses.length === 0) return;

    // Re-select if the stored address has since been deleted, so checkout can
    // never submit an id the backend will reject.
    const stillExists = addresses.some((a) => a._id === selectedDeliveryAddress?._id);
    if (stillExists) return;

    setSelectedDeliveryAddress(addresses.find((a) => a.isDefault) ?? addresses[0]);
  }, [addresses, selectedDeliveryAddress?._id, setSelectedDeliveryAddress]);

  return (
    <CheckoutSection
      step={step}
      title="Delivery address"
      isComplete={Boolean(selectedDeliveryAddress)}
      action={
        addresses.length > 0 ? (
          <Button variant="link" size="sm" asChild>
            <Link to="/profile">
              <Plus aria-hidden="true" />
              Add
            </Link>
          </Button>
        ) : null
      }
    >
      {isLoadingAddresses ? (
        <div className="space-y-2" aria-busy="true">
          <Skeleton className="h-16 w-full rounded-md" />
          <Skeleton className="h-16 w-full rounded-md" />
        </div>
      ) : addresses.length === 0 ? (
        <div className="border-border rounded-md border">
          <EmptyState
            icon={MapPin}
            size="sm"
            title="No delivery address yet"
            description="Add an address so the courier knows where to bring your order."
            action={
              <Button asChild>
                <Link to="/profile">Add an address</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <fieldset className="space-y-2">
          <legend className="sr-only">Choose a delivery address</legend>
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
                label={`${titleCase(address.label) || "Address"}${address.isDefault ? " (default)" : ""}`}
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
      )}
    </CheckoutSection>
  );
}
