import { useContext } from 'react';
import { Outlet } from 'react-router-dom';
import { SettingsContext } from '../../context/SettingsContext.jsx';
import { useUser } from '../../context/useUser';
import MaintenancePage from '../../pages/main/MaintenancePage';

export default function MaintenanceRoute() {
  const { settings } = useContext(SettingsContext);
  const { user } = useUser();

  const isMaintenanceMode = settings?.maintenanceMode;
  const isAdmin = user?.role === 'admin';

  // Admins can always access the site.
  // If maintenance mode is off, everyone can access.
  if (isAdmin || !isMaintenanceMode) {
    return <Outlet />;
  }

  return <MaintenancePage />;
}