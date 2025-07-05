import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Import the modification categories for validation
const VALID_MODIFICATION_CATEGORIES = [
  'engine',
  'suspension', 
  'transmission',
  'interior',
  'body',
  'exhaust',
  'wheels/tires',
  'electrical',
  'brakes',
  'other'
] as const;

type ModificationCategory = typeof VALID_MODIFICATION_CATEGORIES[number];

interface ModificationData {
  id: string;
  category: ModificationCategory;
  description: string;
  cost?: number;
  date_installed?: string;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    
    console.log('=== LISTINGS API DEBUG ===');
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    console.log('Request URL:', request.url);
    
    // Try multiple methods to get session
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    console.log('Session from getSession:', { session: !!session, error: authError?.message, userId: session?.user?.id });
    
    // Also try getUser method
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('User from getUser:', { user: !!user, error: userError?.message, userId: user?.id });
    
    // Check if we have any user info
    const currentUser = session?.user || user;
    const currentUserId = currentUser?.id;
    
    console.log('Final user info:', { hasUser: !!currentUser, userId: currentUserId, email: currentUser?.email });
    
    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Authentication error', details: authError.message }, { status: 401 });
    }
    
    if (!currentUserId) {
      console.log('No user ID found - returning unauthorized');
      return NextResponse.json({ error: 'No session found. Please log in again.' }, { status: 401 });
    }

    // Get query parameters for filtering and sorting
    const status = searchParams.get('status') || 'all';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('Query params:', { status, sortBy, sortOrder, limit, offset });

    // Build the base query for user's listings - include modifications only if table exists
    let query = supabase
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
        status,
        created_at,
        updated_at,
        sold_at,
        sold_price,
        listing_images(
          id,
          image_url,
          is_primary
        )
      `)
      .eq('user_id', currentUserId);

    // Apply status filter
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    // Apply sorting
    const validSortFields = ['created_at', 'updated_at', 'price', 'year', 'title'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const ascending = sortOrder === 'asc';
    
    query = query
      .order(sortField, { ascending })
      .range(offset, offset + limit - 1);

    console.log('About to execute listings query for user:', currentUserId);
    const { data: listings, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch listings', details: error.message }, { status: 500 });
    }

    console.log(`Query successful - found ${listings?.length || 0} listings`);

    // Get total count for pagination
    let countQuery = supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', currentUserId);

    if (status !== 'all') {
      countQuery = countQuery.eq('status', status);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Count error:', countError);
      return NextResponse.json({ error: 'Failed to get listings count', details: countError.message }, { status: 500 });
    }

    // Process listings to ensure proper image structure
    const processedListings = listings?.map(listing => ({
      ...listing,
      primaryImage: listing.listing_images?.find(img => img.is_primary) || listing.listing_images?.[0] || null,
      imageCount: listing.listing_images?.length || 0,
      modificationCount: 0 // Set to 0 until modifications table is properly set up
    }));

    console.log(`Returning ${processedListings?.length} listings with ${count} total count`);

    return NextResponse.json({
      listings: processedListings || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['title', 'make', 'model', 'year', 'price', 'location'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json({ 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      }, { status: 400 });
    }

    // Validate modifications if provided
    const modifications: ModificationData[] = body.modifications || [];
    const modificationErrors: string[] = [];

    modifications.forEach((mod, index) => {
      if (!mod.category || !mod.description?.trim()) {
        modificationErrors.push(`Modification ${index + 1}: Category and description are required`);
      } else if (!VALID_MODIFICATION_CATEGORIES.includes(mod.category as ModificationCategory)) {
        modificationErrors.push(`Modification ${index + 1}: Invalid category "${mod.category}". Must be one of: ${VALID_MODIFICATION_CATEGORIES.join(', ')}`);
      } else if (mod.description.length < 10) {
        modificationErrors.push(`Modification ${index + 1}: Description must be at least 10 characters long`);
      } else if (mod.cost !== undefined && (mod.cost < 0 || mod.cost > 1000000)) {
        modificationErrors.push(`Modification ${index + 1}: Cost must be between $0 and $1,000,000`);
      }
    });

    if (modificationErrors.length > 0) {
      return NextResponse.json({ 
        error: 'Invalid modifications',
        details: modificationErrors
      }, { status: 400 });
    }

    // Start a transaction to create listing and modifications
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .insert({
        user_id: session.user.id,
        title: body.title,
        make: body.make,
        model: body.model,
        year: body.year,
        price: body.price,
        location: body.location,
        description: body.description || null,
        engine: body.engine || null,
        transmission: body.transmission || null,
        mileage: body.mileage || null,
        condition: body.condition || 'good',
        status: 'active'
      })
      .select()
      .single();

    if (listingError) {
      console.error('Database error creating listing:', listingError);
      return NextResponse.json({ error: 'Failed to create listing', details: listingError.message }, { status: 500 });
    }

    // Create modifications if any (skip if modifications table doesn't exist)
    let createdModifications = [];
    if (modifications.length > 0) {
      try {
        const modificationsToInsert = modifications.map(mod => ({
          listing_id: listing.id,
          name: mod.description.substring(0, 100), // Extract a name from description
          category: mod.category,
          description: mod.description,
          cost: mod.cost || null,
          date_installed: mod.date_installed ? new Date(mod.date_installed + '-01') : null
        }));

        const { data: modData, error: modError } = await supabase
          .from('modifications')
          .insert(modificationsToInsert)
          .select();

        if (modError) {
          console.error('Database error creating modifications (table may not exist):', modError);
          // Don't fail the entire request if modifications table doesn't exist
          console.log('Continuing without modifications...');
        } else {
          createdModifications = modData || [];
        }
      } catch (modificationError) {
        console.error('Error creating modifications (table may not exist):', modificationError);
        // Continue without modifications
      }
    }

    // Return the complete listing with modifications
    const completeListingData = {
      ...listing,
      modifications: createdModifications,
      modificationCount: createdModifications.length
    };

    console.log(`Successfully created listing ${listing.id} with ${createdModifications.length} modifications`);

    return NextResponse.json({ 
      listing: completeListingData,
      message: `Listing created successfully${createdModifications.length > 0 ? ` with ${createdModifications.length} modifications` : ''}`
    }, { status: 201 });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
} 