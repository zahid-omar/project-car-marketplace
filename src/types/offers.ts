// Core offer types
export interface Offer {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  
  // Offer details
  offer_amount: number;
  message?: string;
  
  // Offer terms
  cash_offer: boolean;
  financing_needed: boolean;
  inspection_contingency: boolean;
  
  // Status and tracking
  status: 'pending' | 'accepted' | 'rejected' | 'countered' | 'expired' | 'withdrawn';
  expires_at: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
  accepted_at?: string;
  rejected_at?: string;
  expired_at?: string;
  
  // Counter-offer tracking
  original_offer_id?: string;
  counter_offer_count: number;
  is_counter_offer: boolean;
}

// Offer with related data for display
export interface OfferWithDetails extends Offer {
  listing: {
    id: string;
    title: string;
    make: string;
    model: string;
    year: number;
    price: number;
    status: string;
    listing_images: {
      image_url: string;
      is_primary: boolean;
    }[];
  };
  buyer: {
    id: string;
    display_name: string;
    profile_image_url?: string;
  };
  seller: {
    id: string;
    display_name: string;
    profile_image_url?: string;
  };
}

// Offer history tracking
export interface OfferHistory {
  id: string;
  offer_id: string;
  action_type: 'created' | 'updated' | 'accepted' | 'rejected' | 'countered' | 'expired' | 'withdrawn';
  action_by: string;
  action_details: Record<string, any>;
  created_at: string;
}

// Offer notifications
export interface OfferNotification {
  id: string;
  offer_id: string;
  user_id: string;
  notification_type: 'offer_received' | 'offer_accepted' | 'offer_rejected' | 'offer_countered' | 'offer_expired' | 'counter_offer_received';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
}

// API request/response types
export interface CreateOfferRequest {
  listing_id: string;
  offer_amount: number;
  message?: string;
  cash_offer?: boolean;
  financing_needed?: boolean;
  inspection_contingency?: boolean;
}

export interface CreateOfferResponse {
  offer: OfferWithDetails;
}

export interface UpdateOfferStatusRequest {
  offer_id: string;
  status: 'accepted' | 'rejected' | 'withdrawn';
  rejection_reason?: string;
}

export interface UpdateOfferStatusResponse {
  offer: OfferWithDetails;
}

export interface GetOffersRequest {
  type?: 'sent' | 'received'; // Filter by offers sent by user or received by user
  status?: string;
  listing_id?: string;
  limit?: number;
  offset?: number;
}

export interface GetOffersResponse {
  offers: OfferWithDetails[];
}

// Counter-offer specific types
export interface CreateCounterOfferRequest {
  original_offer_id: string;
  offer_amount: number;
  message?: string;
  cash_offer?: boolean;
  financing_needed?: boolean;
  inspection_contingency?: boolean;
}

// Form data types
export interface OfferFormData {
  offerAmount: string;
  message: string;
  financingNeeded: boolean;
  inspectionContingency: boolean;
  cashOffer: boolean;
}

// Component prop types
export interface MakeOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  listingTitle: string;
  listingPrice: number;
  sellerName: string;
}

export interface OfferCardProps {
  offer: OfferWithDetails;
  userRole: 'buyer' | 'seller';
  onAccept?: (offerId: string) => void;
  onReject?: (offerId: string, reason?: string) => void;
  onWithdraw?: (offerId: string) => void;
  onCounterOffer?: (offerId: string) => void;
}

export interface OfferListProps {
  offers: OfferWithDetails[];
  userRole: 'buyer' | 'seller';
  loading?: boolean;
  onOfferAction?: (action: string, offerId: string, data?: any) => void;
}

// Offer management state
export interface OfferState {
  offers: OfferWithDetails[];
  loading: boolean;
  error: string | null;
  selectedOffer: OfferWithDetails | null;
}

export type OfferAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_OFFERS'; payload: OfferWithDetails[] }
  | { type: 'ADD_OFFER'; payload: OfferWithDetails }
  | { type: 'UPDATE_OFFER'; payload: OfferWithDetails }
  | { type: 'REMOVE_OFFER'; payload: string }
  | { type: 'SELECT_OFFER'; payload: OfferWithDetails | null };

// Analytics and statistics
export interface OfferAnalytics {
  totalOffers: number;
  pendingOffers: number;
  acceptedOffers: number;
  rejectedOffers: number;
  withdrawnOffers: number;
  expiredOffers: number;
  averageOfferAmount: number;
  averageResponseTime: number; // in hours
  acceptanceRate: number; // percentage
}

export interface OfferStatistics {
  offersReceived: OfferAnalytics;
  offersSent: OfferAnalytics;
  monthlyStats: {
    month: string;
    received: number;
    sent: number;
    accepted: number;
    rejected: number;
  }[];
}

// Validation helpers
export interface OfferValidationRules {
  minAmount: number;
  maxAmount: number;
  maxPercentageAboveAsking: number;
  minPercentageOfAsking: number;
  expirationDays: number;
}

// Error types
export interface OfferError {
  code: string;
  message: string;
  field?: string;
}

// Utility types
export type OfferStatus = Offer['status'];
export type OfferActionType = OfferHistory['action_type'];
export type NotificationType = OfferNotification['notification_type'];

// Constants
export const OFFER_STATUS_LABELS: Record<OfferStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
  countered: 'Countered',
  expired: 'Expired',
  withdrawn: 'Withdrawn'
};

export const OFFER_STATUS_COLORS: Record<OfferStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  countered: 'bg-blue-100 text-blue-800',
  expired: 'bg-gray-100 text-gray-800',
  withdrawn: 'bg-gray-100 text-gray-800'
};

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  offer_received: 'New Offer',
  offer_accepted: 'Offer Accepted',
  offer_rejected: 'Offer Rejected',
  offer_countered: 'Offer Countered',
  offer_expired: 'Offer Expired',
  counter_offer_received: 'Counter Offer'
}; 