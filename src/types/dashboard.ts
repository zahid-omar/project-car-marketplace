// Core listing types
export interface Listing {
  id: string;
  user_id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  engine: string | null;
  transmission: string | null;
  mileage: number | null;
  condition: string | null;
  price: number;
  location: string;
  description: string | null;
  status: 'active' | 'sold' | 'draft' | 'deleted';
  created_at: string;
  updated_at: string;
  sold_at: string | null;
  sold_price: number | null;
}

// Listing with images for dashboard display
export interface DashboardListing extends Listing {
  listing_images?: ListingImage[];
  primaryImage?: ListingImage;
  imageCount: number;
}

export interface ListingImage {
  id: string;
  image_url: string;
  is_primary: boolean;
}

// API Response types
export interface ListingsResponse {
  listings: DashboardListing[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface ListingResponse {
  listing: Listing;
}

export interface AnalyticsResponse {
  analytics: DashboardAnalytics;
}

// Dashboard analytics structure
export interface DashboardAnalytics {
  overview: {
    totalListings: number;
    activeListings: number;
    soldListings: number;
    draftListings: number;
    conversionRate: number;
    avgDaysToSell: number;
  };
  pricing: {
    avgActivePrice: number;
    avgSoldPrice: number;
    totalActiveValue: number;
    totalSoldValue: number;
  };
  recent: {
    newListingsLast30Days: number;
    soldLast30Days: number;
  };
  monthly: MonthlyStats[];
}

export interface MonthlyStats {
  month: string;
  listed: number;
  sold: number;
}

// Filter and sort options
export interface ListingFilters {
  status?: 'all' | 'active' | 'sold' | 'draft';
  sortBy?: 'created_at' | 'updated_at' | 'price' | 'year' | 'title';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Form data for updates
export interface ListingUpdateData {
  title?: string;
  make?: string;
  model?: string;
  year?: number;
  price?: number;
  location?: string;
  description?: string;
  engine?: string;
  transmission?: string;
  mileage?: number;
  condition?: string;
  status?: 'active' | 'sold' | 'draft';
}

// Mark as sold data
export interface MarkAsSoldData {
  soldPrice?: number;
  notes?: string;
}

// API Error response
export interface ApiError {
  error: string;
  details?: string;
}

// Dashboard state management
export interface DashboardState {
  listings: DashboardListing[];
  analytics: DashboardAnalytics | null;
  loading: boolean;
  error: string | null;
  filters: ListingFilters;
  selectedListing: Listing | null;
}

// Dashboard actions
export type DashboardAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_LISTINGS'; payload: DashboardListing[] }
  | { type: 'SET_ANALYTICS'; payload: DashboardAnalytics }
  | { type: 'UPDATE_LISTING'; payload: DashboardListing }
  | { type: 'REMOVE_LISTING'; payload: string }
  | { type: 'SET_FILTERS'; payload: ListingFilters }
  | { type: 'SELECT_LISTING'; payload: Listing | null };

// Component prop types
export interface ListingCardProps {
  listing: DashboardListing;
  onEdit: (listing: DashboardListing) => void;
  onDelete: (listingId: string) => void;
  onMarkAsSold: (listingId: string) => void;
  onView: (listing: DashboardListing) => void;
}

export interface AnalyticsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
}

export interface FilterBarProps {
  filters: ListingFilters;
  onFiltersChange: (filters: ListingFilters) => void;
  totalCount: number;
}

export interface ActionButtonsProps {
  listing: DashboardListing;
  onEdit: () => void;
  onDelete: () => void;
  onMarkAsSold: () => void;
  onView: () => void;
  loading?: boolean;
} 