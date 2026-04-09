import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useDarkMode } from "@/hooks/useDarkMode";
import { greenDotIcon } from "@/utils/leafletIcons";
import L from "leaflet";
import { useMemo } from "react";

const courierIcon = new L.DivIcon({
  className: "courier-marker",
  html: `
    <div style="
      width: 14px;
      height: 14px;
      border-radius: 9999px;
      background: #2563eb;
      box-shadow: 0 0 0 6px rgba(37, 99, 235, 0.20);
      border: 2px solid rgba(255,255,255,0.95);
    "></div>
  `,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

export function LiveDeliveryMap({ restaurant, courier, className = "" }) {
  const { isDark } = useDarkMode();

  const restaurantPos = useMemo(() => {
    const c = restaurant?.location?.coordinates;
    if (!c || c.length !== 2) return null;
    return [c[1], c[0]];
  }, [restaurant?.location?.coordinates]);

  const courierPos = useMemo(() => {
    const c = courier?.currentLocation?.coordinates;
    if (!c || c.length !== 2) return null;
    return [c[1], c[0]];
  }, [courier?.currentLocation?.coordinates]);

  const center = courierPos || restaurantPos || [20.5937, 78.9629];

  if (!restaurantPos && !courierPos) return null;

  return (
    <div
      className={`relative w-full h-80 rounded-xl border border-gray-100 dark:border-zinc-800 overflow-hidden bg-gray-100 dark:bg-zinc-900 ${className}`}
    >
      <MapContainer
        center={center}
        zoom={15}
        scrollWheelZoom
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

        {restaurantPos && (
          <Marker position={restaurantPos} icon={greenDotIcon}>
            <Popup closeButton={false} offset={[0, -5]} autoClose={false}>
              <div className="text-center px-1 min-w-max">
                <p className="text-[10px] text-gray-900">Restaurant</p>
                <h3 className="font-semibold text-xs text-emerald-600">
                  {restaurant?.name || "Restaurant"}
                </h3>
              </div>
            </Popup>
          </Marker>
        )}

        {courierPos && (
          <Marker position={courierPos} icon={courierIcon}>
            <Popup closeButton={false} offset={[0, -5]} autoClose={false}>
              <div className="text-center px-1 min-w-max">
                <p className="text-[10px] text-gray-900">Courier</p>
                <h3 className="font-semibold text-xs text-blue-600">
                  {courier?.fullName || "Courier"}
                </h3>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

