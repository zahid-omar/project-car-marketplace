import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import {
  validateFavoriteInput,
  validateFavoriteQuery,
  validateListingExists,
  validateNotOwnListing,
  validateNotAlreadyFavorited,
  buildFavoritesQuery,
  sanitizeFavoriteData,
  logFavoriteOperation,
  createAuthErrorResponse,
  createValidationErrorResponse,
  createNotFoundErrorResponse,
  createConflictErrorResponse,
  createServerErrorResponse,
  validateRequestSize
} from '@/lib/validation/favorites';

// Interface for favorite data with listing
interface FavoriteWithListing {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
  listing: any; // This could be null if listing is deleted
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    console.log('[FAVORITES] GET request received');
    
    // Try multiple methods to get session (same as listings API)
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    console.log('[FAVORITES] Session from getSession:', { session: !!session, error: authError?.message, userId: session?.user?.id });
    
    // Also try getUser method
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('[FAVORITES] User from getUser:', { user: !!user, error: userError?.message, userId: user?.id });
    
    // Check if we have any user info
    const currentUser = session?.user || user;
    const currentUserId = currentUser?.id;
    
    console.log('[FAVORITES] Final user info:', { hasUser: !!currentUser, userId: currentUserId, email: currentUser?.email });
    
    if (authError) {
      console.error('[FAVORITES] Auth error:', authError);
      return NextResponse.json(createAuthErrorResponse('Authentication error'), { status: 401 });
    }
    
    if (!currentUserId) {
      console.log('[FAVORITES] No user ID found - returning unauthorized');
      return NextResponse.json(createAuthErrorResponse('No session found. Please log in again.'), { status: 401 });
    }

    // Validate query parameters
    const { searchParams } = new URL(request.url);
    const queryValidation = validateFavoriteQuery({
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
      sort_by: searchParams.get('sort_by'),
      sort_order: searchParams.get('sort_order')
    });

    if (!queryValidation.success) {
      console.log('[FAVORITES] Invalid query parameters:', queryValidation.error);
      return NextResponse.json(
        createValidationErrorResponse('Invalid query parameters', queryValidation.error),
        { status: 400 }
      );
    }

    const { limit = 50, offset = 0, sort_by = 'created_at', sort_order = 'desc' } = queryValidation.data;

    logFavoriteOperation('get_favorites_start', currentUserId, 'N/A', true);

    // Build and execute query
    const query = buildFavoritesQuery(supabase, currentUserId, {
      limit,
      offset,
      sort_by,
      sort_order
    });

    const { data: favorites, error } = await query;

    if (error) {
      console.error('[FAVORITES] Database error fetching favorites:', error);
      logFavoriteOperation('get_favorites_error', currentUserId, 'N/A', false, error.message);
      return NextResponse.json(
        createServerErrorResponse('Failed to fetch favorites', error.message),
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', currentUserId);

    if (countError) {
      console.error('[FAVORITES] Count error:', countError);
      logFavoriteOperation('get_favorites_count_error', currentUserId, 'N/A', false, countError.message);
      return NextResponse.json(
        createServerErrorResponse('Failed to get favorites count', countError.message),
        { status: 500 }
      );
    }

    // Process and sanitize favorites data
    console.log('[FAVORITES] Raw favorites data:', JSON.stringify(favorites, null, 2));
    
    const validFavorites = favorites
      ?.filter((fav: FavoriteWithListing) => {
        const hasListing = !!fav.listing;
        if (!hasListing) {
          console.log('[FAVORITES] Filtering out favorite with null listing:', fav);
        }
        return hasListing;
      }) // Filter out any with null listings (deleted listings)
      .map(sanitizeFavoriteData) || [];

    console.log('[FAVORITES] Valid favorites after processing:', validFavorites.length);
    logFavoriteOperation('get_favorites_success', currentUserId, 'N/A', true);

    return NextResponse.json({
      favorites: validFavorites,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    });

  } catch (error) {
    console.error('[FAVORITES] API error:', error);
    return NextResponse.json(
      createServerErrorResponse('Internal server error', error instanceof Error ? error.message : 'Unknown error'),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    console.log('[FAVORITES] POST request received');
    
    // Validate request size
    if (!validateRequestSize(request)) {
      return NextResponse.json(
        createValidationErrorResponse('Request too large'),
        { status: 413 }
      );
    }

    // Try multiple methods to get session (same as listings API)
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    console.log('[FAVORITES] Session from getSession:', { session: !!session, error: authError?.message, userId: session?.user?.id });
    
    // Also try getUser method
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('[FAVORITES] User from getUser:', { user: !!user, error: userError?.message, userId: user?.id });
    
    // Check if we have any user info
    const currentUser = session?.user || user;
    const currentUserId = currentUser?.id;
    
    console.log('[FAVORITES] Final user info:', { hasUser: !!currentUser, userId: currentUserId, email: currentUser?.email });
    
    if (authError) {
      console.error('[FAVORITES] Auth error:', authError);
      return NextResponse.json(createAuthErrorResponse('Authentication error'), { status: 401 });
    }
    
    if (!currentUserId) {
      console.log('[FAVORITES] No user ID found - returning unauthorized');
      return NextResponse.json(createAuthErrorResponse('No session found. Please log in again.'), { status: 401 });
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        createValidationErrorResponse('Invalid JSON in request body'),
        { status: 400 }
      );
    }

    const inputValidation = validateFavoriteInput(body);
    if (!inputValidation.success) {
      console.log('[FAVORITES] Invalid input data:', inputValidation.error);
      return NextResponse.json(
        createValidationErrorResponse('Invalid input data', inputValidation.error),
        { status: 400 }
      );
    }

    const { listing_id } = inputValidation.data;

    logFavoriteOperation('add_favorite_start', currentUserId, listing_id, true);

    // Validate listing exists
    const listingValidation = await validateListingExists(supabase, listing_id);
    if (!listingValidation.exists) {
      logFavoriteOperation('add_favorite_listing_not_found', currentUserId, listing_id, false, listingValidation.error);
      return NextResponse.json(
        createNotFoundErrorResponse('Listing'),
        { status: 404 }
      );
    }

    // Validate not own listing
    const ownershipValidation = await validateNotOwnListing(supabase, listing_id, currentUserId);
    if (!ownershipValidation.valid) {
      logFavoriteOperation('add_favorite_own_listing', currentUserId, listing_id, false, ownershipValidation.error);
      return NextResponse.json(
        createValidationErrorResponse(ownershipValidation.error || 'Cannot favorite your own listing'),
        { status: 400 }
      );
    }

    // Validate not already favorited
    const duplicateValidation = await validateNotAlreadyFavorited(supabase, listing_id, currentUserId);
    if (!duplicateValidation.valid) {
      logFavoriteOperation('add_favorite_already_exists', currentUserId, listing_id, false, duplicateValidation.error);
      return NextResponse.json(
        createConflictErrorResponse(duplicateValidation.error || 'Listing already favorited'),
        { status: 409 }
      );
    }

    // Add to favorites
    const { data: newFavorite, error: insertError } = await supabase
      .from('favorites')
      .insert({
        user_id: currentUserId,
        listing_id: listing_id
      })
      .select()
      .single();

    if (insertError) {
      console.error('[FAVORITES] Database error adding favorite:', insertError);
      logFavoriteOperation('add_favorite_db_error', currentUserId, listing_id, false, insertError.message);
      return NextResponse.json(
        createServerErrorResponse('Failed to add favorite', insertError.message),
        { status: 500 }
      );
    }

    logFavoriteOperation('add_favorite_success', currentUserId, listing_id, true);

    return NextResponse.json({
      favorite: sanitizeFavoriteData(newFavorite),
      message: 'Added to favorites successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('[FAVORITES] API error:', error);
    return NextResponse.json(
      createServerErrorResponse('Internal server error', error instanceof Error ? error.message : 'Unknown error'),
      { status: 500 }
    );
  }
} 