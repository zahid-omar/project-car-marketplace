'use client';

import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import LoadingSpinner from './LoadingSpinner';

interface OfferAnalytics {
  total_offers: number;
  success_rate: number;
  average_negotiation_time: number;
  offer_status_breakdown: {
    pending: number;
    accepted: number;
    rejected: number;
    expired: number;
    countered: number;
    withdrawn: number;
  };
  counter_offer_rate: number;
  monthly_activity: Array<{
    month: string;
    total: number;
    accepted: number;
    rejected: number;
    pending: number;
    expired: number;
    countered: number;
  }>;
  offer_value_ranges: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
}

interface OfferHistory {
  id: string;
  action_type: string;
  created_at: string;
  action_details: any;
  offer: {
    id: string;
    offer_amount: number;
    status: string;
  };
}

interface TopListing {
  listing: {
    id: string;
    title: string;
    make: string;
    model: string;
    year: number;
    price: number;
    listing_images: Array<{ image_url: string; is_primary: boolean }>;
  };
  total_offers: number;
  highest_offer: number;
  average_offer: number;
  accepted_offers: number;
  success_rate: number;
}

interface AnalyticsData {
  analytics: OfferAnalytics;
  recent_activity: OfferHistory[];
  top_listings: TopListing[];
  timeframe: number;
  total_offers: number;
}

interface OfferAnalyticsProps {
  userType?: 'buyer' | 'seller' | 'both';
  className?: string;
}

export default function OfferAnalytics({ userType = 'both', className }: OfferAnalyticsProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState('30');
  const [viewType, setViewType] = useState<'buyer' | 'seller' | 'both'>('both');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        timeframe,
        ...(viewType !== 'both' && { type: viewType })
      });

      const response = await fetch(`/api/offers/analytics?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch analytics');
      }

      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe, viewType]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatTime = (hours: number) => {
    if (hours < 24) {
      return `${Math.round(hours)}h`;
    } else {
      const days = Math.round(hours / 24);
      return `${days}d`;
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-md-sys-tertiary-container text-md-sys-on-tertiary-container border-md-sys-tertiary',
      accepted: 'bg-md-sys-primary-container text-md-sys-on-primary-container border-md-sys-primary',
      rejected: 'bg-md-sys-error-container text-md-sys-on-error-container border-md-sys-error',
      expired: 'bg-md-sys-surface-variant text-md-sys-on-surface-variant border-md-sys-outline',
      countered: 'bg-md-sys-secondary-container text-md-sys-on-secondary-container border-md-sys-secondary',
      withdrawn: 'bg-md-sys-tertiary-container/50 text-md-sys-on-tertiary-container border-md-sys-tertiary'
    };
    return colors[status as keyof typeof colors] || 'bg-md-sys-surface-variant text-md-sys-on-surface-variant border-md-sys-outline';
  };

  if (loading) {
    return (
      <div className={`bg-md-sys-surface-container rounded-3xl shadow-md-elevation-1 border border-md-sys-outline-variant/50 ${className}`}>
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-md-sys-surface-container rounded-3xl shadow-md-elevation-1 border border-md-sys-outline-variant/50 p-8 text-center ${className}`}>
        <p className="text-md-sys-error mb-4 text-md-body-large">{error}</p>
        <Button 
          onClick={fetchAnalytics} 
          className="bg-md-sys-primary hover:bg-md-sys-primary/90 text-md-sys-on-primary shadow-md-elevation-1 hover:shadow-md-elevation-2 transition-all duration-200 px-6 py-3 rounded-full font-medium"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { analytics, recent_activity, top_listings } = data;

  return (
    <div className={`bg-md-sys-surface-container rounded-3xl shadow-md-elevation-1 border border-md-sys-outline-variant/50 ${className}`}>
      {/* Header and Filters */}
      <div className="px-6 py-4 border-b border-md-sys-outline-variant">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-md-headline-small font-semibold text-md-sys-on-surface">Offer Analytics</h2>
            <p className="text-md-body-medium text-md-sys-on-surface-variant mt-1">Track your offer performance and insights</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-4 py-2 bg-md-sys-surface border border-md-sys-outline rounded-full text-md-sys-on-surface text-md-body-small font-medium hover:bg-md-sys-surface-variant transition-colors focus:outline-none focus:ring-2 focus:ring-md-sys-primary focus:border-transparent"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
            
            <select
              value={viewType}
              onChange={(e) => setViewType(e.target.value as 'buyer' | 'seller' | 'both')}
              className="px-4 py-2 bg-md-sys-surface border border-md-sys-outline rounded-full text-md-sys-on-surface text-md-body-small font-medium hover:bg-md-sys-surface-variant transition-colors focus:outline-none focus:ring-2 focus:ring-md-sys-primary focus:border-transparent"
            >
              <option value="both">All Activity</option>
              <option value="buyer">As Buyer</option>
              <option value="seller">As Seller</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-md-sys-primary-container rounded-2xl shadow-md-elevation-1 border border-md-sys-outline-variant/50 p-6">
            <div className="text-center">
              <p className="text-md-display-small font-bold text-md-sys-on-primary-container mb-2">{analytics.total_offers}</p>
              <p className="text-md-body-medium text-md-sys-on-primary-container/80 font-medium">Total Offers</p>
            </div>
          </div>

          <div className="bg-md-sys-tertiary-container rounded-2xl shadow-md-elevation-1 border border-md-sys-outline-variant/50 p-6">
            <div className="text-center">
              <p className="text-md-display-small font-bold text-md-sys-on-tertiary-container mb-2">{analytics.success_rate}%</p>
              <p className="text-md-body-medium text-md-sys-on-tertiary-container/80 font-medium">Success Rate</p>
            </div>
          </div>

          <div className="bg-md-sys-secondary-container rounded-2xl shadow-md-elevation-1 border border-md-sys-outline-variant/50 p-6">
            <div className="text-center">
              <p className="text-md-display-small font-bold text-md-sys-on-secondary-container mb-2">{analytics.counter_offer_rate}%</p>
              <p className="text-md-body-medium text-md-sys-on-secondary-container/80 font-medium">Counter-Offer Rate</p>
            </div>
          </div>

          <div className="bg-md-sys-primary-container/70 rounded-2xl shadow-md-elevation-1 border border-md-sys-outline-variant/50 p-6">
            <div className="text-center">
              <p className="text-md-display-small font-bold text-md-sys-on-primary-container mb-2">
                {formatTime(analytics.average_negotiation_time)}
              </p>
              <p className="text-md-body-medium text-md-sys-on-primary-container/80 font-medium">Avg. Negotiation Time</p>
            </div>
          </div>
        </div>

        {/* Status Breakdown and Value Ranges */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Breakdown */}
          <div className="bg-md-sys-surface rounded-2xl shadow-md-elevation-1 border border-md-sys-outline-variant/50 p-6">
            <h3 className="text-md-title-medium font-semibold text-md-sys-on-surface mb-4">Status Breakdown</h3>
            <div className="space-y-3">
              {Object.entries(analytics.offer_status_breakdown).map(([status, count]) => {
                const percentage = analytics.total_offers > 0 
                  ? ((count / analytics.total_offers) * 100).toFixed(1)
                  : '0';
                
                return (
                  <div key={status} className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-3 flex-1">
                      <span className={`px-3 py-1.5 rounded-full text-md-label-medium font-medium border min-w-[90px] text-center ${getStatusColor(status)}`}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                      <div className="bg-md-sys-primary-container/30 rounded-xl px-3 py-1 min-w-[60px] text-center">
                        <span className="text-md-body-medium font-semibold text-md-sys-on-primary-container">{count}</span>
                      </div>
                    </div>
                    <div className="bg-md-sys-secondary-container rounded-xl px-3 py-1 min-w-[70px] text-center">
                      <span className="text-md-body-medium font-bold text-md-sys-on-secondary-container">{percentage}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Value Ranges */}
          <div className="bg-md-sys-surface rounded-2xl shadow-md-elevation-1 border border-md-sys-outline-variant/50 p-6">
            <h3 className="text-md-title-medium font-semibold text-md-sys-on-surface mb-4">Offer Value Distribution</h3>
            <div className="space-y-3">
              {analytics.offer_value_ranges.map((range) => (
                <div key={range.range} className="flex items-center justify-between py-2">
                  <span className="text-md-body-medium text-md-sys-on-surface font-medium flex-1">{range.range}</span>
                  <div className="flex items-center space-x-3">
                    <div className="bg-md-sys-tertiary-container/50 rounded-xl px-3 py-1 min-w-[60px] text-center">
                      <span className="text-md-body-medium font-semibold text-md-sys-on-tertiary-container">{range.count}</span>
                    </div>
                    <div className="bg-md-sys-secondary-container rounded-xl px-3 py-1 min-w-[70px] text-center">
                      <span className="text-md-body-medium font-bold text-md-sys-on-secondary-container">{range.percentage}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monthly Activity Chart */}
        {analytics.monthly_activity.length > 0 && (
          <div className="bg-md-sys-surface rounded-2xl shadow-md-elevation-1 border border-md-sys-outline-variant/50 p-6">
            <h3 className="text-md-title-medium font-semibold text-md-sys-on-surface mb-4">Monthly Activity</h3>
            <div className="space-y-4">
              {analytics.monthly_activity.map((month) => (
                <div key={month.month} className="bg-md-sys-surface-container rounded-xl p-4 border border-md-sys-outline-variant/30">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-md-title-small font-semibold text-md-sys-on-surface">
                      {new Date(month.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    <div className="bg-md-sys-primary-container rounded-xl px-3 py-1">
                      <span className="text-md-body-medium font-bold text-md-sys-on-primary-container">{month.total} offers</span>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="flex space-x-1 h-3 rounded-full overflow-hidden bg-md-sys-surface-variant">
                    {(['accepted', 'pending', 'rejected', 'countered', 'expired'] as const).map((status) => {
                      const count = month[status];
                      const width = month.total > 0 ? (count / month.total) * 100 : 0;
                      if (width === 0) return null;
                      
                      return (
                        <div
                          key={status}
                          className={`h-full ${getStatusColor(status).split(' ')[0]}`}
                          style={{ width: `${width}%` }}
                          title={`${status}: ${count}`}
                        />
                      );
                    })}
                  </div>
                  
                  {/* Legend */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {(['accepted', 'pending', 'rejected', 'countered', 'expired'] as const).map((status) => {
                      const count = month[status];
                      if (count === 0) return null;
                      
                      return (
                        <div key={status} className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(status).split(' ')[0]}`}></div>
                          <span className="text-md-body-small text-md-sys-on-surface-variant">
                            {status} ({count})
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Listings (for sellers) */}
        {top_listings.length > 0 && (
          <div className="bg-md-sys-surface rounded-2xl shadow-md-elevation-1 border border-md-sys-outline-variant/50 p-6">
            <h3 className="text-md-title-medium font-semibold text-md-sys-on-surface mb-4">Top Performing Listings</h3>
            <div className="space-y-4">
              {top_listings.slice(0, 5).map((listing) => {
                const primaryImage = listing.listing.listing_images?.find(img => img.is_primary)?.image_url ||
                                     listing.listing.listing_images?.[0]?.image_url;

                return (
                  <div key={listing.listing.id} className="bg-md-sys-surface-container rounded-xl shadow-sm border border-md-sys-outline-variant/30 p-4 hover:shadow-md-elevation-1 transition-all duration-200">
                    <div className="flex items-center space-x-4">
                      {primaryImage && (
                        <div className="relative">
                          <img
                            src={primaryImage}
                            alt={listing.listing.title}
                            className="w-20 h-20 object-cover rounded-xl border border-md-sys-outline-variant/50"
                          />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <h4 className="text-md-title-small font-semibold text-md-sys-on-surface mb-2">
                          {listing.listing.year} {listing.listing.make} {listing.listing.model}
                        </h4>
                        <div className="bg-md-sys-secondary-container rounded-xl px-3 py-1 inline-block">
                          <span className="text-md-body-small font-medium text-md-sys-on-secondary-container">
                            List Price: {formatCurrency(listing.listing.price)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-right space-y-2">
                        <div className="bg-md-sys-primary-container rounded-xl px-3 py-1">
                          <span className="text-md-body-medium font-bold text-md-sys-on-primary-container">
                            {listing.total_offers} offers
                          </span>
                        </div>
                        <div className="bg-md-sys-tertiary-container rounded-xl px-3 py-1">
                          <span className="text-md-body-small font-semibold text-md-sys-on-tertiary-container">
                            Top: {formatCurrency(listing.highest_offer)}
                          </span>
                        </div>
                        <div className="bg-md-sys-primary-container/70 rounded-xl px-3 py-1">
                          <span className="text-md-body-small font-bold text-md-sys-on-primary-container">
                            {listing.success_rate.toFixed(1)}% success
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {recent_activity.length > 0 && (
          <div className="bg-md-sys-surface rounded-2xl shadow-md-elevation-1 border border-md-sys-outline-variant/50 p-6">
            <h3 className="text-md-title-medium font-semibold text-md-sys-on-surface mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {recent_activity.slice(0, 10).map((activity) => (
                <div key={activity.id} className="bg-md-sys-surface-container rounded-xl p-4 border border-md-sys-outline-variant/30 hover:shadow-sm transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className={`px-3 py-1.5 rounded-full text-md-label-medium font-medium border ${getStatusColor(activity.action_type)}`}>
                        {activity.action_type}
                      </span>
                      <div className="bg-md-sys-primary-container rounded-xl px-3 py-1">
                        <span className="text-md-body-medium font-bold text-md-sys-on-primary-container">
                          {formatCurrency(activity.offer.offer_amount)}
                        </span>
                      </div>
                    </div>
                    <div className="bg-md-sys-surface-variant rounded-xl px-3 py-1">
                      <span className="text-md-body-small text-md-sys-on-surface-variant font-medium">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Data State */}
        {analytics.total_offers === 0 && (
          <div className="bg-md-sys-surface rounded-2xl shadow-md-elevation-1 border border-md-sys-outline-variant/50 p-12 text-center">
            <div className="bg-md-sys-surface-variant rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-md-sys-on-surface-variant text-2xl">📊</span>
            </div>
            <h3 className="text-md-title-medium font-semibold text-md-sys-on-surface mb-2">No Analytics Data</h3>
            <p className="text-md-body-medium text-md-sys-on-surface-variant mb-1">No offer data available for the selected timeframe.</p>
            <p className="text-md-body-small text-md-sys-on-surface-variant">
              Once you start making or receiving offers, analytics will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 