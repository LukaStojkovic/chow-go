import { getUserLocation } from "@/services/apiLocation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export default function useReverseGeocoding(lat, lon) {
  const { data, isLoading } = useQuery({
    queryFn: () => {
      return getUserLocation(lat, lon);
    },
    queryKey: ["detect-location", lat, lon],
    retry: 1,
    enabled: !!lat && !!lon,
    onError: () => {
      toast.error("Failed to find your address");
    },
  });

  return { data, isLoading };
}
