import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/offers/analytics - Get offer analytics and statistics
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '30'; // days
    const type = searchParams.get('type'); // 'buyer' or 'seller'
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(timeframe));

    // Base query for user's offers
    let baseQuery;
    if (type === 'buyer') {
      baseQuery = supabase
        .from('offers')
        .select('*')
        .eq('buyer_id', user.id);
    } else if (type === 'seller') {
      baseQuery = supabase
        .from('offers')
        .select('*')
        .eq('seller_id', user.id);
    } else {
      // Get all offers where user is involved
      baseQuery = supabase
        .from('offers')
        .select('*')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);
    }

    // Get all offers within timeframe
    const { data: allOffers, error: offersError } = await baseQuery
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false });

    if (offersError) {
      console.error('Error fetching offers for analytics:', offersError);
      return NextResponse.json(
        { error: 'Failed to fetch offer data' },
        { status: 500 }
      );
    }

    // Calculate analytics
    const analytics = calculateOfferAnalytics(allOffers || [], user.id, type);

    // Get offer history for detailed timeline
    const { data: offerHistory, error: historyError } = await supabase
      .from('offer_history')
      .select(`
        *,
        offer:offers(
          id,
          listing_id,
          offer_amount,
          status,
          buyer_id,
          seller_id
        )
      `)
      .in('offer_id', (allOffers || []).map(o => o.id))
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(100);

    if (historyError) {
      console.warn('Error fetching offer history:', historyError);
    }

    // Get top listings by offer activity (for sellers)
    let topListings = [];
    if (type === 'seller' || !type) {
      const { data: listingOffers, error: listingError } = await supabase
        .from('offers')
        .select(`
          listing_id,
          offer_amount,
          status,
          listing:listings(
            id,
            title,
            make,
            model,
            year,
            price,
            listing_images(image_url, is_primary)
          )
        `)
        .eq('seller_id', user.id)
        .gte('created_at', cutoffDate.toISOString());

      if (!listingError && listingOffers) {
        topListings = calculateTopListings(listingOffers);
      }
    }

    return NextResponse.json({
      analytics,
      recent_activity: offerHistory?.slice(0, 20) || [],
      top_listings: topListings,
      timeframe: parseInt(timeframe),
      total_offers: allOffers?.length || 0
    });

  } catch (error) {
    console.error('Offers analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateOfferAnalytics(offers: any[], userId: string, type?: string) {
  const totalOffers = offers.length;
  
  if (totalOffers === 0) {
    return {
      total_offers: 0,
      success_rate: 0,
      average_negotiation_time: 0,
      offer_status_breakdown: {
        pending: 0,
        accepted: 0,
        rejected: 0,
        expired: 0,
        countered: 0,
        withdrawn: 0
      },
      average_offer_percentage: 0,
      counter_offer_rate: 0,
      monthly_activity: [],
      offer_value_ranges: []
    };
  }

  // Status breakdown
  const statusCounts = offers.reduce((acc, offer) => {
    acc[offer.status] = (acc[offer.status] || 0) + 1;
    return acc;
  }, {});

  // Success rate (accepted offers / total offers)
  const successRate = ((statusCounts.accepted || 0) / totalOffers) * 100;

  // Counter-offer rate
  const counterOfferRate = ((statusCounts.countered || 0) / totalOffers) * 100;

  // Calculate average negotiation time (for completed offers)
  const completedOffers = offers.filter(o => 
    ['accepted', 'rejected'].includes(o.status) && o.updated_at && o.created_at
  );
  
  const averageNegotiationTime = completedOffers.length > 0 
    ? completedOffers.reduce((sum, offer) => {
        const created = new Date(offer.created_at);
        const updated = new Date(offer.updated_at);
        return sum + (updated.getTime() - created.getTime());
      }, 0) / completedOffers.length / (1000 * 60 * 60) // Convert to hours
    : 0;

  // Monthly activity breakdown
  const monthlyActivity = generateMonthlyActivity(offers);

  // Offer value ranges
  const offerValueRanges = calculateValueRanges(offers);

  return {
    total_offers: totalOffers,
    success_rate: Math.round(successRate * 100) / 100,
    average_negotiation_time: Math.round(averageNegotiationTime * 100) / 100,
    offer_status_breakdown: {
      pending: statusCounts.pending || 0,
      accepted: statusCounts.accepted || 0,
      rejected: statusCounts.rejected || 0,
      expired: statusCounts.expired || 0,
      countered: statusCounts.countered || 0,
      withdrawn: statusCounts.withdrawn || 0
    },
    counter_offer_rate: Math.round(counterOfferRate * 100) / 100,
    monthly_activity: monthlyActivity,
    offer_value_ranges: offerValueRanges
  };
}

function generateMonthlyActivity(offers: any[]) {
  const monthlyData = {};
  
  offers.forEach(offer => {
    const date = new Date(offer.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: monthKey,
        total: 0,
        accepted: 0,
        rejected: 0,
        pending: 0,
        expired: 0,
        countered: 0
      };
    }
    
    monthlyData[monthKey].total++;
    monthlyData[monthKey][offer.status]++;
  });

  return Object.values(monthlyData).sort((a: any, b: any) => a.month.localeCompare(b.month));
}

function calculateValueRanges(offers: any[]) {
  const ranges = {
    'Under $10k': 0,
    '$10k - $25k': 0,
    '$25k - $50k': 0,
    '$50k - $100k': 0,
    'Over $100k': 0
  };

  offers.forEach(offer => {
    const amount = parseFloat(offer.offer_amount);
    
    if (amount < 10000) {
      ranges['Under $10k']++;
    } else if (amount < 25000) {
      ranges['$10k - $25k']++;
    } else if (amount < 50000) {
      ranges['$25k - $50k']++;
    } else if (amount < 100000) {
      ranges['$50k - $100k']++;
    } else {
      ranges['Over $100k']++;
    }
  });

  return Object.entries(ranges).map(([range, count]) => ({
    range,
    count,
    percentage: offers.length > 0 ? Math.round((count / offers.length) * 100) : 0
  }));
}

function calculateTopListings(listingOffers: any[]) {
  const listingStats = {};
  
  listingOffers.forEach(offer => {
    const listingId = offer.listing_id;
    
    if (!listingStats[listingId]) {
      listingStats[listingId] = {
        listing: offer.listing,
        total_offers: 0,
        highest_offer: 0,
        average_offer: 0,
        accepted_offers: 0,
        offer_amounts: []
      };
    }
    
    const stats = listingStats[listingId];
    stats.total_offers++;
    stats.offer_amounts.push(parseFloat(offer.offer_amount));
    
    if (parseFloat(offer.offer_amount) > stats.highest_offer) {
      stats.highest_offer = parseFloat(offer.offer_amount);
    }
    
    if (offer.status === 'accepted') {
      stats.accepted_offers++;
    }
  });

  // Calculate averages and sort by activity
  return Object.values(listingStats)
    .map((stats: any) => ({
      ...stats,
      average_offer: stats.offer_amounts.reduce((sum, amount) => sum + amount, 0) / stats.offer_amounts.length,
      success_rate: (stats.accepted_offers / stats.total_offers) * 100
    }))
    .sort((a, b) => b.total_offers - a.total_offers)
    .slice(0, 10); // Top 10 listings
} 