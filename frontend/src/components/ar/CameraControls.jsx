import React, { useCallback, useEffect, useRef } from 'react';
import { 
  Camera, 
  RotateCw, 
  Smartphone, 
  Tablet, 
  Monitor,
  SmartphoneIcon,
  TabletIcon,
  MonitorIcon
} from 'lucide-react';

const VIEWS = [
  { 
    id: 'front', 
    label: 'Front', 
    icon: <Camera className="w-5 h-5" />,
    position: [0, 0, 5],
    rotation: [0, 0, 0]
  },
  { 
    id: 'side', 
    label: 'Side',
    icon: <Camera className="w-5 h-5" />,
    position: [5, 0, 0],
    rotation: [0, Math.PI / 2, 0]
  },
  { 
    id: 'top', 
    label: 'Top',
    icon: <Camera className="w-5 h-5" />,
    position: [0, 5, 0.1],
    rotation: [-Math.PI / 2, 0, 0]
  },
  { 
    id: 'reset', 
    label: 'Reset',
    icon: <RotateCw className="w-5 h-5" />,
    position: [0, 0, 5],
    rotation: [0, 0, 0]
  },
];

// Device presets for different viewport sizes
const DEVICE_PRESETS = {
  mobile: { icon: <SmartphoneIcon className="w-4 h-4" />, label: 'Phone' },
  tablet: { icon: <TabletIcon className="w-4 h-4" />, label: 'Tablet' },
  desktop: { icon: <MonitorIcon className="w-4 h-4" />, label: 'Desktop' },
};

const CameraControls = React.memo(({ 
  currentView = 'front', 
  onChangeView,
  onDeviceChange,
  className = ''
}) => {
  const isMobile = window.innerWidth < 768;
  const deviceType = isMobile ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop';
  const deviceRef = useRef(deviceType);
  
  // Handle view change with smooth transition
  const handleViewChange = useCallback((viewId) => {
    if (viewId === 'reset') {
      onChangeView('front');
    } else {
      onChangeView(viewId);
    }
  }, [onChangeView]);

  // Handle device preset change
  const handleDeviceChange = useCallback((device) => {
    deviceRef.current = device;
    if (onDeviceChange) {
      onDeviceChange(device);
    }
  }, [onDeviceChange]);

  // Add keyboard shortcuts for better accessibility
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch(e.key) {
        case '1':
          handleViewChange('front');
          break;
        case '2':
          handleViewChange('side');
          break;
        case '3':
          handleViewChange('top');
          break;
        case 'r':
        case 'R':
          handleViewChange('reset');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleViewChange]);

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">Camera Controls</h3>
        
        {/* Device Preset Selector */}
        <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
          {Object.entries(DEVICE_PRESETS).map(([device, { icon, label }]) => (
            <button
              key={device}
              type="button"
              onClick={() => handleDeviceChange(device)}
              className={`p-1.5 rounded-md transition-colors ${
                deviceRef.current === device
                  ? 'bg-white dark:bg-gray-600 shadow-sm text-pink-600 dark:text-pink-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              aria-label={`${label} view`}
              title={`${label} view`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>
      
      {/* View Controls */}
      <div className="grid grid-cols-4 gap-2">
        {VIEWS.map((view) => (
          <button
            key={view.id}
            type="button"
            onClick={() => handleViewChange(view.id)}
            className={`group relative flex flex-col items-center justify-center p-2.5 rounded-xl transition-all duration-200 ${
              currentView === view.id
                ? 'bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-200 ring-2 ring-pink-500'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:ring-1 hover:ring-pink-300 dark:hover:ring-pink-500/50'
            }`}
            aria-label={`${view.label} view`}
          >
            <span className={`mb-1.5 transition-transform group-hover:scale-110 ${
              currentView === view.id ? 'scale-110' : ''
            }`}>
              {view.icon}
            </span>
            <span className="text-xs font-medium">{view.label}</span>
            
            {/* Keyboard shortcut hint */}
            {view.id !== 'reset' && (
              <span className="absolute -top-1 -right-1 text-[10px] font-mono bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-full w-4 h-4 flex items-center justify-center">
                {view.id === 'front' ? '1' : view.id === 'side' ? '2' : '3'}
              </span>
            )}
          </button>
        ))}
      </div>
      
      {/* Help text for keyboard shortcuts */}
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
        Press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">1</kbd>, 
        <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs mx-1">2</kbd>, 
        <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs mr-1">3</kbd> 
        for quick views | <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">R</kbd> to reset
      </p>
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if currentView changes
  return prevProps.currentView === nextProps.currentView;
});

CameraControls.displayName = 'CameraControls';

export { VIEWS };
export default CameraControls;