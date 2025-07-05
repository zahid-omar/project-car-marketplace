'use client';

import { useState, useRef, useEffect } from 'react';

interface Option {
  value: string;
  label: string;
  count?: number;
}

interface MultiSelectProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  label?: string;
  maxDisplayed?: number;
  searchable?: boolean;
  className?: string;
}

export default function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Select options...',
  label,
  maxDisplayed = 3,
  searchable = true,
  className = ''
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = searchable 
    ? options.filter(option => 
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  const selectedOptions = options.filter(option => value.includes(option.value));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const removeOption = (optionValue: string) => {
    onChange(value.filter(v => v !== optionValue));
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className={`multi-select relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      {/* Selected Items Display */}
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {selectedOptions.slice(0, maxDisplayed).map((option) => (
            <span
              key={option.value}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-automotive-blue text-white"
            >
              {option.label}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeOption(option.value);
                }}
                className="ml-1 hover:bg-automotive-blue/80 rounded-full p-0.5"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
          {selectedOptions.length > maxDisplayed && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
              +{selectedOptions.length - maxDisplayed} more
            </span>
          )}
          {selectedOptions.length > 1 && (
            <button
              onClick={clearAll}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-700 hover:bg-red-200"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Dropdown Trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg cursor-pointer focus:ring-2 focus:ring-automotive-blue focus:border-transparent bg-white"
      >
        <div className="flex items-center justify-between">
          <span className={selectedOptions.length === 0 ? 'text-gray-400' : 'text-gray-900'}>
            {selectedOptions.length === 0 ? placeholder : `${selectedOptions.length} selected`}
          </span>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
          {/* Search Input */}
          {searchable && (
            <div className="p-2 border-b border-gray-200">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search options..."
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-automotive-blue focus:border-transparent"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          {/* Options List */}
          <div className="overflow-y-auto max-h-48">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                {searchTerm ? 'No options found' : 'No options available'}
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = value.includes(option.value);
                return (
                  <div
                    key={option.value}
                    onClick={() => toggleOption(option.value)}
                    className={`px-3 py-2 cursor-pointer hover:bg-gray-50 flex items-center justify-between ${
                      isSelected ? 'bg-automotive-blue/10 text-automotive-blue' : 'text-gray-900'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-4 h-4 border-2 rounded mr-2 flex items-center justify-center ${
                        isSelected ? 'border-automotive-blue bg-automotive-blue' : 'border-gray-300'
                      }`}>
                        {isSelected && (
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm">{option.label}</span>
                    </div>
                    {option.count !== undefined && (
                      <span className="text-xs text-gray-400">
                        ({option.count})
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
} 