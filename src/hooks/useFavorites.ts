import { useState, useEffect, useCallback, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface FavoriteWithListing {
  id: string;
  created_at: string;
  listing: {
    id: string;
    title: string;
    make: string;
    model: string;
    year: number;
    price: number;
    location: string;
    description?: string;
    engine?: string;
    transmission?: string;
    mileage?: number;
    condition?: string;
    status: string;
    created_at: string;
    listing_images: Array<{
      id: string;
      image_url: string;
      is_primary: boolean;
    }>;
  };
}

interface UseFavoritesReturn {
  favorites: FavoriteWithListing[];
  loading: boolean;
  error: string | null;
  addToFavorites: (listingId: string) => Promise<boolean>;
  removeFromFavorites: (listingId: string) => Promise<boolean>;
  isFavorited: (listingId: string) => boolean;
  toggleFavorite: (listingId: string) => Promise<boolean>;
  refreshFavorites: () => Promise<void>;
  checkFavoriteStatus: (listingId: string) => Promise<{is_favorited: boolean; favorite_id: string | null; favorited_at: string | null} | null>;
  // Real-time specific properties
  isConnected: boolean;
  connectionError: string | null;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
}

export function useFavorites(): UseFavoritesReturn {
  const [favorites, setFavorites] = useState<FavoriteWithListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  
  const supabase = createClientComponentClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const userIdRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  // Optimistic updates tracking
  const optimisticUpdatesRef = useRef<Set<string>>(new Set());

  // Enhanced fetch favorites with error handling
  const fetchFavorites = useCallback(async () => {
    console.log('[FAVORITES HOOK] fetchFavorites called');
    try {
      setSyncStatus('syncing');
      console.log('[FAVORITES HOOK] Getting session...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('[FAVORITES HOOK] Session:', { hasSession: !!session, userId: session?.user?.id, email: session?.user?.email, sessionError });
      
      // Check for session errors (like expired tokens)
      if (sessionError) {
        console.warn('[FAVORITES HOOK] Session error:', sessionError);
        if (mountedRef.current) {
          setFavorites([]);
          setLoading(false);
          setSyncStatus('idle');
          setError('Session expired. Please refresh the page.');
        }
        return;
      }
      
      if (!session) {
        console.log('[FAVORITES HOOK] No session, clearing favorites');
        if (mountedRef.current) {
          setFavorites([]);
          setLoading(false);
          setSyncStatus('idle');
          setError(null);
        }
        return;
      }

      userIdRef.current = session.user.id;
      console.log('[FAVORITES HOOK] Fetching from API...');

      const response = await fetch('/api/favorites', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('[FAVORITES HOOK] API response:', { status: response.status, ok: response.ok });

      if (!response.ok) {
        // If it's a 400 error, it might be validation issues - still set empty favorites
        if (response.status === 400) {
          console.warn('[FAVORITES HOOK] Favorites validation error, setting empty favorites');
          if (mountedRef.current) {
            setFavorites([]);
            setError(null);
            setSyncStatus('synced');
          }
          return;
        }
        throw new Error(`Failed to fetch favorites: ${response.status}`);
      }

      const data = await response.json();
      console.log('[FAVORITES HOOK] API data received:', { favoritesCount: data.favorites?.length, data });
      
      if (mountedRef.current) {
        console.log('[FAVORITES HOOK] Component still mounted, updating state...');
        // Ensure we always have an array
        const favoritesList = Array.isArray(data.favorites) ? data.favorites : [];
        console.log('[FAVORITES HOOK] Setting favorites:', favoritesList.length);
        setFavorites(favoritesList);
        setError(null);
        setSyncStatus('synced');
        console.log('[FAVORITES HOOK] Loaded favorites:', favoritesList.length);
      } else {
        console.log('[FAVORITES HOOK] Component unmounted, skipping state update');
      }
    } catch (err) {
      console.error('[FAVORITES HOOK] Error fetching favorites:', err);
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch favorites');
        setSyncStatus('error');
        // Don't clear favorites on error - keep existing state
      }
    } finally {
      if (mountedRef.current) {
        console.log('[FAVORITES HOOK] Setting loading to false');
        setLoading(false);
      } else {
        console.log('[FAVORITES HOOK] Component unmounted, skipping loading state update');
      }
    }
  }, [supabase]);

  // Real-time subscription setup
  const setupRealtimeSubscription = useCallback(async () => {
    if (!userIdRef.current) return;

    try {
      // Cleanup existing subscription
      if (channelRef.current) {
        console.log('[FAVORITES] Cleaning up existing subscription');
        await supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      const channel = supabase.channel(`favorites_${userIdRef.current}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'favorites',
            filter: `user_id=eq.${userIdRef.current}`,
          },
          handleRealtimeChange
        )
        .on('presence', { event: 'sync' }, () => {
          console.log('[FAVORITES] Realtime presence synced');
        })
        .on('broadcast', { event: 'favorites_update' }, handleBroadcastUpdate);

      // Subscribe with connection state handling
      channel.subscribe((status, error) => {
        if (mountedRef.current) {
          setIsConnected(status === 'SUBSCRIBED');
          setConnectionError(error?.message || null);
          
          console.log(`[FAVORITES] Realtime subscription status: ${status}`, error);
          
          if (status === 'SUBSCRIBED') {
            setSyncStatus('synced');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setSyncStatus('error');
            setConnectionError('Real-time connection failed');
          }
        }
      });

      channelRef.current = channel;
    } catch (err) {
      console.error('[FAVORITES] Error setting up realtime subscription:', err);
      if (mountedRef.current) {
        setConnectionError(err instanceof Error ? err.message : 'Subscription setup failed');
        setSyncStatus('error');
      }
    }
  }, [supabase]);

  // Handle real-time database changes
  const handleRealtimeChange = useCallback((payload: RealtimePostgresChangesPayload<any>) => {
    if (!mountedRef.current) return;

    console.log('[FAVORITES] Realtime change received:', payload);
    setSyncStatus('syncing');

    try {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      setFavorites(currentFavorites => {
        let updatedFavorites = [...currentFavorites];

        switch (eventType) {
          case 'INSERT':
            // Check if this is an optimistic update we already have
            if (newRecord && !optimisticUpdatesRef.current.has(newRecord.listing_id)) {
              // Fetch the full favorite with listing details
              fetchFavoriteDetails(newRecord.id).then(favoriteWithListing => {
                if (favoriteWithListing && mountedRef.current) {
                  setFavorites(prev => {
                    const exists = prev.some(fav => fav.id === favoriteWithListing.id);
                    if (!exists) {
                      return [...prev, favoriteWithListing];
                    }
                    return prev;
                  });
                }
              });
            } else if (newRecord) {
              // Remove from optimistic updates tracking
              optimisticUpdatesRef.current.delete(newRecord.listing_id);
            }
            break;

          case 'DELETE':
            if (oldRecord) {
              updatedFavorites = updatedFavorites.filter(fav => fav.id !== oldRecord.id);
              // Remove from optimistic updates tracking
              optimisticUpdatesRef.current.delete(oldRecord.listing_id);
            }
            break;

          case 'UPDATE':
            if (newRecord) {
              const index = updatedFavorites.findIndex(fav => fav.id === newRecord.id);
              if (index >= 0) {
                // Fetch updated details
                fetchFavoriteDetails(newRecord.id).then(favoriteWithListing => {
                  if (favoriteWithListing && mountedRef.current) {
                    setFavorites(prev => prev.map(fav => 
                      fav.id === favoriteWithListing.id ? favoriteWithListing : fav
                    ));
                  }
                });
              }
            }
            break;
        }

        return updatedFavorites;
      });

      setSyncStatus('synced');
    } catch (err) {
      console.error('[FAVORITES] Error handling realtime change:', err);
      setSyncStatus('error');
    }
  }, []);

  // Handle broadcast updates (for cross-tab communication)
  const handleBroadcastUpdate = useCallback((payload: any) => {
    console.log('[FAVORITES] Broadcast update received:', payload);
    
    if (payload.type === 'favorites_refresh' && payload.user_id === userIdRef.current) {
      // Refresh favorites from another tab/window
      fetchFavorites();
    }
  }, [fetchFavorites]);

  // Fetch favorite details with listing info
  const fetchFavoriteDetails = async (favoriteId: string): Promise<FavoriteWithListing | null> => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          id,
          created_at,
          listing:listings(
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
            status,
            created_at,
            listing_images(
              id,
              image_url,
              is_primary
            )
          )
        `)
        .eq('id', favoriteId)
        .single();

      if (error || !data || !data.listing) {
        console.error('[FAVORITES] Error fetching favorite details:', error);
        return null;
      }

      return data as FavoriteWithListing;
    } catch (err) {
      console.error('[FAVORITES] Error in fetchFavoriteDetails:', err);
      return null;
    }
  };

  // Enhanced add to favorites with optimistic updates
  const addToFavorites = useCallback(async (listingId: string): Promise<boolean> => {
    try {
      if (!userIdRef.current) {
        throw new Error('User not authenticated');
      }

      // Optimistic update - add to tracking
      optimisticUpdatesRef.current.add(listingId);
      setSyncStatus('syncing');

      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ listing_id: listingId }),
      });

      if (!response.ok) {
        // Handle different error cases gracefully
        if (response.status === 409) {
          console.log('[FAVORITES] Item already favorited, refreshing state');
          // Refresh favorites to sync state
          await fetchFavorites();
          optimisticUpdatesRef.current.delete(listingId);
          setSyncStatus('synced');
          return true; // Return success since the item is favorited
        }
        
        // Handle validation errors (like trying to favorite own listing)
        if (response.status === 400) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.message || 'Cannot perform this action';
          throw new Error(errorMessage);
        }
        
        throw new Error(`Failed to add favorite: ${response.status}`);
      }

      const data = await response.json();
      
      // Optimistically update the UI with the response data
      if (data.favorite && mountedRef.current) {
        setFavorites(prev => {
          // Check if already exists to prevent duplicates
          const exists = prev.some(fav => fav.listing?.id === listingId);
          if (!exists) {
            // Create a properly formatted favorite object
            const newFavorite: FavoriteWithListing = {
              id: data.favorite.id,
              created_at: data.favorite.created_at,
              listing: data.favorite.listing || {
                id: listingId,
                title: 'Loading...',
                make: '',
                model: '',
                year: 0,
                price: 0,
                location: '',
                status: 'active',
                created_at: new Date().toISOString(),
                listing_images: []
              }
            };
            return [...prev, newFavorite];
          }
          return prev;
        });
      }
      
      // Broadcast update to other tabs
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'favorites_update',
          payload: {
            type: 'favorites_refresh',
            user_id: userIdRef.current,
            action: 'add',
            listing_id: listingId
          }
        });
      }

      optimisticUpdatesRef.current.delete(listingId);
      setSyncStatus('synced');
      return true;
    } catch (err) {
      console.error('Error adding to favorites:', err);
      optimisticUpdatesRef.current.delete(listingId);
      setSyncStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to add to favorites');
      return false;
    }
  }, []);

  // Enhanced remove from favorites with optimistic updates
  const removeFromFavorites = useCallback(async (listingId: string): Promise<boolean> => {
    try {
      if (!userIdRef.current) {
        throw new Error('User not authenticated');
      }

      // Optimistic update - track removal
      optimisticUpdatesRef.current.add(listingId);
      setSyncStatus('syncing');

      // Optimistically remove from UI
      setFavorites(prev => prev.filter(fav => fav.listing.id !== listingId));

      const response = await fetch(`/api/favorites/${listingId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        // Revert optimistic update on error
        fetchFavorites();
        throw new Error(`Failed to remove favorite: ${response.status}`);
      }

      // Broadcast update to other tabs
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'favorites_update',
          payload: {
            type: 'favorites_refresh',
            user_id: userIdRef.current,
            action: 'remove',
            listing_id: listingId
          }
        });
      }

      optimisticUpdatesRef.current.delete(listingId);
      setSyncStatus('synced');
      return true;
    } catch (err) {
      console.error('Error removing from favorites:', err);
      optimisticUpdatesRef.current.delete(listingId);
      setSyncStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to remove from favorites');
      return false;
    }
  }, [fetchFavorites]);

  // Check if listing is favorited
  const isFavorited = useCallback((listingId: string): boolean => {
    return favorites.some(fav => fav.listing.id === listingId);
  }, [favorites]);

  // Toggle favorite status
  const toggleFavorite = useCallback(async (listingId: string): Promise<boolean> => {
    const currentlyFavorited = isFavorited(listingId);
    if (currentlyFavorited) {
      return await removeFromFavorites(listingId);
    } else {
      return await addToFavorites(listingId);
    }
  }, [isFavorited, addToFavorites, removeFromFavorites]);

  // Check favorite status from server
  const checkFavoriteStatus = useCallback(async (listingId: string) => {
    try {
      const response = await fetch(`/api/favorites/${listingId}`);
      if (!response.ok) {
        throw new Error(`Failed to check favorite status: ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      console.error('Error checking favorite status:', err);
      return null;
    }
  }, []);

  // Refresh favorites manually
  const refreshFavorites = useCallback(async () => {
    await fetchFavorites();
  }, [fetchFavorites]);

  // Initial setup and cleanup
  useEffect(() => {
    console.log('[FAVORITES HOOK] Initial useEffect triggered');
    mountedRef.current = true; // Ensure mounted is true when component mounts
    console.log('[FAVORITES HOOK] Set mountedRef to true');
    fetchFavorites();

    return () => {
      console.log('[FAVORITES HOOK] Cleanup - setting mounted to false');
      mountedRef.current = false;
    };
  }, [fetchFavorites]);

  // Setup real-time subscription when user is available (prevent multiple subscriptions)
  useEffect(() => {
    const setupSubscription = async () => {
      if (userIdRef.current && !loading && !channelRef.current) {
        await setupRealtimeSubscription();
      }
    };

    setupSubscription();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userIdRef.current, loading, supabase]); // Remove setupRealtimeSubscription dependency

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [supabase]);

  return {
    favorites,
    loading,
    error,
    addToFavorites,
    removeFromFavorites,
    isFavorited,
    toggleFavorite,
    refreshFavorites,
    checkFavoriteStatus,
    isConnected,
    connectionError,
    syncStatus,
  };
} 