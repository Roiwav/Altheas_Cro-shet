import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { 
  Plus, Trash2, Save, MapPin, Home, Building, Navigation, 
  Map, Hash, Globe, Tag, X, Edit2, PlusCircle, Lock
} from "lucide-react";
import Field from "../../common/Field.jsx";
import { useUser } from "../../../context/useUser.js";
import axios from "axios"; // Use axios instead of fetch to match your UserContext

// Shipping cities/regions list
const regions = {
  "Inside Laguna": ["Los Baños", "Cabuyao", "San Pablo", "Biñan", "Sta. Rosa", "Calamba"],
  "Outside Laguna": ["Cavite", "Batangas", "Rizal"],
  "Metro Manila": ["Manila", "Quezon City", "Pasig", "Makati", "Taguig", "Mandaluyong", "Pasay"],
  "Rest of Luzon": ["Baguio", "Dagupan", "La Union", "Tarlac", "Pampanga", "Bulacan", "Nueva Ecija"],
  "Visayas/Mindanao": ["Cebu City", "Iloilo City", "Davao City", "Cagayan de Oro", "Zamboanga", "Tacloban"]
};
const cities = Object.values(regions).flat();
const cityToRegionMap = {};
Object.entries(regions).forEach(([region, arr]) => arr.forEach(c => { cityToRegionMap[c] = region; }));

// Improved UUID generation function that works across all browsers
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback UUID generation for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export default function AddressesTab({ onSelectAddress, isSelectMode = false }) {
  /**
   * A tab component for managing user shipping addresses.
   * It allows adding, editing, deleting, and setting a default address.
   * @param {object} props - The component props.
   * @param {function} [props.onSelectAddress] - Callback when an address is selected (in select mode).
   * @param {boolean} [props.isSelectMode=false] - Enables a selection mode, often used in a checkout process.
   */
  const { user, token, updateUser } = useUser();
  const [addresses, setAddresses] = useState([]);
  const [addressesPassword, setAddressesPassword] = useState("");
  const [activeAddressId, setActiveAddressId] = useState(null);
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  useEffect(() => {
    console.log('AddressesTab useEffect triggered, user:', user);

    if (user) {
      let userAddresses = [];

      try {
        if (Array.isArray(user.addresses) && user.addresses.length > 0) {
          console.log('Processing user addresses:', user.addresses);

          userAddresses = user.addresses.map((addr, index) => {
            // Ensure each address has a valid ID
            const addressId = addr._id || addr.id || generateId();

            const processedAddress = {
              ...addr,
              id: addressId,
              // Ensure all required fields have default values
              label: addr.label || '',
              line1: addr.line1 || '',
              line2: addr.line2 || '',
              city: addr.city || '',  
              state: addr.state || '',
              postalCode: addr.postalCode || '',
              country: addr.country || 'Philippines',
              isDefault: addr.isDefault || false
            };

            console.log(`Processed address ${index}:`, processedAddress);
            return processedAddress;
          });

          // Ensure at least one address is default if none is set
          const hasDefault = userAddresses.some(addr => addr.isDefault);
          if (!hasDefault && userAddresses.length > 0) {
            userAddresses[0].isDefault = true;
            console.log('Set first address as default');
          }
        } else {
          console.log('No addresses found in user object');
        }

        console.log('Final userAddresses:', userAddresses);
        setAddresses(userAddresses);

        // Set active address
        const defaultAddress = userAddresses.find((a) => a.isDefault) || userAddresses[0];
        const newActiveId = defaultAddress ? defaultAddress.id : null;
        console.log('Setting active address ID:', newActiveId);
        setActiveAddressId(newActiveId);

      } catch (error) {
        console.error('Error processing user addresses:', error);
        setAddresses([]);
        setActiveAddressId(null);
      }
    } else {
      console.log('No user found, clearing addresses');
      setAddresses([]);
      setActiveAddressId(null);
      setIsEditingAddress(false);
    }
  }, [user]);

  // Debug log when addresses state changes
  useEffect(() => {
    console.log('Addresses state updated:', addresses);
  }, [addresses]);

  /**
   * Adds a new, empty address object to the state to be edited.
   */
  const addAddress = () => {
    try {
      console.log('Adding new address...');
      const id = generateId();
      const newAddress = {
        id,
        label: "",
        line1: "",
        line2: "", 
        city: "",
        state: "",
        postalCode: "",
        country: "Philippines",
        isDefault: addresses.length === 0, // First address is default
      };

      console.log('New address created:', newAddress);

      setAddresses(prev => {
        const updated = [...prev, newAddress];
        console.log('Updated addresses array:', updated);
        return updated;
      });

      setActiveAddressId(id);
      setIsEditingAddress(true);

      console.log('Set active address ID to:', id);
      console.log('Set editing mode to true');

    } catch (error) {
      console.error('Error adding address:', error);
      toast.error('Failed to add new address');
    }
  };

  /**
   * Updates a specific field of an address in the local state.
   * @param {string} id - The ID of the address to update.
   * @param {string} field - The field to update (e.g., 'line1', 'city').
   * @param {string} value - The new value for the field.
   */
  const updateAddress = (id, field, value) => {
    console.log(`Updating address ${id}, field: ${field}, value: ${value}`);

    setAddresses((arr) => {
      const updated = arr.map((a) => {
        if (a.id === id) {
          const updatedAddress = { ...a, [field]: value };
          console.log('Address updated:', updatedAddress);
          return updatedAddress;
        }
        return a;
      });
      console.log('All addresses after update:', updated);
      return updated;
    });
  };

  /**
   * Handles changes to the city dropdown, automatically updating the state/province.
   * @param {string} addressId - The ID of the address being changed.
   * @param {string} newCity - The new city selected.
   */
  const handleCityChange = (addressId, newCity) => {
    const newRegion = cityToRegionMap[newCity] || "";
    console.log(`City change for address ${addressId}: ${newCity} -> region: ${newRegion}`);

    setAddresses((arr) =>
      arr.map((a) => (a.id === addressId ? { ...a, city: newCity, state: newRegion } : a))
    );
  };

  /**
   * UPDATED: Immediately removes address and saves to database
   * No longer shows "Click Save addresses" toast - deletion is immediate
   */
  const removeAddress = async (id) => {
    if (!user?.id || !token) {
      toast.error("You must be logged in to delete addresses.");
      return;
    }

    try {
      console.log('Immediately removing address:', id);

      // Find the address being removed for confirmation
      const addressToRemove = addresses.find(a => a.id === id);
      if (!addressToRemove) {
        toast.error("Address not found.");
        return;
      }

      // Remove from local state first (optimistic update)
      let newAddresses = addresses.filter((a) => a.id !== id);

      // Handle active address and default logic
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

      // Update local state immediately
      setAddresses(newAddresses);

      // Save to database immediately
      console.log('Saving updated addresses to backend:', newAddresses);

      const response = await axios.patch(`/users/${user.id}`, {
        addresses: newAddresses,
        password: user.tempPassword || "" // You might need to handle password requirement
      });

      console.log('Address deletion save response:', response.data);

      if (response.data?.user) {
        updateUser(response.data.user);
        toast.success(`Address "${addressToRemove.label || 'Address'}" deleted successfully!`);
      } else {
        throw new Error("Invalid response from server");
      }

    } catch (error) {
      console.error('Error deleting address:', error);

      // Revert local state on error
      setAddresses(addresses);

      let errorMessage = "Failed to delete address";
      if (error.response?.status === 401) {
        errorMessage = "Authentication failed. Please log in again.";
      } else if (error.response?.status === 403) {
        errorMessage = "Password required. Please edit and save manually to delete this address.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast.error(errorMessage);
    }
  };

  /**
   * Sets a specific address as the default address.
   * @param {string} id - The ID of the address to set as default.
   */
  const setDefaultAddress = (id) => {
    console.log('Setting default address:', id);
    setAddresses((arr) => arr.map((a) => ({ ...a, isDefault: a.id === id })));
  };

  /**
   * Validates and saves all current addresses to the backend.
   */
  const saveAddresses = async () => {
    if (!addressesPassword) {
      toast.error("Please enter your account password to save changes.");
      return;
    }

    let foundMissing = false;
    for (const addr of addresses) {
      const missing = [];
      if (!addr.label) missing.push("Label");
      if (!addr.line1) missing.push("Address Line 1");
      if (!addr.city) missing.push("City");
      if (!addr.state) missing.push("State/Province");
      if (!addr.postalCode) missing.push("Postal Code");
      if (!addr.country) missing.push("Country");
      if (!cities.includes(addr.city)) missing.push("Valid City");

      if (missing.length > 0) {
        foundMissing = true;
        toast.error(
          `Please complete all required fields for address "${addr.label || 'New Address'}": ${missing.join(", ")}`
        );
        setActiveAddressId(addr.id);

        setTimeout(() => {
          const selectorMap = {
            "Label": "input[name='label']",
            "Address Line 1": "input[name='line1']",
            "City": "select[name='city']",
            "State/Province": "input[name='state']",
            "Postal Code": "input[name='postalCode']",
            "Country": "select[name='country']",
          };
          const first = missing[0];
          if (first && document.querySelector(selectorMap[first])) {
            document.querySelector(selectorMap[first]).focus();
          }
        }, 100);

        break;
      }
    }
    if (foundMissing) return;

    if (!user?.id || !token) {
      toast.error("You must be logged in to save changes.");
      return;
    }

    try {
      console.log('Saving addresses to backend:', addresses);

      // Use axios instead of fetch to match your UserContext setup
      const response = await axios.patch(`/users/${user.id}`, {
        addresses,
        password: addressesPassword
      });

      console.log('Save response:', response.data);

      if (response.data?.user) {
        updateUser(response.data.user);
        setAddressesPassword("");
        setIsEditingAddress(false);
        toast.success("Addresses saved successfully");
      } else {
        throw new Error("Invalid response from server");
      }

    } catch (err) {
      console.error("Save addresses error:", err);

      let errorMessage = "Failed to save addresses";
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 401) {
        errorMessage = "Authentication failed. Please log in again.";
      } else if (err.response?.status === 403) {
        errorMessage = "Invalid password. Please try again.";
      }

      toast.error(errorMessage);
    }
  };

  /**
   * Memoized and sorted list of addresses, with the default address always first.
   */
  const sortedAddresses = useMemo(() => {
    if (!Array.isArray(addresses)) {
      console.log('Addresses is not an array:', addresses);
      return [];
    }

    const sorted = [...addresses].sort((a, b) => {
      if (!a || !b) return 0;
      if (a.isDefault) return -1;
      if (b.isDefault) return 1;
      return (a.label || '').localeCompare(b.label || '');
    });

    console.log('Sorted addresses:', sorted);
    return sorted;
  }, [addresses]);

  // Debug render
  console.log('Rendering AddressesTab with:', {
    addresses,
    sortedAddresses,
    activeAddressId,  
    isEditingAddress,
    user: user ? { id: user.id, addresses: user.addresses } : null
  });

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
        <div className="p-8 text-center border-2 border-gray-200 border-dashed rounded-xl dark:border-gray-700">
          <MapPin className="w-12 h-12 mx-auto text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No addresses yet</h3>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Add your first address to get started
          </p>
          <button
            onClick={addAddress}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 mt-4 text-sm font-medium text-pink-600 transition-colors rounded-lg bg-pink-50 hover:bg-pink-100 dark:bg-pink-900/30 dark:text-pink-300 dark:hover:bg-pink-900/50"
          >
            <Plus className="w-4 h-4" />
            Add Address
          </button>
        </div>
      ) : (
        <div className="grid items-start gap-4 md:grid-cols-2">
          {sortedAddresses.map((address) => {
            const isEditingThis = isEditingAddress && activeAddressId === address.id;

            console.log(`Rendering address ${address.id}:`, { address, isEditingThis, activeAddressId });

            return (
              <div
                key={address.id}
                onClick={() => isSelectMode && !isEditingThis && onSelectAddress(address)}
                className={`relative p-5 transition-all border rounded-xl ${
                  address.isDefault 
                    ? 'border-2 border-pink-500 bg-pink-50/50 dark:bg-pink-900/10' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-700'
                } ${
                  isSelectMode ? 'cursor-pointer hover:shadow-lg' : ''
                }`}
                style={{ height: "auto" }}
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

                  {isEditingThis ? (
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
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent any parent click events
                          removeAddress(address.id);
                        }}
                        className="p-1.5 text-red-400 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30"
                        title="Delete Address Immediately"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {isEditingThis ? (
                  <div className="mt-4 space-y-4">
                    {/* Editable/free label here */}
                    <Field label="Label (e.g. Home, Work, Grandma's...)">
                      <div className="relative">
                        <Tag className="absolute w-4 h-4 text-gray-400 left-3 top-3" />
                        <input
                          name="label"
                          type="text"
                          value={address.label || ''}
                          onChange={(e) => updateAddress(address.id, 'label', e.target.value)}
                          className="w-full py-2 pl-10 pr-3 text-gray-900 bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:text-white dark:border-gray-700"
                          placeholder="Home, Work, Other..."
                          list={`address-label-suggestions-${address.id}`}
                          required
                        />
                        <datalist id={`address-label-suggestions-${address.id}`}>
                          <option value="Home"/>
                          <option value="Work"/>
                          <option value="Other"/>
                        </datalist>
                      </div>
                    </Field>

                    <Field label="Address Line 1">
                      <div className="relative">
                        <MapPin className="absolute w-4 h-4 text-gray-400 left-3 top-3" />
                        <input
                          name="line1"
                          type="text"
                          value={address.line1 || ''}
                          onChange={(e) => updateAddress(address.id, 'line1', e.target.value)}
                          className="w-full py-2 pl-10 pr-3 text-gray-900 bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:text-white dark:border-gray-700"
                          placeholder="House/Unit/Floor, Building, Street"
                          required
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
                            name="city"
                            value={address.city || ''}
                            onChange={(e) => handleCityChange(address.id, e.target.value)}
                            className="w-full py-2 pl-10 pr-3 text-gray-900 bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:text-white dark:border-gray-700"
                            required
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
                            name="state"
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
                            name="postalCode"
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
                            name="country"
                            value={address.country || 'Philippines'}
                            onChange={(e) => updateAddress(address.id, 'country', e.target.value)}
                            className="w-full py-2 pl-10 pr-3 text-gray-900 bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:text-white dark:border-gray-700"
                          >
                            <option value="Philippines">Philippines</option>
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
            );
          })}
        </div>
      )}

      {!isEditingAddress && addresses.length > 0 && !isSelectMode && (
        <div className="flex items-center justify-between p-4 mt-6 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 text-pink-600 rounded-full bg-pink-50 dark:bg-pink-900/20">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Need to update an address?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Click the edit icon on any address to make changes and set a default address.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}