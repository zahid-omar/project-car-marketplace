import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

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

interface SearchResult {
  listings: any[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  performance?: {
    responseTime: number;
    totalItems: number;
    cached: boolean;
  };
}

interface UseOptimizedSearchOptions {
  debounceMs?: number;
  cacheSize?: number;
  cacheTTL?: number;
  enableOptimizedAPI?: boolean;
}

interface CacheEntry {
  data: SearchResult;
  timestamp: number;
  filters: Filters;
}

const DEFAULT_OPTIONS: UseOptimizedSearchOptions = {
  debounceMs: 300,
  cacheSize: 50,
  cacheTTL: 5 * 60 * 1000, // 5 minutes
  enableOptimizedAPI: true
};

export function useOptimizedSearch(
  initialFilters: Filters,
  options: UseOptimizedSearchOptions = {}
) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [debouncedFilters, setDebouncedFilters] = useState<Filters>(initialFilters);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Performance tracking
  const [performanceMetrics, setPerformanceMetrics] = useState({
    averageResponseTime: 0,
    cacheHitRate: 0,
    totalSearches: 0,
    cacheHits: 0
  });

  // Refs for caching and performance tracking
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const responseTimesRef = useRef<number[]>([]);

  // Cache management functions
  const generateCacheKey = useCallback((searchFilters: Filters, page: number): string => {
    const cacheData = {
      ...searchFilters,
      page,
      // Sort arrays for consistent cache keys
      modificationCategories: [...searchFilters.modificationCategories].sort(),
      specificModifications: [...searchFilters.specificModifications].sort()
    };
    return JSON.stringify(cacheData);
  }, []);

  const getFromCache = useCallback((key: string): SearchResult | null => {
    const cached = cacheRef.current.get(key);
    if (cached && Date.now() - cached.timestamp < opts.cacheTTL!) {
      return cached.data;
    }
    if (cached) {
      cacheRef.current.delete(key);
    }
    return null;
  }, [opts.cacheTTL]);

  const setCache = useCallback((key: string, data: SearchResult, searchFilters: Filters) => {
    // Clean up old entries if cache is too large
    if (cacheRef.current.size >= opts.cacheSize!) {
      const entries = Array.from(cacheRef.current.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toDelete = entries.slice(0, Math.floor(opts.cacheSize! / 2));
      toDelete.forEach(([key]) => cacheRef.current.delete(key));
    }

    cacheRef.current.set(key, {
      data,
      timestamp: Date.now(),
      filters: searchFilters
    });
  }, [opts.cacheSize]);

  // Debouncing logic with smart behavior
  const smartDebounce = useCallback((newFilters: Filters) => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Check if this is a text search vs filter change
    const isTextSearch = newFilters.query !== debouncedFilters.query;
    const isInitialLoad = debouncedFilters.query === '' && 
                         Object.values(debouncedFilters).every(v => 
                           v === '' || v === 0 || v === false || (Array.isArray(v) && v.length === 0)
                         );

    // Apply different debounce delays
    let debounceDelay = opts.debounceMs!;
    
    if (isInitialLoad) {
      // No debouncing for initial loads
      debounceDelay = 0;
    } else if (isTextSearch && newFilters.query.length > 0) {
      // Shorter debounce for text search
      debounceDelay = Math.max(150, opts.debounceMs! / 2);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedFilters(newFilters);
    }, debounceDelay);
  }, [debouncedFilters, opts.debounceMs]);

  // Update performance metrics
  const updatePerformanceMetrics = useCallback((responseTime: number, wasCacheHit: boolean) => {
    setPerformanceMetrics(prev => {
      responseTimesRef.current.push(responseTime);
      if (responseTimesRef.current.length > 50) {
        responseTimesRef.current = responseTimesRef.current.slice(-50);
      }

      const averageResponseTime = responseTimesRef.current.reduce((a, b) => a + b, 0) / responseTimesRef.current.length;
      const totalSearches = prev.totalSearches + 1;
      const cacheHits = prev.cacheHits + (wasCacheHit ? 1 : 0);

      return {
        averageResponseTime,
        cacheHitRate: cacheHits / totalSearches,
        totalSearches,
        cacheHits
      };
    });
  }, []);

  // Main search function
  const performSearch = useCallback(async (searchFilters: Filters, page: number = 1) => {
    const startTime = Date.now();
    const cacheKey = generateCacheKey(searchFilters, page);
    
    // Check cache first
    const cachedResult = getFromCache(cacheKey);
    if (cachedResult) {
      setSearchResult(cachedResult);
      setError(null);
      updatePerformanceMetrics(Date.now() - startTime, true);
      return cachedResult;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      // Determine API endpoint
      const endpoint = opts.enableOptimizedAPI ? '/api/search/optimized' : '/api/search';
      
      // Build query parameters
      const searchParams = new URLSearchParams({
        q: searchFilters.query,
        page: page.toString(),
        limit: '12'
      });

      // Add filters to search params
      if (searchFilters.make) searchParams.set('make', searchFilters.make);
      if (searchFilters.model) searchParams.set('model', searchFilters.model);
      if (searchFilters.yearFrom > 0) searchParams.set('yearFrom', searchFilters.yearFrom.toString());
      if (searchFilters.yearTo > 0) searchParams.set('yearTo', searchFilters.yearTo.toString());
      if (searchFilters.priceFrom > 0) searchParams.set('priceFrom', searchFilters.priceFrom.toString());
      if (searchFilters.priceTo > 0) searchParams.set('priceTo', searchFilters.priceTo.toString());
      if (searchFilters.sortBy) searchParams.set('sortBy', searchFilters.sortBy);

      // Add modification filters
      if (searchFilters.modificationCategories.length > 0) {
        searchParams.set('modCategories', searchFilters.modificationCategories.join(','));
      }
      if (searchFilters.specificModifications.length > 0) {
        searchParams.set('specificMods', searchFilters.specificModifications.join(','));
      }
      if (searchFilters.modDateFrom) searchParams.set('modDateFrom', searchFilters.modDateFrom);
      if (searchFilters.modDateTo) searchParams.set('modDateTo', searchFilters.modDateTo);
      if (searchFilters.hasModifications) searchParams.set('hasModifications', 'true');

      const response = await fetch(`${endpoint}?${searchParams.toString()}`, {
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Search failed');
      }

      const data: SearchResult = await response.json();
      
      // Cache the result
      setCache(cacheKey, data, searchFilters);
      setSearchResult(data);
      setError(null);

      const responseTime = Date.now() - startTime;
      updatePerformanceMetrics(responseTime, false);

      return data;

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled, ignore
        return null;
      }
      
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      setSearchResult(null);
      console.error('Search error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [generateCacheKey, getFromCache, setCache, updatePerformanceMetrics, opts.enableOptimizedAPI]);

  // Effect to perform search when debounced filters change
  useEffect(() => {
    performSearch(debouncedFilters, currentPage);
  }, [debouncedFilters, currentPage, performSearch]);

  // Filter update function with smart debouncing
  const updateFilters = useCallback((newFilters: Partial<Filters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    
    // Reset page to 1 if filters changed (not just pagination)
    const filtersChanged = Object.keys(newFilters).some(key => key !== 'page');
    if (filtersChanged && currentPage !== 1) {
      setCurrentPage(1);
    }
    
    smartDebounce(updatedFilters);
  }, [filters, currentPage, smartDebounce]);

  // Page navigation functions
  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const nextPage = useCallback(() => {
    if (searchResult?.pagination.hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [searchResult?.pagination.hasNextPage]);

  const prevPage = useCallback(() => {
    if (searchResult?.pagination.hasPrevPage) {
      setCurrentPage(prev => prev - 1);
    }
  }, [searchResult?.pagination.hasPrevPage]);

  // Cache management functions
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
    setPerformanceMetrics({
      averageResponseTime: 0,
      cacheHitRate: 0,
      totalSearches: 0,
      cacheHits: 0
    });
    responseTimesRef.current = [];
  }, []);

  const getCacheStats = useCallback(() => {
    const now = Date.now();
    const validEntries = Array.from(cacheRef.current.values()).filter(
      entry => now - entry.timestamp < opts.cacheTTL!
    ).length;

    return {
      totalEntries: cacheRef.current.size,
      validEntries,
      cacheSize: opts.cacheSize!,
      cacheTTL: opts.cacheTTL!
    };
  }, [opts.cacheSize, opts.cacheTTL]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Memoized return value for performance
  return useMemo(() => ({
    // State
    filters,
    searchResult,
    loading,
    error,
    currentPage,
    performanceMetrics,
    
    // Actions
    updateFilters,
    goToPage,
    nextPage,
    prevPage,
    performSearch: (customFilters?: Partial<Filters>) => 
      performSearch(customFilters ? { ...filters, ...customFilters } : filters, currentPage),
    
    // Cache management
    clearCache,
    getCacheStats,
    
    // Computed values
    hasResults: Boolean(searchResult?.listings?.length),
    totalItems: searchResult?.pagination?.totalItems || 0,
    isSearching: loading,
    
    // Performance
    isOptimized: opts.enableOptimizedAPI
  }), [
    filters,
    searchResult,
    loading,
    error,
    currentPage,
    performanceMetrics,
    updateFilters,
    goToPage,
    nextPage,
    prevPage,
    performSearch,
    clearCache,
    getCacheStats,
    opts.enableOptimizedAPI
  ]);
} 