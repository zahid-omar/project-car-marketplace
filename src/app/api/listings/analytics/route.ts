import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    
    // Check authentication with better error handling
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    console.log('Analytics auth check:', { session: !!session, authError, userId: session?.user?.id });
    
    if (authError) {
      console.error('Auth error in analytics:', authError);
      return NextResponse.json({ error: 'Authentication error', details: authError.message }, { status: 401 });
    }
    
    if (!session?.user?.id) {
      console.log('No session found in analytics');
      return NextResponse.json({ error: 'No session found. Please log in again.' }, { status: 401 });
    }

    // Get optional date range parameters
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const userId = session.user.id;

    // Build date filter if provided
    let dateFilter = '';
    if (startDate && endDate) {
      dateFilter = `and created_at >= '${startDate}' and created_at <= '${endDate}'`;
    }

    // Get basic listing counts by status
    const { data: statusCounts, error: statusError } = await supabase
      .from('listings')
      .select('status')
      .eq('user_id', userId);

    if (statusError) {
      console.error('Status count error:', statusError);
      return NextResponse.json({ error: 'Failed to fetch status counts', details: statusError.message }, { status: 500 });
    }

    // Calculate status statistics
    const totalListings = statusCounts?.length || 0;
    const activeListings = statusCounts?.filter(l => l.status === 'active').length || 0;
    const soldListings = statusCounts?.filter(l => l.status === 'sold').length || 0;
    const draftListings = statusCounts?.filter(l => l.status === 'draft').length || 0;

    // Get pricing analytics
    const { data: pricingData, error: pricingError } = await supabase
      .from('listings')
      .select('price, sold_price, status, created_at, sold_at')
      .eq('user_id', userId);

    if (pricingError) {
      console.error('Pricing data error:', pricingError);
      return NextResponse.json({ error: 'Failed to fetch pricing data', details: pricingError.message }, { status: 500 });
    }

    // Calculate pricing statistics
    const activePrices = pricingData?.filter(l => l.status === 'active').map(l => l.price) || [];
    const soldPrices = pricingData?.filter(l => l.status === 'sold').map(l => l.sold_price || l.price) || [];

    const avgActivePrice = activePrices.length > 0 
      ? activePrices.reduce((sum, price) => sum + price, 0) / activePrices.length 
      : 0;

    const avgSoldPrice = soldPrices.length > 0 
      ? soldPrices.reduce((sum, price) => sum + price, 0) / soldPrices.length 
      : 0;

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentListings, error: recentError } = await supabase
      .from('listings')
      .select('created_at, status')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (recentError) {
      console.error('Recent listings error:', recentError);
      return NextResponse.json({ error: 'Failed to fetch recent activity', details: recentError.message }, { status: 500 });
    }

    const recentListingsCount = recentListings?.length || 0;
    const recentSoldCount = recentListings?.filter(l => l.status === 'sold').length || 0;

    // Calculate conversion rate
    const conversionRate = totalListings > 0 ? (soldListings / totalListings) * 100 : 0;

    // Get listing performance over time (last 6 months, grouped by month)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: monthlyData, error: monthlyError } = await supabase
      .from('listings')
      .select('created_at, sold_at, status')
      .eq('user_id', userId)
      .gte('created_at', sixMonthsAgo.toISOString())
      .order('created_at', { ascending: true });

    if (monthlyError) {
      console.error('Monthly data error:', monthlyError);
      return NextResponse.json({ error: 'Failed to fetch monthly data', details: monthlyError.message }, { status: 500 });
    }

    // Group by month
    const monthlyStats = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
      
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthListings = monthlyData?.filter(l => {
        const createdDate = new Date(l.created_at);
        return createdDate >= monthStart && createdDate <= monthEnd;
      }) || [];

      const monthSold = monthlyData?.filter(l => {
        if (!l.sold_at) return false;
        const soldDate = new Date(l.sold_at);
        return soldDate >= monthStart && soldDate <= monthEnd;
      }) || [];

      monthlyStats.push({
        month: monthKey,
        listed: monthListings.length,
        sold: monthSold.length
      });
    }

    // Calculate days to sell average for sold listings
    const daysToSellData = pricingData?.filter(l => l.status === 'sold' && l.sold_at) || [];
    const avgDaysToSell = daysToSellData.length > 0 
      ? daysToSellData.reduce((sum, listing) => {
          const created = new Date(listing.created_at);
          const sold = new Date(listing.sold_at);
          const days = Math.round((sold.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0) / daysToSellData.length
      : 0;

    const analytics = {
      overview: {
        totalListings,
        activeListings,
        soldListings,
        draftListings,
        conversionRate: Math.round(conversionRate * 100) / 100,
        avgDaysToSell: Math.round(avgDaysToSell)
      },
      pricing: {
        avgActivePrice: Math.round(avgActivePrice),
        avgSoldPrice: Math.round(avgSoldPrice),
        totalActiveValue: Math.round(activePrices.reduce((sum, price) => sum + price, 0)),
        totalSoldValue: Math.round(soldPrices.reduce((sum, price) => sum + price, 0))
      },
      recent: {
        newListingsLast30Days: recentListingsCount,
        soldLast30Days: recentSoldCount
      },
      monthly: monthlyStats
    };

    console.log(`Analytics generated for user ${userId}:`, analytics);

    return NextResponse.json({ analytics });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
} 