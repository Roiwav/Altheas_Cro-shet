import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { 
  Plus, Trash2, Save, MapPin, Home, Building, Navigation, 
  Map, Hash, Globe, Tag, Check, X, Edit2, CheckCircle, PlusCircle, ChevronDown, ChevronUp, 
  ChevronRight, ChevronLeft, Loader2, AlertCircle, Lock
} from "lucide-react";

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
    try {
      const id = crypto.randomUUID?.() || String(Date.now());
      const newAddress = {
        id,
        label: "Home",
        line1: "",
        line2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "Philippines",
        isDefault: addresses.length === 0,
      };
      
      // Add the new address and set it as active
      setAddresses(prev => [...prev, newAddress]);
      setActiveAddressId(id);
      setIsEditingAddress(true);
      
      // Log for debugging
      console.log('New address added:', { id, isEditing: true });
    } catch (error) {
      console.error('Error adding address:', error);
      toast.error('Failed to add new address');
    }
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

  // Group addresses by default first, then by label
  const sortedAddresses = useMemo(() => {
    if (!Array.isArray(addresses)) return [];
    return [...addresses].sort((a, b) => {
      if (!a || !b) return 0;
      if (a.isDefault) return -1;
      if (b.isDefault) return 1;
      return (a.label || '').localeCompare(b.label || '');
    });
  }, [addresses]);
  
  // Debug log for addresses
  useEffect(() => {
    console.log('Addresses updated:', addresses);
    console.log('Active address ID:', activeAddressId);
    console.log('Is editing:', isEditingAddress);
  }, [addresses, activeAddressId, isEditingAddress]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Addresses</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your saved addresses for faster checkout
          </p>
        </div>
        <button
          onClick={addAddress}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white transition-colors bg-pink-600 rounded-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Add New Address</span>
        </button>
      </div>

      {!isEditingAddress && addresses.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed rounded-xl border-gray-200 dark:border-gray-700">
          <MapPin className="w-12 h-12 mx-auto text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No addresses yet</h3>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Add your first address to get started
          </p>
          <button
            onClick={addAddress}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 mt-4 text-sm font-medium text-pink-600 transition-colors bg-pink-50 rounded-lg hover:bg-pink-100 dark:bg-pink-900/30 dark:text-pink-300 dark:hover:bg-pink-900/50"
          >
            <Plus className="w-4 h-4" />
            Add Address
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sortedAddresses.map((address) => (
            <div
              key={address.id}
              className={`relative p-5 transition-all border rounded-xl ${
                address.isDefault 
                  ? 'border-2 border-pink-500 bg-pink-50/50 dark:bg-pink-900/10' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-700'
              }`}
            >
              {address.isDefault && (
                <div className="absolute px-2 py-1 text-xs font-medium text-pink-700 bg-pink-100 rounded-full -top-2 -right-2 dark:bg-pink-900/80 dark:text-pink-200">
                  Default
                </div>
              )}
              
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 text-pink-600 rounded-full bg-pink-50 dark:bg-pink-900/30">
                    {address.label === 'Work' ? (
                      <Building className="w-5 h-5" />
                    ) : address.label === 'Other' ? (
                      <MapPin className="w-5 h-5" />
                    ) : (
                      <Home className="w-5 h-5" />
                    )}
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {address.label || 'Address'}
                  </h3>
                </div>
                
                {isEditingAddress && activeAddressId === address.id ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditingAddress(false)}
                      className="p-1.5 text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setActiveAddressId(address.id);
                        setIsEditingAddress(true);
                      }}
                      className="p-1.5 text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeAddress(address.id)}
                      className="p-1.5 text-red-400 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {isEditingAddress && activeAddressId === address.id ? (
                <div className="mt-4 space-y-4">
                  <Field label="Label" className="mb-3">
                    <div className="relative">
                      <Tag className="absolute w-4 h-4 text-gray-400 left-3 top-3" />
                      <select
                        value={address.label || 'Home'}
                        onChange={(e) => updateAddress(address.id, 'label', e.target.value)}
                        className="w-full py-2 pl-10 pr-3 text-gray-900 bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:text-white dark:border-gray-700"
                      >
                        <option value="Home">Home</option>
                        <option value="Work">Work</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </Field>

                  <Field label="Address Line 1">
                    <div className="relative">
                      <MapPin className="absolute w-4 h-4 text-gray-400 left-3 top-3" />
                      <input
                        type="text"
                        value={address.line1 || ''}
                        onChange={(e) => updateAddress(address.id, 'line1', e.target.value)}
                        className="w-full py-2 pl-10 pr-3 text-gray-900 bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:text-white dark:border-gray-700"
                        placeholder="House/Unit/Floor, Building, Street"
                      />
                    </div>
                  </Field>

                  <Field label="Address Line 2 (Optional)">
                    <div className="relative">
                      <Building className="absolute w-4 h-4 text-gray-400 left-3 top-3" />
                      <input
                        type="text"
                        value={address.line2 || ''}
                        onChange={(e) => updateAddress(address.id, 'line2', e.target.value)}
                        className="w-full py-2 pl-10 pr-3 text-gray-900 bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:text-white dark:border-gray-700"
                        placeholder="Apt, suite, unit, etc."
                      />
                    </div>
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="City">
                      <div className="relative">
                        <Map className="absolute w-4 h-4 text-gray-400 left-3 top-3" />
                        <select
                          value={address.city || ''}
                          onChange={(e) => handleCityChange(address.id, e.target.value)}
                          className="w-full py-2 pl-10 pr-3 text-gray-900 bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:text-white dark:border-gray-700"
                        >
                          <option value="" disabled>Select a city</option>
                          {cities.map((city) => (
                            <option key={city} value={city}>{city}</option>
                          ))}
                        </select>
                      </div>
                    </Field>

                    <Field label="State/Province">
                      <div className="relative">
                        <Navigation className="absolute w-4 h-4 text-gray-400 left-3 top-3" />
                        <input
                          type="text"
                          value={address.state || ''}
                          readOnly
                          className="w-full py-2 pl-10 pr-3 text-gray-500 bg-gray-100 border border-gray-200 rounded-lg cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
                        />
                      </div>
                    </Field>

                    <Field label="Postal Code">
                      <div className="relative">
                        <Hash className="absolute w-4 h-4 text-gray-400 left-3 top-3" />
                        <input
                          type="text"
                          value={address.postalCode || ''}
                          onChange={(e) => updateAddress(address.id, 'postalCode', e.target.value)}
                          className="w-full py-2 pl-10 pr-3 text-gray-900 bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:text-white dark:border-gray-700"
                          placeholder="e.g. 1000"
                        />
                      </div>
                    </Field>

                    <Field label="Country">
                      <div className="relative">
                        <Globe className="absolute w-4 h-4 text-gray-400 left-3 top-3" />
                        <select
                          value={address.country || 'Philippines'}
                          onChange={(e) => updateAddress(address.id, 'country', e.target.value)}
                          className="w-full py-2 pl-10 pr-3 text-gray-900 bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:text-white dark:border-gray-700"
                        >
                          <option value="Philippines">Philippines</option>
                          <option value="United States">United States</option>
                          <option value="Canada">Canada</option>
                          <option value="United Kingdom">United Kingdom</option>
                          <option value="Australia">Australia</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </Field>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer dark:text-gray-300">
                      <input
                        type="radio"
                        name={`default-${address.id}`}
                        checked={!!address.isDefault}
                        onChange={() => setDefaultAddress(address.id)}
                        className="w-4 h-4 text-pink-600 border-gray-300 focus:ring-pink-500 dark:focus:ring-pink-600 dark:border-gray-600"
                      />
                      <span>Set as default</span>
                    </label>
                  </div>

                  <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Confirm password to save changes
                    </h4>
                    <div className="relative">
                      <Lock className="absolute w-4 h-4 text-gray-400 left-3 top-3" />
                      <input
                        type="password"
                        value={addressesPassword}
                        onChange={(e) => setAddressesPassword(e.target.value)}
                        className="w-full py-2 pl-10 pr-3 text-gray-900 bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:text-white dark:border-gray-700"
                        placeholder="Enter your password"
                      />
                    </div>
                    <div className="flex justify-end mt-4">
                      <button
                        onClick={saveAddresses}
                        disabled={!addressesPassword}
                        className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg ${
                          addressesPassword 
                            ? 'bg-pink-600 hover:bg-pink-700' 
                            : 'bg-pink-400 cursor-not-allowed'
                        } focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900`}
                      >
                        <Save className="w-4 h-4" />
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  <p className="font-medium">{address.line1}</p>
                  {address.line2 && <p>{address.line2}</p>}
                  <p>
                    {[address.city, address.state, address.postalCode]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                  <p>{address.country}</p>
                  
                  {!address.isDefault && (
                    <button
                      onClick={() => setDefaultAddress(address.id)}
                      className="mt-2 text-sm font-medium text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300"
                    >
                      Set as default
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!isEditingAddress && addresses.length > 0 && (
        <div className="flex items-center justify-between p-4 mt-6 bg-gray-50 rounded-lg dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 text-pink-600 rounded-full bg-pink-50 dark:bg-pink-900/20">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Need to update an address?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Click the edit icon on any address to make changes
              </p>
            </div>
          </div>
          <button
            onClick={addAddress}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-pink-600 transition-colors bg-pink-50 rounded-lg hover:bg-pink-100 dark:bg-pink-900/30 dark:text-pink-300 dark:hover:bg-pink-900/50"
          >
            <Plus className="w-4 h-4" />
            Add New Address
          </button>
        </div>
      )}
    </div>
  );
}
