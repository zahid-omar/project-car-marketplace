'use client';

import { MaterialYouIcon } from '@/components/ui/MaterialYouIcon';

interface NoResultsProps {
  searchQuery?: string;
  totalFilters?: number;
  onClearFilters?: () => void;
  onClearSearch?: () => void;
  onSuggestedSearch?: (query: string) => void;
  suggestions?: string[];
  showPopularListings?: boolean;
  showSavedSearches?: boolean;
  className?: string;
}

export default function NoResults({
  searchQuery,
  totalFilters = 0,
  onClearFilters,
  onClearSearch,
  onSuggestedSearch,
  suggestions = [],
  showPopularListings = true,
  showSavedSearches = false,
  className = ''
}: NoResultsProps) {

  const defaultSuggestions = [
    'BMW M3',
    'Honda Civic',
    'Nissan GT-R',
    'Toyota Supra',
    'Subaru WRX',
    'Mazda Miata',
    'Ford Mustang',
    'Chevrolet Camaro'
  ];

  const searchSuggestions = suggestions.length > 0 ? suggestions : defaultSuggestions;

  const getSearchTips = () => {
    const tips = [];
    
    if (searchQuery) {
      tips.push("Try different or more general keywords");
      tips.push("Check your spelling");
      tips.push("Use the make/model instead of specific trim levels");
    }
    
    if (totalFilters > 0) {
      tips.push("Remove some filters to see more results");
      tips.push("Try adjusting price or year ranges");
    }
    
    tips.push("Browse all listings without filters");
    tips.push("Set up an alert for when matching cars are listed");
    
    return tips;
  };

  const tips = getSearchTips();

  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      {/* Main Icon and Message */}
      <div className="max-w-md mx-auto">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-md-sys-primary-container flex items-center justify-center shadow-md-elevation-1">
          <MaterialYouIcon name="search" className="w-10 h-10 text-md-sys-on-primary-container" />
        </div>
        
        <h2 className="text-md-headline-medium font-bold text-md-sys-on-surface mb-3">
          {searchQuery ? `No results for "${searchQuery}"` : 'No listings found'}
        </h2>
        
        <p className="text-md-body-large text-md-sys-on-surface-variant mb-8">
          {searchQuery 
            ? "We couldn't find any cars matching your search criteria." 
            : "There are no listings that match your current filters."
          }
          <br />
          Try adjusting your search or filters to find more results.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        {searchQuery && onClearSearch && (
          <button
            onClick={onClearSearch}
            className="inline-flex items-center px-4 py-3 border border-md-sys-outline rounded-xl text-md-label-large font-medium text-md-sys-on-surface-variant bg-md-sys-surface hover:bg-md-sys-surface-container-high transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 shadow-md-elevation-1 hover:shadow-md-elevation-2"
          >
            <MaterialYouIcon name="search" className="w-4 h-4 mr-2" />
            Clear Search
          </button>
        )}
        
        {totalFilters > 0 && onClearFilters && (
          <button
            onClick={onClearFilters}
            className="inline-flex items-center px-4 py-3 border border-md-sys-outline rounded-xl text-md-label-large font-medium text-md-sys-on-surface-variant bg-md-sys-surface hover:bg-md-sys-surface-container-high transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 shadow-md-elevation-1 hover:shadow-md-elevation-2"
          >
            <MaterialYouIcon name="adjustments-horizontal" className="w-4 h-4 mr-2" />
            Clear {totalFilters} Filter{totalFilters !== 1 ? 's' : ''}
          </button>
        )}
        
        <button
          onClick={() => window.location.href = '/browse'}
          className="inline-flex items-center px-4 py-3 bg-md-sys-primary text-md-sys-on-primary rounded-xl text-md-label-large font-medium hover:bg-md-sys-primary/90 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 shadow-md-elevation-2 hover:shadow-md-elevation-3"
        >
          <MaterialYouIcon name="star" className="w-4 h-4 mr-2" />
          Browse All Cars
        </button>
      </div>

      {/* Search Tips */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="bg-md-sys-primary-container border border-md-sys-outline-variant rounded-xl p-6 shadow-md-elevation-1">
          <h3 className="text-md-title-large font-semibold text-md-sys-on-primary-container mb-4">
            💡 Search Tips
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
            {tips.map((tip, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-md-sys-primary mt-2 flex-shrink-0" />
                <span className="text-md-body-small text-md-sys-on-primary-container">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search Suggestions */}
      {onSuggestedSearch && (
        <div className="max-w-2xl mx-auto mb-8">
          <h3 className="text-md-title-large font-semibold text-md-sys-on-surface mb-4">
            Try searching for these popular cars:
          </h3>
          <div className="flex flex-wrap justify-center gap-2">
            {searchSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => onSuggestedSearch(suggestion)}
                className="px-3 py-2 bg-md-sys-surface-container-highest hover:bg-md-sys-surface-container-high text-md-sys-on-surface rounded-xl text-md-label-medium font-medium transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 shadow-md-elevation-1 hover:shadow-md-elevation-2"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Popular Listings Teaser */}
      {showPopularListings && (
        <div className="max-w-2xl mx-auto mb-8">
          <div className="bg-md-sys-secondary-container border border-md-sys-outline-variant rounded-xl p-6 shadow-md-elevation-1">
            <h3 className="text-md-title-large font-semibold text-md-sys-on-secondary-container mb-3">
              🔥 Check out what's popular
            </h3>
            <p className="text-md-body-medium text-md-sys-on-secondary-container mb-4">
              While we look for cars matching your criteria, browse our most viewed and favorited listings.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => window.location.href = '/browse?sortBy=popular'}
                className="inline-flex items-center px-4 py-3 bg-md-sys-primary text-md-sys-on-primary rounded-xl text-md-label-large font-medium hover:bg-md-sys-primary/90 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 shadow-md-elevation-2 hover:shadow-md-elevation-3"
              >
                <MaterialYouIcon name="trending-up" className="w-4 h-4 mr-2" />
                Most Popular
              </button>
              <button
                onClick={() => window.location.href = '/browse?sortBy=newest'}
                className="inline-flex items-center px-4 py-3 border border-md-sys-outline text-md-sys-on-surface rounded-xl text-md-label-large font-medium hover:bg-md-sys-surface-container-high transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 shadow-md-elevation-1 hover:shadow-md-elevation-2"
              >
                Latest Listings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saved Searches */}
      {showSavedSearches && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-md-sys-tertiary-container border border-md-sys-outline-variant rounded-xl p-6 shadow-md-elevation-1">
            <div className="flex items-center justify-center gap-2 mb-3">
              <MaterialYouIcon name="heart" className="w-5 h-5 text-md-sys-on-tertiary-container" />
              <h3 className="text-md-title-large font-semibold text-md-sys-on-tertiary-container">
                Save this search
              </h3>
            </div>
            <p className="text-md-body-medium text-md-sys-on-tertiary-container mb-4">
              Get notified when new cars matching your criteria are listed.
            </p>
            <button
              onClick={() => {
                // TODO: Implement save search functionality
                console.log('Save search clicked');
              }}
              className="inline-flex items-center px-4 py-3 bg-md-sys-primary text-md-sys-on-primary rounded-xl text-md-label-large font-medium hover:bg-md-sys-primary/90 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 shadow-md-elevation-2 hover:shadow-md-elevation-3"
            >
              <MaterialYouIcon name="heart" className="w-4 h-4 mr-2" />
              Save Search Alert
            </button>
          </div>
        </div>
      )}

      {/* Footer Help */}
      <div className="mt-12 pt-8 border-t border-md-sys-outline-variant">
        <p className="text-md-body-medium text-md-sys-on-surface-variant">
          Need help finding the right car?{' '}
          <a href="/contact" className="text-md-sys-primary hover:text-md-sys-primary/80 font-medium">
            Contact our team
          </a>{' '}
          or browse our{' '}
          <a href="/help" className="text-md-sys-primary hover:text-md-sys-primary/80 font-medium">
            search guide
          </a>
          .
        </p>
      </div>
    </div>
  );
} 