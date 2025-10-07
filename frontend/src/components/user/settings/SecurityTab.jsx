import React, { useState } from "react";
import { toast } from "react-toastify";
import { Lock } from "lucide-react";

import Field from "../../common/Field.jsx";
import { useUser } from "../../../context/useUser.js";

export default function SecurityTab() {
  const { token } = useUser();
  const [security, setSecurity] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  const changePassword = async () => {
    if (!security.newPassword || security.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (security.newPassword !== security.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (!token) {
      toast.error("You must be logged in to change your password.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5001/api/v1/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          currentPassword: security.currentPassword,
          newPassword: security.newPassword,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to change password");
      }

      toast.success("Password changed");
      setSecurity({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      console.error("Change password error:", err);
      toast.error(err.message || "Failed to change password");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Current password">
          <input
            type="password"
            value={security.currentPassword}
            onChange={(e) => setSecurity((s) => ({ ...s, currentPassword: e.target.value }))}
            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-200 rounded-xl dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
        </Field>
        <Field label="New password">
          <input
            type="password"
            value={security.newPassword}
            onChange={(e) => setSecurity((s) => ({ ...s, newPassword: e.target.value }))}
            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-200 rounded-xl dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
        </Field>
        <Field label="Confirm new password">
          <input
            type="password"
            value={security.confirmPassword}
            onChange={(e) => setSecurity((s) => ({ ...s, confirmPassword: e.target.value }))}
            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-200 rounded-xl dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
        </Field>
      </div>
      <div className="flex justify-end">
        <button onClick={changePassword} className="inline-flex items-center gap-2 px-5 py-2 text-white bg-pink-600 rounded-xl hover:bg-pink-700">
          <Lock className="w-4 h-4" /> Change password
        </button>
      </div>
    </div>
  );
}
