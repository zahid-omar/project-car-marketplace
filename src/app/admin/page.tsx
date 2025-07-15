'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Users, 
  Car, 
  MessageSquare, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Shield,
  Mail,
  FileText,
  Settings,
  HeadphonesIcon,
  Activity,
  DollarSign,
  Calendar,
  Eye,
  Star
} from 'lucide-react';
import SimpleAdminLayout from '@/components/SimpleAdminLayout';

interface DashboardStats {
  totalUsers: number;
  activeListings: number;
  totalListings: number;
  pendingReports: number;
  totalMessages: number;
  unreadMessages: number;
  totalOffers: number;
  pendingOffers: number;
  totalTickets: number;
  openTickets: number;
  urgentTickets: number;
}

interface RecentActivity {
  id: string;
  type: 'user_registered' | 'listing_created' | 'offer_made' | 'message_sent' | 'report_submitted' | 'ticket_created';
  title: string;
  description: string;
  timestamp: string;
  userId?: string;
  userName?: string;
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeListings: 0,
    totalListings: 0,
    pendingReports: 0,
    totalMessages: 0,
    unreadMessages: 0,
    totalOffers: 0,
    pendingOffers: 0,
    totalTickets: 0,
    openTickets: 0,
    urgentTickets: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const initializeAdmin = async () => {
      if (authLoading) return;
      
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        // Get profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Profile error:', profileError);
          router.push('/');
          return;
        }

        if (!profileData.is_admin && !profileData.is_moderator) {
          router.push('/');
          return;
        }

        setProfile(profileData);
        loadDashboardData();
        
      } catch (err) {
        console.error('Admin initialization error:', err);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    initializeAdmin();
  }, [user, authLoading, router]);

  const loadDashboardData = async () => {
    try {
      const [
        usersResult,
        listingsResult,
        reportsResult,
        messagesResult,
        offersResult,
        ticketsResult
      ] = await Promise.all([
        supabase.from('profiles').select('id, created_at').order('created_at', { ascending: false }),
        supabase.from('listings').select('id, status, created_at').order('created_at', { ascending: false }),
        supabase.from('review_reports').select('id, status'),
        supabase.from('messages').select('id, is_read, created_at'),
        supabase.from('offers').select('id, status, created_at'),
        supabase.from('support_tickets').select('id, status, priority, created_at')
      ]);

      const users = usersResult.data || [];
      const listings = listingsResult.data || [];
      const reports = reportsResult.data || [];
      const messages = messagesResult.data || [];
      const offers = offersResult.data || [];
      const tickets = ticketsResult.data || [];

      setStats({
        totalUsers: users.length,
        activeListings: listings.filter(l => l.status === 'active').length,
        totalListings: listings.length,
        pendingReports: reports.filter(r => r.status === 'pending').length,
        totalMessages: messages.length,
        unreadMessages: messages.filter(m => !m.is_read).length,
        totalOffers: offers.length,
        pendingOffers: offers.filter(o => o.status === 'pending').length,
        totalTickets: tickets.length,
        openTickets: tickets.filter(t => t.status === 'open').length,
        urgentTickets: tickets.filter(t => t.priority === 'urgent').length,
      });

      // Generate sample recent activity
      setRecentActivity([
        {
          id: '1',
          type: 'user_registered',
          title: 'New User Registration',
          description: 'A new user has registered',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        },
        {
          id: '2',
          type: 'listing_created',
          title: 'New Listing Created',
          description: '2018 Honda Civic posted for sale',
          timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        },
        {
          id: '3',
          type: 'offer_made',
          title: 'New Offer Made',
          description: 'Offer submitted for $15,000',
          timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    return `${days} days ago`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registered':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'listing_created':
        return <Car className="h-4 w-4 text-green-500" />;
      case 'offer_made':
        return <DollarSign className="h-4 w-4 text-yellow-500" />;
      case 'message_sent':
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      case 'report_submitted':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'ticket_created':
        return <HeadphonesIcon className="h-4 w-4 text-indigo-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
          <p className="mt-2 text-sm text-gray-500">User: {user?.email || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <SimpleAdminLayout userProfile={profile}>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Welcome back, {profile?.display_name || user?.email}</h1>
              <p className="text-blue-100 mt-2">Here's what's happening with your marketplace today</p>
            </div>
            <div className="text-right">
              <Badge className="bg-white/20 text-white border-white/30">
                {profile?.is_admin ? 'Administrator' : 'Moderator'}
              </Badge>
              <p className="text-sm text-blue-100 mt-2">
                Last login: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-100 rounded-bl-full"></div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalUsers}</p>
                  <p className="text-xs text-green-600 mt-1 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Growing
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-green-100 rounded-bl-full"></div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Listings</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.activeListings}</p>
                  <p className="text-xs text-gray-500 mt-1">of {stats.totalListings} total</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Car className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-100 rounded-bl-full"></div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Reports</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.pendingReports}</p>
                  <p className="text-xs text-red-600 mt-1 flex items-center">
                    {stats.pendingReports > 0 && <AlertTriangle className="w-3 h-3 mr-1" />}
                    {stats.pendingReports > 0 ? 'Needs attention' : 'All clear'}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-purple-100 rounded-bl-full"></div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Support Tickets</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.openTickets}</p>
                  <p className="text-xs text-orange-600 mt-1">
                    {stats.urgentTickets} urgent
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <HeadphonesIcon className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-blue-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={() => router.push('/admin/users')}
                    className="h-20 flex flex-col items-center justify-center space-y-2 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  >
                    <Users className="h-6 w-6" />
                    <span>Manage Users</span>
                  </Button>

                  <Button
                    onClick={() => router.push('/admin/listings')}
                    className="h-20 flex flex-col items-center justify-center space-y-2 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  >
                    <Car className="h-6 w-6" />
                    <span>Review Listings</span>
                  </Button>

                  <Button
                    onClick={() => router.push('/admin/reports')}
                    className="h-20 flex flex-col items-center justify-center space-y-2 bg-gradient-to-br from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700"
                  >
                    <AlertTriangle className="h-6 w-6" />
                    <span>Handle Reports</span>
                  </Button>

                  <Button
                    onClick={() => router.push('/admin/analytics')}
                    className="h-20 flex flex-col items-center justify-center space-y-2 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                  >
                    <BarChart3 className="h-6 w-6" />
                    <span>View Analytics</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-gray-600" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No recent activity</p>
                ) : (
                  recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 mt-1">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.description}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTimestamp(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Admin Tools */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/support')}>
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-indigo-100 rounded-full w-fit mx-auto mb-4">
                <HeadphonesIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Support Center</h3>
              <p className="text-sm text-gray-600 mt-2">Manage tickets and help users</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/faq')}>
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-emerald-100 rounded-full w-fit mx-auto mb-4">
                <FileText className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900">FAQ Management</h3>
              <p className="text-sm text-gray-600 mt-2">Update help content</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/chat')}>
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-pink-100 rounded-full w-fit mx-auto mb-4">
                <MessageSquare className="h-6 w-6 text-pink-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Live Chat</h3>
              <p className="text-sm text-gray-600 mt-2">Monitor chat sessions</p>
            </CardContent>
          </Card>

          {profile?.is_admin && (
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/settings')}>
              <CardContent className="p-6 text-center">
                <div className="p-3 bg-gray-100 rounded-full w-fit mx-auto mb-4">
                  <Settings className="h-6 w-6 text-gray-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Settings</h3>
                <p className="text-sm text-gray-600 mt-2">System configuration</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </SimpleAdminLayout>
  );
}
