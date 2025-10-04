import React, { useMemo } from 'react';

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
  // Memoize color swatches to prevent unnecessary re-renders
  const colorSwatches = useMemo(() => (
    COLOR_PRESETS.map(({ hex, name }) => (
      <button
        key={hex}
        type="button"
        onClick={() => onSelect(hex)}
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
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">Flower Color</h3>
      
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