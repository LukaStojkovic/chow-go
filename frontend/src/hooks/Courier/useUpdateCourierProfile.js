import { updateCourierProfile } from "@/services/apiCourier";
import { useAuthStore } from "@/store/useAuthStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function useUpdateCourierProfile() {
  const queryClient = useQueryClient();
  const checkAuth = useAuthStore((s) => s.checkAuth);

  const { mutate: updateProfile, isPending: isUpdating } = useMutation({
    mutationFn: updateCourierProfile,
    onSuccess: async () => {
      await checkAuth();
      queryClient.invalidateQueries({ queryKey: ["courier-profile"] });
      queryClient.invalidateQueries({ queryKey: ["courier-overview"] });
      toast.success("Profile updated successfully");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? "Failed to update profile");
    },
  });

  return { updateProfile, isUpdating };
}
