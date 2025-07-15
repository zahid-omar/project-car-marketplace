'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { 
  Settings,
  Shield,
  Database,
  Mail,
  Globe,
  Key,
  Users,
  AlertTriangle,
  Save,
  RefreshCw,
  CheckCircle
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { withAdminAuth, PERMISSIONS } from '@/lib/admin-auth';

interface SystemSettings {
  site_name: string;
  site_description: string;
  contact_email: string;
  max_listings_per_user: number;
  require_email_verification: boolean;
  enable_user_registration: boolean;
  enable_guest_browsing: boolean;
  listing_approval_required: boolean;
  max_image_size_mb: number;
  max_images_per_listing: number;
  currency: string;
  timezone: string;
  maintenance_mode: boolean;
  maintenance_message: string;
}

interface SystemStats {
  total_users: number;
  active_users: number;
  total_listings: number;
  active_listings: number;
  database_size: string;
  uptime: string;
  last_backup: string;
}

function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    site_name: 'Car Marketplace',
    site_description: 'Find your perfect car',
    contact_email: 'admin@carmarketplace.com',
    max_listings_per_user: 10,
    require_email_verification: true,
    enable_user_registration: true,
    enable_guest_browsing: true,
    listing_approval_required: false,
    max_image_size_mb: 5,
    max_images_per_listing: 10,
    currency: 'USD',
    timezone: 'America/New_York',
    maintenance_mode: false,
    maintenance_message: 'Site is under maintenance. Please try again later.',
  });

  const [stats, setStats] = useState<SystemStats>({
    total_users: 0,
    active_users: 0,
    total_listings: 0,
    active_listings: 0,
    database_size: '0 MB',
    uptime: '0 days',
    last_backup: 'Never',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadSettings();
    loadStats();
  }, []);

  const loadSettings = async () => {
    try {
      // In a real app, you'd load these from a settings table
      // For now, we'll use default values
      setLoading(false);
    } catch (error) {
      console.error('Error loading settings:', error);
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [usersResult, listingsResult] = await Promise.all([
        supabase.from('profiles').select('id, created_at, last_sign_in_at'),
        supabase.from('listings').select('id, status, created_at'),
      ]);

      const users = usersResult.data || [];
      const listings = listingsResult.data || [];

      // Calculate active users (signed in within last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const activeUsers = users.filter(user => 
        user.last_sign_in_at && new Date(user.last_sign_in_at) > thirtyDaysAgo
      ).length;

      setStats({
        total_users: users.length,
        active_users: activeUsers,
        total_listings: listings.length,
        active_listings: listings.filter(l => l.status === 'active').length,
        database_size: '12.5 MB', // Mock value
        uptime: '15 days', // Mock value
        last_backup: '2 hours ago', // Mock value
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // In a real app, you'd save these to a settings table
      // For now, we'll just simulate the save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof SystemSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleMaintenanceMode = () => {
    handleInputChange('maintenance_mode', !settings.maintenance_mode);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading settings...</p>
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
              <Settings className="w-8 h-8 mr-3" />
              System Settings
            </h1>
            <p className="text-gray-600 mt-1">Configure system settings and view statistics</p>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={loadStats}
              variant="outlined"
              className="flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Stats
            </Button>
            <Button
              onClick={saveSettings}
              disabled={saving}
              className="flex items-center"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : saved ? (
                <CheckCircle className="w-4 h-4 mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
            </Button>
          </div>
        </div>

        {/* Maintenance Mode Alert */}
        {settings.maintenance_mode && (
          <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
              <span className="text-yellow-800 font-medium">
                Maintenance Mode is Active
              </span>
            </div>
            <p className="text-yellow-700 mt-1">
              The site is currently in maintenance mode. Users will see the maintenance message.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* System Statistics */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="w-5 h-5 mr-2" />
                  System Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Users</span>
                    <Badge>{stats.total_users}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Active Users (30d)</span>
                    <Badge className="bg-green-100 text-green-800">{stats.active_users}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Listings</span>
                    <Badge>{stats.total_listings}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Active Listings</span>
                    <Badge className="bg-blue-100 text-blue-800">{stats.active_listings}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Database Size</span>
                    <Badge>{stats.database_size}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Uptime</span>
                    <Badge className="bg-green-100 text-green-800">{stats.uptime}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Last Backup</span>
                    <Badge>{stats.last_backup}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Settings Forms */}
          <div className="lg:col-span-2 space-y-8">
            {/* General Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="w-5 h-5 mr-2" />
                  General Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Site Name
                    </label>
                    <Input
                      value={settings.site_name}
                      onChange={(e) => handleInputChange('site_name', e.target.value)}
                      placeholder="Enter site name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Email
                    </label>
                    <Input
                      type="email"
                      value={settings.contact_email}
                      onChange={(e) => handleInputChange('contact_email', e.target.value)}
                      placeholder="Enter contact email"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Site Description
                    </label>
                    <Input
                      value={settings.site_description}
                      onChange={(e) => handleInputChange('site_description', e.target.value)}
                      placeholder="Enter site description"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency
                    </label>
                    <select
                      value={settings.currency}
                      onChange={(e) => handleInputChange('currency', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="CAD">CAD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timezone
                    </label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => handleInputChange('timezone', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                      <option value="Europe/London">GMT</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User & Listing Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  User & Listing Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Listings per User
                    </label>
                    <Input
                      type="number"
                      value={settings.max_listings_per_user}
                      onChange={(e) => handleInputChange('max_listings_per_user', parseInt(e.target.value))}
                      min="1"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Images per Listing
                    </label>
                    <Input
                      type="number"
                      value={settings.max_images_per_listing}
                      onChange={(e) => handleInputChange('max_images_per_listing', parseInt(e.target.value))}
                      min="1"
                      max="50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Image Size (MB)
                    </label>
                    <Input
                      type="number"
                      value={settings.max_image_size_mb}
                      onChange={(e) => handleInputChange('max_image_size_mb', parseInt(e.target.value))}
                      min="1"
                      max="20"
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="require_email_verification"
                        checked={settings.require_email_verification}
                        onChange={(e) => handleInputChange('require_email_verification', e.target.checked)}
                        className="mr-2"
                      />
                      <label htmlFor="require_email_verification" className="text-sm text-gray-700">
                        Require Email Verification
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="enable_user_registration"
                        checked={settings.enable_user_registration}
                        onChange={(e) => handleInputChange('enable_user_registration', e.target.checked)}
                        className="mr-2"
                      />
                      <label htmlFor="enable_user_registration" className="text-sm text-gray-700">
                        Enable User Registration
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="enable_guest_browsing"
                        checked={settings.enable_guest_browsing}
                        onChange={(e) => handleInputChange('enable_guest_browsing', e.target.checked)}
                        className="mr-2"
                      />
                      <label htmlFor="enable_guest_browsing" className="text-sm text-gray-700">
                        Enable Guest Browsing
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="listing_approval_required"
                        checked={settings.listing_approval_required}
                        onChange={(e) => handleInputChange('listing_approval_required', e.target.checked)}
                        className="mr-2"
                      />
                      <label htmlFor="listing_approval_required" className="text-sm text-gray-700">
                        Require Listing Approval
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Maintenance Mode */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Maintenance Mode
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Maintenance Mode</h3>
                      <p className="text-sm text-gray-600">
                        Enable maintenance mode to prevent users from accessing the site
                      </p>
                    </div>
                    <Button
                      onClick={toggleMaintenanceMode}
                      variant={settings.maintenance_mode ? "filled" : "outlined"}
                      className={settings.maintenance_mode ? "bg-red-600 hover:bg-red-700" : ""}
                    >
                      {settings.maintenance_mode ? 'Disable' : 'Enable'}
                    </Button>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maintenance Message
                    </label>
                    <textarea
                      value={settings.maintenance_message}
                      onChange={(e) => handleInputChange('maintenance_message', e.target.value)}
                      rows={3}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Enter maintenance message"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default withAdminAuth(AdminSettingsPage, PERMISSIONS.SYSTEM_SETTINGS);
