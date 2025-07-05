'use client'

import { useAuth, withAuth } from '@/lib/auth'
import { useDashboard } from '@/lib/hooks/useDashboard'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import LoadingSpinner from '@/components/LoadingSpinner'
import OfferManagement from '@/components/OfferManagement'
import SentOffers from '@/components/SentOffers'
import OfferAnalytics from '@/components/OfferAnalytics'
import FavoritesManagement from '@/components/FavoritesManagement'
import { DashboardListing } from '@/types/dashboard'
import AppLayout from '@/components/AppLayout'

function DashboardPage() {
  const { user, signOut } = useAuth()
  const {
    listings,
    analytics,
    loading,
    error,
    filters,
    setFilters,
    deleteListing,
    markAsSold,
    reactivateListing,
    refreshData,
    testAuth
  } = useDashboard()

  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [debugMode, setDebugMode] = useState(false)

  const handleDeleteListing = async (listingId: string) => {
    if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return
    }

    setActionLoading(listingId)
    const success = await deleteListing(listingId)
    setActionLoading(null)

    if (success) {
      alert('Listing deleted successfully')
    }
  }

  const handleMarkAsSold = async (listingId: string) => {
    const soldPrice = prompt('Enter the sold price (optional):')
    const price = soldPrice ? parseFloat(soldPrice) : undefined

    if (soldPrice && isNaN(price!)) {
      alert('Please enter a valid price')
      return
    }

    setActionLoading(listingId)
    const success = await markAsSold(listingId, { soldPrice: price })
    setActionLoading(null)

    if (success) {
      alert('Listing marked as sold successfully')
    }
  }

  const handleReactivate = async (listingId: string) => {
    if (!confirm('Are you sure you want to reactivate this listing?')) {
      return
    }

    setActionLoading(listingId)
    const success = await reactivateListing(listingId)
    setActionLoading(null)

    if (success) {
      alert('Listing reactivated successfully')
    }
  }

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await signOut()
    }
  }

  const handleCreateTestListing = async () => {
    try {
      setActionLoading('test-listing')
      
      const response = await fetch('/api/test/add-listing', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create test listing')
      }
      
      const result = await response.json()
      console.log('Test listing created:', result)
      
      alert('Test listing created successfully!')
      
      // Refresh the dashboard to show the new listing
      await refreshData()
      
    } catch (error) {
      console.error('Error creating test listing:', error)
      alert(`Failed to create test listing: ${error.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      active: 'bg-md-sys-secondary-container text-md-sys-on-secondary-container border border-md-sys-secondary-container/20',
      sold: 'bg-md-sys-primary-container text-md-sys-on-primary-container border border-md-sys-primary-container/20',
      draft: 'bg-md-sys-surface-container-high text-md-sys-on-surface border border-md-sys-outline-variant'
    }

    return (
      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-md-label-medium font-medium ${statusStyles[status as keyof typeof statusStyles] || statusStyles.draft}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  if (loading && !listings.length) {
    return (
      <AppLayout showNavigation={true}>
        <div className="min-h-screen bg-md-sys-surface flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout showNavigation={true} className="bg-md-sys-surface">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-md-display-small font-bold text-md-sys-on-surface">
            Welcome back, {user?.user_metadata?.display_name || user?.email?.split('@')[0]}!
          </h1>
          <p className="text-md-body-large text-md-sys-on-surface-variant mt-2">Manage your listings and track your sales performance.</p>
          
          {/* Debug Toggle - Enhanced Button */}
          <button
            onClick={() => setDebugMode(!debugMode)}
            className="mt-4 bg-md-sys-surface-container text-md-sys-on-surface px-4 py-2 rounded-xl border border-md-sys-outline-variant hover:bg-md-sys-surface-container-high transition-all duration-200 text-md-label-medium font-medium focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20"
          >
            {debugMode ? 'Hide' : 'Show'} Debug Info
          </button>
        </div>

        {/* Debug Section - Enhanced Button Styling */}
        {debugMode && (
          <div className="mb-6 bg-md-sys-surface-container border border-md-sys-outline-variant rounded-3xl p-6 shadow-md-elevation-1">
            <h3 className="text-md-title-large font-semibold text-md-sys-on-surface mb-4">Debug Information</h3>
            <div className="text-md-body-medium text-md-sys-on-surface-variant space-y-2 mb-6">
              <p><strong className="text-md-sys-on-surface">User ID:</strong> {user?.id || 'No user ID'}</p>
              <p><strong className="text-md-sys-on-surface">User Email:</strong> {user?.email || 'No email'}</p>
              <p><strong className="text-md-sys-on-surface">Auth Status:</strong> {user ? 'Authenticated' : 'Not authenticated'}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={testAuth}
                className="bg-md-sys-tertiary text-md-sys-on-tertiary px-4 py-2.5 rounded-xl hover:bg-md-sys-tertiary/90 transition-all duration-200 text-md-label-large font-medium focus:outline-none focus:ring-2 focus:ring-md-sys-tertiary/20 shadow-md-elevation-1"
              >
                Test Auth
              </button>
              <button
                onClick={refreshData}
                className="bg-md-sys-secondary text-md-sys-on-secondary px-4 py-2.5 rounded-xl hover:bg-md-sys-secondary/90 transition-all duration-200 text-md-label-large font-medium focus:outline-none focus:ring-2 focus:ring-md-sys-secondary/20 shadow-md-elevation-1"
              >
                Refresh Data
              </button>
              <button
                onClick={handleCreateTestListing}
                disabled={actionLoading === 'test-listing'}
                className="bg-md-sys-primary text-md-sys-on-primary px-4 py-2.5 rounded-xl hover:bg-md-sys-primary/90 transition-all duration-200 text-md-label-large font-medium focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 shadow-md-elevation-1 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {actionLoading === 'test-listing' ? 'Creating...' : 'Create Test Listing'}
              </button>
            </div>
          </div>
        )}

        {/* Error Alert - Enhanced Button Styling */}
        {error && (
          <div className="mb-6 bg-md-sys-error-container border border-md-sys-error/20 rounded-3xl p-6 shadow-md-elevation-1">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-md-title-large font-semibold text-md-sys-on-error-container">Error</h3>
                <p className="text-md-body-large text-md-sys-on-error-container mt-2">{error}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={refreshData}
                    className="bg-md-sys-error text-md-sys-on-error px-4 py-2.5 rounded-xl hover:bg-md-sys-error/90 transition-all duration-200 text-md-label-large font-medium focus:outline-none focus:ring-2 focus:ring-md-sys-error/20 shadow-md-elevation-1"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="bg-md-sys-surface-container text-md-sys-on-surface px-4 py-2.5 rounded-xl border border-md-sys-outline-variant hover:bg-md-sys-surface-container-high transition-all duration-200 text-md-label-large font-medium focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20"
                  >
                    Sign Out & Back In
                  </button>
                  <button
                    onClick={() => setDebugMode(true)}
                    className="bg-md-sys-surface-container text-md-sys-on-surface px-4 py-2.5 rounded-xl border border-md-sys-outline-variant hover:bg-md-sys-surface-container-high transition-all duration-200 text-md-label-large font-medium focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20"
                  >
                    Show Debug Info
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Overview - Enhanced Statistics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-md-sys-surface-container rounded-3xl shadow-md-elevation-2 p-8 hover:shadow-md-elevation-3 transition-all duration-200 border border-md-sys-outline-variant/50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-md-body-large font-medium text-md-sys-on-surface-variant mb-2">Total Listings</p>
                  <p className="text-md-display-large font-bold text-md-sys-on-surface">{analytics.overview.totalListings}</p>
                </div>
                <div className="w-16 h-16 bg-md-sys-tertiary-container rounded-full flex items-center justify-center shadow-md-elevation-1">
                  <span className="text-2xl">📋</span>
                </div>
              </div>
            </div>

            <div className="bg-md-sys-surface-container rounded-3xl shadow-md-elevation-2 p-8 hover:shadow-md-elevation-3 transition-all duration-200 border border-md-sys-outline-variant/50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-md-body-large font-medium text-md-sys-on-surface-variant mb-2">Active Listings</p>
                  <p className="text-md-display-large font-bold text-md-sys-secondary">{analytics.overview.activeListings}</p>
                </div>
                <div className="w-16 h-16 bg-md-sys-secondary-container rounded-full flex items-center justify-center shadow-md-elevation-1">
                  <span className="text-2xl">✅</span>
                </div>
              </div>
            </div>

            <div className="bg-md-sys-surface-container rounded-3xl shadow-md-elevation-2 p-8 hover:shadow-md-elevation-3 transition-all duration-200 border border-md-sys-outline-variant/50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-md-body-large font-medium text-md-sys-on-surface-variant mb-2">Sold Listings</p>
                  <p className="text-md-display-large font-bold text-md-sys-primary">{analytics.overview.soldListings}</p>
                </div>
                <div className="w-16 h-16 bg-md-sys-primary-container rounded-full flex items-center justify-center shadow-md-elevation-1">
                  <span className="text-2xl">💰</span>
                </div>
              </div>
            </div>

            <div className="bg-md-sys-surface-container rounded-3xl shadow-md-elevation-2 p-8 hover:shadow-md-elevation-3 transition-all duration-200 border border-md-sys-outline-variant/50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-md-body-large font-medium text-md-sys-on-surface-variant mb-2">Conversion Rate</p>
                  <p className="text-md-display-large font-bold text-md-sys-tertiary">{analytics.overview.conversionRate}%</p>
                </div>
                <div className="w-16 h-16 bg-md-sys-tertiary-container rounded-full flex items-center justify-center shadow-md-elevation-1">
                  <span className="text-2xl">📈</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions - Smaller Height, Enhanced Design */}
        <div className="grid md:grid-cols-5 gap-4 mb-8">
          <Link
            href="/sell"
            className="bg-md-sys-surface-container-low rounded-2xl shadow-md-elevation-1 p-4 hover:shadow-md-elevation-2 transition-all duration-200 hover:scale-105 group border border-md-sys-outline-variant/30"
          >
            <div className="text-center">
              <div className="w-10 h-10 bg-md-sys-primary rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-md-sys-primary/90 transition-colors duration-200">
                <span className="text-lg text-md-sys-on-primary">+</span>
              </div>
              <h3 className="text-md-title-medium font-semibold text-md-sys-on-surface mb-1">List a Car</h3>
              <p className="text-md-body-small text-md-sys-on-surface-variant">Sell your project car</p>
            </div>
          </Link>

          <button
            onClick={() => document.getElementById('favorites-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-md-sys-surface-container-low rounded-2xl shadow-md-elevation-1 p-4 hover:shadow-md-elevation-2 transition-all duration-200 hover:scale-105 group border border-md-sys-outline-variant/30"
          >
            <div className="text-center">
              <div className="w-10 h-10 bg-md-sys-error rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-md-sys-error/90 transition-colors duration-200">
                <span className="text-lg text-md-sys-on-error">❤️</span>
              </div>
              <h3 className="text-md-title-medium font-semibold text-md-sys-on-surface mb-1">My Favorites</h3>
              <p className="text-md-body-small text-md-sys-on-surface-variant">View saved listings</p>
            </div>
          </button>

          <button
            onClick={refreshData}
            className="bg-md-sys-surface-container-low rounded-2xl shadow-md-elevation-1 p-4 hover:shadow-md-elevation-2 transition-all duration-200 hover:scale-105 group border border-md-sys-outline-variant/30"
          >
            <div className="text-center">
              <div className="w-10 h-10 bg-md-sys-secondary rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-md-sys-secondary/90 transition-colors duration-200">
                <span className="text-lg text-md-sys-on-secondary">🔄</span>
              </div>
              <h3 className="text-md-title-medium font-semibold text-md-sys-on-surface mb-1">Refresh Data</h3>
              <p className="text-md-body-small text-md-sys-on-surface-variant">Update your dashboard</p>
            </div>
          </button>

          <Link
            href="/browse"
            className="bg-md-sys-surface-container-low rounded-2xl shadow-md-elevation-1 p-4 hover:shadow-md-elevation-2 transition-all duration-200 hover:scale-105 group border border-md-sys-outline-variant/30"
          >
            <div className="text-center">
              <div className="w-10 h-10 bg-md-sys-tertiary rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-md-sys-tertiary/90 transition-colors duration-200">
                <span className="text-lg text-md-sys-on-tertiary">🔍</span>
              </div>
              <h3 className="text-md-title-medium font-semibold text-md-sys-on-surface mb-1">Browse Cars</h3>
              <p className="text-md-body-small text-md-sys-on-surface-variant">Find your next project</p>
            </div>
          </Link>

          <Link
            href="/messages"
            className="bg-md-sys-surface-container-low rounded-2xl shadow-md-elevation-1 p-4 hover:shadow-md-elevation-2 transition-all duration-200 hover:scale-105 group border border-md-sys-outline-variant/30"
          >
            <div className="text-center">
              <div className="w-10 h-10 bg-md-sys-primary rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-md-sys-primary/90 transition-colors duration-200">
                <span className="text-lg text-md-sys-on-primary">💬</span>
              </div>
              <h3 className="text-md-title-medium font-semibold text-md-sys-on-surface mb-1">Messages</h3>
              <p className="text-md-body-small text-md-sys-on-surface-variant">Communicate with buyers</p>
            </div>
          </Link>
        </div>

        {/* Offer Management Section */}
        <div className="mb-8">
          <OfferManagement />
        </div>

        {/* Sent Offers Section */}
        <div className="mb-8">
          <SentOffers />
        </div>

        {/* Offer Analytics Section */}
        <div className="mb-8">
          <OfferAnalytics />
        </div>

        {/* Favorites Management Section */}
        <div id="favorites-section" className="mb-8">
          <FavoritesManagement />
        </div>

        {/* Listings Management */}
        <div className="bg-md-sys-surface-container rounded-3xl shadow-md-elevation-1 border border-md-sys-outline-variant/50">
          <div className="px-6 py-4 border-b border-md-sys-outline-variant">
            <div className="flex justify-between items-center">
              <h2 className="text-md-headline-small font-semibold text-md-sys-on-surface">My Listings</h2>
              
              {/* Filter Controls */}
              <div className="flex space-x-4">
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ status: e.target.value as any })}
                  className="border border-md-sys-outline rounded-xl px-4 py-2.5 text-md-body-medium bg-md-sys-surface text-md-sys-on-surface focus:border-md-sys-primary focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 shadow-md-elevation-1"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="sold">Sold</option>
                  <option value="draft">Draft</option>
                </select>
                
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ sortBy: e.target.value as any })}
                  className="border border-md-sys-outline rounded-xl px-4 py-2.5 text-md-body-medium bg-md-sys-surface text-md-sys-on-surface focus:border-md-sys-primary focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 shadow-md-elevation-1"
                >
                  <option value="created_at">Date Created</option>
                  <option value="updated_at">Last Updated</option>
                  <option value="price">Price</option>
                  <option value="year">Year</option>
                  <option value="title">Title</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-6">
            {listings.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-md-sys-surface-container-high rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">🚗</span>
                </div>
                <h3 className="text-md-title-large font-semibold text-md-sys-on-surface mb-3">No Listings Yet</h3>
                <p className="text-md-body-large text-md-sys-on-surface-variant mb-8">
                  {filters.status === 'all' 
                    ? "You haven't listed any cars yet." 
                    : `No ${filters.status} listings found.`}
                </p>
                <div className="flex justify-center gap-4">
                  <Link
                    href="/sell"
                    className="bg-md-sys-primary text-md-sys-on-primary px-8 py-4 rounded-2xl hover:bg-md-sys-primary/90 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 focus-visible:ring-2 focus-visible:ring-md-sys-primary text-md-label-large font-semibold shadow-md-elevation-2"
                  >
                    List Your First Car
                  </Link>
                  {debugMode && (
                    <button
                      onClick={handleCreateTestListing}
                      disabled={actionLoading === 'test-listing'}
                      className="bg-md-sys-surface-container text-md-sys-on-surface px-8 py-4 rounded-2xl border border-md-sys-outline-variant hover:bg-md-sys-surface-container-high transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 focus-visible:ring-2 focus-visible:ring-md-sys-primary text-md-label-large font-semibold disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-md-elevation-1"
                    >
                      {actionLoading === 'test-listing' ? 'Creating...' : 'Create Test Listing'}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid gap-6">
                {listings.map((listing) => (
                  <div key={listing.id} className="border border-md-sys-outline-variant rounded-3xl p-6 bg-md-sys-surface-container hover:bg-md-sys-surface-container-high transition-all duration-200 hover:shadow-md-elevation-2 shadow-md-elevation-1">
                    <div className="flex items-start space-x-6">
                      {/* Listing Image */}
                      <div className="flex-shrink-0">
                        {listing.primaryImage ? (
                          <Image
                            src={listing.primaryImage.image_url}
                            alt={listing.title}
                            width={140}
                            height={100}
                            className="rounded-2xl object-cover shadow-md-elevation-1"
                          />
                        ) : (
                          <div className="w-35 h-25 bg-md-sys-surface-container-high rounded-2xl flex items-center justify-center shadow-md-elevation-1">
                            <span className="text-md-sys-on-surface-variant text-md-body-medium">No Image</span>
                          </div>
                        )}
                      </div>

                      {/* Listing Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-md-title-large font-semibold text-md-sys-on-surface truncate mb-1">
                              {listing.title}
                            </h3>
                            <p className="text-md-body-large text-md-sys-on-surface-variant mb-2">
                              {listing.year} {listing.make} {listing.model}
                            </p>
                            <div className="bg-md-sys-primary-container rounded-2xl px-4 py-3 mb-4 inline-block">
                              <p className="text-md-display-small font-bold text-md-sys-on-primary-container">
                                {formatPrice(listing.price)}
                              </p>
                              {listing.status === 'sold' && listing.sold_price && (
                                <p className="text-md-body-medium text-md-sys-on-primary-container/80 font-medium mt-1">
                                  Sold for {formatPrice(listing.sold_price)}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center flex-wrap gap-4">
                              {getStatusBadge(listing.status)}
                              <div className="flex items-center gap-4 text-md-body-small text-md-sys-on-surface-variant">
                                <span className="flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 bg-md-sys-on-surface-variant rounded-full"></span>
                                  Listed {formatDate(listing.created_at)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 bg-md-sys-on-surface-variant rounded-full"></span>
                                  {listing.imageCount} photo{listing.imageCount !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex-shrink-0">
                        <div className="flex flex-col space-y-3">
                          <Link
                            href={`/listings/${listing.id}`}
                            className="bg-md-sys-surface-container text-md-sys-on-surface px-5 py-2.5 rounded-xl border border-md-sys-outline-variant hover:bg-md-sys-surface-container-high transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 text-md-label-large font-medium text-center shadow-md-elevation-1"
                          >
                            View
                          </Link>
                          
                          {listing.status === 'active' && (
                            <>
                              <button
                                onClick={() => handleMarkAsSold(listing.id)}
                                disabled={actionLoading === listing.id}
                                className="bg-md-sys-primary text-md-sys-on-primary px-5 py-2.5 rounded-xl hover:bg-md-sys-primary/90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 text-md-label-large font-medium disabled:opacity-60 disabled:cursor-not-allowed shadow-md-elevation-2"
                              >
                                {actionLoading === listing.id ? 'Processing...' : 'Mark Sold'}
                              </button>
                              <Link
                                href={`/sell?edit=${listing.id}`}
                                className="bg-md-sys-secondary text-md-sys-on-secondary px-5 py-2.5 rounded-xl hover:bg-md-sys-secondary/90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-md-sys-secondary/20 text-md-label-large font-medium text-center shadow-md-elevation-1"
                              >
                                Edit
                              </Link>
                            </>
                          )}
                          
                          {listing.status === 'sold' && (
                            <button
                              onClick={() => handleReactivate(listing.id)}
                              disabled={actionLoading === listing.id}
                              className="bg-md-sys-tertiary text-md-sys-on-tertiary px-5 py-2.5 rounded-xl hover:bg-md-sys-tertiary/90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-md-sys-tertiary/20 text-md-label-large font-medium disabled:opacity-60 disabled:cursor-not-allowed shadow-md-elevation-1"
                            >
                              {actionLoading === listing.id ? 'Processing...' : 'Reactivate'}
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleDeleteListing(listing.id)}
                            disabled={actionLoading === listing.id}
                            className="bg-md-sys-error-container text-md-sys-on-error-container px-5 py-2.5 rounded-xl border border-md-sys-error/20 hover:bg-md-sys-error-container/80 text-md-label-large font-medium transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-md-elevation-1"
                          >
                            {actionLoading === listing.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

export default withAuth(DashboardPage) 