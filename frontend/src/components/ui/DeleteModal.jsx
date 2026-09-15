import { Button } from "@/components/ui/button";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import Modal from "../Modal";
import Spinner from "../Spinner";

export const DeleteModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
  isLoading = false,
}) => {
  const { t } = useTranslation("common");

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title ?? t("state.areYouSure")}
      description={description ?? t("state.cannotBeUndone")}
      size="sm"
    >
      <div className="flex justify-end gap-4 mt-6">
        <Button variant="outline" onClick={onClose} disabled={isLoading}>
          {cancelText ?? t("actions.cancel")}
        </Button>
        <Button
          className="bg-destructive hover:bg-destructive text-destructive-foreground"
          onClick={handleConfirm}
          disabled={isLoading}
        >
          {isLoading ? <Spinner size="sm" /> : (confirmText ?? t("actions.delete"))}
        </Button>
      </div>
    </Modal>
  );
};
