'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { 
  Car,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  DollarSign,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';

interface Listing {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  status: 'active' | 'sold' | 'deleted';
  created_at: string;
  updated_at: string;
  user_id: string;
  user_profile?: {
    display_name: string;
    email: string;
  };
  listing_images?: Array<{
    image_url: string;
    is_primary: boolean;
  }>;
  modifications?: Array<{
    name: string;
    category: string;
  }>;
}

export default function ListingsManagementPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'sold' | 'deleted'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const listingsPerPage = 20;
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    filterListings();
  }, [listings, searchTerm, filterStatus]);

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
      await loadListings();
    } catch (error) {
      console.error('Error checking admin access:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const loadListings = async () => {
    try {
      const { data: listings } = await supabase
        .from('listings')
        .select(`
          *,
          user_profile:profiles!listings_user_id_fkey(display_name, email),
          listing_images(image_url, is_primary),
          modifications(name, category)
        `)
        .order('created_at', { ascending: false });

      if (listings) {
        setListings(listings);
      }
    } catch (error) {
      console.error('Error loading listings:', error);
    }
  };

  const filterListings = () => {
    let filtered = listings;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(listing => 
        listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.user_profile?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.user_profile?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(listing => listing.status === filterStatus);
    }

    setFilteredListings(filtered);
    setTotalPages(Math.ceil(filtered.length / listingsPerPage));
    setCurrentPage(1);
  };

  const updateListingStatus = async (listingId: string, newStatus: 'active' | 'sold' | 'deleted') => {
    try {
      const { error } = await supabase
        .from('listings')
        .update({ 
          status: newStatus,
          ...(newStatus === 'sold' ? { sold_at: new Date().toISOString() } : {})
        })
        .eq('id', listingId);

      if (error) throw error;

      // Update local state
      setListings(listings.map(listing => 
        listing.id === listingId ? { ...listing, status: newStatus } : listing
      ));
    } catch (error) {
      console.error('Error updating listing status:', error);
    }
  };

  const deleteListing = async (listingId: string) => {
    if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('listings')
        .update({ status: 'deleted' })
        .eq('id', listingId);

      if (error) throw error;

      // Update local state
      setListings(listings.map(listing => 
        listing.id === listingId ? { ...listing, status: 'deleted' } : listing
      ));
    } catch (error) {
      console.error('Error deleting listing:', error);
    }
  };

  const getCurrentPageListings = () => {
    const startIndex = (currentPage - 1) * listingsPerPage;
    const endIndex = startIndex + listingsPerPage;
    return filteredListings.slice(startIndex, endIndex);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'sold':
        return 'secondary';
      case 'deleted':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading listings...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Listings Management</h1>
              <p className="text-gray-600 mt-1">
                Manage {filteredListings.length} listings ({listings.length} total)
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
                  placeholder="Search listings..."
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
                  variant={filterStatus === 'sold' ? 'filled' : 'outlined'}
                  onClick={() => setFilterStatus('sold')}
                  size="sm"
                >
                  Sold
                </Button>
                <Button
                  variant={filterStatus === 'deleted' ? 'filled' : 'outlined'}
                  onClick={() => setFilterStatus('deleted')}
                  size="sm"
                >
                  Deleted
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Listings List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Car className="w-5 h-5 mr-2" />
              Listings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Vehicle</th>
                    <th className="text-left py-3 px-4">Seller</th>
                    <th className="text-left py-3 px-4">Price</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Created</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getCurrentPageListings().map((listing) => (
                    <tr key={listing.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <div className="w-16 h-12 bg-gray-200 rounded-lg mr-3 overflow-hidden">
                            {listing.listing_images?.find(img => img.is_primary)?.image_url ? (
                              <img
                                src={listing.listing_images.find(img => img.is_primary)?.image_url}
                                alt={listing.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Car className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {listing.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {listing.year} {listing.make} {listing.model}
                            </div>
                            {listing.modifications && listing.modifications.length > 0 && (
                              <div className="text-xs text-blue-600 mt-1">
                                {listing.modifications.length} modifications
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {listing.user_profile?.display_name || 'No name'}
                          </div>
                          <div className="text-gray-500">
                            {listing.user_profile?.email}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-900">
                          {formatPrice(listing.price)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant={getStatusColor(listing.status)}>
                          {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-600">
                          {formatDate(listing.created_at)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex space-x-2">
                          <Button
                            variant="outlined"
                            size="sm"
                            onClick={() => router.push(`/listings/${listing.id}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {listing.status === 'active' && (
                            <Button
                              variant="outlined"
                              size="sm"
                              onClick={() => updateListingStatus(listing.id, 'sold')}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          {listing.status === 'sold' && (
                            <Button
                              variant="outlined"
                              size="sm"
                              onClick={() => updateListingStatus(listing.id, 'active')}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          )}
                          {listing.status !== 'deleted' && (
                            <Button
                              variant="outlined"
                              size="sm"
                              onClick={() => deleteListing(listing.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
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
                  Showing {(currentPage - 1) * listingsPerPage + 1} to {Math.min(currentPage * listingsPerPage, filteredListings.length)} of {filteredListings.length} listings
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
