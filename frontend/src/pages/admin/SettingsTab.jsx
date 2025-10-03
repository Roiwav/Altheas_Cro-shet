import React, { useState } from 'react';
import { Switch } from '@headlessui/react';
import { toast } from 'react-toastify';
import { SettingsContext } from '../../context/SettingsContext.jsx';
import { Trash2, ChevronDown, Plus } from 'lucide-react';

const SettingsTab = ({ isDarkMode }) => {
  const { settings, updateSettings } = React.useContext(SettingsContext);

  const ToggleSwitch = ({ enabled, onChange, label, description }) => (
    <div className="flex items-start space-x-4">
      <div className="flex-1">
        <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
          {label}
        </div>
        {description && (
          <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {description}
          </p>
        )}
      </div>
      <Switch
        className={`${enabled ? 'bg-pink-600' : 'bg-gray-200 dark:bg-gray-600'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2`}
        checked={enabled}
        onChange={onChange}
      >
        <span className="sr-only">Toggle {label}</span>
        <span
          className={`${enabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
          aria-hidden="true"
        />
      </Switch>
    </div>
  );

  const handleToggle = (key) => {
    const updatedSettings = { ...settings, [key]: !settings[key] };
    updateSettings(updatedSettings);
    toast.info(`Setting updated.`);
  };

  const [expandedZone, setExpandedZone] = useState(null);
  const [editingCities, setEditingCities] = useState(null);
  const [citiesInput, setCitiesInput] = useState('');
  const [editingZone, setEditingZone] = useState(null);
  const [zoneBackup, setZoneBackup] = useState(null);

  const toggleZone = (zoneId) => {
    if (editingZone && editingZone.id === zoneId) {
      return;
    }

    if (editingZone) {
      if (window.confirm('You have unsaved changes. Are you sure you want to discard them?')) {
        setEditingZone(null);
        setZoneBackup(null);
        setExpandedZone(expandedZone === zoneId ? null : zoneId);
      }
    } else {
      setExpandedZone(expandedZone === zoneId ? null : zoneId);
    }
  };

  const updateZoneMethod = (zoneId, methodId, field, value) => {
    const updatedZones = settings.shippingZones.map(zone => {
      if (zone.id === zoneId) {
        const updatedMethods = zone.methods.map(method =>
          method.id === methodId ? { ...method, [field]: value } : method
        );
        return { ...zone, methods: updatedMethods };
      }
      return zone;
    });
    updateSettings({ ...settings, shippingZones: updatedZones });
    toast.success(`Updated ${field} for shipping method`);
  };

  const updateZone = (zoneId, field, value) => {
    const updatedZones = settings.shippingZones.map(zone =>
      zone.id === zoneId ? { ...zone, [field]: value } : zone
    );

    updateSettings({ ...settings, shippingZones: updatedZones });

    if (editingZone?.id === zoneId) {
      setEditingZone(prev => ({
        ...prev,
        [field]: value
      }));
    }

    if (field !== 'name' || !editingZone) {
      toast.success('Zone updated successfully');
    }
  };

  const toggleZoneStatus = (zoneId) => {
    const zone = settings.shippingZones.find(z => z.id === zoneId);
    const newStatus = !zone.isActive;
    const updatedZones = settings.shippingZones.map(zone =>
      zone.id === zoneId ? { ...zone, isActive: newStatus } : zone
    );
    updateSettings({ ...settings, shippingZones: updatedZones });
    toast.success(`Shipping zone ${newStatus ? 'enabled' : 'disabled'} successfully`);
  };

  const toggleMethodStatus = (zoneId, methodId) => {
    const updatedZones = settings.shippingZones.map(zone => {
      if (zone.id === zoneId) {
        const updatedMethods = zone.methods.map(method => {
          if (method.id === methodId) {
            return { ...method, isActive: !method.isActive };
          }
          return method;
        });
        return { ...zone, methods: updatedMethods };
      }
      return zone;
    });
    updateSettings({ ...settings, shippingZones: updatedZones });
    const method = updatedZones
      .find(z => z.id === zoneId)?.methods
      .find(m => m.id === methodId);
    if (method) {
      toast.success(`Shipping method "${method.name}" ${method.isActive ? 'enabled' : 'disabled'}`);
    }
  };

  const startEditingZone = (zone) => {
    setZoneBackup(JSON.parse(JSON.stringify(zone)));
    setEditingZone(zone);
  };

  const cancelEditingZone = (zoneId) => {
    if (zoneBackup) {
      const updatedZones = settings.shippingZones.map(zone =>
        zone.id === zoneId ? { ...zoneBackup } : zone
      );
      updateSettings({ ...settings, shippingZones: updatedZones });
      setZoneBackup(null);
      setEditingZone(null);
      toast.info('Changes discarded');
    }
  };

  const saveZoneChanges = (zoneId) => {
    setZoneBackup(null);
    setEditingZone(null);
    toast.success('Zone updated successfully');
  };

  const deleteZone = (zoneId) => {
    if (window.confirm('Are you sure you want to delete this shipping zone? This action cannot be undone.')) {
      const updatedZones = settings.shippingZones.filter(zone => zone.id !== zoneId);
      updateSettings({ ...settings, shippingZones: updatedZones });
      toast.success('Shipping zone deleted successfully');

      if (expandedZone === zoneId) {
        setExpandedZone(null);
      }

      if (editingZone?.id === zoneId) {
        setEditingZone(null);
        setZoneBackup(null);
      }
    }
  };

  const handleAddShippingZone = () => {
    const newZone = {
      id: `zone-${Date.now()}`,
      name: 'New Shipping Zone',
      cities: [],
      methods: [
        { id: 'standard', name: 'Standard Delivery', price: 0, description: 'Standard delivery time', isActive: true },
        { id: 'express', name: 'Express Delivery', price: 0, description: 'Faster delivery option', isActive: true }
      ],
      freeShippingThreshold: 0,
      isActive: true
    };

    const currentZones = Array.isArray(settings.shippingZones) ? settings.shippingZones : [];

    updateSettings({
      ...settings,
      shippingZones: [...currentZones, newZone]
    });

    setExpandedZone(newZone.id);
    toast.info('New shipping zone added. Please configure the details.');
  };

  const inputClasses = `block w-full rounded-md border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300 text-gray-900 placeholder-gray-500'} focus:ring-pink-500 focus:border-pink-500 sm:text-sm p-2`;
  const sectionClasses = `rounded-xl ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border shadow-sm overflow-hidden transition-all duration-200`;
  const sectionHeaderClasses = `px-6 py-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`;
  const sectionBodyClasses = 'p-6 space-y-6';
  const cardClasses = `p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'} border`;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>System Settings</h2>
          <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Manage your store's configuration and preferences. Changes are saved automatically.
          </p>
        </div>
      </div>

      <div className={sectionClasses}>
        <div className={sectionHeaderClasses}>
          <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Site Configuration</h3>
          <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Control your store's global settings
          </p>
        </div>
        <div className={sectionBodyClasses}>
          <div className={`${cardClasses} space-y-6`}>
            <ToggleSwitch
              enabled={settings.maintenanceMode}
              onChange={() => handleToggle('maintenanceMode')}
              label="Maintenance Mode"
              description="When enabled, only administrators can access the store"
            />
            <div className="my-2 border-t border-gray-200 dark:border-gray-600"></div>
            <ToggleSwitch
              enabled={settings.registration}
              onChange={() => handleToggle('registration')}
              label="User Registration"
              description="Allow new customers to create accounts"
            />
          </div>
        </div>
      </div>

      <div className={sectionClasses}>
        <div className={sectionHeaderClasses}>
          <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Payment Methods</h3>
          <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Configure available payment options for your customers
          </p>
        </div>
        <div className={sectionBodyClasses}>
          <div className={`${cardClasses} space-y-6`}>
            <ToggleSwitch
              enabled={settings.gcashPayment}
              onChange={() => handleToggle('gcashPayment')}
              label="GCash Payment"
              description="Enable GCash as a payment option at checkout"
            />
          </div>
        </div>
      </div>

      <div className={sectionClasses}>
        <div className={sectionHeaderClasses}>
          <div>
            <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Shipping Zones</h3>
            <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Configure shipping rates and methods for different locations
            </p>
          </div>
        </div>
        <div className={sectionBodyClasses}>
          <div className="space-y-4">
            {settings.shippingZones?.map((zone) => (
              <div key={zone.id} className={`${cardClasses} overflow-hidden`}>
                <div
                  className={`p-4 cursor-pointer flex justify-between items-center ${expandedZone === zone.id ? 'border-b' : ''} ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                  onClick={() => toggleZone(zone.id)}
                >
                  <div className="flex items-center">
                    <Switch
                      checked={zone.isActive}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleZoneStatus(zone.id);
                      }}
                      className={`${zone.isActive ? 'bg-pink-600' : 'bg-gray-200 dark:bg-gray-600'} relative inline-flex h-6 w-11 items-center rounded-full`}
                    >
                      <span className="sr-only">Enable</span>
                      <span
                        className={`${zone.isActive ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition`}
                      />
                    </Switch>
                    {editingZone?.id === zone.id ? (
                      <input
                        type="text"
                        value={editingZone.name}
                        onChange={(e) => setEditingZone({ ...editingZone, name: e.target.value })}
                        onClick={(e) => e.stopPropagation()}
                        className={`ml-3 bg-transparent border-b ${isDarkMode ? 'text-white border-gray-500' : 'text-gray-900 border-gray-300'} focus:outline-none focus:border-pink-500`}
                        autoFocus
                      />
                    ) : (
                      <h4
                        className={`ml-3 font-medium ${zone.isActive ? (isDarkMode ? 'text-white' : 'text-gray-900') : (isDarkMode ? 'text-gray-500' : 'text-gray-400')} cursor-text`}
                        onDoubleClick={() => startEditingZone(zone)}
                      >
                        {zone.name}
                      </h4>
                    )}
                  </div>
                  <div className="flex items-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${zone.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'}`}>
                      {zone.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <ChevronDown
                      className={`ml-2 h-5 w-5 transition-transform duration-200 ${expandedZone === zone.id ? 'transform rotate-180' : ''} ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                      aria-hidden="true"
                    />
                  </div>
                </div>

                {expandedZone === zone.id && (
                  <div className="p-4 pt-2">
                    <div className="mb-4">
                      <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Zone Name
                      </label>
                      <input
                        type="text"
                        value={zone.name}
                        onChange={(e) => updateZone(zone.id, 'name', e.target.value)}
                        className={inputClasses}
                        placeholder="e.g. Metro Manila"
                      />
                    </div>

                    <div className="mb-4">
                      <h5 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Cities Covered
                      </h5>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {zone.cities.slice(0, 5).map((city, idx) => (
                          <span
                            key={idx}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'}`}
                          >
                            {city}
                          </span>
                        ))}
                        {zone.cities.length > 5 && (
                          <span className="self-center text-xs text-gray-500">
                            +{zone.cities.length - 5} more
                          </span>
                        )}
                      </div>
                      {editingCities === zone.id ? (
                        <div className="mt-2">
                          <textarea
                            value={citiesInput}
                            onChange={(e) => setCitiesInput(e.target.value)}
                            className="w-full p-2 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600"
                            rows="3"
                            placeholder="Enter cities, separated by commas"
                          />
                          <div className="flex justify-end mt-2 space-x-2">
                            <button
                              onClick={() => setEditingCities(null)}
                              className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => {
                                try {
                                  const updatedZones = settings.shippingZones.map(z => {
                                    if (z.id === zone.id) {
                                      const newCities = citiesInput
                                        .split(',')
                                        .map(city => city.trim())
                                        .filter(city => city.length > 0);
                                      return { ...z, cities: newCities };
                                    }
                                    return z;
                                  });
                                  updateSettings({ ...settings, shippingZones: updatedZones });
                                  toast.success('Cities updated successfully');
                                  setEditingCities(null);
                                } catch (error) {
                                  console.error('Error updating cities:', error);
                                  toast.error('Failed to update cities. Please try again.');
                                }
                              }}
                              className="px-2 py-1 text-xs text-white bg-pink-600 rounded-md hover:bg-pink-700"
                            >
                              Save Cities
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCities(zone.id);
                            setCitiesInput(zone.cities.join(', '));
                          }}
                          className="text-xs text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300"
                        >
                          Edit cities
                        </button>
                      )}
                    </div>

                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Shipping Methods
                        </h5>
                      </div>
                      <div className="space-y-3">
                        {zone.methods.map((method) => (
                          <div key={method.id} className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-white border-gray-200'}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <Switch
                                  checked={method.isActive}
                                  onChange={() => toggleMethodStatus(zone.id, method.id)}
                                  className={`${method.isActive ? 'bg-pink-600' : 'bg-gray-200 dark:bg-gray-600'} relative inline-flex h-5 w-9 items-center rounded-full`}
                                >
                                  <span className="sr-only">Enable</span>
                                  <span className={`${method.isActive ? 'translate-x-5' : 'translate-x-1'} inline-block h-3 w-3 transform rounded-full bg-white transition`} />
                                </Switch>
                                <div className="ml-3">
                                  <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{method.name}</span>
                                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{method.description}</p>
                                </div>
                              </div>
                              <div className="flex items-center">
                                {method.price > 0 ? (
                                  <div className="relative rounded-md shadow-sm w-28">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><span className="text-gray-500 sm:text-sm">₱</span></div>
                                    <input type="number" value={method.price} onChange={(e) => updateZoneMethod(zone.id, method.id, 'price', parseFloat(e.target.value) || 0)} className="block w-full rounded-md border-0 py-1.5 pl-7 pr-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-pink-600 sm:text-sm sm:leading-6" min="0" step="1" disabled={!method.isActive} />
                                  </div>
                                ) : (
                                  <span className="text-sm font-medium text-green-600 dark:text-green-400">FREE</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 mt-6 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Free Shipping</h5>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Minimum order amount for free shipping</p>
                        </div>
                        <div className="relative w-32 rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><span className="text-gray-500 sm:text-sm">₱</span></div>
                          <input type="number" value={zone.freeShippingThreshold} onChange={(e) => updateZone(zone.id, 'freeShippingThreshold', parseFloat(e.target.value) || 0)} className="block w-full rounded-md border-0 py-1.5 pl-7 pr-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-pink-600 sm:text-sm sm:leading-6" min="0" step="100" />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between pt-4 mt-6 border-t border-gray-200 dark:border-gray-700">
                      <button type="button" onClick={(e) => { e.stopPropagation(); deleteZone(zone.id); }} className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"><Trash2 className="w-4 h-4 mr-1" />Delete Zone</button>
                      <div className="space-x-2">
                        <button type="button" onClick={(e) => { e.stopPropagation(); cancelEditingZone(zone.id); }} className={`inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded-md ${isDarkMode ? 'border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500`}>Cancel</button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); saveZoneChanges(zone.id); }} className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500">Save Changes</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div className="p-6 mt-6 text-center border border-gray-300 border-dashed rounded-lg dark:border-gray-600">
              <button type="button" onClick={handleAddShippingZone} className="inline-flex items-center px-4 py-2 text-sm font-medium text-pink-700 bg-pink-100 border border-transparent rounded-md shadow-sm hover:bg-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:hover:bg-pink-800/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"><Plus className="w-5 h-5 mr-2 -ml-1" />Add Shipping Zone</button>
              <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Add a new shipping zone for a specific region or area</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;