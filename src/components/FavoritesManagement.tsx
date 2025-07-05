'use client';

import { useState, useMemo, useRef, useId } from 'react';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/lib/auth';
import RealtimeIndicator, { RealtimeStatusBadge, RealtimeToast } from './RealtimeIndicator';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Heart, 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  SortAsc, 
  SortDesc, 
  Trash2, 
  ExternalLink,
  Calendar,
  DollarSign,
  MapPin,
  Car,
  Settings,
  Gauge,
  AlertCircle,
  Check,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';

type ViewMode = 'grid' | 'list';
type SortOption = 'date_added' | 'price_low' | 'price_high' | 'year_new' | 'year_old' | 'alphabetical';

interface FavoritesManagementProps {
  className?: string;
}

export default function FavoritesManagement({ className }: FavoritesManagementProps) {
  const { user } = useAuth();
  const { 
    favorites, 
    loading, 
    error, 
    removeFromFavorites, 
    refreshFavorites,
    isConnected,
    connectionError,
    syncStatus
  } = useFavorites();

  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date_added');
  const [selectedFavorites, setSelectedFavorites] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [showConnectionToast, setShowConnectionToast] = useState(false);

  // Filter states
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200000]);
  const [yearRange, setYearRange] = useState<[number, number]>([1980, new Date().getFullYear()]);
  const [selectedMakes, setSelectedMakes] = useState<Set<string>>(new Set());
  const [selectedConditions, setSelectedConditions] = useState<Set<string>>(new Set());

  // Accessibility state
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [searchAnnouncement, setSearchAnnouncement] = useState<string>('');
  
  // Accessibility IDs
  const titleId = useId();
  const searchId = useId();
  const sortId = useId();
  const filtersId = useId();
  const statusRegionId = useId();
  const searchRegionId = useId();
  const resultsRegionId = useId();
  const bulkActionsId = useId();

  // Compute available filter options
  const filterOptions = useMemo(() => {
    const makes = new Set<string>();
    const conditions = new Set<string>();
    let minPrice = Infinity;
    let maxPrice = 0;
    let minYear = Infinity;
    let maxYear = 0;

    favorites.forEach(fav => {
      const listing = fav.listing;
      makes.add(listing.make);
      if (listing.condition) conditions.add(listing.condition);
      
      if (listing.price < minPrice) minPrice = listing.price;
      if (listing.price > maxPrice) maxPrice = listing.price;
      if (listing.year < minYear) minYear = listing.year;
      if (listing.year > maxYear) maxYear = listing.year;
    });

    return {
      makes: Array.from(makes).sort(),
      conditions: Array.from(conditions).sort(),
      priceRange: [minPrice === Infinity ? 0 : minPrice, maxPrice],
      yearRange: [minYear === Infinity ? 1980 : minYear, maxYear || new Date().getFullYear()]
    };
  }, [favorites]);

  // Filter and sort favorites
  const filteredAndSortedFavorites = useMemo(() => {
    let filtered = favorites.filter(fav => {
      const listing = fav.listing;
      
      // Text search
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = (
          listing.title.toLowerCase().includes(searchLower) ||
          listing.make.toLowerCase().includes(searchLower) ||
          listing.model.toLowerCase().includes(searchLower) ||
          listing.location.toLowerCase().includes(searchLower) ||
          listing.description?.toLowerCase().includes(searchLower)
        );
        if (!matchesSearch) return false;
      }

      // Price range
      if (listing.price < priceRange[0] || listing.price > priceRange[1]) return false;

      // Year range
      if (listing.year < yearRange[0] || listing.year > yearRange[1]) return false;

      // Makes
      if (selectedMakes.size > 0 && !selectedMakes.has(listing.make)) return false;

      // Conditions
      if (selectedConditions.size > 0 && listing.condition && !selectedConditions.has(listing.condition)) return false;

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date_added':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'price_low':
          return a.listing.price - b.listing.price;
        case 'price_high':
          return b.listing.price - a.listing.price;
        case 'year_new':
          return b.listing.year - a.listing.year;
        case 'year_old':
          return a.listing.year - b.listing.year;
        case 'alphabetical':
          return a.listing.title.localeCompare(b.listing.title);
        default:
          return 0;
      }
    });

    // Announce search results
    const resultCount = filtered.length;
    const totalCount = favorites.length;
    if (searchQuery || selectedMakes.size > 0 || selectedConditions.size > 0 || 
        priceRange[0] !== filterOptions.priceRange[0] || priceRange[1] !== filterOptions.priceRange[1] ||
        yearRange[0] !== filterOptions.yearRange[0] || yearRange[1] !== filterOptions.yearRange[1]) {
      setSearchAnnouncement(`Showing ${resultCount} of ${totalCount} favorites`);
    } else {
      setSearchAnnouncement(`Showing all ${totalCount} favorites`);
    }

    return filtered;
  }, [favorites, searchQuery, sortBy, priceRange, yearRange, selectedMakes, selectedConditions, filterOptions]);

  // Utility functions
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatMileage = (mileage?: number) => {
    if (!mileage) return 'N/A';
    return new Intl.NumberFormat('en-US').format(mileage) + ' miles';
  };

  // Event handlers
  const handleSelectFavorite = (favoriteId: string, checked: boolean) => {
    const newSelected = new Set(selectedFavorites);
    if (checked) {
      newSelected.add(favoriteId);
    } else {
      newSelected.delete(favoriteId);
    }
    setSelectedFavorites(newSelected);
    
    // Announce selection change
    const selectedCount = newSelected.size;
    setStatusMessage(`${selectedCount} favorite${selectedCount === 1 ? '' : 's'} selected`);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredAndSortedFavorites.map(fav => fav.id));
      setSelectedFavorites(allIds);
      setStatusMessage(`All ${allIds.size} visible favorites selected`);
    } else {
      setSelectedFavorites(new Set());
      setStatusMessage('All favorites deselected');
    }
  };

  const handleRemoveFavorite = async (listingId: string) => {
    setRemovingIds(prev => new Set(prev).add(listingId));
    try {
      await removeFromFavorites(listingId);
      // Remove from selected if it was selected
      setSelectedFavorites(prev => {
        const newSet = new Set(prev);
        // Find the favorite ID for this listing
        const favorite = favorites.find(fav => fav.listing.id === listingId);
        if (favorite) {
          newSet.delete(favorite.id);
        }
        return newSet;
      });
      setStatusMessage('Favorite removed successfully');
    } catch (error) {
      console.error('Error removing favorite:', error);
      setStatusMessage('Error removing favorite. Please try again.');
    } finally {
      setRemovingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(listingId);
        return newSet;
      });
    }
  };

  const handleBulkRemove = async () => {
    if (selectedFavorites.size === 0) return;
    
    const confirmMessage = `Are you sure you want to remove ${selectedFavorites.size} listing${selectedFavorites.size === 1 ? '' : 's'} from your favorites?`;
    if (!confirm(confirmMessage)) return;

    setStatusMessage(`Removing ${selectedFavorites.size} favorites...`);
    
    // Convert favorite IDs to listing IDs
    const listingIds = favorites
      .filter(fav => selectedFavorites.has(fav.id))
      .map(fav => fav.listing.id);

    for (const listingId of listingIds) {
      await handleRemoveFavorite(listingId);
    }
    
    setSelectedFavorites(new Set());
    setStatusMessage(`Successfully removed ${listingIds.length} favorites`);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setPriceRange(filterOptions.priceRange);
    setYearRange(filterOptions.yearRange);
    setSelectedMakes(new Set());
    setSelectedConditions(new Set());
    setStatusMessage('All filters cleared');
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    setStatusMessage(`View changed to ${mode} layout`);
  };

  const handleSortChange = (newSortBy: SortOption) => {
    setSortBy(newSortBy);
    const sortLabels = {
      date_added: 'Recently Added',
      price_low: 'Price: Low to High',
      price_high: 'Price: High to Low',
      year_new: 'Year: Newest First',
      year_old: 'Year: Oldest First',
      alphabetical: 'Alphabetical'
    };
    setStatusMessage(`Favorites sorted by ${sortLabels[newSortBy]}`);
  };

  // Loading state
  if (loading && favorites.length === 0) {
    return (
      <div className={cn('bg-md-sys-surface-container rounded-3xl shadow-md-elevation-1 border border-md-sys-outline-variant/50', className)}>
        <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
          <LoadingSpinner />
          <span className="sr-only">Loading your favorites...</span>
        </div>
      </div>
    );
  }

  return (
    <section 
      className={cn('bg-md-sys-surface-container rounded-3xl shadow-md-elevation-1 border border-md-sys-outline-variant/50', className)}
      aria-labelledby={titleId}
      role="region"
    >
      {/* Status region for screen reader announcements */}
      <div
        id={statusRegionId}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {statusMessage}
      </div>

      {/* Search results announcement */}
      <div
        id={searchRegionId}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {searchAnnouncement}
      </div>

      {/* Header */}
      <header className="px-6 py-4 border-b border-md-sys-outline-variant">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Heart className="w-6 h-6 text-md-sys-primary" aria-hidden="true" />
            <h1 id={titleId} className="text-md-headline-small font-semibold text-md-sys-on-surface">
              My Favorites
            </h1>
            <span className="text-md-body-large text-md-sys-on-surface-variant" aria-label={`${filteredAndSortedFavorites.length} favorites found`}>
              ({filteredAndSortedFavorites.length})
            </span>
            <RealtimeStatusBadge
              isConnected={isConnected}
              connectionError={connectionError}
              syncStatus={syncStatus}
              onClick={() => setShowConnectionToast(true)}
            />
          </div>

          <div className="flex items-center space-x-3">
            {/* Bulk Actions */}
            {selectedFavorites.size > 0 && (
              <div 
                id={bulkActionsId}
                className="flex items-center space-x-2 border-l border-md-sys-outline-variant pl-3"
                role="group"
                aria-labelledby="bulk-actions-label"
              >
                <span 
                  id="bulk-actions-label"
                  className="text-md-body-medium text-md-sys-on-surface-variant"
                >
                  {selectedFavorites.size} selected
                </span>
                <button
                  onClick={handleBulkRemove}
                  className="flex items-center space-x-1 bg-md-sys-error-container text-md-sys-on-error-container px-4 py-2 rounded-xl border border-md-sys-error/20 hover:bg-md-sys-error-container/80 transition-all duration-200 shadow-md-elevation-1 focus-visible:outline-2 focus-visible:outline-md-sys-error focus-visible:outline-offset-2"
                  aria-describedby="remove-selected-desc"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                  <span className="text-md-label-medium font-medium">Remove</span>
                </button>
                <span id="remove-selected-desc" className="sr-only">
                  Remove {selectedFavorites.size} selected favorite{selectedFavorites.size === 1 ? '' : 's'} from your list
                </span>
              </div>
            )}

            {/* View Toggle */}
            <div 
              className="flex items-center border border-md-sys-outline rounded-xl p-1 bg-md-sys-surface-container-low shadow-md-elevation-1"
              role="radiogroup"
              aria-label="View mode selection"
            >
              <button
                onClick={() => handleViewModeChange('grid')}
                className={cn(
                  'p-2 rounded-lg transition-all duration-200 font-medium focus-visible:outline-2 focus-visible:outline-md-sys-primary focus-visible:outline-offset-2',
                  viewMode === 'grid' 
                    ? 'bg-md-sys-primary text-md-sys-on-primary shadow-md-elevation-1' 
                    : 'text-md-sys-on-surface-variant hover:text-md-sys-on-surface hover:bg-md-sys-surface-container'
                )}
                role="radio"
                aria-checked={viewMode === 'grid'}
                aria-label="Grid view"
                title="Switch to grid view"
              >
                <Grid3X3 className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                onClick={() => handleViewModeChange('list')}
                className={cn(
                  'p-2 rounded-lg transition-all duration-200 font-medium focus-visible:outline-2 focus-visible:outline-md-sys-primary focus-visible:outline-offset-2',
                  viewMode === 'list' 
                    ? 'bg-md-sys-primary text-md-sys-on-primary shadow-md-elevation-1' 
                    : 'text-md-sys-on-surface-variant hover:text-md-sys-on-surface hover:bg-md-sys-surface-container'
                )}
                role="radio"
                aria-checked={viewMode === 'list'}
                aria-label="List view"
                title="Switch to list view"
              >
                <List className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all duration-200 font-medium shadow-md-elevation-1 focus-visible:outline-2 focus-visible:outline-md-sys-primary focus-visible:outline-offset-2',
                showFilters 
                  ? 'bg-md-sys-primary text-md-sys-on-primary' 
                  : 'border border-md-sys-outline bg-md-sys-surface-container text-md-sys-on-surface hover:bg-md-sys-surface-container-high'
              )}
              aria-expanded={showFilters}
              aria-controls={filtersId}
              aria-label={`${showFilters ? 'Hide' : 'Show'} advanced filters`}
            >
              <Filter className="w-4 h-4" aria-hidden="true" />
              <span className="text-md-label-large">Filters</span>
            </button>
          </div>
        </div>

        {/* Search and Sort */}
        <div className="flex items-center space-x-4 mt-4">
          <div className="relative flex-1">
            <label htmlFor={searchId} className="sr-only">
              Search your favorites by title, make, model, location, or description
            </label>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-md-sys-on-surface-variant" aria-hidden="true" />
            <input
              id={searchId}
              type="text"
              placeholder="Search your favorites..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-md-sys-outline rounded-xl bg-md-sys-surface text-md-sys-on-surface placeholder-md-sys-on-surface-variant focus:border-md-sys-primary focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 shadow-md-elevation-1 focus-visible:outline-2 focus-visible:outline-md-sys-primary"
              aria-describedby={`${searchId}-help`}
            />
            <div id={`${searchId}-help`} className="sr-only">
              Search through your favorites by car title, make, model, location, or description. Results update automatically as you type.
            </div>
          </div>

          <div className="relative">
            <label htmlFor={sortId} className="sr-only">
              Sort favorites
            </label>
            <select
              id={sortId}
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as SortOption)}
              className="border border-md-sys-outline rounded-xl px-4 py-2.5 bg-md-sys-surface text-md-sys-on-surface focus:border-md-sys-primary focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 shadow-md-elevation-1 focus-visible:outline-2 focus-visible:outline-md-sys-primary"
              aria-describedby={`${sortId}-help`}
            >
              <option value="date_added">Recently Added</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="year_new">Year: Newest First</option>
              <option value="year_old">Year: Oldest First</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
            <div id={`${sortId}-help`} className="sr-only">
              Choose how to sort your favorites list. Changes apply immediately.
            </div>
          </div>
        </div>
      </header>

      {/* Filters Panel */}
      {showFilters && (
        <section 
          id={filtersId}
          className="px-6 py-4 border-b border-md-sys-outline-variant bg-md-sys-surface-container-low"
          aria-label="Advanced filters"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Price Range */}
            <fieldset>
              <legend className="block text-md-label-large font-semibold text-md-sys-on-surface mb-3">
                Price Range
              </legend>
              <div className="space-y-2">
                <div className="space-y-1">
                  <label htmlFor="price-min" className="sr-only">
                    Minimum price: {formatPrice(priceRange[0])}
                  </label>
                  <input
                    id="price-min"
                    type="range"
                    min={filterOptions.priceRange[0]}
                    max={filterOptions.priceRange[1]}
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                    className="w-full focus-visible:outline-2 focus-visible:outline-md-sys-primary"
                    aria-valuetext={`Minimum price: ${formatPrice(priceRange[0])}`}
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="price-max" className="sr-only">
                    Maximum price: {formatPrice(priceRange[1])}
                  </label>
                  <input
                    id="price-max"
                    type="range"
                    min={filterOptions.priceRange[0]}
                    max={filterOptions.priceRange[1]}
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full focus-visible:outline-2 focus-visible:outline-md-sys-primary"
                    aria-valuetext={`Maximum price: ${formatPrice(priceRange[1])}`}
                  />
                </div>
                <div className="flex justify-between text-md-body-medium text-md-sys-on-surface-variant" aria-hidden="true">
                  <span>{formatPrice(priceRange[0])}</span>
                  <span>{formatPrice(priceRange[1])}</span>
                </div>
              </div>
            </fieldset>

            {/* Year Range */}
            <fieldset>
              <legend className="block text-md-label-large font-semibold text-md-sys-on-surface mb-3">
                Year Range
              </legend>
              <div className="space-y-2">
                <div className="space-y-1">
                  <label htmlFor="year-min" className="sr-only">
                    Minimum year: {yearRange[0]}
                  </label>
                  <input
                    id="year-min"
                    type="range"
                    min={filterOptions.yearRange[0]}
                    max={filterOptions.yearRange[1]}
                    value={yearRange[0]}
                    onChange={(e) => setYearRange([parseInt(e.target.value), yearRange[1]])}
                    className="w-full focus-visible:outline-2 focus-visible:outline-md-sys-primary"
                    aria-valuetext={`Minimum year: ${yearRange[0]}`}
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="year-max" className="sr-only">
                    Maximum year: {yearRange[1]}
                  </label>
                  <input
                    id="year-max"
                    type="range"
                    min={filterOptions.yearRange[0]}
                    max={filterOptions.yearRange[1]}
                    value={yearRange[1]}
                    onChange={(e) => setYearRange([yearRange[0], parseInt(e.target.value)])}
                    className="w-full focus-visible:outline-2 focus-visible:outline-md-sys-primary"
                    aria-valuetext={`Maximum year: ${yearRange[1]}`}
                  />
                </div>
                <div className="flex justify-between text-md-body-medium text-md-sys-on-surface-variant" aria-hidden="true">
                  <span>{yearRange[0]}</span>
                  <span>{yearRange[1]}</span>
                </div>
              </div>
            </fieldset>

            {/* Makes */}
            <fieldset>
              <legend className="block text-md-label-large font-semibold text-md-sys-on-surface mb-3">
                Vehicle Makes
              </legend>
              <div className="space-y-1 max-h-32 overflow-y-auto" role="group" aria-label="Select vehicle makes to filter">
                {filterOptions.makes.map(make => (
                  <label key={make} className="flex items-center space-x-2 text-md-body-medium cursor-pointer hover:bg-md-sys-surface-container rounded px-1 py-0.5 transition-colors group">
                    <input
                      type="checkbox"
                      checked={selectedMakes.has(make)}
                      onChange={(e) => {
                        const newSet = new Set(selectedMakes);
                        if (e.target.checked) {
                          newSet.add(make);
                        } else {
                          newSet.delete(make);
                        }
                        setSelectedMakes(newSet);
                      }}
                      className="rounded focus-visible:outline-2 focus-visible:outline-md-sys-primary"
                      aria-describedby={`make-${make}-count`}
                    />
                    <span className="group-hover:text-md-sys-primary">{make}</span>
                    <span id={`make-${make}-count`} className="sr-only">
                      {favorites.filter(fav => fav.listing.make === make).length} vehicles
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Conditions */}
            <fieldset>
              <legend className="block text-md-label-large font-semibold text-md-sys-on-surface mb-3">
                Vehicle Condition
              </legend>
              <div className="space-y-1" role="group" aria-label="Select vehicle conditions to filter">
                {filterOptions.conditions.map(condition => (
                  <label key={condition} className="flex items-center space-x-2 text-md-body-medium cursor-pointer hover:bg-md-sys-surface-container rounded px-1 py-0.5 transition-colors group">
                    <input
                      type="checkbox"
                      checked={selectedConditions.has(condition)}
                      onChange={(e) => {
                        const newSet = new Set(selectedConditions);
                        if (e.target.checked) {
                          newSet.add(condition);
                        } else {
                          newSet.delete(condition);
                        }
                        setSelectedConditions(newSet);
                      }}
                      className="rounded focus-visible:outline-2 focus-visible:outline-md-sys-primary"
                      aria-describedby={`condition-${condition}-count`}
                    />
                    <span className="capitalize group-hover:text-md-sys-primary">{condition}</span>
                    <span id={`condition-${condition}-count`} className="sr-only">
                      {favorites.filter(fav => fav.listing.condition === condition).length} vehicles
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="flex justify-between items-center mt-6">
            <button
              onClick={clearFilters}
              className="bg-md-sys-surface-container text-md-sys-on-surface px-4 py-2 rounded-xl border border-md-sys-outline-variant hover:bg-md-sys-surface-container-high transition-all duration-200 text-md-label-large font-medium shadow-md-elevation-1 focus-visible:outline-2 focus-visible:outline-md-sys-primary focus-visible:outline-offset-2"
              aria-describedby="clear-filters-desc"
            >
              Clear Filters
            </button>
            <span id="clear-filters-desc" className="sr-only">
              Remove all applied filters and show all favorites
            </span>
            <div 
              role="status" 
              aria-live="polite"
              className="text-md-body-medium text-md-sys-on-surface-variant"
            >
              {filteredAndSortedFavorites.length} of {favorites.length} favorites shown
            </div>
          </div>
        </section>
      )}

      {/* Content */}
      <main className="p-6" id={resultsRegionId}>
        {error && (
          <div 
            className="mb-6 bg-md-sys-error-container border border-md-sys-error/20 rounded-2xl p-6 shadow-md-elevation-1"
            role="alert"
            aria-live="assertive"
          >
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-md-sys-error" aria-hidden="true" />
              <p className="text-md-body-large font-medium text-md-sys-on-error-container">{error}</p>
              <button
                onClick={refreshFavorites}
                className="ml-auto bg-md-sys-error text-md-sys-on-error px-4 py-2 rounded-xl hover:bg-md-sys-error/90 transition-all duration-200 text-md-label-medium font-medium shadow-md-elevation-1 focus-visible:outline-2 focus-visible:outline-md-sys-error focus-visible:outline-offset-2"
                aria-label="Retry loading favorites"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {favorites.length === 0 ? (
          <div className="text-center py-12" role="region" aria-label="No favorites found">
            <div className="w-20 h-20 bg-md-sys-surface-container-high rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-md-sys-on-surface-variant/50" aria-hidden="true" />
            </div>
            <h2 className="text-md-title-large font-semibold text-md-sys-on-surface mb-3">No Favorites Yet</h2>
            <p className="text-md-body-large text-md-sys-on-surface-variant mb-8">
              Start browsing cars and save the ones you like to see them here.
            </p>
            <Link
              href="/browse"
              className="inline-flex items-center space-x-2 bg-md-sys-primary text-md-sys-on-primary px-8 py-4 rounded-2xl hover:bg-md-sys-primary/90 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 shadow-md-elevation-2 text-md-label-large font-semibold focus-visible:outline-2 focus-visible:outline-md-sys-primary focus-visible:outline-offset-2"
              aria-label="Browse cars to start adding favorites"
            >
              <Search className="w-5 h-5" aria-hidden="true" />
              <span>Browse Cars</span>
            </Link>
          </div>
        ) : filteredAndSortedFavorites.length === 0 ? (
          <div className="text-center py-12" role="region" aria-label="No search results">
            <div className="w-20 h-20 bg-md-sys-surface-container-high rounded-full flex items-center justify-center mx-auto mb-6">
              <Filter className="w-10 h-10 text-md-sys-on-surface-variant/50" aria-hidden="true" />
            </div>
            <h2 className="text-md-title-large font-semibold text-md-sys-on-surface mb-3">No Matches Found</h2>
            <p className="text-md-body-large text-md-sys-on-surface-variant mb-8">
              Try adjusting your search criteria or filters.
            </p>
            <button
              onClick={clearFilters}
              className="inline-flex items-center space-x-2 bg-md-sys-primary text-md-sys-on-primary px-8 py-4 rounded-2xl hover:bg-md-sys-primary/90 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 shadow-md-elevation-2 text-md-label-large font-semibold focus-visible:outline-2 focus-visible:outline-md-sys-primary focus-visible:outline-offset-2"
              aria-label="Clear all filters to show all favorites"
            >
              <X className="w-5 h-5" aria-hidden="true" />
              <span>Clear Filters</span>
            </button>
          </div>
        ) : (
          <>
            {/* Select All */}
            {filteredAndSortedFavorites.length > 0 && (
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-md-sys-outline-variant">
                <label className="flex items-center space-x-2 text-md-body-large cursor-pointer" htmlFor="select-all-favorites">
                  <input
                    id="select-all-favorites"
                    type="checkbox"
                    checked={selectedFavorites.size === filteredAndSortedFavorites.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded focus-visible:outline-2 focus-visible:outline-md-sys-primary"
                    aria-describedby="select-all-desc"
                  />
                  <span>Select All ({filteredAndSortedFavorites.length})</span>
                </label>
                <div id="select-all-desc" className="sr-only">
                  Select or deselect all {filteredAndSortedFavorites.length} visible favorites for bulk operations
                </div>
              </div>
            )}

            {/* Favorites Grid/List */}
            <div 
              className={cn(
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-6'
              )}
              role="region"
              aria-label={`${filteredAndSortedFavorites.length} favorite vehicles in ${viewMode} view`}
            >
              {filteredAndSortedFavorites.map((favorite) => (
                <FavoriteItem
                  key={favorite.id}
                  favorite={favorite}
                  viewMode={viewMode}
                  isSelected={selectedFavorites.has(favorite.id)}
                  onSelect={(checked) => handleSelectFavorite(favorite.id, checked)}
                  onRemove={() => handleRemoveFavorite(favorite.listing.id)}
                  isRemoving={removingIds.has(favorite.listing.id)}
                  formatPrice={formatPrice}
                  formatDate={formatDate}
                  formatMileage={formatMileage}
                />
              ))}
            </div>
          </>
        )}
      </main>
      
      {/* Real-time Connection Toast */}
      <RealtimeToast
        isConnected={isConnected}
        connectionError={connectionError}
        onDismiss={() => setShowConnectionToast(false)}
      />
    </section>
  );
}

// Individual Favorite Item Component
interface FavoriteItemProps {
  favorite: any;
  viewMode: ViewMode;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onRemove: () => void;
  isRemoving: boolean;
  formatPrice: (price: number) => string;
  formatDate: (date: string) => string;
  formatMileage: (mileage?: number) => string;
}

function FavoriteItem({
  favorite,
  viewMode,
  isSelected,
  onSelect,
  onRemove,
  isRemoving,
  formatPrice,
  formatDate,
  formatMileage
}: FavoriteItemProps) {
  const { listing } = favorite;
  const primaryImage = listing.listing_images?.find((img: any) => img.is_primary) || listing.listing_images?.[0];
  
  // Generate unique IDs for accessibility
  const selectId = `select-${favorite.id}`;
  const removeId = `remove-${favorite.id}`;
  const cardId = `card-${favorite.id}`;
  
  const vehicleTitle = `${listing.year} ${listing.make} ${listing.model}`;
  const priceLabel = `Price: ${formatPrice(listing.price)}`;
  const mileageLabel = `Mileage: ${formatMileage(listing.mileage)}`;
  const locationLabel = `Location: ${listing.location}`;
  const dateLabel = `Added to favorites on ${formatDate(favorite.created_at)}`;

  if (viewMode === 'grid') {
    return (
      <article 
        id={cardId}
        className="bg-md-sys-surface-container rounded-3xl border border-md-sys-outline-variant overflow-hidden hover:shadow-md-elevation-2 transition-all duration-200 shadow-md-elevation-1 relative focus-within:ring-2 focus-within:ring-md-sys-primary/20"
        aria-labelledby={`${cardId}-title`}
        aria-describedby={`${cardId}-details`}
      >
        {/* Selection Checkbox and Remove Button */}
        <div className="absolute top-4 left-4 z-10 flex items-center space-x-2">
          <label className="flex items-center" htmlFor={selectId}>
            <input
              id={selectId}
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(e.target.checked)}
              className="rounded bg-md-sys-surface/90 backdrop-blur-sm shadow-md-elevation-1 focus-visible:outline-2 focus-visible:outline-md-sys-primary"
              aria-describedby={`${selectId}-desc`}
            />
            <span className="sr-only">Select {vehicleTitle} for bulk operations</span>
          </label>
          <div id={`${selectId}-desc`} className="sr-only">
            {isSelected ? 'Selected' : 'Not selected'} for bulk operations
          </div>
        </div>
        <div className="absolute top-4 right-4 z-10">
          <button
            id={removeId}
            onClick={onRemove}
            disabled={isRemoving}
            className="w-10 h-10 bg-md-sys-surface/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-md-sys-error hover:text-md-sys-on-error transition-all duration-200 disabled:opacity-50 shadow-md-elevation-1 border border-md-sys-outline-variant/30 focus-visible:outline-2 focus-visible:outline-md-sys-error focus-visible:outline-offset-2"
            aria-label={`Remove ${vehicleTitle} from favorites`}
            aria-describedby={`${removeId}-desc`}
          >
            {isRemoving ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span className="sr-only">Removing {vehicleTitle} from favorites...</span>
              </>
            ) : (
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
          <div id={`${removeId}-desc`} className="sr-only">
            {isRemoving ? 'Removing from favorites...' : 'Remove this vehicle from your favorites list'}
          </div>
        </div>

        {/* Image */}
        <div className="relative aspect-[4/3] bg-md-sys-surface-variant">
          {primaryImage ? (
            <Image
              src={primaryImage.image_url}
              alt={`${vehicleTitle} - ${listing.title}`}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full" role="img" aria-label={`No image available for ${vehicleTitle}`}>
              <Car className="w-16 h-16 text-md-sys-on-surface-variant/30" aria-hidden="true" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 id={`${cardId}-title`} className="text-md-title-large font-semibold text-md-sys-on-surface line-clamp-2 mb-2">
            {listing.title}
          </h3>
          <p className="text-md-body-large text-md-sys-on-surface-variant mb-4">
            {vehicleTitle}
          </p>

          {/* Enhanced Price Display */}
          <div className="bg-md-sys-primary-container rounded-2xl p-4 mb-4" role="region" aria-label={priceLabel}>
            <p className="text-md-label-large font-semibold text-md-sys-on-primary-container/80 uppercase tracking-wide mb-1">PRICE</p>
            <p className="text-md-display-small font-bold text-md-sys-on-primary-container">
              {formatPrice(listing.price)}
            </p>
          </div>

          {/* Enhanced Specs */}
          <div className="grid grid-cols-1 gap-3 mb-4" role="list" aria-label="Vehicle specifications">
            <div className="bg-md-sys-surface-container-high rounded-xl p-3 border border-md-sys-outline-variant/30" role="listitem">
              <div className="flex items-center space-x-2">
                <Gauge className="w-4 h-4 text-md-sys-on-surface-variant" aria-hidden="true" />
                <span className="text-md-body-medium text-md-sys-on-surface font-medium" aria-label={mileageLabel}>
                  {formatMileage(listing.mileage)}
                </span>
              </div>
            </div>
            <div className="bg-md-sys-surface-container-high rounded-xl p-3 border border-md-sys-outline-variant/30" role="listitem">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-md-sys-on-surface-variant" aria-hidden="true" />
                <span className="text-md-body-medium text-md-sys-on-surface font-medium truncate" aria-label={locationLabel}>
                  {listing.location}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="flex items-center justify-between border-t border-md-sys-outline-variant/30 pt-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-3.5 h-3.5 text-md-sys-on-surface-variant" aria-hidden="true" />
              <span className="text-md-body-small text-md-sys-on-surface-variant" aria-label={dateLabel}>
                Added {formatDate(favorite.created_at)}
              </span>
            </div>
            <Link
              href={`/listings/${listing.id}`}
              className="flex items-center space-x-1 bg-md-sys-secondary text-md-sys-on-secondary px-4 py-2 rounded-xl hover:bg-md-sys-secondary/90 transition-all duration-200 shadow-md-elevation-1 text-md-label-medium font-medium focus-visible:outline-2 focus-visible:outline-md-sys-secondary focus-visible:outline-offset-2"
              aria-label={`View detailed listing for ${vehicleTitle}`}
            >
              <span>View</span>
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </footer>
        </div>

        {/* Hidden details for screen readers */}
        <div id={`${cardId}-details`} className="sr-only">
          {vehicleTitle}. {priceLabel}. {mileageLabel}. {locationLabel}. {dateLabel}. 
          {isSelected ? 'Selected for bulk operations.' : 'Not selected for bulk operations.'}
        </div>
      </article>
    );
  }

  // List view - Enhanced
  return (
    <article 
      id={cardId}
      className="flex items-start space-x-6 bg-md-sys-surface-container rounded-3xl border border-md-sys-outline-variant p-6 hover:shadow-md-elevation-2 transition-all duration-200 shadow-md-elevation-1 focus-within:ring-2 focus-within:ring-md-sys-primary/20"
      aria-labelledby={`${cardId}-title`}
      aria-describedby={`${cardId}-details`}
    >
      {/* Checkbox */}
      <div className="flex-shrink-0 pt-2">
        <label className="flex items-center" htmlFor={selectId}>
          <input
            id={selectId}
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            className="rounded focus-visible:outline-2 focus-visible:outline-md-sys-primary"
            aria-describedby={`${selectId}-desc`}
          />
          <span className="sr-only">Select {vehicleTitle} for bulk operations</span>
        </label>
        <div id={`${selectId}-desc`} className="sr-only">
          {isSelected ? 'Selected' : 'Not selected'} for bulk operations
        </div>
      </div>

      {/* Image */}
      <div className="flex-shrink-0 w-32 h-24 bg-md-sys-surface-variant rounded-2xl overflow-hidden shadow-md-elevation-1">
        {primaryImage ? (
          <Image
            src={primaryImage.image_url}
            alt={`${vehicleTitle} - ${listing.title}`}
            width={128}
            height={96}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="flex items-center justify-center h-full" role="img" aria-label={`No image available for ${vehicleTitle}`}>
            <Car className="w-8 h-8 text-md-sys-on-surface-variant/30" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 id={`${cardId}-title`} className="text-md-title-large font-semibold text-md-sys-on-surface truncate mb-1">
              {listing.title}
            </h3>
            <p className="text-md-body-large text-md-sys-on-surface-variant">
              {vehicleTitle}
            </p>
          </div>
        </div>

        {/* Enhanced Info Grid */}
        <div className="grid grid-cols-3 gap-4 mb-4" role="list" aria-label="Vehicle information">
          <div className="bg-md-sys-primary-container rounded-2xl p-3" role="listitem">
            <p className="text-md-label-medium font-semibold text-md-sys-on-primary-container/80 uppercase tracking-wide mb-1">PRICE</p>
            <p className="text-md-title-large font-bold text-md-sys-on-primary-container" aria-label={priceLabel}>
              {formatPrice(listing.price)}
            </p>
          </div>
          
          <div className="bg-md-sys-surface-container-high rounded-2xl p-3 border border-md-sys-outline-variant/50" role="listitem">
            <p className="text-md-label-medium font-semibold text-md-sys-on-surface-variant uppercase tracking-wide mb-1">MILEAGE</p>
            <p className="text-md-title-medium font-bold text-md-sys-on-surface" aria-label={mileageLabel}>
              {formatMileage(listing.mileage)}
            </p>
          </div>
          
          <div className="bg-md-sys-secondary-container rounded-2xl p-3" role="listitem">
            <p className="text-md-label-medium font-semibold text-md-sys-on-secondary-container/80 uppercase tracking-wide mb-1">LOCATION</p>
            <p className="text-md-title-medium font-bold text-md-sys-on-secondary-container truncate" aria-label={locationLabel}>
              {listing.location}
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between border-t border-md-sys-outline-variant/30 pt-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-md-sys-on-surface-variant" aria-hidden="true" />
            <span className="text-md-body-medium text-md-sys-on-surface-variant" aria-label={dateLabel}>
              Added {formatDate(favorite.created_at)}
            </span>
          </div>
        </footer>
      </div>

      {/* Enhanced Actions */}
      <div className="flex flex-col items-end space-y-3">
        <Link
          href={`/listings/${listing.id}`}
          className="flex items-center space-x-2 bg-md-sys-secondary text-md-sys-on-secondary px-5 py-2.5 rounded-xl hover:bg-md-sys-secondary/90 transition-all duration-200 shadow-md-elevation-1 text-md-label-large font-medium focus-visible:outline-2 focus-visible:outline-md-sys-secondary focus-visible:outline-offset-2"
          aria-label={`View detailed listing for ${vehicleTitle}`}
        >
          <span>View</span>
          <ExternalLink className="w-4 h-4" aria-hidden="true" />
        </Link>
        <button
          id={removeId}
          onClick={onRemove}
          disabled={isRemoving}
          className="flex items-center space-x-2 bg-md-sys-error-container text-md-sys-on-error-container px-5 py-2.5 rounded-xl border border-md-sys-error/20 hover:bg-md-sys-error-container/80 transition-all duration-200 shadow-md-elevation-1 text-md-label-large font-medium disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-md-sys-error focus-visible:outline-offset-2"
          aria-label={`Remove ${vehicleTitle} from favorites`}
          aria-describedby={`${removeId}-desc`}
        >
          {isRemoving ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Removing...</span>
              <span className="sr-only">Removing {vehicleTitle} from favorites...</span>
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              <span>Remove</span>
            </>
          )}
        </button>
        <div id={`${removeId}-desc`} className="sr-only">
          {isRemoving ? 'Removing from favorites...' : 'Remove this vehicle from your favorites list'}
        </div>
      </div>

      {/* Hidden details for screen readers */}
      <div id={`${cardId}-details`} className="sr-only">
        {vehicleTitle}. {priceLabel}. {mileageLabel}. {locationLabel}. {dateLabel}. 
        {isSelected ? 'Selected for bulk operations.' : 'Not selected for bulk operations.'}
      </div>
    </article>
  );
} 