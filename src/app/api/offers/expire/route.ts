import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/offers/expire - Manually trigger expiration check
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Optional: Add authentication for admin/system calls
    const authHeader = request.headers.get('authorization');
    const isSystemCall = authHeader === `Bearer ${process.env.SYSTEM_API_KEY}`;
    
    // For manual calls, require authentication
    if (!isSystemCall) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Call the expire_old_offers function
    const { data, error } = await supabase.rpc('expire_old_offers');

    if (error) {
      console.error('Error expiring offers:', error);
      return NextResponse.json(
        { error: 'Failed to expire offers' },
        { status: 500 }
      );
    }

    // Get count of expired offers
    const { data: expiredOffers, error: countError } = await supabase
      .from('offers')
      .select('id')
      .eq('status', 'expired')
      .gte('expired_at', new Date(Date.now() - 60000).toISOString()); // Last minute

    const expiredCount = expiredOffers?.length || 0;

    return NextResponse.json({ 
      success: true, 
      message: `Expiration check completed. ${expiredCount} offers expired.`,
      expired_count: expiredCount
    });

  } catch (error) {
    console.error('Offer expiration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/offers/expire - Check for offers that will expire soon
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const hoursAhead = parseInt(searchParams.get('hours') || '24');

    // Get offers expiring within the specified hours
    const cutoffTime = new Date(Date.now() + (hoursAhead * 60 * 60 * 1000));

    const { data: expiringOffers, error } = await supabase
      .from('offers')
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
          display_name
        ),
        seller:profiles!offers_seller_id_fkey(
          id,
          display_name
        )
      `)
      .eq('status', 'pending')
      .lte('expires_at', cutoffTime.toISOString())
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order('expires_at', { ascending: true });

    if (error) {
      console.error('Error fetching expiring offers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch expiring offers' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      offers: expiringOffers,
      count: expiringOffers.length,
      cutoff_time: cutoffTime.toISOString()
    });

  } catch (error) {
    console.error('Expiring offers GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 