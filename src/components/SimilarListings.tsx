'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import ListingCard from '@/components/ListingCard';

interface SimilarListing {
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
  listing_images: {
    image_url: string;
    is_primary: boolean;
  }[];
}

interface SimilarListingsProps {
  currentListingId: string;
  make: string;
  model: string;
  year: number;
  price: number;
}

export default function SimilarListings({ 
  currentListingId, 
  make, 
  model, 
  year, 
  price 
}: SimilarListingsProps) {
  const [similarListings, setSimilarListings] = useState<SimilarListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchSimilarListings();
  }, [currentListingId, make, model, year, price]);

  const fetchSimilarListings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Define search criteria with priority order:
      // 1. Same make and model (different years and prices)
      // 2. Same make (different models, similar year range)
      // 3. Similar price range (different makes)

      const yearRange = 3; // ±3 years
      const priceRange = 0.3; // ±30%
      const minPrice = price * (1 - priceRange);
      const maxPrice = price * (1 + priceRange);
      const minYear = year - yearRange;
      const maxYear = year + yearRange;

      // Query 1: Same make and model, different years/prices
      let query1 = supabase
        .from('listings')
        .select(`
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
          created_at,
          listing_images!inner(
            image_url,
            is_primary
          )
        `)
        .eq('status', 'active')
        .neq('id', currentListingId)
        .ilike('make', make)
        .ilike('model', model)
        .gte('year', minYear)
        .lte('year', maxYear)
        .limit(4);

      const { data: sameModelListings, error: error1 } = await query1;
      if (error1) throw error1;

      let allSimilarListings = sameModelListings || [];

      // Query 2: Same make, different models (if we need more)
      if (allSimilarListings.length < 4) {
        let query2 = supabase
          .from('listings')
          .select(`
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
            created_at,
            listing_images!inner(
              image_url,
              is_primary
            )
          `)
          .eq('status', 'active')
          .neq('id', currentListingId)
          .ilike('make', make)
          .not('model', 'ilike', model)
          .gte('year', minYear)
          .lte('year', maxYear)
          .limit(4 - allSimilarListings.length);

        const { data: sameMakeListings, error: error2 } = await query2;
        if (error2) throw error2;

        // Filter out duplicates
        const newListings = sameMakeListings?.filter(
          newListing => !allSimilarListings.find(existing => existing.id === newListing.id)
        ) || [];
        
        allSimilarListings = [...allSimilarListings, ...newListings];
      }

      // Query 3: Similar price range, any make (if we still need more)
      if (allSimilarListings.length < 4) {
        let query3 = supabase
          .from('listings')
          .select(`
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
            created_at,
            listing_images!inner(
              image_url,
              is_primary
            )
          `)
          .eq('status', 'active')
          .neq('id', currentListingId)
          .not('make', 'ilike', make)
          .gte('price', minPrice)
          .lte('price', maxPrice)
          .order('created_at', { ascending: false })
          .limit(4 - allSimilarListings.length);

        const { data: similarPriceListings, error: error3 } = await query3;
        if (error3) throw error3;

        // Filter out duplicates
        const newListings = similarPriceListings?.filter(
          newListing => !allSimilarListings.find(existing => existing.id === newListing.id)
        ) || [];
        
        allSimilarListings = [...allSimilarListings, ...newListings];
      }

      // Sort by relevance (same model first, then same make, then price similarity)
      const sortedListings = allSimilarListings.sort((a, b) => {
        // Priority 1: Same model
        const aIsModel = a.model.toLowerCase() === model.toLowerCase();
        const bIsModel = b.model.toLowerCase() === model.toLowerCase();
        if (aIsModel && !bIsModel) return -1;
        if (!aIsModel && bIsModel) return 1;

        // Priority 2: Same make
        const aIsMake = a.make.toLowerCase() === make.toLowerCase();
        const bIsMake = b.make.toLowerCase() === make.toLowerCase();
        if (aIsMake && !bIsMake) return -1;
        if (!aIsMake && bIsMake) return 1;

        // Priority 3: Price similarity
        const aPriceDiff = Math.abs(a.price - price);
        const bPriceDiff = Math.abs(b.price - price);
        return aPriceDiff - bPriceDiff;
      });

      setSimilarListings(sortedListings.slice(0, 4));
    } catch (err) {
      console.error('Error fetching similar listings:', err);
      setError('Failed to load similar listings.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-md-sys-surface-container-low rounded-3xl shadow-md-elevation-1 p-6">
        <h2 className="text-md-display-small font-bold text-md-sys-on-surface mb-6">Similar Listings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-md-sys-surface-variant aspect-[4/3] rounded-xl mb-4"></div>
              <div className="h-4 bg-md-sys-surface-variant rounded mb-2"></div>
              <div className="h-4 bg-md-sys-surface-variant rounded w-3/4 mb-2"></div>
              <div className="h-6 bg-md-sys-surface-variant rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-md-sys-surface-container-low rounded-3xl shadow-md-elevation-1 p-6">
        <h2 className="text-md-display-small font-bold text-md-sys-on-surface mb-6">Similar Listings</h2>
        <div className="text-center py-8">
          <p className="text-md-sys-on-surface-variant text-md-body-large">{error}</p>
          <button
            onClick={fetchSimilarListings}
            className="mt-4 px-6 py-3 bg-md-sys-primary text-md-sys-on-primary rounded-xl hover:bg-md-sys-primary/90 transition-colors text-md-label-large font-medium focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (similarListings.length === 0) {
    return (
      <div className="bg-md-sys-surface-container-low rounded-3xl shadow-md-elevation-1 p-6">
        <h2 className="text-md-display-small font-bold text-md-sys-on-surface mb-6">Similar Listings</h2>
        <div className="text-center py-8">
          <div className="text-md-sys-on-surface-variant mb-4 text-md-body-large">
            No similar listings found at the moment.
          </div>
          <Link
            href="/browse"
            className="inline-flex items-center gap-2 px-6 py-3 bg-md-sys-primary text-md-sys-on-primary rounded-xl hover:bg-md-sys-primary/90 transition-colors text-md-label-large font-medium focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Browse All Listings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-md-sys-surface-container-low rounded-3xl shadow-md-elevation-1 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-md-display-small font-bold text-md-sys-on-surface">Similar Listings</h2>
        <Link
          href={`/browse?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`}
          className="text-md-sys-primary hover:text-md-sys-primary/80 text-md-body-medium font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 rounded-lg px-2 py-1"
        >
          View All Similar →
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {similarListings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>

      {similarListings.length < 4 && (
        <div className="mt-6 text-center">
          <p className="text-md-sys-on-surface-variant text-md-body-medium mb-4">
            Showing {similarListings.length} similar listing{similarListings.length !== 1 ? 's' : ''}
          </p>
          <Link
            href="/browse"
            className="inline-flex items-center gap-2 px-6 py-3 border border-md-sys-outline text-md-sys-on-surface rounded-xl hover:bg-md-sys-surface-container-high transition-colors text-md-label-large font-medium focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20"
          >
            Browse More Listings
          </Link>
        </div>
      )}
    </div>
  );
} 