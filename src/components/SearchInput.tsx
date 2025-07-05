'use client';

import { useState, useEffect, useRef, useCallback, useId } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { MaterialYouIcon } from './ui/MaterialYouIcon';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
  showSuggestions?: boolean;
  value?: string;
  variant?: 'outlined' | 'filled';
}

interface SearchSuggestion {
  type: 'make' | 'model' | 'modification' | 'recent';
  value: string;
  label: string;
  count?: number;
}

export default function SearchInput({ 
  onSearch, 
  placeholder = "Search for cars, makes, models, modifications...", 
  className = "",
  showSuggestions = true,
  value = "",
  variant = 'outlined'
}: SearchInputProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestionsList, setShowSuggestionsList] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Accessibility state
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [searchAnnouncement, setSearchAnnouncement] = useState<string>('');
  
  // Accessibility IDs
  const inputId = useId();
  const listboxId = useId();
  const statusId = useId();
  const searchStatusId = useId();
  const helpTextId = useId();
  const errorId = useId();
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  
  const supabase = createClientComponentClient();

  // Debounced search function
  const debouncedSearch = useCallback((searchQuery: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      // Always trigger search, even with empty query to show all results
      onSearch(searchQuery.trim());
      
      // Announce search action
      if (searchQuery.trim()) {
        setSearchAnnouncement(`Searching for "${searchQuery.trim()}"`);
      } else {
        setSearchAnnouncement('Showing all vehicles');
      }
    }, 300); // 300ms debounce
  }, [onSearch]);

  // Fetch suggestions based on input
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      setStatusMessage('');
      return;
    }

    setIsLoading(true);
    setError(null);
    setStatusMessage('Loading search suggestions...');
    
    try {
      const suggestions: SearchSuggestion[] = [];
      
      // Get make suggestions
      const { data: makes } = await supabase
        .from('listings')
        .select('make')
        .ilike('make', `%${searchQuery}%`)
        .eq('status', 'active')
        .limit(3);

      if (makes) {
        const uniqueMakes = [...new Set(makes.map(m => m.make))];
        uniqueMakes.forEach(make => {
          suggestions.push({
            type: 'make',
            value: make,
            label: `${make} (Make)`,
          });
        });
      }

      // Get model suggestions
      const { data: models } = await supabase
        .from('listings')
        .select('model, make')
        .or(`model.ilike.%${searchQuery}%,make.ilike.%${searchQuery}%`)
        .eq('status', 'active')
        .limit(3);

      if (models) {
        const uniqueModels = [...new Set(models.map(m => `${m.make} ${m.model}`))];
        uniqueModels.forEach(model => {
          suggestions.push({
            type: 'model',
            value: model,
            label: `${model} (Model)`,
          });
        });
      }

      // Get modification suggestions
      const { data: modifications } = await supabase
        .from('modifications')
        .select('name, category')
        .or(`name.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`)
        .limit(3);

      if (modifications) {
        const uniqueMods = [...new Set(modifications.map(m => m.name))];
        uniqueMods.forEach(mod => {
          suggestions.push({
            type: 'modification',
            value: mod,
            label: `${mod} (Modification)`,
          });
        });
      }

      const finalSuggestions = suggestions.slice(0, 8); // Limit to 8 suggestions
      setSuggestions(finalSuggestions);
      
      // Announce suggestions count
      if (finalSuggestions.length > 0) {
        setStatusMessage(`${finalSuggestions.length} suggestion${finalSuggestions.length === 1 ? '' : 's'} available`);
      } else {
        setStatusMessage('No suggestions found');
      }
      
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
      setError('Failed to load suggestions. Please try again.');
      setStatusMessage('Error loading suggestions');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setSelectedIndex(-1);
    setError(null);

    if (showSuggestions) {
      fetchSuggestions(newQuery);
      setShowSuggestionsList(newQuery.trim().length >= 2);
    }

    // Trigger search after debounce
    debouncedSearch(newQuery);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestionsList(false);
    onSearch(query.trim());
    setSearchAnnouncement(`Searching for "${query.trim()}"`);
    setStatusMessage('Search submitted');
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.value);
    setShowSuggestionsList(false);
    onSearch(suggestion.value);
    setSearchAnnouncement(`Selected suggestion: ${suggestion.label}`);
    setStatusMessage(`Searching for ${suggestion.value}`);
    inputRef.current?.focus();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestionsList || suggestions.length === 0) {
      // Handle global keyboard shortcuts when suggestions aren't open
      if (e.key === 'Escape') {
        setQuery('');
        onSearch('');
        setStatusMessage('Search cleared');
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => {
          const newIndex = prev < suggestions.length - 1 ? prev + 1 : 0;
          setStatusMessage(`${suggestions[newIndex].label}, ${newIndex + 1} of ${suggestions.length}`);
          return newIndex;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => {
          const newIndex = prev > 0 ? prev - 1 : suggestions.length - 1;
          setStatusMessage(`${suggestions[newIndex].label}, ${newIndex + 1} of ${suggestions.length}`);
          return newIndex;
        });
        break;
      case 'Enter':
        if (selectedIndex >= 0) {
          e.preventDefault();
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestionsList(false);
        setSelectedIndex(-1);
        setStatusMessage('Suggestions closed');
        break;
      case 'Home':
        if (showSuggestionsList) {
          e.preventDefault();
          setSelectedIndex(0);
          setStatusMessage(`${suggestions[0].label}, 1 of ${suggestions.length}`);
        }
        break;
      case 'End':
        if (showSuggestionsList) {
          e.preventDefault();
          const lastIndex = suggestions.length - 1;
          setSelectedIndex(lastIndex);
          setStatusMessage(`${suggestions[lastIndex].label}, ${lastIndex + 1} of ${suggestions.length}`);
        }
        break;
    }
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        inputRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestionsList(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update internal state when value prop changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Clear suggestion display when query is empty
  useEffect(() => {
    if (!query.trim()) {
      setShowSuggestionsList(false);
      setSuggestions([]);
      setSelectedIndex(-1);
      setError(null);
    }
  }, [query]);

  const hasValue = query.trim().length > 0;

  const getInputStyles = () => {
    const baseStyles = cn(
      'w-full h-14 px-4 pl-12 pr-12 text-body-large',
      'text-on-surface placeholder:text-on-surface-variant',
      'transition-all duration-md-short2 ease-md-standard',
      'focus:outline-none focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2'
    );

    if (variant === 'filled') {
      return cn(
        baseStyles,
        'bg-surface-variant rounded-t-md',
        'border-b-2 border-on-surface-variant',
        'focus:border-b-primary focus:bg-surface-container-highest',
        error && 'border-b-error focus:border-b-error'
      );
    }

    // outlined variant
    return cn(
      baseStyles,
      'bg-surface border border-outline rounded-xl',
      'hover:border-on-surface focus:border-2 focus:border-primary',
      'focus:bg-surface-container',
      error && 'border-error focus:border-error'
    );
  };

  const getContainerStyles = () => {
    return cn(
      'relative group',
      isFocused && 'ring-0' // Remove default focus ring since we handle it in input
    );
  };

  const getSuggestionTypeStyles = (type: string) => {
    switch (type) {
      case 'make':
        return 'bg-primary/20 text-primary';
      case 'model':
        return 'bg-green-500/20 text-green-600';
      case 'modification':
        return 'bg-purple-500/20 text-purple-600';
      default:
        return 'bg-surface-variant text-on-surface-variant';
    }
  };

  const getSuggestionTypeLabel = (type: string): string => {
    switch (type) {
      case 'make':
        return 'Vehicle make';
      case 'model':
        return 'Vehicle model';
      case 'modification':
        return 'Vehicle modification';
      default:
        return 'Search suggestion';
    }
  };

  // Clear search function
  const clearSearch = () => {
    setQuery('');
    setShowSuggestionsList(false);
    setSuggestions([]);
    setSelectedIndex(-1);
    setError(null);
    onSearch('');
    setStatusMessage('Search cleared');
    setSearchAnnouncement('Search cleared, showing all vehicles');
    inputRef.current?.focus();
  };

  return (
    <div className={cn('relative', className)} role="search">
      {/* Status region for screen reader announcements */}
      <div
        id={statusId}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {statusMessage}
      </div>

      {/* Search results announcement */}
      <div
        id={searchStatusId}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {searchAnnouncement}
      </div>

      <form onSubmit={handleSubmit} className="relative" role="search" aria-label="Search vehicles">
        <div className={getContainerStyles()}>
          <label htmlFor={inputId} className="sr-only">
            Search for vehicles by make, model, modifications, or keywords
          </label>
          
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setIsFocused(true);
              if (suggestions.length > 0 && query.trim().length >= 2) {
                setShowSuggestionsList(true);
                setStatusMessage(`${suggestions.length} suggestions available. Use arrow keys to navigate.`);
              }
            }}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className={getInputStyles()}
            aria-label="Search for vehicles by make, model, modifications, or keywords"
            aria-expanded={showSuggestionsList}
            aria-haspopup="listbox"
            aria-owns={showSuggestionsList ? listboxId : undefined}
            aria-activedescendant={selectedIndex >= 0 ? `${listboxId}-option-${selectedIndex}` : undefined}
            aria-describedby={cn(
              helpTextId,
              error && errorId,
              statusId
            )}
            aria-invalid={error ? 'true' : 'false'}
            role="combobox"
            autoComplete="off"
            spellCheck="false"
          />
          
          {/* Search Icon */}
          <div className={cn(
            'absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none',
            isFocused ? 'text-primary' : 'text-on-surface-variant'
          )} aria-hidden="true">
            <MaterialYouIcon name="search" size="md" />
          </div>

          {/* Loading/Clear Button */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-4">
            {isLoading ? (
              <div role="status" aria-label="Loading search suggestions">
                <MaterialYouIcon 
                  name="refresh" 
                  size="sm" 
                  className="text-primary animate-spin" 
                />
                <span className="sr-only">Loading suggestions...</span>
              </div>
            ) : hasValue ? (
              <button
                type="button"
                onClick={clearSearch}
                className={cn(
                  'p-1 rounded-full text-on-surface-variant',
                  'hover:text-on-surface hover:bg-on-surface/8',
                  'transition-all duration-md-short2 ease-md-standard',
                  'focus:outline-none focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2'
                )}
                aria-label={`Clear search "${query}"`}
                tabIndex={0}
              >
                <MaterialYouIcon name="x-mark" size="sm" />
              </button>
            ) : null}
          </div>
        </div>

        {/* Hidden help text */}
        <div id={helpTextId} className="sr-only">
          Type at least 2 characters to see suggestions. Use arrow keys to navigate suggestions, Enter to select, Escape to close.
        </div>

        {/* Error message */}
        {error && (
          <div 
            id={errorId}
            className="mt-2 text-body-small text-error"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestionsList && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          id={listboxId}
          className={cn(
            'absolute top-full left-0 right-0 mt-2 z-50',
            'bg-surface-container-high rounded-xl border border-outline-variant shadow-lg',
            'max-h-80 overflow-y-auto'
          )}
          role="listbox"
          aria-label={`Search suggestions, ${suggestions.length} available`}
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.type}-${suggestion.value}`}
              id={`${listboxId}-option-${index}`}
              onClick={() => handleSuggestionClick(suggestion)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 text-left',
                'hover:bg-surface-container-highest transition-colors duration-md-short2',
                'border-b border-outline-variant/30 last:border-b-0',
                selectedIndex === index && 'bg-surface-container-highest'
              )}
              role="option"
              aria-selected={selectedIndex === index}
              aria-label={`${suggestion.label}, ${getSuggestionTypeLabel(suggestion.type)}`}
            >
              <div className={cn(
                'flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium flex-shrink-0',
                getSuggestionTypeStyles(suggestion.type)
              )}>
                {suggestion.type === 'make' && <MaterialYouIcon name="car" size="xs" />}
                {suggestion.type === 'model' && <MaterialYouIcon name="star" size="xs" />}
                {suggestion.type === 'modification' && <MaterialYouIcon name="settings" size="xs" />}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="text-body-medium text-on-surface font-medium truncate">
                  {suggestion.value}
                </div>
                <div className="text-body-small text-on-surface-variant">
                  {getSuggestionTypeLabel(suggestion.type)}
                </div>
              </div>

              <MaterialYouIcon 
                name="arrow-right" 
                size="xs" 
                className="text-on-surface-variant flex-shrink-0" 
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
} 