import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { User as UserIcon, MapPin, Lock, Palette } from "lucide-react";

import ProfileTab from "../../components/user/settings/ProfileTab.jsx";
import AddressesTab from "../../components/user/settings/AddressesTab.jsx";
import SecurityTab from "../../components/user/settings/SecurityTab.jsx";
import PreferencesTab from "../../components/user/settings/PreferencesTab.jsx";

export default function SettingsPage() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "profile");

  const tabs = useMemo(
    () => [
      { key: "profile", label: "Profile", icon: <UserIcon className="w-4 h-4" /> },
      { key: "addresses", label: "Addresses", icon: <MapPin className="w-4 h-4" /> },
      { key: "security", label: "Security", icon: <Lock className="w-4 h-4" /> },
      { key: "preferences", label: "Preferences", icon: <Palette className="w-4 h-4" /> },
    ],
    []
  );

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl && tabs.some((t) => t.key === tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams, tabs]);

  return (
    <div className="relative z-10 bg-gray-50 dark:bg-gray-900 min-h-screen pt-24 lg:pt-32 pb-10 lg:ml-[var(--sidebar-width,5rem)] transition-all duration-300 ease-in-out">
      <div className="container max-w-5xl mx-auto">
        <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white">Account Settings</h1>

        <div className="flex mb-6 space-x-2 overflow-x-auto no-scrollbar">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors whitespace-nowrap ${
                activeTab === t.key
                  ? "bg-pink-600 text-white border-pink-600"
                  : "bg-white/70 dark:bg-gray-800/70 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <div className="p-6 bg-white border border-gray-100 shadow-xl dark:bg-gray-800 rounded-2xl dark:border-gray-700">
          {activeTab === "profile" && <ProfileTab />}
          {activeTab === "addresses" && <AddressesTab />}
          {activeTab === "security" && <SecurityTab />}
          {activeTab === "preferences" && <PreferencesTab />}
        </div>
      </div>
    </div>
  );
}