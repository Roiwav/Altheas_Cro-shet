import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Lock, Key, AlertCircle } from "lucide-react";

import Field from "../../common/Field.jsx";
import { useUser } from "../../../context/useUser.js";
import { SERVER_BASE_URL } from "../../../utils/product.js";

export default function SecurityTab() {
  const { user, token, updateUser } = useUser();
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [hasPassword, setHasPassword] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [security, setSecurity] = useState({ 
    currentPassword: "", 
    newPassword: "", 
    confirmPassword: "" 
  });

  // Check if user is a Google-authenticated user and if they have a password set
  useEffect(() => {
    if (user) {
      const googleUser = Boolean(user.googleId);
      setIsGoogleUser(googleUser);
      setHasPassword(googleUser ? Boolean(user.hasPassword) : true);
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSecurity(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const showConfirm = !isGoogleUser; // Google users: no confirm field
    
    // Common validations
    if (!security.newPassword || security.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    if (showConfirm) {
      if (!security.confirmPassword) {
        toast.error("Please confirm your new password");
        return;
      }
      if (security.newPassword !== security.confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
    }

    // Additional validation for users with existing password
    if (hasPassword && !security.currentPassword) {
      toast.error("Please enter your current password");
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = hasPassword 
        ? `${SERVER_BASE_URL}/api/v1/auth/change-password`
        : `${SERVER_BASE_URL}/api/v1/auth/set-password`;
      
      const body = hasPassword
        ? { currentPassword: security.currentPassword, newPassword: security.newPassword }
        : { newPassword: security.newPassword };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update password");
      }

      // Update user context to reflect password status
      if (!hasPassword) {
        updateUser({ ...user, hasPassword: true });
        setHasPassword(true);
      }

      toast.success(hasPassword ? "Password changed successfully" : "Password set successfully");
      setSecurity({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      console.error("Password update error:", err);
      toast.error(err.message || "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 bg-white rounded-xl shadow-sm dark:bg-gray-800/50">
        <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
          {hasPassword ? "Change Password" : "Set a Password"}
        </h2>
        
        {isGoogleUser && !hasPassword && (
          <div className="p-4 mb-6 text-yellow-700 bg-yellow-50 rounded-lg dark:bg-yellow-900/30 dark:text-yellow-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <p>You're currently signed in with Google. Set a password to enable password login.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {hasPassword && (
              <Field label="Current Password" htmlFor="currentPassword">
                <div className="relative">
                  <Lock className="absolute w-4 h-4 text-gray-400 left-3 top-3" />
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={security.currentPassword}
                    onChange={handleInputChange}
                    className="w-full py-2 pl-10 pr-3 text-gray-900 bg-white border border-gray-200 rounded-xl dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    placeholder="Enter your current password"
                  />
                </div>
              </Field>
            )}

            <Field label="New Password" htmlFor="newPassword">
              <div className="relative">
                <Key className="absolute w-4 h-4 text-gray-400 left-3 top-3" />
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={security.newPassword}
                  onChange={handleInputChange}
                  className="w-full py-2 pl-10 pr-3 text-gray-900 bg-white border border-gray-200 rounded-xl dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  placeholder="Enter new password"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Must be at least 6 characters
              </p>
            </Field>
            {!isGoogleUser && (
              <Field label="Confirm New Password" htmlFor="confirmPassword">
                <div className="relative">
                  <Key className="absolute w-4 h-4 text-gray-400 left-3 top-3" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={security.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full py-2 pl-10 pr-3 text-gray-900 bg-white border border-gray-200 rounded-xl dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    placeholder="Confirm your new password"
                  />
                </div>
              </Field>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-2 text-white bg-pink-600 rounded-xl hover:bg-pink-700"
            >
              <Lock className="w-4 h-4" />
              {isLoading ? (hasPassword ? 'Updating...' : 'Setting...') : (hasPassword ? 'Change Password' : 'Set Password')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
