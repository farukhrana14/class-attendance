// src/components/modals/LoadingModal.jsx
import React from "react";
import BaseModal from "./BaseModal";

export default function LoadingModal({
  show,
  message = "Loading...",
}) {
  return (
    <BaseModal show={show} onClose={null} backdropOpacity="bg-opacity-50">
      <div className="flex flex-col items-center">
        <span className="relative flex h-16 w-16">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gradient-to-tr from-blue-400 via-purple-500 to-pink-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-16 w-16 bg-gradient-to-tr from-blue-400 via-purple-500 to-pink-500"></span>
          <span className="absolute inset-0 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              ></path>
            </svg>
          </span>
        </span>
        <div className="mt-6 text-lg font-semibold text-gray-800 text-center">
          {message}
        </div>
      </div>
    </BaseModal>
  );
}
