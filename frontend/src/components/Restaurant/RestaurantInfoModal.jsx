import React from "react";
import { MapPin, Clock, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import useOutsideClick from "@/hooks/useOutsideClick";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { useDarkMode } from "@/hooks/useDarkMode";
import { greenDotIcon } from "@/utils/leafletIcons";

const RestaurantInfoModal = ({
  showInfoModal,
  setShowInfoModal,
  restaurantData,
}) => {
  const { isDark } = useDarkMode();
  const modalRef = useOutsideClick(() => setShowInfoModal(false));
  const { location } = restaurantData;

  if (!showInfoModal || !restaurantData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center backdrop-blur-md">
      <div
        ref={modalRef}
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-900 animate-in slide-in-from-bottom-10 sm:animate-in sm:slide-in-from-bottom-0 sm:zoom-in-95"
      >
        <div className="relative h-48 overflow-hidden rounded-t-2xl">
          <MapContainer
            center={[location.coordinates[1], location.coordinates[0]]}
            zoom={17}
            zoomControl={false}
            scrollWheelZoom={false}
            doubleClickZoom={false}
            boxZoom={false}
            keyboard={false}
            dragging={false}
            touchZoom={false}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url={
                isDark
                  ? "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.jpg"
                  : "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.jpg"
              }
              attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>'
            />
            <Marker
              position={[location.coordinates[1], location.coordinates[0]]}
              icon={greenDotIcon}
            >
              <Popup
                closeButton={false}
                offset={[0, -5]}
                autoClose={false}
                autoPan={false}
              >
                <div className="text-center px-1  min-w-max">
                  <p className="text-[10px] text-gray-900">We are here</p>
                  <h3 className="font-semibold text-xs text-emerald-600 ">
                    {restaurantData.name}
                  </h3>
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
              {restaurantData.name}
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400 leading-relaxed">
              {restaurantData.description ||
                "Delicious food delivered straight to your door with care."}
            </p>
          </div>

          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-50">
                  Location
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {restaurantData.address
                    ? `${restaurantData.address.street}, ${restaurantData.address.city}`
                    : "Location not available"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-50">
                  Opening Hours
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {restaurantData.openingHours || "Daily 10:00 AM - 11:00 PM"}
                </p>
                <p
                  className={`text-xs font-semibold mt-1 ${
                    restaurantData.isOpenNow
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {restaurantData.isOpenNow ? "Open Now" : "Closed"}
                </p>
              </div>
            </div>

            {restaurantData.phone && (
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Phone className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-50">
                    Contact
                  </p>
                  <a
                    href={`tel:${restaurantData.phone}`}
                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {restaurantData.phone}
                  </a>
                </div>
              </div>
            )}

            {restaurantData.email && (
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <Mail className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-50">
                    Contact Email
                  </p>
                  <a
                    href={`mailto:${restaurantData.email}`}
                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {restaurantData.email}
                  </a>
                </div>
              </div>
            )}
          </div>

          <Button
            className="w-full"
            size="lg"
            variant="secondary"
            onClick={() => setShowInfoModal(false)}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RestaurantInfoModal;
