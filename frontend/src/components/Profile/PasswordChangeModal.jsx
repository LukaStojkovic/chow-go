import React from "react";
import { Eye, EyeOff, Lock, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/store/useAuthStore";
import Modal from "@/components/Modal";
import { toast } from "sonner";
import PasswordField from "./PasswordField";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

export default function PasswordChangeModal({ isOpen, onClose }) {
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
      toast.error(err?.data.message || "Failed to change password");
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
      title="Change Password"
      description="Create a strong new password for your account"
      size="md"
      footer={
        <div className="flex gap-3 w-full">
          <button
            onClick={handleClose}
            disabled={isUpdatingProfile}
            className="flex-1 py-2.5 px-4 bg-muted rounded-lg font-medium hover:bg-secondary transition disabled:opacity-50"
          >
            Cancel
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
                Updating...
              </>
            ) : (
              "Update Password"
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
          label="Current Password"
          name="currentPassword"
          show={showCurrent}
          setShow={setShowCurrent}
          placeholder="••••••••"
          register={register}
          errors={errors}
        />

        <div>
          <PasswordField
            label="New Password"
            name="newPassword"
            show={showNew}
            setShow={setShowNew}
            placeholder="Enter new password"
            register={register}
            errors={errors}
          />
          <p className="mt-1 text-xs text-muted-foreground ">
            At least 6 characters
          </p>
        </div>

        <PasswordField
          label="Confirm New Password"
          name="confirmPassword"
          show={showConfirm}
          setShow={setShowConfirm}
          placeholder="Confirm new password"
          register={register}
          errors={errors}
        />
      </form>
    </Modal>
  );
}
