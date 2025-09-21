import React, { useCallback, useMemo, useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Popover } from '@headlessui/react';
import { PaintBrushIcon, XMarkIcon } from '@heroicons/react/24/outline';

// Predefined color palette with names for better accessibility
const COLOR_PRESETS = [
  { hex: '#ff69b4', name: 'Hot Pink' },
  { hex: '#ff0000', name: 'Red' },
  { hex: '#ff8c00', name: 'Dark Orange' },
  { hex: '#ffd700', name: 'Gold' },
  { hex: '#32cd32', name: 'Lime Green' },
  { hex: '#1e90ff', name: 'Dodger Blue' },
  { hex: '#8a2be2', name: 'Blue Violet' },
  { hex: '#ffffff', name: 'White' },
];

const ColorSelector = React.memo(({ 
  selectedColor = '#ff69b4', 
  onSelect,
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customColor, setCustomColor] = useState(selectedColor);

  // Only update parent when popover is closed
  const handleColorChange = useCallback((color) => {
    setCustomColor(color);
  }, []);

  const handleClose = useCallback(() => {
    onSelect(customColor);
    setIsOpen(false);
  }, [customColor, onSelect]);

  // Memoize color swatches to prevent unnecessary re-renders
  const colorSwatches = useMemo(() => (
    COLOR_PRESETS.map(({ hex, name }) => (
      <button
        key={hex}
        type="button"
        onClick={() => {
          setCustomColor(hex);
          onSelect(hex);
        }}
        className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 transition-all transform hover:scale-110 ${
          selectedColor === hex
            ? 'border-pink-500 ring-2 ring-offset-2 ring-pink-300 scale-110'
            : 'border-gray-300 dark:border-gray-600 hover:border-pink-400'
        }`}
        style={{ backgroundColor: hex }}
        aria-label={`Select ${name} color`}
        title={name}
      />
    ))
  ), [selectedColor, onSelect]);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">Flower Color</h3>
        <Popover className="relative">
          {() => (
            <>
              <Popover.Button 
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Open color picker"
              >
                <PaintBrushIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </Popover.Button>
              
              {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 md:absolute md:right-0 md:top-8 md:inset-auto">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 w-full max-w-xs">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-medium">Custom Color</h3>
                      <button 
                        onClick={handleClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        aria-label="Close color picker"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="mb-4">
                      <HexColorPicker 
                        color={customColor} 
                        onChange={handleColorChange} 
                        className="w-full h-48"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="w-8 h-8 rounded border border-gray-300" style={{ backgroundColor: customColor }} />
                      <span className="text-sm font-mono">{customColor.toUpperCase()}</span>
                      <button
                        onClick={handleClose}
                        className="px-3 py-1 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </Popover>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {colorSwatches}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if selectedColor changes
  return prevProps.selectedColor === nextProps.selectedColor;
});

ColorSelector.displayName = 'ColorSelector';

export default ColorSelector;