'use client';

import { XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline';

interface FilterBreadcrumbsProps {
  filters: {
    query?: string;
    make?: string;
    model?: string;
    yearFrom?: number;
    yearTo?: number;
    priceFrom?: number;
    priceTo?: number;
    mileageFrom?: number;
    mileageTo?: number;
    condition?: string[];
    transmission?: string[];
    location?: string;
    modificationCategories?: string[];
    specificModifications?: string[];
    modDateFrom?: string;
    modDateTo?: string;
    hasModifications?: boolean;
    sortBy?: string;
  };
  onRemoveFilter: (filterKey: string, value?: string | number) => void;
  onClearAll: () => void;
}

interface Breadcrumb {
  key: string;
  label: string;
  value?: string | number;
  removable: boolean;
}

export default function FilterBreadcrumbs({ 
  filters, 
  onRemoveFilter, 
  onClearAll 
}: FilterBreadcrumbsProps) {
  
  const generateBreadcrumbs = (): Breadcrumb[] => {
    const breadcrumbs: Breadcrumb[] = [];

    // Search query
    if (filters.query?.trim()) {
      breadcrumbs.push({
        key: 'query',
        label: `Search: "${filters.query}"`,
        removable: true
      });
    }

    // Make
    if (filters.make) {
      breadcrumbs.push({
        key: 'make',
        label: `Make: ${filters.make}`,
        removable: true
      });
    }

    // Model
    if (filters.model) {
      breadcrumbs.push({
        key: 'model',
        label: `Model: ${filters.model}`,
        removable: true
      });
    }

    // Year range
    if (filters.yearFrom && filters.yearTo && filters.yearFrom !== filters.yearTo) {
      breadcrumbs.push({
        key: 'yearRange',
        label: `Year: ${filters.yearFrom}-${filters.yearTo}`,
        removable: true
      });
    } else if (filters.yearFrom) {
      breadcrumbs.push({
        key: 'yearFrom',
        label: `Year from: ${filters.yearFrom}`,
        removable: true
      });
    } else if (filters.yearTo) {
      breadcrumbs.push({
        key: 'yearTo',
        label: `Year to: ${filters.yearTo}`,
        removable: true
      });
    }

    // Price range
    if (filters.priceFrom && filters.priceTo && filters.priceFrom !== filters.priceTo) {
      breadcrumbs.push({
        key: 'priceRange',
        label: `Price: $${filters.priceFrom.toLocaleString()}-$${filters.priceTo.toLocaleString()}`,
        removable: true
      });
    } else if (filters.priceFrom && filters.priceFrom > 0) {
      breadcrumbs.push({
        key: 'priceFrom',
        label: `Price from: $${filters.priceFrom.toLocaleString()}`,
        removable: true
      });
    } else if (filters.priceTo && filters.priceTo > 0) {
      breadcrumbs.push({
        key: 'priceTo',
        label: `Price to: $${filters.priceTo.toLocaleString()}`,
        removable: true
      });
    }

    // Mileage range
    if (filters.mileageFrom && filters.mileageTo && filters.mileageFrom !== filters.mileageTo) {
      breadcrumbs.push({
        key: 'mileageRange',
        label: `Mileage: ${filters.mileageFrom.toLocaleString()}-${filters.mileageTo.toLocaleString()} miles`,
        removable: true
      });
    } else if (filters.mileageFrom && filters.mileageFrom > 0) {
      breadcrumbs.push({
        key: 'mileageFrom',
        label: `Mileage from: ${filters.mileageFrom.toLocaleString()} miles`,
        removable: true
      });
    } else if (filters.mileageTo && filters.mileageTo > 0) {
      breadcrumbs.push({
        key: 'mileageTo',
        label: `Mileage to: ${filters.mileageTo.toLocaleString()} miles`,
        removable: true
      });
    }

    // Condition
    if (filters.condition && filters.condition.length > 0) {
      filters.condition.forEach(condition => {
        breadcrumbs.push({
          key: 'condition',
          label: `Condition: ${condition}`,
          value: condition,
          removable: true
        });
      });
    }

    // Transmission
    if (filters.transmission && filters.transmission.length > 0) {
      filters.transmission.forEach(transmission => {
        breadcrumbs.push({
          key: 'transmission',
          label: `Transmission: ${transmission}`,
          value: transmission,
          removable: true
        });
      });
    }

    // Location
    if (filters.location) {
      breadcrumbs.push({
        key: 'location',
        label: `Location: ${filters.location}`,
        removable: true
      });
    }

    // Modification categories
    if (filters.modificationCategories && filters.modificationCategories.length > 0) {
      filters.modificationCategories.forEach(category => {
        breadcrumbs.push({
          key: 'modificationCategories',
          label: `Mod Category: ${category}`,
          value: category,
          removable: true
        });
      });
    }

    // Specific modifications
    if (filters.specificModifications && filters.specificModifications.length > 0) {
      filters.specificModifications.forEach(mod => {
        breadcrumbs.push({
          key: 'specificModifications',
          label: `Modification: ${mod}`,
          value: mod,
          removable: true
        });
      });
    }

    // Modification date range
    if (filters.modDateFrom && filters.modDateTo) {
      const fromDate = new Date(filters.modDateFrom).toLocaleDateString();
      const toDate = new Date(filters.modDateTo).toLocaleDateString();
      breadcrumbs.push({
        key: 'modDateRange',
        label: `Mod Date: ${fromDate} - ${toDate}`,
        removable: true
      });
    } else if (filters.modDateFrom) {
      const fromDate = new Date(filters.modDateFrom).toLocaleDateString();
      breadcrumbs.push({
        key: 'modDateFrom',
        label: `Mod Date from: ${fromDate}`,
        removable: true
      });
    } else if (filters.modDateTo) {
      const toDate = new Date(filters.modDateTo).toLocaleDateString();
      breadcrumbs.push({
        key: 'modDateTo',
        label: `Mod Date to: ${toDate}`,
        removable: true
      });
    }

    // Has modifications
    if (filters.hasModifications) {
      breadcrumbs.push({
        key: 'hasModifications',
        label: 'Has Modifications',
        removable: true
      });
    }

    // Sort (if not default)
    if (filters.sortBy && filters.sortBy !== 'newest' && filters.sortBy !== 'created_at') {
      const sortLabels: { [key: string]: string } = {
        'relevance': 'Sort: Relevance',
        'price_low': 'Sort: Price Low to High',
        'price_high': 'Sort: Price High to Low',
        'year_new': 'Sort: Newest Year',
        'year_old': 'Sort: Oldest Year',
        'mileage_low': 'Sort: Lowest Mileage',
        'popular': 'Sort: Most Popular'
      };
      
      if (sortLabels[filters.sortBy]) {
        breadcrumbs.push({
          key: 'sortBy',
          label: sortLabels[filters.sortBy],
          removable: true
        });
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();
  
  const handleRemove = (breadcrumb: Breadcrumb) => {
    // Handle special cases for range filters
    if (breadcrumb.key === 'yearRange') {
      onRemoveFilter('yearFrom');
      onRemoveFilter('yearTo');
    } else if (breadcrumb.key === 'priceRange') {
      onRemoveFilter('priceFrom');
      onRemoveFilter('priceTo');
    } else if (breadcrumb.key === 'mileageRange') {
      onRemoveFilter('mileageFrom');
      onRemoveFilter('mileageTo');
    } else if (breadcrumb.key === 'modDateRange') {
      onRemoveFilter('modDateFrom');
      onRemoveFilter('modDateTo');
    } else {
      onRemoveFilter(breadcrumb.key, breadcrumb.value);
    }
  };

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <div className="bg-md-sys-surface-container rounded-xl shadow-md border border-md-sys-outline-variant p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-md-sys-secondary-container rounded-lg">
            <FunnelIcon className="w-5 h-5 text-md-sys-on-secondary-container" />
          </div>
          <div>
            <h3 className="text-md-title-medium font-medium text-md-sys-on-surface">
              Active Filters
            </h3>
            <p className="text-md-body-small text-md-sys-on-surface-variant">
              {breadcrumbs.length} {breadcrumbs.length === 1 ? 'filter' : 'filters'} applied
            </p>
          </div>
        </div>
        
        {breadcrumbs.length > 1 && (
          <button
            onClick={onClearAll}
            className="flex items-center gap-2 px-4 py-2.5 bg-md-sys-error-container text-md-sys-on-error-container rounded-xl hover:bg-md-sys-error-container/90 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-md-sys-error/20 shadow-sm hover:shadow-md border border-md-sys-error/20"
          >
            <XMarkIcon className="w-4 h-4" />
            <span className="text-md-label-medium font-medium">Clear All</span>
          </button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-3">
        {breadcrumbs.map((breadcrumb, index) => (
          <div
            key={`${breadcrumb.key}-${breadcrumb.value || index}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-md-sys-primary-container text-md-sys-on-primary-container rounded-xl text-md-body-medium font-medium border border-md-sys-primary/20 hover:bg-md-sys-primary-container/80 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md group"
          >
            <span>{breadcrumb.label}</span>
            {breadcrumb.removable && (
              <button
                onClick={() => handleRemove(breadcrumb)}
                className="ml-1 flex-shrink-0 p-1 text-md-sys-on-primary-container/70 hover:text-md-sys-on-primary-container hover:bg-md-sys-primary/20 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-md-sys-primary/30"
                title={`Remove ${breadcrumb.label}`}
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Helper text */}
      <div className="mt-4 pt-4 border-t border-md-sys-outline-variant">
        <p className="text-md-body-small text-md-sys-on-surface-variant">
          Click the <span className="inline-flex items-center mx-1 p-0.5 bg-md-sys-on-surface-variant/20 rounded"><XMarkIcon className="w-3 h-3" /></span> on any filter to remove it, or use "Clear All" to reset all filters.
        </p>
      </div>
    </div>
  );
} 