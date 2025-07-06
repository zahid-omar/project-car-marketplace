'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import ListingCard from '@/components/ListingCard';
import FilterSidebar from '@/components/FilterSidebar';
import LoadingSpinner from '@/components/LoadingSpinner';
import SearchInput from '@/components/SearchInput';
import SearchResultsHeader from '@/components/SearchResultsHeader';
import FilterBreadcrumbs from '@/components/FilterBreadcrumbs';
import AdvancedPagination from '@/components/AdvancedPagination';
import NoResults from '@/components/NoResults';
import AppLayout from '@/components/AppLayout';
import { MaterialYouIcon } from '@/components/ui/MaterialYouIcon';

interface Listing {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  location: string;
  description: string;
  engine: string;
  transmission: string;
  mileage: number;
  condition: string;
  created_at: string;
  listing_images: {
    image_url: string;
    is_primary: boolean;
  }[];
  modifications?: {
    name: string;
    description: string;
    category: string;
    created_at: string;
  }[];
}

interface Filters {
  query: string;
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

const DEFAULT_FILTERS: Filters = {
  query: '',
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
};

const ITEMS_PER_PAGE_OPTIONS = [12, 24, 48, 96];

export default function BrowsePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(() => {
    // Initialize filters from URL parameters
    return {
      query: searchParams.get('q') || '',
      make: searchParams.get('make') || '',
      model: searchParams.get('model') || '',
      yearFrom: parseInt(searchParams.get('yearFrom') || '0'),
      yearTo: parseInt(searchParams.get('yearTo') || '0'),
      priceFrom: parseInt(searchParams.get('priceFrom') || '0'),
      priceTo: parseInt(searchParams.get('priceTo') || '0'),
      sortBy: searchParams.get('sortBy') || 'created_at',
      modificationCategories: searchParams.get('modCategories')?.split(',').filter(Boolean) || [],
      specificModifications: searchParams.get('specificMods')?.split(',').filter(Boolean) || [],
      modDateFrom: searchParams.get('modDateFrom') || '',
      modDateTo: searchParams.get('modDateTo') || '',
      hasModifications: searchParams.get('hasModifications') === 'true'
    };
  });
  const [currentPage, setCurrentPage] = useState(() => {
    return parseInt(searchParams.get('page') || '1');
  });
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    return parseInt(searchParams.get('limit') || '24');
  });
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAnalytics, setShowAnalytics] = useState(false);

  const supabase = createClientComponentClient();

  // Update URL with current filters and page
  const updateURL = (newFilters: Filters, newPage: number, newItemsPerPage: number = itemsPerPage) => {
    const params = new URLSearchParams();
    
    if (newFilters.query) params.set('q', newFilters.query);
    if (newFilters.make) params.set('make', newFilters.make);
    if (newFilters.model) params.set('model', newFilters.model);
    if (newFilters.yearFrom > 0) params.set('yearFrom', newFilters.yearFrom.toString());
    if (newFilters.yearTo > 0) params.set('yearTo', newFilters.yearTo.toString());
    if (newFilters.priceFrom > 0) params.set('priceFrom', newFilters.priceFrom.toString());
    if (newFilters.priceTo > 0) params.set('priceTo', newFilters.priceTo.toString());
    if (newFilters.sortBy !== 'created_at') params.set('sortBy', newFilters.sortBy);
    if (newPage > 1) params.set('page', newPage.toString());
    if (newItemsPerPage !== 24) params.set('limit', newItemsPerPage.toString());
    
    // Add modification filter parameters
    if (newFilters.modificationCategories.length > 0) {
      params.set('modCategories', newFilters.modificationCategories.join(','));
    }
    if (newFilters.specificModifications.length > 0) {
      params.set('specificMods', newFilters.specificModifications.join(','));
    }
    if (newFilters.modDateFrom) params.set('modDateFrom', newFilters.modDateFrom);
    if (newFilters.modDateTo) params.set('modDateTo', newFilters.modDateTo);
    if (newFilters.hasModifications) params.set('hasModifications', 'true');

    const newURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    router.push(newURL, { scroll: false });
  };

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Determine if we should use search API or regular listings API
      const shouldUseSearchAPI = filters.query.trim() || 
        filters.modificationCategories.length > 0 || 
        filters.specificModifications.length > 0 || 
        filters.modDateFrom || 
        filters.modDateTo || 
        filters.hasModifications;

      if (shouldUseSearchAPI) {
        // Use search API for full-text search or modification filtering
        const searchParams = new URLSearchParams({
          q: filters.query,
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
          sortBy: filters.sortBy === 'relevance' ? 'relevance' : 
                  filters.sortBy === 'price_low' ? 'price_low' :
                  filters.sortBy === 'price_high' ? 'price_high' :
                  filters.sortBy === 'year_new' ? 'year_new' :
                  filters.sortBy === 'year_old' ? 'year_old' : 'newest'
        });

        // Add standard filters to search params
        if (filters.make) searchParams.set('make', filters.make);
        if (filters.model) searchParams.set('model', filters.model);
        if (filters.yearFrom > 0) searchParams.set('yearFrom', filters.yearFrom.toString());
        if (filters.yearTo > 0) searchParams.set('yearTo', filters.yearTo.toString());
        if (filters.priceFrom > 0) searchParams.set('priceFrom', filters.priceFrom.toString());
        if (filters.priceTo > 0) searchParams.set('priceTo', filters.priceTo.toString());

        // Add modification filters to search params
        if (filters.modificationCategories.length > 0) {
          searchParams.set('modCategories', filters.modificationCategories.join(','));
        }
        if (filters.specificModifications.length > 0) {
          searchParams.set('specificMods', filters.specificModifications.join(','));
        }
        if (filters.modDateFrom) searchParams.set('modDateFrom', filters.modDateFrom);
        if (filters.modDateTo) searchParams.set('modDateTo', filters.modDateTo);
        if (filters.hasModifications) searchParams.set('hasModifications', 'true');

        const response = await fetch(`/api/search?${searchParams.toString()}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Search failed');
        }

        setListings(data.listings || []);
        setTotalItems(data.pagination.totalItems);
        setTotalPages(data.pagination.totalPages);
      } else {
        // Use regular Supabase query for basic filter-only browsing
        let query = supabase
          .from('listings')
          .select(`
            id,
            title,
            make,
            model,
            year,
            price,
            location,
            description,
            engine,
            transmission,
            mileage,
            condition,
            created_at,
            listing_images!inner(
              image_url,
              is_primary
            )
          `)
          .eq('status', 'active');

        // Apply filters
        if (filters.make) {
          query = query.ilike('make', `%${filters.make}%`);
        }
        if (filters.model) {
          query = query.ilike('model', `%${filters.model}%`);
        }
        if (filters.yearFrom > 0) {
          query = query.gte('year', filters.yearFrom);
        }
        if (filters.yearTo > 0) {
          query = query.lte('year', filters.yearTo);
        }
        if (filters.priceFrom > 0) {
          query = query.gte('price', filters.priceFrom);
        }
        if (filters.priceTo > 0) {
          query = query.lte('price', filters.priceTo);
        }

        // Get total count
        const countQuery = supabase
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        // Apply same filters to count query
        if (filters.make) {
          countQuery.ilike('make', `%${filters.make}%`);
        }
        if (filters.model) {
          countQuery.ilike('model', `%${filters.model}%`);
        }
        if (filters.yearFrom > 0) {
          countQuery.gte('year', filters.yearFrom);
        }
        if (filters.yearTo > 0) {
          countQuery.lte('year', filters.yearTo);
        }
        if (filters.priceFrom > 0) {
          countQuery.gte('price', filters.priceFrom);
        }
        if (filters.priceTo > 0) {
          countQuery.lte('price', filters.priceTo);
        }

        const { count } = await countQuery;
        const total = count || 0;
        setTotalItems(total);
        setTotalPages(Math.ceil(total / itemsPerPage));

        // Apply sorting and pagination
        query = query
          .order(filters.sortBy === 'price_low' ? 'price' : 
                 filters.sortBy === 'price_high' ? 'price' : 
                 filters.sortBy === 'year_new' ? 'year' : 
                 filters.sortBy === 'year_old' ? 'year' : 'created_at', 
                 { 
                   ascending: filters.sortBy === 'price_low' || 
                             filters.sortBy === 'year_old' || 
                             filters.sortBy === 'created_at' 
                 })
          .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

        const { data, error } = await query;

        if (error) throw error;

        setListings(data || []);
      }
    } catch (err) {
      console.error('Error fetching listings:', err);
      setError('Failed to load listings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [filters, currentPage, itemsPerPage]);

  const handleFilterChange = (newFilters: Partial<Filters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    setCurrentPage(1); // Reset to first page when filters change
    updateURL(updatedFilters, 1, itemsPerPage);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateURL(filters, page, itemsPerPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
    updateURL(filters, 1, newItemsPerPage);
  };

  const handleSearch = (query: string) => {
    const updatedFilters = { ...filters, query };
    setFilters(updatedFilters);
    setCurrentPage(1);
    updateURL(updatedFilters, 1, itemsPerPage);
  };

  const handleRemoveFilter = (filterKey: string, value?: string | number) => {
    const newFilters = { ...filters };
    
    if (value !== undefined) {
      // Handle array filters
      if (filterKey === 'modificationCategories' || filterKey === 'specificModifications') {
        const currentArray = newFilters[filterKey] as string[];
        newFilters[filterKey] = currentArray.filter(item => item !== value);
      }
    } else {
      // Handle single value filters
      if (filterKey in DEFAULT_FILTERS) {
        (newFilters as any)[filterKey] = (DEFAULT_FILTERS as any)[filterKey];
      }
    }
    
    setFilters(newFilters);
    setCurrentPage(1);
    updateURL(newFilters, 1, itemsPerPage);
  };

  const handleClearAllFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
    updateURL(DEFAULT_FILTERS, 1, itemsPerPage);
  };

  const handleSuggestedSearch = (query: string) => {
    handleFilterChange({ query });
  };

  // Helper function to get active filter count for display
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.make) count++;
    if (filters.model) count++;
    if (filters.yearFrom > 0 || filters.yearTo > 0) count++;
    if (filters.priceFrom > 0 || filters.priceTo > 0) count++;
    if (filters.modificationCategories.length > 0) count++;
    if (filters.specificModifications.length > 0) count++;
    if (filters.modDateFrom || filters.modDateTo) count++;
    if (filters.hasModifications) count++;
    return count;
  };

  return (
    <AppLayout showNavigation={true} className="bg-md-sys-surface">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-md-display-small font-bold text-md-sys-on-surface mb-4">
            {filters.query ? `Search Results for "${filters.query}"` : 'Browse Cars'}
          </h1>
          <p className="text-md-body-large text-md-sys-on-surface-variant mb-6">
            {filters.query ? 'Find cars matching your search criteria' : 'Discover amazing modified cars from enthusiasts worldwide'}
          </p>
          
          {/* Search Input */}
          <div className="max-w-2xl">
            <SearchInput
              onSearch={handleSearch}
              value={filters.query}
              placeholder="Search for cars, makes, models, modifications..."
            />
          </div>
        </div>

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
                {getActiveFilterCount() > 0 ? `${getActiveFilterCount()} active` : 'Tap to filter'}
              </span>
            </div>
            {getActiveFilterCount() > 0 && (
              <div className="ml-auto">
                <span className="bg-md-sys-primary text-md-sys-on-primary rounded-full px-3 py-1.5 text-md-label-small font-bold min-w-[28px] text-center shadow-sm">
                  {getActiveFilterCount()}
                </span>
              </div>
            )}
          </button>
        </div>

        <div className="flex gap-8">
          {/* Filter Sidebar */}
          <div className={`lg:block ${showFilters ? 'block' : 'hidden'} lg:w-64`}>
            <FilterSidebar 
              filters={filters}
              onFilterChange={handleFilterChange}
              totalItems={totalItems}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Enhanced Results Header */}
            <SearchResultsHeader
              searchQuery={filters.query}
              totalResults={totalItems}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              sortBy={filters.sortBy}
              onSortChange={(sortBy) => handleFilterChange({ sortBy })}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              loading={loading}
              showAnalytics={showAnalytics}
              onAnalyticsToggle={() => setShowAnalytics(!showAnalytics)}
            />

            {/* Filter Breadcrumbs */}
            <FilterBreadcrumbs
              filters={filters}
              onRemoveFilter={handleRemoveFilter}
              onClearAll={handleClearAllFilters}
            />

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center py-20">
                <LoadingSpinner />
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-md-sys-error-container border border-md-sys-error/20 rounded-xl p-8 mb-8 shadow-md">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-3 bg-md-sys-error/10 rounded-full">
                    <MaterialYouIcon name="exclamation-triangle" className="w-8 h-8 text-md-sys-error" />
                  </div>
                  <div>
                    <h3 className="text-md-title-large font-medium text-md-sys-on-error-container mb-2">
                      Unable to Load Listings
                    </h3>
                    <p className="text-md-body-medium text-md-sys-on-error-container/80 mb-6 max-w-md">
                      {error}
                    </p>
                  </div>
                  <button
                    onClick={fetchListings}
                    className="flex items-center gap-2 px-6 py-3 bg-md-sys-primary text-md-sys-on-primary rounded-xl hover:bg-md-sys-primary/90 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 focus-visible:ring-2 focus-visible:ring-md-sys-primary text-md-label-large font-medium shadow-md hover:shadow-lg"
                  >
                    <MaterialYouIcon name="refresh" className="w-5 h-5" />
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {/* Listings Grid */}
            {!loading && !error && (
              <>
                {listings.length > 0 ? (
                  <>
                    <div className={`mb-8 ${
                      viewMode === 'grid' 
                        ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6'
                        : 'space-y-4'
                    }`}>
                      {listings.map((listing) => (
                        <ListingCard key={listing.id} listing={listing} viewMode={viewMode} />
                      ))}
                    </div>

                    {/* Enhanced Pagination */}
                    <AdvancedPagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={totalItems}
                      itemsPerPage={itemsPerPage}
                      onPageChange={handlePageChange}
                      onItemsPerPageChange={handleItemsPerPageChange}
                      loading={loading}
                      itemsPerPageOptions={ITEMS_PER_PAGE_OPTIONS}
                      showItemsPerPage={true}
                      showJumpToPage={true}
                      showResultSummary={true}
                    />
                  </>
                ) : (
                  <NoResults
                    searchQuery={filters.query}
                    totalFilters={getActiveFilterCount()}
                    onClearFilters={handleClearAllFilters}
                    onClearSearch={() => handleFilterChange({ query: '' })}
                    onSuggestedSearch={handleSuggestedSearch}
                    showPopularListings={true}
                    showSavedSearches={false}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
