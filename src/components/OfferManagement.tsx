'use client';

import { useState, useEffect, useCallback, useId } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';
import Link from 'next/link';
import { OfferWithDetails, OFFER_STATUS_LABELS, OFFER_STATUS_COLORS } from '@/types/offers';
import LoadingSpinner from '@/components/LoadingSpinner';
import CounterOfferModal from '@/components/CounterOfferModal';

interface OfferManagementProps {
  className?: string;
}

export default function OfferManagement({ className }: OfferManagementProps) {
  const [offers, setOffers] = useState<OfferWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  const [counterOfferModal, setCounterOfferModal] = useState<{
    isOpen: boolean;
    offer: OfferWithDetails | null;
  }>({
    isOpen: false,
    offer: null,
  });

  // Accessibility state
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [filterAnnouncement, setFilterAnnouncement] = useState<string>('');

  // Accessibility IDs
  const titleId = useId();
  const statusFilterId = useId();
  const sortFilterId = useId();
  const statusRegionId = useId();
  const filterRegionId = useId();
  const offersRegionId = useId();

  const supabase = createClientComponentClient();

  const fetchOffers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // First, trigger expiration check
      try {
        await fetch('/api/offers/expire', { method: 'POST' });
      } catch (expireError) {
        console.warn('Expiration check failed:', expireError);
        // Continue with fetching offers even if expiration check fails
      }

      const params = new URLSearchParams({
        type: 'received',
        limit: '50',
        ...(filters.status !== 'all' && { status: filters.status })
      });

      const response = await fetch(`/api/offers?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch offers');
      }

      const data = await response.json();
      
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

      // Announce results
      const statusLabel = filters.status === 'all' ? 'all' : filters.status;
      setFilterAnnouncement(`Found ${sortedOffers.length} ${statusLabel} offer${sortedOffers.length === 1 ? '' : 's'}`);
      
    } catch (err: any) {
      console.error('Error fetching offers:', err);
      setError(err.message || 'Failed to load offers');
      setStatusMessage('Error loading offers. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  // Set up periodic expiration checking
  useEffect(() => {
    const checkExpiration = () => {
      setOffers(prev => prev.map(offer => {
        const expiration = getExpirationStatus(offer.expires_at, offer.status);
        // If an offer has expired based on time but status is still pending, refresh data
        if (expiration.isExpired && offer.status === 'pending') {
          // Trigger a refresh to get updated status from server
          fetchOffers();
          return offer;
        }
        return offer;
      }));
    };

    // Check every minute for expiration updates
    const interval = setInterval(checkExpiration, 60000);
    
    return () => clearInterval(interval);
  }, [fetchOffers]);

  const handleOfferAction = async (offerId: string, action: 'accepted' | 'rejected', rejectionReason?: string) => {
    try {
      setActionLoading(offerId);
      setError(null);

      // Check if the specific offer has expired before attempting action
      const currentOffer = offers.find(o => o.id === offerId);
      if (currentOffer) {
        const expiration = getExpirationStatus(currentOffer.expires_at, currentOffer.status);
        if (expiration.isExpired) {
          setError('This offer has expired and cannot be modified');
          setStatusMessage('Action failed: Offer has expired');
          return;
        }
      }

      const response = await fetch('/api/offers', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          offer_id: offerId,
          status: action,
          rejection_reason: rejectionReason
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} offer`);
      }

      const result = await response.json();
      
      setOffers(prev => prev.map(offer => 
        offer.id === offerId ? result.offer : offer
      ));

      const actionMessage = action === 'accepted' ? 'accepted' : 'rejected';
      setStatusMessage(`Offer ${actionMessage} successfully`);

    } catch (err: any) {
      console.error(`Error ${action} offer:`, err);
      setError(err.message || `Failed to ${action} offer`);
      setStatusMessage(`Error: Failed to ${action} offer`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAcceptOffer = async (offerId: string) => {
    const confirmed = confirm('Are you sure you want to accept this offer? This will mark your listing as sold.');
    if (confirmed) {
      await handleOfferAction(offerId, 'accepted');
    }
  };

  const handleRejectOffer = async (offerId: string) => {
    const reason = prompt('Optional: Provide a reason for rejection (will be sent to buyer):');
    const confirmed = confirm('Are you sure you want to reject this offer?');
    
    if (confirmed) {
      await handleOfferAction(offerId, 'rejected', reason || undefined);
    }
  };

  const handleCounterOffer = (offer: OfferWithDetails) => {
    setCounterOfferModal({
      isOpen: true,
      offer,
    });
    setStatusMessage('Counter-offer modal opened');
  };

  const handleCounterOfferSuccess = (newCounterOffer: OfferWithDetails) => {
    setOffers(prev => [newCounterOffer, ...prev]);
    
    setOffers(prev => prev.map(offer => 
      offer.id === counterOfferModal.offer?.id 
        ? { ...offer, status: 'countered' }
        : offer
    ));

    setCounterOfferModal({
      isOpen: false,
      offer: null,
    });
    setStatusMessage('Counter-offer sent successfully');
  };

  const handleCloseCounterOfferModal = () => {
    setCounterOfferModal({
      isOpen: false,
      offer: null,
    });
    setStatusMessage('Counter-offer modal closed');
  };

  const handleFilterChange = (filterType: 'status' | 'sortBy', value: string) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
    
    if (filterType === 'status') {
      const filterLabel = value === 'all' ? 'all offers' : `${value} offers`;
      setStatusMessage(`Filter changed to show ${filterLabel}`);
    } else {
      setStatusMessage(`Sort order changed to ${value}`);
    }
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

  const getExpirationStatus = (expiresAt: string, offerStatus: string) => {
    // If offer is already marked as expired, show that
    if (offerStatus === 'expired') {
      return { text: 'Expired', color: 'text-red-600', urgent: true, isExpired: true };
    }

    const now = new Date();
    const expiration = new Date(expiresAt);
    const timeLeft = expiration.getTime() - now.getTime();
    const hoursLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60)));
    
    if (timeLeft <= 0) {
      return { text: 'Expired', color: 'text-red-600', urgent: true, isExpired: true };
    } else if (hoursLeft <= 1) {
      const minutesLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60)));
      return { text: `${minutesLeft}m left`, color: 'text-red-500', urgent: true, isExpired: false };
    } else if (hoursLeft <= 24) {
      return { text: `${hoursLeft}h left`, color: 'text-yellow-600', urgent: true, isExpired: false };
    } else {
      const daysLeft = Math.ceil(hoursLeft / 24);
      return { text: `${daysLeft}d left`, color: 'text-gray-500', urgent: false, isExpired: false };
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
        <div className="flex items-center justify-center py-8" role="status" aria-live="polite">
          <LoadingSpinner />
          <span className="sr-only">Loading your offers...</span>
        </div>
      </div>
    );
  }

  return (
    <section 
      className={`bg-md-sys-surface-container rounded-3xl shadow-md-elevation-1 border border-md-sys-outline-variant/50 ${className}`}
      aria-labelledby={titleId}
      role="region"
    >
      {/* Status region for screen reader announcements */}
      <div
        id={statusRegionId}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {statusMessage}
      </div>

      {/* Filter results announcement */}
      <div
        id={filterRegionId}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {filterAnnouncement}
      </div>

      <header className="px-6 py-4 border-b border-md-sys-outline-variant">
        <div className="flex justify-between items-center">
          <div>
            <h1 id={titleId} className="text-md-headline-small font-semibold text-md-sys-on-surface">Incoming Offers</h1>
            <p className="text-md-body-large text-md-sys-on-surface-variant">Manage offers received on your listings</p>
          </div>
          
          <div className="flex space-x-3" role="group" aria-label="Offer management controls">
            <div className="relative">
              <label htmlFor={statusFilterId} className="sr-only">
                Filter offers by status
              </label>
              <select
                id={statusFilterId}
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="border border-md-sys-outline rounded-xl px-4 py-2.5 text-md-body-medium bg-md-sys-surface text-md-sys-on-surface focus:border-md-sys-primary focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 shadow-md-elevation-1 focus-visible:outline-2 focus-visible:outline-md-sys-primary"
                aria-describedby={`${statusFilterId}-help`}
              >
                <option value="all">All Offers</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="expired">Expired</option>
              </select>
              <div id={`${statusFilterId}-help`} className="sr-only">
                Filter the list of offers by their current status. Changes apply immediately.
              </div>
            </div>
            
            <div className="relative">
              <label htmlFor={sortFilterId} className="sr-only">
                Sort offers by
              </label>
              <select
                id={sortFilterId}
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="border border-md-sys-outline rounded-xl px-4 py-2.5 text-md-body-medium bg-md-sys-surface text-md-sys-on-surface focus:border-md-sys-primary focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 shadow-md-elevation-1 focus-visible:outline-2 focus-visible:outline-md-sys-primary"
                aria-describedby={`${sortFilterId}-help`}
              >
                <option value="created_at">Date Received</option>
                <option value="offer_amount">Offer Amount</option>
                <option value="expires_at">Expiration</option>
              </select>
              <div id={`${sortFilterId}-help`} className="sr-only">
                Choose how to sort the offer list. Changes apply immediately.
              </div>
            </div>
            
            <button
              onClick={fetchOffers}
              className="bg-md-sys-secondary text-md-sys-on-secondary px-5 py-2.5 rounded-xl hover:bg-md-sys-secondary/90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-md-sys-secondary/20 text-md-label-large font-medium shadow-md-elevation-1 focus-visible:outline-2 focus-visible:outline-md-sys-secondary focus-visible:outline-offset-2"
              aria-label="Refresh offers list to get latest updates"
            >
              Refresh
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div 
          className="mx-6 mt-4 bg-md-sys-error-container border border-md-sys-error/20 rounded-2xl p-6 shadow-md-elevation-1"
          role="alert"
          aria-live="assertive"
        >
          <p className="text-md-sys-on-error-container text-md-body-large font-medium">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-3 bg-md-sys-error text-md-sys-on-error px-4 py-2 rounded-xl hover:bg-md-sys-error/90 transition-all duration-200 text-md-label-medium font-medium shadow-md-elevation-1 focus-visible:outline-2 focus-visible:outline-md-sys-error focus-visible:outline-offset-2"
            aria-label="Dismiss error message"
          >
            Dismiss
          </button>
        </div>
      )}

      <main className="p-6" id={offersRegionId}>
        {offers.length === 0 ? (
          <div className="text-center py-12" role="region" aria-label="No offers found">
            <div className="w-20 h-20 bg-md-sys-surface-container-high rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl" aria-hidden="true">📥</span>
            </div>
            <h2 className="text-md-title-large font-semibold text-md-sys-on-surface mb-3">No Offers Yet</h2>
            <p className="text-md-body-large text-md-sys-on-surface-variant">
              {filters.status === 'all' 
                ? "You haven't received any offers on your listings yet." 
                : `No ${filters.status} offers found.`}
            </p>
          </div>
        ) : (
          <div 
            className="space-y-6"
            role="list"
            aria-label={`${offers.length} offer${offers.length === 1 ? '' : 's'} found`}
          >
            {offers.map((offer) => {
              const expiration = getExpirationStatus(offer.expires_at, offer.status);
              const percentage = getOfferPercentage(offer.offer_amount, offer.listing.price);
              const isPending = offer.status === 'pending';
              const isExpired = offer.status === 'expired' || expiration.isExpired;
              
              const offerId = `offer-${offer.id}`;
              const offerTitleId = `${offerId}-title`;
              const offerDetailsId = `${offerId}-details`;
              const vehicleTitle = `${offer.listing.year} ${offer.listing.make} ${offer.listing.model}`;

              return (
                <article 
                  key={offer.id} 
                  id={offerId}
                  className={`border border-md-sys-outline-variant rounded-3xl p-6 bg-md-sys-surface hover:bg-md-sys-surface-container transition-all duration-200 shadow-md-elevation-1 hover:shadow-md-elevation-2 focus-within:ring-2 focus-within:ring-md-sys-primary/20 ${
                    isPending && !isExpired ? 'ring-2 ring-md-sys-primary/30 bg-md-sys-primary-container/5' : ''
                  }`}
                  role="listitem"
                  aria-labelledby={offerTitleId}
                  aria-describedby={offerDetailsId}
                >
                  <div className="flex items-start space-x-6">
                    <div className="flex-shrink-0">
                      {offer.listing.listing_images?.length > 0 ? (
                        <Image
                          src={offer.listing.listing_images[0].image_url}
                          alt={`${vehicleTitle} - ${offer.listing.title}`}
                          width={100}
                          height={75}
                          className="rounded-2xl object-cover shadow-md-elevation-1"
                        />
                      ) : (
                        <div 
                          className="w-25 h-19 bg-md-sys-surface-container-high rounded-2xl flex items-center justify-center shadow-md-elevation-1"
                          role="img"
                          aria-label={`No image available for ${vehicleTitle}`}
                        >
                          <span className="text-md-sys-on-surface-variant text-md-body-small" aria-hidden="true">No Image</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 id={offerTitleId} className="text-md-title-large font-semibold text-md-sys-on-surface truncate">
                              {offer.listing.title}
                            </h3>
                            {offer.is_counter_offer && (
                              <span 
                                className="inline-flex items-center px-3 py-1 rounded-full bg-md-sys-tertiary-container text-md-sys-on-tertiary-container text-md-label-medium font-medium"
                                aria-label={`Counter offer number ${offer.counter_offer_count}`}
                              >
                                🔄 Counter #{offer.counter_offer_count}
                              </span>
                            )}
                          </div>
                          <p className="text-md-body-large text-md-sys-on-surface-variant">
                            {vehicleTitle}
                          </p>
                        </div>
                        <div aria-label={`Offer status: ${OFFER_STATUS_LABELS[offer.status as keyof typeof OFFER_STATUS_LABELS] || offer.status}`}>
                          {getStatusBadge(offer.status)}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4" role="list" aria-label="Offer details">
                        <div className="bg-md-sys-primary-container rounded-2xl p-4" role="listitem">
                          <p className="text-md-label-large font-semibold text-md-sys-on-primary-container/80 uppercase tracking-wide mb-1">OFFER AMOUNT</p>
                          <p className="text-md-display-small font-bold text-md-sys-on-primary-container" aria-label={`Offer amount: ${formatPrice(offer.offer_amount)}`}>
                            {formatPrice(offer.offer_amount)}
                          </p>
                          <p className="text-md-body-medium text-md-sys-on-primary-container/70 font-medium mt-1" aria-label={`${percentage} percent of asking price`}>
                            {percentage}% of asking
                          </p>
                        </div>
                        
                        <div className="bg-md-sys-surface-container-high rounded-2xl p-4 border border-md-sys-outline-variant/50" role="listitem">
                          <p className="text-md-label-large font-semibold text-md-sys-on-surface-variant uppercase tracking-wide mb-1">ASKING PRICE</p>
                          <p className="text-md-title-large font-bold text-md-sys-on-surface" aria-label={`Asking price: ${formatPrice(offer.listing.price)}`}>
                            {formatPrice(offer.listing.price)}
                          </p>
                        </div>
                        
                        <div className="bg-md-sys-secondary-container rounded-2xl p-4" role="listitem">
                          <p className="text-md-label-large font-semibold text-md-sys-on-secondary-container/80 uppercase tracking-wide mb-1">FROM</p>
                          <p className="text-md-title-large font-bold text-md-sys-on-secondary-container" aria-label={`Offer from: ${offer.buyer.display_name}`}>
                            {offer.buyer.display_name}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4" role="list" aria-label="Offer conditions">
                        {offer.cash_offer && (
                          <span 
                            className="inline-flex items-center px-3 py-1.5 rounded-full bg-green-100 text-green-800 text-md-label-medium font-medium"
                            role="listitem"
                            aria-label="Cash offer - no financing needed"
                          >
                            💰 Cash Offer
                          </span>
                        )}
                        {offer.financing_needed && (
                          <span 
                            className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-100 text-blue-800 text-md-label-medium font-medium"
                            role="listitem"
                            aria-label="Financing needed for this offer"
                          >
                            🏦 Financing Needed
                          </span>
                        )}
                        {offer.inspection_contingency && (
                          <span 
                            className="inline-flex items-center px-3 py-1.5 rounded-full bg-yellow-100 text-yellow-800 text-md-label-medium font-medium"
                            role="listitem"
                            aria-label="Inspection required as condition of offer"
                          >
                            🔍 Inspection Required
                          </span>
                        )}
                      </div>

                      {offer.message && (
                        <div className="bg-md-sys-surface-container-high rounded-2xl p-4 mb-4 border border-md-sys-outline-variant/30" role="region" aria-labelledby={`${offerId}-message-label`}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg" aria-hidden="true">💬</span>
                            <p id={`${offerId}-message-label`} className="text-md-label-large font-semibold text-md-sys-on-surface uppercase tracking-wide">MESSAGE</p>
                          </div>
                          <p className="text-md-body-large text-md-sys-on-surface leading-relaxed">{offer.message}</p>
                        </div>
                      )}

                      <footer className="flex items-center justify-between text-md-body-medium text-md-sys-on-surface-variant border-t border-md-sys-outline-variant/30 pt-4">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-md-sys-on-surface-variant/50 rounded-full" aria-hidden="true"></span>
                          <span aria-label={`Offer received on ${formatDate(offer.created_at)}`}>
                            Received {formatDate(offer.created_at)}
                          </span>
                        </div>
                        {isPending && !isExpired && (
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${expiration.urgent ? 'bg-red-500 animate-pulse' : 'bg-yellow-500'}`} aria-hidden="true"></span>
                            <span 
                              className={`font-semibold ${expiration.color} ${expiration.urgent ? 'animate-pulse' : ''}`}
                              aria-label={`Offer expires in ${expiration.text}${expiration.urgent ? ' - urgent action needed' : ''}`}
                            >
                              {expiration.text}
                            </span>
                          </div>
                        )}
                      </footer>
                    </div>

                    <div className="flex-shrink-0">
                      <nav className="flex flex-col space-y-3" aria-label={`Actions for ${vehicleTitle} offer`}>
                        <Link
                          href={`/listings/${offer.listing.id}`}
                          className="bg-md-sys-surface-container text-md-sys-on-surface px-5 py-2.5 rounded-xl border border-md-sys-outline-variant hover:bg-md-sys-surface-container-high transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 text-md-label-large font-medium text-center shadow-md-elevation-1 focus-visible:outline-2 focus-visible:outline-md-sys-primary focus-visible:outline-offset-2"
                          aria-label={`View full listing for ${vehicleTitle}`}
                        >
                          View Listing
                        </Link>
                        
                        {isPending && !isExpired && (
                          <>
                            <button
                              onClick={() => handleAcceptOffer(offer.id)}
                              disabled={actionLoading === offer.id}
                              className="bg-md-sys-primary text-md-sys-on-primary px-5 py-2.5 rounded-xl hover:bg-md-sys-primary/90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 text-md-label-large font-semibold disabled:opacity-60 disabled:cursor-not-allowed shadow-md-elevation-2 focus-visible:outline-2 focus-visible:outline-md-sys-primary focus-visible:outline-offset-2"
                              aria-label={`Accept offer of ${formatPrice(offer.offer_amount)} from ${offer.buyer.display_name}`}
                              aria-describedby={`${offerId}-accept-desc`}
                            >
                              {actionLoading === offer.id ? (
                                <>
                                  <span className="sr-only">Processing acceptance of offer...</span>
                                  Processing...
                                </>
                              ) : (
                                '✓ Accept'
                              )}
                            </button>
                            <div id={`${offerId}-accept-desc`} className="sr-only">
                              Accepting this offer will mark your listing as sold and send confirmation to the buyer
                            </div>

                            <button
                              onClick={() => handleCounterOffer(offer)}
                              disabled={actionLoading === offer.id}
                              className="bg-md-sys-secondary text-md-sys-on-secondary px-5 py-2.5 rounded-xl hover:bg-md-sys-secondary/90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-md-sys-secondary/20 text-md-label-large font-medium disabled:opacity-60 disabled:cursor-not-allowed shadow-md-elevation-1 focus-visible:outline-2 focus-visible:outline-md-sys-secondary focus-visible:outline-offset-2"
                              aria-label={`Make counter-offer to ${offer.buyer.display_name}'s offer of ${formatPrice(offer.offer_amount)}`}
                              aria-describedby={`${offerId}-counter-desc`}
                            >
                              🔄 Counter-Offer
                            </button>
                            <div id={`${offerId}-counter-desc`} className="sr-only">
                              Opens a dialog to create a counter-offer with different terms
                            </div>

                            <button
                              onClick={() => handleRejectOffer(offer.id)}
                              disabled={actionLoading === offer.id}
                              className="bg-md-sys-error-container text-md-sys-on-error-container px-5 py-2.5 rounded-xl border border-md-sys-error/20 hover:bg-md-sys-error-container/80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-md-sys-error/20 text-md-label-large font-medium disabled:opacity-60 disabled:cursor-not-allowed shadow-md-elevation-1 focus-visible:outline-2 focus-visible:outline-md-sys-error focus-visible:outline-offset-2"
                              aria-label={`Reject offer of ${formatPrice(offer.offer_amount)} from ${offer.buyer.display_name}`}
                              aria-describedby={`${offerId}-reject-desc`}
                            >
                              {actionLoading === offer.id ? (
                                <>
                                  <span className="sr-only">Processing rejection of offer...</span>
                                  Processing...
                                </>
                              ) : (
                                '✗ Reject'
                              )}
                            </button>
                            <div id={`${offerId}-reject-desc`} className="sr-only">
                              Rejecting this offer will decline it and optionally send feedback to the buyer
                            </div>
                          </>
                        )}

                        {offer.status === 'accepted' && (
                          <div className="bg-green-100 rounded-xl p-3 text-center" role="status" aria-label="This offer has been accepted">
                            <span className="text-green-700 text-md-label-large font-semibold" aria-hidden="true">✅ Accepted</span>
                          </div>
                        )}

                        {offer.status === 'rejected' && (
                          <div className="bg-red-100 rounded-xl p-3 text-center" role="status" aria-label="This offer has been rejected">
                            <span className="text-red-700 text-md-label-large font-semibold" aria-hidden="true">❌ Rejected</span>
                          </div>
                        )}

                        {(offer.status === 'expired' || expiration.isExpired) && (
                          <div className="bg-gray-100 rounded-xl p-3 text-center" role="status" aria-label="This offer has expired">
                            <span className="text-gray-700 text-md-label-large font-semibold" aria-hidden="true">⏰ Expired</span>
                          </div>
                        )}
                      </nav>
                    </div>
                  </div>

                  {/* Hidden details for screen readers */}
                  <div id={offerDetailsId} className="sr-only">
                    Offer for {vehicleTitle}. Amount: {formatPrice(offer.offer_amount)} ({percentage}% of asking price ${formatPrice(offer.listing.price)}). 
                    From: {offer.buyer.display_name}. Status: {OFFER_STATUS_LABELS[offer.status as keyof typeof OFFER_STATUS_LABELS] || offer.status}. 
                    {offer.cash_offer ? 'Cash offer.' : ''} 
                    {offer.financing_needed ? 'Financing needed.' : ''} 
                    {offer.inspection_contingency ? 'Inspection required.' : ''}
                    {isPending && !isExpired ? `Expires in ${expiration.text}.` : ''}
                    Received {formatDate(offer.created_at)}.
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {counterOfferModal.offer && (
        <CounterOfferModal
          isOpen={counterOfferModal.isOpen}
          onClose={handleCloseCounterOfferModal}
          originalOffer={counterOfferModal.offer}
          userRole="seller"
          onSuccess={handleCounterOfferSuccess}
        />
      )}
    </section>
  );
} 