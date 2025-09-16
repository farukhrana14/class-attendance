// src/components/StatusBadge.jsx
import React from "react";

const color = (status = "") => {
  switch (status.toLowerCase()) {
    case "present":
      return "bg-green-100 text-green-800";
    case "late":
      return "bg-yellow-100 text-yellow-800";
    case "absent":
      return "bg-red-100 text-red-800";
    case "sick":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function StatusBadge({ status }) {
  const s = (status || "N/A").toString();
  const text = s.charAt(0).toUpperCase() + s.slice(1);
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${color(s)}`}>
      {text}
    </span>
  );
}
