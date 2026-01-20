import { ChevronRight, Loader2, MapPin } from "lucide-react";
import React, { useState } from "react";
import useGetDeliveryAddresses from "@/hooks/DeliveryAddress/useGetDeliveryAddresses";
import useOutsideClick from "@/hooks/useOutsideClick";
import { useNavigate } from "react-router-dom";
import { useDeliveryStore } from "@/store/useDeliveryStore";
import { useAuthStore } from "@/store/useAuthStore";

export default function DeliveryAddressDropdown({ isMobile = false }) {
  const navigate = useNavigate();
  const { authUser, openAuthModal } = useAuthStore();
  const { address, setLocation } = useDeliveryStore();
  const { deliveryAddresses, isLoadingAddresses } = useGetDeliveryAddresses();

  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const addressDropdownRef = useOutsideClick(() =>
    setShowAddressDropdown(false),
  );

  const handleAddressSelect = (addr) => {
    setLocation(addr.fullAddress, {
      lat: addr.location.coordinates[1],
      lon: addr.location.coordinates[0],
    });
    setShowAddressDropdown(false);
  };

  const handleDeliveryToClick = () => {
    if (!authUser) {
      openAuthModal();
      return;
    }
    setShowAddressDropdown((prev) => !prev);
  };

  if (isMobile) {
    return (
      <div className="md:hidden w-full relative" ref={addressDropdownRef}>
        <button
          onClick={handleDeliveryToClick}
          className="flex items-center gap-2 w-full px-1 mb-1 rounded-lg p-2 -m-2 hover:bg-gray-50 dark:hover:bg-zinc-800 transition"
        >
          <MapPin className="h-4 w-4 text-blue-500 shrink-0" />
          <span className="text-sm font-bold truncate flex-1 text-left">
            {address || "Select delivery address"}
          </span>
          <ChevronRight
            className={`h-4 w-4 text-muted-foreground transition-transform ${
              showAddressDropdown ? "rotate-90" : ""
            }`}
          />
        </button>

        {showAddressDropdown && (
          <div className="absolute left-0 top-full mt-2 z-50 w-full max-w-xs rounded-lg border border-gray-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
            {isLoadingAddresses ? (
              <div className="p-4 flex items-center justify-center">
                <Loader2 size={20} className="animate-spin" />
              </div>
            ) : deliveryAddresses?.data && deliveryAddresses.data.length > 0 ? (
              <>
                {deliveryAddresses.data.map((addr) => (
                  <button
                    key={addr._id}
                    onClick={() => handleAddressSelect(addr)}
                    className={`flex w-full flex-col gap-0.5 px-4 py-3 text-left cursor-pointer text-sm transition ${
                      address === addr.fullAddress
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : "hover:bg-gray-50 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <span className="font-semibold">
                      {addr.label?.charAt(0).toUpperCase() +
                        addr.label?.slice(1)}
                    </span>
                    <span className="text-xs text-gray-500 truncate">
                      {addr.fullAddress}
                    </span>
                    {addr.isDefault && (
                      <span className="text-xs text-blue-600 font-medium">
                        Default
                      </span>
                    )}
                  </button>
                ))}

                <div className="border-t border-gray-100 dark:border-zinc-800">
                  <button
                    onClick={() => navigate("/profile")}
                    className="w-full cursor-pointer px-4 py-3 text-left text-sm font-semibold text-blue-600 hover:bg-gray-50 dark:hover:bg-zinc-800"
                  >
                    + Add new address
                  </button>
                </div>
              </>
            ) : (
              <div className="px-4 py-3 text-center">
                <p className="text-sm text-gray-500 mb-2">No saved addresses</p>
                <button
                  onClick={() => navigate("/profile")}
                  className="w-full px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded"
                >
                  + Add address
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="hidden md:flex flex-col border-l border-gray-200 dark:border-zinc-800 pl-6 relative"
      ref={addressDropdownRef}
    >
      <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70">
        Delivering to
      </span>
      <button
        onClick={handleDeliveryToClick}
        className="group flex cursor-pointer items-center gap-1 text-gray-900 transition-colors hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400 text-left"
      >
        <span className="max-w-[180px] truncate text-sm font-bold">
          {address || "Select delivery address"}
        </span>
        <ChevronRight
          className={`h-3.5 w-3.5 transition-transform group-hover:rotate-90 ${
            showAddressDropdown ? "rotate-90" : ""
          }`}
        />
      </button>

      {showAddressDropdown && (
        <div className="absolute left-0 top-full mt-2 z-50 w-64 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
          {isLoadingAddresses ? (
            <div className="p-4 flex items-center justify-center">
              <Loader2 size={20} className="animate-spin" />
            </div>
          ) : deliveryAddresses?.data && deliveryAddresses.data.length > 0 ? (
            <>
              {deliveryAddresses.data.map((addr) => (
                <button
                  key={addr._id}
                  onClick={() => handleAddressSelect(addr)}
                  className={`flex w-full flex-col gap-0.5 px-4 py-3 text-left cursor-pointer text-sm transition ${
                    address === addr.fullAddress
                      ? "bg-blue-50 dark:bg-blue-900/20"
                      : "hover:bg-gray-50 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span className="font-semibold">
                    {addr.label?.charAt(0).toUpperCase() + addr.label?.slice(1)}
                  </span>
                  <span className="text-xs text-gray-500 truncate">
                    {addr.fullAddress}
                  </span>
                  {addr.isDefault && (
                    <span className="text-xs text-blue-600 font-medium">
                      Default
                    </span>
                  )}
                </button>
              ))}

              <div className="border-t border-gray-100 dark:border-zinc-800">
                <button
                  onClick={() => navigate("/profile")}
                  className="w-full cursor-pointer px-4 py-3 text-left text-sm font-semibold text-blue-600 hover:bg-gray-50 dark:hover:bg-zinc-800"
                >
                  + Add new address
                </button>
              </div>
            </>
          ) : (
            <div className="px-4 py-3 text-center">
              <p className="text-sm text-gray-500 mb-2">No saved addresses</p>
              <button
                onClick={() => navigate("/profile")}
                className="w-full px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded"
              >
                + Add address
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
