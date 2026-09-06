/**
 * Delivery address selector.
 *
 * One component for every breakpoint - the previous version shipped two full
 * copies of the same markup behind `isMobile`, which is how they drifted apart.
 * Built on Radix Popover so focus is trapped, Escape closes, and the trigger
 * gets focus back on dismissal, none of which the old outside-click hook did.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronDown, MapPin, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { useDeliveryStore } from "@/store/useDeliveryStore";
import useGetDeliveryAddresses from "@/hooks/DeliveryAddress/useGetDeliveryAddresses";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { titleCase } from "@chowgo/shared/format";

/**
 * @param {Object} props
 * @param {"compact"|"full"} [props.variant] `compact` is the mobile top bar,
 *   `full` shows the "Delivering to" caption used on desktop.
 */
export function AddressSelector({ variant = "full", className }) {
  const navigate = useNavigate();
  const { authUser, openAuthModal } = useAuthStore();
  const { address, setLocation } = useDeliveryStore();
  const { deliveryAddresses, isLoadingAddresses } = useGetDeliveryAddresses();
  const [open, setOpen] = useState(false);

  const addresses = deliveryAddresses?.data ?? [];
  const currentLabel = address || "Choose delivery address";

  const handleSelect = (addr) => {
    setLocation(addr.fullAddress, {
      lat: addr.location.coordinates[1],
      lon: addr.location.coordinates[0],
    });
    setOpen(false);
  };

  const handleOpenChange = (next) => {
    // Addresses are per-account, so signing in has to happen first.
    if (next && !authUser) {
      openAuthModal();
      return;
    }
    setOpen(next);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "group flex min-w-0 items-center gap-2 rounded-sm px-2 py-1.5 text-left",
            "hover:bg-muted transition-colors duration-(--duration-micro)",
            "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            className,
          )}
        >
          <MapPin className="text-primary size-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            {variant === "full" && (
              // Dropped below `sm`: at 375px the caption forces the address
              // onto a second line and squeezes it to four characters. The
              // pin icon and the screen-reader text below already say what
              // this control is.
              <span className="text-caption text-muted-foreground hidden leading-none sm:block">
                Delivering to
              </span>
            )}
            <span
              className={cn(
                "text-foreground text-body-sm block truncate font-semibold",
                variant === "full" && "sm:max-w-52",
              )}
            >
              {currentLabel}
            </span>
          </span>
          <ChevronDown
            className={cn(
              "text-muted-foreground size-4 shrink-0 transition-transform duration-(--duration-micro)",
              open && "rotate-180",
            )}
            aria-hidden="true"
          />
          <span className="sr-only">Change delivery address</span>
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-[min(20rem,calc(100vw-2rem))] p-0">
        <div className="border-border border-b px-3 py-2">
          <p className="text-caption text-muted-foreground uppercase">Saved addresses</p>
        </div>

        {isLoadingAddresses ? (
          <div className="space-y-2 p-3" aria-busy="true">
            <span className="sr-only">Loading your saved addresses</span>
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        ) : addresses.length > 0 ? (
          <ul className="max-h-72 overflow-y-auto py-1">
            {addresses.map((addr) => {
              const isActive = address === addr.fullAddress;
              return (
                <li key={addr._id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(addr)}
                    aria-current={isActive ? "true" : undefined}
                    className={cn(
                      "flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors",
                      "hover:bg-muted focus-visible:bg-muted outline-none",
                      isActive && "bg-primary-subtle",
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="text-label text-foreground truncate">
                          {titleCase(addr.label) || "Address"}
                        </span>
                        {addr.isDefault && (
                          <span className="text-caption text-muted-foreground">Default</span>
                        )}
                      </span>
                      <span className="text-body-sm text-muted-foreground mt-0.5 block truncate">
                        {addr.fullAddress}
                      </span>
                    </span>
                    {isActive && (
                      <Check
                        className="text-primary mt-0.5 size-4 shrink-0"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-body-sm text-muted-foreground px-3 py-4 text-center">
            You have not saved an address yet.
          </p>
        )}

        <div className="border-border border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            block
            className="justify-start"
            onClick={() => {
              setOpen(false);
              navigate("/profile");
            }}
          >
            <Plus aria-hidden="true" />
            Add a new address
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
