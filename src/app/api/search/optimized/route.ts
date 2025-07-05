import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory cache for search results
const searchCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100;

// Cache key generator
function generateCacheKey(params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {} as Record<string, any>);
  return JSON.stringify(sortedParams);
}

// Cache cleanup function
function cleanupCache() {
  if (searchCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(searchCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toDelete = entries.slice(0, Math.floor(MAX_CACHE_SIZE / 2));
    toDelete.forEach(([key]) => searchCache.delete(key));
  }
}

// Get from cache
function getFromCache(key: string) {
  const cached = searchCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  if (cached) {
    searchCache.delete(key);
  }
  return null;
}

// Set cache
function setCache(key: string, data: any) {
  cleanupCache();
  searchCache.set(key, { data, timestamp: Date.now() });
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    
    // Extract and validate parameters
    const query = searchParams.get('q') || '';
    const make = searchParams.get('make') || '';
    const model = searchParams.get('model') || '';
    const yearFrom = parseInt(searchParams.get('yearFrom') || '0');
    const yearTo = parseInt(searchParams.get('yearTo') || '0');
    const priceFrom = parseFloat(searchParams.get('priceFrom') || '0');
    const priceTo = parseFloat(searchParams.get('priceTo') || '0');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12')));
    
    // New modification filter parameters
    const modificationCategories = searchParams.get('modCategories')?.split(',').filter(Boolean) || [];
    const specificModifications = searchParams.get('specificMods')?.split(',').filter(Boolean) || [];
    const modDateFrom = searchParams.get('modDateFrom') || null;
    const modDateTo = searchParams.get('modDateTo') || null;
    const hasModifications = searchParams.get('hasModifications') === 'true';
    
    const offset = (page - 1) * limit;

    // Create cache key
    const cacheParams = {
      query, make, model, yearFrom, yearTo, priceFrom, priceTo, sortBy, page, limit,
      modificationCategories: modificationCategories.sort(),
      specificModifications: specificModifications.sort(),
      modDateFrom, modDateTo, hasModifications
    };
    const cacheKey = generateCacheKey(cacheParams);

    // Check cache first
    const cachedResult = getFromCache(cacheKey);
    if (cachedResult) {
      console.log(`Cache hit for search query (${Date.now() - startTime}ms)`);
      return NextResponse.json({
        ...cachedResult,
        cached: true,
        responseTime: Date.now() - startTime
      });
    }

    console.log('Optimized search params:', { 
      query, make, model, yearFrom, yearTo, priceFrom, priceTo, sortBy, page, limit, offset,
      modificationCategories, specificModifications, modDateFrom, modDateTo, hasModifications
    });

    // Prepare parameters for the optimized search function
    const searchFunctionParams = {
      search_query: query,
      make_filter: make,
      model_filter: model,
      year_from: yearFrom,
      year_to: yearTo,
      price_from: priceFrom,
      price_to: priceTo,
      mod_categories: modificationCategories,
      specific_mods: specificModifications.map(mod => `%${mod}%`), // Prepare for ILIKE
      mod_date_from: modDateFrom,
      mod_date_to: modDateTo,
      has_modifications: hasModifications,
      sort_by: sortBy,
      page_limit: limit,
      page_offset: offset
    };

    // Execute the optimized search function and count in parallel
    const [searchResult, countResult] = await Promise.all([
      supabase.rpc('optimized_search_listings', searchFunctionParams),
      supabase.rpc('optimized_search_count', {
        search_query: query,
        make_filter: make,
        model_filter: model,
        year_from: yearFrom,
        year_to: yearTo,
        price_from: priceFrom,
        price_to: priceTo,
        mod_categories: modificationCategories,
        specific_mods: specificModifications.map(mod => `%${mod}%`),
        mod_date_from: modDateFrom,
        mod_date_to: modDateTo,
        has_modifications: hasModifications
      })
    ]);

    if (searchResult.error) {
      console.error('Optimized search error:', searchResult.error);
      return NextResponse.json({ 
        error: 'Search failed', 
        details: searchResult.error.message 
      }, { status: 500 });
    }

    if (countResult.error) {
      console.error('Count error:', countResult.error);
      return NextResponse.json({ 
        error: 'Count failed', 
        details: countResult.error.message 
      }, { status: 500 });
    }

    const listings = searchResult.data || [];
    const totalItems = countResult.data || 0;
    const totalPages = Math.ceil(totalItems / limit);

    // Fetch listing images for results
    if (listings.length > 0) {
      const listingIds = listings.map((listing: any) => listing.id);
      const { data: images, error: imageError } = await supabase
        .from('listing_images')
        .select('listing_id, image_url, is_primary')
        .in('listing_id', listingIds)
        .order('is_primary', { ascending: false });

      if (!imageError && images) {
        // Group images by listing_id
        const imagesByListing = images.reduce((acc: any, img: any) => {
          if (!acc[img.listing_id]) acc[img.listing_id] = [];
          acc[img.listing_id].push({
            image_url: img.image_url,
            is_primary: img.is_primary
          });
          return acc;
        }, {});

        // Add images to listings
        listings.forEach((listing: any) => {
          listing.listing_images = imagesByListing[listing.id] || [];
        });
      }
    }

    // Fetch modifications for listings if needed
    if (listings.length > 0 && (query.includes('mod') || modificationCategories.length > 0 || specificModifications.length > 0)) {
      const listingIds = listings.map((listing: any) => listing.id);
      const { data: modifications, error: modError } = await supabase
        .from('modifications')
        .select('listing_id, name, description, category, created_at')
        .in('listing_id', listingIds);

      if (!modError && modifications) {
        // Group modifications by listing_id
        const modsByListing = modifications.reduce((acc: any, mod: any) => {
          if (!acc[mod.listing_id]) acc[mod.listing_id] = [];
          acc[mod.listing_id].push({
            name: mod.name,
            description: mod.description,
            category: mod.category,
            created_at: mod.created_at
          });
          return acc;
        }, {});

        // Add modifications to listings
        listings.forEach((listing: any) => {
          listing.modifications = modsByListing[listing.id] || [];
        });
      }
    }

    const responseTime = Date.now() - startTime;
    console.log(`Optimized search completed - found ${totalItems} results in ${responseTime}ms`);

    const result = {
      listings,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      searchParams: {
        query,
        make,
        model,
        yearFrom,
        yearTo,
        priceFrom,
        priceTo,
        sortBy,
        modificationCategories,
        specificModifications,
        modDateFrom,
        modDateTo,
        hasModifications
      },
      performance: {
        responseTime,
        totalItems,
        cached: false
      }
    };

    // Cache the result
    setCache(cacheKey, result);

    return NextResponse.json(result);

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('Optimized search API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error',
      performance: { responseTime }
    }, { status: 500 });
  }
}

// Cache management endpoint
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'clear-cache') {
      searchCache.clear();
      return NextResponse.json({ 
        success: true, 
        message: 'Search cache cleared',
        cacheSize: searchCache.size
      });
    }

    if (action === 'cache-stats') {
      const now = Date.now();
      const validEntries = Array.from(searchCache.values()).filter(
        entry => now - entry.timestamp < CACHE_TTL
      ).length;

      return NextResponse.json({
        totalEntries: searchCache.size,
        validEntries,
        cacheHitRate: validEntries / Math.max(1, searchCache.size),
        cacheTTL: CACHE_TTL,
        maxCacheSize: MAX_CACHE_SIZE
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Cache management error:', error);
    return NextResponse.json({ 
      error: 'Cache management failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 