import { changeCourierDutyStatus as changeCourierDutyStatusApi } from "@/services/apiCourier";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export default function useChangeCourierDutyStatus() {
  const { mutate: changeCourierDutyStatus, isPending: isChangingDutyStatus } =
    useMutation({
      mutationFn: changeCourierDutyStatusApi,
      onSuccess: () => {
        toast.success("Duty status updated successfully");
      },
      onError: (err) => {
        toast.error(
          err?.response?.data?.message ??
            "Failed to update courier duty status",
        );
      },
    });

  return { changeCourierDutyStatus, isChangingDutyStatus };
}
