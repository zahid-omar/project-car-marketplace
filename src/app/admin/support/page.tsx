'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Search, MessageSquare, Clock, CheckCircle, AlertCircle, User, Calendar, Filter, ArrowUp, ArrowDown, Plus } from 'lucide-react';

interface SupportTicket {
  id: string;
  title: string;
  description: string;
  category: 'bug' | 'feature' | 'account' | 'payment' | 'general' | 'abuse';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';
  assigned_to: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  closed_at: string | null;
  user: {
    id: string;
    email: string;
    display_name: string | null;
  };
  assigned_admin: {
    id: string;
    email: string;
    display_name: string | null;
  } | null;
  replies_count: number;
  last_reply_at: string | null;
}

interface AdminUser {
  id: string;
  email: string;
  display_name: string | null;
}

const PRIORITY_COLORS = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

const STATUS_COLORS = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  waiting_user: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800'
};

const CATEGORY_COLORS = {
  bug: 'bg-red-100 text-red-800',
  feature: 'bg-blue-100 text-blue-800',
  account: 'bg-purple-100 text-purple-800',
  payment: 'bg-green-100 text-green-800',
  general: 'bg-gray-100 text-gray-800',
  abuse: 'bg-orange-100 text-orange-800'
};

export default function SupportTicketsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [assignedFilter, setAssignedFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'created_at' | 'updated_at' | 'priority'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (user) {
      checkAdminAccess();
    }
  }, [user]);

  useEffect(() => {
    fetchTickets();
    fetchAdminUsers();
  }, [currentPage, searchQuery, statusFilter, priorityFilter, categoryFilter, assignedFilter, sortField, sortDirection]);

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

  const fetchAdminUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, display_name')
      .eq('is_admin', true)
      .order('display_name', { ascending: true });

    if (error) {
      console.error('Error fetching admin users:', error);
    } else {
      setAdminUsers(data || []);
    }
  };

  const fetchTickets = async () => {
    setLoading(true);
    
    let query = supabase
      .from('support_tickets')
      .select(`
        *,
        user:profiles!user_id(id, email, display_name),
        assigned_admin:profiles!assigned_to(id, email, display_name)
      `, { count: 'exact' });

    // Apply search filter
    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      query = query.eq('priority', priorityFilter);
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      query = query.eq('category', categoryFilter);
    }

    // Apply assigned filter
    if (assignedFilter !== 'all') {
      if (assignedFilter === 'unassigned') {
        query = query.is('assigned_to', null);
      } else {
        query = query.eq('assigned_to', assignedFilter);
      }
    }

    // Apply sorting
    query = query.order(sortField, { ascending: sortDirection === 'asc' });

    // Apply pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    query = query.range(startIndex, startIndex + itemsPerPage - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching tickets:', error);
    } else {
      // Get reply counts for each ticket
      const ticketsWithReplies = await Promise.all(
        (data || []).map(async (ticket) => {
          const { count: repliesCount } = await supabase
            .from('support_ticket_replies')
            .select('*', { count: 'exact', head: true })
            .eq('ticket_id', ticket.id);

          const { data: lastReply } = await supabase
            .from('support_ticket_replies')
            .select('created_at')
            .eq('ticket_id', ticket.id)
            .order('created_at', { ascending: false })
            .limit(1);

          return {
            ...ticket,
            replies_count: repliesCount || 0,
            last_reply_at: lastReply?.[0]?.created_at || null
          };
        })
      );

      setTickets(ticketsWithReplies);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
    }

    setLoading(false);
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    const { error } = await supabase
      .from('support_tickets')
      .update({ 
        status: newStatus,
        ...(newStatus === 'resolved' && { resolved_at: new Date().toISOString() }),
        ...(newStatus === 'closed' && { closed_at: new Date().toISOString() })
      })
      .eq('id', ticketId);

    if (error) {
      console.error('Error updating ticket status:', error);
    } else {
      fetchTickets();
    }
  };

  const handleAssignTicket = async (ticketId: string, adminId: string | null) => {
    const { error } = await supabase
      .from('support_tickets')
      .update({ assigned_to: adminId })
      .eq('id', ticketId);

    if (error) {
      console.error('Error assigning ticket:', error);
    } else {
      fetchTickets();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <MessageSquare className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'waiting_user': return <AlertCircle className="h-4 w-4" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      case 'closed': return <CheckCircle className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getStats = () => {
    const totalTickets = tickets.length;
    const openTickets = tickets.filter(t => t.status === 'open').length;
    const inProgressTickets = tickets.filter(t => t.status === 'in_progress').length;
    const resolvedTickets = tickets.filter(t => t.status === 'resolved').length;
    const urgentTickets = tickets.filter(t => t.priority === 'urgent').length;
    const unassignedTickets = tickets.filter(t => !t.assigned_to).length;

    return {
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      urgentTickets,
      unassignedTickets
    };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading support tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-gray-600 mt-2">Manage and respond to user support requests</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalTickets}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Open</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.openTickets}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.inProgressTickets}</p>
                </div>
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Resolved</p>
                  <p className="text-2xl font-bold text-green-600">{stats.resolvedTickets}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Urgent</p>
                  <p className="text-2xl font-bold text-red-600">{stats.urgentTickets}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Unassigned</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.unassignedTickets}</p>
                </div>
                <User className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="waiting_user">Waiting User</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="bug">Bug</option>
                <option value="feature">Feature</option>
                <option value="account">Account</option>
                <option value="payment">Payment</option>
                <option value="general">General</option>
                <option value="abuse">Abuse</option>
              </select>

              <select
                value={assignedFilter}
                onChange={(e) => setAssignedFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Assigned</option>
                <option value="unassigned">Unassigned</option>
                {adminUsers.map(admin => (
                  <option key={admin.id} value={admin.id}>
                    {admin.display_name || admin.email}
                  </option>
                ))}
              </select>

              <Button 
                onClick={() => router.push('/admin/support/new')}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                New Ticket
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tickets List */}
        <Card>
          <CardHeader>
            <CardTitle>Support Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            {tickets.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No support tickets found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/admin/support/${ticket.id}`)}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(ticket.status)}
                          <h3 className="font-semibold text-gray-900">{ticket.title}</h3>
                          <Badge className={PRIORITY_COLORS[ticket.priority]}>
                            {ticket.priority}
                          </Badge>
                          <Badge className={STATUS_COLORS[ticket.status]}>
                            {ticket.status.replace('_', ' ')}
                          </Badge>
                          <Badge className={CATEGORY_COLORS[ticket.category]}>
                            {ticket.category}
                          </Badge>
                        </div>

                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                          {ticket.description}
                        </p>

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {ticket.user.display_name || ticket.user.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(ticket.created_at)}
                          </span>
                          {ticket.replies_count > 0 && (
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              {ticket.replies_count} replies
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={ticket.status}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleStatusChange(ticket.id, e.target.value);
                          }}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="waiting_user">Waiting User</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>

                        <select
                          value={ticket.assigned_to || ''}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleAssignTicket(ticket.id, e.target.value || null);
                          }}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="">Unassigned</option>
                          {adminUsers.map(admin => (
                            <option key={admin.id} value={admin.id}>
                              {admin.display_name || admin.email}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outlined"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
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
