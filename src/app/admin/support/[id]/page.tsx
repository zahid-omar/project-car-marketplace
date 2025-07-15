'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeft, MessageSquare, Clock, CheckCircle, AlertCircle, User, Calendar, Send, Eye, EyeOff } from 'lucide-react';

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
}

interface TicketReply {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_internal_note: boolean;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    email: string;
    display_name: string | null;
  };
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

export default function SupportTicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [newReply, setNewReply] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [updating, setUpdating] = useState(false);

  const ticketId = params.id as string;

  useEffect(() => {
    if (user && ticketId) {
      checkAdminAccess();
    }
  }, [user, ticketId]);

  useEffect(() => {
    if (ticketId) {
      fetchTicket();
      fetchReplies();
      fetchAdminUsers();
    }
  }, [ticketId]);

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

  const fetchTicket = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('support_tickets')
      .select(`
        *,
        user:profiles!user_id(id, email, display_name),
        assigned_admin:profiles!assigned_to(id, email, display_name)
      `)
      .eq('id', ticketId)
      .single();

    if (error) {
      console.error('Error fetching ticket:', error);
      router.push('/admin/support');
    } else {
      setTicket(data);
      setResolutionNotes(data.resolution_notes || '');
    }

    setLoading(false);
  };

  const fetchReplies = async () => {
    const { data, error } = await supabase
      .from('support_ticket_replies')
      .select(`
        *,
        user:profiles!user_id(id, email, display_name)
      `)
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching replies:', error);
    } else {
      setReplies(data || []);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    
    const updateData: any = { status: newStatus };
    
    if (newStatus === 'resolved') {
      updateData.resolved_at = new Date().toISOString();
      updateData.resolution_notes = resolutionNotes;
    } else if (newStatus === 'closed') {
      updateData.closed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('support_tickets')
      .update(updateData)
      .eq('id', ticketId);

    if (error) {
      console.error('Error updating ticket status:', error);
    } else {
      fetchTicket();
    }

    setUpdating(false);
  };

  const handleAssignTicket = async (adminId: string | null) => {
    setUpdating(true);
    
    const { error } = await supabase
      .from('support_tickets')
      .update({ assigned_to: adminId })
      .eq('id', ticketId);

    if (error) {
      console.error('Error assigning ticket:', error);
    } else {
      fetchTicket();
    }

    setUpdating(false);
  };

  const handleSendReply = async () => {
    if (!newReply.trim()) return;

    setSendingReply(true);

    const { error } = await supabase
      .from('support_ticket_replies')
      .insert({
        ticket_id: ticketId,
        user_id: user?.id,
        message: newReply,
        is_internal_note: isInternalNote
      });

    if (error) {
      console.error('Error sending reply:', error);
    } else {
      setNewReply('');
      setIsInternalNote(false);
      fetchReplies();
      
      // Update ticket status to in_progress if it's currently open
      if (ticket?.status === 'open') {
        handleStatusChange('in_progress');
      }
    }

    setSendingReply(false);
  };

  const handleUpdateResolutionNotes = async () => {
    setUpdating(true);
    
    const { error } = await supabase
      .from('support_tickets')
      .update({ resolution_notes: resolutionNotes })
      .eq('id', ticketId);

    if (error) {
      console.error('Error updating resolution notes:', error);
    } else {
      fetchTicket();
    }

    setUpdating(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ticket details...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Ticket not found</p>
          <Button onClick={() => router.push('/admin/support')} className="mt-4">
            Back to Support
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
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
          
          <div className="flex items-center gap-3 mb-2">
            {getStatusIcon(ticket.status)}
            <h1 className="text-3xl font-bold text-gray-900">{ticket.title}</h1>
          </div>
          
          <div className="flex items-center gap-2 mb-4">
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket Details */}
            <Card>
              <CardHeader>
                <CardTitle>Ticket Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-600 whitespace-pre-wrap">{ticket.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Created:</span>
                      <p className="text-gray-600">{formatDate(ticket.created_at)}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Updated:</span>
                      <p className="text-gray-600">{formatDate(ticket.updated_at)}</p>
                    </div>
                    {ticket.resolved_at && (
                      <div>
                        <span className="font-medium text-gray-700">Resolved:</span>
                        <p className="text-gray-600">{formatDate(ticket.resolved_at)}</p>
                      </div>
                    )}
                    {ticket.closed_at && (
                      <div>
                        <span className="font-medium text-gray-700">Closed:</span>
                        <p className="text-gray-600">{formatDate(ticket.closed_at)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Replies */}
            <Card>
              <CardHeader>
                <CardTitle>Conversation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {replies.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No replies yet</p>
                  ) : (
                    replies.map((reply) => (
                      <div key={reply.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="font-medium text-gray-900">
                              {reply.user.display_name || reply.user.email}
                            </span>
                            {reply.is_internal_note && (
                              <Badge className="bg-orange-100 text-orange-800">
                                Internal Note
                              </Badge>
                            )}
                          </div>
                          <span className="text-sm text-gray-500">
                            {formatDate(reply.created_at)}
                          </span>
                        </div>
                        <p className="text-gray-600 whitespace-pre-wrap">{reply.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* New Reply */}
            <Card>
              <CardHeader>
                <CardTitle>Add Reply</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <textarea
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                    placeholder="Type your reply..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                  />
                  
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isInternalNote}
                        onChange={(e) => setIsInternalNote(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Internal note (not visible to user)</span>
                      {isInternalNote ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </label>
                    
                    <Button
                      onClick={handleSendReply}
                      disabled={!newReply.trim() || sendingReply}
                      className="flex items-center gap-2"
                    >
                      <Send className="h-4 w-4" />
                      {sendingReply ? 'Sending...' : 'Send Reply'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* User Info */}
            <Card>
              <CardHeader>
                <CardTitle>User Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-gray-700">Name:</span>
                    <p className="text-gray-600">{ticket.user.display_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Email:</span>
                    <p className="text-gray-600">{ticket.user.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ticket Management */}
            <Card>
              <CardHeader>
                <CardTitle>Ticket Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={ticket.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      disabled={updating}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="waiting_user">Waiting User</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assigned to
                    </label>
                    <select
                      value={ticket.assigned_to || ''}
                      onChange={(e) => handleAssignTicket(e.target.value || null)}
                      disabled={updating}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              </CardContent>
            </Card>

            {/* Resolution Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Resolution Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Add resolution notes..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                  />
                  
                  <Button
                    onClick={handleUpdateResolutionNotes}
                    disabled={updating}
                    className="w-full"
                  >
                    {updating ? 'Updating...' : 'Update Notes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
