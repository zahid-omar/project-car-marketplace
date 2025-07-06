'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Tooltip, MultiSelect } from '@/components/ui';
import { HelpCircle } from 'lucide-react';

interface Filters {
  make: string;
  model: string;
  yearFrom: number;
  yearTo: number;
  priceFrom: number;
  priceTo: number;
  sortBy: string;
  modificationCategories: string[];
  specificModifications: string[];
  modDateFrom: string;
  modDateTo: string;
  hasModifications: boolean;
}

interface FilterSidebarProps {
  filters: Filters;
  onFilterChange: (filters: Partial<Filters>) => void;
  totalItems: number;
}

interface Make {
  id: number;
  name: string;
}

interface Model {
  id: number;
  name: string;
  make_id: number;
}

interface ModificationOption {
  value: string;
  label: string;
  count: number;
}

// Debounce hook for performance optimization
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1980;

const PRICE_RANGES = [
  { label: 'Under $10K', min: 0, max: 10000 },
  { label: '$10K - $25K', min: 10000, max: 25000 },
  { label: '$25K - $50K', min: 25000, max: 50000 },
  { label: '$50K - $100K', min: 50000, max: 100000 },
  { label: '$100K+', min: 100000, max: 0 },
];

const MODIFICATION_CATEGORIES = [
  'Engine',
  'Turbo/Supercharger',
  'Exhaust',
  'Intake',
  'Suspension',
  'Brakes',
  'Wheels/Tires',
  'Interior',
  'Exterior',
  'Drivetrain',
  'Electrical',
  'Safety',
  'Audio/Electronics',
  'Lighting',
  'Other'
];

export default function FilterSidebar({ filters, onFilterChange, totalItems }: FilterSidebarProps) {
  const [makes, setMakes] = useState<Make[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [popularModifications, setPopularModifications] = useState<ModificationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [modificationSearch, setModificationSearch] = useState('');

  // Debounce modification search to reduce API calls
  const debouncedModificationSearch = useDebounce(modificationSearch, 300);

  const supabase = createClientComponentClient();

  // Memoize available models based on selected make
  const availableModels = useMemo(() => {
    if (filters.make) {
      const selectedMake = makes.find(make => make.name.toLowerCase() === filters.make.toLowerCase());
      if (selectedMake) {
        return models.filter(model => model.make_id === selectedMake.id);
      }
      return [];
    }
    return models;
  }, [filters.make, makes, models]);

  // Memoize filtered modifications for performance
  const filteredModifications = useMemo(() => {
    if (!debouncedModificationSearch.trim()) {
      return popularModifications.slice(0, 20); // Show top 20 by default
    }
    return popularModifications.filter(mod =>
      mod.label.toLowerCase().includes(debouncedModificationSearch.toLowerCase())
    ).slice(0, 20);
  }, [popularModifications, debouncedModificationSearch]);

  // Fetch initial data
  useEffect(() => {
    fetchMakesAndModels();
    fetchPopularModifications();
  }, []);

  const fetchMakesAndModels = useCallback(async () => {
    try {
      setLoading(true);

      // Use Promise.all for parallel requests
      const [makesResult, modelsResult] = await Promise.all([
        supabase
          .from('car_makes')
          .select('id, name')
          .order('name'),
        supabase
          .from('car_models')
          .select('id, name, make_id')
          .order('name')
      ]);

      if (makesResult.error) throw makesResult.error;
      if (modelsResult.error) throw modelsResult.error;

      setMakes(makesResult.data || []);
      setModels(modelsResult.data || []);
    } catch (error) {
      console.error('Error fetching makes and models:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const fetchPopularModifications = useCallback(async () => {
    try {
      // Use the materialized view for better performance
      const { data: popularMods, error } = await supabase
        .from('popular_modifications')
        .select('name, usage_count')
        .order('usage_count', { ascending: false })
        .limit(100); // Get top 100 for filtering

      if (error) {
        console.warn('Materialized view not available, falling back to direct query:', error);
        // Fallback to direct query if materialized view doesn't exist
        const { data: fallbackMods } = await supabase
          .from('modifications')
          .select('name');

        if (fallbackMods) {
          // Count occurrences
          const modCounts = fallbackMods.reduce((acc: Record<string, number>, mod) => {
            const name = mod.name.trim();
            acc[name] = (acc[name] || 0) + 1;
            return acc;
          }, {});

          // Convert to options array
          const modOptions = Object.entries(modCounts)
            .map(([name, count]) => ({ value: name, label: name, count: count as number }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 50);

          setPopularModifications(modOptions);
        }
        return;
      }

      if (popularMods) {
        const modOptions = popularMods.map(mod => ({
          value: mod.name,
          label: mod.name,
          count: mod.usage_count
        }));
        setPopularModifications(modOptions);
      }
    } catch (error) {
      console.error('Error fetching popular modifications:', error);
    }
  }, [supabase]);

  // Optimized filter change handlers with debouncing for frequent changes
  const handleMakeChange = useCallback((make: string) => {
    onFilterChange({ 
      make,
      model: '' // Reset model when make changes
    });
  }, [onFilterChange]);

  const handlePriceRangeSelect = useCallback((min: number, max: number) => {
    onFilterChange({
      priceFrom: min,
      priceTo: max
    });
  }, [onFilterChange]);

  const handleSpecificModificationToggle = useCallback((modification: string) => {
    const currentMods = filters.specificModifications || [];
    const newMods = currentMods.includes(modification)
      ? currentMods.filter(m => m !== modification)
      : [...currentMods, modification];
    
    onFilterChange({ specificModifications: newMods });
  }, [filters.specificModifications, onFilterChange]);

  const handleModificationSearch = useCallback((searchTerm: string) => {
    setModificationSearch('');
    if (searchTerm.trim() && !filters.specificModifications.includes(searchTerm.trim())) {
      const newMods = [...filters.specificModifications, searchTerm.trim()];
      onFilterChange({ specificModifications: newMods });
    }
  }, [filters.specificModifications, onFilterChange]);

  const clearFilters = useCallback(() => {
    onFilterChange({
      make: '',
      model: '',
      yearFrom: 0,
      yearTo: 0,
      priceFrom: 0,
      priceTo: 0,
      sortBy: 'created_at',
      modificationCategories: [],
      specificModifications: [],
      modDateFrom: '',
      modDateTo: '',
      hasModifications: false
    });
  }, [onFilterChange]);

  // Memoize active filters check for performance
  const hasActiveFilters = useMemo(() => {
    return filters.make || filters.model || filters.yearFrom > 0 || 
           filters.yearTo > 0 || filters.priceFrom > 0 || filters.priceTo > 0 ||
           filters.modificationCategories.length > 0 || filters.specificModifications.length > 0 ||
           filters.modDateFrom || filters.modDateTo || filters.hasModifications;
  }, [filters]);

  // Generate year options once
  const yearOptions = useMemo(() => {
    return Array.from({ length: CURRENT_YEAR - MIN_YEAR + 1 }, (_, i) => MIN_YEAR + i).reverse();
  }, []);

  return (
    <aside 
      className="bg-md-sys-surface-container rounded-xl shadow-md border border-md-sys-outline-variant p-4 h-fit sticky top-8"
      role="region"
      aria-labelledby="filters-heading"
    >
      <header className="flex items-center justify-between mb-4">
        <h2 id="filters-heading" className="text-md-body-large font-medium text-md-sys-on-surface">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-2 py-1.5 bg-md-sys-error-container text-md-sys-on-error-container rounded-lg hover:bg-md-sys-error-container/90 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-md-sys-error/20 shadow-sm hover:shadow-md border border-md-sys-error/20"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="text-md-label-small font-medium">Clear All</span>
          </button>
        )}
      </header>

      <div 
        id="filter-status" 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {totalItems} {totalItems === 1 ? 'car' : 'cars'} found with current filters
      </div>

      <form className="space-y-4" role="search" aria-label="Filter car listings">
        {/* Results Count */}
        <div className="bg-md-sys-primary-container text-md-sys-on-primary-container px-3 py-2 rounded-lg border border-md-sys-primary/20">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <div>
              <div className="text-md-body-medium font-medium">
                {totalItems.toLocaleString()}
              </div>
              <div className="text-md-label-small opacity-80">
                {totalItems === 1 ? 'car found' : 'cars found'}
              </div>
            </div>
          </div>
        </div>

        {/* Has Modifications Toggle */}
        <fieldset>
          <legend className="sr-only">Modification Filter Options</legend>
          <div className="space-y-2">
            <Tooltip content="Filter to display only vehicles that have modifications">
              <label 
                className="flex items-center space-x-2 cursor-pointer group p-2 rounded-lg hover:bg-md-sys-surface-container/50 transition-all duration-200"
                htmlFor="has-modifications"
              >
                <input
                  id="has-modifications"
                  type="checkbox"
                  checked={filters.hasModifications}
                  onChange={(e) => onFilterChange({ hasModifications: e.target.checked })}
                  className="rounded border-md-sys-outline text-md-sys-primary focus:ring-2 focus:ring-md-sys-primary/20 focus:border-md-sys-primary transition-colors duration-200 cursor-pointer w-4 h-4"
                />
                <span className="text-md-body-small font-medium text-md-sys-on-surface group-hover:text-md-sys-primary transition-colors duration-200">
                  Show only modified cars
                </span>
                <HelpCircle className="w-3 h-3 text-md-sys-on-surface-variant" />
              </label>
            </Tooltip>
          </div>
        </fieldset>

        {/* Make Filter */}
        <fieldset>
          <legend className="flex items-center gap-2 text-md-body-medium font-medium text-md-sys-on-surface mb-2">
            <span>Vehicle Make</span>
            <Tooltip content="Select a vehicle manufacturer to filter results. Choosing a make will update available models.">
              <HelpCircle className="w-3 h-3 text-md-sys-on-surface-variant cursor-help" />
            </Tooltip>
          </legend>
          {loading ? (
            <div 
              className="animate-pulse h-10 bg-md-sys-surface-container-high rounded-lg"
              role="status"
              aria-label="Loading vehicle makes..."
            >
              <span className="sr-only">Loading available vehicle makes...</span>
            </div>
          ) : (
            <select
              id="make-filter"
              value={filters.make}
              onChange={(e) => handleMakeChange(e.target.value)}
              className="w-full px-3 py-2 border border-md-sys-outline rounded-lg bg-md-sys-surface text-md-sys-on-surface focus:border-md-sys-primary focus:ring-2 focus:ring-md-sys-primary/20 focus:outline-none transition-all duration-200 text-md-body-small hover:bg-md-sys-surface-container/50"
            >
              <option value="">All Makes</option>
              {makes.map((make) => (
                <option key={make.id} value={make.name}>
                  {make.name}
                </option>
              ))}
            </select>
          )}
        </fieldset>

        {/* Model Filter */}
        <fieldset>
          <legend className="flex items-center gap-2 text-md-body-medium font-medium text-md-sys-on-surface mb-2">
            <span>Vehicle Model</span>
            <Tooltip content={
              !filters.make 
                ? 'Select a make first to see available models'
                : availableModels.length === 0 
                  ? 'No models available for selected make'
                  : `Choose from ${availableModels.length} available models`
            }>
              <HelpCircle className="w-3 h-3 text-md-sys-on-surface-variant cursor-help" />
            </Tooltip>
          </legend>
          <select
            id="model-filter"
            value={filters.model}
            onChange={(e) => onFilterChange({ model: e.target.value })}
            disabled={!filters.make || availableModels.length === 0}
            className="w-full px-3 py-2 border border-md-sys-outline rounded-lg bg-md-sys-surface text-md-sys-on-surface focus:border-md-sys-primary focus:ring-2 focus:ring-md-sys-primary/20 focus:outline-none transition-all duration-200 text-md-body-small disabled:bg-md-sys-surface-container-low disabled:text-md-sys-on-surface/38 disabled:cursor-not-allowed hover:bg-md-sys-surface-container/50 disabled:hover:bg-md-sys-surface-container-low"
          >
            <option value="">All Models</option>
            {availableModels.map((model) => (
              <option key={model.id} value={model.name}>
                {model.name}
              </option>
            ))}
          </select>
        </fieldset>

        {/* Year Range */}
        <fieldset>
          <legend className="flex items-center gap-2 text-md-body-medium font-medium text-md-sys-on-surface mb-2">
            <span>Year Range</span>
            <Tooltip content={`Filter vehicles by manufacturing year. Select from ${MIN_YEAR} to ${CURRENT_YEAR}.`}>
              <HelpCircle className="w-3 h-3 text-md-sys-on-surface-variant cursor-help" />
            </Tooltip>
          </legend>
          <div 
            className="grid grid-cols-2 gap-2"
            role="group"
          >
            <div>
              <label htmlFor="year-from" className="sr-only">
                Minimum year
              </label>
              <select
                id="year-from"
                value={filters.yearFrom || ''}
                onChange={(e) => onFilterChange({ yearFrom: parseInt(e.target.value) || 0 })}
                className="w-full px-2 py-2 border border-md-sys-outline rounded-lg bg-md-sys-surface text-md-sys-on-surface focus:border-md-sys-primary focus:ring-2 focus:ring-md-sys-primary/20 focus:outline-none transition-all duration-200 text-md-label-small hover:bg-md-sys-surface-container/50"
              >
                <option value="">From</option>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="year-to" className="sr-only">
                Maximum year
              </label>
              <select
                id="year-to"
                value={filters.yearTo || ''}
                onChange={(e) => onFilterChange({ yearTo: parseInt(e.target.value) || 0 })}
                className="w-full px-2 py-2 border border-md-sys-outline rounded-lg bg-md-sys-surface text-md-sys-on-surface focus:border-md-sys-primary focus:ring-2 focus:ring-md-sys-primary/20 focus:outline-none transition-all duration-200 text-md-label-small hover:bg-md-sys-surface-container/50"
              >
                <option value="">To</option>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        {/* Price Range */}
        <fieldset>
          <legend className="flex items-center gap-2 text-md-body-medium font-medium text-md-sys-on-surface mb-2">
            <span>Price Range</span>
            <Tooltip content="Filter vehicles by price range. Select quick ranges or enter custom values.">
              <HelpCircle className="w-3 h-3 text-md-sys-on-surface-variant cursor-help" />
            </Tooltip>
          </legend>
          
          {/* Quick Price Filters */}
          <div 
            className="space-y-2 mb-3"
            role="radiogroup"
          >
            {PRICE_RANGES.map((range, index) => {
              const isSelected = filters.priceFrom === range.min && 
                               (range.max === 0 ? filters.priceTo === 0 : filters.priceTo === range.max);
              return (
                <button
                  key={index}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => handlePriceRangeSelect(range.min, range.max)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handlePriceRangeSelect(range.min, range.max);
                    }
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-md-body-small font-medium transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 focus-visible:ring-2 focus-visible:ring-md-sys-primary shadow-sm hover:shadow-md border ${
                    isSelected
                      ? 'bg-md-sys-primary text-md-sys-on-primary shadow-md border-md-sys-primary/30'
                      : 'bg-md-sys-surface-container hover:bg-md-sys-surface-container-high text-md-sys-on-surface border-md-sys-outline-variant'
                  }`}
                  aria-label={`Select price range: ${range.label}`}
                >
                  <div className="flex items-center justify-between">
                    <span>{range.label}</span>
                    {isSelected && (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom Price Range */}
          <div className="border-t border-md-sys-outline-variant pt-4">
            <div className="mb-3">
              <span className="text-md-body-medium font-medium text-md-sys-on-surface">Custom Range</span>
            </div>
            <div 
              className="grid grid-cols-2 gap-3"
              role="group"
            >
              <div>
                <label htmlFor="price-min" className="sr-only">
                  Minimum price in dollars
                </label>
                <input
                  id="price-min"
                  type="number"
                  placeholder="Min Price"
                  min="0"
                  step="1000"
                  value={filters.priceFrom || ''}
                  onChange={(e) => onFilterChange({ priceFrom: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2.5 border border-md-sys-outline rounded-xl bg-md-sys-surface text-md-sys-on-surface focus:border-md-sys-primary focus:ring-2 focus:ring-md-sys-primary/20 focus:outline-none transition-all duration-200 text-md-body-small hover:bg-md-sys-surface-container/50"
                />
              </div>
              <div>
                <label htmlFor="price-max" className="sr-only">
                  Maximum price in dollars
                </label>
                <input
                  id="price-max"
                  type="number"
                  placeholder="Max Price"
                  min="0"
                  step="1000"
                  value={filters.priceTo || ''}
                  onChange={(e) => onFilterChange({ priceTo: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2.5 border border-md-sys-outline rounded-xl bg-md-sys-surface text-md-sys-on-surface focus:border-md-sys-primary focus:ring-2 focus:ring-md-sys-primary/20 focus:outline-none transition-all duration-200 text-md-body-small hover:bg-md-sys-surface-container/50"
                />
              </div>
            </div>
          </div>
        </fieldset>

        {/* Modification Categories */}
        <fieldset>
          <legend className="flex items-center gap-2 text-md-body-medium font-medium text-md-sys-on-surface mb-2">
            <span>Modification Categories</span>
            <Tooltip content="Select modification categories to filter vehicles. Multiple categories can be selected.">
              <HelpCircle className="w-3 h-3 text-md-sys-on-surface-variant cursor-help" />
            </Tooltip>
          </legend>
          <MultiSelect
            options={MODIFICATION_CATEGORIES.map(category => ({
              value: category,
              label: category
            }))}
            value={filters.modificationCategories}
            onChange={(newCategories) => onFilterChange({ modificationCategories: newCategories })}
            placeholder="Select categories..."
          />
        </fieldset>

        {/* Specific Modifications */}
        <fieldset>
          <legend className="flex items-center justify-between text-md-body-medium font-medium text-md-sys-on-surface mb-2">
            <div className="flex items-center gap-2">
              <span>Specific Modifications</span>
              <Tooltip content="Search and select specific modifications to filter vehicles. You can add custom modifications by typing and pressing Enter.">
                <HelpCircle className="w-3 h-3 text-md-sys-on-surface-variant cursor-help" />
              </Tooltip>
            </div>
            {filters.specificModifications.length > 0 && (
              <span 
                className="text-md-label-small bg-md-sys-primary text-md-sys-on-primary px-3 py-1.5 rounded-full font-medium shadow-sm"
                aria-label={`${filters.specificModifications.length} modifications selected`}
              >
                {filters.specificModifications.length}
              </span>
            )}
          </legend>
          
          {/* Search Input with debouncing */}
          <div className="mb-4">
            <label htmlFor="mod-search" className="sr-only">
              Search for specific modifications
            </label>
            <input
              id="mod-search"
              type="text"
              placeholder="Search modifications..."
              value={modificationSearch}
              onChange={(e) => setModificationSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleModificationSearch(modificationSearch);
                }
              }}
              className="w-full px-4 py-3 border border-md-sys-outline rounded-xl bg-md-sys-surface text-md-sys-on-surface focus:border-md-sys-primary focus:ring-2 focus:ring-md-sys-primary/20 focus:outline-none transition-all duration-200 text-md-body-medium hover:bg-md-sys-surface-container/50"
            />
            {modificationSearch.trim() && (
              <button
                type="button"
                onClick={() => handleModificationSearch(modificationSearch)}
                className="mt-3 flex items-center gap-2 px-4 py-2 bg-md-sys-tertiary-container text-md-sys-on-tertiary-container rounded-xl hover:bg-md-sys-tertiary-container/80 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-md-sys-tertiary/20 shadow-sm hover:shadow-md border border-md-sys-tertiary/20"
                aria-label={`Add custom modification: ${modificationSearch.trim()}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="text-md-label-medium font-medium">Add "{modificationSearch.trim()}"</span>
              </button>
            )}
          </div>

          {/* Selected Modifications */}
          {filters.specificModifications.length > 0 && (
            <div className="mb-4" role="region" aria-labelledby="selected-mods-heading">
              <h4 id="selected-mods-heading" className="text-md-body-medium font-medium text-md-sys-on-surface mb-3">
                Selected Modifications ({filters.specificModifications.length})
              </h4>
              <div className="flex flex-wrap gap-2" role="list">
                {filters.specificModifications.map((mod) => (
                  <div
                    key={mod}
                    className="inline-flex items-center px-3 py-2 rounded-xl text-md-label-medium bg-md-sys-primary-container text-md-sys-on-primary-container border border-md-sys-primary/20 shadow-sm"
                    role="listitem"
                  >
                    <span>{mod}</span>
                    <button
                      type="button"
                      onClick={() => handleSpecificModificationToggle(mod)}
                      className="ml-2 p-1 hover:bg-md-sys-primary/20 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-md-sys-primary/30"
                      aria-label={`Remove ${mod} from selected modifications`}
                      title={`Remove ${mod}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Popular Modifications */}
          <div className="border border-md-sys-outline-variant rounded-xl p-4 bg-md-sys-surface-container/30">
            <h4 className="text-md-body-medium font-medium text-md-sys-on-surface mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-md-sys-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Popular Modifications
            </h4>
            <div 
              className="max-h-32 overflow-y-auto space-y-2"
              role="list"
              aria-label="Popular modifications list"
            >
              {filteredModifications.map((mod) => {
                const isSelected = filters.specificModifications.includes(mod.value);
                return (
                  <button
                    key={mod.value}
                    type="button"
                    onClick={() => handleSpecificModificationToggle(mod.value)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-md-body-small transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 focus-visible:ring-2 focus-visible:ring-md-sys-primary shadow-sm hover:shadow-md border ${
                      isSelected
                        ? 'bg-md-sys-primary text-md-sys-on-primary shadow-md border-md-sys-primary/30'
                        : 'bg-md-sys-surface-container hover:bg-md-sys-surface-container-high text-md-sys-on-surface border-md-sys-outline-variant'
                    }`}
                    role="listitem"
                    aria-pressed={isSelected}
                    aria-label={`${isSelected ? 'Remove' : 'Add'} ${mod.label} modification (${mod.count} vehicles)`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{mod.label}</span>
                      <span className="text-current/70 text-md-body-small">({mod.count})</span>
                    </div>
                  </button>
                );
              })}
              {filteredModifications.length === 0 && (
                <div className="text-md-body-small text-md-sys-on-surface-variant py-4 text-center">
                  {modificationSearch.trim() ? 'No modifications found' : 'Loading modifications...'}
                </div>
              )}
            </div>
          </div>
        </fieldset>

        {/* Modification Date Range */}
        <fieldset>
          <legend className="flex items-center gap-2 text-md-body-medium font-medium text-md-sys-on-surface mb-2">
            <span>Modification Date Range</span>
            <Tooltip content="Filter by when modifications were performed. Select date range to narrow results.">
              <HelpCircle className="w-3 h-3 text-md-sys-on-surface-variant cursor-help" />
            </Tooltip>
          </legend>
          <div 
            className="grid grid-cols-2 gap-3"
            role="group"
          >
            <div>
              <label htmlFor="mod-date-from" className="sr-only">
                Modification date from
              </label>
              <input
                id="mod-date-from"
                type="month"
                value={filters.modDateFrom}
                onChange={(e) => onFilterChange({ modDateFrom: e.target.value })}
                className="w-full px-3 py-2.5 border border-md-sys-outline rounded-xl bg-md-sys-surface text-md-sys-on-surface focus:border-md-sys-primary focus:ring-2 focus:ring-md-sys-primary/20 focus:outline-none transition-all duration-200 text-md-body-small hover:bg-md-sys-surface-container/50"
              />
            </div>
            <div>
              <label htmlFor="mod-date-to" className="sr-only">
                Modification date to
              </label>
              <input
                id="mod-date-to"
                type="month"
                value={filters.modDateTo}
                onChange={(e) => onFilterChange({ modDateTo: e.target.value })}
                className="w-full px-3 py-2.5 border border-md-sys-outline rounded-xl bg-md-sys-surface text-md-sys-on-surface focus:border-md-sys-primary focus:ring-2 focus:ring-md-sys-primary/20 focus:outline-none transition-all duration-200 text-md-body-small hover:bg-md-sys-surface-container/50"
              />
            </div>
          </div>
        </fieldset>
      </form>
    </aside>
  );
} 