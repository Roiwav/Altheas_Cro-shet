import React from 'react';
import { Star, Package } from 'lucide-react';

const ARRANGEMENT_TYPES = [
  {
    id: 'single',
    name: 'Single',
    icon: <Star className="w-5 h-5" />,
    description: 'A single, elegant flower stem.',
  },
  {
    id: 'bouquet',
    name: 'Bouquet',
    icon: <Package className="w-5 h-5" />,
    description: 'A beautiful arrangement of multiple flowers.',
  },
];

const ArrangementSelector = React.memo(({
  selectedArrangement = 'single',
  onSelect,
  className = ''
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="grid grid-cols-2 gap-2">
        {ARRANGEMENT_TYPES.map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() => onSelect(type.id)}
            className={`group relative flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 ${
              selectedArrangement === type.id
                ? 'bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-200 ring-2 ring-pink-500'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:ring-1 hover:ring-pink-300 dark:hover:ring-pink-500/50'
            }`}
            aria-label={`Select ${type.name}`}
            title={type.description}
          >
            <span className="mb-1.5">{type.icon}</span>
            <span className="text-sm font-medium">{type.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
});

ArrangementSelector.displayName = 'ArrangementSelector';

export default ArrangementSelector;