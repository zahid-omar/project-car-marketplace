import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7'; // days
    const groupBy = searchParams.get('groupBy') || 'day';
    
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get analytics data
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(period));

    // Get listing view counts grouped by time period
    const { data: viewData, error: viewError } = await supabase
      .from('listing_views')
      .select(`
        created_at,
        listing_id,
        listings!inner(
          make,
          model,
          year,
          price
        )
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (viewError) {
      console.error('View data error:', viewError);
      return NextResponse.json({ error: getErrorMessage(viewError) }, { status: 500 });
    }

    // Get favorite counts
    const { data: favoriteData, error: favoriteError } = await supabase
      .from('favorites')
      .select(`
        created_at,
        listing_id,
        listings!inner(
          make,
          model,
          year,
          price
        )
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (favoriteError) {
      console.error('Favorite data error:', favoriteError);
      return NextResponse.json({ error: getErrorMessage(favoriteError) }, { status: 500 });
    }

    // Process and group data
    const viewsByPeriod = groupByTimePeriod(viewData || [], groupBy);
    const favoritesByPeriod = groupByTimePeriod(favoriteData || [], groupBy);
    
    // Get popular makes/models
    const makeStats = getTopItems(viewData || [], 'listings.make', 10);
    const modelStats = getTopItems(viewData || [], 'listings.model', 10);
    
    // Calculate average metrics
    const totalViews = viewData?.length || 0;
    const totalFavorites = favoriteData?.length || 0;
    const periodDays = parseInt(period);
    
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalViews,
          totalFavorites,
          avgViewsPerDay: totalViews / periodDays,
          avgFavoritesPerDay: totalFavorites / periodDays,
          conversionRate: totalViews > 0 ? (totalFavorites / totalViews) * 100 : 0
        },
        timeSeries: {
          views: viewsByPeriod,
          favorites: favoritesByPeriod
        },
        popular: {
          makes: makeStats,
          models: modelStats
        },
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          days: periodDays,
          groupBy
        }
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({
      error: 'Failed to fetch analytics data',
      details: getErrorMessage(error)
    }, { status: 500 });
  }
}

function groupByTimePeriod(data: any[], groupBy: string) {
  const groups: { [key: string]: number } = {};
  
  data.forEach(item => {
    const date = new Date(item.created_at);
    let key: string;
    
    switch (groupBy) {
      case 'hour':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
        break;
      case 'day':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = `${weekStart.getFullYear()}-W${Math.ceil((weekStart.getTime() - new Date(weekStart.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))}`;
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      default:
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
    
    groups[key] = (groups[key] || 0) + 1;
  });
  
  return Object.entries(groups)
    .map(([period, count]) => ({ period, count }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

function getTopItems(data: any[], field: string, limit: number) {
  const counts: { [key: string]: number } = {};
  
  data.forEach(item => {
    const value = getNestedValue(item, field);
    if (value) {
      counts[value] = (counts[value] || 0) + 1;
    }
  });
  
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function getNestedValue(obj: any, path: string) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
} 