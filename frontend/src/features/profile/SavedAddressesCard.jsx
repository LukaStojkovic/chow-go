/**
 * Saved delivery addresses.
 *
 * The backend caps these at five (pre-save hook on the Addresses model), so
 * the limit is surfaced before the add button fails rather than after.
 * Deleting is confirmed and names the address being removed.
 */

import { useState } from "react";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { titleCase } from "@/lib/format";
import { MAX_SAVED_ADDRESSES } from "@/lib/constants";
import useGetDeliveryAddresses from "@/hooks/DeliveryAddress/useGetDeliveryAddresses";
import useAddDeliveryAddress from "@/hooks/DeliveryAddress/useAddDeliveryAddress";
import useUpdateDeliveryAddress from "@/hooks/DeliveryAddress/useUpdateDeliveryAddress";
import useDeleteDeliveryAddress from "@/hooks/DeliveryAddress/useDeleteDeliveryAddress";
import useSetDefaultDeliveryAddress from "@/hooks/DeliveryAddress/useSetDefaultDeliveryAdress";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/common/StateViews";
import { IconButton } from "@/components/common/IconButton";
import { ResponsiveSheet } from "@/components/basket/ResponsiveSheet";
import AddAddressModal from "@/components/Profile/AddAddressModal";

export function SavedAddressesCard() {
  const { deliveryAddresses, isLoadingAddresses } = useGetDeliveryAddresses();
  const { addDeliveryAddressAsync, isAddingDeliveryAddress } = useAddDeliveryAddress();
  const { updateDeliveryAddressAsync, isUpdatingDeliveryAddress } =
    useUpdateDeliveryAddress();
  const { deleteAddress, loadingAddressId: deletingId } = useDeleteDeliveryAddress();
  const { setDefaultAddress, loadingAddressId: settingDefaultId } =
    useSetDefaultDeliveryAddress();

  const [editorTarget, setEditorTarget] = useState(null); // address | "new" | null
  const [pendingDelete, setPendingDelete] = useState(null);

  const addresses = deliveryAddresses?.data ?? [];
  const atLimit = addresses.length >= MAX_SAVED_ADDRESSES;

  const handleSave = async (data) => {
    if (editorTarget && editorTarget !== "new") {
      await updateDeliveryAddressAsync({ addressId: editorTarget._id, data });
    } else {
      await addDeliveryAddressAsync({ data });
    }
    setEditorTarget(null);
  };

  return (
    <Card padded className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-h2">Delivery addresses</h2>
          <p className="text-body-sm text-muted-foreground mt-0.5">
            {atLimit
              ? `You have reached the limit of ${MAX_SAVED_ADDRESSES} saved addresses.`
              : `${addresses.length} of ${MAX_SAVED_ADDRESSES} saved`}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={atLimit}
          onClick={() => setEditorTarget("new")}
        >
          <Plus aria-hidden="true" />
          Add
        </Button>
      </div>

      {isLoadingAddresses ? (
        <div className="space-y-2" aria-busy="true">
          <Skeleton className="h-20 w-full rounded-md" />
          <Skeleton className="h-20 w-full rounded-md" />
        </div>
      ) : addresses.length === 0 ? (
        <EmptyState
          icon={MapPin}
          size="sm"
          title="No addresses saved"
          description="Add one so checkout knows where to send your order."
          action={<Button onClick={() => setEditorTarget("new")}>Add an address</Button>}
        />
      ) : (
        <ul className="space-y-2">
          {addresses.map((address) => (
            <li
              key={address._id}
              className={cn(
                "border-border flex items-start gap-3 rounded-md border p-3",
                address.isDefault && "border-primary bg-primary-subtle",
              )}
            >
              <MapPin
                className="text-muted-foreground mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-label truncate">
                    {titleCase(address.label) || "Address"}
                  </span>
                  {address.isDefault && <Badge variant="primary">Default</Badge>}
                </div>
                <p className="text-body-sm text-muted-foreground mt-0.5 break-words">
                  {address.fullAddress}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-0.5">
                {!address.isDefault && (
                  <IconButton
                    size="icon-sm"
                    label={`Make ${titleCase(address.label) || "this address"} the default`}
                    disabled={settingDefaultId === address._id}
                    onClick={() => setDefaultAddress({ addressId: address._id })}
                  >
                    <Star aria-hidden="true" />
                  </IconButton>
                )}
                <IconButton
                  size="icon-sm"
                  label={`Edit ${titleCase(address.label) || "this address"}`}
                  onClick={() => setEditorTarget(address)}
                >
                  <Pencil aria-hidden="true" />
                </IconButton>
                <IconButton
                  size="icon-sm"
                  label={`Delete ${titleCase(address.label) || "this address"}`}
                  className="text-destructive hover:bg-destructive-subtle"
                  disabled={deletingId === address._id}
                  onClick={() => setPendingDelete(address)}
                >
                  <Trash2 aria-hidden="true" />
                </IconButton>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ResponsiveSheet
        open={Boolean(editorTarget)}
        onOpenChange={(next) => !next && setEditorTarget(null)}
        title={editorTarget && editorTarget !== "new" ? "Edit address" : "Add an address"}
        description="Pin the location on the map, then add the details a courier needs to find you."
      >
        {editorTarget && (
          <AddAddressModal
            isOpen
            onSave={handleSave}
            onClose={() => setEditorTarget(null)}
            isLoading={isAddingDeliveryAddress || isUpdatingDeliveryAddress}
            initialData={editorTarget === "new" ? null : editorTarget}
          />
        )}
      </ResponsiveSheet>

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(next) => !next && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {titleCase(pendingDelete?.label) || "this address"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.fullAddress} will be removed from your account. Orders
              already placed to it are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              className={cn(buttonVariants({ variant: "destructive" }))}
              onClick={() => {
                deleteAddress({ addressId: pendingDelete._id });
                setPendingDelete(null);
              }}
            >
              Delete address
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
