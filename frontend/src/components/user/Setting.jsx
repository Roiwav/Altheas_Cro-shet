import React, { useEffect, useState } from "react";
import { useUser } from "../../../context/UserContext";
import { toast } from "react-toastify";

export default function Setting() {
  const { user } = useUser();
  const [language, setLanguage] = useState("English");
  const [currency, setCurrency] = useState("PHP");
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [newsletter, setNewsletter] = useState(false);

  const BASE_URL = "http://localhost/croshet_db/get-settings.php"; //UPDATE THIS URL

  // 🟡 Fetch current settings from backend
  useEffect(() => {
    if (!user?.id) return;
    fetch(`${BASE_URL}/get-settings.php?user_id=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success') {
          setLanguage(data.settings.language);
          setCurrency(data.settings.currency);
          setNotificationEnabled(data.settings.notifications === "1");
          setNewsletter(data.settings.newsletter === "1");
        }
      })
      .catch((err) => console.error("Settings fetch failed:", err));
  }, [user]);

  const handleSaveSettings = async () => {
    if (!user?.id) return;

    const payload = {
      user_id: user.id,
      language,
      currency,
      notifications: notificationEnabled ? 1 : 0,
      newsletter: newsletter ? 1 : 0,
    };

    try {
      const res = await fetch(`${BASE_URL}/update-settings.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (result.success) {
        toast.success("Preferences saved successfully! ✅");
      } else {
        toast.error("Failed to save: " + result.message);
      }
    } catch (err) {
      console.error("Settings save failed:", err);
      toast.error("Server error occurred.");
    }
  };

  return (
    <div className="max-w-xl mx-auto text-pink-800">
      <h2 className="text-4xl font-extrabold mb-4 text-center text-pink-600">Settings</h2>
      <p className="text-gray-600 mb-6 text-center">
        Customize your experience to suit your style ✨
      </p>

      <div className="space-y-6 bg-pink-50 p-6 rounded-2xl shadow-lg">
        {/* Language */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full border border-pink-200 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-pink-300"
          >
            <option>English</option>
            <option>Tagalog</option>
          </select>
        </div>

        {/* Currency Preference */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Currency</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full border border-pink-200 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-pink-300"
          >
            <option>PHP - Philippine Peso</option>
            <option>USD - US Dollar</option>
            <option>EUR - Euro</option>
          </select>
        </div>

        {/* Notifications */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Enable Order Notifications</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={notificationEnabled}
              onChange={() => setNotificationEnabled(!notificationEnabled)}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-pink-400 transition"></div>
            <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow transform peer-checked:translate-x-5 transition"></div>
          </label>
        </div>

        {/* Newsletter Subscription */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Subscribe to Newsletter</span>
          <input
            type="checkbox"
            checked={newsletter}
            onChange={() => setNewsletter(!newsletter)}
            className="form-checkbox h-5 w-5 text-pink-500 transition duration-150"
          />
        </div>
      </div>

      <div className="text-center mt-6">
        <button
          className="bg-pink-500 hover:bg-pink-600 text-white font-semibold px-6 py-2 rounded-full shadow-md transition"
          onClick={handleSaveSettings}
        >
          💾 Save Settings
        </button>
      </div>
    </div>
  );
}
