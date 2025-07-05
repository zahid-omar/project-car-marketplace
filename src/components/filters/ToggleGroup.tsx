'use client';

interface ToggleOption {
  value: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface ToggleGroupProps {
  options: ToggleOption[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiSelect?: boolean;
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  layout?: 'horizontal' | 'vertical' | 'grid';
}

export default function ToggleGroup({
  options,
  value,
  onChange,
  multiSelect = false,
  label,
  className = '',
  size = 'md',
  layout = 'grid'
}: ToggleGroupProps) {
  const handleToggle = (optionValue: string) => {
    if (multiSelect) {
      const currentValues = Array.isArray(value) ? value : [];
      if (currentValues.includes(optionValue)) {
        onChange(currentValues.filter(v => v !== optionValue));
      } else {
        onChange([...currentValues, optionValue]);
      }
    } else {
      onChange(value === optionValue ? '' : optionValue);
    }
  };

  const isSelected = (optionValue: string) => {
    if (multiSelect) {
      return Array.isArray(value) ? value.includes(optionValue) : false;
    }
    return value === optionValue;
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  };

  const layoutClasses = {
    horizontal: 'flex flex-wrap gap-2',
    vertical: 'flex flex-col gap-2',
    grid: 'grid grid-cols-2 gap-2'
  };

  return (
    <div className={`toggle-group ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <div className={layoutClasses[layout]}>
        {options.map((option) => {
          const selected = isSelected(option.value);
          return (
            <button
              key={option.value}
              onClick={() => handleToggle(option.value)}
              className={`
                ${sizeClasses[size]}
                rounded-lg border-2 transition-all duration-200 
                flex items-center justify-center gap-2
                ${selected
                  ? 'border-automotive-blue bg-automotive-blue text-white shadow-md'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-automotive-blue/50 hover:bg-automotive-blue/5'
                }
              `}
            >
              {option.icon && (
                <span className={`${size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'}`}>
                  {option.icon}
                </span>
              )}
              <span className="font-medium">{option.label}</span>
              {option.count !== undefined && (
                <span className={`
                  text-xs px-1.5 py-0.5 rounded-full
                  ${selected ? 'bg-white/20' : 'bg-gray-100'}
                `}>
                  {option.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Clear button for multi-select */}
      {multiSelect && Array.isArray(value) && value.length > 0 && (
        <button
          onClick={() => onChange([])}
          className="mt-2 text-xs text-gray-500 hover:text-automotive-blue transition-colors"
        >
          Clear all ({value.length})
        </button>
      )}
    </div>
  );
} 