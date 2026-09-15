import React from "react";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Lock, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/store/useAuthStore";
import Modal from "@/components/Modal";
import { toast } from "sonner";
import { msg } from "@chowgo/shared/i18n/fieldErrors";

import PasswordField from "./PasswordField";

const passwordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, msg("validation:auth.currentPasswordRequired")),
    newPassword: z
      .string()
      .min(6, msg("validation:auth.passwordMin", { count: 6 })),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: msg("validation:auth.passwordsMismatch"),
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: msg("validation:auth.passwordSameAsCurrent"),
    path: ["newPassword"],
  });

export default function PasswordChangeModal({ isOpen, onClose }) {
  const { t } = useTranslation(["profile", "common"]);
  const { apiUpdateProfile, isUpdatingProfile } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    reset,
  } = useForm({
    resolver: zodResolver(passwordSchema),
    mode: "onChange",
  });

  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const onSubmit = async (data) => {
    try {
      await apiUpdateProfile({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });

      handleClose();
    } catch (err) {
      toast.error(err?.data.message || t("account.passwordChangeFailed"));
    }
  };

  const handleClose = () => {
    if (isUpdatingProfile) return;
    reset();
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t("account.changePassword")}
      description={t("account.changePasswordHint")}
      size="md"
      footer={
        <div className="flex gap-3 w-full">
          <button
            onClick={handleClose}
            disabled={isUpdatingProfile}
            className="flex-1 py-2.5 px-4 bg-muted rounded-lg font-medium hover:bg-secondary transition disabled:opacity-50"
          >
            {t("common:actions.cancel")}
          </button>
          <button
            type="submit"
            form="password-form"
            disabled={isUpdatingProfile || !isValid || !isDirty}
            className="flex-1 py-2.5 px-4 bg-primary hover:bg-primary-hover text-primary-foreground disabled:opacity-50 rounded-sm font-medium flex items-center justify-center gap-2 transition"
          >
            {isUpdatingProfile ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {t("common:state.updating")}
              </>
            ) : (
              t("account.updatePassword")
            )}
          </button>
        </div>
      }
    >
      <form
        id="password-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
      >
        <PasswordField
          label={t("account.currentPassword")}
          name="currentPassword"
          show={showCurrent}
          setShow={setShowCurrent}
          placeholder="••••••••"
          register={register}
          errors={errors}
        />

        <div>
          <PasswordField
            label={t("account.newPassword")}
            name="newPassword"
            show={showNew}
            setShow={setShowNew}
            placeholder={t("account.newPasswordPlaceholder")}
            register={register}
            errors={errors}
          />
          <p className="mt-1 text-xs text-muted-foreground ">
            {t("account.passwordMinHint", { count: 6 })}
          </p>
        </div>

        <PasswordField
          label={t("account.confirmPassword")}
          name="confirmPassword"
          show={showConfirm}
          setShow={setShowConfirm}
          placeholder={t("account.confirmPasswordPlaceholder")}
          register={register}
          errors={errors}
        />
      </form>
    </Modal>
  );
}
