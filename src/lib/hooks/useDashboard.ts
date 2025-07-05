import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/auth';
import { useAuth } from '@/lib/auth';
import {
  DashboardListing,
  DashboardAnalytics,
  ListingFilters,
  ListingUpdateData,
  MarkAsSoldData,
  ListingsResponse,
  AnalyticsResponse,
  ApiError
} from '@/types/dashboard';

interface UseDashboardReturn {
  // State
  listings: DashboardListing[];
  analytics: DashboardAnalytics | null;
  loading: boolean;
  error: string | null;
  filters: ListingFilters;
  
  // Actions
  fetchListings: () => Promise<void>;
  fetchAnalytics: () => Promise<void>;
  updateListing: (id: string, data: ListingUpdateData) => Promise<boolean>;
  deleteListing: (id: string) => Promise<boolean>;
  markAsSold: (id: string, data?: MarkAsSoldData) => Promise<boolean>;
  reactivateListing: (id: string) => Promise<boolean>;
  setFilters: (filters: Partial<ListingFilters>) => void;
  refreshData: () => Promise<void>;
  testAuth: () => Promise<void>;
}

export function useDashboard(): UseDashboardReturn {
  const [listings, setListings] = useState<DashboardListing[]>([]);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<ListingFilters>({
    status: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc',
    limit: 20,
    offset: 0
  });

  const { user } = useAuth();
  
  // Use refs to prevent infinite loops
  const isInitialLoadRef = useRef(true);
  const lastFilterFetchTimeRef = useRef(0);

  // Helper function to handle API errors
  const handleApiError = (error: any, defaultMessage: string): string => {
    if (error?.message) return error.message;
    if (typeof error === 'string') return error;
    return defaultMessage;
  };

  // Test authentication (simplified - no automatic refresh)
  const testAuth = useCallback(async () => {
    try {
      console.log('Testing authentication...');
      
      // Check client-side session without refreshing
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Client session:', { 
        hasSession: !!session, 
        sessionError: sessionError?.message, 
        userId: session?.user?.id,
        userEmail: session?.user?.email 
      });

      // Only test API if we have a session
      if (!session) {
        console.log('No session available for API test');
        return;
      }

      // Test API endpoint
      const response = await fetch('/api/auth/test', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        const testResult = await response.json();
        console.log('Auth test result:', testResult);
      } else {
        console.log('Auth test failed with status:', response.status);
      }
      
    } catch (err) {
      console.error('Auth test error:', err);
    }
  }, []); // No dependencies to prevent loops

  // Fetch user's listings (without aggressive debouncing for initial loads)
  const fetchListings = useCallback(async (isFilterChange: boolean = false) => {
    try {
      setError(null);
      
      // Check if we have a user
      if (!user) {
        console.log('No user available for listings fetch');
        setListings([]);
        return;
      }

      // Only debounce filter changes, not initial loads
      if (isFilterChange) {
        const now = Date.now();
        if (now - lastFilterFetchTimeRef.current < 500) {
          console.log('Debounced filter change, skipping...');
          return;
        }
        lastFilterFetchTimeRef.current = now;
      }

      const searchParams = new URLSearchParams();
      if (filters.status && filters.status !== 'all') searchParams.append('status', filters.status);
      if (filters.sortBy) searchParams.append('sortBy', filters.sortBy);
      if (filters.sortOrder) searchParams.append('sortOrder', filters.sortOrder);
      if (filters.limit) searchParams.append('limit', filters.limit.toString());
      if (filters.offset) searchParams.append('offset', filters.offset.toString());

      console.log('Fetching listings with params:', searchParams.toString());

      const response = await fetch(`/api/listings?${searchParams.toString()}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Listings response status:', response.status);
      
      if (!response.ok) {
        const errorData: ApiError = await response.json();
        console.error('Listings API error:', errorData);
        
        if (response.status === 401) {
          setError('Please refresh the page and try logging in again.');
          return;
        }
        
        throw new Error(errorData.error || 'Failed to fetch listings');
      }

      const data: ListingsResponse = await response.json();
      console.log('Listings data received:', data);
      setListings(data.listings);
    } catch (err) {
      const errorMessage = handleApiError(err, 'Failed to load listings');
      setError(errorMessage);
      console.error('Error fetching listings:', err);
    }
  }, [filters, user]);

  // Fetch analytics data (no debouncing needed for analytics)
  const fetchAnalytics = useCallback(async () => {
    try {
      setError(null);
      
      // Check if we have a user
      if (!user) {
        console.log('No user for analytics');
        setAnalytics(null);
        return;
      }

      console.log('Fetching analytics...');
      
      const response = await fetch('/api/listings/analytics', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Analytics response status:', response.status);
      
      if (!response.ok) {
        const errorData: ApiError = await response.json();
        console.error('Analytics API error:', errorData);
        
        if (response.status === 401) {
          console.log('Analytics auth failed, skipping...');
          return; // Don't set error for analytics failure
        }
        
        throw new Error(errorData.error || 'Failed to fetch analytics');
      }

      const data: AnalyticsResponse = await response.json();
      console.log('Analytics data received:', data);
      setAnalytics(data.analytics);
    } catch (err) {
      // For analytics, we don't want to show errors as prominently
      console.warn('Analytics fetch failed (non-critical):', err);
    }
  }, [user]);

  // Update a listing
  const updateListing = useCallback(async (id: string, data: ListingUpdateData): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await fetch(`/api/listings/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.error || 'Failed to update listing');
      }

      const result = await response.json();
      
      // Update the listing in local state
      setListings(prev => prev.map(listing => 
        listing.id === id 
          ? { ...listing, ...result.listing }
          : listing
      ));

      return true;
    } catch (err) {
      const errorMessage = handleApiError(err, 'Failed to update listing');
      setError(errorMessage);
      console.error('Error updating listing:', err);
      return false;
    }
  }, []);

  // Delete a listing
  const deleteListing = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await fetch(`/api/listings/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.error || 'Failed to delete listing');
      }

      // Remove the listing from local state
      setListings(prev => prev.filter(listing => listing.id !== id));

      return true;
    } catch (err) {
      const errorMessage = handleApiError(err, 'Failed to delete listing');
      setError(errorMessage);
      console.error('Error deleting listing:', err);
      return false;
    }
  }, []);

  // Mark a listing as sold
  const markAsSold = useCallback(async (id: string, data: MarkAsSoldData = {}): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await fetch(`/api/listings/${id}/sold`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.error || 'Failed to mark listing as sold');
      }

      const result = await response.json();
      
      // Update the listing in local state
      setListings(prev => prev.map(listing => 
        listing.id === id 
          ? { ...listing, ...result.listing }
          : listing
      ));

      return true;
    } catch (err) {
      const errorMessage = handleApiError(err, 'Failed to mark listing as sold');
      setError(errorMessage);
      console.error('Error marking listing as sold:', err);
      return false;
    }
  }, []);

  // Reactivate a sold listing
  const reactivateListing = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await fetch(`/api/listings/${id}/sold`, {
        method: 'PUT',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.error || 'Failed to reactivate listing');
      }

      const result = await response.json();
      
      // Update the listing in local state
      setListings(prev => prev.map(listing => 
        listing.id === id 
          ? { ...listing, ...result.listing }
          : listing
      ));

      return true;
    } catch (err) {
      const errorMessage = handleApiError(err, 'Failed to reactivate listing');
      setError(errorMessage);
      console.error('Error reactivating listing:', err);
      return false;
    }
  }, []);

  // Update filters and trigger refetch
  const setFilters = useCallback((newFilters: Partial<ListingFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Refresh all data - immediate for initial loads
  const refreshData = useCallback(async () => {
    setLoading(true);
    
    try {
      // Only fetch data if we have a user
      if (user) {
        console.log('Refreshing data for user:', user.email);
        await Promise.all([fetchListings(false), fetchAnalytics()]);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchListings, fetchAnalytics, user]);

  // Initial data fetch - only run once when user becomes available
  useEffect(() => {
    if (user && isInitialLoadRef.current) {
      console.log('Initial data load for user:', user.email);
      isInitialLoadRef.current = false;
      refreshData();
    } else if (!user) {
      // Reset everything when user logs out
      setListings([]);
      setAnalytics(null);
      setLoading(false);
      isInitialLoadRef.current = true;
    }
  }, [user, refreshData]);

  // Fetch listings when filters change (debounced and marked as filter change)
  useEffect(() => {
    // Only fetch if we're not in initial loading and we have a user
    if (!isInitialLoadRef.current && !loading && user) {
      const timeoutId = setTimeout(() => {
        fetchListings(true); // Mark as filter change for debouncing
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [filters.status, filters.sortBy, filters.sortOrder, filters.limit, filters.offset, fetchListings, loading, user]);

  return {
    // State
    listings,
    analytics,
    loading,
    error,
    filters,
    
    // Actions
    fetchListings: () => fetchListings(false), // Expose without filter flag
    fetchAnalytics,
    updateListing,
    deleteListing,
    markAsSold,
    reactivateListing,
    setFilters,
    refreshData,
    testAuth,
  };
} 