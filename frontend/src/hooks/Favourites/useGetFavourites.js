import { useQuery } from "@tanstack/react-query";
import { getFavourites } from "@/services/apiFavourite";
import { useAuthStore } from "@/store/useAuthStore";

export default function useGetFavourites() {
  const { authUser } = useAuthStore();

  const { data, isLoading: isLoadingFavourites } = useQuery({
    queryKey: ["favourites"],
    queryFn: getFavourites,
    enabled: !!authUser,
  });

  return {
    favourites: data?.data?.favourites || [],
    isLoadingFavourites,
  };
}
