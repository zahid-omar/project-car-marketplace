'use client'

import { useState, useEffect } from 'react'
import { useAuth, withAuth } from '@/lib/auth'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import Image from 'next/image'
import LoadingSpinner from '@/components/LoadingSpinner'
import ProfilePictureUpload from '@/components/ProfilePictureUpload'
import UserReviews from '@/components/UserReviews'
import RatingDisplay from '@/components/RatingDisplay'
import AppLayout from '@/components/AppLayout'
import NotificationPreferences from '@/components/NotificationPreferences'
import { UserIcon, CameraIcon, PencilIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

// Types
interface UserProfile {
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

function ProfilePage() {
  const { user, signOut } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'privacy' | 'notifications' | 'reviews'>('profile')
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    social_links: {
      website: '',
      instagram: '',
      facebook: '',
      youtube: ''
    }
  })
  const [privacySettings, setPrivacySettings] = useState({
    show_email: true,
    show_bio: true,
    show_social_links: true,
    public_profile: true
  })
  const [accountSettings, setAccountSettings] = useState({
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [saving, setSaving] = useState(false)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  const supabase = createClientComponentClient()

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError
      }

      // If no profile exists, create one
      if (!profileData) {
        const newProfile = {
          id: user?.id,
          email: user?.email,
          display_name: user?.user_metadata?.display_name || user?.email?.split('@')[0] || '',
          profile_image_url: null,
          bio: null,
          social_links: null,
          privacy_settings: {
            show_email: true,
            show_bio: true,
            show_social_links: true,
            public_profile: true
          },
          created_at: new Date().toISOString()
        }

        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single()

        if (createError) throw createError
        setProfile(createdProfile)
      } else {
        setProfile(profileData)
      }

      // Set form data
      if (profileData) {
        setFormData({
          display_name: profileData.display_name || '',
          bio: profileData.bio || '',
          social_links: profileData.social_links || {
            website: '',
            instagram: '',
            facebook: '',
            youtube: ''
          }
        })
        setPrivacySettings(profileData.privacy_settings || {
          show_email: true,
          show_bio: true,
          show_social_links: true,
          public_profile: true
        })
      }

      setAccountSettings({
        ...accountSettings,
        email: user?.email || ''
      })
    } catch (err) {
      console.error('Error fetching profile:', err)
      setError('Failed to load profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileSave = async () => {
    try {
      setSaving(true)
      setError(null)

      const updateData = {
        display_name: formData.display_name,
        bio: formData.bio,
        social_links: formData.social_links
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user?.id)

      if (error) throw error

      setProfile(prev => prev ? { ...prev, ...updateData } : null)
      setEditMode(false)
      // Success feedback could be added here
    } catch (err) {
      console.error('Error updating profile:', err)
      setError('Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handlePrivacyUpdate = async () => {
    try {
      setSaving(true)
      setError(null)

      const { error } = await supabase
        .from('profiles')
        .update({ privacy_settings: privacySettings })
        .eq('id', user?.id)

      if (error) throw error

      setProfile(prev => prev ? { ...prev, privacy_settings: privacySettings } : null)
      // Success feedback could be added here
    } catch (err) {
      console.error('Error updating privacy settings:', err)
      setError('Failed to update privacy settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    try {
      if (accountSettings.newPassword !== accountSettings.confirmPassword) {
        setError('New passwords do not match')
        return
      }

      if (accountSettings.newPassword.length < 6) {
        setError('Password must be at least 6 characters long')
        return
      }

      setSaving(true)
      setError(null)

      const { error } = await supabase.auth.updateUser({
        password: accountSettings.newPassword
      })

      if (error) throw error

      setAccountSettings({
        ...accountSettings,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      // Success feedback could be added here
    } catch (err) {
      console.error('Error updating password:', err)
      setError('Failed to update password. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
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

  if (!profile) {
    return (
      <AppLayout showNavigation={true}>
        <div className="min-h-screen bg-md-sys-surface flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-md-headline-medium font-semibold text-md-sys-on-surface">Profile not found</h2>
            <p className="text-md-body-large text-md-sys-on-surface-variant mt-2">Unable to load your profile information.</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout showNavigation={true} className="bg-md-sys-surface">
      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-md-sys-surface-container rounded-3xl shadow-md-elevation-1 mb-8 overflow-hidden border border-md-sys-outline-variant/30">
          <div className="h-32 bg-gradient-to-r from-md-sys-primary to-md-sys-secondary"></div>
          <div className="relative px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-6">
              {/* Profile Picture */}
              <div className="relative -mt-16 mb-4 sm:mb-0">
                <ProfilePictureUpload
                  currentImageUrl={profile.profile_image_url}
                  onImageUpdate={(imageUrl) => {
                    setProfile(prev => prev ? { ...prev, profile_image_url: imageUrl } : prev)
                  }}
                  className="bg-md-sys-surface rounded-full p-2 shadow-md-elevation-2"
                />
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <h1 className="text-md-display-small font-black text-md-sys-on-surface">
                  {profile.display_name || 'Anonymous User'}
                </h1>
                {privacySettings.show_email && (
                  <div className="inline-block bg-md-sys-primary-container rounded-full px-4 py-2 mt-3 border border-md-sys-outline-variant/30">
                    <p className="text-md-body-medium font-medium text-md-sys-on-primary-container">{profile.email}</p>
                  </div>
                )}
                <div className="mt-3">
                  <div className="inline-block bg-md-sys-secondary-container rounded-full px-4 py-2 border border-md-sys-outline-variant/30">
                    <RatingDisplay userId={profile.id} size="sm" />
                  </div>
                </div>
                <p className="text-md-body-small text-md-sys-on-surface-variant mt-4">
                  Member since {new Date(profile.created_at).toLocaleDateString()}
                </p>
              </div>

              {/* Action Button */}
              <div className="mt-4 sm:mt-0">
                <Link
                  href={`/profile/${profile.id}/public`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-md-sys-primary-container text-md-sys-on-primary-container rounded-xl hover:bg-md-sys-primary-container/90 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 focus-visible:ring-2 focus-visible:ring-md-sys-primary text-md-label-large font-medium shadow-md-elevation-1 hover:shadow-md-elevation-2 border border-md-sys-outline-variant/30"
                >
                  <EyeIcon className="w-5 h-5" />
                  View Public Profile
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-md-sys-error-container border border-md-sys-error/20 rounded-xl p-6 mb-6 shadow-md-elevation-1">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-3 bg-md-sys-error/10 rounded-full">
                <svg className="w-6 h-6 text-md-sys-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-md-title-large font-medium text-md-sys-on-error-container mb-2">
                  Error
                </h3>
                <p className="text-md-body-medium text-md-sys-on-error-container">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-md-sys-surface-container rounded-3xl shadow-md-elevation-1 border border-md-sys-outline-variant/30">
          <div className="border-b border-md-sys-outline-variant">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-1 border-b-2 font-medium text-md-label-large transition-all duration-200 ${
                  activeTab === 'profile'
                    ? 'border-md-sys-primary text-md-sys-primary'
                    : 'border-transparent text-md-sys-on-surface-variant hover:text-md-sys-on-surface hover:border-md-sys-outline'
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab('account')}
                className={`py-4 px-1 border-b-2 font-medium text-md-label-large transition-all duration-200 ${
                  activeTab === 'account'
                    ? 'border-md-sys-primary text-md-sys-primary'
                    : 'border-transparent text-md-sys-on-surface-variant hover:text-md-sys-on-surface hover:border-md-sys-outline'
                }`}
              >
                Account
              </button>
              <button
                onClick={() => setActiveTab('privacy')}
                className={`py-4 px-1 border-b-2 font-medium text-md-label-large transition-all duration-200 ${
                  activeTab === 'privacy'
                    ? 'border-md-sys-primary text-md-sys-primary'
                    : 'border-transparent text-md-sys-on-surface-variant hover:text-md-sys-on-surface hover:border-md-sys-outline'
                }`}
              >
                Privacy
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`py-4 px-1 border-b-2 font-medium text-md-label-large transition-all duration-200 ${
                  activeTab === 'notifications'
                    ? 'border-md-sys-primary text-md-sys-primary'
                    : 'border-transparent text-md-sys-on-surface-variant hover:text-md-sys-on-surface hover:border-md-sys-outline'
                }`}
              >
                Notifications
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`py-4 px-1 border-b-2 font-medium text-md-label-large transition-all duration-200 ${
                  activeTab === 'reviews'
                    ? 'border-md-sys-primary text-md-sys-primary'
                    : 'border-transparent text-md-sys-on-surface-variant hover:text-md-sys-on-surface hover:border-md-sys-outline'
                }`}
              >
                Reviews
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-md-headline-small font-semibold text-md-sys-on-surface">Profile Information</h3>
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-md-sys-secondary-container text-md-sys-on-secondary-container rounded-xl hover:bg-md-sys-secondary-container/90 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-md-sys-secondary/20 focus-visible:ring-2 focus-visible:ring-md-sys-secondary text-md-label-large font-medium shadow-md-elevation-1 hover:shadow-md-elevation-2 border border-md-sys-outline-variant/30"
                  >
                    <PencilIcon className="w-4 h-4" />
                    {editMode ? 'Cancel' : 'Edit'}
                  </button>
                </div>

                {editMode ? (
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="display_name" className="block text-md-label-large font-medium text-md-sys-on-surface mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        id="display_name"
                        value={formData.display_name}
                        onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                        className="w-full px-4 py-3 border border-md-sys-outline rounded-xl bg-md-sys-surface text-md-sys-on-surface focus:border-md-sys-primary focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 text-md-body-large transition-all duration-200"
                      />
                    </div>

                    <div>
                      <label htmlFor="bio" className="block text-md-label-large font-medium text-md-sys-on-surface mb-2">
                        Bio
                      </label>
                      <textarea
                        id="bio"
                        rows={4}
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        className="w-full px-4 py-3 border border-md-sys-outline rounded-xl bg-md-sys-surface text-md-sys-on-surface focus:border-md-sys-primary focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 text-md-body-large transition-all duration-200"
                        placeholder="Tell others about yourself and your automotive interests..."
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="website" className="block text-md-label-large font-medium text-md-sys-on-surface mb-2">
                          Website
                        </label>
                        <input
                          type="url"
                          id="website"
                          value={formData.social_links.website}
                          onChange={(e) => setFormData({
                            ...formData,
                            social_links: { ...formData.social_links, website: e.target.value }
                          })}
                          className="w-full px-4 py-3 border border-md-sys-outline rounded-xl bg-md-sys-surface text-md-sys-on-surface focus:border-md-sys-primary focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 text-md-body-large transition-all duration-200"
                          placeholder="https://yourwebsite.com"
                        />
                      </div>

                      <div>
                        <label htmlFor="instagram" className="block text-md-label-large font-medium text-md-sys-on-surface mb-2">
                          Instagram
                        </label>
                        <input
                          type="text"
                          id="instagram"
                          value={formData.social_links.instagram}
                          onChange={(e) => setFormData({
                            ...formData,
                            social_links: { ...formData.social_links, instagram: e.target.value }
                          })}
                          className="w-full px-4 py-3 border border-md-sys-outline rounded-xl bg-md-sys-surface text-md-sys-on-surface focus:border-md-sys-primary focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 text-md-body-large transition-all duration-200"
                          placeholder="@yourusername"
                        />
                      </div>

                      <div>
                        <label htmlFor="facebook" className="block text-md-label-large font-medium text-md-sys-on-surface mb-2">
                          Facebook
                        </label>
                        <input
                          type="text"
                          id="facebook"
                          value={formData.social_links.facebook}
                          onChange={(e) => setFormData({
                            ...formData,
                            social_links: { ...formData.social_links, facebook: e.target.value }
                          })}
                          className="w-full px-4 py-3 border border-md-sys-outline rounded-xl bg-md-sys-surface text-md-sys-on-surface focus:border-md-sys-primary focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 text-md-body-large transition-all duration-200"
                          placeholder="facebook.com/yourpage"
                        />
                      </div>

                      <div>
                        <label htmlFor="youtube" className="block text-md-label-large font-medium text-md-sys-on-surface mb-2">
                          YouTube
                        </label>
                        <input
                          type="text"
                          id="youtube"
                          value={formData.social_links.youtube}
                          onChange={(e) => setFormData({
                            ...formData,
                            social_links: { ...formData.social_links, youtube: e.target.value }
                          })}
                          className="w-full px-4 py-3 border border-md-sys-outline rounded-xl bg-md-sys-surface text-md-sys-on-surface focus:border-md-sys-primary focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 text-md-body-large transition-all duration-200"
                          placeholder="youtube.com/yourchannel"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-4">
                      <button
                        onClick={() => setEditMode(false)}
                        className="px-6 py-3 bg-md-sys-surface-container text-md-sys-on-surface rounded-xl border border-md-sys-outline-variant hover:bg-md-sys-surface-container-high transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 text-md-label-large font-medium shadow-md-elevation-1 hover:shadow-md-elevation-2"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleProfileSave}
                        disabled={saving}
                        className="px-6 py-3 bg-md-sys-primary text-md-sys-on-primary rounded-xl hover:bg-md-sys-primary/90 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 focus-visible:ring-2 focus-visible:ring-md-sys-primary text-md-label-large font-medium shadow-md-elevation-1 hover:shadow-md-elevation-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-md-sys-surface-container-low rounded-2xl p-6 shadow-md-elevation-1 border border-md-sys-outline-variant/30">
                      <h4 className="text-md-title-medium font-semibold text-md-sys-on-surface mb-4">Display Name</h4>
                      <p className="text-md-headline-small font-bold text-md-sys-on-surface">{profile.display_name || 'Not set'}</p>
                    </div>

                    <div className="bg-md-sys-surface-container-low rounded-2xl p-6 shadow-md-elevation-1 border border-md-sys-outline-variant/30">
                      <h4 className="text-md-title-medium font-semibold text-md-sys-on-surface mb-4">Bio</h4>
                      <p className="text-md-body-medium text-md-sys-on-surface-variant whitespace-pre-wrap leading-relaxed">
                        {profile.bio || 'No bio added yet.'}
                      </p>
                    </div>

                    <div className="bg-md-sys-surface-container-low rounded-2xl p-6 shadow-md-elevation-1 border border-md-sys-outline-variant/30">
                      <h4 className="text-md-title-medium font-semibold text-md-sys-on-surface mb-6">Social Links</h4>
                      <div className="space-y-4">
                        {profile.social_links ? (
                          <>
                            {profile.social_links.website && (
                              <a
                                href={profile.social_links.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-md-sys-primary hover:text-md-sys-primary/80 hover:underline block text-md-body-large font-medium transition-colors duration-200"
                              >
                                Website: {profile.social_links.website}
                              </a>
                            )}
                            {profile.social_links.instagram && (
                              <a
                                href={`https://instagram.com/${profile.social_links.instagram}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-md-sys-primary hover:text-md-sys-primary/80 hover:underline block text-md-body-large font-medium transition-colors duration-200"
                              >
                                Instagram: {profile.social_links.instagram}
                              </a>
                            )}
                            {profile.social_links.facebook && (
                              <a
                                href={`https://${profile.social_links.facebook}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-md-sys-primary hover:text-md-sys-primary/80 hover:underline block text-md-body-large font-medium transition-colors duration-200"
                              >
                                Facebook: {profile.social_links.facebook}
                              </a>
                            )}
                            {profile.social_links.youtube && (
                              <a
                                href={`https://${profile.social_links.youtube}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-md-sys-primary hover:text-md-sys-primary/80 hover:underline block text-md-body-large font-medium transition-colors duration-200"
                              >
                                YouTube: {profile.social_links.youtube}
                              </a>
                            )}
                          </>
                        ) : (
                          <p className="text-md-sys-on-surface-variant text-md-body-large">No social links added yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                <h3 className="text-md-headline-small font-semibold text-md-sys-on-surface">Account Settings</h3>

                <div className="space-y-6">
                  <div className="bg-md-sys-surface-container-low rounded-2xl p-6 shadow-md-elevation-1 border border-md-sys-outline-variant/30">
                    <label htmlFor="email" className="block text-md-label-large font-medium text-md-sys-on-surface mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={accountSettings.email}
                      disabled
                      className="w-full px-4 py-3 border border-md-sys-outline rounded-xl bg-md-sys-surface-container text-md-sys-on-surface-variant text-md-body-large"
                    />
                    <p className="mt-2 text-md-body-small text-md-sys-on-surface-variant">
                      Email cannot be changed. Contact support if you need to update it.
                    </p>
                  </div>

                  <div className="bg-md-sys-surface-container-low rounded-2xl p-6 shadow-md-elevation-1 border border-md-sys-outline-variant/30">
                    <h4 className="text-md-title-large font-semibold text-md-sys-on-surface mb-6">Change Password</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="new_password" className="block text-md-label-large font-medium text-md-sys-on-surface mb-2">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.new ? 'text' : 'password'}
                            id="new_password"
                            value={accountSettings.newPassword}
                            onChange={(e) => setAccountSettings({ ...accountSettings, newPassword: e.target.value })}
                            className="w-full px-4 py-3 pr-12 border border-md-sys-outline rounded-xl bg-md-sys-surface text-md-sys-on-surface focus:border-md-sys-primary focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 text-md-body-large transition-all duration-200"
                            placeholder="Enter new password"
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-md-sys-on-surface-variant hover:text-md-sys-on-surface transition-colors duration-200"
                            onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                          >
                            {showPasswords.new ? (
                              <EyeSlashIcon className="h-5 w-5" />
                            ) : (
                              <EyeIcon className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="confirm_password" className="block text-md-label-large font-medium text-md-sys-on-surface mb-2">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.confirm ? 'text' : 'password'}
                            id="confirm_password"
                            value={accountSettings.confirmPassword}
                            onChange={(e) => setAccountSettings({ ...accountSettings, confirmPassword: e.target.value })}
                            className="w-full px-4 py-3 pr-12 border border-md-sys-outline rounded-xl bg-md-sys-surface text-md-sys-on-surface focus:border-md-sys-primary focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 text-md-body-large transition-all duration-200"
                            placeholder="Confirm new password"
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-md-sys-on-surface-variant hover:text-md-sys-on-surface transition-colors duration-200"
                            onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                          >
                            {showPasswords.confirm ? (
                              <EyeSlashIcon className="h-5 w-5" />
                            ) : (
                              <EyeIcon className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="pt-4">
                        <button
                          onClick={handlePasswordChange}
                          disabled={saving || !accountSettings.newPassword || !accountSettings.confirmPassword}
                          className="px-6 py-3 bg-md-sys-primary text-md-sys-on-primary rounded-xl hover:bg-md-sys-primary/90 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 focus-visible:ring-2 focus-visible:ring-md-sys-primary text-md-label-large font-medium shadow-md-elevation-1 hover:shadow-md-elevation-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                          {saving ? 'Updating...' : 'Update Password'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <h3 className="text-md-headline-small font-semibold text-md-sys-on-surface">Privacy Settings</h3>

                <div className="bg-md-sys-surface-container-low rounded-2xl p-6 shadow-md-elevation-1 border border-md-sys-outline-variant/30">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-md-title-medium font-semibold text-md-sys-on-surface">Public Profile</h4>
                        <p className="text-md-body-medium text-md-sys-on-surface-variant">Allow others to view your profile page</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacySettings.public_profile}
                          onChange={(e) => setPrivacySettings({ ...privacySettings, public_profile: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-md-sys-surface-container-high peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-md-sys-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-md-sys-primary"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-md-title-medium font-semibold text-md-sys-on-surface">Show Email</h4>
                        <p className="text-md-body-medium text-md-sys-on-surface-variant">Display your email address on your public profile</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacySettings.show_email}
                          onChange={(e) => setPrivacySettings({ ...privacySettings, show_email: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-md-sys-surface-container-high peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-md-sys-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-md-sys-primary"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-md-title-medium font-semibold text-md-sys-on-surface">Show Bio</h4>
                        <p className="text-md-body-medium text-md-sys-on-surface-variant">Display your bio on your public profile</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacySettings.show_bio}
                          onChange={(e) => setPrivacySettings({ ...privacySettings, show_bio: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-md-sys-surface-container-high peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-md-sys-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-md-sys-primary"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-md-title-medium font-semibold text-md-sys-on-surface">Show Social Links</h4>
                        <p className="text-md-body-medium text-md-sys-on-surface-variant">Display your social media links on your public profile</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacySettings.show_social_links}
                          onChange={(e) => setPrivacySettings({ ...privacySettings, show_social_links: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-md-sys-surface-container-high peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-md-sys-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-md-sys-primary"></div>
                      </label>
                    </div>

                    <div className="pt-4">
                      <button
                        onClick={handlePrivacyUpdate}
                        disabled={saving}
                        className="px-6 py-3 bg-md-sys-primary text-md-sys-on-primary rounded-xl hover:bg-md-sys-primary/90 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 focus-visible:ring-2 focus-visible:ring-md-sys-primary text-md-label-large font-medium shadow-md-elevation-1 hover:shadow-md-elevation-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        {saving ? 'Saving...' : 'Save Privacy Settings'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div>
                <NotificationPreferences />
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div>
                <UserReviews 
                  userId={profile.id}
                  canReview={false}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

export default withAuth(ProfilePage) 