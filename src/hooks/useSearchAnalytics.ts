import { useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface SearchAnalyticsData {
  search_query: string;
  filters_used: Record<string, any>;
  results_count: number;
  response_time_ms: number;
  page_number: number;
  sort_by: string;
  was_cached: boolean;
  search_result_ids: string[];
}

interface SearchClickData {
  analytics_id: string;
  clicked_listing_id: string;
  clicked_position: number;
}

interface SearchErrorData {
  error_type: string;
  error_message: string;
  error_details?: Record<string, any>;
  search_query?: string;
  filters_used?: Record<string, any>;
  stack_trace?: string;
  request_id?: string;
  severity?: 'info' | 'warning' | 'error' | 'critical';
}

export function useSearchAnalytics() {
  const sessionIdRef = useRef<string>(uuidv4());
  const currentAnalyticsIdRef = useRef<string | null>(null);

  // Record search analytics
  const recordSearch = useCallback(async (data: SearchAnalyticsData): Promise<string | null> => {
    try {
      const response = await fetch('/api/analytics/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'record_search',
          session_id: sessionIdRef.current,
          ...data
        }),
      });

      if (!response.ok) {
        throw new Error(`Analytics recording failed: ${response.status}`);
      }

      const result = await response.json();
      currentAnalyticsIdRef.current = result.analytics_id;
      return result.analytics_id;
    } catch (error) {
      console.warn('Failed to record search analytics:', error);
      return null;
    }
  }, []);

  // Record search result click
  const recordClick = useCallback(async (data: Omit<SearchClickData, 'analytics_id'>): Promise<boolean> => {
    if (!currentAnalyticsIdRef.current) {
      console.warn('No current analytics ID for click tracking');
      return false;
    }

    try {
      const response = await fetch('/api/analytics/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'record_click',
          analytics_id: currentAnalyticsIdRef.current,
          ...data
        }),
      });

      if (!response.ok) {
        throw new Error(`Click recording failed: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.warn('Failed to record search click:', error);
      return false;
    }
  }, []);

  // Record search error
  const recordError = useCallback(async (data: SearchErrorData): Promise<boolean> => {
    try {
      const response = await fetch('/api/analytics/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'record_error',
          session_id: sessionIdRef.current,
          request_id: uuidv4(),
          ...data
        }),
      });

      if (!response.ok) {
        throw new Error(`Error recording failed: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.warn('Failed to record search error:', error);
      return false;
    }
  }, []);

  // Enhanced search tracking with automatic analytics
  const trackSearch = useCallback(async (
    searchFunction: () => Promise<any>,
    searchParams: {
      query: string;
      filters: Record<string, any>;
      page: number;
      sortBy: string;
    }
  ) => {
    const startTime = Date.now();
    let searchResult = null;
    let error = null;

    try {
      searchResult = await searchFunction();
      const responseTime = Date.now() - startTime;

      // Extract analytics data from search result
      const analyticsData: SearchAnalyticsData = {
        search_query: searchParams.query,
        filters_used: searchParams.filters,
        results_count: searchResult?.listings?.length || 0,
        response_time_ms: responseTime,
        page_number: searchParams.page,
        sort_by: searchParams.sortBy,
        was_cached: searchResult?.performance?.cached || false,
        search_result_ids: searchResult?.listings?.map((listing: any) => listing.id) || []
      };

      // Record the search analytics
      await recordSearch(analyticsData);

      return searchResult;
    } catch (err) {
      error = err;
      const responseTime = Date.now() - startTime;

      // Record the error
      await recordError({
        error_type: 'search_execution',
        error_message: err instanceof Error ? err.message : 'Unknown search error',
        error_details: {
          response_time_ms: responseTime,
          search_params: searchParams
        },
        search_query: searchParams.query,
        filters_used: searchParams.filters,
        stack_trace: err instanceof Error ? err.stack : undefined,
        severity: 'error'
      });

      throw err;
    }
  }, [recordSearch, recordError]);

  // Track listing click from search results
  const trackListingClick = useCallback(async (listingId: string, position: number) => {
    await recordClick({
      clicked_listing_id: listingId,
      clicked_position: position
    });
  }, [recordClick]);

  // Track filter usage
  const trackFilterChange = useCallback(async (filterType: string, filterValue: any, searchContext?: {
    query: string;
    totalResults: number;
    responseTime: number;
  }) => {
    // Record as a mini-search event for filter analytics
    if (searchContext) {
      await recordSearch({
        search_query: searchContext.query,
        filters_used: { [filterType]: filterValue },
        results_count: searchContext.totalResults,
        response_time_ms: searchContext.responseTime,
        page_number: 1,
        sort_by: 'created_at',
        was_cached: false,
        search_result_ids: []
      });
    }
  }, [recordSearch]);

  // Get session info
  const getSessionId = useCallback(() => sessionIdRef.current, []);
  const getCurrentAnalyticsId = useCallback(() => currentAnalyticsIdRef.current, []);

  return {
    // Core tracking functions
    recordSearch,
    recordClick,
    recordError,
    
    // Enhanced tracking functions
    trackSearch,
    trackListingClick,
    trackFilterChange,
    
    // Session management
    getSessionId,
    getCurrentAnalyticsId,
    
    // Reset session (useful for new search sessions)
    resetSession: () => {
      sessionIdRef.current = uuidv4();
      currentAnalyticsIdRef.current = null;
    }
  };
} 