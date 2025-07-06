'use client';

import { useState, useId } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MaterialYouIcon } from '@/components/ui/MaterialYouIcon';
import { cn } from '@/lib/utils';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/lib/auth';

interface ListingCardProps {
  listing: {
    id: string;
    title: string;
    make: string;
    model: string;
    year: number;
    price: number;
    location: string;
    description: string;
    engine?: string;
    transmission?: string;
    mileage?: number;
    condition?: string;
    created_at?: string;
    listing_images?: {
      image_url: string;
      is_primary: boolean;
    }[];
    modifications?: {
      name: string;
      description: string;
      category: string;
      created_at: string;
    }[];
  };
  viewMode?: 'grid' | 'list';
  className?: string;
}

export default function ListingCard({ listing, viewMode = 'grid', className }: ListingCardProps) {
  const { user } = useAuth();
  const { isFavorited, addToFavorites, removeFromFavorites, loading: favoritesLoading } = useFavorites();
  const [imageError, setImageError] = useState(false);
  const [favoriteActionStatus, setFavoriteActionStatus] = useState('');
  
  // Generate unique IDs for this instance
  const cardId = useId();
  const headingId = useId();
  const priceId = useId();
  const specsId = useId();
  
  const primaryImage = listing.listing_images?.find(img => img.is_primary) || listing.listing_images?.[0];
  const isListingFavorited = user ? isFavorited(listing.id) : false;

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      setFavoriteActionStatus('Please log in to save favorites');
      return;
    }

    try {
      setFavoriteActionStatus(isListingFavorited ? 'Removing from favorites...' : 'Adding to favorites...');
      
      if (isListingFavorited) {
        await removeFromFavorites(listing.id);
        setFavoriteActionStatus('Removed from favorites');
      } else {
        await addToFavorites(listing.id);
        setFavoriteActionStatus('Added to favorites');
      }
      
      // Clear status after delay
      setTimeout(() => setFavoriteActionStatus(''), 2000);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      setFavoriteActionStatus('Failed to update favorites');
      setTimeout(() => setFavoriteActionStatus(''), 2000);
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

  const formatMileage = (mileage?: number) => {
    if (!mileage) return 'N/A';
    return new Intl.NumberFormat('en-US').format(mileage) + ' mi';
  };

  // Enhanced accessibility descriptions
  const getCarDescription = () => {
    const parts = [listing.year, listing.make, listing.model];
    if (listing.condition) parts.push(listing.condition);
    return parts.join(' ');
  };

  const getDetailedDescription = () => {
    const details = [];
    details.push(`Price: ${formatPrice(listing.price)}`);
    if (listing.mileage) details.push(`Mileage: ${formatMileage(listing.mileage)}`);
    if (listing.engine) details.push(`Engine: ${listing.engine}`);
    if (listing.transmission) details.push(`Transmission: ${listing.transmission}`);
    details.push(`Location: ${listing.location}`);
    if (listing.modifications && listing.modifications.length > 0) {
      details.push(`${listing.modifications.length} modification${listing.modifications.length !== 1 ? 's' : ''}`);
    }
    return details.join(', ');
  };

  // Live region for favorite status announcements
  const favoriteStatusRegion = (
    <div 
      role="status" 
      aria-live="polite" 
      aria-atomic="true"
      className="sr-only"
    >
      {favoriteActionStatus}
    </div>
  );

  if (viewMode === 'list') {
    return (
      <>
        {favoriteStatusRegion}
        <article 
          id={cardId}
          className={cn(
            "flex items-start space-x-4 bg-md-sys-surface-container rounded-2xl border border-md-sys-outline-variant p-4 hover:shadow-md-elevation-2 transition-all duration-md-short2 ease-md-standard shadow-md-elevation-1",
            className
          )}
          aria-labelledby={headingId}
          aria-describedby={`${priceId} ${specsId}`}
        >
          {/* Image */}
          <div className="flex-shrink-0 w-24 h-18 bg-md-sys-surface-variant rounded-xl overflow-hidden shadow-md-elevation-1">
            {primaryImage && !imageError ? (
              <Image
                src={primaryImage.image_url}
                alt={`${getCarDescription()} - Main photo showing exterior view`}
                width={96}
                height={72}
                className="object-cover w-full h-full"
                onError={() => setImageError(true)}
              />
            ) : (
              <div 
                className="flex items-center justify-center h-full"
                role="img"
                aria-label={`No image available for ${getCarDescription()}`}
              >
                <MaterialYouIcon name="car" className="w-6 h-6 text-md-sys-on-surface-variant/30" aria-hidden={true} />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 
                  id={headingId}
                  className="text-md-body-large font-semibold text-md-sys-on-surface truncate mb-1"
                >
                  {listing.title}
                </h3>
                <p className="text-md-body-medium text-md-sys-on-surface-variant">
                  {getCarDescription()}
                </p>
              </div>
            </div>

            {/* Enhanced Info Grid */}
            <div 
              id={specsId}
              className="grid grid-cols-3 gap-3 mb-3"
              role="group"
              aria-label="Vehicle specifications"
            >
              <div 
                className="bg-md-sys-primary-container rounded-xl p-2"
                role="group"
                aria-labelledby={priceId}
              >
                <p id={priceId} className="text-md-label-small font-semibold text-md-sys-on-primary-container/80 uppercase tracking-wide mb-0.5">
                  PRICE
                </p>
                <p className="text-md-title-medium font-bold text-md-sys-on-primary-container">
                  <span className="sr-only">Listed at </span>
                  {formatPrice(listing.price)}
                </p>
              </div>
              
              <div 
                className="bg-md-sys-surface-container-high rounded-xl p-2 border border-md-sys-outline-variant/50"
                role="group"
                aria-label="Vehicle mileage information"
              >
                <p className="text-md-label-small font-semibold text-md-sys-on-surface-variant uppercase tracking-wide mb-0.5">
                  MILEAGE
                </p>
                <p className="text-md-body-large font-bold text-md-sys-on-surface">
                  <span className="sr-only">Odometer reading: </span>
                  {formatMileage(listing.mileage)}
                </p>
              </div>
              
              <div 
                className="bg-md-sys-secondary-container rounded-xl p-2"
                role="group"
                aria-label="Vehicle location information"
              >
                <p className="text-md-label-small font-semibold text-md-sys-on-secondary-container/80 uppercase tracking-wide mb-0.5">
                  LOCATION
                </p>
                <p className="text-md-body-large font-bold text-md-sys-on-secondary-container truncate">
                  <span className="sr-only">Located in </span>
                  {listing.location}
                </p>
              </div>
            </div>

            {/* Additional Details */}
            {(listing.engine || listing.transmission) && (
              <div 
                className="flex items-center space-x-4 mb-3"
                role="group"
                aria-label="Engine and transmission details"
              >
                {listing.engine && (
                  <div className="flex items-center space-x-1">
                    <MaterialYouIcon name="engine" className="w-3 h-3 text-md-sys-on-surface-variant" aria-hidden={true} />
                    <span className="text-md-body-small text-md-sys-on-surface">
                      <span className="sr-only">Engine: </span>
                      {listing.engine}
                    </span>
                  </div>
                )}
                {listing.transmission && (
                  <div className="flex items-center space-x-1">
                    <MaterialYouIcon name="settings" className="w-3 h-3 text-md-sys-on-surface-variant" aria-hidden={true} />
                    <span className="text-md-body-small text-md-sys-on-surface">
                      <span className="sr-only">Transmission: </span>
                      {listing.transmission}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Screen Reader Summary */}
            <div className="sr-only">
              Complete vehicle details: {getDetailedDescription()}
            </div>
          </div>

          {/* Enhanced Actions - Fixed width buttons */}
          <div className="flex flex-col items-end space-y-2 w-20" role="group" aria-label="Vehicle actions">
            <Link
              href={`/listings/${listing.id}`}
              className="flex items-center justify-center w-full bg-md-sys-secondary text-md-sys-on-secondary px-2 py-2 rounded-lg hover:bg-md-sys-secondary/90 focus:bg-md-sys-secondary/90 focus:outline-none focus:ring-2 focus:ring-md-sys-secondary focus:ring-offset-2 transition-all duration-md-short2 ease-md-standard shadow-md-elevation-1 text-md-label-medium font-medium hover:scale-105"
              aria-label={`View details for ${listing.title} - ${getCarDescription()}`}
            >
              <span className="text-xs">View</span>
            </Link>
            
            {user && (
              <button
                onClick={handleFavoriteClick}
                disabled={favoritesLoading}
                className={cn(
                  "flex items-center justify-center w-full px-2 py-2 rounded-lg transition-all duration-md-short2 ease-md-standard shadow-md-elevation-1 text-md-label-medium font-medium hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed",
                  isListingFavorited
                    ? "bg-red-100 text-red-600 border border-red-200 hover:bg-red-200 focus:ring-red-500"
                    : "bg-md-sys-surface-container text-md-sys-on-surface border border-md-sys-outline-variant hover:bg-md-sys-surface-container-high focus:ring-md-sys-primary"
                )}
                aria-label={`${isListingFavorited ? 'Remove' : 'Add'} ${listing.title} ${isListingFavorited ? 'from' : 'to'} favorites`}
                aria-pressed={isListingFavorited}
              >
                {favoritesLoading ? (
                  <>
                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                    <span className="sr-only">Updating favorites...</span>
                  </>
                ) : (
                  <MaterialYouIcon 
                    name={isListingFavorited ? "heart" : "heart-outline"} 
                    className={cn(
                      "w-3 h-3",
                      isListingFavorited ? "text-red-600" : "text-md-sys-on-surface"
                    )}
                    aria-hidden={true}
                  />
                )}
              </button>
            )}
          </div>
        </article>
      </>
    );
  }

  // Grid view with enhanced accessibility
  return (
    <>
      {favoriteStatusRegion}
      <article
        id={cardId}
        className={cn(
          "bg-md-sys-surface-container rounded-2xl border border-md-sys-outline-variant overflow-hidden hover:shadow-md-elevation-2 transition-all duration-md-short2 ease-md-standard shadow-md-elevation-1 hover:scale-105 group",
          className
        )}
        aria-labelledby={headingId}
        aria-describedby={`${priceId} ${specsId}`}
      >
        {/* Image Container with Favorite Button */}
        <div className="relative aspect-[4/3] bg-md-sys-surface-variant overflow-hidden">
          {primaryImage && !imageError ? (
            <Image
              src={primaryImage.image_url}
              alt={`${getCarDescription()} - Main photo showing exterior view`}
              fill
              className="object-cover transition-transform duration-md-short2 ease-md-standard group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <div 
              className="flex items-center justify-center h-full"
              role="img"
              aria-label={`No image available for ${getCarDescription()}`}
            >
              <MaterialYouIcon name="car" className="w-12 h-12 text-md-sys-on-surface-variant/30" aria-hidden={true} />
            </div>
          )}
          
          {/* Favorite Button - Enhanced accessibility */}
          {user && (
            <button
              onClick={handleFavoriteClick}
              disabled={favoritesLoading}
              className={cn(
                "absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-all duration-md-short2 ease-md-standard hover:scale-110 focus:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-md-elevation-1",
                isListingFavorited 
                  ? "bg-red-100/90 hover:bg-red-100 border border-red-200 focus:ring-red-500" 
                  : "bg-white/90 hover:bg-white focus:ring-md-sys-primary"
              )}
              aria-label={`${isListingFavorited ? 'Remove' : 'Add'} ${listing.title} ${isListingFavorited ? 'from' : 'to'} favorites`}
              aria-pressed={isListingFavorited}
            >
              {favoritesLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                  <span className="sr-only">Updating favorites...</span>
                </>
              ) : (
                <MaterialYouIcon 
                  name={isListingFavorited ? "heart" : "heart-outline"} 
                  className={cn(
                    "w-4 h-4 transition-colors duration-md-short2 ease-md-standard",
                    isListingFavorited ? "text-red-500" : "text-gray-600 hover:text-red-500"
                  )}
                  aria-hidden={true}
                />
              )}
            </button>
          )}

          {/* Condition Badge */}
          {listing.condition && (
            <div className="absolute bottom-3 left-3">
              <span 
                className="bg-md-sys-surface/90 backdrop-blur-sm text-md-sys-on-surface px-2 py-1 rounded-lg text-md-label-small font-medium shadow-md-elevation-1 border border-md-sys-outline-variant/30"
                role="note"
                aria-label={`Vehicle condition: ${listing.condition}`}
              >
                {listing.condition}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title and Subtitle */}
          <header className="mb-3">
            <h3 
              id={headingId}
              className="text-md-body-large font-semibold text-md-sys-on-surface line-clamp-2 mb-1 group-hover:text-md-sys-primary transition-colors duration-md-short2 ease-md-standard"
            >
              {listing.title}
            </h3>
            <p className="text-md-body-medium text-md-sys-on-surface-variant">
              {getCarDescription()}
            </p>
          </header>

          {/* Enhanced Price Display */}
          <div 
            id={priceId}
            className="bg-md-sys-primary-container rounded-xl p-3 mb-3 shadow-md-elevation-1"
            role="group"
            aria-label="Vehicle pricing information"
          >
            <p className="text-md-label-medium font-semibold text-md-sys-on-primary-container/80 uppercase tracking-wide mb-0.5">
              PRICE
            </p>
            <p className="text-md-title-large font-bold text-md-sys-on-primary-container">
              <span className="sr-only">Listed at </span>
              {formatPrice(listing.price)}
            </p>
          </div>

          {/* Enhanced Specs */}
          <div 
            id={specsId}
            className="grid grid-cols-1 gap-2 mb-4"
            role="group"
            aria-label="Vehicle specifications"
          >
            <div 
              className="bg-md-sys-surface-container-high rounded-lg p-2 border border-md-sys-outline-variant/30 shadow-sm"
              role="group"
              aria-label="Mileage information"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <MaterialYouIcon name="speedometer" className="w-3 h-3 text-md-sys-on-surface-variant" aria-hidden={true} />
                  <span className="text-md-label-small font-medium text-md-sys-on-surface-variant uppercase tracking-wide">
                    MILEAGE
                  </span>
                </div>
                <span className="text-md-body-medium font-bold text-md-sys-on-surface">
                  <span className="sr-only">Odometer reading: </span>
                  {formatMileage(listing.mileage)}
                </span>
              </div>
            </div>
            
            {listing.transmission && (
              <div 
                className="bg-md-sys-surface-container-high rounded-lg p-2 border border-md-sys-outline-variant/30 shadow-sm"
                role="group"
                aria-label="Transmission information"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <MaterialYouIcon name="settings" className="w-3 h-3 text-md-sys-on-surface-variant" aria-hidden={true} />
                    <span className="text-md-label-small font-medium text-md-sys-on-surface-variant uppercase tracking-wide">
                      GEARBOX
                    </span>
                  </div>
                  <span className="text-md-body-medium font-bold text-md-sys-on-surface">
                    <span className="sr-only">Transmission type: </span>
                    {listing.transmission}
                  </span>
                </div>
              </div>
            )}
            
            <div 
              className="bg-md-sys-surface-container-high rounded-lg p-2 border border-md-sys-outline-variant/30 shadow-sm"
              role="group"
              aria-label="Location information"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <MaterialYouIcon name="map-pin" className="w-3 h-3 text-md-sys-on-surface-variant" aria-hidden={true} />
                  <span className="text-md-label-small font-medium text-md-sys-on-surface-variant uppercase tracking-wide">
                    LOCATION
                  </span>
                </div>
                <span className="text-md-body-medium font-bold text-md-sys-on-surface truncate">
                  <span className="sr-only">Located in </span>
                  {listing.location}
                </span>
              </div>
            </div>
          </div>

          {/* Modifications Indicator */}
          {listing.modifications && listing.modifications.length > 0 && (
            <div className="mb-3">
              <div 
                className="bg-md-sys-tertiary-container rounded-lg p-2 border border-md-sys-tertiary/20 shadow-sm"
                role="note"
                aria-label={`This vehicle has ${listing.modifications.length} modification${listing.modifications.length !== 1 ? 's' : ''}`}
              >
                <div className="flex items-center space-x-1">
                  <MaterialYouIcon name="engine" className="w-3 h-3 text-md-sys-on-tertiary-container" aria-hidden={true} />
                  <span className="text-md-label-small font-medium text-md-sys-on-tertiary-container">
                    {listing.modifications.length} Modification{listing.modifications.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Screen Reader Summary */}
          <div className="sr-only">
            Complete vehicle details: {getDetailedDescription()}
          </div>

          {/* Action Button */}
          <Link
            href={`/listings/${listing.id}`}
            className="flex items-center justify-center gap-2 w-full bg-md-sys-secondary text-md-sys-on-secondary py-2.5 rounded-lg hover:bg-md-sys-secondary/90 focus:bg-md-sys-secondary/90 transition-all duration-md-short2 ease-md-standard hover:scale-105 focus:scale-105 focus:outline-none focus:ring-2 focus:ring-md-sys-secondary focus:ring-offset-2 shadow-md-elevation-1 text-md-body-medium font-medium"
            aria-label={`View full details for ${listing.title} - ${getCarDescription()}`}
          >
            <span>View Details</span>
            <MaterialYouIcon name="arrow-right" className="w-4 h-4" aria-hidden={true} />
          </Link>
        </div>
      </article>
    </>
  );
} 