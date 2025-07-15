'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Users, 
  Car, 
  MessageSquare, 
  BarChart3, 
  AlertTriangle, 
  HeadphonesIcon,
  FileText,
  Settings,
  Shield,
  Home,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface SimpleAdminLayoutProps {
  children: React.ReactNode;
  userProfile?: {
    display_name?: string;
    is_admin?: boolean;
    is_moderator?: boolean;
  };
}

interface NavItem {
  href: string;
  icon: React.ComponentType<any>;
  label: string;
  adminOnly?: boolean;
  badge?: number;
}

export default function SimpleAdminLayout({ children, userProfile }: SimpleAdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const supabase = createClientComponentClient();

  const navItems: NavItem[] = [
    {
      href: '/admin',
      icon: Home,
      label: 'Dashboard',
    },
    {
      href: '/admin/users',
      icon: Users,
      label: 'Users',
    },
    {
      href: '/admin/listings',
      icon: Car,
      label: 'Listings',
    },
    {
      href: '/admin/reports',
      icon: AlertTriangle,
      label: 'Reports',
    },
    {
      href: '/admin/analytics',
      icon: BarChart3,
      label: 'Analytics',
    },
    {
      href: '/admin/support',
      icon: HeadphonesIcon,
      label: 'Support',
    },
    {
      href: '/admin/chat',
      icon: MessageSquare,
      label: 'Live Chat',
    },
    {
      href: '/admin/faq',
      icon: FileText,
      label: 'FAQ',
    },
    {
      href: '/admin/settings',
      icon: Settings,
      label: 'Settings',
      adminOnly: true,
    },
  ];

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const filteredNavItems = navItems.filter(item => {
    if (item.adminOnly && !userProfile?.is_admin) return false;
    return true;
  });

  const NavContent = () => (
    <>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
            <p className="text-sm text-gray-600">
              {userProfile?.display_name || 'Admin User'}
            </p>
            <Badge 
              className={`mt-1 ${
                userProfile?.is_admin 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {userProfile?.is_admin ? 'Administrator' : 'Moderator'}
            </Badge>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <button
              key={item.href}
              onClick={() => {
                router.push(item.href);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              {item.label}
              {item.badge && (
                <Badge className="ml-auto bg-red-100 text-red-800">
                  {item.badge}
                </Badge>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 space-y-2">
        <Button
          variant="outlined"
          onClick={() => router.push('/')}
          className="w-full justify-start"
        >
          <Home className="w-4 h-4 mr-2" />
          Back to Site
        </Button>
        <Button
          variant="outlined"
          onClick={handleSignOut}
          className="w-full justify-start text-red-600 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Mobile close button */}
          <div className="lg:hidden flex justify-end p-4">
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <NavContent />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 hover:text-gray-700"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Admin Panel</h1>
            <div className="w-6"></div> {/* Spacer */}
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
