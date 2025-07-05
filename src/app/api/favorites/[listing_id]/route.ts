import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import {
  validateFavoriteExists,
  logFavoriteOperation,
  createAuthErrorResponse,
  createValidationErrorResponse,
  createNotFoundErrorResponse,
  createServerErrorResponse
} from '@/lib/validation/favorites';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { listing_id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    console.log('[FAVORITES] DELETE request received');
    
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

    const { listing_id } = params;

    // Validate listing_id format (basic UUID validation)
    if (!listing_id || typeof listing_id !== 'string') {
      return NextResponse.json(
        createValidationErrorResponse('listing_id is required and must be a valid string'),
        { status: 400 }
      );
    }

    // Remove UUID validation since we now accept any string ID format
    if (!listing_id || typeof listing_id !== 'string' || listing_id.trim().length === 0) {
      return NextResponse.json(
        createValidationErrorResponse('listing_id is required and must be a valid string'),
        { status: 400 }
      );
    }

    logFavoriteOperation('remove_favorite_start', currentUserId, listing_id, true);

    // Validate favorite exists
    const favoriteValidation = await validateFavoriteExists(supabase, listing_id, currentUserId);
    if (!favoriteValidation.exists) {
      logFavoriteOperation('remove_favorite_not_found', currentUserId, listing_id, false, favoriteValidation.error);
      return NextResponse.json(
        createNotFoundErrorResponse('Favorite'),
        { status: 404 }
      );
    }

    // Remove from favorites
    const { error: deleteError } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', currentUserId)
      .eq('listing_id', listing_id);

    if (deleteError) {
      console.error('[FAVORITES] Database error removing favorite:', deleteError);
      logFavoriteOperation('remove_favorite_db_error', currentUserId, listing_id, false, deleteError.message);
      return NextResponse.json(
        createServerErrorResponse('Failed to remove favorite', deleteError.message),
        { status: 500 }
      );
    }

    logFavoriteOperation('remove_favorite_success', currentUserId, listing_id, true);

    return NextResponse.json({ 
      message: 'Removed from favorites successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('[FAVORITES] DELETE API error:', error);
    return NextResponse.json(
      createServerErrorResponse('Internal server error', error instanceof Error ? error.message : 'Unknown error'),
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { listing_id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    console.log('[FAVORITES] GET status request received');
    
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

    const { listing_id } = params;

    // Validate listing_id format
    if (!listing_id || typeof listing_id !== 'string' || listing_id.trim().length === 0) {
      return NextResponse.json(
        createValidationErrorResponse('listing_id is required and must be a valid string'),
        { status: 400 }
      );
    }

    logFavoriteOperation('check_favorite_status_start', currentUserId, listing_id, true);

    // Check if listing is favorited by current user
    const { data: favorite, error } = await supabase
      .from('favorites')
      .select('id, created_at')
      .eq('user_id', currentUserId)
      .eq('listing_id', listing_id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('[FAVORITES] Database error checking favorite status:', error);
      logFavoriteOperation('check_favorite_status_error', currentUserId, listing_id, false, error.message);
      return NextResponse.json(
        createServerErrorResponse('Failed to check favorite status', error.message),
        { status: 500 }
      );
    }

    const isFavorited = !!favorite;
    logFavoriteOperation('check_favorite_status_success', currentUserId, listing_id, true, 
                        `Status: ${isFavorited ? 'favorited' : 'not favorited'}`);

    return NextResponse.json({ 
      is_favorited: isFavorited,
      favorite_id: favorite?.id || null,
      favorited_at: favorite?.created_at || null
    }, { status: 200 });

  } catch (error) {
    console.error('[FAVORITES] GET API error:', error);
    return NextResponse.json(
      createServerErrorResponse('Internal server error', error instanceof Error ? error.message : 'Unknown error'),
      { status: 500 }
    );
  }
} 