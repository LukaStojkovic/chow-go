import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useDeliveryStore } from "@/store/useDeliveryStore";
import useDetectLocation from "@/hooks/Location/useDetectLocation";
import { Button } from "@/components/ui/button";
import { Navigation } from "lucide-react";
import Spinner from "@/components/Spinner";
import { useDarkMode } from "@/hooks/useDarkMode";

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => onMapClick(e.latlng),
  });
  return null;
}

function MapController({ position }) {
  const map = useMap();
  const lastPosition = useRef(null);

  useEffect(() => {
    if (
      position &&
      (!lastPosition.current ||
        lastPosition.current[0] !== position[0] ||
        lastPosition.current[1] !== position[1])
    ) {
      map.flyTo(position, 15, { duration: 1.5 });
      lastPosition.current = position;
    }
  }, [position]);
}

export function LocationMapSelector({
  onLocationChange,
  initialPosition,
  className = "",
}) {
  const { coordinates: storeCoords } = useDeliveryStore();
  const {
    detect,
    isDetecting,
    coordinates: detectedCoords,
  } = useDetectLocation();
  const { isDark } = useDarkMode();

  const [markerPosition, setMarkerPosition] = useState(
    initialPosition ? [initialPosition.lat, initialPosition.lng] : null
  );

  const center = storeCoords
    ? [storeCoords.lat, storeCoords.lon]
    : [20.5937, 78.9629];

  const handleMapClick = useCallback(
    (latlng) => {
      const pos = [latlng.lat, latlng.lng];
      setMarkerPosition(pos);
      onLocationChange(latlng.lat, latlng.lng);
    },
    [onLocationChange]
  );

  const handleDetectClick = useCallback(() => {
    detect();
  }, [detect]);

  useEffect(() => {
    if (detectedCoords) {
      const pos = [detectedCoords.lat, detectedCoords.lon];
      setMarkerPosition(pos);
      onLocationChange(detectedCoords.lat, detectedCoords.lon);
    }
  }, [detectedCoords?.lat, detectedCoords?.lon, onLocationChange]);

  const mapClickHandler = useMemo(
    () => <MapClickHandler onMapClick={handleMapClick} />,
    [handleMapClick]
  );

  const mapController = useMemo(
    () => <MapController position={markerPosition} />,
    [markerPosition]
  );

  const customIcon = useMemo(
    () =>
      L.divIcon({
        html: '<div style="background-color: #10b981; border: 2px solid white; border-radius: 50%; width: 20px; height: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
        className: "custom-marker",
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      }),
    []
  );

  return (
    <div
      className={`relative w-full h-80 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden bg-gray-100 dark:bg-zinc-900 ${className}`}
    >
      <MapContainer
        center={center}
        zoom={markerPosition ? 15 : 5}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
        className="rounded-lg"
      >
        <TileLayer
          url={
            isDark
              ? "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.jpg"
              : "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.jpg"
          }
          attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>'
        />

        {markerPosition && (
          <Marker position={markerPosition} icon={customIcon} />
        )}

        {mapClickHandler}
        {mapController}
      </MapContainer>

      <div className="absolute bottom-4 left-4 z-1000">
        <Button
          onClick={handleDetectClick}
          disabled={isDetecting}
          size="sm"
          className="shadow-2xl flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
        >
          <Navigation
            className={`w-4 h-4 ${isDetecting ? "animate-pulse" : ""}`}
          />
          {isDetecting ? <Spinner size="sm" /> : "Detect My Location"}
        </Button>
      </div>
    </div>
  );
}
