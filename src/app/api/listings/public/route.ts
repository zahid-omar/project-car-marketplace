import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// GET /api/listings/public - Get all public listings for messaging
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const search = url.searchParams.get('search') || '';

    // Build query for public listings (excluding current user's listings)
    let query = supabase
      .from('listings')
      .select(`
        id,
        title,
        make,
        model,
        year,
        price,
        user_id,
        status,
        created_at,
        profiles!listings_user_id_fkey(
          id,
          display_name,
          profile_image_url,
          email
        )
      `)
      .eq('status', 'active')
      .neq('user_id', session.user.id); // Exclude current user's listings

    // Add search filter if provided
    if (search) {
      query = query.or(`title.ilike.%${search}%,make.ilike.%${search}%,model.ilike.%${search}%`);
    }

    // Apply ordering and pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: listings, error } = await query;

    if (error) {
      console.error('Error fetching public listings:', error);
      return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
    }

    // Transform the data to match the expected format
    const transformedListings = listings?.map(listing => ({
      ...listing,
      seller: listing.profiles
    })) || [];

    return NextResponse.json({ listings: transformedListings });
  } catch (error) {
    console.error('Public listings API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 