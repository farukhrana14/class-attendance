// src/components/modals/ConfirmModal.jsx
import React from "react";
import BaseModal from "./BaseModal";

export default function ConfirmModal({
  show,
  title = "Confirm Action",
  message,
  onCancel,
  onConfirm,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
}) {
  return (
    <BaseModal show={show} onClose={onCancel}>
      <h3 className="text-lg font-bold text-red-600 mb-4">{title}</h3>
      <p className="text-gray-700 mb-6">{message}</p>
      <div className="flex justify-end space-x-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          {confirmLabel}
        </button>
      </div>
    </BaseModal>
  );
}
