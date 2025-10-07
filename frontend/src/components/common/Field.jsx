import React from "react";

export default function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      {children}
    </label>
  );
}
