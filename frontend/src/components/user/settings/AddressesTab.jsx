import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Plus, Trash2, Save } from "lucide-react";

import Field from "../../common/Field.jsx";
import { cities, cityToRegionMap } from "../../../constants/locations.js";
import { useUser } from "../../../context/useUser.js";

export default function AddressesTab() {
  const { user, token, updateUser } = useUser();

  const [addresses, setAddresses] = useState([]);
  const [addressesPassword, setAddressesPassword] = useState("");
  const [activeAddressId, setActiveAddressId] = useState(null);
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  useEffect(() => {
    if (user) {
      let userAddresses = [];
      if (Array.isArray(user.addresses) && user.addresses.length > 0) {
        userAddresses = user.addresses.map((addr) => ({
          ...addr,
          id: addr._id || addr.id || crypto.randomUUID(),
        }));
      }
      setAddresses(userAddresses);
      const def = userAddresses.find((a) => a.isDefault) || userAddresses[0];
      setActiveAddressId(def ? def.id : null);
    } else {
      setAddresses([]);
      setActiveAddressId(null);
      setIsEditingAddress(false);
    }
  }, [user]);

  const addAddress = () => {
    const id = crypto.randomUUID?.() || String(Date.now());
    const newAddress = {
      id,
      label: "New Address",
      line1: "",
      line2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "Philippines",
      isDefault: addresses.length === 0,
    };
    setAddresses((arr) => [...arr, newAddress]);
    setActiveAddressId(id);
    setIsEditingAddress(true);
  };

  const updateAddress = (id, field, value) => {
    setAddresses((arr) => arr.map((a) => (a.id === id ? { ...a, [field]: value } : a)));
  };

  const handleCityChange = (addressId, newCity) => {
    const newRegion = cityToRegionMap[newCity] || "";
    setAddresses((arr) =>
      arr.map((a) => (a.id === addressId ? { ...a, city: newCity, state: newRegion } : a))
    );
  };

  const removeAddress = (id) => {
    let newAddresses = addresses.filter((a) => a.id !== id);

    if (newAddresses.length > 0) {
      if (activeAddressId === id) {
        setActiveAddressId(newAddresses[0].id);
        setIsEditingAddress(false);
      }

      const defaultExists = newAddresses.some((addr) => addr.isDefault);
      if (!defaultExists) {
        newAddresses = newAddresses.map((a, i) => (i === 0 ? { ...a, isDefault: true } : a));
      }
    } else {
      setActiveAddressId(null);
      setIsEditingAddress(false);
    }

    setAddresses(newAddresses);
    toast.info('Address removed. Click "Save addresses" to make it permanent.');
  };

  const setDefaultAddress = (id) => {
    setAddresses((arr) => arr.map((a) => ({ ...a, isDefault: a.id === id })));
  };

  const saveAddresses = async () => {
    if (!addressesPassword) {
      toast.error("Please enter your account password to save changes.");
      return;
    }

    for (const addr of addresses) {
      if (!addr.label || !addr.line1 || !addr.city || !addr.state || !addr.postalCode || !addr.country) {
        toast.error(`Please fill all required fields for address: "${addr.label || 'New Address'}"`);
        setActiveAddressId(addr.id);
        return;
      }
    }

    if (!user?.id || !token) {
      toast.error("You must be logged in to save changes.");
      return;
    }

    try {
      const res = await fetch(`http://localhost:5001/api/v1/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ addresses, password: addressesPassword }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to save addresses");
      }

      const data = await res.json();
      updateUser(data.user);

      setAddressesPassword("");
      setIsEditingAddress(false);
      toast.success("Addresses saved successfully");
    } catch (err) {
      console.error("Save addresses error:", err);
      toast.error(err.message || "Failed to save addresses");
    }
  };

  const activeAddress = useMemo(() => {
    return addresses.find((addr) => addr.id === activeAddressId) || null;
  }, [addresses, activeAddressId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Addresses</h2>
        <button
          onClick={addAddress}
          className="inline-flex items-center gap-2 px-4 py-2 text-gray-800 bg-gray-100 rounded-xl dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          <Plus className="w-4 h-4" /> Add address
        </button>
      </div>

      <div className="flex flex-col items-center gap-4 md:flex-row">
        <Field label="Saved Addresses">
          <select
            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-200 md:w-64 rounded-xl dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            value={activeAddressId === null ? "" : activeAddressId}
            onChange={(e) => {
              setActiveAddressId(e.target.value);
              setIsEditingAddress(false);
            }}
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
        {activeAddress && !isEditingAddress && (
          <button onClick={() => setIsEditingAddress(true)} className="text-sm font-medium text-pink-600 dark:text-pink-400 hover:underline">
            Edit
          </button>
        )}
      </div>

      {activeAddress && isEditingAddress && (
        <div className="space-y-4">
          <div
            key={activeAddress.id}
            className={`p-4 rounded-xl border ${activeAddress.isDefault ? "border-pink-500" : "border-gray-200 dark:border-gray-700"}`}
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Label">
                <input
                  value={activeAddress.label || ""}
                  onChange={(e) => updateAddress(activeAddress.id, "label", e.target.value)}
                  className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-200 rounded-xl dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  placeholder="Home / Office"
                />
              </Field>
              <Field label="Line 1">
                <input
                  value={activeAddress.line1 || ""}
                  onChange={(e) => updateAddress(activeAddress.id, "line1", e.target.value)}
                  className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-200 rounded-xl dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  placeholder="Street address"
                />
              </Field>
              <Field label="Line 2">
                <input
                  value={activeAddress.line2 || ""}
                  onChange={(e) => updateAddress(activeAddress.id, "line2", e.target.value)}
                  className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-200 rounded-xl dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  placeholder="Apartment, Barangay"
                />
              </Field>
              <Field label="City">
                <select
                  value={activeAddress.city || ""}
                  onChange={(e) => handleCityChange(activeAddress.id, e.target.value)}
                  className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-200 rounded-xl dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                >
                  <option value="" disabled>
                    Select a city
                  </option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="State / Province">
                <input
                  value={activeAddress.state || ""}
                  readOnly
                  className="w-full px-3 py-2 text-gray-500 bg-gray-100 border border-gray-200 cursor-not-allowed rounded-xl dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                />
              </Field>
              <Field label="Postal code">
                <input
                  value={activeAddress.postalCode || ""}
                  onChange={(e) => updateAddress(activeAddress.id, "postalCode", e.target.value)}
                  className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-200 rounded-xl dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </Field>
              <Field label="Country">
                <input
                  value={activeAddress.country || ""}
                  onChange={(e) => updateAddress(activeAddress.id, "country", e.target.value)}
                  className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-200 rounded-xl dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </Field>
            </div>
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer dark:text-gray-300">
                  <input
                    type="radio"
                    name="defaultAddress"
                    checked={!!activeAddress.isDefault}
                    onChange={() => setDefaultAddress(activeAddress.id)}
                  />
                  Set as default
                </label>
              </div>
              <button
                onClick={() => removeAddress(activeAddress.id)}
                className="inline-flex items-center gap-2 px-3 py-2 text-red-600 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300"
              >
                <Trash2 className="w-4 h-4" /> Remove
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 mt-2 md:grid-cols-2">
        <Field label="Confirm password">
          <input
            type="password"
            value={addressesPassword}
            onChange={(e) => setAddressesPassword(e.target.value)}
            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-200 rounded-xl dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            placeholder="Enter your account password to confirm"
          />
        </Field>
      </div>
      <div className="flex justify-end">
        <button onClick={saveAddresses} className="inline-flex items-center gap-2 px-5 py-2 text-white bg-pink-600 rounded-xl hover:bg-pink-700">
          <Save className="w-4 h-4" /> Save addresses
        </button>
      </div>
    </div>
  );
}
