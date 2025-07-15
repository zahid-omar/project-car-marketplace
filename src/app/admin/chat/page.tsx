'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { 
  MessageSquare, 
  User, 
  Clock, 
  CheckCircle,
  XCircle,
  Star,
  Search,
  Filter,
  Send,
  Eye
} from 'lucide-react';

interface ChatSession {
  id: string;
  user_id: string;
  admin_id: string | null;
  status: 'waiting' | 'active' | 'ended';
  subject: string | null;
  initial_message: string | null;
  started_at: string;
  ended_at: string | null;
  rating: number | null;
  feedback: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    display_name: string;
  };
  admin?: {
    id: string;
    email: string;
    display_name: string;
  };
  message_count?: number;
  last_message?: string;
  last_message_time?: string;
}

interface ChatMessage {
  id: string;
  session_id: string;
  sender_id: string;
  message: string;
  message_type: 'text' | 'system' | 'file';
  is_read: boolean;
  created_at: string;
  sender?: {
    id: string;
    email: string;
    display_name: string;
  };
}

export default function LiveChatManagement() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [newMessage, setNewMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    waitingSessions: 0,
    activeSessions: 0,
    endedSessions: 0,
    avgRating: 0,
    totalSessions: 0
  });

  const router = useRouter();
  const supabase = createClientComponentClient();
  const itemsPerPage = 10;

  useEffect(() => {
    checkAdminAccess();
    loadSessions();
    loadStats();
  }, [currentPage, searchTerm, statusFilter]);

  useEffect(() => {
    if (selectedSession) {
      loadMessages(selectedSession.id);
    }
  }, [selectedSession]);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!profile?.is_admin) {
        router.push('/');
        return;
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
      router.push('/');
    }
  };

  const loadSessions = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('live_chat_sessions')
        .select(`
          *,
          user:profiles!live_chat_sessions_user_id_fkey(id, email, display_name),
          admin:profiles!live_chat_sessions_admin_id_fkey(id, email, display_name)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (searchTerm) {
        query = query.or(`subject.ilike.%${searchTerm}%,initial_message.ilike.%${searchTerm}%`);
      }

      const { data, error, count } = await query
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

      if (error) throw error;

      // Get message counts for each session
      const sessionsWithCounts = await Promise.all(
        (data || []).map(async (session) => {
          const { count: messageCount } = await supabase
            .from('live_chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', session.id);

          const { data: lastMessage } = await supabase
            .from('live_chat_messages')
            .select('message, created_at')
            .eq('session_id', session.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...session,
            message_count: messageCount || 0,
            last_message: lastMessage?.message || null,
            last_message_time: lastMessage?.created_at || null
          };
        })
      );

      setSessions(sessionsWithCounts);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('live_chat_messages')
        .select(`
          *,
          sender:profiles!live_chat_messages_sender_id_fkey(id, email, display_name)
        `)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadStats = async () => {
    try {
      const { data: sessionsData, error } = await supabase
        .from('live_chat_sessions')
        .select('status, rating');

      if (error) throw error;

      const waiting = sessionsData?.filter(s => s.status === 'waiting').length || 0;
      const active = sessionsData?.filter(s => s.status === 'active').length || 0;
      const ended = sessionsData?.filter(s => s.status === 'ended').length || 0;
      const ratings = sessionsData?.filter(s => s.rating !== null).map(s => s.rating) || [];
      const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

      setStats({
        waitingSessions: waiting,
        activeSessions: active,
        endedSessions: ended,
        avgRating: Math.round(avgRating * 10) / 10,
        totalSessions: sessionsData?.length || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleAssignSession = async (sessionId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('live_chat_sessions')
        .update({
          admin_id: user.id,
          status: 'active'
        })
        .eq('id', sessionId);

      if (error) throw error;

      loadSessions();
      loadStats();
    } catch (error) {
      console.error('Error assigning session:', error);
    }
  };

  const handleEndSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('live_chat_sessions')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;

      loadSessions();
      loadStats();
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedSession) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('live_chat_messages')
        .insert([{
          session_id: selectedSession.id,
          sender_id: user.id,
          message: newMessage.trim(),
          message_type: 'text'
        }]);

      if (error) throw error;

      setNewMessage('');
      loadMessages(selectedSession.id);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'ended': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'waiting': return <Clock size={16} />;
      case 'active': return <CheckCircle size={16} />;
      case 'ended': return <XCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Live Chat Management</h1>
          <p className="text-gray-600">Manage live chat sessions and customer support</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Waiting</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.waitingSessions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeSessions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ended</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.endedSessions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              <Star size={20} className="text-yellow-500" />
              {stats.avgRating}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSessions}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sessions List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare size={20} />
                Chat Sessions
              </CardTitle>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Search sessions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  className="px-3 py-2 border rounded-md"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="waiting">Waiting</option>
                  <option value="active">Active</option>
                  <option value="ended">Ended</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <div className="space-y-2">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedSession?.id === session.id
                          ? 'bg-blue-50 border-blue-200'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedSession(session)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User size={14} />
                          <span className="font-medium text-sm">
                            {session.user?.display_name || session.user?.email || 'Unknown User'}
                          </span>
                        </div>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusColor(session.status)}`}>
                          {getStatusIcon(session.status)}
                          {session.status}
                        </div>
                      </div>
                      
                      {session.subject && (
                        <p className="text-sm font-medium mb-1">{session.subject}</p>
                      )}
                      
                      {session.last_message && (
                        <p className="text-xs text-gray-600 mb-1 truncate">
                          {session.last_message}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>
                          {session.message_count || 0} messages
                        </span>
                        <span>
                          {formatTime(session.created_at)}
                        </span>
                      </div>
                      
                      {session.status === 'waiting' && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAssignSession(session.id);
                          }}
                          size="sm"
                          className="w-full mt-2"
                        >
                          Assign to Me
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chat View */}
        <div className="lg:col-span-2">
          {selectedSession ? (
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare size={20} />
                      Chat with {selectedSession.user?.display_name || selectedSession.user?.email}
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      {selectedSession.subject || 'No subject'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(selectedSession.status)}>
                      {selectedSession.status}
                    </Badge>
                    {selectedSession.status === 'active' && (
                      <Button
                        onClick={() => handleEndSession(selectedSession.id)}
                        variant="outlined"
                        size="sm"
                      >
                        End Session
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender_id === selectedSession.user_id ? 'justify-start' : 'justify-end'
                      }`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-2 rounded-lg ${
                          message.sender_id === selectedSession.user_id
                            ? 'bg-gray-100 text-gray-900'
                            : 'bg-blue-500 text-white'
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Message Input */}
                {selectedSession.status === 'active' && (
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1"
                    />
                    <Button type="submit" disabled={!newMessage.trim()}>
                      <Send size={16} />
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="h-[600px] flex items-center justify-center">
              <div className="text-center">
                <MessageSquare size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">Select a chat session to view messages</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            variant="outlined"
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            variant="outlined"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
