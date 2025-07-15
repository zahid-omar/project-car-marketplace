'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Activity,
  Key,
  Database,
  Globe,
  RefreshCw,
  Download,
  Eye,
  Search
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { withAdminAuth, PERMISSIONS } from '@/lib/admin-auth';

interface SecurityEvent {
  id: string;
  type: 'failed_login' | 'suspicious_activity' | 'admin_action' | 'data_access' | 'policy_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  user_id?: string;
  user_email?: string;
  ip_address?: string;
  user_agent?: string;
  description: string;
  details: any;
  created_at: string;
  resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
}

interface SecuritySummary {
  total_events: number;
  critical_events: number;
  high_events: number;
  unresolved_events: number;
  failed_logins_24h: number;
  suspicious_ips: number;
  admin_actions_24h: number;
  rls_violations: number;
}

function SecurityAuditPage() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [summary, setSummary] = useState<SecuritySummary>({
    total_events: 0,
    critical_events: 0,
    high_events: 0,
    unresolved_events: 0,
    failed_logins_24h: 0,
    suspicious_ips: 0,
    admin_actions_24h: 0,
    rls_violations: 0
  });
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      
      // Generate mock security events for demonstration
      const mockEvents: SecurityEvent[] = [
        {
          id: '1',
          type: 'failed_login',
          severity: 'medium',
          user_email: 'suspicious@example.com',
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          description: 'Multiple failed login attempts',
          details: { attempts: 5, duration: '10 minutes' },
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          resolved: false
        },
        {
          id: '2',
          type: 'admin_action',
          severity: 'high',
          user_id: 'admin-1',
          user_email: 'admin@example.com',
          ip_address: '10.0.0.1',
          description: 'User role changed to admin',
          details: { target_user: 'user123', previous_role: 'user', new_role: 'admin' },
          created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          resolved: true,
          resolved_by: 'admin-1',
          resolved_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          type: 'suspicious_activity',
          severity: 'critical',
          user_id: 'user-123',
          user_email: 'user@example.com',
          ip_address: '185.220.101.50',
          description: 'Unusual data access pattern detected',
          details: { queries: 150, tables: ['profiles', 'listings', 'messages'], duration: '5 minutes' },
          created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          resolved: false
        },
        {
          id: '4',
          type: 'policy_violation',
          severity: 'high',
          user_id: 'user-456',
          user_email: 'violator@example.com',
          ip_address: '192.168.1.200',
          description: 'Attempted to access restricted data',
          details: { table: 'admin_activity_log', action: 'SELECT', denied: true },
          created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          resolved: false
        },
        {
          id: '5',
          type: 'data_access',
          severity: 'medium',
          user_id: 'user-789',
          user_email: 'researcher@example.com',
          ip_address: '203.0.113.42',
          description: 'Bulk data export attempted',
          details: { records: 1000, table: 'listings', format: 'CSV' },
          created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          resolved: true,
          resolved_by: 'admin-1',
          resolved_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString()
        }
      ];

      setEvents(mockEvents);

      // Calculate summary
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const summary: SecuritySummary = {
        total_events: mockEvents.length,
        critical_events: mockEvents.filter(e => e.severity === 'critical').length,
        high_events: mockEvents.filter(e => e.severity === 'high').length,
        unresolved_events: mockEvents.filter(e => !e.resolved).length,
        failed_logins_24h: mockEvents.filter(e => 
          e.type === 'failed_login' && 
          new Date(e.created_at) > yesterday
        ).length,
        suspicious_ips: new Set(
          mockEvents
            .filter(e => e.severity === 'critical' || e.severity === 'high')
            .map(e => e.ip_address)
        ).size,
        admin_actions_24h: mockEvents.filter(e => 
          e.type === 'admin_action' && 
          new Date(e.created_at) > yesterday
        ).length,
        rls_violations: mockEvents.filter(e => e.type === 'policy_violation').length
      };

      setSummary(summary);
    } catch (error) {
      console.error('Error loading security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'failed_login': return <Key className="w-4 h-4" />;
      case 'suspicious_activity': return <AlertTriangle className="w-4 h-4" />;
      case 'admin_action': return <Shield className="w-4 h-4" />;
      case 'data_access': return <Database className="w-4 h-4" />;
      case 'policy_violation': return <XCircle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const resolveEvent = async (eventId: string) => {
    setEvents(prev => 
      prev.map(event => 
        event.id === eventId 
          ? { ...event, resolved: true, resolved_at: new Date().toISOString() }
          : event
      )
    );
  };

  const exportSecurityReport = () => {
    const report = {
      generated_at: new Date().toISOString(),
      summary,
      events: events.map(event => ({
        ...event,
        details: JSON.stringify(event.details)
      }))
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredEvents = events.filter(event => {
    const matchesSeverity = selectedSeverity === 'all' || event.severity === selectedSeverity;
    const matchesSearch = searchTerm === '' || 
      event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.ip_address?.includes(searchTerm);
    return matchesSeverity && matchesSearch;
  });

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading security audit...</p>
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
              <Shield className="w-8 h-8 mr-3" />
              Security Audit
            </h1>
            <p className="text-gray-600 mt-1">Monitor and investigate security events</p>
          </div>
          <div className="flex space-x-3">
            <Button onClick={loadSecurityData} variant="outlined" className="flex items-center">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={exportSecurityReport} className="flex items-center">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Security Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Events</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.total_events}</p>
                </div>
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Critical Events</p>
                  <p className="text-2xl font-bold text-red-600">{summary.critical_events}</p>
                  <p className="text-xs text-gray-500">{summary.high_events} high priority</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Unresolved</p>
                  <p className="text-2xl font-bold text-orange-600">{summary.unresolved_events}</p>
                  <p className="text-xs text-gray-500">require attention</p>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Failed Logins (24h)</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.failed_logins_24h}</p>
                  <p className="text-xs text-gray-500">{summary.suspicious_ips} suspicious IPs</p>
                </div>
                <Key className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Admin Actions (24h)</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.admin_actions_24h}</p>
                  <p className="text-xs text-gray-500">administrative changes</p>
                </div>
                <Shield className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">RLS Violations</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.rls_violations}</p>
                  <p className="text-xs text-gray-500">policy violations</p>
                </div>
                <Database className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search events, users, or IP addresses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex space-x-2">
            {['all', 'critical', 'high', 'medium', 'low'].map(severity => (
              <Button
                key={severity}
                variant={selectedSeverity === severity ? 'filled' : 'outlined'}
                onClick={() => setSelectedSeverity(severity)}
                className="capitalize"
              >
                {severity}
              </Button>
            ))}
          </div>
        </div>

        {/* Events List */}
        <Card>
          <CardHeader>
            <CardTitle>Security Events ({filteredEvents.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredEvents.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No security events found matching your criteria.</p>
              ) : (
                filteredEvents.map((event) => (
                  <div key={event.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0">
                      {getTypeIcon(event.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge className={getSeverityColor(event.severity)}>
                            {event.severity}
                          </Badge>
                          <span className="text-sm font-medium text-gray-900 capitalize">
                            {event.type.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">
                            {new Date(event.created_at).toLocaleString()}
                          </span>
                          {event.resolved ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Button
                              onClick={() => resolveEvent(event.id)}
                              variant="outlined"
                              className="text-xs py-1 px-2"
                            >
                              Resolve
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{event.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        {event.user_email && (
                          <span className="flex items-center">
                            <User className="w-3 h-3 mr-1" />
                            {event.user_email}
                          </span>
                        )}
                        {event.ip_address && (
                          <span className="flex items-center">
                            <Globe className="w-3 h-3 mr-1" />
                            {event.ip_address}
                          </span>
                        )}
                      </div>
                      {event.details && (
                        <details className="mt-2">
                          <summary className="text-xs text-blue-600 cursor-pointer hover:underline">
                            View details
                          </summary>
                          <pre className="text-xs bg-gray-50 p-2 rounded mt-2 overflow-x-auto">
                            {JSON.stringify(event.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

export default withAdminAuth(SecurityAuditPage, PERMISSIONS.SYSTEM_SETTINGS);
