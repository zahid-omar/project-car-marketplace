// Core Favorites Types
export interface Favorite {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
  updated_at: string;
}

export interface FavoriteWithListing extends Favorite {
  listing: FavoriteListing;
}

export interface FavoriteListing {
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
  listing_images: FavoriteListingImage[];
}

export interface FavoriteListingImage {
  id: string;
  image_url: string;
  is_primary: boolean;
}

// API Request/Response Types
export interface AddFavoriteRequest {
  listing_id: string;
}

export interface AddFavoriteResponse {
  favorite: Favorite;
  message: string;
}

export interface GetFavoritesRequest {
  limit?: number;
  offset?: number;
  sort_by?: 'created_at' | 'listing_price' | 'listing_year';
  sort_order?: 'asc' | 'desc';
}

export interface GetFavoritesResponse {
  favorites: FavoriteWithListing[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface RemoveFavoriteResponse {
  message: string;
}

export interface CheckFavoriteStatusResponse {
  is_favorited: boolean;
  favorite_id: string | null;
  favorited_at: string | null;
}

// API Error Types
export interface APIError {
  error: string;
  message: string;
  details?: any;
  timestamp: string;
}

export interface ValidationError extends APIError {
  error: 'Validation Error';
  details: {
    field: string;
    message: string;
  }[];
}

export interface AuthError extends APIError {
  error: 'Authentication Error';
}

export interface NotFoundError extends APIError {
  error: 'Not Found';
}

export interface ConflictError extends APIError {
  error: 'Conflict';
}

export interface ServerError extends APIError {
  error: 'Server Error';
}

// Utility Types
export type FavoritesSortOption = 'date_added' | 'price_low' | 'price_high' | 'year_new' | 'year_old' | 'alphabetical';
export type FavoritesViewMode = 'grid' | 'list';

export interface FavoritesFilter {
  searchQuery: string;
  priceRange: [number, number];
  yearRange: [number, number];
  selectedMakes: Set<string>;
  selectedConditions: Set<string>;
}

export interface FavoritesUIState {
  viewMode: FavoritesViewMode;
  sortBy: FavoritesSortOption;
  selectedFavorites: Set<string>;
  showFilters: boolean;
  removingIds: Set<string>;
}

// Database Types
export interface FavoriteRow {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
  updated_at: string;
}

export interface FavoriteInsert {
  user_id: string;
  listing_id: string;
}

export interface FavoriteUpdate {
  updated_at?: string;
}

// Hook Types
export interface UseFavoritesReturn {
  favorites: FavoriteWithListing[];
  loading: boolean;
  error: string | null;
  addToFavorites: (listingId: string) => Promise<boolean>;
  removeFromFavorites: (listingId: string) => Promise<boolean>;
  isFavorited: (listingId: string) => boolean;
  toggleFavorite: (listingId: string) => Promise<boolean>;
  refreshFavorites: () => Promise<void>;
  checkFavoriteStatus: (listingId: string) => Promise<CheckFavoriteStatusResponse | null>;
}

// Component Props Types
export interface FavoritesManagementProps {
  className?: string;
}

export interface FavoriteCardProps {
  favorite: FavoriteWithListing;
  viewMode: FavoritesViewMode;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onRemove: () => void;
  isRemoving: boolean;
}

// Analytics Types
export interface FavoritesAnalytics {
  totalFavorites: number;
  favoritesThisMonth: number;
  averagePriceRange: {
    min: number;
    max: number;
    average: number;
  };
  topMakes: {
    make: string;
    count: number;
  }[];
  conditionBreakdown: {
    condition: string;
    count: number;
  }[];
  yearRange: {
    oldest: number;
    newest: number;
  };
}

// Notification Types
export interface FavoriteNotification {
  id: string;
  user_id: string;
  listing_id: string;
  notification_type: 'price_drop' | 'status_change' | 'new_images' | 'sold';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface NotificationPreferences {
  user_id: string;
  email_price_drops: boolean;
  email_status_changes: boolean;
  email_new_images: boolean;
  email_sold_notifications: boolean;
  push_notifications: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
}

// Search and Filter Types
export interface FavoritesSearchOptions {
  query?: string;
  filters?: {
    priceMin?: number;
    priceMax?: number;
    yearMin?: number;
    yearMax?: number;
    makes?: string[];
    conditions?: string[];
    locations?: string[];
  };
  sort?: {
    field: 'created_at' | 'price' | 'year' | 'title';
    direction: 'asc' | 'desc';
  };
  pagination?: {
    limit: number;
    offset: number;
  };
}

export interface FavoritesSearchResult {
  favorites: FavoriteWithListing[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  aggregations: {
    priceRange: { min: number; max: number };
    yearRange: { min: number; max: number };
    availableMakes: string[];
    availableConditions: string[];
    availableLocations: string[];
  };
}

// Export/Import Types
export interface FavoritesExportData {
  user_id: string;
  exported_at: string;
  favorites: FavoriteWithListing[];
  summary: FavoritesAnalytics;
}

export interface FavoritesImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

// Real-time Updates Types
export interface FavoriteUpdate {
  type: 'favorite_added' | 'favorite_removed' | 'listing_updated' | 'listing_deleted';
  user_id: string;
  favorite_id?: string;
  listing_id: string;
  data?: any;
  timestamp: string;
}

// Validation Types
export interface FavoriteValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
} 