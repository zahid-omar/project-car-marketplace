'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { 
  Users, 
  Search, 
  Filter, 
  UserCheck, 
  UserX,
  Mail,
  Calendar,
  Settings,
  ArrowLeft,
  MoreHorizontal
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  display_name: string;
  profile_image_url: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  bio: string;
  listing_count?: number;
  message_count?: number;
}

export default function UsersManagementPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'admin'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const usersPerPage = 20;
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterStatus]);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, display_name')
        .eq('id', user.id)
        .single();

      if (!profile?.is_admin) {
        router.push('/');
        return;
      }

      setUser({ ...user, ...profile });
      await loadUsers();
    } catch (error) {
      console.error('Error checking admin access:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      // Get all users with their profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select(`
          *,
          listings:listings(count),
          sent_messages:messages!messages_sender_id_fkey(count)
        `)
        .order('created_at', { ascending: false });

      if (profiles) {
        const usersWithCounts = profiles.map(profile => ({
          ...profile,
          listing_count: profile.listings?.[0]?.count || 0,
          message_count: profile.sent_messages?.[0]?.count || 0
        }));
        setUsers(usersWithCounts);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    switch (filterStatus) {
      case 'active':
        filtered = filtered.filter(user => user.is_active);
        break;
      case 'inactive':
        filtered = filtered.filter(user => !user.is_active);
        break;
      case 'admin':
        filtered = filtered.filter(user => user.is_admin);
        break;
    }

    setFilteredUsers(filtered);
    setTotalPages(Math.ceil(filtered.length / usersPerPage));
    setCurrentPage(1);
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_active: !currentStatus } : user
      ));
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_admin: !currentStatus } : user
      ));
    } catch (error) {
      console.error('Error toggling admin status:', error);
    }
  };

  const getCurrentPageUsers = () => {
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Button
              variant="outlined"
              onClick={() => router.push('/admin')}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600 mt-1">
                Manage {filteredUsers.length} users ({users.length} total)
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  variant={filterStatus === 'all' ? 'filled' : 'outlined'}
                  onClick={() => setFilterStatus('all')}
                  size="sm"
                >
                  All
                </Button>
                <Button
                  variant={filterStatus === 'active' ? 'filled' : 'outlined'}
                  onClick={() => setFilterStatus('active')}
                  size="sm"
                >
                  Active
                </Button>
                <Button
                  variant={filterStatus === 'inactive' ? 'filled' : 'outlined'}
                  onClick={() => setFilterStatus('inactive')}
                  size="sm"
                >
                  Inactive
                </Button>
                <Button
                  variant={filterStatus === 'admin' ? 'filled' : 'outlined'}
                  onClick={() => setFilterStatus('admin')}
                  size="sm"
                >
                  Admins
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">User</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Activity</th>
                    <th className="text-left py-3 px-4">Joined</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getCurrentPageUsers().map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                            {user.profile_image_url ? (
                              <img
                                src={user.profile_image_url}
                                alt={user.display_name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <Users className="w-5 h-5 text-gray-500" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {user.display_name || 'No name'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col space-y-1">
                          <Badge variant={user.is_active ? 'default' : 'destructive'}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          {user.is_admin && (
                            <Badge variant="outline">Admin</Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-600">
                          <div>{user.listing_count || 0} listings</div>
                          <div>{user.message_count || 0} messages</div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-600">
                          {formatDate(user.created_at)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex space-x-2">
                          <Button
                            variant="outlined"
                            size="sm"
                            onClick={() => toggleUserStatus(user.id, user.is_active)}
                          >
                            {user.is_active ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="outlined"
                            size="sm"
                            onClick={() => toggleAdminStatus(user.id, user.is_admin)}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * usersPerPage + 1} to {Math.min(currentPage * usersPerPage, filteredUsers.length)} of {filteredUsers.length} users
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outlined"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
