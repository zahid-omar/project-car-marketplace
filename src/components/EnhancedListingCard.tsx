'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import SearchHighlighter from './SearchHighlighter';
import { MaterialYouIcon } from './ui/MaterialYouIcon';

interface EnhancedListingCardProps {
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
    created_at: string;
    listing_images: {
      image_url: string;
      is_primary: boolean;
    }[];
    modifications?: {
      name: string;
      description?: string;
      category: string;
    }[];
    relevanceScore?: number;
    views?: number;
    favorites?: number;
  };
  searchQuery?: string;
  viewMode?: 'grid' | 'list';
  showRelevanceScore?: boolean;
  showAnalytics?: boolean;
  onFavoriteToggle?: (listingId: string, isFavorited: boolean) => void;
  isFavorited?: boolean;
  className?: string;
}

export default function EnhancedListingCard({
  listing,
  searchQuery,
  viewMode = 'grid',
  showRelevanceScore = false,
  showAnalytics = false,
  onFavoriteToggle,
  isFavorited = false,
  className = ''
}: EnhancedListingCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [favorited, setFavorited] = useState(isFavorited);

  // Get primary image or first image
  const primaryImage = listing.listing_images?.find(img => img.is_primary) || listing.listing_images?.[0];
  const imageUrl = primaryImage?.image_url || '/placeholder-car.svg';

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
    return new Intl.NumberFormat('en-US').format(mileage) + ' miles';
  };

  const getTimeSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const getConditionColor = (condition?: string) => {
    if (!condition) return 'bg-surface-container text-on-surface-variant';
    switch (condition.toLowerCase()) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'very good': return 'bg-blue-100 text-blue-800';
      case 'good': return 'bg-cyan-100 text-cyan-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-surface-container text-on-surface-variant';
    }
  };

  const getRelevanceStars = (score?: number) => {
    if (!score) return 0;
    return Math.round(score * 5);
  };

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newFavoriteState = !favorited;
    setFavorited(newFavoriteState);
    onFavoriteToggle?.(listing.id, newFavoriteState);
  };

  // Grid view component
  if (viewMode === 'grid') {
    return (
      <Link href={`/listings/${listing.id}`} className={`group block ${className}`}>
        <div className="bg-surface rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-outline-variant group-hover:border-primary/20">
          {/* Image Container */}
          <div className="relative aspect-[4/3] overflow-hidden bg-surface-container">
            {isImageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-surface-container">
                <div className="animate-pulse">
                  <div className="w-12 h-12 bg-surface-container-high rounded-full flex items-center justify-center">
                    <MaterialYouIcon name="photo" size="lg" className="text-on-surface-variant" />
                  </div>
                </div>
              </div>
            )}
            
            <Image
              src={imageError ? '/placeholder-car.svg' : imageUrl}
              alt={listing.title}
              fill
              className={`object-cover group-hover:scale-105 transition-transform duration-300 ${
                isImageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={() => setIsImageLoading(false)}
              onError={() => {
                setImageError(true);
                setIsImageLoading(false);
              }}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
            
            {/* Top Row Badges */}
            <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
              {/* Condition Badge */}
              {listing.condition && (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getConditionColor(listing.condition)}`}>
                  {listing.condition}
                </span>
              )}
              
              {/* Relevance Score */}
              {showRelevanceScore && listing.relevanceScore && (
                <div className="bg-surface/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                  <MaterialYouIcon name="star" size="xs" className="text-yellow-500" />
                  <span className="text-xs font-medium text-on-surface">
                    {Math.round(listing.relevanceScore * 100)}%
                  </span>
                </div>
              )}
            </div>

            {/* Bottom Row Actions */}
            <div className="absolute bottom-3 right-3 flex gap-2">
              {/* Analytics */}
              {showAnalytics && (
                <div className="bg-surface/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                  <MaterialYouIcon name="eye" size="xs" className="text-on-surface-variant" />
                  <span className="text-xs text-on-surface-variant">{listing.views || 0}</span>
                </div>
              )}
              
              {/* Favorite Button */}
              <button
                onClick={handleFavoriteToggle}
                className="p-2 rounded-full bg-surface/90 backdrop-blur-sm hover:bg-surface shadow-sm transition-colors"
                aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
              >
                <MaterialYouIcon 
                  name={favorited ? "heart" : "heart-outline"} 
                  size="sm" 
                  className={favorited ? "text-red-500" : "text-on-surface-variant hover:text-red-500 transition-colors"} 
                />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            {/* Price and Relevance */}
            <div className="flex items-center justify-between mb-3">
              <div className="text-2xl font-bold text-on-surface">
                {formatPrice(listing.price)}
              </div>
              {showRelevanceScore && listing.relevanceScore && (
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <MaterialYouIcon
                      key={i}
                      name={i < getRelevanceStars(listing.relevanceScore) ? "star" : "star-outline"}
                      size="sm"
                      className={i < getRelevanceStars(listing.relevanceScore) ? 'text-yellow-500' : 'text-on-surface-variant/40'}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Title with Highlighting */}
            <h3 className="text-lg font-semibold text-on-surface mb-2 line-clamp-2 group-hover:text-primary transition-colors">
              <SearchHighlighter
                text={listing.title}
                searchQuery={searchQuery}
                maxLength={80}
              />
            </h3>

            {/* Car Details with Highlighting */}
            <div className="mb-3">
              <div className="text-primary font-medium">
                <SearchHighlighter
                  text={`${listing.year} ${listing.make} ${listing.model}`}
                  searchQuery={searchQuery}
                />
              </div>
            </div>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 gap-2 mb-4 text-sm text-on-surface-variant">
              <div className="flex items-center gap-1">
                <MaterialYouIcon name="engine" size="sm" className="text-on-surface-variant" />
                <SearchHighlighter
                  text={listing.engine || 'Engine N/A'}
                  searchQuery={searchQuery}
                  maxLength={20}
                />
              </div>
              <div className="flex items-center gap-1">
                <MaterialYouIcon name="speedometer" size="sm" className="text-on-surface-variant" />
                <span>{formatMileage(listing.mileage)}</span>
              </div>
              <div className="flex items-center gap-1">
                <MaterialYouIcon name="settings" size="sm" className="text-on-surface-variant" />
                <SearchHighlighter
                  text={listing.transmission || 'Trans N/A'}
                  searchQuery={searchQuery}
                  maxLength={15}
                />
              </div>
              <div className="flex items-center gap-1">
                <MaterialYouIcon name="map-pin" size="sm" className="text-on-surface-variant" />
                <SearchHighlighter
                  text={listing.location}
                  searchQuery={searchQuery}
                  maxLength={20}
                />
              </div>
            </div>

            {/* Modifications */}
            {listing.modifications && listing.modifications.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-medium text-on-surface-variant mb-2">MODIFICATIONS</div>
                <div className="flex flex-wrap gap-1">
                  {listing.modifications.slice(0, 3).map((mod, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary"
                      title={`${mod.category}: ${mod.name}`}
                    >
                      <span className="text-on-surface-variant font-normal">
                        {mod.category}:
                      </span>
                      <SearchHighlighter
                        text={mod.name}
                        searchQuery={searchQuery}
                        maxLength={12}
                      />
                    </span>
                  ))}
                  {listing.modifications.length > 3 && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-surface-container text-on-surface-variant">
                      +{listing.modifications.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-outline-variant">
              <div className="flex items-center gap-1 text-sm text-on-surface-variant">
                <MaterialYouIcon name="calendar" size="sm" />
                {getTimeSince(listing.created_at)}
              </div>
              <div className="flex items-center gap-1 text-primary text-sm font-medium">
                View Details
                <MaterialYouIcon name="chevron-right" size="sm" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // List view component
  return (
    <Link href={`/listings/${listing.id}`} className={`group block ${className}`}>
      <div className="bg-surface rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-outline-variant group-hover:border-primary/20">
        <div className="flex">
          {/* Image Container - List View */}
          <div className="relative w-48 h-32 flex-shrink-0 overflow-hidden bg-surface-container">
            {isImageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-surface-container">
                <div className="w-8 h-8 bg-surface-container-high rounded-full flex items-center justify-center">
                  <MaterialYouIcon name="photo" size="sm" className="text-on-surface-variant" />
                </div>
              </div>
            )}
            
            <Image
              src={imageError ? '/placeholder-car.svg' : imageUrl}
              alt={listing.title}
              fill
              className={`object-cover group-hover:scale-105 transition-transform duration-300 ${
                isImageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={() => setIsImageLoading(false)}
              onError={() => {
                setImageError(true);
                setIsImageLoading(false);
              }}
            />
            
            {/* List View Overlays */}
            <div className="absolute top-2 left-2">
              {listing.condition && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getConditionColor(listing.condition)}`}>
                  {listing.condition}
                </span>
              )}
            </div>
            
            <div className="absolute bottom-2 right-2">
              <button
                onClick={handleFavoriteToggle}
                className="p-1.5 rounded-full bg-surface/90 backdrop-blur-sm hover:bg-surface shadow-sm transition-colors"
                aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
              >
                <MaterialYouIcon 
                  name={favorited ? "heart" : "heart-outline"} 
                  size="xs" 
                  className={favorited ? "text-red-500" : "text-on-surface-variant hover:text-red-500 transition-colors"} 
                />
              </button>
            </div>
          </div>

          {/* Content - List View */}
          <div className="flex-1 p-4 min-w-0">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-semibold text-on-surface group-hover:text-primary transition-colors line-clamp-1">
                  <SearchHighlighter
                    text={listing.title}
                    searchQuery={searchQuery}
                    maxLength={60}
                  />
                </h3>
                <div className="text-primary font-medium">
                  <SearchHighlighter
                    text={`${listing.year} ${listing.make} ${listing.model}`}
                    searchQuery={searchQuery}
                  />
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-xl font-bold text-on-surface">
                  {formatPrice(listing.price)}
                </div>
                {showRelevanceScore && listing.relevanceScore && (
                  <div className="flex items-center gap-1 justify-end mt-1">
                    <MaterialYouIcon name="star" size="xs" className="text-yellow-500" />
                    <span className="text-xs text-on-surface-variant">
                      {Math.round(listing.relevanceScore * 100)}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-on-surface-variant mb-3">
              <div className="flex items-center gap-1">
                <MaterialYouIcon name="engine" size="sm" className="text-on-surface-variant" />
                <SearchHighlighter
                  text={listing.engine || 'Engine N/A'}
                  searchQuery={searchQuery}
                  maxLength={15}
                />
              </div>
              <div className="flex items-center gap-1">
                <MaterialYouIcon name="speedometer" size="sm" className="text-on-surface-variant" />
                <span>{formatMileage(listing.mileage)}</span>
              </div>
              <div className="flex items-center gap-1">
                <MaterialYouIcon name="settings" size="sm" className="text-on-surface-variant" />
                <SearchHighlighter
                  text={listing.transmission || 'Trans N/A'}
                  searchQuery={searchQuery}
                  maxLength={10}
                />
              </div>
              <div className="flex items-center gap-1">
                <MaterialYouIcon name="map-pin" size="sm" className="text-on-surface-variant" />
                <SearchHighlighter
                  text={listing.location}
                  searchQuery={searchQuery}
                  maxLength={15}
                />
              </div>
            </div>

            {/* Description Preview */}
            <div className="text-sm text-on-surface-variant line-clamp-2 mb-3">
              <SearchHighlighter
                text={listing.description}
                searchQuery={searchQuery}
                maxLength={120}
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-on-surface-variant">
                <span className="flex items-center gap-1">
                  <MaterialYouIcon name="calendar" size="sm" />
                  {getTimeSince(listing.created_at)}
                </span>
                {showAnalytics && (
                  <span className="flex items-center gap-1">
                    <MaterialYouIcon name="eye" size="sm" />
                    {listing.views || 0} views
                  </span>
                )}
              </div>
              
              {listing.modifications && listing.modifications.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-xs text-on-surface-variant">Modifications:</span>
                  <div className="flex items-center gap-1">
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary">
                      {listing.modifications.length} mods
                    </span>
                    {listing.modifications.slice(0, 2).map((mod, index) => (
                      <span
                        key={index}
                        className="text-xs text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded"
                        title={`${mod.category}: ${mod.name}`}
                      >
                        {mod.category}
                      </span>
                    ))}
                    {listing.modifications.length > 2 && (
                      <span className="text-xs text-on-surface-variant/60">+more</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
} 