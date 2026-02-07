import { Home, MapPin } from "lucide-react";
import React, { useState, useEffect } from "react";
import { LocationMapSelector } from "../Location/LocationMapSelector";
import useOutsideClick from "@/hooks/useOutsideClick";
import { useNavigate } from "react-router-dom";
import useGetDeliveryAddresses from "@/hooks/DeliveryAddress/useGetDeliveryAddresses";
import Spinner from "../Spinner";
import { useDeliveryStore } from "@/store/useDeliveryStore";

export default function DeliveryAddressSectionPicker() {
  const navigate = useNavigate();
  const { deliveryAddresses, isLoadingAddresses } = useGetDeliveryAddresses();
  const { selectedDeliveryAddress, setSelectedDeliveryAddress } =
    useDeliveryStore();

  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const addressDropdownRef = useOutsideClick(() =>
    setShowAddressDropdown(false),
  );

  useEffect(() => {
    if (deliveryAddresses?.data && deliveryAddresses.data.length > 0) {
      if (!selectedDeliveryAddress) {
        const defaultAddr = deliveryAddresses.data.find(
          (addr) => addr.isDefault,
        );
        setSelectedDeliveryAddress(defaultAddr || deliveryAddresses.data[0]);
      }
    }
  }, [deliveryAddresses, selectedDeliveryAddress, setSelectedDeliveryAddress]);

  return (
    <section className="rounded-lg sm:rounded-xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base sm:text-lg font-bold">
          <MapPin className="h-4 sm:h-5 w-4 sm:w-5 text-blue-600 shrink-0" />
          <span>Delivery Address</span>
        </h2>
        <button
          onClick={() => navigate("/profile")}
          className="text-xs sm:text-sm cursor-pointer font-semibold text-blue-600 hover:underline"
        >
          Edit
        </button>
      </div>

      <div className="mb-4 h-24 sm:h-32 w-full overflow-hidden rounded-lg bg-gray-200 dark:bg-zinc-800">
        {isLoadingAddresses ? (
          <div className="h-full flex items-center justify-center">
            <Spinner size={24} />
          </div>
        ) : (
          <LocationMapSelector
            onLocationChange={(lat, lng) => console.log(lat, lng)}
          />
        )}
      </div>

      <div className="relative" ref={addressDropdownRef}>
        <div
          onClick={() => setShowAddressDropdown((v) => !v)}
          className="flex items-start gap-3 sm:gap-4 cursor-pointer rounded-lg p-2 -m-2 hover:bg-gray-50 dark:hover:bg-zinc-800 transition"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-800">
            <Home className="h-4 sm:h-5 w-4 sm:w-5 text-gray-600 dark:text-gray-400" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm sm:text-base">
              {selectedDeliveryAddress
                ? selectedDeliveryAddress.label?.charAt(0).toUpperCase() +
                  selectedDeliveryAddress.label?.slice(1)
                : "Select Address"}
            </p>
            <p className="text-xs sm:text-sm text-gray-500">
              {selectedDeliveryAddress?.fullAddress || "No address selected"}
            </p>
            {selectedDeliveryAddress?.notes && (
              <p className="mt-1 text-xs text-gray-400">
                Note to driver: {selectedDeliveryAddress.notes}
              </p>
            )}
          </div>

          <svg
            className={`h-4 w-4 text-gray-400 shrink-0 mt-1 transition-transform ${
              showAddressDropdown ? "rotate-180" : ""
            }`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        {showAddressDropdown && (
          <div className="absolute left-0 top-full mt-2 z-50 w-full rounded-xl border border-gray-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
            {isLoadingAddresses ? (
              <div className="p-4 flex items-center justify-center">
                <Spinner size={20} />
              </div>
            ) : deliveryAddresses?.data && deliveryAddresses.data.length > 0 ? (
              <>
                {deliveryAddresses.data.map((addr) => (
                  <button
                    key={addr._id}
                    onClick={() => {
                      setSelectedDeliveryAddress(addr);
                      setShowAddressDropdown(false);
                    }}
                    className={`flex w-full flex-col gap-0.5 cursor-pointer px-4 py-3 text-left transition ${
                      selectedDeliveryAddress?._id === addr._id
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : "hover:bg-gray-50 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <span className="text-sm font-semibold">
                      {addr.label
                        ? addr.label.charAt(0).toUpperCase() + addr.label.slice(1)
                        : "Address"}
                    </span>
                    <span className="text-xs text-gray-500">
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
                    className="w-full px-4 py-3 text-left text-sm font-semibold text-blue-600 hover:bg-gray-50 dark:hover:bg-zinc-800"
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
    </section>
  );
}
