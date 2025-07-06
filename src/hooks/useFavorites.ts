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

// Global subscription manager
class FavoritesSubscriptionManager {
  private static instance: FavoritesSubscriptionManager | null = null;
  private channel: RealtimeChannel | null = null;
  private supabase = createClientComponentClient();
  private subscribers = new Set<(favorites: FavoriteWithListing[]) => void>();
  private currentUserId: string | null = null;
  private isConnected = false;
  private connectionError: string | null = null;
  private syncStatus: 'idle' | 'syncing' | 'synced' | 'error' = 'idle';
  private statusSubscribers = new Set<(status: { isConnected: boolean; connectionError: string | null; syncStatus: 'idle' | 'syncing' | 'synced' | 'error' }) => void>();

  static getInstance(): FavoritesSubscriptionManager {
    if (!FavoritesSubscriptionManager.instance) {
      FavoritesSubscriptionManager.instance = new FavoritesSubscriptionManager();
    }
    return FavoritesSubscriptionManager.instance;
  }

  subscribe(callback: (favorites: FavoriteWithListing[]) => void): () => void {
    console.log('[FAVORITES MANAGER] Adding subscriber, total:', this.subscribers.size + 1);
    this.subscribers.add(callback);
    
    return () => {
      console.log('[FAVORITES MANAGER] Removing subscriber, total:', this.subscribers.size - 1);
      this.subscribers.delete(callback);
      
      // Clean up subscription if no more subscribers
      if (this.subscribers.size === 0) {
        this.cleanup();
      }
    };
  }

  subscribeToStatus(callback: (status: { isConnected: boolean; connectionError: string | null; syncStatus: 'idle' | 'syncing' | 'synced' | 'error' }) => void): () => void {
    this.statusSubscribers.add(callback);
    
    // Send current status immediately
    callback({
      isConnected: this.isConnected,
      connectionError: this.connectionError,
      syncStatus: this.syncStatus
    });
    
    return () => {
      this.statusSubscribers.delete(callback);
    };
  }

  private notifyStatusSubscribers() {
    const status = {
      isConnected: this.isConnected,
      connectionError: this.connectionError,
      syncStatus: this.syncStatus
    };
    
    this.statusSubscribers.forEach(callback => {
      try {
        callback(status);
      } catch (err) {
        console.error('[FAVORITES MANAGER] Error in status callback:', err);
      }
    });
  }

  private async notifySubscribers() {
    if (this.subscribers.size === 0) return;
    
    try {
      // Fetch fresh favorites data
      const response = await fetch('/api/favorites');
      if (response.ok) {
        const data = await response.json();
        const favoritesList = Array.isArray(data.favorites) ? data.favorites : [];
        
        this.subscribers.forEach(callback => {
          try {
            callback(favoritesList);
          } catch (err) {
            console.error('[FAVORITES MANAGER] Error in subscriber callback:', err);
          }
        });
      }
    } catch (err) {
      console.error('[FAVORITES MANAGER] Error fetching favorites for subscribers:', err);
    }
  }

  async setupSubscription(userId: string): Promise<void> {
    if (this.currentUserId === userId && this.channel) {
      console.log('[FAVORITES MANAGER] Subscription already exists for user:', userId);
      return;
    }

    // Clean up existing subscription
    await this.cleanup();

    try {
      console.log('[FAVORITES MANAGER] Setting up realtime subscription for user:', userId);
      this.currentUserId = userId;
      
      this.channel = this.supabase.channel(`favorites_global_${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'favorites',
            filter: `user_id=eq.${userId}`,
          },
          this.handleRealtimeChange.bind(this)
        )
        .on('presence', { event: 'sync' }, () => {
          console.log('[FAVORITES MANAGER] Realtime presence synced');
        });

      // Subscribe with connection state handling
      const subscriptionPromise = new Promise<void>((resolve, reject) => {
        if (!this.channel) {
          reject(new Error('Channel not initialized'));
          return;
        }

        this.channel.subscribe((status, error) => {
          console.log(`[FAVORITES MANAGER] Subscription status: ${status}`, error);
          
          this.isConnected = status === 'SUBSCRIBED';
          this.connectionError = error?.message || null;
          
          if (status === 'SUBSCRIBED') {
            this.syncStatus = 'synced';
            resolve();
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            this.syncStatus = 'error';
            this.connectionError = 'Real-time connection failed';
            reject(error || new Error('Subscription failed'));
          }
          
          this.notifyStatusSubscribers();
        });
      });

      await subscriptionPromise;
      console.log('[FAVORITES MANAGER] Realtime subscription established successfully');

    } catch (err) {
      console.error('[FAVORITES MANAGER] Error setting up realtime subscription:', err);
      this.connectionError = err instanceof Error ? err.message : 'Subscription setup failed';
      this.syncStatus = 'error';
      this.notifyStatusSubscribers();
      throw err;
    }
  }

  private handleRealtimeChange(payload: RealtimePostgresChangesPayload<any>) {
    console.log('[FAVORITES MANAGER] Realtime change received:', payload);
    this.syncStatus = 'syncing';
    this.notifyStatusSubscribers();

    // Notify all subscribers with fresh data
    this.notifySubscribers().then(() => {
      this.syncStatus = 'synced';
      this.notifyStatusSubscribers();
    }).catch(err => {
      console.error('[FAVORITES MANAGER] Error handling realtime change:', err);
      this.syncStatus = 'error';
      this.notifyStatusSubscribers();
    });
  }

  private async cleanup() {
    if (this.channel) {
      console.log('[FAVORITES MANAGER] Cleaning up subscription');
      await this.supabase.removeChannel(this.channel);
      this.channel = null;
    }
    
    this.currentUserId = null;
    this.isConnected = false;
    this.connectionError = null;
    this.syncStatus = 'idle';
    this.notifyStatusSubscribers();
  }

  getStatus() {
    return {
      isConnected: this.isConnected,
      connectionError: this.connectionError,
      syncStatus: this.syncStatus
    };
  }
}

export function useFavorites(): UseFavoritesReturn {
  const [favorites, setFavorites] = useState<FavoriteWithListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  
  const supabase = createClientComponentClient();
  const mountedRef = useRef(true);
  const subscriptionManager = FavoritesSubscriptionManager.getInstance();

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

      const currentUserId = session.user.id;
      console.log('[FAVORITES HOOK] Fetching from API...');

      // Set up global realtime subscription
      try {
        await subscriptionManager.setupSubscription(currentUserId);
      } catch (subscriptionError) {
        console.warn('[FAVORITES HOOK] Subscription setup failed, continuing without realtime:', subscriptionError);
      }

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
  }, [supabase, subscriptionManager]);

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

      if (error || !data) {
        console.error('[FAVORITES] Error fetching favorite details:', error);
        return null;
      }

      // Handle the case where listing might be an array or null
      let listingData: any = data.listing;
      if (Array.isArray(listingData)) {
        listingData = listingData[0] || null;
      }

      if (!listingData) {
        console.error('[FAVORITES] No listing data found');
        return null;
      }

      return {
        id: data.id,
        created_at: data.created_at,
        listing: listingData
      } as FavoriteWithListing;
    } catch (err) {
      console.error('[FAVORITES] Error in fetchFavoriteDetails:', err);
      return null;
    }
  };

  // Enhanced add to favorites with optimistic updates
  const addToFavorites = useCallback(async (listingId: string): Promise<boolean> => {
    try {
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
  }, [subscriptionManager]);

  // Enhanced remove from favorites with optimistic updates
  const removeFromFavorites = useCallback(async (listingId: string): Promise<boolean> => {
    try {
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

  // Subscribe to global favorites updates
  useEffect(() => {
    const unsubscribeFromUpdates = subscriptionManager.subscribe((newFavorites) => {
      if (mountedRef.current) {
        setFavorites(newFavorites);
      }
    });

    const unsubscribeFromStatus = subscriptionManager.subscribeToStatus((status) => {
      if (mountedRef.current) {
        setIsConnected(status.isConnected);
        setConnectionError(status.connectionError);
        setSyncStatus(status.syncStatus);
      }
    });

    return () => {
      unsubscribeFromUpdates();
      unsubscribeFromStatus();
    };
  }, [subscriptionManager]);

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
  }, [fetchFavorites, subscriptionManager]);

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