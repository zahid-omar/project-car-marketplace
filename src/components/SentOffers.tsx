'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';
import Link from 'next/link';
import { OfferWithDetails, OFFER_STATUS_LABELS, OFFER_STATUS_COLORS } from '@/types/offers';
import LoadingSpinner from '@/components/LoadingSpinner';
import CounterOfferModal from '@/components/CounterOfferModal';

interface SentOffersProps {
  className?: string;
}

export default function SentOffers({ className }: SentOffersProps) {
  const [offers, setOffers] = useState<OfferWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  // Counter-offer modal state
  const [counterOfferModal, setCounterOfferModal] = useState<{
    isOpen: boolean;
    offer: OfferWithDetails | null;
  }>({
    isOpen: false,
    offer: null,
  });

  const supabase = createClientComponentClient();

  const fetchSentOffers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        type: 'sent',
        limit: '50',
        ...(filters.status !== 'all' && { status: filters.status })
      });

      const response = await fetch(`/api/offers?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch offers');
      }

      const data = await response.json();
      
      // Sort offers based on current filter
      let sortedOffers = [...(data.offers || [])];
      sortedOffers.sort((a, b) => {
        const aValue = a[filters.sortBy as keyof OfferWithDetails];
        const bValue = b[filters.sortBy as keyof OfferWithDetails];
        
        if (filters.sortOrder === 'desc') {
          return bValue > aValue ? 1 : -1;
        } else {
          return aValue > bValue ? 1 : -1;
        }
      });

      setOffers(sortedOffers);
    } catch (err: any) {
      console.error('Error fetching sent offers:', err);
      setError(err.message || 'Failed to load sent offers');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchSentOffers();
  }, [fetchSentOffers]);

  const handleWithdrawOffer = async (offerId: string) => {
    const confirmed = confirm('Are you sure you want to withdraw this offer?');
    if (!confirmed) return;

    try {
      setActionLoading(offerId);
      setError(null);

      const response = await fetch('/api/offers', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          offer_id: offerId,
          status: 'withdrawn'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to withdraw offer');
      }

      const result = await response.json();
      
      // Update the offer in local state
      setOffers(prev => prev.map(offer => 
        offer.id === offerId ? result.offer : offer
      ));

      alert('Offer withdrawn successfully!');

    } catch (err: any) {
      console.error('Error withdrawing offer:', err);
      setError(err.message || 'Failed to withdraw offer');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCounterOffer = (offer: OfferWithDetails) => {
    setCounterOfferModal({
      isOpen: true,
      offer,
    });
  };

  const handleCounterOfferSuccess = (newCounterOffer: OfferWithDetails) => {
    // Add the new counter-offer to the list
    setOffers(prev => [newCounterOffer, ...prev]);
    
    // Update the original offer status to 'countered'
    setOffers(prev => prev.map(offer => 
      offer.id === counterOfferModal.offer?.id 
        ? { ...offer, status: 'countered' }
        : offer
    ));

    // Close the modal
    setCounterOfferModal({
      isOpen: false,
      offer: null,
    });
  };

  const handleCloseCounterOfferModal = () => {
    setCounterOfferModal({
      isOpen: false,
      offer: null,
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getOfferPercentage = (offerAmount: number, listingPrice: number) => {
    return Math.round((offerAmount / listingPrice) * 100);
  };

  const getExpirationStatus = (expiresAt: string) => {
    const now = new Date();
    const expiration = new Date(expiresAt);
    const hoursLeft = Math.max(0, Math.floor((expiration.getTime() - now.getTime()) / (1000 * 60 * 60)));
    
    if (hoursLeft === 0) {
      return { text: 'Expired', color: 'text-red-600', urgent: true };
    } else if (hoursLeft <= 24) {
      return { text: `${hoursLeft}h left`, color: 'text-yellow-600', urgent: true };
    } else {
      const daysLeft = Math.ceil(hoursLeft / 24);
      return { text: `${daysLeft}d left`, color: 'text-gray-500', urgent: false };
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColor = OFFER_STATUS_COLORS[status as keyof typeof OFFER_STATUS_COLORS] || 'bg-gray-100 text-gray-800';
    const statusLabel = OFFER_STATUS_LABELS[status as keyof typeof OFFER_STATUS_LABELS] || status;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
        {statusLabel}
      </span>
    );
  };

  if (loading) {
    return (
      <div className={`bg-md-sys-surface-container rounded-3xl shadow-md-elevation-1 p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-md-sys-surface-container rounded-3xl shadow-md-elevation-1 border border-md-sys-outline-variant/50 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-md-sys-outline-variant">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-md-headline-small font-semibold text-md-sys-on-surface">Your Offers</h2>
            <p className="text-md-body-large text-md-sys-on-surface-variant">Track offers you've submitted</p>
          </div>
          
          {/* Filter Controls */}
          <div className="flex space-x-3">
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="border border-md-sys-outline rounded-xl px-4 py-2.5 text-md-body-medium bg-md-sys-surface text-md-sys-on-surface focus:border-md-sys-primary focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 shadow-md-elevation-1"
            >
              <option value="all">All Offers</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="countered">Countered</option>
              <option value="expired">Expired</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
            
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
              className="border border-md-sys-outline rounded-xl px-4 py-2.5 text-md-body-medium bg-md-sys-surface text-md-sys-on-surface focus:border-md-sys-primary focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 shadow-md-elevation-1"
            >
              <option value="created_at">Date Submitted</option>
              <option value="offer_amount">Offer Amount</option>
              <option value="expires_at">Expiration</option>
            </select>
            
            <button
              onClick={fetchSentOffers}
              className="bg-md-sys-secondary text-md-sys-on-secondary px-5 py-2.5 rounded-xl hover:bg-md-sys-secondary/90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-md-sys-secondary/20 text-md-label-large font-medium shadow-md-elevation-1"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-6 mt-4 bg-md-sys-error-container border border-md-sys-error/20 rounded-2xl p-6 shadow-md-elevation-1">
          <p className="text-md-sys-on-error-container text-md-body-large font-medium">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-3 bg-md-sys-error text-md-sys-on-error px-4 py-2 rounded-xl hover:bg-md-sys-error/90 transition-all duration-200 text-md-label-medium font-medium shadow-md-elevation-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Offers List */}
      <div className="p-6">
        {offers.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-md-sys-surface-container-high rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">📤</span>
            </div>
            <h3 className="text-md-title-large font-semibold text-md-sys-on-surface mb-3">No Offers Submitted</h3>
            <p className="text-md-body-large text-md-sys-on-surface-variant">
              {filters.status === 'all' 
                ? "You haven't submitted any offers yet." 
                : `No ${filters.status} offers found.`}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {offers.map((offer) => {
              const expiration = getExpirationStatus(offer.expires_at);
              const percentage = getOfferPercentage(offer.offer_amount, offer.listing.price);
              const isPending = offer.status === 'pending';
              const isCountered = offer.status === 'countered';
              const isExpired = offer.status === 'expired' || expiration.text === 'Expired';

              return (
                <div 
                  key={offer.id} 
                  className={`border border-md-sys-outline-variant rounded-3xl p-6 bg-md-sys-surface hover:bg-md-sys-surface-container transition-all duration-200 shadow-md-elevation-1 hover:shadow-md-elevation-2 ${
                    isPending && !isExpired ? 'ring-2 ring-md-sys-primary/30 bg-md-sys-primary-container/5' : ''
                  } ${isCountered ? 'ring-2 ring-md-sys-tertiary/30 bg-md-sys-tertiary-container/5' : ''}`}
                >
                  <div className="flex items-start space-x-6">
                    {/* Listing Image */}
                    <div className="flex-shrink-0">
                      {offer.listing.listing_images?.length > 0 ? (
                        <Image
                          src={offer.listing.listing_images[0].image_url}
                          alt={offer.listing.title}
                          width={100}
                          height={75}
                          className="rounded-2xl object-cover shadow-md-elevation-1"
                        />
                      ) : (
                        <div className="w-25 h-19 bg-md-sys-surface-container-high rounded-2xl flex items-center justify-center shadow-md-elevation-1">
                          <span className="text-md-sys-on-surface-variant text-md-body-small">No Image</span>
                        </div>
                      )}
                    </div>

                    {/* Offer Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-md-title-large font-semibold text-md-sys-on-surface truncate">
                              {offer.listing.title}
                            </h4>
                            {offer.is_counter_offer && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full bg-md-sys-tertiary-container text-md-sys-on-tertiary-container text-md-label-medium font-medium">
                                🔄 Counter #{offer.counter_offer_count}
                              </span>
                            )}
                          </div>
                          <p className="text-md-body-large text-md-sys-on-surface-variant">
                            {offer.listing.year} {offer.listing.make} {offer.listing.model}
                          </p>
                        </div>
                        {getStatusBadge(offer.status)}
                      </div>

                      {/* Enhanced Price Display */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-md-sys-primary-container rounded-2xl p-4">
                          <p className="text-md-label-large font-semibold text-md-sys-on-primary-container/80 uppercase tracking-wide mb-1">YOUR OFFER</p>
                          <p className="text-md-display-small font-bold text-md-sys-on-primary-container">
                            {formatPrice(offer.offer_amount)}
                          </p>
                          <p className="text-md-body-medium text-md-sys-on-primary-container/70 font-medium mt-1">
                            {percentage}% of asking
                          </p>
                        </div>
                        
                        <div className="bg-md-sys-surface-container-high rounded-2xl p-4 border border-md-sys-outline-variant/50">
                          <p className="text-md-label-large font-semibold text-md-sys-on-surface-variant uppercase tracking-wide mb-1">ASKING PRICE</p>
                          <p className="text-md-title-large font-bold text-md-sys-on-surface">
                            {formatPrice(offer.listing.price)}
                          </p>
                        </div>
                        
                        <div className="bg-md-sys-secondary-container rounded-2xl p-4">
                          <p className="text-md-label-large font-semibold text-md-sys-on-secondary-container/80 uppercase tracking-wide mb-1">SELLER</p>
                          <p className="text-md-title-large font-bold text-md-sys-on-secondary-container">
                            {offer.seller.display_name}
                          </p>
                        </div>
                      </div>

                      {/* Offer Terms */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {offer.cash_offer && (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-green-100 text-green-800 text-md-label-medium font-medium">
                            💰 Cash Offer
                          </span>
                        )}
                        {offer.financing_needed && (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-100 text-blue-800 text-md-label-medium font-medium">
                            🏦 Financing Needed
                          </span>
                        )}
                        {offer.inspection_contingency && (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-yellow-100 text-yellow-800 text-md-label-medium font-medium">
                            🔍 Inspection Required
                          </span>
                        )}
                      </div>

                      {/* Message */}
                      {offer.message && (
                        <div className="bg-md-sys-surface-container-high rounded-2xl p-4 mb-4 border border-md-sys-outline-variant/30">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">💬</span>
                            <p className="text-md-label-large font-semibold text-md-sys-on-surface uppercase tracking-wide">YOUR MESSAGE</p>
                          </div>
                          <p className="text-md-body-large text-md-sys-on-surface leading-relaxed">{offer.message}</p>
                        </div>
                      )}

                      {/* Timing Info */}
                      <div className="flex items-center justify-between text-md-body-medium text-md-sys-on-surface-variant border-t border-md-sys-outline-variant/30 pt-4">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-md-sys-on-surface-variant/50 rounded-full"></span>
                          <span>Submitted {formatDate(offer.created_at)}</span>
                        </div>
                        {isPending && !isExpired && (
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${expiration.urgent ? 'bg-red-500 animate-pulse' : 'bg-yellow-500'}`}></span>
                            <span className={`font-semibold ${expiration.color} ${expiration.urgent ? 'animate-pulse' : ''}`}>
                              {expiration.text}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Enhanced Action Buttons */}
                    <div className="flex-shrink-0">
                      <div className="flex flex-col space-y-3">
                        <Link
                          href={`/listings/${offer.listing.id}`}
                          className="bg-md-sys-surface-container text-md-sys-on-surface px-5 py-2.5 rounded-xl border border-md-sys-outline-variant hover:bg-md-sys-surface-container-high transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 text-md-label-large font-medium text-center shadow-md-elevation-1"
                        >
                          View Listing
                        </Link>
                        
                        {isPending && !isExpired && (
                          <button
                            onClick={() => handleWithdrawOffer(offer.id)}
                            disabled={actionLoading === offer.id}
                            className="bg-md-sys-error-container text-md-sys-on-error-container px-5 py-2.5 rounded-xl border border-md-sys-error/20 hover:bg-md-sys-error-container/80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-md-sys-error/20 text-md-label-large font-medium disabled:opacity-60 disabled:cursor-not-allowed shadow-md-elevation-1"
                          >
                            {actionLoading === offer.id ? 'Processing...' : '🚫 Withdraw'}
                          </button>
                        )}

                        {isCountered && (
                          <button
                            onClick={() => handleCounterOffer(offer)}
                            disabled={actionLoading === offer.id}
                            className="bg-md-sys-tertiary text-md-sys-on-tertiary px-5 py-2.5 rounded-xl hover:bg-md-sys-tertiary/90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-md-sys-tertiary/20 text-md-label-large font-semibold disabled:opacity-60 disabled:cursor-not-allowed shadow-md-elevation-2"
                          >
                            🔄 Respond to Counter
                          </button>
                        )}

                        {offer.status === 'accepted' && (
                          <div className="bg-green-100 rounded-xl p-3 text-center">
                            <span className="text-green-700 text-md-label-large font-semibold">✅ Accepted</span>
                          </div>
                        )}

                        {offer.status === 'rejected' && (
                          <div className="bg-red-100 rounded-xl p-3 text-center">
                            <span className="text-red-700 text-md-label-large font-semibold">❌ Rejected</span>
                          </div>
                        )}

                        {offer.status === 'withdrawn' && (
                          <div className="bg-gray-100 rounded-xl p-3 text-center">
                            <span className="text-gray-600 text-md-label-large font-semibold">🚫 Withdrawn</span>
                          </div>
                        )}

                        {isExpired && (
                          <div className="bg-gray-100 rounded-xl p-3 text-center">
                            <span className="text-gray-600 text-md-label-large font-semibold">⏰ Expired</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Counter-Offer Modal */}
      {counterOfferModal.offer && (
        <CounterOfferModal
          isOpen={counterOfferModal.isOpen}
          onClose={handleCloseCounterOfferModal}
          originalOffer={counterOfferModal.offer}
          userRole="buyer" // Buyer is responding to seller's counter-offer
          onSuccess={handleCounterOfferSuccess}
        />
      )}
    </div>
  );
} 