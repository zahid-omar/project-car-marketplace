'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Head from 'next/head';
import LoadingSpinner from '@/components/LoadingSpinner';
import ContactSellerModal from '@/components/ContactSellerModal';
import MakeOfferModal from '@/components/MakeOfferModal';
import SimilarListings from '@/components/SimilarListings';
import AppLayout from '@/components/AppLayout';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/lib/auth';
import { MaterialYouIcon } from '@/components/ui/MaterialYouIcon';

interface Listing {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  location: string;
  description: string;
  engine: string;
  transmission: string;
  mileage: number;
  condition: string;
  created_at: string;
  user_id: string;
  listing_images: {
    image_url: string;
    is_primary: boolean;
  }[];
  modifications: {
    name: string;
    description: string;
    category: string;
  }[];
  profiles: {
    id: string;
    email: string;
    display_name: string;
    profile_image_url?: string;
  } | null;
}

interface ListingPageProps {
  params: {
    id: string;
  };
}

export default function ListingPage({ params }: ListingPageProps) {
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const supabase = createClientComponentClient();
  const { user } = useAuth();
  const { isFavorited, toggleFavorite, syncStatus, isConnected } = useFavorites();

  useEffect(() => {
    fetchListing();
  }, [params.id]);

  const fetchListing = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch listing with all related data
      const { data: listingData, error: listingError } = await supabase
        .from('listings')
        .select(`
          *,
          listing_images(*),
          modifications(*)
        `)
        .eq('id', params.id)
        .eq('status', 'active')
        .single();

      if (listingError) {
        if (listingError.code === 'PGRST116') {
          notFound();
        }
        throw listingError;
      }

      // Fetch profile data separately
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, display_name, profile_image_url')
        .eq('id', listingData.user_id)
        .single();

      if (profileError) {
        console.warn('Could not fetch profile data:', profileError);
      }

      // Combine the data
      const combinedData = {
        ...listingData,
        profiles: profileData || null
      };

      console.log('Listing data received:', combinedData);
      setListing(combinedData);
    } catch (err) {
      console.error('Error fetching listing:', err);
      setError('Failed to load listing. Please try again.');
    } finally {
      setLoading(false);
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

  const formatMileage = (mileage: number) => {
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

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      // Could add a toast notification here for better UX
      alert('Please log in to save favorites');
      return;
    }

    if (isToggling) return; // Prevent double-clicks
    
    setIsToggling(true);
    
    try {
      const success = await toggleFavorite(listing!.id);
      
      if (!success) {
        // Could add a toast notification here for better UX
        alert('Failed to update favorites. Please try again.');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsToggling(false);
    }
  };

  if (loading) {
    return (
      <AppLayout showNavigation={true}>
        <div className="min-h-screen bg-md-sys-surface">
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-center items-center min-h-[400px]">
              <LoadingSpinner />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !listing) {
    return (
      <AppLayout showNavigation={true}>
        <div className="min-h-screen bg-md-sys-surface">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center py-20">
              <div className="text-md-sys-error text-md-title-medium mb-4">
                {error || 'Listing not found'}
              </div>
              <Link
                href="/browse"
                className="inline-flex items-center gap-2 px-6 py-3 bg-md-sys-primary text-md-sys-on-primary rounded-xl hover:bg-md-sys-primary/90 transition-colors text-md-label-large font-medium"
              >
                <MaterialYouIcon name="chevron-left" className="w-4 h-4" />
                Back to Browse
              </Link>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const primaryImage = listing.listing_images?.[selectedImageIndex] || listing.listing_images?.[0];
  
  // SEO metadata
  const seoTitle = `${listing.year} ${listing.make} ${listing.model} - ${formatPrice(listing.price)} | Project Car Marketplace`;
  const seoDescription = `${listing.title} - ${listing.year} ${listing.make} ${listing.model} for sale. ${listing.condition} condition, ${formatMileage(listing.mileage)}. Located in ${listing.location}. View details and contact seller.`;
  const primaryImageUrl = primaryImage?.image_url || '/placeholder-car.svg';
  const canonicalUrl = `https://projectcarmarketplace.com/listings/${listing.id}`;

  return (
    <>
      <Head>
        {/* Basic Meta Tags */}
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta name="keywords" content={`${listing.make}, ${listing.model}, ${listing.year}, modified car, project car, ${listing.condition}, for sale, automotive`} />
        
        {/* Canonical URL */}
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="product" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:image" content={primaryImageUrl} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="Project Car Marketplace" />
        <meta property="product:price:amount" content={listing.price.toString()} />
        <meta property="product:price:currency" content="USD" />
        <meta property="product:condition" content={listing.condition.toLowerCase()} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content={primaryImageUrl} />
        
        {/* Schema.org Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org/",
              "@type": "Product",
              "@id": canonicalUrl,
              "name": `${listing.year} ${listing.make} ${listing.model}`,
              "description": listing.description,
              "image": listing.listing_images?.map(img => img.image_url) || [primaryImageUrl],
              "brand": {
                "@type": "Brand",
                "name": listing.make
              },
              "model": listing.model,
              "vehicleModelDate": listing.year.toString(),
              "vehicleEngine": {
                "@type": "EngineSpecification",
                "name": listing.engine
              },
              "vehicleTransmission": listing.transmission,
              "mileageFromOdometer": {
                "@type": "QuantitativeValue",
                "value": listing.mileage,
                "unitText": "miles"
              },
              "offers": {
                "@type": "Offer",
                "price": listing.price,
                "priceCurrency": "USD",
                "itemCondition": `https://schema.org/${listing.condition}Condition`,
                "availability": "https://schema.org/InStock",
                                 "seller": {
                   "@type": "Person",
                   "name": listing.profiles?.display_name || "Private Seller"
                 }
              },
              "url": canonicalUrl,
              "category": "Modified Car",
              "location": {
                "@type": "Place",
                "name": listing.location
              }
            })
          }}
        />
      </Head>
      
      <AppLayout showNavigation={true} className="bg-md-sys-surface">
        <div className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <div className="mb-6">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 px-4 py-2 text-md-sys-on-surface-variant hover:text-md-sys-on-surface hover:bg-md-sys-surface-container-high rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20"
              aria-label="Go back to previous page"
            >
              <MaterialYouIcon name="chevron-left" className="w-5 h-5" />
              Back
            </button>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Left Column - Images and Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Image Gallery Section */}
              <div className="bg-md-sys-surface-container-low rounded-3xl shadow-md-elevation-1 overflow-hidden">
                {/* Main Image */}
                <div className="relative aspect-[4/3] bg-md-sys-surface-variant">
                  <Image
                    src={primaryImage?.image_url || '/placeholder-car.svg'}
                    alt={listing.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 66vw"
                  />
                  
                  {/* Image Navigation */}
                  {listing.listing_images && listing.listing_images.length > 1 && (
                    <>
                      <button
                        onClick={() => setSelectedImageIndex(prev => 
                          prev === 0 ? listing.listing_images.length - 1 : prev - 1
                        )}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-md-sys-surface-container-high/80 text-md-sys-on-surface rounded-full hover:bg-md-sys-surface-container-high transition-colors focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20"
                      >
                        <MaterialYouIcon name="chevron-left" className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setSelectedImageIndex(prev => 
                          prev === listing.listing_images.length - 1 ? 0 : prev + 1
                        )}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-md-sys-surface-container-high/80 text-md-sys-on-surface rounded-full hover:bg-md-sys-surface-container-high transition-colors focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20"
                      >
                        <MaterialYouIcon name="chevron-right" className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>

                {/* Image Thumbnails */}
                {listing.listing_images && listing.listing_images.length > 1 && (
                  <div className="p-4 border-t border-md-sys-outline-variant">
                    <div className="flex gap-3 overflow-x-auto">
                      {listing.listing_images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`relative flex-shrink-0 w-20 h-16 rounded-xl overflow-hidden border-2 transition-colors ${
                            index === selectedImageIndex 
                              ? 'border-md-sys-primary' 
                              : 'border-md-sys-outline-variant hover:border-md-sys-outline'
                          }`}
                        >
                          <Image
                            src={image.image_url}
                            alt={`${listing.title} - Image ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Listing Details Section */}
              <div className="bg-md-sys-surface-container-low rounded-3xl shadow-md-elevation-1 p-6">
                <div className="border-b border-md-sys-outline-variant pb-6 mb-6">
                  <h1 className="text-md-display-small font-bold text-md-sys-on-surface mb-2">
                    {listing.title}
                  </h1>
                  <div className="text-md-title-large text-md-sys-primary font-semibold mb-4">
                    {listing.year} {listing.make} {listing.model}
                  </div>
                  <div className="text-md-display-small font-bold text-md-sys-on-surface">
                    {formatPrice(listing.price)}
                  </div>
                </div>

                {/* Car Specifications */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-md-sys-surface-container rounded-xl">
                    <div className="text-md-sys-primary font-semibold text-md-label-small uppercase tracking-wide mb-1">
                      Engine
                    </div>
                    <div className="text-md-sys-on-surface font-medium text-md-body-medium">
                      {listing.engine || 'N/A'}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-md-sys-surface-container rounded-xl">
                    <div className="text-md-sys-primary font-semibold text-md-label-small uppercase tracking-wide mb-1">
                      Transmission
                    </div>
                    <div className="text-md-sys-on-surface font-medium text-md-body-medium">
                      {listing.transmission || 'N/A'}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-md-sys-surface-container rounded-xl">
                    <div className="text-md-sys-primary font-semibold text-md-label-small uppercase tracking-wide mb-1">
                      Mileage
                    </div>
                    <div className="text-md-sys-on-surface font-medium text-md-body-medium">
                      {formatMileage(listing.mileage)}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-md-sys-surface-container rounded-xl">
                    <div className="text-md-sys-primary font-semibold text-md-label-small uppercase tracking-wide mb-1">
                      Condition
                    </div>
                    <div className="text-md-sys-on-surface font-medium text-md-body-medium">
                      {listing.condition || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h3 className="text-md-title-medium font-semibold text-md-sys-on-surface mb-3">Description</h3>
                  <div className="text-md-sys-on-surface-variant whitespace-pre-line text-md-body-large">
                    {listing.description}
                  </div>
                </div>

                {/* Modifications */}
                {listing.modifications && listing.modifications.length > 0 && (
                  <div>
                    <h3 className="text-md-title-medium font-semibold text-md-sys-on-surface mb-3">Modifications</h3>
                    <div className="space-y-3">
                      {listing.modifications.map((mod, index) => (
                        <div key={index} className="border border-md-sys-outline-variant rounded-xl p-4 bg-md-sys-surface-container">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-md-sys-on-surface text-md-body-large">{mod.name}</h4>
                            <span className="text-md-label-small bg-md-sys-primary text-md-sys-on-primary px-3 py-1 rounded-full">
                              {mod.category}
                            </span>
                          </div>
                          <p className="text-md-sys-on-surface-variant text-md-body-medium">{mod.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar - Seller Info and Actions */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-6">
                {/* Seller Information */}
                <div className="bg-md-sys-surface-container-low rounded-3xl shadow-md-elevation-1 p-6">
                  <h3 className="text-md-title-medium font-semibold text-md-sys-on-surface mb-4">Seller Information</h3>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-md-sys-surface-container rounded-full flex items-center justify-center">
                      {listing.profiles?.profile_image_url ? (
                        <Image
                          src={listing.profiles.profile_image_url}
                          alt={listing.profiles?.display_name || 'Seller'}
                          width={48}
                          height={48}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <MaterialYouIcon name="person" className="w-6 h-6 text-md-sys-on-surface-variant" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-md-sys-on-surface text-md-body-large">
                        {listing.profiles?.display_name || 'Private Seller'}
                      </div>
                      <div className="text-md-body-small text-md-sys-on-surface-variant">
                        Listed {getTimeSince(listing.created_at)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button 
                      onClick={() => setShowContactModal(true)}
                      className="w-full bg-md-sys-primary text-md-sys-on-primary py-3 px-6 rounded-xl font-medium hover:bg-md-sys-primary/90 transition-colors text-md-label-large focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20"
                    >
                      Contact Seller
                    </button>
                    <button 
                      onClick={() => setShowOfferModal(true)}
                      className="w-full border border-md-sys-outline text-md-sys-on-surface py-3 px-6 rounded-xl font-medium hover:bg-md-sys-surface-container-high transition-colors text-md-label-large focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20"
                    >
                      Make an Offer
                    </button>
                    <button 
                      onClick={handleFavoriteToggle}
                      disabled={isToggling}
                      className={`relative w-full py-3 px-6 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-md-label-large focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 ${
                        !user 
                          ? 'border border-md-sys-outline text-md-sys-on-surface hover:bg-md-sys-surface-container-high' 
                          : listing && isFavorited(listing.id)
                            ? 'bg-md-sys-error-container border border-md-sys-error text-md-sys-on-error-container hover:bg-md-sys-error-container/80'
                            : 'border border-md-sys-outline text-md-sys-on-surface hover:bg-md-sys-surface-container-high'
                      } ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
                      aria-label={
                        !user 
                          ? 'Log in to save favorites'
                          : listing && isFavorited(listing.id)
                            ? `Remove ${listing.title} from favorites` 
                            : `Add ${listing.title} to favorites`
                      }
                    >
                      {isToggling ? (
                        <div className="w-4 h-4 border-2 border-md-sys-on-surface-variant border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <MaterialYouIcon 
                          name={listing && isFavorited(listing.id) && user ? "heart-filled" : "heart-outline"} 
                          className={`w-4 h-4 transition-colors ${
                            listing && isFavorited(listing.id) && user
                              ? 'text-md-sys-error' 
                              : 'text-md-sys-on-surface-variant'
                          }`}
                        />
                      )}
                      
                      {!user 
                        ? 'Log in to Save'
                        : listing && isFavorited(listing.id)
                          ? 'Remove from Favorites'
                          : 'Save to Favorites'
                      }

                      {/* Real-time sync indicator */}
                      {user && (
                        <div className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-md-sys-surface-container-low ${
                          syncStatus === 'syncing' && 'bg-md-sys-primary animate-pulse'
                        } ${
                          syncStatus === 'synced' && isConnected && 'bg-md-sys-primary'
                        } ${
                          syncStatus === 'error' && 'bg-md-sys-error'
                        } ${
                          (!isConnected || syncStatus === 'idle') && 'bg-md-sys-on-surface-variant'
                        }`} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Location */}
                <div className="bg-md-sys-surface-container-low rounded-3xl shadow-md-elevation-1 p-6">
                  <h3 className="text-md-title-medium font-semibold text-md-sys-on-surface mb-3">Location</h3>
                  <div className="flex items-center gap-2 text-md-sys-on-surface-variant">
                    <MaterialYouIcon name="location-pin" className="w-4 h-4" />
                    <span className="text-md-body-medium">{listing.location}</span>
                  </div>
                </div>

                {/* Share */}
                <div className="bg-md-sys-surface-container-low rounded-3xl shadow-md-elevation-1 p-6">
                  <h3 className="text-md-title-medium font-semibold text-md-sys-on-surface mb-3">Share this listing</h3>
                  <div className="flex gap-2">
                    <button className="flex-1 bg-md-sys-primary text-md-sys-on-primary py-2 px-3 rounded-xl text-md-label-medium hover:bg-md-sys-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20">
                      Facebook
                    </button>
                    <button className="flex-1 bg-md-sys-secondary text-md-sys-on-secondary py-2 px-3 rounded-xl text-md-label-medium hover:bg-md-sys-secondary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-md-sys-secondary/20">
                      Twitter
                    </button>
                    <button className="flex-1 bg-md-sys-tertiary text-md-sys-on-tertiary py-2 px-3 rounded-xl text-md-label-medium hover:bg-md-sys-tertiary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-md-sys-tertiary/20">
                      Copy Link
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Similar Listings Section */}
          <SimilarListings
            currentListingId={listing.id}
            make={listing.make}
            model={listing.model}
            year={listing.year}
            price={listing.price}
          />
        </div>

        {/* Modals */}
        <ContactSellerModal
          isOpen={showContactModal}
          onClose={() => setShowContactModal(false)}
          listingId={listing.id}
          listingTitle={listing.title}
          sellerName={listing.profiles?.display_name || 'Seller'}
        />
        
        <MakeOfferModal
          isOpen={showOfferModal}
          onClose={() => setShowOfferModal(false)}
          listingId={listing.id}
          listingTitle={listing.title}
          listingPrice={listing.price}
          sellerName={listing.profiles?.display_name || 'Seller'}
        />
      </AppLayout>
    </>
  );
} 