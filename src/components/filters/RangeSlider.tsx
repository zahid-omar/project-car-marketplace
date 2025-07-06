'use client';

import React from 'react';

interface RangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  label?: string;
  step?: number;
  unit?: string;
  formatValue?: (value: number) => string;
}

const RangeSlider: React.FC<RangeSliderProps> = ({
  min,
  max,
  value,
  onChange,
  label,
  step = 1,
  unit,
  formatValue = (val) => val.toString()
}) => {
  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Number(e.target.value);
    if (newMin <= value[1]) {
      onChange([newMin, value[1]]);
    }
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Number(e.target.value);
    if (newMax >= value[0]) {
      onChange([value[0], newMax]);
    }
  };

  return (
    <div className="space-y-3">
      {label && (
        <label className="text-md-label-medium font-medium text-md-sys-on-surface">
          {label}
        </label>
      )}
      
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="flex-1">
            <label className="text-xs text-md-sys-on-surface-variant mb-1 block">
              Min: {formatValue(value[0])}
            </label>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={value[0]}
              onChange={handleMinChange}
              className="w-full h-2 bg-md-sys-surface-variant rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <div className="flex-1">
            <label className="text-xs text-md-sys-on-surface-variant mb-1 block">
              Max: {formatValue(value[1])}
            </label>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={value[1]}
              onChange={handleMaxChange}
              className="w-full h-2 bg-md-sys-surface-variant rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
        
        <div className="flex justify-between text-sm text-md-sys-on-surface-variant">
          <span>{formatValue(value[0])}</span>
          <span>-</span>
          <span>{formatValue(value[1])}</span>
        </div>
      </div>
    </div>
  );
};

export default RangeSlider; 