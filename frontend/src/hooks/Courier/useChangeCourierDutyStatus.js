import { changeCourierDutyStatus as changeCourierDutyStatusApi } from "@/services/apiCourier";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { t } from "@chowgo/shared/i18n";

export default function useChangeCourierDutyStatus() {
  const { mutate: changeCourierDutyStatus, isPending: isChangingDutyStatus } =
    useMutation({
      mutationFn: changeCourierDutyStatusApi,
      onSuccess: () => {
        toast.success(t("courier:duty.updated"));
      },
      onError: (err) => {
        toast.error(
          err?.response?.data?.message ??
            t("courier:duty.updateFailed"),
        );
      },
    });

  return { changeCourierDutyStatus, isChangingDutyStatus };
}
