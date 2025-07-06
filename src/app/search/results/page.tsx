'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDynamicSearch } from '@/hooks/useDynamicSearch';
import SearchResultsHeader from '@/components/SearchResultsHeader';
import FilterBreadcrumbs from '@/components/FilterBreadcrumbs';
import EnhancedListingCard from '@/components/EnhancedListingCard';
import AdvancedPagination from '@/components/AdvancedPagination';
import NoResults from '@/components/NoResults';
import FilterSidebar from '@/components/FilterSidebar';
import SearchInput from '@/components/SearchInput';
import LoadingSpinner from '@/components/LoadingSpinner';
import SearchAnalyticsDashboard from '@/components/SearchAnalyticsDashboard';
import { MaterialYouIcon } from '@/components/ui/MaterialYouIcon';

interface SearchFilters {
  query: string;
  make: string;
  model: string;
  yearFrom: number;
  yearTo: number;
  priceFrom: number;
  priceTo: number;
  mileageFrom: number;
  mileageTo: number;
  condition: string[];
  transmission: string[];
  location: string;
  modificationCategories: string[];
  specificModifications: string[];
  modDateFrom: string;
  modDateTo: string;
  hasModifications: boolean;
  sortBy: string;
}

const DEFAULT_FILTERS: SearchFilters = {
  query: '',
  make: '',
  model: '',
  yearFrom: 0,
  yearTo: 0,
  priceFrom: 0,
  priceTo: 0,
  mileageFrom: 0,
  mileageTo: 0,
  condition: [],
  transmission: [],
  location: '',
  modificationCategories: [],
  specificModifications: [],
  modDateFrom: '',
  modDateTo: '',
  hasModifications: false,
  sortBy: 'relevance'
};

const ITEMS_PER_PAGE_OPTIONS = [12, 24, 48, 96];

export default function SearchResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State management
  const [filters, setFilters] = useState<SearchFilters>(() => {
    // Initialize from URL parameters
    return {
      query: searchParams.get('q') || '',
      make: searchParams.get('make') || '',
      model: searchParams.get('model') || '',
      yearFrom: parseInt(searchParams.get('yearFrom') || '0'),
      yearTo: parseInt(searchParams.get('yearTo') || '0'),
      priceFrom: parseInt(searchParams.get('priceFrom') || '0'),
      priceTo: parseInt(searchParams.get('priceTo') || '0'),
      mileageFrom: parseInt(searchParams.get('mileageFrom') || '0'),
      mileageTo: parseInt(searchParams.get('mileageTo') || '0'),
      condition: searchParams.get('condition')?.split(',').filter(Boolean) || [],
      transmission: searchParams.get('transmission')?.split(',').filter(Boolean) || [],
      location: searchParams.get('location') || '',
      modificationCategories: searchParams.get('modCategories')?.split(',').filter(Boolean) || [],
      specificModifications: searchParams.get('specificMods')?.split(',').filter(Boolean) || [],
      modDateFrom: searchParams.get('modDateFrom') || '',
      modDateTo: searchParams.get('modDateTo') || '',
      hasModifications: searchParams.get('hasModifications') === 'true',
      sortBy: searchParams.get('sortBy') || (searchParams.get('q') ? 'relevance' : 'newest')
    };
  });

  const [currentPage, setCurrentPage] = useState(() => {
    return parseInt(searchParams.get('page') || '1');
  });

  const [itemsPerPage, setItemsPerPage] = useState(() => {
    return parseInt(searchParams.get('limit') || '24');
  });

  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (searchParams.get('view') as 'grid' | 'list') || 'grid';
  });

  const [showFilters, setShowFilters] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [favoriteListings, setFavoriteListings] = useState<Set<string>>(new Set());

  // Search hook integration
  const searchHook = useDynamicSearch({
    debounceMs: 300
  });

  // Memoized search query for the dynamic search system
  const searchQuery = useMemo(() => {
    const query = {
      searchType: 'advanced' as const,
      query: filters.query,
      filters: {
        ...(filters.make && { make: { eq: filters.make } }),
        ...(filters.model && { model: { eq: filters.model } }),
        ...(filters.yearFrom > 0 && { year: { gte: filters.yearFrom } }),
        ...(filters.yearTo > 0 && { year: { lte: filters.yearTo } }),
        ...(filters.priceFrom > 0 && { price: { gte: filters.priceFrom } }),
        ...(filters.priceTo > 0 && { price: { lte: filters.priceTo } }),
        ...(filters.mileageFrom > 0 && { mileage: { gte: filters.mileageFrom } }),
        ...(filters.mileageTo > 0 && { mileage: { lte: filters.mileageTo } }),
        ...(filters.condition.length > 0 && { condition: { in: filters.condition } }),
        ...(filters.transmission.length > 0 && { transmission: { in: filters.transmission } }),
        ...(filters.location && { location: { ilike: `%${filters.location}%` } }),
        ...(filters.hasModifications && { 'modifications.count': { gt: 0 } })
      },
      sort: {
        field: filters.sortBy === 'relevance' ? '_score' :
               filters.sortBy === 'price_low' ? 'price' :
               filters.sortBy === 'price_high' ? 'price' :
               filters.sortBy === 'year_new' ? 'year' :
               filters.sortBy === 'year_old' ? 'year' :
               filters.sortBy === 'mileage_low' ? 'mileage' : 'created_at',
        direction: filters.sortBy === 'price_high' || 
                  filters.sortBy === 'year_new' || 
                  filters.sortBy === 'newest' ? 'desc' : 'asc'
      },
      pagination: {
        page: currentPage,
        limit: itemsPerPage
      },
      include: ['listing_images', 'modifications']
    };

    return query;
  }, [filters, currentPage, itemsPerPage]);

  // Execute search when query changes
  useEffect(() => {
    if (searchHook.search) {
      searchHook.search(searchQuery as any);
    }
  }, [searchQuery, searchHook.search]);

  // URL synchronization
  const updateURL = useCallback((newFilters: SearchFilters, newPage: number, newItemsPerPage: number, newViewMode: 'grid' | 'list') => {
    const params = new URLSearchParams();
    
    if (newFilters.query) params.set('q', newFilters.query);
    if (newFilters.make) params.set('make', newFilters.make);
    if (newFilters.model) params.set('model', newFilters.model);
    if (newFilters.yearFrom > 0) params.set('yearFrom', newFilters.yearFrom.toString());
    if (newFilters.yearTo > 0) params.set('yearTo', newFilters.yearTo.toString());
    if (newFilters.priceFrom > 0) params.set('priceFrom', newFilters.priceFrom.toString());
    if (newFilters.priceTo > 0) params.set('priceTo', newFilters.priceTo.toString());
    if (newFilters.mileageFrom > 0) params.set('mileageFrom', newFilters.mileageFrom.toString());
    if (newFilters.mileageTo > 0) params.set('mileageTo', newFilters.mileageTo.toString());
    if (newFilters.condition.length > 0) params.set('condition', newFilters.condition.join(','));
    if (newFilters.transmission.length > 0) params.set('transmission', newFilters.transmission.join(','));
    if (newFilters.location) params.set('location', newFilters.location);
    if (newFilters.modificationCategories.length > 0) params.set('modCategories', newFilters.modificationCategories.join(','));
    if (newFilters.specificModifications.length > 0) params.set('specificMods', newFilters.specificModifications.join(','));
    if (newFilters.modDateFrom) params.set('modDateFrom', newFilters.modDateFrom);
    if (newFilters.modDateTo) params.set('modDateTo', newFilters.modDateTo);
    if (newFilters.hasModifications) params.set('hasModifications', 'true');
    if (newFilters.sortBy !== 'newest') params.set('sortBy', newFilters.sortBy);
    if (newPage > 1) params.set('page', newPage.toString());
    if (newItemsPerPage !== 24) params.set('limit', newItemsPerPage.toString());
    if (newViewMode !== 'grid') params.set('view', newViewMode);

    const newURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    router.push(newURL, { scroll: false });
  }, [router]);

  // Event handlers
  const handleFilterChange = useCallback((newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    setCurrentPage(1);
    updateURL(updatedFilters, 1, itemsPerPage, viewMode);
  }, [filters, itemsPerPage, viewMode, updateURL]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    updateURL(filters, page, itemsPerPage, viewMode);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [filters, itemsPerPage, viewMode, updateURL]);

  const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
    updateURL(filters, 1, newItemsPerPage, viewMode);
  }, [filters, viewMode, updateURL]);

  const handleViewModeChange = useCallback((newViewMode: 'grid' | 'list') => {
    setViewMode(newViewMode);
    updateURL(filters, currentPage, itemsPerPage, newViewMode);
  }, [filters, currentPage, itemsPerPage, updateURL]);

  const handleSortChange = useCallback((sortBy: string) => {
    handleFilterChange({ sortBy });
  }, [handleFilterChange]);

  const handleSearch = useCallback((query: string) => {
    handleFilterChange({ query });
  }, [handleFilterChange]);

  const handleRemoveFilter = useCallback((filterKey: string, value?: string | number) => {
    const newFilters = { ...filters };
    
    if (value !== undefined) {
      // Handle array filters
      if (filterKey === 'condition' || filterKey === 'transmission' || 
          filterKey === 'modificationCategories' || filterKey === 'specificModifications') {
        const currentArray = newFilters[filterKey] as string[];
        newFilters[filterKey] = currentArray.filter(item => item !== value) as any;
      }
    } else {
      // Handle single value filters
      if (filterKey in DEFAULT_FILTERS) {
        (newFilters as any)[filterKey] = (DEFAULT_FILTERS as any)[filterKey];
      }
    }
    
    setFilters(newFilters);
    setCurrentPage(1);
    updateURL(newFilters, 1, itemsPerPage, viewMode);
  }, [filters, itemsPerPage, viewMode, updateURL]);

  const handleClearAllFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
    updateURL(DEFAULT_FILTERS, 1, itemsPerPage, viewMode);
  }, [itemsPerPage, viewMode, updateURL]);

  const handleFavoriteToggle = useCallback((listingId: string, isFavorited: boolean) => {
    setFavoriteListings(prev => {
      const newSet = new Set(prev);
      if (isFavorited) {
        newSet.add(listingId);
      } else {
        newSet.delete(listingId);
      }
      return newSet;
    });
    // TODO: Implement API call to save favorite state
  }, []);

  const handleSuggestedSearch = useCallback((query: string) => {
    handleFilterChange({ query });
  }, [handleFilterChange]);

  // Calculate filter count for display
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.make) count++;
    if (filters.model) count++;
    if (filters.yearFrom > 0 || filters.yearTo > 0) count++;
    if (filters.priceFrom > 0 || filters.priceTo > 0) count++;
    if (filters.mileageFrom > 0 || filters.mileageTo > 0) count++;
    if (filters.condition.length > 0) count += filters.condition.length;
    if (filters.transmission.length > 0) count += filters.transmission.length;
    if (filters.location) count++;
    if (filters.modificationCategories.length > 0) count += filters.modificationCategories.length;
    if (filters.specificModifications.length > 0) count += filters.specificModifications.length;
    if (filters.modDateFrom || filters.modDateTo) count++;
    if (filters.hasModifications) count++;
    return count;
  }, [filters]);

  // Get listings with relevance scores
    const enhancedListings = useMemo(() => {
    if (!(searchHook.data as any)?.data) return [];

    return (searchHook.data as any).data.map((listing: any) => ({
      ...listing,
              relevanceScore: listing._score || (searchHook as any).analytics?.averageRelevance || 0,
      views: Math.floor(Math.random() * 1000), // TODO: Get real view counts
      favorites: Math.floor(Math.random() * 50) // TODO: Get real favorite counts
    }));
  }, [searchHook.data, (searchHook as any).analytics?.averageRelevance]);

  return (
    <div className="min-h-screen bg-md-sys-surface">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Search */}
        <div className="mb-8">
          <h1 className="text-md-display-medium font-bold text-md-sys-on-surface mb-4">
            Search Results
          </h1>
          <div className="max-w-2xl">
            <SearchInput
              onSearch={handleSearch}
              value={filters.query}
              placeholder="Search for cars, makes, models, modifications..."
            />
          </div>
        </div>

                {/* Analytics Dashboard */}
        {/* {showAnalytics && (searchHook as any).analytics && (
          <div className="mb-6">
            <SearchAnalyticsDashboard
              analytics={{
                ...(searchHook as any).analytics,
                searchQuery: filters.query
              }}
            />
          </div>
        )} */}

        {/* Filter Toggle (Mobile) */}
        <div className="lg:hidden mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-3 px-6 py-4 bg-md-sys-primary-container text-md-sys-on-primary-container rounded-xl hover:bg-md-sys-primary-container/90 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 focus-visible:ring-2 focus-visible:ring-md-sys-primary shadow-md hover:shadow-lg border border-md-sys-outline-variant"
          >
            <div className="p-1 bg-md-sys-primary/10 rounded-lg">
              <MaterialYouIcon name="adjustments-horizontal" className="w-5 h-5" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-md-label-large font-medium">Filters</span>
              <span className="text-md-label-small opacity-80">
                {activeFilterCount > 0 ? `${activeFilterCount} active` : 'Tap to filter'}
              </span>
            </div>
            {activeFilterCount > 0 && (
              <div className="ml-auto">
                <span className="bg-md-sys-primary text-md-sys-on-primary rounded-full px-3 py-1.5 text-md-label-small font-bold min-w-[28px] text-center shadow-sm">
                  {activeFilterCount}
                </span>
              </div>
            )}
          </button>
        </div>

        <div className="flex gap-8">
          {/* Filter Sidebar */}
          <div className={`lg:block ${showFilters ? 'block' : 'hidden'} lg:w-80`}>
            <FilterSidebar 
              filters={filters}
              onFilterChange={handleFilterChange}
              totalItems={(searchHook.data as any)?.pagination?.totalItems || 0}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Results Header */}
            <SearchResultsHeader
              searchQuery={filters.query}
              totalResults={(searchHook.data as any)?.pagination?.totalItems || 0}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              sortBy={filters.sortBy}
              onSortChange={handleSortChange}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
              loading={searchHook.isLoading}
              executionTime={(searchHook as any).analytics?.executionTime}
              showAnalytics={showAnalytics}
              onAnalyticsToggle={() => setShowAnalytics(!showAnalytics)}
              relevanceScore={(searchHook as any).analytics?.averageRelevance}
            />

            {/* Filter Breadcrumbs */}
            <FilterBreadcrumbs
              filters={filters}
              onRemoveFilter={handleRemoveFilter}
              onClearAll={handleClearAllFilters}
            />

            {/* Loading State */}
            {searchHook.isLoading && (
              <div className="flex justify-center items-center py-20">
                <LoadingSpinner />
              </div>
            )}

            {/* Error State */}
            {searchHook.error && (
              <div className="bg-md-sys-error-container border border-md-sys-error/20 rounded-xl p-8 mb-8 shadow-md">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-3 bg-md-sys-error/10 rounded-full">
                    <MaterialYouIcon name="exclamation-triangle" className="w-8 h-8 text-md-sys-error" />
                  </div>
                  <div>
                    <h3 className="text-md-title-large font-medium text-md-sys-on-error-container mb-2">
                      Search Error
                    </h3>
                    <p className="text-md-body-medium text-md-sys-on-error-container/80 mb-6 max-w-md">
                      {searchHook.error}
                    </p>
                  </div>
                  <button
                    onClick={() => searchHook.search && searchHook.search(searchQuery as any)}
                    className="flex items-center gap-2 px-6 py-3 bg-md-sys-primary text-md-sys-on-primary rounded-xl hover:bg-md-sys-primary/90 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 focus-visible:ring-2 focus-visible:ring-md-sys-primary text-md-label-large font-medium shadow-md hover:shadow-lg"
                  >
                    <MaterialYouIcon name="refresh" className="w-5 h-5" />
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {/* Results Content */}
            {!searchHook.isLoading && !searchHook.error && (
              <>
                {enhancedListings.length > 0 ? (
                  <>
                    {/* Results Grid/List */}
                    <div className={`mb-8 ${
                      viewMode === 'grid' 
                        ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6'
                        : 'space-y-4'
                    }`}>
                      {enhancedListings.map((listing: any) => (
                        <EnhancedListingCard
                          key={listing.id}
                          listing={listing}
                          searchQuery={filters.query}
                          viewMode={viewMode}
                          showRelevanceScore={!!filters.query}
                          showAnalytics={showAnalytics}
                          onFavoriteToggle={handleFavoriteToggle}
                          isFavorited={favoriteListings.has(listing.id)}
                        />
                      ))}
                    </div>

                    {/* Pagination */}
                    <AdvancedPagination
                      currentPage={currentPage}
                      totalPages={(searchHook.data as any)?.pagination?.totalPages || 1}
                      totalItems={(searchHook.data as any)?.pagination?.totalItems || 0}
                      itemsPerPage={itemsPerPage}
                      onPageChange={handlePageChange}
                      onItemsPerPageChange={handleItemsPerPageChange}
                      loading={searchHook.isLoading}
                      itemsPerPageOptions={ITEMS_PER_PAGE_OPTIONS}
                      showItemsPerPage={true}
                      showJumpToPage={true}
                      showResultSummary={true}
                    />
                  </>
                ) : (
                  <NoResults
                    searchQuery={filters.query}
                    totalFilters={activeFilterCount}
                    onClearFilters={handleClearAllFilters}
                    onClearSearch={() => handleFilterChange({ query: '' })}
                    onSuggestedSearch={handleSuggestedSearch}
                    showPopularListings={true}
                    showSavedSearches={true}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 