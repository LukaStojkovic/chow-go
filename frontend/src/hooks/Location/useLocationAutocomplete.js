import { getLocationPredction } from "@/services/apiLocation";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";

export default function useLocationAutocomplete(input) {
  const [debouncedInput] = useDebounce(input, 300);

  const {
    isLoading,
    data: predictions,
    error,
  } = useQuery({
    queryKey: ["location-prediction", debouncedInput],
    queryFn: () => getLocationPredction(debouncedInput),
    enabled: debouncedInput.trim().length >= 2,
    retry: false,
  });

  return { isLoading, predictions, error };
}
