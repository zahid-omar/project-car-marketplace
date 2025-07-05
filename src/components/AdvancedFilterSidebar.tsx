'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import RangeSlider from './filters/RangeSlider';
import MultiSelect from './filters/MultiSelect';
import ToggleGroup from './filters/ToggleGroup';
import CollapsibleSection from './filters/CollapsibleSection';

interface AdvancedFilters {
  // Search
  query: string;
  
  // Basic Info
  makes: string[];
  models: string[];
  
  // Ranges
  yearRange: [number, number];
  priceRange: [number, number];
  mileageRange: [number, number];
  
  // Engine & Performance
  engineTypes: string[];
  transmissionTypes: string[];
  drivetrains: string[];
  
  // Modifications
  modificationCategories: string[];
  specificModifications: string[];
  
  // Condition & Features
  conditions: string[];
  colors: string[];
  
  // Sort
  sortBy: string;
}

interface AdvancedFilterSidebarProps {
  filters: AdvancedFilters;
  onFilterChange: (filters: Partial<AdvancedFilters>) => void;
  totalItems: number;
  loading?: boolean;
}

interface Option {
  value: string;
  label: string;
  count?: number;
}

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1980;
const MAX_PRICE = 500000;
const MAX_MILEAGE = 300000;

// Filter presets for quick selection
const FILTER_PRESETS = [
  {
    label: 'Sports Cars',
    icon: '🏎️',
    filters: {
      modificationCategories: ['performance', 'suspension'],
      engineTypes: ['turbocharged', 'supercharged', 'naturally-aspirated'],
      priceRange: [15000, 100000] as [number, number]
    }
  },
  {
    label: 'Drift Cars',
    icon: '🔄',
    filters: {
      modificationCategories: ['suspension', 'performance', 'safety'],
      drivetrains: ['rwd'],
      transmissionTypes: ['manual']
    }
  },
  {
    label: 'Show Cars',
    icon: '✨',
    filters: {
      modificationCategories: ['cosmetic', 'interior', 'wheels'],
      conditions: ['excellent', 'pristine']
    }
  },
  {
    label: 'Daily Drivers',
    icon: '🚗',
    filters: {
      conditions: ['good', 'excellent'],
      mileageRange: [0, 150000] as [number, number],
      priceRange: [5000, 50000] as [number, number]
    }
  }
];

export default function AdvancedFilterSidebar({ 
  filters, 
  onFilterChange, 
  totalItems, 
  loading = false 
}: AdvancedFilterSidebarProps) {
  const [makes, setMakes] = useState<Option[]>([]);
  const [models, setModels] = useState<Option[]>([]);
  const [modifications, setModifications] = useState<Option[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchFilterData();
  }, []);

  const fetchFilterData = async () => {
    try {
      setDataLoading(true);

      // Fetch makes with counts
      const { data: makesData } = await supabase
        .from('listings')
        .select('make')
        .eq('status', 'active');

      // Count occurrences
      const makesCounts = makesData?.reduce((acc: Record<string, number>, item) => {
        acc[item.make] = (acc[item.make] || 0) + 1;
        return acc;
      }, {}) || {};

      setMakes(
        Object.entries(makesCounts)
          .map(([make, count]) => ({ value: make, label: make, count: count as number }))
          .sort((a, b) => a.label.localeCompare(b.label))
      );

      // Fetch modifications with counts
      const { data: modsData } = await supabase
        .from('modifications')
        .select('name, category');

      const modsCounts = modsData?.reduce((acc: Record<string, number>, item) => {
        acc[item.name] = (acc[item.name] || 0) + 1;
        return acc;
      }, {}) || {};

      setModifications(
        Object.entries(modsCounts)
          .map(([mod, count]) => ({ value: mod, label: mod, count: count as number }))
          .sort((a, b) => b.count - a.count) // Sort by popularity
      );

    } catch (error) {
      console.error('Error fetching filter data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const applyPreset = (preset: typeof FILTER_PRESETS[0]) => {
    onFilterChange(preset.filters);
  };

  const clearAllFilters = () => {
    onFilterChange({
      query: '',
      makes: [],
      models: [],
      yearRange: [MIN_YEAR, CURRENT_YEAR],
      priceRange: [0, MAX_PRICE],
      mileageRange: [0, MAX_MILEAGE],
      engineTypes: [],
      transmissionTypes: [],
      drivetrains: [],
      modificationCategories: [],
      specificModifications: [],
      conditions: [],
      colors: [],
      sortBy: 'created_at'
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.query) count++;
    if (filters.makes?.length) count++;
    if (filters.models?.length) count++;
    if (filters.yearRange && (filters.yearRange[0] > MIN_YEAR || filters.yearRange[1] < CURRENT_YEAR)) count++;
    if (filters.priceRange && (filters.priceRange[0] > 0 || filters.priceRange[1] < MAX_PRICE)) count++;
    if (filters.mileageRange && (filters.mileageRange[0] > 0 || filters.mileageRange[1] < MAX_MILEAGE)) count++;
    if (filters.engineTypes?.length) count++;
    if (filters.transmissionTypes?.length) count++;
    if (filters.drivetrains?.length) count++;
    if (filters.modificationCategories?.length) count++;
    if (filters.specificModifications?.length) count++;
    if (filters.conditions?.length) count++;
    if (filters.colors?.length) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit sticky top-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Advanced Filters
          {activeFilterCount > 0 && (
            <span className="ml-2 px-2 py-1 text-xs bg-automotive-blue text-white rounded-full">
              {activeFilterCount}
            </span>
          )}
        </h3>
        {activeFilterCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-automotive-blue hover:text-automotive-blue/80 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600 mb-6">
        {loading ? (
          <div className="animate-pulse h-4 bg-gray-200 rounded w-24"></div>
        ) : (
          <>
            {totalItems} {totalItems === 1 ? 'car' : 'cars'} found
          </>
        )}
      </div>

      {/* Quick Filter Presets */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Filters</h4>
        <div className="grid grid-cols-2 gap-2">
          {FILTER_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => applyPreset(preset)}
              className="p-3 border border-gray-200 rounded-lg hover:border-automotive-blue hover:bg-automotive-blue/5 transition-colors text-left"
            >
              <div className="text-lg mb-1">{preset.icon}</div>
              <div className="text-xs font-medium text-gray-900">{preset.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Filter Sections */}
      <div className="space-y-1">
        {/* Basic Filters */}
        <CollapsibleSection 
          title="Basic Info" 
          defaultOpen={true}
          badge={[filters.makes?.length, filters.models?.length].filter(Boolean).length || undefined}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        >
          <MultiSelect
            label="Makes"
            options={makes}
            value={filters.makes || []}
            onChange={(value) => onFilterChange({ makes: value })}
            placeholder="Select makes..."
            searchable={true}
          />
          
          <MultiSelect
            label="Models"
            options={models}
            value={filters.models || []}
            onChange={(value) => onFilterChange({ models: value })}
            placeholder="Select models..."
            searchable={true}
          />
        </CollapsibleSection>

        {/* Ranges */}
        <CollapsibleSection 
          title="Ranges" 
          defaultOpen={true}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        >
          <RangeSlider
            label="Year"
            min={MIN_YEAR}
            max={CURRENT_YEAR}
            value={filters.yearRange || [MIN_YEAR, CURRENT_YEAR]}
            onChange={(value) => onFilterChange({ yearRange: value })}
            step={1}
          />
          
          <RangeSlider
            label="Price"
            min={0}
            max={MAX_PRICE}
            value={filters.priceRange || [0, MAX_PRICE]}
            onChange={(value) => onFilterChange({ priceRange: value })}
            step={1000}
            unit=""
            formatValue={(val) => `$${(val / 1000).toFixed(0)}k`}
          />
          
          <RangeSlider
            label="Mileage"
            min={0}
            max={MAX_MILEAGE}
            value={filters.mileageRange || [0, MAX_MILEAGE]}
            onChange={(value) => onFilterChange({ mileageRange: value })}
            step={5000}
            unit=" mi"
            formatValue={(val) => `${(val / 1000).toFixed(0)}k`}
          />
        </CollapsibleSection>

        {/* Engine & Drivetrain */}
        <CollapsibleSection 
          title="Engine & Drivetrain"
          defaultOpen={false}
          badge={[filters.engineTypes?.length, filters.transmissionTypes?.length, filters.drivetrains?.length].filter(Boolean).length || undefined}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          }
        >
          <ToggleGroup
            label="Engine Type"
            options={[
              { value: 'naturally-aspirated', label: 'N/A' },
              { value: 'turbocharged', label: 'Turbo' },
              { value: 'supercharged', label: 'Super' },
              { value: 'hybrid', label: 'Hybrid' },
              { value: 'electric', label: 'Electric' }
            ]}
            value={filters.engineTypes || []}
            onChange={(value) => onFilterChange({ engineTypes: value as string[] })}
            multiSelect={true}
            size="sm"
            layout="grid"
          />
          
          <ToggleGroup
            label="Transmission"
            options={[
              { value: 'manual', label: 'Manual' },
              { value: 'automatic', label: 'Auto' },
              { value: 'cvt', label: 'CVT' },
              { value: 'dct', label: 'DCT' }
            ]}
            value={filters.transmissionTypes || []}
            onChange={(value) => onFilterChange({ transmissionTypes: value as string[] })}
            multiSelect={true}
            size="sm"
          />
          
          <ToggleGroup
            label="Drivetrain"
            options={[
              { value: 'fwd', label: 'FWD' },
              { value: 'rwd', label: 'RWD' },
              { value: 'awd', label: 'AWD' },
              { value: '4wd', label: '4WD' }
            ]}
            value={filters.drivetrains || []}
            onChange={(value) => onFilterChange({ drivetrains: value as string[] })}
            multiSelect={true}
            size="sm"
          />
        </CollapsibleSection>

        {/* Modifications */}
        <CollapsibleSection 
          title="Modifications"
          defaultOpen={false}
          badge={[filters.modificationCategories?.length, filters.specificModifications?.length].filter(Boolean).length || undefined}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        >
          <ToggleGroup
            label="Categories"
            options={[
              { value: 'performance', label: 'Performance' },
              { value: 'suspension', label: 'Suspension' },
              { value: 'cosmetic', label: 'Cosmetic' },
              { value: 'interior', label: 'Interior' },
              { value: 'wheels', label: 'Wheels' },
              { value: 'safety', label: 'Safety' }
            ]}
            value={filters.modificationCategories || []}
            onChange={(value) => onFilterChange({ modificationCategories: value as string[] })}
            multiSelect={true}
            size="sm"
          />
          
          <MultiSelect
            label="Specific Modifications"
            options={modifications.slice(0, 50)} // Limit for performance
            value={filters.specificModifications || []}
            onChange={(value) => onFilterChange({ specificModifications: value })}
            placeholder="Search modifications..."
            searchable={true}
            maxDisplayed={2}
          />
        </CollapsibleSection>

        {/* Condition & Features */}
        <CollapsibleSection 
          title="Condition & Features"
          defaultOpen={false}
          badge={[filters.conditions?.length, filters.colors?.length].filter(Boolean).length || undefined}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          }
        >
          <ToggleGroup
            label="Condition"
            options={[
              { value: 'pristine', label: 'Pristine' },
              { value: 'excellent', label: 'Excellent' },
              { value: 'good', label: 'Good' },
              { value: 'fair', label: 'Fair' },
              { value: 'project', label: 'Project' }
            ]}
            value={filters.conditions || []}
            onChange={(value) => onFilterChange({ conditions: value as string[] })}
            multiSelect={true}
            size="sm"
            layout="vertical"
          />
          
          <MultiSelect
            label="Colors"
            options={[
              { value: 'black', label: 'Black' },
              { value: 'white', label: 'White' },
              { value: 'gray', label: 'Gray' },
              { value: 'silver', label: 'Silver' },
              { value: 'red', label: 'Red' },
              { value: 'blue', label: 'Blue' },
              { value: 'green', label: 'Green' },
              { value: 'yellow', label: 'Yellow' },
              { value: 'orange', label: 'Orange' },
              { value: 'purple', label: 'Purple' }
            ]}
            value={filters.colors || []}
            onChange={(value) => onFilterChange({ colors: value })}
            placeholder="Select colors..."
          />
        </CollapsibleSection>
      </div>
    </div>
  );
} 