'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { 
  HelpCircle, 
  MessageSquare, 
  Mail, 
  Search,
  BookOpen,
  HeadphonesIcon,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  view_count: number;
  category: {
    name: string;
  };
}

export default function HelpCenter() {
  const [searchTerm, setSearchTerm] = useState('');
  const [popularFAQs, setPopularFAQs] = useState<FAQItem[]>([]);
  const [recentTickets, setRecentTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium'
  });

  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadHelpCenterData();
  }, []);

  const loadHelpCenterData = async () => {
    try {
      setLoading(true);
      
      // Load popular FAQs
      const { data: faqData, error: faqError } = await supabase
        .from('faq_items')
        .select(`
          id,
          question,
          answer,
          view_count,
          faq_categories!inner(name)
        `)
        .eq('is_active', true)
        .order('view_count', { ascending: false })
        .limit(5);

      if (faqError) throw faqError;
      
      // Transform the data to match our interface
      const transformedFAQs = (faqData || []).map((item: any) => ({
        id: item.id,
        question: item.question,
        answer: item.answer,
        view_count: item.view_count,
        category: {
          name: item.faq_categories.name
        }
      }));
      
      setPopularFAQs(transformedFAQs);

      // Load recent tickets for logged-in user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: ticketsData, error: ticketsError } = await supabase
          .from('support_tickets')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3);

        if (ticketsError) throw ticketsError;
        setRecentTickets(ticketsData || []);
      }
    } catch (error) {
      console.error('Error loading help center data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { error } = await supabase
        .from('support_tickets')
        .insert([{
          user_id: user.id,
          title: ticketForm.title,
          description: ticketForm.description,
          category: ticketForm.category,
          priority: ticketForm.priority
        }]);

      if (error) throw error;

      setTicketForm({
        title: '',
        description: '',
        category: '',
        priority: 'medium'
      });
      setShowTicketForm(false);
      loadHelpCenterData();
      
      // Show success message
      alert('Support ticket created successfully!');
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert('Error creating support ticket. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-blue-600';
      case 'in_progress': return 'text-yellow-600';
      case 'waiting_user': return 'text-orange-600';
      case 'resolved': return 'text-green-600';
      case 'closed': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <Clock size={16} />;
      case 'in_progress': return <AlertCircle size={16} />;
      case 'waiting_user': return <MessageSquare size={16} />;
      case 'resolved': return <CheckCircle size={16} />;
      case 'closed': return <CheckCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const searchFAQs = () => {
    if (searchTerm.trim()) {
      router.push(`/faq?search=${encodeURIComponent(searchTerm)}`);
    } else {
      router.push('/faq');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchFAQs();
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading help center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <HelpCircle size={48} className="text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Help Center</h1>
        <p className="text-gray-600">
          Get the help you need with Project Car Marketplace
        </p>
      </div>

      {/* Search */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search for help articles, guides, and FAQs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10 pr-20"
              />
              <Button
                onClick={searchFAQs}
                className="absolute right-1 top-1 h-8"
              >
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/faq')}>
          <CardContent className="text-center py-8">
            <BookOpen size={48} className="mx-auto mb-4 text-blue-600" />
            <h3 className="text-lg font-semibold mb-2">Browse FAQs</h3>
            <p className="text-gray-600">Find answers to commonly asked questions</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowTicketForm(true)}>
          <CardContent className="text-center py-8">
            <FileText size={48} className="mx-auto mb-4 text-green-600" />
            <h3 className="text-lg font-semibold mb-2">Create Ticket</h3>
            <p className="text-gray-600">Submit a support request for personalized help</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="text-center py-8">
            <MessageSquare size={48} className="mx-auto mb-4 text-purple-600" />
            <h3 className="text-lg font-semibold mb-2">Live Chat</h3>
            <p className="text-gray-600">Chat with our support team in real-time</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Popular FAQs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle size={20} />
              Popular FAQs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {popularFAQs.map((faq) => (
                <div key={faq.id} className="border-b pb-3 last:border-b-0">
                  <h4 className="font-medium mb-2 cursor-pointer hover:text-blue-600" 
                      onClick={() => router.push(`/faq#${faq.id}`)}>
                    {faq.question}
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">
                    {faq.answer.length > 100 ? faq.answer.substring(0, 100) + '...' : faq.answer}
                  </p>
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    {faq.category?.name}
                  </span>
                </div>
              ))}
              <Button 
                variant="outlined" 
                className="w-full"
                onClick={() => router.push('/faq')}
              >
                View All FAQs
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Support Tickets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HeadphonesIcon size={20} />
              Your Recent Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentTickets.length === 0 ? (
              <div className="text-center py-8">
                <FileText size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-4">No support tickets yet</p>
                <Button onClick={() => setShowTicketForm(true)}>
                  Create Your First Ticket
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentTickets.map((ticket) => (
                  <div key={ticket.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{ticket.title}</h4>
                      <div className={`flex items-center gap-1 text-sm ${getStatusColor(ticket.status)}`}>
                        {getStatusIcon(ticket.status)}
                        {ticket.status.replace('_', ' ')}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {ticket.description.length > 100 
                        ? ticket.description.substring(0, 100) + '...' 
                        : ticket.description}
                    </p>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>Category: {ticket.category}</span>
                      <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
                <Button 
                  variant="outlined" 
                  className="w-full"
                  onClick={() => router.push('/support')}
                >
                  View All Tickets
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Ticket Modal */}
      {showTicketForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Create Support Ticket</h2>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Subject</label>
                <Input
                  placeholder="Brief description of your issue"
                  value={ticketForm.title}
                  onChange={(e) => setTicketForm({
                    ...ticketForm,
                    title: e.target.value
                  })}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={ticketForm.category}
                  onChange={(e) => setTicketForm({
                    ...ticketForm,
                    category: e.target.value
                  })}
                  required
                >
                  <option value="">Select Category</option>
                  <option value="account">Account Issues</option>
                  <option value="bug">Bug Report</option>
                  <option value="feature">Feature Request</option>
                  <option value="payment">Payment Issues</option>
                  <option value="general">General Question</option>
                  <option value="abuse">Report Abuse</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={ticketForm.priority}
                  onChange={(e) => setTicketForm({
                    ...ticketForm,
                    priority: e.target.value
                  })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-md"
                  rows={4}
                  placeholder="Detailed description of your issue"
                  value={ticketForm.description}
                  onChange={(e) => setTicketForm({
                    ...ticketForm,
                    description: e.target.value
                  })}
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">Create Ticket</Button>
                <Button type="button" variant="outlined" onClick={() => setShowTicketForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
