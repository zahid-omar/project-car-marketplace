'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { 
  AlertTriangle,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  MessageSquare,
  ArrowLeft,
  Flag,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';

interface Report {
  id: string;
  review_id: string;
  reporter_id: string;
  reason: 'spam' | 'inappropriate' | 'fake' | 'harassment' | 'other';
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
  reporter_profile?: {
    display_name: string;
    email: string;
  };
  reported_review?: {
    id: string;
    rating: number;
    review_text: string;
    reviewer_profile?: {
      display_name: string;
      email: string;
    };
    reviewed_user_profile?: {
      display_name: string;
      email: string;
    };
  };
}

export default function ReportsManagementPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'reviewed' | 'resolved' | 'dismissed'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const reportsPerPage = 20;
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    filterReports();
  }, [reports, searchTerm, filterStatus]);

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
      await loadReports();
    } catch (error) {
      console.error('Error checking admin access:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async () => {
    try {
      const { data: reports } = await supabase
        .from('review_reports')
        .select(`
          *,
          reporter_profile:profiles!review_reports_reporter_id_fkey(display_name, email),
          reported_review:user_reviews!review_reports_review_id_fkey(
            id,
            rating,
            review_text,
            reviewer_profile:profiles!user_reviews_reviewer_id_fkey(display_name, email),
            reviewed_user_profile:profiles!user_reviews_reviewed_user_id_fkey(display_name, email)
          )
        `)
        .order('created_at', { ascending: false });

      if (reports) {
        setReports(reports);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    }
  };

  const filterReports = () => {
    let filtered = reports;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(report => 
        report.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.reporter_profile?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.reported_review?.reviewer_profile?.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(report => report.status === filterStatus);
    }

    setFilteredReports(filtered);
    setTotalPages(Math.ceil(filtered.length / reportsPerPage));
    setCurrentPage(1);
  };

  const updateReportStatus = async (reportId: string, newStatus: 'reviewed' | 'resolved' | 'dismissed') => {
    try {
      const { error } = await supabase
        .from('review_reports')
        .update({ status: newStatus })
        .eq('id', reportId);

      if (error) throw error;

      // Update local state
      setReports(reports.map(report => 
        report.id === reportId ? { ...report, status: newStatus } : report
      ));
    } catch (error) {
      console.error('Error updating report status:', error);
    }
  };

  const hideReview = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from('user_reviews')
        .update({ is_hidden: true })
        .eq('id', reviewId);

      if (error) throw error;

      // Update the report to resolved
      const report = reports.find(r => r.review_id === reviewId);
      if (report) {
        await updateReportStatus(report.id, 'resolved');
      }
    } catch (error) {
      console.error('Error hiding review:', error);
    }
  };

  const getCurrentPageReports = () => {
    const startIndex = (currentPage - 1) * reportsPerPage;
    const endIndex = startIndex + reportsPerPage;
    return filteredReports.slice(startIndex, endIndex);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'destructive';
      case 'reviewed':
        return 'secondary';
      case 'resolved':
        return 'default';
      case 'dismissed':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case 'spam':
        return 'outline';
      case 'inappropriate':
        return 'destructive';
      case 'fake':
        return 'secondary';
      case 'harassment':
        return 'destructive';
      case 'other':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reports...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Reports Management</h1>
              <p className="text-gray-600 mt-1">
                Review {filteredReports.length} reports ({reports.length} total)
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
                  placeholder="Search reports..."
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
                  variant={filterStatus === 'pending' ? 'filled' : 'outlined'}
                  onClick={() => setFilterStatus('pending')}
                  size="sm"
                >
                  Pending
                </Button>
                <Button
                  variant={filterStatus === 'reviewed' ? 'filled' : 'outlined'}
                  onClick={() => setFilterStatus('reviewed')}
                  size="sm"
                >
                  Reviewed
                </Button>
                <Button
                  variant={filterStatus === 'resolved' ? 'filled' : 'outlined'}
                  onClick={() => setFilterStatus('resolved')}
                  size="sm"
                >
                  Resolved
                </Button>
                <Button
                  variant={filterStatus === 'dismissed' ? 'filled' : 'outlined'}
                  onClick={() => setFilterStatus('dismissed')}
                  size="sm"
                >
                  Dismissed
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getCurrentPageReports().map((report) => (
                <div key={report.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Badge variant={getReasonColor(report.reason)}>
                          {report.reason.charAt(0).toUpperCase() + report.reason.slice(1)}
                        </Badge>
                        <Badge variant={getStatusColor(report.status)}>
                          {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {formatDate(report.created_at)}
                        </span>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-900">
                          Reported by: {report.reporter_profile?.display_name || 'Unknown'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {report.reporter_profile?.email}
                        </p>
                      </div>

                      {report.description && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-900">Description:</p>
                          <p className="text-sm text-gray-600">{report.description}</p>
                        </div>
                      )}

                      {report.reported_review && (
                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900">
                              Reported Review ({report.reported_review.rating}/5 stars)
                            </span>
                            <span className="text-sm text-gray-600">
                              By: {report.reported_review.reviewer_profile?.display_name || 'Unknown'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">
                            {report.reported_review.review_text}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            About: {report.reported_review.reviewed_user_profile?.display_name || 'Unknown'}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2 ml-4">
                      {report.status === 'pending' && (
                        <>
                          <Button
                            variant="outlined"
                            size="sm"
                            onClick={() => updateReportStatus(report.id, 'reviewed')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outlined"
                            size="sm"
                            onClick={() => hideReview(report.review_id)}
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outlined"
                            size="sm"
                            onClick={() => updateReportStatus(report.id, 'dismissed')}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {report.status === 'reviewed' && (
                        <>
                          <Button
                            variant="outlined"
                            size="sm"
                            onClick={() => hideReview(report.review_id)}
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outlined"
                            size="sm"
                            onClick={() => updateReportStatus(report.id, 'dismissed')}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredReports.length === 0 && (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No reports found</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * reportsPerPage + 1} to {Math.min(currentPage * reportsPerPage, filteredReports.length)} of {filteredReports.length} reports
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
