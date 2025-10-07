import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Bell, Save } from "lucide-react";

import Field from "../../common/Field.jsx";
import { useDarkMode } from "../../../context/DarkModeContext.jsx";
import { useUser } from "../../../context/useUser.js";

export default function PreferencesTab() {
  const { user, token, updateUser } = useUser();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [prefs, setPrefs] = useState({ newsletter: true });
  const [prefsPassword, setPrefsPassword] = useState("");

  useEffect(() => {
    if (user) {
      setPrefs({ newsletter: user.preferences?.newsletter ?? true });
    } else {
      setPrefs({ newsletter: true });
    }
  }, [user]);

  const savePreferences = async () => {
    if (!prefsPassword) {
      toast.error("Please enter your account password to save changes.");
      return;
    }
    if (!user?.id || !token) {
      toast.error("You must be logged in to save changes.");
      return;
    }
    try {
      const res = await fetch(`http://localhost:5001/api/v1/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ preferences: prefs, password: prefsPassword }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to save preferences");
      }

      const data = await res.json();
      updateUser(data.user);
      setPrefsPassword("");
      toast.success("Preferences saved");
    } catch (err) {
      console.error("Save preferences error:", err);
      toast.error(err.message || "Failed to save preferences");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="p-4 border border-gray-200 rounded-xl dark:border-gray-700">
          <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">Theme</h3>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={darkMode} onChange={toggleDarkMode} />
            <span className="text-gray-700 dark:text-gray-300">Enable dark mode</span>
          </label>
        </div>
        <div className="p-4 border border-gray-200 rounded-xl dark:border-gray-700">
          <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">Notifications</h3>
          <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={prefs.newsletter}
              onChange={(e) => setPrefs((p) => ({ ...p, newsletter: e.target.checked }))}
            />
            <Bell className="w-4 h-4" /> Email newsletter
          </label>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 mt-2 md:grid-cols-2">
        <Field label="Confirm password">
          <input
            type="password"
            value={prefsPassword}
            onChange={(e) => setPrefsPassword(e.target.value)}
            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-200 rounded-xl dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            placeholder="Enter your account password to confirm"
          />
        </Field>
      </div>
      <div className="flex justify-end">
        <button onClick={savePreferences} className="inline-flex items-center gap-2 px-5 py-2 text-white bg-pink-600 rounded-xl hover:bg-pink-700">
          <Save className="w-4 h-4" /> Save preferences
        </button>
      </div>
    </div>
  );
}
