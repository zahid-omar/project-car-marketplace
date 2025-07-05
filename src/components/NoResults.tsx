'use client';

import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon, SparklesIcon, HeartIcon } from '@heroicons/react/24/outline';

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
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
          <MagnifyingGlassIcon className="w-10 h-10 text-gray-400" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          {searchQuery ? `No results for "${searchQuery}"` : 'No listings found'}
        </h2>
        
        <p className="text-gray-600 mb-8">
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
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <MagnifyingGlassIcon className="w-4 h-4 mr-2" />
            Clear Search
          </button>
        )}
        
        {totalFilters > 0 && onClearFilters && (
          <button
            onClick={onClearFilters}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <AdjustmentsHorizontalIcon className="w-4 h-4 mr-2" />
            Clear {totalFilters} Filter{totalFilters !== 1 ? 's' : ''}
          </button>
        )}
        
        <button
          onClick={() => window.location.href = '/browse'}
          className="inline-flex items-center px-4 py-2 bg-automotive-blue text-white rounded-lg text-sm font-medium hover:bg-automotive-blue/90 transition-colors"
        >
          <SparklesIcon className="w-4 h-4 mr-2" />
          Browse All Cars
        </button>
      </div>

      {/* Search Tips */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            💡 Search Tips
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
            {tips.map((tip, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                <span className="text-sm text-blue-800">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search Suggestions */}
      {onSuggestedSearch && (
        <div className="max-w-2xl mx-auto mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Try searching for these popular cars:
          </h3>
          <div className="flex flex-wrap justify-center gap-2">
            {searchSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => onSuggestedSearch(suggestion)}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
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
          <div className="bg-gradient-to-r from-automotive-blue/10 to-blue-50 border border-automotive-blue/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-automotive-blue mb-3">
              🔥 Check out what's popular
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              While we look for cars matching your criteria, browse our most viewed and favorited listings.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => window.location.href = '/browse?sortBy=popular'}
                className="inline-flex items-center px-4 py-2 bg-automotive-blue text-white rounded-lg text-sm font-medium hover:bg-automotive-blue/90 transition-colors"
              >
                <SparklesIcon className="w-4 h-4 mr-2" />
                Most Popular
              </button>
              <button
                onClick={() => window.location.href = '/browse?sortBy=newest'}
                className="inline-flex items-center px-4 py-2 border border-automotive-blue text-automotive-blue rounded-lg text-sm font-medium hover:bg-automotive-blue/10 transition-colors"
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
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <HeartIcon className="w-5 h-5 text-amber-600" />
              <h3 className="text-lg font-semibold text-amber-900">
                Save this search
              </h3>
            </div>
            <p className="text-sm text-amber-800 mb-4">
              Get notified when new cars matching your criteria are listed.
            </p>
            <button
              onClick={() => {
                // TODO: Implement save search functionality
                console.log('Save search clicked');
              }}
              className="inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
            >
              <HeartIcon className="w-4 h-4 mr-2" />
              Save Search Alert
            </button>
          </div>
        </div>
      )}

      {/* Footer Help */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <p className="text-sm text-gray-500">
          Need help finding the right car?{' '}
          <a href="/contact" className="text-automotive-blue hover:text-automotive-blue/80 font-medium">
            Contact our team
          </a>{' '}
          or browse our{' '}
          <a href="/help" className="text-automotive-blue hover:text-automotive-blue/80 font-medium">
            search guide
          </a>
          .
        </p>
      </div>
    </div>
  );
} 