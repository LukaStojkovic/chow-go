import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { apiDeleteAccount } from "@/services/apiAuth";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * Deleting an account is irreversible, so a local account re-enters its
 * password: a borrowed unlocked browser should not be enough. A Google account
 * has no password to re-enter and the session itself is the proof.
 */
export function DeleteAccountDialog({ open, onOpenChange }) {
  const { t } = useTranslation(["profile", "common"]);
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.authUser);
  const needsPassword = authUser?.authProvider !== "google";

  const [password, setPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  async function onConfirm(event) {
    // The dialog would otherwise close on click, before the request resolves.
    event.preventDefault();
    setIsDeleting(true);
    try {
      await apiDeleteAccount(needsPassword ? password : undefined);
      useAuthStore.setState({ authUser: null });
      toast.success(t("deleteAccount.success"));
      onOpenChange(false);
      navigate("/", { replace: true });
    } catch (error) {
      toast.error(
        error?.response?.data?.message ?? t("account.deleteAccountFailed"),
      );
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deleteAccount.title")}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>{t("deleteAccount.body1")}</p>
              <p>{t("deleteAccount.body2")}</p>
              <p>{t("deleteAccount.body3")}</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {needsPassword ? (
          <div className="space-y-2">
            <Label htmlFor="delete-account-password">
              {t("deleteAccount.confirmLabel")}
            </Label>
            <Input
              id="delete-account-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isDeleting}
            />
          </div>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            {t("deleteAccount.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting || (needsPassword && password.length === 0)}
            className={cn(buttonVariants({ variant: "destructive" }))}
          >
            {isDeleting ? "Deleting…" : t("deleteAccount.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
