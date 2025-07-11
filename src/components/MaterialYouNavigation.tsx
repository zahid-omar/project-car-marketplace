'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useProfile } from '@/hooks/useProfile';
import { useMaterialYouTheme } from '@/lib/material-you-theme';
import NotificationDropdown from '@/components/NotificationDropdown';
import Avatar from '@/components/ui/Avatar';
import { useState, useRef, useEffect } from 'react';
import { MaterialYouIcon } from './ui/MaterialYouIcon';

interface MaterialYouNavigationProps {
  className?: string;
}

export default function MaterialYouNavigation({ className = '' }: MaterialYouNavigationProps) {
  const { user, signOut, loading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { theme, setThemeMode, isDarkMode } = useMaterialYouTheme();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setThemeMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile drawer on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileDrawerOpen(false);
        setUserMenuOpen(false);
        setThemeMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Updated navigation links - Browse Cars always visible, Dashboard moved to user menu
  const navigationLinks = [
    { href: '/browse', label: 'Browse Cars', icon: 'car' as const },
    { href: '/messages', label: 'Messages', icon: 'message' as const, authRequired: true },
    { href: '/sell', label: 'Sell Car', icon: 'currency-dollar' as const, authRequired: true },
  ];

  const visibleLinks = navigationLinks.filter(link => !link.authRequired || user);

  return (
    <>
      {/* Top App Bar */}
      <header 
        className={`surface-container-high elevation-2 border-b border-outline-variant transition-all duration-md-short4 ease-md-standard ${className}`}
        role="banner"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Leading Section */}
            <div className="flex items-center space-x-4">
              {/* Mobile Menu Button */}
              <button
                type="button"
                className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-full state-layer text-on-surface hover:bg-on-surface/[0.08] focus:bg-on-surface/[0.12] transition-all duration-md-short2 ease-md-standard"
                onClick={() => setMobileDrawerOpen(true)}
                aria-label="Open navigation menu"
                aria-expanded={mobileDrawerOpen}
              >
                <MaterialYouIcon name="menu" size="lg" aria-hidden={true} />
              </button>

              {/* Logo/Brand */}
              <Link 
                href="/" 
                className="flex items-center space-x-2 text-on-surface hover:text-primary transition-colors duration-md-short3 ease-md-standard"
              >
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <MaterialYouIcon name="car" size="md" className="text-on-primary" />
                </div>
                <span className="text-title-large font-heading hidden sm:block">
                  Project Car Marketplace
                </span>
                <span className="text-title-large font-heading sm:hidden">
                  Project Cars
                </span>
              </Link>
            </div>

            {/* Center Navigation (Desktop) - Always show Browse Cars, Messages & Sell Car when authenticated */}
            <nav className="hidden lg:flex items-center space-x-1" role="navigation" aria-label="Main navigation">
              {visibleLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-on-surface/[0.08] focus:bg-on-surface/[0.12] active:bg-on-surface/[0.12] transition-all duration-md-short2 ease-md-standard text-label-large state-layer"
                >
                  <MaterialYouIcon name={link.icon} size="md" aria-hidden={true} />
                  <span>{link.label}</span>
                </Link>
              ))}
            </nav>

            {/* Actions Section */}
            <div className="flex items-center space-x-2">
              {loading ? (
                <div className="w-6 h-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : (
                <>
                  {/* Always show Theme Toggle */}
                  <div className="relative" ref={themeMenuRef}>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center w-10 h-10 rounded-full state-layer text-on-surface-variant hover:text-on-surface hover:bg-on-surface/[0.08] focus:bg-on-surface/[0.12] transition-all duration-md-short2 ease-md-standard"
                      onClick={() => setThemeMenuOpen(!themeMenuOpen)}
                      aria-label="Theme options"
                      aria-expanded={themeMenuOpen}
                    >
                      <MaterialYouIcon
                        name={isDarkMode ? "moon" : "sun"}
                        size="md"
                        aria-hidden={true} 
                      />
                    </button>

                    {/* Theme Menu */}
                    {themeMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 surface-container-high elevation-3 rounded-xl border border-outline-variant z-50">
                        <div className="py-2">
                          <button
                            onClick={() => {
                              setThemeMode('light');
                              setThemeMenuOpen(false);
                            }}
                            className="flex items-center w-full px-4 py-2 text-on-surface hover:bg-on-surface/[0.08] text-body-medium"
                          >
                            <MaterialYouIcon name="sun" size="sm" className="mr-3" />
                            Light
                          </button>
                          <button
                            onClick={() => {
                              setThemeMode('dark');
                              setThemeMenuOpen(false);
                            }}
                            className="flex items-center w-full px-4 py-2 text-on-surface hover:bg-on-surface/[0.08] text-body-medium"
                          >
                            <MaterialYouIcon name="moon" size="sm" className="mr-3" />
                            Dark
                          </button>
                          <button
                            onClick={() => {
                              setThemeMode('auto');
                              setThemeMenuOpen(false);
                            }}
                            className="flex items-center w-full px-4 py-2 text-on-surface hover:bg-on-surface/[0.08] text-body-medium"
                          >
                            <MaterialYouIcon name="palette" size="sm" className="mr-3" />
                            System
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {user ? (
                    <>
                      {/* Notifications */}
                      <div className="hidden sm:block">
                        <NotificationDropdown className="text-on-surface" />
                      </div>

                      {/* User Menu - No name shown in navigation bar */}
                      <div className="relative" ref={userMenuRef}>
                        <button
                          type="button"
                          className="flex items-center p-1 rounded-full state-layer text-on-surface hover:bg-on-surface/[0.08] focus:bg-on-surface/[0.12] transition-all duration-md-short2 ease-md-standard"
                          onClick={() => setUserMenuOpen(!userMenuOpen)}
                          aria-label="User menu"
                          aria-expanded={userMenuOpen}
                        >
                          <Avatar 
                            user={user}
                            profileImageUrl={profile?.profile_image_url}
                            size="md"
                            showLetterFallback={true}
                          />
                        </button>

                        {/* User Dropdown Menu with improved styling */}
                        {userMenuOpen && (
                          <div className="absolute right-0 mt-2 w-64 surface-container-high elevation-3 rounded-xl border border-outline-variant z-50">
                            <div className="py-2">
                              {/* User Info Section with improved styling */}
                              <div className="px-4 py-4 border-b border-outline-variant">
                                <div className="flex flex-col space-y-2">
                                  <div className="flex-1">
                                    <p className="text-title-medium font-semibold text-on-surface leading-tight">
                                      {profile?.display_name || user.user_metadata?.display_name || user.email?.split('@')[0] || 'User'}
                                    </p>
                                    <div className="inline-block bg-secondary-container rounded-full px-3 py-1 mt-2">
                                      <p className="text-sm font-medium text-on-secondary-container">
                                        {user.email}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Dashboard - moved from main navigation */}
                              <Link
                                href="/dashboard"
                                className="flex items-center px-4 py-3 text-on-surface hover:bg-on-surface/[0.08] text-body-large font-medium"
                                onClick={() => setUserMenuOpen(false)}
                              >
                                <MaterialYouIcon name="home" size="md" className="mr-3" />
                                Dashboard
                              </Link>
                              
                              <hr className="my-1 border-outline-variant" />
                              
                              {/* Profile - shows public profile */}
                              <Link
                                href="/profile"
                                className="flex items-center px-4 py-3 text-on-surface hover:bg-on-surface/[0.08] text-body-large font-medium"
                                onClick={() => setUserMenuOpen(false)}
                              >
                                <MaterialYouIcon name="user" size="md" className="mr-3" />
                                View Profile
                              </Link>
                              
                                                             <hr className="my-1 border-outline-variant" />
                              
                              <button
                                onClick={() => {
                                  signOut();
                                  setUserMenuOpen(false);
                                }}
                                className="flex items-center w-full px-4 py-3 text-on-surface hover:bg-on-surface/[0.08] text-body-large font-medium"
                              >
                                <MaterialYouIcon name="arrow-right" size="md" className="mr-3" />
                                Sign Out
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    /* Unauthenticated Actions */
                    <div className="flex items-center space-x-3">
                      <Link
                        href="/login"
                        className="text-on-surface-variant hover:text-on-surface transition-colors duration-md-short2 ease-md-standard text-label-large"
                      >
                        Login
                      </Link>
                      <Link
                        href="/signup"
                        className="btn-primary"
                      >
                        Sign Up
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Drawer (Mobile/Tablet) */}
      {mobileDrawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/32 z-40 transition-opacity duration-md-medium2 ease-md-standard"
            onClick={() => setMobileDrawerOpen(false)}
            aria-hidden="true"
          />
          
          {/* Drawer */}
          <div
            className="fixed top-0 left-0 h-full w-80 max-w-[85vw] surface-container-high elevation-1 z-50 transform transition-transform duration-md-medium3 ease-md-emphasized"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-outline-variant">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <MaterialYouIcon name="car" size="md" className="text-on-primary" />
                </div>
                <span className="text-title-large font-heading text-on-surface">
                  Project Cars
                </span>
              </div>
              
              <button
                type="button"
                className="inline-flex items-center justify-center w-10 h-10 rounded-full state-layer text-on-surface hover:bg-on-surface/[0.08] focus:bg-on-surface/[0.12] transition-all duration-md-short2 ease-md-standard"
                onClick={() => setMobileDrawerOpen(false)}
                aria-label="Close navigation menu"
              >
                <MaterialYouIcon name="close" size="lg" />
              </button>
            </div>

            {/* User Section (if authenticated) with improved styling */}
            {user && (
              <div className="p-4 border-b border-outline-variant">
                <div className="flex items-center space-x-3">
                  <Avatar 
                    user={user}
                    profileImageUrl={profile?.profile_image_url}
                    size="xl"
                    showLetterFallback={true}
                  />
                  <div>
                    <p className="text-title-medium font-semibold text-on-surface leading-tight">
                      {profile?.display_name || user.user_metadata?.display_name || user.email?.split('@')[0] || 'User'}
                    </p>
                    <div className="inline-block bg-secondary-container rounded-full px-3 py-1 mt-2">
                      <p className="text-sm font-medium text-on-secondary-container">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Links */}
            <nav className="flex-1 px-4 py-6 space-y-2" role="navigation" aria-label="Mobile navigation">
              {visibleLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center space-x-3 px-4 py-3 rounded-xl text-on-surface hover:bg-on-surface/[0.08] active:bg-on-surface/[0.12] transition-all duration-md-short2 ease-md-standard text-label-large state-layer"
                  onClick={() => setMobileDrawerOpen(false)}
                >
                  <MaterialYouIcon name={link.icon} size="lg" aria-hidden={true} />
                  <span>{link.label}</span>
                </Link>
              ))}

              {/* Mobile-only links */}
              {user && (
                <>
                  <Link
                    href="/dashboard"
                    className="flex items-center space-x-3 px-4 py-3 rounded-xl text-on-surface hover:bg-on-surface/[0.08] active:bg-on-surface/[0.12] transition-all duration-md-short2 ease-md-standard text-label-large state-layer"
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    <MaterialYouIcon name="home" size="lg" />
                    <span>Dashboard</span>
                  </Link>
                  
                  <Link
                    href="/profile"
                    className="flex items-center space-x-3 px-4 py-3 rounded-xl text-on-surface hover:bg-on-surface/[0.08] active:bg-on-surface/[0.12] transition-all duration-md-short2 ease-md-standard text-label-large state-layer"
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    <MaterialYouIcon name="user" size="lg" />
                    <span>Profile</span>
                  </Link>



                  {/* Mobile Notifications */}
                  <div className="px-4 py-3">
                    <NotificationDropdown />
                  </div>
                </>
              )}
            </nav>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-outline-variant">
              {user ? (
                <button
                  onClick={() => {
                    signOut();
                    setMobileDrawerOpen(false);
                  }}
                  className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-on-surface hover:bg-on-surface/[0.08] active:bg-on-surface/[0.12] transition-all duration-md-short2 ease-md-standard text-label-large state-layer"
                >
                  <MaterialYouIcon name="arrow-right" size="lg" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/login"
                    className="flex items-center justify-center w-full px-4 py-3 rounded-xl text-on-surface hover:bg-on-surface/[0.08] transition-all duration-md-short2 ease-md-standard text-label-large state-layer"
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="btn-primary w-full text-center"
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
} 