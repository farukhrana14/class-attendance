import React from "react";
import BaseModal from "./BaseModal";

export default function SuccessModal({
  show,
  message = "Action completed successfully!",
  onClose,
  title = "Success",
  buttonLabel = "OK",
}) {
  return (
    <BaseModal show={show} onClose={onClose}>
      <div className="flex flex-col items-center text-center">
        <svg
          className="w-14 h-14 text-green-600 mb-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
        <h3 className="text-xl font-bold text-green-600 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <button
          onClick={onClose}
          className="px-8 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
        >
          {buttonLabel}
        </button>
      </div>
    </BaseModal>
  );
}
