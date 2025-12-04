import { useEffect, useState } from "react";
import { toast } from "sonner";
import useReverseGeocoding from "./useReverseGeocoding";
import { MapPin } from "lucide-react";

export default function useDetectLocation() {
  const [coords, setCoords] = useState(null);
  const [isGettingGeo, setIsGettingGeo] = useState(false);

  const { data, isLoading, isError } = useReverseGeocoding(
    coords?.lat,
    coords?.lon
  );

  const isDetecting = isGettingGeo || isLoading;

  const clearDetectedLocation = () => {
    setCoords(null);
  };

  useEffect(() => {
    if (data?.address && coords) {
      toast.success("Location detected!", {
        description: data.address,
        icon: <MapPin className="w-5 h-5" />,
      });

      setIsGettingGeo(false);
    }
  }, [data, coords]);

  const detect = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported for this device");
      return;
    }

    setIsGettingGeo(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
      },
      () => {
        toast.error("Location access denied");
        setIsGettingGeo(false);
      },
      { timeout: 15000 }
    );
  };

  return {
    detect,
    address: data?.address || "",
    coordinates: coords ? { lat: coords.lat, lon: coords.lon } : null,
    isDetecting,
    isError,
    clearDetectedLocation,
  };
}
