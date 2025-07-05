import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies, headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Types for analytics data
interface SearchAnalyticsRecord {
  session_id: string;
  user_id?: string;
  search_query: string;
  filters_used: Record<string, any>;
  results_count: number;
  response_time_ms: number;
  page_number: number;
  sort_by: string;
  was_cached: boolean;
  search_result_ids: string[];
}

interface SearchClickRecord {
  analytics_id: string;
  clicked_listing_id: string;
  clicked_position: number;
}

interface SearchErrorRecord {
  error_type: string;
  error_message: string;
  error_details: Record<string, any>;
  search_query?: string;
  filters_used?: Record<string, any>;
  user_id?: string;
  session_id: string;
  stack_trace?: string;
  request_id?: string;
  severity?: 'info' | 'warning' | 'error' | 'critical';
}

// Helper function to get client information
function getClientInfo() {
  const headersList = headers();
  const userAgent = headersList.get('user-agent') || '';
  const forwardedFor = headersList.get('x-forwarded-for');
  const realIp = headersList.get('x-real-ip');
  
  // Extract IP address (preferring x-real-ip, then first IP from x-forwarded-for)
  let ipAddress = realIp || (forwardedFor?.split(',')[0]?.trim()) || '127.0.0.1';
  
  return { userAgent, ipAddress };
}

// POST: Record search analytics
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();
    
    const { action } = body;
    
    if (action === 'record_search') {
      return await recordSearchAnalytics(supabase, body);
    } else if (action === 'record_click') {
      return await recordSearchClick(supabase, body);
    } else if (action === 'record_error') {
      return await recordSearchError(supabase, body);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Search analytics API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET: Retrieve search analytics data
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    
    const type = searchParams.get('type') || 'summary';
    const timeframe = searchParams.get('timeframe') || '24h';
    const limit = parseInt(searchParams.get('limit') || '100');

    switch (type) {
      case 'summary':
        return await getSearchSummary(supabase, timeframe);
      case 'popular_terms':
        return await getPopularSearchTerms(supabase, limit);
      case 'filter_usage':
        return await getFilterUsageStats(supabase);
      case 'realtime_metrics':
        return await getRealtimeMetrics(supabase);
      case 'error_summary':
        return await getErrorSummary(supabase, timeframe);
      case 'performance_trends':
        return await getPerformanceTrends(supabase, timeframe);
      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }

  } catch (error) {
    console.error('Search analytics retrieval error:', error);
    return NextResponse.json({
      error: 'Failed to retrieve analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Record search analytics
async function recordSearchAnalytics(supabase: any, data: SearchAnalyticsRecord & { action: string }) {
  const { userAgent, ipAddress } = getClientInfo();
  
  // Get current user if authenticated
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id || null;

  const { data: result, error } = await supabase.rpc('record_search_analytics', {
    p_session_id: data.session_id,
    p_user_id: userId,
    p_search_query: data.search_query || '',
    p_filters_used: data.filters_used || {},
    p_results_count: data.results_count || 0,
    p_response_time_ms: data.response_time_ms || 0,
    p_page_number: data.page_number || 1,
    p_sort_by: data.sort_by || 'created_at',
    p_was_cached: data.was_cached || false,
    p_user_agent: userAgent,
    p_ip_address: ipAddress,
    p_search_result_ids: data.search_result_ids || []
  });

  if (error) {
    console.error('Error recording search analytics:', error);
    return NextResponse.json({ error: 'Failed to record analytics' }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true, 
    analytics_id: result,
    message: 'Search analytics recorded successfully' 
  });
}

// Record search click
async function recordSearchClick(supabase: any, data: SearchClickRecord & { action: string }) {
  const { data: result, error } = await supabase.rpc('record_search_click', {
    p_analytics_id: data.analytics_id,
    p_clicked_listing_id: data.clicked_listing_id,
    p_clicked_position: data.clicked_position
  });

  if (error) {
    console.error('Error recording search click:', error);
    return NextResponse.json({ error: 'Failed to record click' }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true, 
    message: 'Search click recorded successfully' 
  });
}

// Record search error
async function recordSearchError(supabase: any, data: SearchErrorRecord & { action: string }) {
  const { userAgent, ipAddress } = getClientInfo();
  
  // Get current user if authenticated
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id || null;

  const { data: result, error } = await supabase.rpc('record_search_error', {
    p_error_type: data.error_type,
    p_error_message: data.error_message,
    p_error_details: data.error_details || {},
    p_search_query: data.search_query || null,
    p_filters_used: data.filters_used || {},
    p_user_id: userId,
    p_session_id: data.session_id,
    p_stack_trace: data.stack_trace || null,
    p_request_id: data.request_id || null,
    p_user_agent: userAgent,
    p_ip_address: ipAddress,
    p_severity: data.severity || 'error'
  });

  if (error) {
    console.error('Error recording search error:', error);
    return NextResponse.json({ error: 'Failed to record error' }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true, 
    error_id: result,
    message: 'Search error recorded successfully' 
  });
}

// Get search summary analytics
async function getSearchSummary(supabase: any, timeframe: string) {
  let timeFilter = '';
  
  switch (timeframe) {
    case '1h':
      timeFilter = "WHERE time_bucket >= NOW() - INTERVAL '1 hour'";
      break;
    case '24h':
      timeFilter = "WHERE time_bucket >= NOW() - INTERVAL '24 hours'";
      break;
    case '7d':
      timeFilter = "WHERE time_bucket >= NOW() - INTERVAL '7 days'";
      break;
    case '30d':
      timeFilter = "WHERE time_bucket >= NOW() - INTERVAL '30 days'";
      break;
    default:
      timeFilter = "WHERE time_bucket >= NOW() - INTERVAL '24 hours'";
  }

  const { data, error } = await supabase
    .from('search_analytics_summary')
    .select('*')
    .filter('time_bucket', 'gte', getTimeFilterDate(timeframe))
    .order('time_bucket', { ascending: false })
    .limit(50);

  if (error) {
    throw error;
  }

  return NextResponse.json({ data });
}

// Get popular search terms
async function getPopularSearchTerms(supabase: any, limit: number) {
  const { data, error } = await supabase
    .from('popular_search_terms')
    .select('*')
    .limit(limit);

  if (error) {
    throw error;
  }

  return NextResponse.json({ data });
}

// Get filter usage statistics
async function getFilterUsageStats(supabase: any) {
  const { data, error } = await supabase
    .from('filter_usage_stats')
    .select('*')
    .limit(50);

  if (error) {
    throw error;
  }

  return NextResponse.json({ data });
}

// Get real-time metrics
async function getRealtimeMetrics(supabase: any) {
  const { data, error } = await supabase.rpc('get_realtime_search_metrics');

  if (error) {
    throw error;
  }

  return NextResponse.json({ data: data[0] || {} });
}

// Get error summary
async function getErrorSummary(supabase: any, timeframe: string) {
  const { data, error } = await supabase
    .from('search_error_summary')
    .select('*')
    .filter('time_bucket', 'gte', getTimeFilterDate(timeframe))
    .order('time_bucket', { ascending: false })
    .limit(50);

  if (error) {
    throw error;
  }

  return NextResponse.json({ data });
}

// Get performance trends
async function getPerformanceTrends(supabase: any, timeframe: string) {
  const { data, error } = await supabase
    .from('search_analytics')
    .select('created_at, response_time_ms, results_count, was_cached')
    .filter('created_at', 'gte', getTimeFilterDate(timeframe))
    .order('created_at', { ascending: false })
    .limit(1000);

  if (error) {
    throw error;
  }

  // Process data for trends
  const trends = {
    response_times: data?.map(d => ({
      timestamp: d.created_at,
      value: d.response_time_ms
    })) || [],
    cache_rates: data?.map(d => ({
      timestamp: d.created_at,
      cached: d.was_cached,
      results: d.results_count
    })) || []
  };

  return NextResponse.json({ data: trends });
}

// Helper function to get date filter based on timeframe
function getTimeFilterDate(timeframe: string): string {
  const now = new Date();
  
  switch (timeframe) {
    case '1h':
      return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    default:
      return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  }
} 