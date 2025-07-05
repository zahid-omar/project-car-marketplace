import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, X, Check } from 'lucide-react';

interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select categories...",
  className = "",
  disabled = false
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleOption = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const handleRemoveOption = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter(v => v !== optionValue));
  };

  const getDisplayText = () => {
    if (value.length === 0) return placeholder;
    if (value.length === 1) {
      const option = options.find(opt => opt.value === value[0]);
      return option?.label || value[0];
    }
    return `${value.length} categories selected`;
  };

  const selectedOptions = value.map(v => 
    options.find(opt => opt.value === v)
  ).filter(Boolean) as MultiSelectOption[];

  return (
    <div className={cn('relative w-full', className)} ref={containerRef}>
      {/* Main Select Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900',
          'focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none',
          'transition-all duration-200 text-body-medium text-left',
          'flex items-center justify-between',
          disabled && 'bg-surface-container-low text-on-surface/38 cursor-not-allowed',
          isOpen && 'border-primary ring-2 ring-primary/20'
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className={cn(
          'truncate',
          value.length === 0 && 'text-gray-500'
        )}>
          {getDisplayText()}
        </span>
        <ChevronDown className={cn(
          'w-4 h-4 text-gray-500 transition-transform duration-200 flex-shrink-0 ml-2',
          isOpen && 'rotate-180'
        )} />
      </button>

      {/* Selected Options Tags - Vertical Stack */}
      {value.length > 0 && (
        <div className="mt-3 space-y-2">
          {selectedOptions.map((option) => (
            <div
              key={option.value}
              className="inline-flex items-center px-3 py-1 rounded-full text-label-small bg-purple-600 text-white shadow-sm w-fit"
            >
              <span className="truncate text-xs">{option.label}</span>
              <button
                type="button"
                onClick={(e) => handleRemoveOption(option.value, e)}
                className="ml-2 hover:text-white/70 transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-white/30 rounded-full p-0.5"
                aria-label={`Remove ${option.label}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className={cn(
            'absolute top-full left-0 mt-1 z-50',
            'bg-white border border-outline-variant rounded-xl shadow-lg',
            'max-h-48 overflow-y-auto',
            'w-full max-w-full'
          )}
          role="listbox"
          aria-multiselectable="true"
        >
          {options.length === 0 ? (
            <div className="px-4 py-3 text-body-small text-gray-500 text-center bg-white">
              No options available
            </div>
          ) : (
            options.map((option) => {
              const isSelected = value.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleToggleOption(option.value)}
                  className={cn(
                    'w-full px-4 py-3 text-left transition-colors duration-200 bg-white',
                    'hover:bg-gray-50 focus:bg-gray-50',
                    'focus:outline-none first:rounded-t-xl last:rounded-b-xl',
                    'flex items-center justify-between',
                    isSelected && 'bg-primary-container text-on-primary-container'
                  )}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span className="text-body-medium truncate text-gray-900">{option.label}</span>
                  {isSelected && (
                    <Check className="w-4 h-4 text-primary flex-shrink-0 ml-2" />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
} 