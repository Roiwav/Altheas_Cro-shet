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

/**
 * A memoized component that displays a palette of color swatches for selection.
 * @param {object} props - The component props.
 * @param {string} [props.selectedColor='#ff69b4'] - The hex code of the currently selected color.
 * @param {function} props.onSelect - Callback function triggered when a color is selected.
 * @param {string} [props.className=''] - Optional additional CSS classes for the container.
 */
const ColorSelector = React.memo(({ 
  selectedColor = '#ff69b4', 
  onSelect,
  className = ''
}) => {
  /**
   * Memoizes the color swatch elements to prevent re-rendering when the parent component updates,
   * unless the `selectedColor` or `onSelect` callback changes.
   */
  const colorSwatches = useMemo(() => (
    COLOR_PRESETS.map(({ hex, name }) => (
      <button
        key={hex}
        type="button"
        onClick={() => onSelect(hex)}
        className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 transition-all transform hover:scale-110 ${
          selectedColor.toLowerCase() === hex.toLowerCase()
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
    <div className={className}>
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