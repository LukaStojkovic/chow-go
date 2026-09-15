import { getUserLocation } from "@/services/apiLocation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { t } from "@chowgo/shared/i18n";

export default function useReverseGeocoding(lat, lon) {
  const { data, isLoading } = useQuery({
    queryFn: () => {
      return getUserLocation(lat, lon);
    },
    queryKey: ["detect-location", lat, lon],
    retry: 1,
    enabled: !!lat && !!lon,
    onError: () => {
      toast.error(t("profile:address.lookupFailed"));
    },
  });

  return { data, isLoading };
}
