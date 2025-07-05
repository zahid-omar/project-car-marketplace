import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// This endpoint can be called by external cron services like Vercel Cron or Supabase Edge Functions
export async function POST(request: NextRequest) {
  try {
    // Verify the request is from an authorized source
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createRouteHandlerClient({ cookies }, {
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY
    });

    // Call the expire_old_offers function
    const { data, error } = await supabase.rpc('expire_old_offers');

    if (error) {
      console.error('Cron job error expiring offers:', error);
      return NextResponse.json(
        { error: 'Failed to expire offers', details: error.message },
        { status: 500 }
      );
    }

    // Get count of recently expired offers
    const { data: expiredOffers, error: countError } = await supabase
      .from('offers')
      .select('id, offer_amount, listing_id')
      .eq('status', 'expired')
      .gte('expired_at', new Date(Date.now() - 300000).toISOString()); // Last 5 minutes

    const expiredCount = expiredOffers?.length || 0;

    console.log(`Cron job completed: ${expiredCount} offers expired`);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      expired_count: expiredCount,
      message: `Successfully expired ${expiredCount} offers`
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    service: 'offer-expiration-cron',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
} 