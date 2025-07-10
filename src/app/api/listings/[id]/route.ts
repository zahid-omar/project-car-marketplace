import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Authentication is optional for viewing public listings
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    // First, try to fetch the listing with basic public information
    const { data: listing, error } = await supabase
      .from('listings')
      .select(`
        *,
        listing_images(*),
        modifications(*),
        profiles!listings_user_id_fkey(
          id,
          display_name,
          email,
          profile_image_url
        )
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
      }
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch listing' }, { status: 500 });
    }

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Check if this is the owner's own listing
    const isOwner = session?.user?.id === listing.user_id;
    
    // If not the owner, only return public/active listings
    if (!isOwner && listing.status !== 'active') {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Return the listing with seller profile information
    const response = {
      listing: {
        ...listing,
        seller: listing.profiles
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // First, verify the listing exists and belongs to the user
    const { data: existingListing, error: fetchError } = await supabase
      .from('listings')
      .select('id, user_id')
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .single();

    if (fetchError || !existingListing) {
      return NextResponse.json({ error: 'Listing not found or unauthorized' }, { status: 404 });
    }

    // Prepare update data - only include fields that are provided
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // List of updatable fields
    const updatableFields = [
      'title', 'make', 'model', 'year', 'price', 'location', 'description',
      'engine', 'transmission', 'mileage', 'condition', 'status'
    ];

    updatableFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    // Update the listing
    const { data: updatedListing, error } = await supabase
      .from('listings')
      .update(updateData)
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 });
    }

    // Handle modifications update if provided
    if (body.modifications && Array.isArray(body.modifications)) {
      try {
        // First, delete existing modifications for this listing
        await supabase
          .from('modifications')
          .delete()
          .eq('listing_id', params.id);

        // Then, insert new modifications if any
        if (body.modifications.length > 0) {
          const modificationsToInsert = body.modifications.map((mod: any) => ({
            listing_id: params.id,
            category: mod.category,
            description: mod.description,
            cost: mod.cost || null,
            date_installed: mod.date_installed || null
          }));

          const { error: modError } = await supabase
            .from('modifications')
            .insert(modificationsToInsert);

          if (modError) {
            console.error('Error updating modifications:', modError);
            // Don't fail the entire request if modifications update fails
          }
        }
      } catch (modificationError) {
        console.error('Error handling modifications update:', modificationError);
        // Don't fail the entire request if modifications table doesn't exist
      }
    }

    // Fetch the updated listing with all related data
    const { data: completeUpdatedListing, error: fetchUpdatedError } = await supabase
      .from('listings')
      .select(`
        *,
        listing_images(*),
        modifications(*)
      `)
      .eq('id', params.id)
      .single();

    if (fetchUpdatedError) {
      console.error('Error fetching updated listing:', fetchUpdatedError);
      // Return the basic updated listing if we can't fetch the complete one
      return NextResponse.json({ listing: updatedListing });
    }

    return NextResponse.json({ listing: completeUpdatedListing });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First, verify the listing exists and belongs to the user
    const { data: existingListing, error: fetchError } = await supabase
      .from('listings')
      .select('id, user_id')
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .single();

    if (fetchError || !existingListing) {
      return NextResponse.json({ error: 'Listing not found or unauthorized' }, { status: 404 });
    }

    // Delete the listing (this will cascade to related images and modifications)
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', params.id)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Listing deleted successfully' 
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 