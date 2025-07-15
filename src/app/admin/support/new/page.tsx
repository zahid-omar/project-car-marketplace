'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, User, AlertCircle } from 'lucide-react';

interface User {
  id: string;
  email: string;
  display_name: string | null;
}

export default function NewSupportTicketPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'general' as 'bug' | 'feature' | 'account' | 'payment' | 'general' | 'abuse',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent'
  });

  useEffect(() => {
    if (user) {
      checkAdminAccess();
    }
  }, [user]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const checkAdminAccess = async () => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user?.id)
      .single();

    if (!profile?.is_admin) {
      router.push('/dashboard');
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, display_name')
      .order('email', { ascending: true });

    if (error) {
      console.error('Error fetching users:', error);
    } else {
      setUsers(data || []);
    }

    setLoading(false);
  };

  const handleUserSearch = (email: string) => {
    setSearchEmail(email);
    
    if (email) {
      const foundUser = users.find(u => 
        u.email.toLowerCase().includes(email.toLowerCase()) ||
        u.display_name?.toLowerCase().includes(email.toLowerCase())
      );
      setSelectedUser(foundUser || null);
    } else {
      setSelectedUser(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) {
      alert('Please select a user for this ticket');
      return;
    }

    if (!formData.title.trim() || !formData.description.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);

    const { error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: selectedUser.id,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        assigned_to: user?.id // Auto-assign to the admin creating the ticket
      });

    if (error) {
      console.error('Error creating ticket:', error);
      alert('Error creating ticket. Please try again.');
    } else {
      router.push('/admin/support');
    }

    setSubmitting(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchEmail.toLowerCase()) ||
    u.display_name?.toLowerCase().includes(searchEmail.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="outlined"
            onClick={() => router.push('/admin/support')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Support
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900">Create New Support Ticket</h1>
          <p className="text-gray-600 mt-2">Create a support ticket on behalf of a user</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ticket Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* User Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select User *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by email or name..."
                    value={searchEmail}
                    onChange={(e) => handleUserSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {searchEmail && (
                  <div className="mt-2 border border-gray-300 rounded-lg max-h-40 overflow-y-auto">
                    {filteredUsers.length === 0 ? (
                      <div className="p-3 text-gray-500 text-center">
                        No users found
                      </div>
                    ) : (
                      filteredUsers.slice(0, 5).map((user) => (
                        <div
                          key={user.id}
                          className={`p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-200 last:border-b-0 ${
                            selectedUser?.id === user.id ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => {
                            setSelectedUser(user);
                            setSearchEmail(user.email);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <div>
                              <p className="font-medium text-gray-900">
                                {user.display_name || user.email}
                              </p>
                              {user.display_name && (
                                <p className="text-sm text-gray-500">{user.email}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
                
                {selectedUser && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800">
                      <User className="h-4 w-4" />
                      <span className="font-medium">
                        Selected: {selectedUser.display_name || selectedUser.email}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <Input
                  type="text"
                  placeholder="Enter ticket title..."
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  placeholder="Describe the issue in detail..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={5}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="general">General</option>
                    <option value="bug">Bug Report</option>
                    <option value="feature">Feature Request</option>
                    <option value="account">Account Issue</option>
                    <option value="payment">Payment Issue</option>
                    <option value="abuse">Abuse Report</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center gap-4">
                <Button
                  type="submit"
                  disabled={submitting || !selectedUser}
                  className="flex items-center gap-2"
                >
                  {submitting ? 'Creating...' : 'Create Ticket'}
                </Button>
                
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => router.push('/admin/support')}
                >
                  Cancel
                </Button>
              </div>

              {!selectedUser && (
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Please select a user to create the ticket for</span>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
