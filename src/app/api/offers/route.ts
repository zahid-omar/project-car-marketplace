import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic'

// Validation schemas
const createOfferSchema = z.object({
  listing_id: z.string().uuid(),
  offer_amount: z.number().positive(),
  message: z.string().optional(),
  cash_offer: z.boolean().default(false),
  financing_needed: z.boolean().default(false),
  inspection_contingency: z.boolean().default(true),
});

const createCounterOfferSchema = z.object({
  original_offer_id: z.string().uuid(),
  offer_amount: z.number().positive(),
  message: z.string().optional(),
  cash_offer: z.boolean().default(false),
  financing_needed: z.boolean().default(false),
  inspection_contingency: z.boolean().default(true),
});

const updateOfferStatusSchema = z.object({
  status: z.enum(['accepted', 'rejected', 'withdrawn']),
  rejection_reason: z.string().optional(),
});

// GET /api/offers - Fetch offers for authenticated user
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'sent' or 'received'
    const status = searchParams.get('status');
    const listing_id = searchParams.get('listing_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('offers')
      .select(`
        *,
        listing:listings(
          id,
          title,
          make,
          model,
          year,
          price,
          status,
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
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by type (sent or received)
    if (type === 'sent') {
      query = query.eq('buyer_id', user.id);
    } else if (type === 'received') {
      query = query.eq('seller_id', user.id);
    } else {
      // Get all offers where user is either buyer or seller
      query = query.or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);
    }

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    // Filter by listing if provided
    if (listing_id) {
      query = query.eq('listing_id', listing_id);
    }

    const { data: offers, error } = await query;

    if (error) {
      console.error('Error fetching offers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch offers' },
        { status: 500 }
      );
    }

    return NextResponse.json({ offers });

  } catch (error) {
    console.error('Offers GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/offers - Create a new offer
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Check if this is a counter-offer request
    const isCounterOffer = 'original_offer_id' in body;
    
    let validation;
    if (isCounterOffer) {
      validation = createCounterOfferSchema.safeParse(body);
    } else {
      validation = createOfferSchema.safeParse(body);
    }
    
    if (!validation.success) {
      return NextResponse.json(
        { error: isCounterOffer ? 'Invalid counter-offer data' : 'Invalid offer data', 
          details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { 
      offer_amount, 
      message, 
      cash_offer, 
      financing_needed, 
      inspection_contingency 
    } = validation.data;

    let listing_id: string;
    let original_offer_id: string | undefined;
    let counter_offer_count = 0;
    let seller_id: string;
    let buyer_id: string;

    if (isCounterOffer) {
      // Handle counter-offer logic
      const counterData = validation.data as z.infer<typeof createCounterOfferSchema>;
      original_offer_id = counterData.original_offer_id;

      // Get the original offer
      const { data: originalOffer, error: originalOfferError } = await supabase
        .from('offers')
        .select('*')
        .eq('id', original_offer_id)
        .single();

      if (originalOfferError || !originalOffer) {
        return NextResponse.json(
          { error: 'Original offer not found' },
          { status: 404 }
        );
      }

      // Verify the original offer can be countered
      if (originalOffer.status !== 'pending') {
        return NextResponse.json(
          { error: 'Can only counter pending offers' },
          { status: 400 }
        );
      }

      // Verify user has permission to counter (either buyer or seller of original offer)
      if (originalOffer.buyer_id !== user.id && originalOffer.seller_id !== user.id) {
        return NextResponse.json(
          { error: 'You can only counter offers you are involved in' },
          { status: 403 }
        );
      }

      // Set up counter-offer details
      listing_id = originalOffer.listing_id;
      counter_offer_count = originalOffer.counter_offer_count + 1;
      
      // Switch roles: if original buyer counters, they become seller of counter-offer
      if (originalOffer.buyer_id === user.id) {
        buyer_id = originalOffer.seller_id;
        seller_id = user.id;
      } else {
        buyer_id = user.id;
        seller_id = originalOffer.buyer_id;
      }

      // Update original offer status to 'countered'
      await supabase
        .from('offers')
        .update({ status: 'countered', updated_at: new Date().toISOString() })
        .eq('id', original_offer_id);

    } else {
      // Handle regular offer logic
      const offerData = validation.data as z.infer<typeof createOfferSchema>;
      listing_id = offerData.listing_id;
      buyer_id = user.id;

      // Verify listing exists and is active
      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .select('id, user_id, status, price')
        .eq('id', listing_id)
        .eq('status', 'active')
        .single();

      if (listingError || !listing) {
        return NextResponse.json(
          { error: 'Listing not found or inactive' },
          { status: 404 }
        );
      }

      seller_id = listing.user_id;

      // Prevent users from making offers on their own listings
      if (listing.user_id === user.id) {
        return NextResponse.json(
          { error: 'Cannot make an offer on your own listing' },
          { status: 400 }
        );
      }

      // Check for existing pending offer from this buyer
      const { data: existingOffer } = await supabase
        .from('offers')
        .select('id')
        .eq('listing_id', listing_id)
        .eq('buyer_id', user.id)
        .eq('status', 'pending')
        .single();

      if (existingOffer) {
        return NextResponse.json(
          { error: 'You already have a pending offer on this listing' },
          { status: 400 }
        );
      }
    }

    // Create the offer
    const { data: offer, error: insertError } = await supabase
      .from('offers')
      .insert({
        listing_id,
        buyer_id,
        seller_id,
        offer_amount,
        message,
        cash_offer,
        financing_needed,
        inspection_contingency,
        original_offer_id,
        counter_offer_count,
        is_counter_offer: isCounterOffer,
      })
      .select(`
        *,
        listing:listings(
          id,
          title,
          make,
          model,
          year,
          price,
          status,
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
      `)
      .single();

    if (insertError) {
      console.error('Error creating offer:', insertError);
      return NextResponse.json(
        { error: 'Failed to create offer' },
        { status: 500 }
      );
    }

    // Log the creation in offer history
    const historyPromises = [];
    
    // Log the new offer creation
    historyPromises.push(
      supabase
        .from('offer_history')
        .insert({
          offer_id: offer.id,
          action_type: isCounterOffer ? 'countered' : 'created',
          action_by: user.id,
          action_details: {
            offer_amount,
            terms: { cash_offer, financing_needed, inspection_contingency },
            ...(isCounterOffer && { 
              original_offer_id, 
              counter_offer_count,
              counter_type: 'new_counter_offer'
            })
          }
        })
    );

    // If this is a counter-offer, also log the original offer being countered
    if (isCounterOffer && original_offer_id) {
      historyPromises.push(
        supabase
          .from('offer_history')
          .insert({
            offer_id: original_offer_id,
            action_type: 'countered',
            action_by: user.id,
            action_details: {
              counter_offer_id: offer.id,
              counter_offer_amount: offer_amount,
              counter_type: 'original_offer_countered'
            }
          })
      );
    }

    await Promise.all(historyPromises);

    return NextResponse.json({ offer }, { status: 201 });

  } catch (error) {
    console.error('Offers POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/offers - Update offer status (accept, reject, withdraw)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { offer_id, ...updateData } = body;

    if (!offer_id) {
      return NextResponse.json(
        { error: 'offer_id is required' },
        { status: 400 }
      );
    }

    const validation = updateOfferStatusSchema.safeParse(updateData);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid update data', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { status, rejection_reason } = validation.data;

    // Get the offer and verify permissions
    const { data: offer, error: offerError } = await supabase
      .from('offers')
      .select('*')
      .eq('id', offer_id)
      .single();

    if (offerError || !offer) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      );
    }

    // Check if offer has expired
    const now = new Date();
    const expiresAt = new Date(offer.expires_at);
    
    if (now > expiresAt && offer.status === 'pending') {
      // Automatically expire the offer
      await supabase
        .from('offers')
        .update({
          status: 'expired',
          expired_at: now.toISOString(),
          updated_at: now.toISOString()
        })
        .eq('id', offer_id);

      return NextResponse.json(
        { error: 'This offer has expired and cannot be modified' },
        { status: 400 }
      );
    }

    // Verify current status allows this transition
    if (offer.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot update offer with status: ${offer.status}` },
        { status: 400 }
      );
    }

    // Permission checks
    if (status === 'withdrawn' && offer.buyer_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the buyer can withdraw an offer' },
        { status: 403 }
      );
    }

    if ((status === 'accepted' || status === 'rejected') && offer.seller_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the seller can accept or reject an offer' },
        { status: 403 }
      );
    }

    // Update the offer
    const updateFields: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'accepted') {
      updateFields.accepted_at = new Date().toISOString();
    } else if (status === 'rejected') {
      updateFields.rejected_at = new Date().toISOString();
    }

    const { data: updatedOffer, error: updateError } = await supabase
      .from('offers')
      .update(updateFields)
      .eq('id', offer_id)
      .select(`
        *,
        listing:listings(
          id,
          title,
          make,
          model,
          year,
          price
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
      `)
      .single();

    if (updateError) {
      console.error('Error updating offer:', updateError);
      return NextResponse.json(
        { error: 'Failed to update offer' },
        { status: 500 }
      );
    }

    // Log the status change
    await supabase
      .from('offer_history')
      .insert({
        offer_id: offer.id,
        action_type: status,
        action_by: user.id,
        action_details: {
          old_status: offer.status,
          new_status: status,
          rejection_reason
        }
      });

    // If accepted, mark listing as sold (optional - you might want to handle this differently)
    if (status === 'accepted') {
      await supabase
        .from('listings')
        .update({
          status: 'sold',
          sold_at: new Date().toISOString(),
          sold_price: offer.offer_amount
        })
        .eq('id', offer.listing_id);
    }

    return NextResponse.json({ offer: updatedOffer });

  } catch (error) {
    console.error('Offers PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 