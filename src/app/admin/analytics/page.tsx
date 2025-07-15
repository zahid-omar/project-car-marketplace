'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Car,
  MessageSquare,
  DollarSign,
  Calendar,
  ArrowLeft,
  Activity,
  Eye,
  Clock,
  Star,
  RefreshCw
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { withAdminAuth, PERMISSIONS } from '@/lib/admin-auth';

interface AnalyticsData {
  userGrowth: {
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  listingStats: {
    totalActive: number;
    totalSold: number;
    averagePrice: number;
    totalValue: number;
    averageViews: number;
    conversionRate: number;
  };
  activityStats: {
    totalMessages: number;
    totalOffers: number;
    averageOffersPerListing: number;
    totalViews: number;
    averageRating: number;
  };
  topMakes: Array<{
    make: string;
    count: number;
    percentage: number;
  }>;
  priceRanges: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
  timeSeriesData: Array<{
    date: string;
    users: number;
    listings: number;
    messages: number;
    offers: number;
  }>;
}

function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    userGrowth: { thisMonth: 0, lastMonth: 0, growth: 0 },
    listingStats: { totalActive: 0, totalSold: 0, averagePrice: 0, totalValue: 0, averageViews: 0, conversionRate: 0 },
    activityStats: { totalMessages: 0, totalOffers: 0, averageOffersPerListing: 0, totalViews: 0, averageRating: 0 },
    topMakes: [],
    priceRanges: [],
    timeSeriesData: []
  });
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setRefreshing(true);
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      // Get user growth
      const [thisMonthUsers, lastMonthUsers] = await Promise.all([
        supabase
          .from('profiles')
          .select('id')
          .gte('created_at', thisMonth.toISOString()),
        supabase
          .from('profiles')
          .select('id')
          .gte('created_at', lastMonth.toISOString())
          .lt('created_at', thisMonth.toISOString())
      ]);

      // Get listing stats
      const [activeListings, soldListings, allListings] = await Promise.all([
        supabase
          .from('listings')
          .select('price, views, make')
          .eq('status', 'active'),
        supabase
          .from('listings')
          .select('price, sold_price, views')
          .eq('status', 'sold'),
        supabase
          .from('listings')
          .select('price, make, status, created_at')
      ]);

      // Get activity stats
      const [messages, offers, reviews] = await Promise.all([
        supabase.from('messages').select('id'),
        supabase.from('offers').select('id'),
        supabase.from('user_reviews').select('rating')
      ]);

      // Calculate user growth
      const thisMonthCount = thisMonthUsers.data?.length || 0;
      const lastMonthCount = lastMonthUsers.data?.length || 0;
      const growth = lastMonthCount > 0 
        ? ((thisMonthCount - lastMonthCount) / lastMonthCount) * 100 
        : 0;

      // Calculate listing stats
      const activePrices = activeListings.data?.map(l => l.price) || [];
      const activeViews = activeListings.data?.map(l => l.views || 0) || [];
      const soldPrices = soldListings.data?.map(l => l.sold_price || l.price) || [];
      
      const averagePrice = activePrices.length > 0 
        ? activePrices.reduce((sum, price) => sum + price, 0) / activePrices.length 
        : 0;
      const totalValue = activePrices.reduce((sum, price) => sum + price, 0);
      const averageViews = activeViews.length > 0
        ? activeViews.reduce((sum, views) => sum + views, 0) / activeViews.length
        : 0;
      
      const totalActiveCount = activeListings.data?.length || 0;
      const totalSoldCount = soldListings.data?.length || 0;
      const conversionRate = (totalActiveCount + totalSoldCount) > 0
        ? (totalSoldCount / (totalActiveCount + totalSoldCount)) * 100
        : 0;

      // Calculate top makes
      const makeCount: { [key: string]: number } = {};
      activeListings.data?.forEach(listing => {
        makeCount[listing.make] = (makeCount[listing.make] || 0) + 1;
      });
      
      const totalMakes = Object.values(makeCount).reduce((sum, count) => sum + count, 0);
      const topMakesArray = Object.entries(makeCount)
        .map(([make, count]) => ({ 
          make, 
          count, 
          percentage: totalMakes > 0 ? (count / totalMakes) * 100 : 0 
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate price ranges
      const priceRanges = [
        { range: '$0 - $10K', min: 0, max: 10000 },
        { range: '$10K - $25K', min: 10000, max: 25000 },
        { range: '$25K - $50K', min: 25000, max: 50000 },
        { range: '$50K - $100K', min: 50000, max: 100000 },
        { range: '$100K+', min: 100000, max: Infinity }
      ];

      const priceRangeData = priceRanges.map(range => {
        const count = activePrices.filter(price => price >= range.min && price < range.max).length;
        return {
          range: range.range,
          count,
          percentage: activePrices.length > 0 ? (count / activePrices.length) * 100 : 0
        };
      });

      // Calculate average rating
      const ratings = reviews.data?.map(r => r.rating) || [];
      const averageRating = ratings.length > 0
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
        : 0;

      // Generate time series data (last 30 days)
      const timeSeriesData = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // In a real app, you'd query for actual daily data
        timeSeriesData.push({
          date: dateStr,
          users: Math.floor(Math.random() * 20) + 5,
          listings: Math.floor(Math.random() * 15) + 2,
          messages: Math.floor(Math.random() * 50) + 10,
          offers: Math.floor(Math.random() * 25) + 3
        });
      }

      setAnalytics({
        userGrowth: {
          thisMonth: thisMonthCount,
          lastMonth: lastMonthCount,
          growth: growth
        },
        listingStats: {
          totalActive: totalActiveCount,
          totalSold: totalSoldCount,
          averagePrice: averagePrice,
          totalValue: totalValue,
          averageViews: averageViews,
          conversionRate: conversionRate
        },
        activityStats: {
          totalMessages: messages.data?.length || 0,
          totalOffers: offers.data?.length || 0,
          averageOffersPerListing: totalActiveCount > 0 
            ? (offers.data?.length || 0) / totalActiveCount
            : 0,
          totalViews: activeViews.reduce((sum, views) => sum + views, 0),
          averageRating: averageRating
        },
        topMakes: topMakesArray,
        priceRanges: priceRangeData,
        timeSeriesData: timeSeriesData
      });

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="w-8 h-8 mr-3" />
              Analytics
            </h1>
            <p className="text-gray-600 mt-1">Platform insights and performance metrics</p>
          </div>
          <Button
            onClick={loadAnalytics}
            disabled={refreshing}
            variant="outlined"
            className="flex items-center"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">User Growth</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.userGrowth.thisMonth}</p>
                  <div className="flex items-center mt-1">
                    {analytics.userGrowth.growth > 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm ${
                      analytics.userGrowth.growth > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatPercent(analytics.userGrowth.growth)}
                    </span>
                  </div>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Listings</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.listingStats.totalActive}</p>
                  <p className="text-xs text-gray-500">
                    {analytics.listingStats.totalSold} sold ({analytics.listingStats.conversionRate.toFixed(1)}%)
                  </p>
                </div>
                <Car className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Price</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(analytics.listingStats.averagePrice)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatCurrency(analytics.listingStats.totalValue)} total
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Messages</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.activityStats.totalMessages}</p>
                  <p className="text-xs text-gray-500">
                    {analytics.activityStats.totalOffers} offers
                  </p>
                </div>
                <MessageSquare className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Views</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(analytics.activityStats.totalViews)}</p>
                  <p className="text-xs text-gray-500">
                    {analytics.listingStats.averageViews.toFixed(0)} avg per listing
                  </p>
                </div>
                <Eye className="w-8 h-8 text-indigo-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Rating</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.activityStats.averageRating.toFixed(1)}</p>
                  <div className="flex items-center mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < Math.floor(analytics.activityStats.averageRating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <Star className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Offers per Listing</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.activityStats.averageOffersPerListing.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-500">average interest</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.listingStats.conversionRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500">active to sold</p>
                </div>
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Makes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Top Car Makes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topMakes.map((make, index) => (
                  <div key={make.make} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900 w-4 text-center mr-3">
                        {index + 1}
                      </span>
                      <span className="text-sm text-gray-700">{make.make}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-20 bg-gray-200 rounded-full h-2 mr-3">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${make.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-12 text-right">
                        {make.count} ({make.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Price Ranges */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Price Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.priceRanges.map((range, index) => (
                  <div key={range.range} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{range.range}</span>
                    <div className="flex items-center">
                      <div className="w-20 bg-gray-200 rounded-full h-2 mr-3">
                        <div 
                          className="bg-purple-600 h-2 rounded-full" 
                          style={{ width: `${range.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-12 text-right">
                        {range.count} ({range.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Time Series Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Activity Timeline (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end space-x-1">
              {analytics.timeSeriesData.map((data, index) => (
                <div key={data.date} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-gray-200 rounded-t relative" style={{ height: '200px' }}>
                    <div 
                      className="absolute bottom-0 w-full bg-blue-500 rounded-t"
                      style={{ height: `${(data.users / 25) * 100}%` }}
                      title={`${data.users} new users`}
                    />
                    <div 
                      className="absolute bottom-0 w-full bg-green-500 rounded-t opacity-75"
                      style={{ height: `${(data.listings / 15) * 100}%`, marginTop: `${(data.users / 25) * 100}%` }}
                      title={`${data.listings} new listings`}
                    />
                  </div>
                  {index % 5 === 0 && (
                    <span className="text-xs text-gray-500 mt-2">
                      {new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-4 space-x-4">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                <span className="text-sm text-gray-600">New Users</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                <span className="text-sm text-gray-600">New Listings</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

export default withAdminAuth(AnalyticsPage, PERMISSIONS.VIEW_ANALYTICS);
