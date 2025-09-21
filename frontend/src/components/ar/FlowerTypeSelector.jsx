import React, { useMemo } from 'react';
import { 
  Flower, 
  Sun,
  ChevronDown, 
  Check, 
  Crown,
  Flower2,
  ChevronsDown,
  Fan,
} from 'lucide-react';
import { Listbox, Transition } from '@headlessui/react';

const FLOWER_TYPES = [
  { 
    id: 'rose',   
    name: 'Rose', 
    icon: <Flower className="w-5 h-5" />,
    description: 'Classic rose with layered petals',
  },
  { 
    id: 'tulip', 
    name: 'Tulip', 
    icon: <Flower2 className="w-5 h-5" />,
    description: 'Elegant cup-shaped flower',
  },
  { 
    id: 'sunflower', 
    name: 'Sunflower', 
    icon: <Sun className="w-5 h-5" />,  
    description: 'Large, bright yellow flower',
  },
  { 
    id: 'lily', 
    name: 'Lily', 
    icon: <ChevronsDown className="w-5 h-5" />,
    description: 'Large, White flowe',
  },
  { 
    id: 'carnation', 
    name: 'Carnation', 
    icon: <Crown className="w-5 h-5" />,
    description: 'Pink, white carnation',
  },
  { 
    id: 'peony', 
    name: 'Peony', 
    icon: <Fan className="w-5 h-5" />,
    description: 'Pink, white peony',
  },
];

const FlowerTypeSelector = React.memo(({ 
  selectedType = 'rose', 
  onSelect,
  className = ''
}) => {
  const selectedFlower = useMemo(
    () => FLOWER_TYPES.find(type => type.id === selectedType) || FLOWER_TYPES[0],
    [selectedType]
  );

  return (
    <div className={`space-y-2 ${className}`}>
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">Flower Type</h3>
      
      {/* Mobile/Tablet - Dropdown */}
      <div className="md:hidden">
        <Listbox value={selectedType} onChange={onSelect}>
          {({ open }) => (
            <div className="relative">
              <Listbox.Button className="relative w-full py-2 pl-3 pr-10 text-left bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm cursor-default focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 sm:text-sm">
                <span className="flex items-center">
                  <span className="ml-3 block truncate">{selectedFlower.name}</span>
                </span>
                <span className="ml-3 absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <ChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </span>
              </Listbox.Button>
              
              <Transition
                show={open}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
                className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm"
              >
                {FLOWER_TYPES.map((type) => (
                  <Listbox.Option
                    key={type.id}
                    className={({ active }) =>
                      `${active ? 'text-pink-900 dark:text-pink-100 bg-pink-100 dark:bg-pink-900' : 'text-gray-900 dark:text-gray-100'}
                       cursor-default select-none relative py-2 pl-3 pr-9`
                    }
                    value={type.id}
                  >
                    {({ selected, active }) => (
                      <>
                        <div className="flex items-center">
                          <span className={`${selected ? 'font-semibold' : 'font-normal'} ml-3 block truncate`}>
                            {type.name}
                          </span>
                        </div>
                        {selected ? (
                          <span
                            className={`${active ? 'text-pink-600 dark:text-pink-400' : 'text-pink-600 dark:text-pink-400'}
                              absolute inset-y-0 right-0 flex items-center pr-4`}
                          >
                            <Check className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Transition>
            </div>
          )}
        </Listbox>
      </div>
      
      {/* Desktop - Grid */}
      <div className="hidden md:grid grid-cols-4 gap-2">
        {FLOWER_TYPES.map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() => onSelect(type.id)}
            className={`group relative flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 ${
              selectedType === type.id
                ? 'bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-200 ring-2 ring-pink-500'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:ring-1 hover:ring-pink-300 dark:hover:ring-pink-500/50'
            }`}
            aria-label={`Select ${type.name}`}
            title={type.description}
          >
            <span className={`mb-1.5 transition-transform group-hover:scale-110 ${
              selectedType === type.id ? 'scale-110' : ''
            }`}>
              {type.icon}
            </span>
            <span className="text-xs font-medium">{type.name}</span>
            
            {/* Difficulty indicator */}
            <span className={`absolute -top-1 -right-1 text-[10px] px-1.5 py-0.5 rounded-full ${
              type.difficulty === 'Easy' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                : type.difficulty === 'Medium'
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                : type.difficulty === 'Hard'
                ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
            }`}>
              {type.difficulty}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if selectedType changes
  return prevProps.selectedType === nextProps.selectedType;
});

FlowerTypeSelector.displayName = 'FlowerTypeSelector';

export default FlowerTypeSelector;