// eslint-disable-next-line no-unused-vars
import React, { useState } from 'react';
import { Switch } from '@headlessui/react';
import { toast } from 'react-toastify';
import { SettingsContext } from '../../context/SettingsContext.jsx';

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

    </div>
  );
};

export default SettingsTab;