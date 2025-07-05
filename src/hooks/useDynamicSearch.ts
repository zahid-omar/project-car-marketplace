import { useState, useCallback, useRef, useEffect } from 'react';
import { ComplexQuery } from '@/lib/query-builder/SearchQueryBuilder';
import { QueryBuilderHelpers, CommonQueryPatterns, QueryOptimizer } from '@/lib/query-builder/QueryBuilderHelpers';

// Types for the hook
interface SearchParams {
  searchTerm?: string;
  make?: string | string[];
  model?: string | string[];
  yearRange?: { min?: number; max?: number };
  priceRange?: { min?: number; max?: number };
  mileageRange?: { min?: number; max?: number };
  condition?: string | string[];
  transmission?: string | string[];
  location?: string;
  hasModifications?: boolean;
  modificationCategories?: string[];
  specificModifications?: string[];
  sortBy?: 'relevance' | 'price_low' | 'price_high' | 'year_new' | 'year_old' | 'newest';
  page?: number;
  limit?: number;
}

interface AdvancedSearchParams {
  textSearch?: string;
  mustHave?: { [field: string]: any };
  shouldHave?: { [field: string]: any }[];
  mustNot?: { [field: string]: any };
  ranges?: { [field: string]: { min?: any; max?: any } };
  sorting?: { field: string; order: 'asc' | 'desc' }[];
  page?: number;
  limit?: number;
}

interface SearchOptions {
  type?: 'carSearch' | 'advancedSearch' | 'modificationSearch' | 'priceAnalysis' | 'locationSearch';
  includeAnalytics?: boolean;
  optimize?: boolean;
  validateBeforeSearch?: boolean;
  debounceMs?: number;
}

interface SearchResult {
  listings: any[];
  pagination?: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  query: {
    type: string;
    params: any;
    optimized: boolean;
  };
  analytics?: {
    executionTime: number;
    queryExecutionTime: number;
    validation: any;
    complexity: any;
    indexSuggestions: string[];
    resultCount: number;
    totalCount?: number;
  };
  warnings?: string[];
  optimizations?: string[];
}

interface SearchState {
  isLoading: boolean;
  isValidating: boolean;
  data: SearchResult | null;
  error: string | null;
  lastSearchTime: number | null;
}

interface QueryValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  complexity: {
    score: number;
    recommendations: string[];
    warnings: string[];
  };
  indexSuggestions: string[];
}

export function useDynamicSearch(initialOptions: SearchOptions = {}) {
  const [state, setState] = useState<SearchState>({
    isLoading: false,
    isValidating: false,
    data: null,
    error: null,
    lastSearchTime: null
  });

  const [queryHistory, setQueryHistory] = useState<ComplexQuery[]>([]);
  const [validationCache, setValidationCache] = useState<Map<string, QueryValidation>>(new Map());
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const defaultOptions: SearchOptions = {
    type: 'carSearch',
    includeAnalytics: false,
    optimize: true,
    validateBeforeSearch: true,
    debounceMs: 300,
    ...initialOptions
  };

  // Cleanup function
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Validate a query without executing it
   */
  const validateQuery = useCallback(async (query: ComplexQuery): Promise<QueryValidation> => {
    const queryKey = JSON.stringify(query);
    
    // Check cache first
    if (validationCache.has(queryKey)) {
      return validationCache.get(queryKey)!;
    }

    setState(prev => ({ ...prev, isValidating: true }));

    try {
      const response = await fetch('/api/search/dynamic', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, analyzeOnly: true })
      });

      if (!response.ok) {
        throw new Error(`Validation failed: ${response.statusText}`);
      }

      const validation = await response.json();
      
      // Cache the validation result
      setValidationCache(prev => new Map(prev).set(queryKey, validation));
      
      return validation;

    } catch (error) {
      console.error('Query validation error:', error);
      throw error;
    } finally {
      setState(prev => ({ ...prev, isValidating: false }));
    }
  }, [validationCache]);

  /**
   * Build a query using the fluent API
   */
  const buildQuery = useCallback(() => {
    return QueryBuilderHelpers.create();
  }, []);

  /**
   * Search using predefined patterns
   */
  const search = useCallback(async (
    params: SearchParams | AdvancedSearchParams, 
    options: SearchOptions = {}
  ): Promise<SearchResult> => {
    const mergedOptions = { ...defaultOptions, ...options };
    
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Clear previous debounce
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    return new Promise((resolve, reject) => {
      const executeSearch = async () => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        
        // Create new abort controller
        abortControllerRef.current = new AbortController();

        try {
          const requestBody = {
            type: mergedOptions.type,
            params,
            includeAnalytics: mergedOptions.includeAnalytics,
            optimize: mergedOptions.optimize
          };

          // Validate query before search if requested
          if (mergedOptions.validateBeforeSearch) {
            let complexQuery: ComplexQuery;
            
            switch (mergedOptions.type) {
              case 'carSearch':
                complexQuery = CommonQueryPatterns.carSearch(params as SearchParams);
                break;
              case 'advancedSearch':
                complexQuery = CommonQueryPatterns.advancedSearch(params as AdvancedSearchParams);
                break;
              default:
                complexQuery = CommonQueryPatterns.carSearch(params as SearchParams);
                break;
            }

            const validation = await validateQuery(complexQuery);
            if (!validation.isValid) {
              throw new Error(`Query validation failed: ${validation.errors.join(', ')}`);
            }

            // Add to query history
            setQueryHistory(prev => [complexQuery, ...prev.slice(0, 9)]); // Keep last 10 queries
          }

          const response = await fetch('/api/search/dynamic', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
            signal: abortControllerRef.current.signal
          });

          if (!response.ok) {
            throw new Error(`Search failed: ${response.statusText}`);
          }

          const result: SearchResult = await response.json();
          
          setState(prev => ({ 
            ...prev, 
            isLoading: false, 
            data: result,
            lastSearchTime: Date.now()
          }));

          resolve(result);

        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            // Request was cancelled, don't update state
            return;
          }

          const errorMessage = error instanceof Error ? error.message : 'Search failed';
          setState(prev => ({ 
            ...prev, 
            isLoading: false, 
            error: errorMessage 
          }));
          
          reject(error);
        }
      };

      // Apply debouncing
      if (mergedOptions.debounceMs && mergedOptions.debounceMs > 0) {
        debounceTimeoutRef.current = setTimeout(executeSearch, mergedOptions.debounceMs);
      } else {
        executeSearch();
      }
    });
  }, [defaultOptions, validateQuery]);

  /**
   * Search using a custom ComplexQuery
   */
  const searchWithCustomQuery = useCallback(async (
    customQuery: ComplexQuery,
    options: SearchOptions = {}
  ): Promise<SearchResult> => {
    const mergedOptions = { ...defaultOptions, ...options };
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Validate query if requested
      if (mergedOptions.validateBeforeSearch) {
        const validation = await validateQuery(customQuery);
        if (!validation.isValid) {
          throw new Error(`Query validation failed: ${validation.errors.join(', ')}`);
        }
      }

      const requestBody = {
        customQuery,
        includeAnalytics: mergedOptions.includeAnalytics,
        optimize: mergedOptions.optimize
      };

      const response = await fetch('/api/search/dynamic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const result: SearchResult = await response.json();
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        data: result,
        lastSearchTime: Date.now()
      }));

      // Add to query history
      setQueryHistory(prev => [customQuery, ...prev.slice(0, 9)]);

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
      
      throw error;
    }
  }, [defaultOptions, validateQuery]);

  /**
   * Cancel ongoing search
   */
  const cancelSearch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }

    setState(prev => ({ ...prev, isLoading: false }));
  }, []);

  /**
   * Clear search results and state
   */
  const clearResults = useCallback(() => {
    setState({
      isLoading: false,
      isValidating: false,
      data: null,
      error: null,
      lastSearchTime: null
    });
  }, []);

  /**
   * Clear validation cache
   */
  const clearValidationCache = useCallback(() => {
    setValidationCache(new Map());
  }, []);

  /**
   * Get query analysis for the last search
   */
  const getLastQueryAnalysis = useCallback(() => {
    return state.data?.analytics || null;
  }, [state.data]);

  /**
   * Get optimization suggestions for the last search
   */
  const getOptimizationSuggestions = useCallback(() => {
    const analytics = state.data?.analytics;
    if (!analytics) return [];

    const suggestions: string[] = [];
    
    if (analytics.complexity.score > 7) {
      suggestions.push('Query complexity is high - consider simplifying filters');
    }
    
    if (analytics.executionTime > 1000) {
      suggestions.push('Query execution time is slow - consider adding indexes');
    }
    
    if (analytics.indexSuggestions.length > 0) {
      suggestions.push(`Consider adding indexes: ${analytics.indexSuggestions.join(', ')}`);
    }

    return suggestions;
  }, [state.data]);

  return {
    // State
    isLoading: state.isLoading,
    isValidating: state.isValidating,
    data: state.data,
    error: state.error,
    lastSearchTime: state.lastSearchTime,
    
    // Query history
    queryHistory,
    
    // Main search functions
    search,
    searchWithCustomQuery,
    validateQuery,
    buildQuery,
    
    // Control functions
    cancelSearch,
    clearResults,
    clearValidationCache,
    
    // Analysis functions
    getLastQueryAnalysis,
    getOptimizationSuggestions,
    
    // Convenience getters
    listings: state.data?.listings || [],
    pagination: state.data?.pagination || null,
    analytics: state.data?.analytics || null,
    warnings: state.data?.warnings || [],
    optimizations: state.data?.optimizations || []
  };
}