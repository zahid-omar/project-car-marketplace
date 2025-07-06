import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    
    // Get search parameters
    const query = searchParams.get('q') || '';
    const make = searchParams.get('make') || '';
    const model = searchParams.get('model') || '';
    const yearFrom = parseInt(searchParams.get('yearFrom') || '0');
    const yearTo = parseInt(searchParams.get('yearTo') || '0');
    const priceFrom = parseInt(searchParams.get('priceFrom') || '0');
    const priceTo = parseInt(searchParams.get('priceTo') || '0');
    const sortBy = searchParams.get('sortBy') || 'relevance';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    
    // New modification filter parameters
    const modificationCategories = searchParams.get('modCategories')?.split(',').filter(Boolean) || [];
    const specificModifications = searchParams.get('specificMods')?.split(',').filter(Boolean) || [];
    const modDateFrom = searchParams.get('modDateFrom') || '';
    const modDateTo = searchParams.get('modDateTo') || '';
    const hasModifications = searchParams.get('hasModifications') === 'true';
    
    const offset = (page - 1) * limit;

    console.log('Search params:', { 
      query, make, model, yearFrom, yearTo, priceFrom, priceTo, sortBy, page, limit, offset,
      modificationCategories, specificModifications, modDateFrom, modDateTo, hasModifications
    });

    let searchQuery;
    let countQuery;

    if (query.trim()) {
      // Enhanced search with partial matching using ILIKE
      const searchTerms = query.trim();
      
      searchQuery = supabase
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
          ),
          modifications(
            name,
            description,
            category,
            created_at
          )
        `)
        .eq('status', 'active')
        .or(`title.ilike.*${searchTerms}*,make.ilike.*${searchTerms}*,model.ilike.*${searchTerms}*,description.ilike.*${searchTerms}*,engine.ilike.*${searchTerms}*,transmission.ilike.*${searchTerms}*,condition.ilike.*${searchTerms}*,location.ilike.*${searchTerms}*`);

      countQuery = supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .or(`title.ilike.*${searchTerms}*,make.ilike.*${searchTerms}*,model.ilike.*${searchTerms}*,description.ilike.*${searchTerms}*,engine.ilike.*${searchTerms}*,transmission.ilike.*${searchTerms}*,condition.ilike.*${searchTerms}*,location.ilike.*${searchTerms}*`);
    } else {
      // Regular filter-only query (no search text)
      searchQuery = supabase
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
          ),
          modifications(
            name,
            description,
            category,
            created_at
          )
        `)
        .eq('status', 'active');

      countQuery = supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
    }

    // Apply standard filters to both queries
    const applyStandardFilters = (query: any) => {
      if (make) {
        query = query.ilike('make', `%${make}%`);
      }
      if (model) {
        query = query.ilike('model', `%${model}%`);
      }
      if (yearFrom > 0) {
        query = query.gte('year', yearFrom);
      }
      if (yearTo > 0) {
        query = query.lte('year', yearTo);
      }
      if (priceFrom > 0) {
        query = query.gte('price', priceFrom);
      }
      if (priceTo > 0) {
        query = query.lte('price', priceTo);
      }
      return query;
    };

    searchQuery = applyStandardFilters(searchQuery);
    countQuery = applyStandardFilters(countQuery);

    // Apply modification filters if specified
    if (modificationCategories.length > 0 || specificModifications.length > 0 || modDateFrom || modDateTo || hasModifications) {
      console.log('Applying modification filters...');
      
      // Get listings that match modification criteria
      let modFilterQuery = supabase
        .from('modifications')
        .select('listing_id');

      // Filter by modification categories
      if (modificationCategories.length > 0) {
        modFilterQuery = modFilterQuery.in('category', modificationCategories);
      }

      // Filter by specific modification names
      if (specificModifications.length > 0) {
        const modConditions = specificModifications.map(mod => `name.ilike.*${mod}*`).join(',');
        modFilterQuery = modFilterQuery.or(modConditions);
      }

      // Filter by modification date range
      if (modDateFrom) {
        modFilterQuery = modFilterQuery.gte('created_at', modDateFrom);
      }
      if (modDateTo) {
        modFilterQuery = modFilterQuery.lte('created_at', modDateTo + 'T23:59:59.999Z');
      }

      const { data: modListingIds, error: modError } = await modFilterQuery;
      
      if (modError) {
        console.error('Modification filter error:', modError);
        return NextResponse.json({ 
          error: 'Modification filter failed', 
          details: modError.message 
        }, { status: 500 });
      }

      const listingIds = modListingIds?.map(item => item.listing_id) || [];
      
      if (hasModifications && listingIds.length === 0) {
        // If we require modifications but found none, return empty result
        return NextResponse.json({
          listings: [],
          pagination: {
            page,
            limit,
            totalItems: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: page > 1
          },
          searchParams: {
            query, make, model, yearFrom, yearTo, priceFrom, priceTo, sortBy,
            modificationCategories, specificModifications, modDateFrom, modDateTo, hasModifications
          }
        });
      }

      if (listingIds.length > 0) {
        searchQuery = searchQuery.in('id', listingIds);
        countQuery = countQuery.in('id', listingIds);
      } else if (hasModifications) {
        // If hasModifications is true but no specific filters, get listings that have any modifications
        const { data: allModListingIds } = await supabase
          .from('modifications')
          .select('listing_id');
        
        const allListingIds = Array.from(new Set(allModListingIds?.map(item => item.listing_id) || []));
        if (allListingIds.length > 0) {
          searchQuery = searchQuery.in('id', allListingIds);
          countQuery = countQuery.in('id', allListingIds);
        }
      }
    }

    // Apply sorting
    if (query.trim() && sortBy === 'relevance') {
      // For text search, we rely on Supabase's default relevance ranking
      // No additional ordering needed as textSearch returns results by relevance
    } else {
      // Apply other sorting options
      switch (sortBy) {
        case 'price_low':
          searchQuery = searchQuery.order('price', { ascending: true });
          break;
        case 'price_high':
          searchQuery = searchQuery.order('price', { ascending: false });
          break;
        case 'year_new':
          searchQuery = searchQuery.order('year', { ascending: false });
          break;
        case 'year_old':
          searchQuery = searchQuery.order('year', { ascending: true });
          break;
        case 'newest':
        default:
          searchQuery = searchQuery.order('created_at', { ascending: false });
          break;
      }
    }

    // Apply pagination
    searchQuery = searchQuery.range(offset, offset + limit - 1);

    // Execute queries
    const [{ data: listings, error: searchError }, { count, error: countError }] = await Promise.all([
      searchQuery,
      countQuery
    ]);

    if (searchError) {
      console.error('Search error:', searchError);
      return NextResponse.json({ 
        error: 'Search failed', 
        details: searchError.message 
      }, { status: 500 });
    }

    if (countError) {
      console.error('Count error:', countError);
      return NextResponse.json({ 
        error: 'Count failed', 
        details: countError.message 
      }, { status: 500 });
    }

    const totalItems = count || 0;
    const totalPages = Math.ceil(totalItems / limit);

    console.log(`Search completed - found ${totalItems} results`);

    return NextResponse.json({
      listings: listings || [],
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
      }
    });

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Advanced search endpoint with more detailed control
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();
    
    const {
      query = '',
      filters = {},
      sorting = { by: 'relevance', order: 'desc' },
      pagination = { page: 1, limit: 12 },
      includeTotalCount = true
    } = body;

    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    console.log('Advanced search request:', { query, filters, sorting, pagination });

    // Build the search query with advanced filtering
    let searchQuery = supabase
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
        ),
        modifications(
          name,
          description,
          category
        )
      `)
      .eq('status', 'active');

    // Apply text search if query provided
    if (query.trim()) {
      searchQuery = searchQuery.textSearch('search_vector', query, { 
        type: 'websearch',
        config: 'english'
      });
    }

    // Apply filters
    if (filters.make) {
      searchQuery = searchQuery.in('make', Array.isArray(filters.make) ? filters.make : [filters.make]);
    }
    if (filters.model) {
      searchQuery = searchQuery.in('model', Array.isArray(filters.model) ? filters.model : [filters.model]);
    }
    if (filters.yearRange) {
      const { min, max } = filters.yearRange;
      if (min) searchQuery = searchQuery.gte('year', min);
      if (max) searchQuery = searchQuery.lte('year', max);
    }
    if (filters.priceRange) {
      const { min, max } = filters.priceRange;
      if (min) searchQuery = searchQuery.gte('price', min);
      if (max) searchQuery = searchQuery.lte('price', max);
    }
    if (filters.mileageRange) {
      const { min, max } = filters.mileageRange;
      if (min) searchQuery = searchQuery.gte('mileage', min);
      if (max) searchQuery = searchQuery.lte('mileage', max);
    }
    if (filters.condition) {
      searchQuery = searchQuery.in('condition', Array.isArray(filters.condition) ? filters.condition : [filters.condition]);
    }
    if (filters.transmission) {
      searchQuery = searchQuery.in('transmission', Array.isArray(filters.transmission) ? filters.transmission : [filters.transmission]);
    }
    if (filters.location) {
      searchQuery = searchQuery.ilike('location', `%${filters.location}%`);
    }

    // Apply sorting
    if (query.trim() && sorting.by === 'relevance') {
      // Text search results are already sorted by relevance
    } else {
      const ascending = sorting.order === 'asc';
      switch (sorting.by) {
        case 'price':
          searchQuery = searchQuery.order('price', { ascending });
          break;
        case 'year':
          searchQuery = searchQuery.order('year', { ascending });
          break;
        case 'mileage':
          searchQuery = searchQuery.order('mileage', { ascending });
          break;
        case 'created_at':
        default:
          searchQuery = searchQuery.order('created_at', { ascending });
          break;
      }
    }

    // Apply pagination
    searchQuery = searchQuery.range(offset, offset + limit - 1);

    // Execute search
    const { data: listings, error: searchError } = await searchQuery;

    if (searchError) {
      console.error('Advanced search error:', searchError);
      return NextResponse.json({ 
        error: 'Advanced search failed', 
        details: searchError.message 
      }, { status: 500 });
    }

    // Get total count if requested
    let totalItems = 0;
    if (includeTotalCount) {
      let countQuery = supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      if (query.trim()) {
        countQuery = countQuery.textSearch('search_vector', query, { 
          type: 'websearch',
          config: 'english'
        });
      }

      // Apply same filters to count query
      if (filters.make) {
        countQuery = countQuery.in('make', Array.isArray(filters.make) ? filters.make : [filters.make]);
      }
      // ... (apply all other filters similarly)

      const { count, error: countError } = await countQuery;
      if (countError) {
        console.error('Count error:', countError);
      } else {
        totalItems = count || 0;
      }
    }

    const totalPages = totalItems ? Math.ceil(totalItems / limit) : 0;

    console.log(`Advanced search completed - found ${totalItems} results`);

    return NextResponse.json({
      listings: listings || [],
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      searchQuery: query,
      appliedFilters: filters,
      sorting
    });

  } catch (error) {
    console.error('Advanced search API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 