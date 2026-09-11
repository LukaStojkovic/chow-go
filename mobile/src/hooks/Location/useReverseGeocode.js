import { useQuery } from "@tanstack/react-query";
import { reverseGeocode } from "@/services/apiLocation";

// Nominatim sits behind the backend proxy and is rate limited, so the key is
// rounded to ~1m and the result is held long enough that dragging a pin back
// over somewhere it has already been costs nothing.
export function useReverseGeocode(position) {
  const [lat, lon] = position ?? [];

  return useQuery({
    queryKey: ["reverseGeocode", lat?.toFixed(5), lon?.toFixed(5)],
    queryFn: () => reverseGeocode({ lat, lon }),
    enabled: lat != null && lon != null,
    staleTime: 10 * 60_000,
    retry: false,
  });
}
