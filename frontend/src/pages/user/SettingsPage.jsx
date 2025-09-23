import React, { useEffect, useMemo, useState, createContext, useContext } from "react";
import { toast } from "react-toastify";
import {
  User as UserIcon,
  Mail,
  Image as ImageIcon,
  MapPin,
  Plus,
  Trash2,
  Lock,
  Save,
  Bell,
  Palette,
} from "lucide-react";

// In-line contexts for single-file component
const UserContext = createContext(null);
const DarkModeContext = createContext(null);

const useUser = () => useContext(UserContext);
const useDarkMode = () => useContext(DarkModeContext);

// Mock data and API functions for single-file component
const mockUser = {
  fullName: "",
  username: "",
  email: "",
  avatar: "",
  addresses: [
    { id: "1", label: "Home", line1: "", line2: "", city: "", state: "", postalCode: "", country: "Philippines", isDefault: true },
    { id: "2", label: "Work", line1: "", line2: "", city: "", state: "", postalCode: "", country: "Philippines", isDefault: false },
  ],
  preferences: {
    newsletter: true,
  },
};

const mockApiRequest = async (path, options) => {
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
  // The previous mock check for a hardcoded password has been removed to allow testing.
  // In a real application, you would implement proper password validation here.
  return { user: mockUser };
};

export default function SettingsPage() {
  const { user, updateUser } = { user: mockUser, updateUser: () => {} }; // Using mock context
  const [darkMode, setDarkMode] = useState(false);
  const toggleDarkMode = () => setDarkMode(prev => !prev);

  // This useEffect hook is the fix for dark mode.
  // It checks the darkMode state and adds or removes the 'dark' class
  // on the document's root element (<html>).
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const [activeTab, setActiveTab] = useState("profile");

  const [profile, setProfile] = useState({
    fullName: "",
    username: "",
    email: "",
    avatar: "",
  });
  const [addresses, setAddresses] = useState([]);
  const [security, setSecurity] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [prefs, setPrefs] = useState({ newsletter: true });

  const [profilePassword, setProfilePassword] = useState("");
  const [addressesPassword, setAddressesPassword] = useState("");
  const [prefsPassword, setPrefsPassword] = useState("");

  const [activeAddressId, setActiveAddressId] = useState(null);

  useEffect(() => {
    if (user) {
      setProfile({
        fullName: user.fullName || "",
        username: user.username || "",
        email: user.email || "",
        avatar: user.avatar || "",
      });
      const userAddresses = Array.isArray(user.addresses) ? user.addresses : [];
      setAddresses(userAddresses);

      const defaultAddress = userAddresses.find(addr => addr.isDefault) || userAddresses[0];
      if (defaultAddress) {
        setActiveAddressId(defaultAddress.id);
      } else {
        setActiveAddressId(null);
      }

      setPrefs({
        newsletter: user.preferences?.newsletter ?? true,
      });
    }
  }, [user]);

  // A new useEffect to manage activeAddressId when addresses change
  useEffect(() => {
    if (addresses.length > 0 && !addresses.find(addr => addr.id === activeAddressId)) {
      setActiveAddressId(addresses[0].id);
    } else if (addresses.length === 0) {
      setActiveAddressId(null);
    }
  }, [addresses, activeAddressId]);


  const tabs = useMemo(
    () => [
      { key: "profile", label: "Profile", icon: <UserIcon className="w-4 h-4" /> },
      { key: "addresses", label: "Addresses", icon: <MapPin className="w-4 h-4" /> },
      { key: "security", label: "Security", icon: <Lock className="w-4 h-4" /> },
      { key: "preferences", label: "Preferences", icon: <Palette className="w-4 h-4" /> },
    ],
    []
  );

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfile((p) => ({ ...p, avatar: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    if (!profilePassword) {
      toast.error("Please enter your account password to save changes.");
      return;
    }
    if (!profile.fullName || !profile.username || !profile.email) {
      toast.error("Full name, username, and email are required.");
      return;
    }
    const prevUsername = user?.username || "";
    const usernameChanged = prevUsername !== profile.username;
    if (usernameChanged) {
      const lastChange = user?.lastUsernameChangeAt ? new Date(user.lastUsernameChangeAt) : null;
      if (lastChange) {
        const MS_PER_DAY = 24 * 60 * 60 * 1000;
        const daysSince = (Date.now() - lastChange.getTime()) / MS_PER_DAY;
        if (daysSince < 7) {
          const daysLeft = Math.ceil(7 - daysSince);
          toast.error(`You can change your username again in ${daysLeft} day(s).`);
          return;
        }
      }
    }

    try {
      const payload = {
        username: profile.username,
        avatar: profile.avatar,
        password: profilePassword,
      };
      const data = await mockApiRequest("/users/me/profile", {
        method: "PATCH",
        body: payload,
      });

      if (data?.user) {
        updateUser(data.user);
      } else {
        updateUser({
          fullName: user?.fullName || profile.fullName,
          username: profile.username,
          email: user?.email || profile.email,
          avatar: profile.avatar,
          ...(usernameChanged ? { lastUsernameChangeAt: new Date().toISOString() } : {}),
        });
      }
      setProfilePassword("");
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.message || "Failed to update profile");
    }
  };

  const addAddress = () => {
    const id = crypto.randomUUID?.() || String(Date.now());
    const newAddress = { id, label: "New Address", line1: "", line2: "", city: "", state: "", postalCode: "", country: "", isDefault: addresses.length === 0 };
    setAddresses((arr) => [...arr, newAddress]);
    setActiveAddressId(id);
  };

  const updateAddress = (id, field, value) => {
    setAddresses((arr) => arr.map((a) => (a.id === id ? { ...a, [field]: value } : a)));
  };

  const removeAddress = (id) => {
    const newAddresses = addresses.filter((a) => a.id !== id);
    setAddresses(newAddresses);
    if (newAddresses.length > 0) {
      // If the removed address was the active one, set the first one as active
      if (activeAddressId === id) {
        setActiveAddressId(newAddresses[0].id);
      }
      // If the default address was removed and another one exists, set the new first one as default
      const defaultExists = newAddresses.some(addr => addr.isDefault);
      if (!defaultExists) {
        setAddresses(newAddresses.map((a, i) => i === 0 ? { ...a, isDefault: true } : a));
      }
    } else {
      setActiveAddressId(null);
    }
  };

  const setDefaultAddress = (id) => {
    setAddresses((arr) => arr.map((a) => ({ ...a, isDefault: a.id === id })));
  };

  const saveAddresses = async () => {
    if (!addressesPassword) {
      toast.error("Please enter your account password to save changes.");
      return;
    }
    try {
      const data = await mockApiRequest("/users/me/addresses", {
        method: "PUT",
        body: { addresses, password: addressesPassword },
      });
      if (data?.user) {
        updateUser(data.user);
      } else {
        updateUser({ ...user, addresses });
      }
      setAddressesPassword("");
      toast.success("Addresses saved");
    } catch (err) {
      toast.error(err.message || "Failed to save addresses");
    }
  };

  const changePassword = async () => {
    if (!security.newPassword || security.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (security.newPassword !== security.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      await mockApiRequest("/auth/change-password", {
        method: "POST",
        body: {
          currentPassword: security.currentPassword,
          newPassword: security.newPassword,
        },
      });
      toast.success("Password changed");
      setSecurity({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err.message || "Failed to change password");
    }
  };

  const savePreferences = async () => {
    if (!prefsPassword) {
      toast.error("Please enter your account password to save changes.");
      return;
    }
    try {
      const data = await mockApiRequest("/users/me/preferences", {
        method: "PATCH",
        body: { preferences: prefs, password: prefsPassword },
      });
      if (data?.user) {
        updateUser(data.user);
      } else {
        updateUser({ preferences: prefs });
      }
      setPrefsPassword("");
      toast.success("Preferences saved");
    } catch (err) {
      toast.error(err.message || "Failed to save preferences");
    }
  };

  const defaultAvatar =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E";

  const activeAddress = useMemo(() => {
    return addresses.find(addr => addr.id === activeAddressId) || null;
  }, [addresses, activeAddressId]);


  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen pt-24 lg:pt-32 pb-10">
      <div className="container mx-auto max-w-5xl">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Account Settings</h1>

      <div className="flex space-x-2 overflow-x-auto no-scrollbar mb-6">
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

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-6">
        {activeTab === "profile" && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <img
                src={profile.avatar || defaultAvatar}
                alt="Avatar"
                className="w-20 h-20 rounded-full object-cover border border-gray-200 dark:border-gray-700"
              />
              <div>
                <label htmlFor="avatarUpload" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer">
                  <ImageIcon className="w-4 h-4" />
                  Change avatar
                </label>
                <input id="avatarUpload" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">PNG, JPG up to 2MB</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Full name">
                <input
                  value={profile.fullName}
                  onChange={() => {}}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder=""
                  readOnly
                  title="Full name changes are not available here. Contact support to update."
                />
              </Field>
              <Field label="Username">
                <input
                  value={profile.username}
                  onChange={(e) => setProfile((p) => ({ ...p, username: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder=""
                />
              </Field>
              <Field label="Email">
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="email"
                    value={profile.email}
                    onChange={() => {}}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    placeholder="you@example.com"
                    readOnly
                    title="Email changes are not available here. Contact support to update."
                  />
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Confirm password">
                <input
                  type="password"
                  value={profilePassword}
                  onChange={(e) => setProfilePassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="Enter your account password to confirm"
                />
              </Field>
            </div>

            <div className="flex justify-end">
              <button onClick={saveProfile} className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white">
                <Save className="w-4 h-4" /> Save changes
              </button>
            </div>
          </div>
        )}

        {activeTab === "addresses" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Addresses</h2>
              <button onClick={addAddress} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600">
                <Plus className="w-4 h-4" /> Add address
              </button>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4">
              <Field label="Saved Addresses">
                <select
                  className="w-full md:w-auto px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  value={activeAddressId === null ? "" : activeAddressId}
                  onChange={(e) => setActiveAddressId(e.target.value)}
                >
                  {addresses.length === 0 && (
                    <option disabled value="">
                      No addresses yet. Add one to speed up checkout.
                    </option>
                  )}
                  {addresses.map((addr) => (
                    <option key={addr.id} value={addr.id}>
                      {addr.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            {activeAddress && (
              <div className="space-y-4">
                <div key={activeAddress.id} className={`p-4 rounded-xl border ${activeAddress.isDefault ? "border-pink-500" : "border-gray-200 dark:border-gray-700"}`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Field label="Label">
                      <input value={activeAddress.label || ""} onChange={(e) => updateAddress(activeAddress.id, "label", e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" placeholder="Home / Office" />
                    </Field>
                    <Field label="Line 1">
                      <input value={activeAddress.line1 || ""} onChange={(e) => updateAddress(activeAddress.id, "line1", e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" placeholder="Street address" />
                    </Field>
                    <Field label="Line 2">
                      <input value={activeAddress.line2 || ""} onChange={(e) => updateAddress(activeAddress.id, "line2", e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" placeholder="Apartment, suite, etc." />
                    </Field>
                    <Field label="City">
                      <input value={activeAddress.city || ""} onChange={(e) => updateAddress(activeAddress.id, "city", e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
                    </Field>
                    <Field label="State / Province">
                      <input value={activeAddress.state || ""} onChange={(e) => updateAddress(activeAddress.id, "state", e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
                    </Field>
                    <Field label="Postal code">
                      <input value={activeAddress.postalCode || ""} onChange={(e) => updateAddress(activeAddress.id, "postalCode", e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
                    </Field>
                    <Field label="Country">
                      <input value={activeAddress.country || ""} onChange={(e) => updateAddress(activeAddress.id, "country", e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
                    </Field>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <div className="flex items-center gap-3">
                      <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                        <input type="radio" name="defaultAddress" checked={!!activeAddress.isDefault} onChange={() => setDefaultAddress(activeAddress.id)} />
                        Set as default
                      </label>
                    </div>
                    <button onClick={() => removeAddress(activeAddress.id)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300">
                      <Trash2 className="w-4 h-4" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <Field label="Confirm password">
                <input
                  type="password"
                  value={addressesPassword}
                  onChange={(e) => setAddressesPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="Enter your account password to confirm"
                />
              </Field>
            </div>
            <div className="flex justify-end">
              <button onClick={saveAddresses} className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white">
                <Save className="w-4 h-4" /> Save addresses
              </button>
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Current password">
                <input type="password" value={security.currentPassword} onChange={(e) => setSecurity((s) => ({ ...s, currentPassword: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
              </Field>
              <Field label="New password">
                <input type="password" value={security.newPassword} onChange={(e) => setSecurity((s) => ({ ...s, newPassword: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
              </Field>
              <Field label="Confirm new password">
                <input type="password" value={security.confirmPassword} onChange={(e) => setSecurity((s) => ({ ...s, confirmPassword: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
              </Field>
            </div>
            <div className="flex justify-end">
              <button onClick={changePassword} className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white">
                <Lock className="w-4 h-4" /> Change password
              </button>
            </div>
          </div>
        )}

        {activeTab === "preferences" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Theme</h3>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={darkMode} onChange={toggleDarkMode} />
                  <span className="text-gray-700 dark:text-gray-300">Enable dark mode</span>
                </label>
              </div>
              <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Notifications</h3>
                <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <input type="checkbox" checked={prefs.newsletter} onChange={(e) => setPrefs((p) => ({ ...p, newsletter: e.target.checked }))} />
                  <Bell className="w-4 h-4" /> Email newsletter
                </label>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <Field label="Confirm password">
                <input
                  type="password"
                  value={prefsPassword}
                  onChange={(e) => setPrefsPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="Enter your account password to confirm"
                />
              </Field>
            </div>
            <div className="flex justify-end">
              <button onClick={savePreferences} className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white">
                <Save className="w-4 h-4" /> Save preferences
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</span>
      {children}
    </label>
  );
}
