import { Button } from "@/components/ui/button";

import { useState } from "react";
import Modal from "../Modal";
import Spinner from "../Spinner";

export const DeleteModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
  isLoading = false,
}) => {
  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
    >
      <div className="flex justify-end gap-4 mt-6">
        <Button variant="outline" onClick={onClose} disabled={isLoading}>
          {cancelText}
        </Button>
        <Button
          className="bg-red-600 hover:bg-red-700 text-white"
          onClick={handleConfirm}
          disabled={isLoading}
        >
          {isLoading ? <Spinner size="sm" /> : confirmText}
        </Button>
      </div>
    </Modal>
  );
};
