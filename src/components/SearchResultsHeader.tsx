'use client';

import { useState } from 'react';
import { MagnifyingGlassIcon, Squares2X2Icon, ListBulletIcon, ChartBarIcon } from '@heroicons/react/24/outline';

interface SearchResultsHeaderProps {
  searchQuery?: string;
  totalResults: number;
  currentPage: number;
  itemsPerPage: number;
  sortBy: string;
  onSortChange: (sortBy: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  loading?: boolean;
  executionTime?: number;
  showAnalytics?: boolean;
  onAnalyticsToggle?: () => void;
  relevanceScore?: number;
}

export default function SearchResultsHeader({
  searchQuery,
  totalResults,
  currentPage,
  itemsPerPage,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  loading = false,
  executionTime,
  showAnalytics = false,
  onAnalyticsToggle,
  relevanceScore
}: SearchResultsHeaderProps) {
  const [showSortOptions, setShowSortOptions] = useState(false);

  const startResult = (currentPage - 1) * itemsPerPage + 1;
  const endResult = Math.min(currentPage * itemsPerPage, totalResults);

  const sortOptions = [
    { value: 'relevance', label: 'Relevance', available: !!searchQuery },
    { value: 'newest', label: 'Newest First', available: true },
    { value: 'price_low', label: 'Price: Low to High', available: true },
    { value: 'price_high', label: 'Price: High to Low', available: true },
    { value: 'year_new', label: 'Year: Newest First', available: true },
    { value: 'year_old', label: 'Year: Oldest First', available: true },
    { value: 'mileage_low', label: 'Mileage: Low to High', available: true },
    { value: 'popular', label: 'Most Popular', available: true }
  ].filter(option => option.available);

  const getSortLabel = (value: string) => {
    return sortOptions.find(option => option.value === value)?.label || 'Sort';
  };

  return (
    <div className="bg-md-sys-surface-container rounded-xl shadow-md border border-md-sys-outline-variant p-6 mb-6">
      {/* Main Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
        {/* Search Info */}
        <div className="flex-1">
          {searchQuery ? (
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-md-sys-primary-container rounded-lg">
                <MagnifyingGlassIcon className="w-5 h-5 text-md-sys-on-primary-container" />
              </div>
              <div>
                <h1 className="text-md-title-large font-medium text-md-sys-on-surface">
                  Search results for "{searchQuery}"
                </h1>
                {relevanceScore && (
                  <span className="inline-flex items-center mt-1 px-3 py-1.5 rounded-full text-md-label-small font-medium bg-md-sys-tertiary-container text-md-sys-on-tertiary-container border border-md-sys-tertiary/20">
                    {Math.round(relevanceScore * 100)}% match
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="mb-3">
              <h1 className="text-md-title-large font-medium text-md-sys-on-surface">
                All Listings
              </h1>
            </div>
          )}
          
          {/* Results Count and Performance Info */}
          <div className="flex items-center gap-4">
            <div className="bg-md-sys-primary-container text-md-sys-on-primary-container px-4 py-2.5 rounded-xl">
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-md-sys-on-primary-container/30 border-t-md-sys-on-primary-container rounded-full animate-spin"></div>
                  <span className="text-md-body-medium font-medium">Searching...</span>
                </div>
              ) : totalResults > 0 ? (
                <span className="text-md-body-medium font-medium">
                  Showing {startResult.toLocaleString()}-{endResult.toLocaleString()} of {totalResults.toLocaleString()} results
                </span>
              ) : (
                <span className="text-md-body-medium font-medium">No results found</span>
              )}
            </div>
            
            {executionTime && (
              <div className="bg-md-sys-secondary-container text-md-sys-on-secondary-container px-3 py-2 rounded-lg">
                <span className="text-md-body-small font-medium">
                  ({executionTime}ms)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Analytics Toggle */}
          {onAnalyticsToggle && (
            <button
              onClick={onAnalyticsToggle}
              className={`p-3 rounded-xl transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 shadow-sm hover:shadow-md ${
                showAnalytics 
                  ? 'bg-md-sys-primary text-md-sys-on-primary shadow-md' 
                  : 'bg-md-sys-surface-container-high text-md-sys-on-surface-variant hover:bg-md-sys-surface-container-highest'
              }`}
              title={showAnalytics ? 'Hide analytics' : 'Show analytics'}
            >
              <ChartBarIcon className="w-5 h-5" />
            </button>
          )}

          {/* View Mode Toggle */}
          <div className="flex bg-md-sys-surface-container-high rounded-xl p-1.5 border border-md-sys-outline-variant">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-2.5 rounded-lg transition-all duration-200 ${
                viewMode === 'grid'
                  ? 'bg-md-sys-primary text-md-sys-on-primary shadow-sm'
                  : 'text-md-sys-on-surface-variant hover:text-md-sys-on-surface hover:bg-md-sys-surface-container'
              }`}
              title="Grid view"
            >
              <Squares2X2Icon className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-2.5 rounded-lg transition-all duration-200 ${
                viewMode === 'list'
                  ? 'bg-md-sys-primary text-md-sys-on-primary shadow-sm'
                  : 'text-md-sys-on-surface-variant hover:text-md-sys-on-surface hover:bg-md-sys-surface-container'
              }`}
              title="List view"
            >
              <ListBulletIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortOptions(!showSortOptions)}
              className="flex items-center gap-3 px-4 py-3 bg-md-sys-surface-container-high border border-md-sys-outline-variant rounded-xl hover:bg-md-sys-surface-container-highest transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 shadow-sm hover:shadow-md"
              disabled={loading}
            >
              <span className="text-md-body-medium font-medium text-md-sys-on-surface">
                {getSortLabel(sortBy)}
              </span>
              <svg
                className={`w-4 h-4 text-md-sys-on-surface-variant transition-transform ${showSortOptions ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showSortOptions && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-md-sys-surface-container rounded-xl shadow-lg border border-md-sys-outline-variant z-50 overflow-hidden">
                <div className="py-2">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onSortChange(option.value);
                        setShowSortOptions(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-md-body-medium hover:bg-md-sys-surface-container-high transition-colors ${
                        sortBy === option.value
                          ? 'text-md-sys-primary bg-md-sys-primary-container font-medium'
                          : 'text-md-sys-on-surface'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{option.label}</span>
                        {sortBy === option.value && (
                          <svg className="w-5 h-5 text-md-sys-primary" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Suggestions for No Results */}
      {!loading && totalResults === 0 && searchQuery && (
        <div className="bg-md-sys-tertiary-container border border-md-sys-tertiary/20 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 p-2 bg-md-sys-tertiary/10 rounded-lg">
              <svg className="w-6 h-6 text-md-sys-tertiary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-md-title-medium font-medium text-md-sys-on-tertiary-container mb-2">
                No results found for "{searchQuery}"
              </h3>
              <div className="text-md-body-medium text-md-sys-on-tertiary-container/80">
                <p className="mb-3">Try adjusting your search:</p>
                <ul className="list-disc list-inside space-y-1.5 text-md-body-small">
                  <li>Check your spelling or try different keywords</li>
                  <li>Use broader search terms (e.g., "BMW" instead of "BMW M3 E46")</li>
                  <li>Remove some filters to see more results</li>
                  <li>Try searching for the make or model separately</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Performance Analytics Bar (if enabled) */}
      {showAnalytics && executionTime && (
        <div className="mt-6 pt-6 border-t border-md-sys-outline-variant">
          <div className="bg-md-sys-surface-container-high rounded-xl p-4">
            <div className="flex items-center justify-between text-md-body-small text-md-sys-on-surface-variant">
              <div className="flex items-center gap-6">
                <span>Query executed in {executionTime}ms</span>
                {relevanceScore && (
                  <span>Average relevance: {Math.round(relevanceScore * 100)}%</span>
                )}
                <span>{totalResults} results processed</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-20 h-2 bg-md-sys-outline-variant rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      executionTime < 100 ? 'bg-green-500' :
                      executionTime < 500 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min((executionTime / 1000) * 100, 100)}%` }}
                  />
                </div>
                <span className={`font-medium text-md-label-medium ${
                  executionTime < 100 ? 'text-green-600' :
                  executionTime < 500 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {executionTime < 100 ? 'Fast' :
                   executionTime < 500 ? 'Good' : 'Slow'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close sort dropdown */}
      {showSortOptions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSortOptions(false)}
        />
      )}
    </div>
  );
} 