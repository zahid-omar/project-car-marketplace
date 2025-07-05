'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface RealtimeMetrics {
  current_searches_per_minute: number;
  avg_response_time_last_hour: number;
  cache_hit_rate_last_hour: number;
  error_rate_last_hour: number;
  active_users_last_hour: number;
}

interface SearchSummary {
  time_bucket: string;
  total_searches: number;
  unique_users: number;
  unique_sessions: number;
  avg_response_time: number;
  avg_results_count: number;
  total_clicks: number;
  click_through_rate: number;
  cached_searches: number;
  cache_hit_rate: number;
}

interface PopularTerm {
  search_query: string;
  search_count: number;
  unique_users: number;
  avg_response_time: number;
  avg_results: number;
  total_clicks: number;
  click_through_rate: number;
}

interface FilterUsageStat {
  filter_type: string;
  filter_category: string;
  usage_count: number;
  searches_with_filter: number;
  avg_response_time: number;
  avg_results_count: number;
}

interface ErrorSummary {
  time_bucket: string;
  error_type: string;
  severity: string;
  error_count: number;
  affected_users: number;
  resolved_count: number;
  resolution_rate: number;
}

export default function SearchAnalyticsDashboard() {
  const [timeframe, setTimeframe] = useState('24h');
  const [activeTab, setActiveTab] = useState('overview');
  
  // State for different analytics data
  const [realtimeMetrics, setRealtimeMetrics] = useState<RealtimeMetrics | null>(null);
  const [searchSummary, setSearchSummary] = useState<SearchSummary[]>([]);
  const [popularTerms, setPopularTerms] = useState<PopularTerm[]>([]);
  const [filterUsage, setFilterUsage] = useState<FilterUsageStat[]>([]);
  const [errorSummary, setErrorSummary] = useState<ErrorSummary[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClientComponentClient();

  // Fetch analytics data
  const fetchAnalyticsData = async (type: string, additionalParams: Record<string, string> = {}) => {
    try {
      const params = new URLSearchParams({
        type,
        timeframe,
        ...additionalParams
      });

      const response = await fetch(`/api/analytics/search?${params}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ${type} data`);
      }

      const result = await response.json();
      return result.data;
    } catch (err) {
      console.error(`Error fetching ${type}:`, err);
      throw err;
    }
  };

  // Load all analytics data
  const loadAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [
        realtimeData,
        summaryData,
        popularData,
        filterData,
        errorData
      ] = await Promise.all([
        fetchAnalyticsData('realtime_metrics'),
        fetchAnalyticsData('summary'),
        fetchAnalyticsData('popular_terms', { limit: '20' }),
        fetchAnalyticsData('filter_usage'),
        fetchAnalyticsData('error_summary')
      ]);

      setRealtimeMetrics(realtimeData);
      setSearchSummary(summaryData || []);
      setPopularTerms(popularData || []);
      setFilterUsage(filterData || []);
      setErrorSummary(errorData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh realtime metrics
  useEffect(() => {
    loadAllData();
    
    // Refresh realtime metrics every 30 seconds
    const interval = setInterval(async () => {
      try {
        const realtimeData = await fetchAnalyticsData('realtime_metrics');
        setRealtimeMetrics(realtimeData);
      } catch (err) {
        console.warn('Failed to refresh realtime metrics:', err);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [timeframe]);

  // Format numbers for display
  const formatNumber = (num: number, decimals = 0) => {
    if (num === null || num === undefined) return '0';
    return new Intl.NumberFormat('en-US', { 
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals 
    }).format(num);
  };

  const formatPercentage = (num: number) => {
    if (num === null || num === undefined) return '0%';
    return `${formatNumber(num, 1)}%`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <h3 className="text-red-800 font-medium">Error Loading Analytics</h3>
        <p className="text-red-700 mt-1">{error}</p>
        <button 
          onClick={loadAllData}
          className="mt-2 text-red-800 underline hover:text-red-900"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Search Analytics Dashboard</h2>
        <div className="flex items-center space-x-4">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <button
            onClick={loadAllData}
            className="bg-blue-600 text-white px-4 py-1 rounded-md text-sm hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Real-time Metrics Cards */}
      {realtimeMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm font-medium text-gray-600">Searches/Min</div>
            <div className="text-2xl font-bold text-blue-600">
              {formatNumber(realtimeMetrics.current_searches_per_minute)}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm font-medium text-gray-600">Avg Response Time</div>
            <div className="text-2xl font-bold text-green-600">
              {formatNumber(realtimeMetrics.avg_response_time_last_hour)}ms
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm font-medium text-gray-600">Cache Hit Rate</div>
            <div className="text-2xl font-bold text-purple-600">
              {formatPercentage(realtimeMetrics.cache_hit_rate_last_hour)}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm font-medium text-gray-600">Error Rate</div>
            <div className="text-2xl font-bold text-red-600">
              {formatPercentage(realtimeMetrics.error_rate_last_hour)}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm font-medium text-gray-600">Active Users</div>
            <div className="text-2xl font-bold text-orange-600">
              {formatNumber(realtimeMetrics.active_users_last_hour)}
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'terms', label: 'Popular Terms' },
            { id: 'filters', label: 'Filter Usage' },
            { id: 'errors', label: 'Errors' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow">
        {activeTab === 'overview' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Search Summary</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Searches</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Response</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CTR</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cache Hit</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {searchSummary.slice(0, 10).map((row, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(row.time_bucket).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(row.total_searches)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(row.unique_users)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(row.avg_response_time)}ms
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPercentage(row.click_through_rate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPercentage(row.cache_hit_rate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'terms' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Popular Search Terms</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Search Term</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Response</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CTR</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {popularTerms.map((term, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {term.search_query || '(empty)'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(term.search_count)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(term.unique_users)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(term.avg_response_time)}ms
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPercentage(term.click_through_rate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'filters' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Filter Usage Statistics</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Filter Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage Count</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Searches</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Response</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filterUsage.map((filter, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {filter.filter_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {filter.filter_category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(filter.usage_count)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(filter.searches_with_filter)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(filter.avg_response_time, 1)}ms
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'errors' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Error Summary</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Affected Users</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resolution Rate</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {errorSummary.map((error, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(error.time_bucket).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {error.error_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          error.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          error.severity === 'error' ? 'bg-orange-100 text-orange-800' :
                          error.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {error.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(error.error_count)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(error.affected_users)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPercentage(error.resolution_rate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}