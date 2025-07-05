import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { soldPrice, notes } = body;

    // First, verify the listing exists and belongs to the user
    const { data: existingListing, error: fetchError } = await supabase
      .from('listings')
      .select('id, user_id, status, price')
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .single();

    if (fetchError || !existingListing) {
      return NextResponse.json({ error: 'Listing not found or unauthorized' }, { status: 404 });
    }

    // Check if listing is already sold
    if (existingListing.status === 'sold') {
      return NextResponse.json({ error: 'Listing is already marked as sold' }, { status: 400 });
    }

    // Validate sold price if provided
    if (soldPrice !== undefined) {
      if (typeof soldPrice !== 'number' || soldPrice < 0) {
        return NextResponse.json({ error: 'Invalid sold price' }, { status: 400 });
      }
    }

    // Update the listing to sold status
    const updateData: any = {
      status: 'sold',
      sold_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Add sold price if provided, otherwise use the original listing price
    updateData.sold_price = soldPrice !== undefined ? soldPrice : existingListing.price;

    const { data: updatedListing, error } = await supabase
      .from('listings')
      .update(updateData)
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to mark listing as sold' }, { status: 500 });
    }

    return NextResponse.json({ 
      listing: updatedListing,
      message: 'Listing successfully marked as sold'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH endpoint to reactivate a sold listing
export async function PUT(request: NextRequest, { params }: RouteParams) {
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
      .select('id, user_id, status')
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .single();

    if (fetchError || !existingListing) {
      return NextResponse.json({ error: 'Listing not found or unauthorized' }, { status: 404 });
    }

    // Check if listing is not sold
    if (existingListing.status !== 'sold') {
      return NextResponse.json({ error: 'Listing is not marked as sold' }, { status: 400 });
    }

    // Update the listing to reactivate it
    const updateData = {
      status: 'active',
      sold_at: null,
      sold_price: null,
      updated_at: new Date().toISOString()
    };

    const { data: updatedListing, error } = await supabase
      .from('listings')
      .update(updateData)
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to reactivate listing' }, { status: 500 });
    }

    return NextResponse.json({ 
      listing: updatedListing,
      message: 'Listing successfully reactivated'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 