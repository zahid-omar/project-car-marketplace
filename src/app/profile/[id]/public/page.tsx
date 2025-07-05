'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import Image from 'next/image'
import LoadingSpinner from '@/components/LoadingSpinner'
import UserReviews from '@/components/UserReviews'
import RatingDisplay from '@/components/RatingDisplay'
import AppLayout from '@/components/AppLayout'
import { UserIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import { notFound } from 'next/navigation'

// Types
interface PublicProfile {
  id: string
  email: string
  display_name: string | null
  profile_image_url: string | null
  bio: string | null
  social_links: {
    website?: string
    instagram?: string
    facebook?: string
    youtube?: string
  } | null
  privacy_settings: {
    show_email: boolean
    show_bio: boolean
    show_social_links: boolean
    public_profile: boolean
  } | null
  created_at: string
}

interface Listing {
  id: string
  title: string
  make: string
  model: string
  year: number
  price: number
  created_at: string
  listing_images: {
    image_url: string
    is_primary: boolean
  }[]
}

interface PublicProfilePageProps {
  params: {
    id: string
  }
}

export default function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { user } = useAuth()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOwnProfile, setIsOwnProfile] = useState(false)

  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchProfile()
  }, [params.id, user])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      setError(null)

      // Check if this is the user's own profile
      const ownProfile = user?.id === params.id
      setIsOwnProfile(ownProfile)

      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', params.id)
        .single()

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          notFound()
        }
        throw profileError
      }

      // Check if profile is public or if it's the user's own profile
      if (!profileData.privacy_settings?.public_profile && !ownProfile) {
        setError('This profile is private.')
        return
      }

      setProfile(profileData)

      // Fetch user's listings
      const { data: listingsData, error: listingsError } = await supabase
        .from('listings')
        .select(`
          id,
          title,
          make,
          model,
          year,
          price,
          created_at,
          listing_images(
            image_url,
            is_primary
          )
        `)
        .eq('user_id', params.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(6)

      if (listingsError) {
        console.warn('Error fetching listings:', listingsError)
      } else {
        setListings(listingsData || [])
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
      setError('Failed to load profile. Please try again.')
    } finally {
      setLoading(false)
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

  if (loading) {
    return (
      <AppLayout showNavigation={true}>
        <div className="min-h-screen bg-md-sys-surface flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout showNavigation={true}>
        <div className="min-h-screen bg-md-sys-surface flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-md-headline-medium font-semibold text-md-sys-on-surface">{error}</h2>
            <p className="text-md-body-large text-md-sys-on-surface-variant mt-2">The profile you're looking for is not available.</p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-md-sys-primary text-md-sys-on-primary rounded-xl hover:bg-md-sys-primary/90 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 focus-visible:ring-2 focus-visible:ring-md-sys-primary text-md-label-large font-medium shadow-md-elevation-1 hover:shadow-md-elevation-2"
            >
              Go Home
            </Link>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!profile) {
    return (
      <AppLayout showNavigation={true}>
        <div className="min-h-screen bg-md-sys-surface flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-md-headline-medium font-semibold text-md-sys-on-surface">Profile not found</h2>
            <p className="text-md-body-large text-md-sys-on-surface-variant mt-2">The profile you're looking for doesn't exist.</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout showNavigation={true} className="bg-md-sys-surface">
      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href={isOwnProfile ? "/profile" : "/browse"}
            className="inline-flex items-center gap-2 text-md-sys-on-surface-variant hover:text-md-sys-primary transition-colors duration-200 text-md-body-large font-medium"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            {isOwnProfile ? 'Back to Profile Settings' : 'Back to Browse'}
          </Link>
        </div>

        {/* Profile Header */}
        <div className="bg-md-sys-surface-container rounded-3xl shadow-md-elevation-1 mb-8 overflow-hidden border border-md-sys-outline-variant/30">
          <div className="h-32 bg-gradient-to-r from-md-sys-primary to-md-sys-secondary"></div>
          <div className="relative px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-6">
              {/* Profile Picture */}
              <div className="relative -mt-16 mb-4 sm:mb-0">
                <div className="w-32 h-32 bg-md-sys-surface rounded-full p-2 shadow-md-elevation-2">
                  {profile.profile_image_url ? (
                    <Image
                      src={profile.profile_image_url}
                      alt={profile.display_name || 'Profile'}
                      width={112}
                      height={112}
                      className="w-28 h-28 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-28 h-28 bg-md-sys-surface-container-high rounded-full flex items-center justify-center">
                      <UserIcon className="w-14 h-14 text-md-sys-on-surface-variant" />
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <h1 className="text-md-display-small font-black text-md-sys-on-surface">
                  {profile.display_name || 'Car Enthusiast'}
                </h1>
                {profile.privacy_settings?.show_email && (
                  <div className="inline-block bg-md-sys-primary-container rounded-full px-4 py-2 mt-3 border border-md-sys-outline-variant/30">
                    <p className="text-md-body-medium font-medium text-md-sys-on-primary-container">{profile.email}</p>
                  </div>
                )}
                <div className="mt-3">
                  <div className="inline-block bg-md-sys-secondary-container rounded-full px-4 py-2 border border-md-sys-outline-variant/30">
                    <RatingDisplay userId={params.id} size="sm" />
                  </div>
                </div>
                <p className="text-md-body-small text-md-sys-on-surface-variant mt-4">
                  Member since {new Date(profile.created_at).toLocaleDateString()}
                </p>
              </div>

              {/* Edit Button for Own Profile */}
              {isOwnProfile && (
                <div className="mt-4 sm:mt-0">
                  <Link
                    href="/profile"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-md-sys-secondary-container text-md-sys-on-secondary-container rounded-xl hover:bg-md-sys-secondary-container/90 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-md-sys-secondary/20 focus-visible:ring-2 focus-visible:ring-md-sys-secondary text-md-label-large font-medium shadow-md-elevation-1 hover:shadow-md-elevation-2 border border-md-sys-outline-variant/30"
                  >
                    Edit Profile
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-1">
            <div className="bg-md-sys-surface-container rounded-3xl shadow-md-elevation-1 p-6 space-y-6 border border-md-sys-outline-variant/30">
              {/* Bio Section */}
              {profile.privacy_settings?.show_bio && profile.bio && (
                <div>
                  <h3 className="text-md-title-large font-semibold text-md-sys-on-surface mb-4">About</h3>
                  <p className="text-md-body-medium text-md-sys-on-surface-variant whitespace-pre-wrap leading-relaxed">{profile.bio}</p>
                </div>
              )}

              {/* Social Links Section */}
              {profile.privacy_settings?.show_social_links && profile.social_links && (
                <div>
                  <h3 className="text-md-title-large font-semibold text-md-sys-on-surface mb-4">Connect</h3>
                  <div className="space-y-3">
                    {profile.social_links.website && (
                      <a
                        href={profile.social_links.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-md-sys-primary hover:text-md-sys-primary/80 hover:underline transition-colors duration-200 text-md-body-large font-medium"
                      >
                        <span className="text-lg">🌐</span>
                        <span>Website</span>
                      </a>
                    )}
                    {profile.social_links.instagram && (
                      <a
                        href={`https://instagram.com/${profile.social_links.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-md-sys-primary hover:text-md-sys-primary/80 hover:underline transition-colors duration-200 text-md-body-large font-medium"
                      >
                        <span className="text-lg">📸</span>
                        <span>Instagram</span>
                      </a>
                    )}
                    {profile.social_links.facebook && (
                      <a
                        href={`https://${profile.social_links.facebook}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-md-sys-primary hover:text-md-sys-primary/80 hover:underline transition-colors duration-200 text-md-body-large font-medium"
                      >
                        <span className="text-lg">📘</span>
                        <span>Facebook</span>
                      </a>
                    )}
                    {profile.social_links.youtube && (
                      <a
                        href={`https://${profile.social_links.youtube}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-md-sys-primary hover:text-md-sys-primary/80 hover:underline transition-colors duration-200 text-md-body-large font-medium"
                      >
                        <span className="text-lg">📺</span>
                        <span>YouTube</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div>
                <h3 className="text-md-title-large font-semibold text-md-sys-on-surface mb-4">Stats</h3>
                <div className="bg-md-sys-surface-container-low rounded-2xl p-4 border border-md-sys-outline-variant/30">
                  <div className="flex justify-between items-center">
                    <span className="text-md-body-medium text-md-sys-on-surface-variant">Active Listings</span>
                    <span className="text-md-title-medium font-bold text-md-sys-on-surface">{listings.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Listings Section */}
          <div className="lg:col-span-2">
            <div className="bg-md-sys-surface-container rounded-3xl shadow-md-elevation-1 p-6 border border-md-sys-outline-variant/30">
              <h3 className="text-md-headline-small font-semibold text-md-sys-on-surface mb-6">
                {isOwnProfile ? 'Your Listings' : `${profile.display_name || 'User'}'s Listings`}
              </h3>

              {listings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-md-sys-surface-container-high rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">🚗</span>
                  </div>
                  <h4 className="text-md-title-large font-semibold text-md-sys-on-surface mb-3">No Listings Yet</h4>
                  <p className="text-md-body-large text-md-sys-on-surface-variant mb-8">
                    {isOwnProfile ? "You haven't listed any cars yet." : "No active listings found."}
                  </p>
                  {isOwnProfile && (
                    <Link
                      href="/sell"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-md-sys-primary text-md-sys-on-primary rounded-xl hover:bg-md-sys-primary/90 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 focus-visible:ring-2 focus-visible:ring-md-sys-primary text-md-label-large font-medium shadow-md-elevation-1 hover:shadow-md-elevation-2"
                    >
                      List Your First Car
                    </Link>
                  )}
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-6">
                  {listings.map((listing) => {
                    const primaryImage = listing.listing_images?.find(img => img.is_primary) || listing.listing_images?.[0]
                    
                    return (
                      <Link
                        key={listing.id}
                        href={`/listings/${listing.id}`}
                        className="group block"
                      >
                        <div className="bg-md-sys-surface-container-low border border-md-sys-outline-variant/30 rounded-2xl overflow-hidden hover:shadow-md-elevation-2 transition-all duration-200 hover:scale-105 shadow-md-elevation-1">
                          {/* Image */}
                          <div className="aspect-w-16 aspect-h-9 bg-md-sys-surface-container-high">
                            {primaryImage ? (
                              <Image
                                src={primaryImage.image_url}
                                alt={listing.title}
                                width={400}
                                height={225}
                                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                            ) : (
                              <div className="w-full h-48 bg-md-sys-surface-container-high flex items-center justify-center">
                                <span className="text-md-sys-on-surface-variant text-md-body-medium">No Image</span>
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="p-4">
                            <h4 className="text-md-title-medium font-semibold text-md-sys-on-surface truncate">{listing.title}</h4>
                            <p className="text-md-body-medium text-md-sys-on-surface-variant mt-1">
                              {listing.year} {listing.make} {listing.model}
                            </p>
                            <p className="text-md-title-large font-bold text-md-sys-primary mt-2">
                              {formatPrice(listing.price)}
                            </p>
                            <p className="text-md-body-small text-md-sys-on-surface-variant mt-2">
                              Listed {new Date(listing.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}

              {listings.length > 0 && (
                <div className="mt-6 text-center">
                  <Link
                    href={`/browse?user=${params.id}`}
                    className="text-md-sys-primary hover:text-md-sys-primary/80 hover:underline text-md-body-large font-medium transition-colors duration-200"
                  >
                    View all listings →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-8">
          <UserReviews 
            userId={params.id}
            canReview={!!user && user.id !== params.id}
          />
        </div>
      </div>
    </AppLayout>
  )
} 