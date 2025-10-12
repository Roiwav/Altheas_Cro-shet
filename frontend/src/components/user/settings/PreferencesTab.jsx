import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Bell, Save, Eye, EyeOff, Lock, Loader2, AlertCircle } from "lucide-react";

import Field from "../../common/Field.jsx";
import { useDarkMode } from "../../../context/useDarkMode.js";
import { useUser } from "../../../context/useUser.js";
import apiRequest from "../../../config/api.js";

/**
 * A tab component for managing user preferences, such as theme settings.
 */
export default function PreferencesTab() {
  const { user, token, updateUser } = useUser();
  const { setDarkMode } = useDarkMode();
  const [prefs, setPrefs] = useState({ darkMode: true });
  const [initialPrefs, setInitialPrefs] = useState({ darkMode: true });
  const [prefsPassword, setPrefsPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [hasPassword, setHasPassword] = useState(true);
  const isDirty = JSON.stringify(prefs) !== JSON.stringify(initialPrefs);

  /**
   * Effect to initialize and synchronize local preferences state with the user context.
   * It also immediately applies the dark mode setting to the application.
   */
  useEffect(() => {
    if (user) {
      const nextPrefs = { 
        darkMode: user.preferences?.darkMode ?? true
      };
      setPrefs(nextPrefs);
      setInitialPrefs(nextPrefs);
      // Sync app theme immediately with account preference
      if (typeof nextPrefs.darkMode === 'boolean') {
        setDarkMode(nextPrefs.darkMode);
      }
    } else {
      const defaults = { darkMode: true };
      setPrefs(defaults);
      setInitialPrefs(defaults);
    }
  }, [user, setDarkMode]);

  /**
   * Effect to determine if the user is a Google-authenticated user and
   * whether they have set a password for the application.
   */
  useEffect(() => {
    if (user) {
      const googleUser = Boolean(user.googleId);
      setIsGoogleUser(googleUser);
      setHasPassword(googleUser ? Boolean(user.hasPassword) : true);
    } else {
      setIsGoogleUser(false);
      setHasPassword(true);
    }
  }, [user]);

  /**
   * Saves the user's updated preferences to the backend.
   */
  const savePreferences = async () => {
    if (!isDirty) {
      toast.info("No changes to save.");
      return;
    }
    if (isGoogleUser && !hasPassword) {
      toast.error("Set a password in the Security tab to save account changes.");
      return;
    }
    if (!prefsPassword) {
      toast.error("Please enter your account password to save changes.");
      return;
    }
    if (!user?.id || !token) {
      toast.error("You must be logged in to save changes.");
      return;
    }
    setIsSaving(true);
    try {
      const data = await apiRequest(`/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ preferences: prefs, password: prefsPassword }),
      });

      updateUser(data.user);
      setInitialPrefs(data.user?.preferences || prefs);
      setPrefsPassword("");
      toast.success("Preferences saved");
    } catch (err) {
      console.error("Save preferences error:", err);
      toast.error(err.message || "Failed to save preferences");
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Resets any unsaved changes to the preferences.
   */
  const resetPreferences = () => {
    setPrefs(initialPrefs);
    setPrefsPassword("");
    toast.info("Changes reverted");
  };

  return (
    <div className="space-y-6">
      {isGoogleUser && !hasPassword && (
        <div className="p-3 text-yellow-700 bg-yellow-50 rounded-lg dark:bg-yellow-900/30 dark:text-yellow-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <p>You're signed in with Google. Set a password in the Security tab to save account changes.</p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="p-4 border border-gray-200 rounded-xl dark:border-gray-700">
          <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">Theme</h3>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={prefs.darkMode} 
              onChange={(e) => {
                const checked = e.target.checked;
                setPrefs((p) => ({ ...p, darkMode: checked }));
                setDarkMode(checked);
              }} 
            />
            <span className="text-gray-700 dark:text-gray-300">Enable dark mode</span>
          </label>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 mt-2 md:grid-cols-2">
        <Field label="Confirm password">
          <div className="relative">
            <Lock className="absolute w-4 h-4 text-gray-400 left-3 top-3" />
            <input
              type={showPassword ? "text" : "password"}
              value={prefsPassword}
              onChange={(e) => setPrefsPassword(e.target.value)}
              disabled={isSaving || (isGoogleUser && !hasPassword)}
              autoComplete="current-password"
              className="w-full py-2 pl-10 pr-10 text-gray-900 bg-white border border-gray-200 rounded-xl dark:border-gray-700 dark:bg-gray-900 dark:text-white disabled:opacity-60"
              placeholder="Enter your account password to confirm"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute inset-y-0 right-0 px-3 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {isGoogleUser && !hasPassword && (
            <p className="mt-1 text-xs text-yellow-700 dark:text-yellow-300">
              Since you signed in with Google, set a password in the Security tab to save account changes.
            </p>
          )}
        </Field>
      </div>
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={resetPreferences}
          disabled={isSaving || (!isDirty && !prefsPassword)}
          className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
        >
          Reset
        </button>
        <button
          onClick={savePreferences}
          disabled={!isDirty || !prefsPassword || isSaving || (isGoogleUser && !hasPassword)}
          className="inline-flex items-center gap-2 px-5 py-2 text-white bg-pink-600 rounded-xl hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> Save preferences
            </>
          )}
        </button>
      </div>
    </div>
  );
}
