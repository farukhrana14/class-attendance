// src/components/modals/BaseModal.jsx
import React from "react";

export default function BaseModal({
  show,
  onClose,
  children,
  width = "sm:max-w-[384px] max-w-[90%]", // responsive: 90% on mobile, fixed 384px on sm+
  align = "center",                      // vertical alignment
  backdropOpacity = "bg-opacity-40",     // backdrop darkness
  minHeight = "min-h-[220px]",           // consistent vertical size
}) {
  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 flex items-${align} justify-${align} bg-black ${backdropOpacity} z-50`}
    >
      <div
        className={`relative bg-white rounded-lg shadow-lg p-6 ${width} ${minHeight} animate-fade-in`}
      >
        {children}

        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            aria-label="Close modal"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
