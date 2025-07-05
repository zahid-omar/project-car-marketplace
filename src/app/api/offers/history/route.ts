import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/offers/history - Get detailed offer history
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const offerId = searchParams.get('offer_id');
    const type = searchParams.get('type'); // 'buyer' or 'seller'
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const actionType = searchParams.get('action_type'); // Filter by specific action

    let query = supabase
      .from('offer_history')
      .select(`
        *,
        offer:offers(
          id,
          listing_id,
          buyer_id,
          seller_id,
          offer_amount,
          status,
          expires_at,
          created_at,
          is_counter_offer,
          counter_offer_count,
          listing:listings(
            id,
            title,
            make,
            model,
            year,
            price,
            listing_images(image_url, is_primary)
          ),
          buyer:profiles!offers_buyer_id_fkey(
            id,
            display_name,
            profile_image_url
          ),
          seller:profiles!offers_seller_id_fkey(
            id,
            display_name,
            profile_image_url
          )
        ),
        actor:profiles!offer_history_action_by_fkey(
          id,
          display_name,
          profile_image_url
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // If specific offer ID is provided
    if (offerId) {
      query = query.eq('offer_id', offerId);
    } else {
      // Filter based on user involvement
      if (type === 'buyer') {
        // Get history for offers where user is buyer
        const { data: userOffers } = await supabase
          .from('offers')
          .select('id')
          .eq('buyer_id', user.id);
        
        if (userOffers && userOffers.length > 0) {
          query = query.in('offer_id', userOffers.map(o => o.id));
        } else {
          // No offers found, return empty result
          return NextResponse.json({ history: [], total: 0 });
        }
      } else if (type === 'seller') {
        // Get history for offers where user is seller
        const { data: userOffers } = await supabase
          .from('offers')
          .select('id')
          .eq('seller_id', user.id);
        
        if (userOffers && userOffers.length > 0) {
          query = query.in('offer_id', userOffers.map(o => o.id));
        } else {
          // No offers found, return empty result
          return NextResponse.json({ history: [], total: 0 });
        }
      } else {
        // Get history for all offers where user is involved
        const { data: userOffers } = await supabase
          .from('offers')
          .select('id')
          .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);
        
        if (userOffers && userOffers.length > 0) {
          query = query.in('offer_id', userOffers.map(o => o.id));
        } else {
          // No offers found, return empty result
          return NextResponse.json({ history: [], total: 0 });
        }
      }
    }

    // Filter by action type if provided
    if (actionType) {
      query = query.eq('action_type', actionType);
    }

    const { data: history, error } = await query;

    if (error) {
      console.error('Error fetching offer history:', error);
      return NextResponse.json(
        { error: 'Failed to fetch offer history' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('offer_history')
      .select('id', { count: 'exact', head: true });

    if (offerId) {
      countQuery = countQuery.eq('offer_id', offerId);
    } else {
      // Apply same filters for count
      if (type === 'buyer') {
        const { data: userOffers } = await supabase
          .from('offers')
          .select('id')
          .eq('buyer_id', user.id);
        
        if (userOffers && userOffers.length > 0) {
          countQuery = countQuery.in('offer_id', userOffers.map(o => o.id));
        }
      } else if (type === 'seller') {
        const { data: userOffers } = await supabase
          .from('offers')
          .select('id')
          .eq('seller_id', user.id);
        
        if (userOffers && userOffers.length > 0) {
          countQuery = countQuery.in('offer_id', userOffers.map(o => o.id));
        }
      } else {
        const { data: userOffers } = await supabase
          .from('offers')
          .select('id')
          .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);
        
        if (userOffers && userOffers.length > 0) {
          countQuery = countQuery.in('offer_id', userOffers.map(o => o.id));
        }
      }
    }

    if (actionType) {
      countQuery = countQuery.eq('action_type', actionType);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.warn('Error getting count:', countError);
    }

    // Enhance history with additional context
    const enhancedHistory = history?.map(item => ({
      ...item,
      formatted_date: new Date(item.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      is_user_action: item.action_by === user.id,
      user_role: item.offer?.buyer_id === user.id ? 'buyer' : 'seller'
    })) || [];

    return NextResponse.json({
      history: enhancedHistory,
      total: count || 0,
      limit,
      offset,
      has_more: (count || 0) > offset + limit
    });

  } catch (error) {
    console.error('Offer history error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/offers/history - Create manual history entry (for internal use)
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { offer_id, action_type, action_details } = body;

    if (!offer_id || !action_type) {
      return NextResponse.json(
        { error: 'offer_id and action_type are required' },
        { status: 400 }
      );
    }

    // Verify user has permission to add history for this offer
    const { data: offer, error: offerError } = await supabase
      .from('offers')
      .select('id, buyer_id, seller_id')
      .eq('id', offer_id)
      .single();

    if (offerError || !offer) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      );
    }

    if (offer.buyer_id !== user.id && offer.seller_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only add history to offers you are involved in' },
        { status: 403 }
      );
    }

    // Create history entry
    const { data: historyEntry, error: insertError } = await supabase
      .from('offer_history')
      .insert({
        offer_id,
        action_type,
        action_by: user.id,
        action_details: action_details || {}
      })
      .select(`
        *,
        offer:offers(
          id,
          offer_amount,
          status
        ),
        actor:profiles!offer_history_action_by_fkey(
          id,
          display_name
        )
      `)
      .single();

    if (insertError) {
      console.error('Error creating history entry:', insertError);
      return NextResponse.json(
        { error: 'Failed to create history entry' },
        { status: 500 }
      );
    }

    return NextResponse.json({ history_entry: historyEntry }, { status: 201 });

  } catch (error) {
    console.error('Create history error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 