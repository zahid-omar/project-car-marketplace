'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

// Import the regular auth context to avoid conflicts
import { useAuth } from '@/lib/auth';

interface Profile {
  id: string;
  display_name: string;
  is_admin: boolean;
  is_moderator: boolean;
  role: 'admin' | 'moderator' | 'user';
  permissions: string[];
  created_at: string;
  updated_at: string;
}

interface AdminContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  hasPermission: (permission: string) => boolean;
  refreshProfile: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

// Define permission constants
export const PERMISSIONS = {
  MANAGE_USERS: 'manage_users',
  MANAGE_LISTINGS: 'manage_listings',
  MANAGE_REPORTS: 'manage_reports',
  VIEW_ANALYTICS: 'view_analytics',
  MANAGE_SUPPORT: 'manage_support',
  MANAGE_FAQ: 'manage_faq',
  MANAGE_CHAT: 'manage_chat',
  SYSTEM_SETTINGS: 'system_settings',
  MODERATE_CONTENT: 'moderate_content',
  MANAGE_PAYMENTS: 'manage_payments',
} as const;

// Define role permissions
const ROLE_PERMISSIONS = {
  admin: Object.values(PERMISSIONS),
  moderator: [
    PERMISSIONS.MANAGE_REPORTS,
    PERMISSIONS.MODERATE_CONTENT,
    PERMISSIONS.MANAGE_SUPPORT,
    PERMISSIONS.MANAGE_FAQ,
    PERMISSIONS.MANAGE_CHAT,
    PERMISSIONS.VIEW_ANALYTICS,
  ],
  user: [],
} as const;

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth(); // Use shared auth context
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const refreshProfile = async () => {
    try {
      console.log('🔍 [AdminAuth] Starting profile refresh...');
      
      if (!user) {
        console.log('❌ [AdminAuth] No user from auth context');
        setProfile(null);
        return;
      }

      console.log('✅ [AdminAuth] User from auth context:', { 
        id: user.id, 
        email: user.email 
      });

      // Get user profile with admin/moderator info
      console.log('🔍 [AdminAuth] Fetching profile for user:', user.id);
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('❌ [AdminAuth] Error fetching profile:', error);
        setProfile(null);
        return;
      }

      if (!profileData) {
        console.error('❌ [AdminAuth] No profile data found');
        setProfile(null);
        return;
      }

      console.log('✅ [AdminAuth] Profile data:', {
        id: profileData.id,
        email: profileData.email,
        is_admin: profileData.is_admin,
        is_moderator: profileData.is_moderator
      });

      // Determine role and permissions
      let role: 'admin' | 'moderator' | 'user' = 'user';
      if (profileData.is_admin) {
        role = 'admin';
      } else if (profileData.is_moderator) {
        role = 'moderator';
      }

      const permissions = ROLE_PERMISSIONS[role];

      const fullProfile: Profile = {
        ...profileData,
        role,
        permissions,
      };

      console.log('✅ [AdminAuth] Final profile created:', {
        role,
        permissions: permissions.length,
        isAdmin: profileData.is_admin,
        isModerator: profileData.is_moderator
      });

      setProfile(fullProfile);
    } catch (error) {
      console.error('❌ [AdminAuth] Error refreshing profile:', error);
      setProfile(null);
    }
  };

  useEffect(() => {
    console.log('🔍 [AdminAuth] Auth state changed:', {
      user: !!user,
      userEmail: user?.email,
      authLoading
    });

    if (!authLoading) {
      console.log('🔍 [AdminAuth] Auth loading complete, refreshing profile...');
      
      // Set a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.warn('⚠️ [AdminAuth] Profile refresh timed out after 10 seconds');
        setLoading(false);
      }, 10000);

      refreshProfile()
        .then(() => {
          console.log('✅ [AdminAuth] Profile refresh completed');
        })
        .catch(error => {
          console.error('❌ [AdminAuth] Profile refresh failed:', error);
        })
        .finally(() => {
          clearTimeout(timeoutId);
          setLoading(false);
          console.log('✅ [AdminAuth] Loading state set to false');
        });

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [user, authLoading]);

  const isAdmin = profile?.is_admin || false;
  const isModerator = profile?.is_moderator || false;
  const isLoading = authLoading || loading;

  const hasPermission = (permission: string) => {
    if (!profile) return false;
    return profile.permissions.includes(permission);
  };

  const value: AdminContextType = {
    user,
    profile,
    loading: isLoading,
    isAdmin,
    isModerator,
    hasPermission,
    refreshProfile,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}

// Higher-order component for admin-only routes
export function withAdminAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredPermission?: string
) {
  return function AdminAuthenticatedComponent(props: P) {
    const { user, profile, loading, isAdmin, isModerator, hasPermission } = useAdmin();
    const router = useRouter();

    console.log('🔒 Admin Auth Check:', {
      loading,
      hasUser: !!user,
      hasProfile: !!profile,
      userEmail: user?.email,
      isAdmin,
      isModerator,
      requiredPermission,
      hasRequiredPermission: requiredPermission ? hasPermission(requiredPermission) : true
    });

    useEffect(() => {
      if (!loading) {
        console.log('🔒 Auth check completed:', {
          user: !!user,
          isAdmin,
          isModerator,
          requiredPermission
        });

        if (!user) {
          console.log('🔒 No user, redirecting to login');
          router.push('/login');
          return;
        }

        if (!isAdmin && !isModerator) {
          console.log('🔒 Not admin/moderator, redirecting to home');
          router.push('/');
          return;
        }

        if (requiredPermission && !hasPermission(requiredPermission)) {
          console.log('🔒 Missing required permission, redirecting to admin dashboard');
          router.push('/admin');
          return;
        }

        console.log('✅ Auth check passed!');
      }
    }, [user, profile, loading, isAdmin, isModerator, hasPermission, router]);

    if (loading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Verifying admin access...</p>
            <div className="mt-4 text-sm text-gray-500 space-y-1">
              <p>User: {user?.email || 'Loading...'}</p>
              <p>Profile: {profile ? 'Loaded' : 'Loading...'}</p>
              <p>Admin: {profile?.is_admin ? 'Yes' : 'No'}</p>
              <p>Moderator: {profile?.is_moderator ? 'Yes' : 'No'}</p>
            </div>
            <div className="mt-4 text-xs text-gray-400">
              <p>Check the browser console for detailed logs</p>
            </div>
          </div>
        </div>
      );
    }

    if (!user || (!isAdmin && !isModerator)) {
      return null;
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
            <button
              onClick={() => router.push('/admin')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Return to Admin Dashboard
            </button>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
}

// Component to check permissions in JSX
export function PermissionGuard({
  permission,
  children,
  fallback = null,
}: {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { hasPermission } = useAdmin();

  if (hasPermission(permission)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
