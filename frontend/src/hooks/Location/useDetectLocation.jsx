import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import useReverseGeocoding from "./useReverseGeocoding";
import { MapPin } from "lucide-react";

export default function useDetectLocation() {
  const [lat, setLat] = useState(null);
  const [lon, setLon] = useState(null);
  const [isGettingGeo, setIsGettingGeo] = useState(false);

  const coordinates = useMemo(
    () => (lat !== null && lon !== null ? { lat, lon } : null),
    [lat, lon]
  );

  const { data, isLoading, isError } = useReverseGeocoding(lat, lon);

  const isDetecting = isGettingGeo || isLoading;

  const clearDetectedLocation = () => {
    setLat(null);
    setLon(null);
  };

  useEffect(() => {
    if (data?.address && coordinates) {
      toast.success("Location detected!", {
        description: data.address,
        icon: <MapPin className="w-5 h-5" />,
      });

      setIsGettingGeo(false);
    }
  }, [data, coordinates]);

  const detect = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported for this device");
      return;
    }

    setIsGettingGeo(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLon(pos.coords.longitude);
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
    coordinates,
    isDetecting,
    isError,
    clearDetectedLocation,
  };
}
