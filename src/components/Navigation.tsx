'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useMaterialYouTheme } from '@/lib/material-you-theme';
import NotificationDropdown from '@/components/NotificationDropdown';
import { useState, useRef, useEffect } from 'react';
import { Menu, X, Home, MessageCircle, Car, DollarSign, User, LogOut, Sun, Moon, Palette } from 'lucide-react';

interface NavigationProps {
  className?: string;
  variant?: 'default' | 'transparent';
}

export default function Navigation({ className = '', variant = 'default' }: NavigationProps) {
  const { user, signOut, loading } = useAuth();
  const { theme, setThemeMode, isDarkMode } = useMaterialYouTheme();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const mobileDrawerRef = useRef<HTMLDivElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const skipLinkRef = useRef<HTMLAnchorElement>(null);

  // Focus management for mobile drawer
  useEffect(() => {
    if (mobileDrawerOpen) {
      // Focus the close button when drawer opens
      const closeButton = mobileDrawerRef.current?.querySelector('button[aria-label="Close navigation menu"]') as HTMLButtonElement;
      if (closeButton) {
        closeButton.focus();
      }
    } else {
      // Return focus to the menu button when drawer closes
      if (mobileMenuButtonRef.current) {
        mobileMenuButtonRef.current.focus();
      }
    }
  }, [mobileDrawerOpen]);

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

  // Enhanced keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Global escape key handling
      if (event.key === 'Escape') {
        setMobileDrawerOpen(false);
        setUserMenuOpen(false);
        setThemeMenuOpen(false);
        return;
      }

      // Focus trap for mobile drawer
      if (mobileDrawerOpen && mobileDrawerRef.current) {
        const focusableElements = mobileDrawerRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (event.key === 'Tab') {
          if (event.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstElement) {
              event.preventDefault();
              lastElement.focus();
            }
          } else {
            // Tab
            if (document.activeElement === lastElement) {
              event.preventDefault();
              firstElement.focus();
            }
          }
        }
      }

      // Arrow key navigation for dropdowns
      if (userMenuOpen && userMenuRef.current) {
        const menuItems = userMenuRef.current.querySelectorAll('a, button');
        const currentIndex = Array.from(menuItems).indexOf(document.activeElement as Element);
        
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          const nextIndex = currentIndex < menuItems.length - 1 ? currentIndex + 1 : 0;
          (menuItems[nextIndex] as HTMLElement).focus();
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : menuItems.length - 1;
          (menuItems[prevIndex] as HTMLElement).focus();
        }
      }

      if (themeMenuOpen && themeMenuRef.current) {
        const menuItems = themeMenuRef.current.querySelectorAll('button');
        const currentIndex = Array.from(menuItems).indexOf(document.activeElement as HTMLButtonElement);
        
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          const nextIndex = currentIndex < menuItems.length - 1 ? currentIndex + 1 : 0;
          (menuItems[nextIndex] as HTMLElement).focus();
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : menuItems.length - 1;
          (menuItems[prevIndex] as HTMLElement).focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileDrawerOpen, userMenuOpen, themeMenuOpen]);

  const navigationLinks = [
    { href: '/browse', label: 'Browse Cars', icon: Car },
    { href: '/dashboard', label: 'Dashboard', icon: Home, authRequired: true },
    { href: '/messages', label: 'Messages', icon: MessageCircle, authRequired: true },
    { href: '/sell', label: 'Sell Car', icon: DollarSign, authRequired: true },
  ];

  const visibleLinks = navigationLinks.filter(link => !link.authRequired || user);

  const baseClasses = variant === 'transparent' 
    ? 'bg-transparent' 
    : 'surface-container-high elevation-2 border-b border-md-sys-outline-variant';

  return (
    <>
      {/* Skip to main content link */}
      <a
        ref={skipLinkRef}
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-[9999] bg-md-sys-primary text-md-sys-on-primary px-4 py-2 rounded-lg text-md-label-large font-medium transition-all duration-md-short2 ease-md-standard"
        onFocus={() => {
          // Announce to screen readers
          const announcement = document.createElement('div');
          announcement.setAttribute('aria-live', 'polite');
          announcement.setAttribute('aria-atomic', 'true');
          announcement.className = 'sr-only';
          announcement.textContent = 'Skip to main content link focused';
          document.body.appendChild(announcement);
          setTimeout(() => document.body.removeChild(announcement), 1000);
        }}
      >
        Skip to main content
      </a>

      {/* Material You Top App Bar */}
      <header 
        className={`${baseClasses} transition-all duration-md-short4 ease-md-standard ${className}`}
        role="banner"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Leading Section */}
            <div className="flex items-center space-x-4">
              {/* Mobile Menu Button */}
              <button
                ref={mobileMenuButtonRef}
                type="button"
                className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-full state-layer text-md-sys-on-surface hover:bg-md-sys-on-surface/[0.08] focus:bg-md-sys-on-surface/[0.12] focus:outline-none focus:ring-2 focus:ring-md-sys-primary focus:ring-offset-2 transition-all duration-md-short2 ease-md-standard"
                onClick={() => setMobileDrawerOpen(true)}
                aria-label="Open navigation menu"
                aria-expanded={mobileDrawerOpen}
                aria-controls="mobile-navigation-drawer"
              >
                <Menu className="h-6 w-6" aria-hidden="true" />
              </button>

              {/* Logo/Brand */}
              <Link 
                href="/" 
                className="flex items-center space-x-2 text-md-sys-on-surface hover:text-md-sys-primary focus:text-md-sys-primary focus:outline-none focus:ring-2 focus:ring-md-sys-primary focus:ring-offset-2 rounded-lg px-2 py-1 transition-all duration-md-short3 ease-md-standard"
                aria-label="Project Car Marketplace - Go to homepage"
              >
                <div className="w-8 h-8 bg-md-sys-primary rounded-lg flex items-center justify-center">
                  <Car className="h-5 w-5 text-md-sys-on-primary" aria-hidden="true" />
                </div>
                <span className="text-md-title-large font-heading hidden sm:block">
                  Project Car Marketplace
                </span>
                <span className="text-md-title-large font-heading sm:hidden">
                  Project Cars
                </span>
              </Link>
            </div>

            {/* Center Navigation (Desktop) - Only show Browse Cars for unauthenticated users */}
            <nav className="hidden lg:flex items-center space-x-1" role="navigation" aria-label="Main navigation">
              {user && visibleLinks.filter(link => link.href !== '/browse').map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="inline-flex items-center space-x-2 px-4 py-2 rounded-full text-md-sys-on-surface-variant hover:text-md-sys-on-surface hover:bg-md-sys-on-surface/[0.08] focus:bg-md-sys-on-surface/[0.12] focus:text-md-sys-on-surface focus:outline-none focus:ring-2 focus:ring-md-sys-primary focus:ring-offset-2 active:bg-md-sys-on-surface/[0.12] transition-all duration-md-short2 ease-md-standard text-md-label-large state-layer"
                    aria-label={`Navigate to ${link.label}`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Actions Section */}
            <div className="flex items-center space-x-2" role="toolbar" aria-label="User actions">
              {loading ? (
                <div 
                  className="w-6 h-6 animate-spin rounded-full border-2 border-md-sys-primary border-t-transparent"
                  role="status"
                  aria-label="Loading user authentication status"
                />
              ) : user ? (
                <>
                  {/* Notifications */}
                  <div className="hidden sm:block">
                    <NotificationDropdown className="text-md-sys-on-surface" />
                  </div>

                  {/* Theme Toggle */}
                  <div className="relative" ref={themeMenuRef}>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center w-10 h-10 rounded-full state-layer text-md-sys-on-surface-variant hover:text-md-sys-on-surface hover:bg-md-sys-on-surface/[0.08] focus:bg-md-sys-on-surface/[0.12] focus:text-md-sys-on-surface focus:outline-none focus:ring-2 focus:ring-md-sys-primary focus:ring-offset-2 transition-all duration-md-short2 ease-md-standard"
                      onClick={() => setThemeMenuOpen(!themeMenuOpen)}
                      aria-label={`Theme options - Current theme: ${isDarkMode ? 'Dark' : 'Light'}`}
                      aria-expanded={themeMenuOpen}
                      aria-haspopup="menu"
                    >
                      {isDarkMode ? (
                        <Moon className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <Sun className="h-5 w-5" aria-hidden="true" />
                      )}
                    </button>

                    {/* Theme Menu */}
                    {themeMenuOpen && (
                      <div 
                        className="absolute right-0 mt-2 w-48 surface-container-high elevation-3 rounded-xl border border-md-sys-outline-variant z-50"
                        role="menu"
                        aria-label="Theme selection menu"
                      >
                        <div className="py-2">
                          <button
                            role="menuitem"
                            onClick={() => {
                              setThemeMode('light');
                              setThemeMenuOpen(false);
                            }}
                            className="flex items-center w-full px-4 py-2 text-md-sys-on-surface hover:bg-md-sys-on-surface/[0.08] focus:bg-md-sys-on-surface/[0.12] focus:outline-none text-md-body-medium transition-all duration-md-short2 ease-md-standard"
                            aria-label="Switch to light theme"
                          >
                            <Sun className="h-4 w-4 mr-3" aria-hidden="true" />
                            Light
                          </button>
                          <button
                            role="menuitem"
                            onClick={() => {
                              setThemeMode('dark');
                              setThemeMenuOpen(false);
                            }}
                            className="flex items-center w-full px-4 py-2 text-md-sys-on-surface hover:bg-md-sys-on-surface/[0.08] focus:bg-md-sys-on-surface/[0.12] focus:outline-none text-md-body-medium transition-all duration-md-short2 ease-md-standard"
                            aria-label="Switch to dark theme"
                          >
                            <Moon className="h-4 w-4 mr-3" aria-hidden="true" />
                            Dark
                          </button>
                          <button
                            role="menuitem"
                            onClick={() => {
                              setThemeMode('auto');
                              setThemeMenuOpen(false);
                            }}
                            className="flex items-center w-full px-4 py-2 text-md-sys-on-surface hover:bg-md-sys-on-surface/[0.08] focus:bg-md-sys-on-surface/[0.12] focus:outline-none text-md-body-medium transition-all duration-md-short2 ease-md-standard"
                            aria-label="Use system theme setting"
                          >
                            <Palette className="h-4 w-4 mr-3" aria-hidden="true" />
                            System
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* User Menu */}
                  <div className="relative" ref={userMenuRef}>
                    <button
                      type="button"
                      className="flex items-center space-x-2 p-1 rounded-full state-layer text-md-sys-on-surface hover:bg-md-sys-on-surface/[0.08] focus:bg-md-sys-on-surface/[0.12] focus:outline-none focus:ring-2 focus:ring-md-sys-primary focus:ring-offset-2 transition-all duration-md-short2 ease-md-standard"
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      aria-label={`User menu for ${user.user_metadata?.display_name || user.email}`}
                      aria-expanded={userMenuOpen}
                      aria-haspopup="menu"
                    >
                      <div className="w-8 h-8 bg-md-sys-primary rounded-full flex items-center justify-center text-md-sys-on-primary text-sm font-medium">
                        {(user.user_metadata?.display_name || user.email)?.charAt(0).toUpperCase()}
                      </div>
                      <span className="hidden lg:block text-md-body-medium">
                        {user.user_metadata?.display_name || user.email?.split('@')[0]}
                      </span>
                    </button>

                    {/* User Dropdown Menu */}
                    {userMenuOpen && (
                      <div 
                        className="absolute right-0 mt-2 w-56 surface-container-high elevation-3 rounded-xl border border-md-sys-outline-variant z-50"
                        role="menu"
                        aria-label="User account menu"
                      >
                        <div className="py-2">
                          <div className="px-4 py-3 border-b border-md-sys-outline-variant">
                            <p className="text-md-body-medium text-md-sys-on-surface">
                              {user.user_metadata?.display_name || 'User'}
                            </p>
                            <p className="text-sm text-md-sys-on-surface-variant">
                              {user.email}
                            </p>
                          </div>
                          
                          <Link
                            href="/profile"
                            role="menuitem"
                            className="flex items-center px-4 py-2 text-md-sys-on-surface hover:bg-md-sys-on-surface/[0.08] focus:bg-md-sys-on-surface/[0.12] focus:outline-none text-md-body-medium transition-all duration-md-short2 ease-md-standard"
                            onClick={() => setUserMenuOpen(false)}
                            aria-label="View your profile"
                          >
                            <User className="h-4 w-4 mr-3" aria-hidden="true" />
                            View Profile
                          </Link>
                          
                          <Link
                            href="/profile"
                            role="menuitem"
                            className="flex items-center px-4 py-2 text-md-sys-on-surface hover:bg-md-sys-on-surface/[0.08] focus:bg-md-sys-on-surface/[0.12] focus:outline-none text-md-body-medium transition-all duration-md-short2 ease-md-standard"
                            onClick={() => setUserMenuOpen(false)}
                            aria-label="Access account settings"
                          >
                            <User className="h-4 w-4 mr-3" aria-hidden="true" />
                            Account Settings
                          </Link>
                          
                          <hr className="my-1 border-md-sys-outline-variant" />
                          
                          <button
                            role="menuitem"
                            onClick={() => {
                              signOut();
                              setUserMenuOpen(false);
                            }}
                            className="flex items-center w-full px-4 py-2 text-md-sys-on-surface hover:bg-md-sys-on-surface/[0.08] focus:bg-md-sys-on-surface/[0.12] focus:outline-none text-md-body-medium transition-all duration-md-short2 ease-md-standard"
                            aria-label="Sign out of your account"
                          >
                            <LogOut className="h-4 w-4 mr-3" aria-hidden="true" />
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
                    href="/browse"
                    className="inline-flex items-center space-x-2 px-4 py-2 rounded-full text-md-sys-on-surface-variant hover:text-md-sys-on-surface hover:bg-md-sys-on-surface/[0.08] focus:bg-md-sys-on-surface/[0.12] focus:text-md-sys-on-surface focus:outline-none focus:ring-2 focus:ring-md-sys-primary focus:ring-offset-2 active:bg-md-sys-on-surface/[0.12] transition-all duration-md-short2 ease-md-standard text-md-label-large state-layer"
                    aria-label="Browse available cars"
                  >
                    <Car className="h-5 w-5" aria-hidden="true" />
                    <span>Browse Cars</span>
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center px-6 py-2 rounded-full border border-md-sys-outline text-md-sys-on-surface hover:bg-md-sys-on-surface/[0.08] focus:bg-md-sys-on-surface/[0.12] focus:outline-none focus:ring-2 focus:ring-md-sys-primary focus:ring-offset-2 transition-all duration-md-short2 ease-md-standard text-md-label-large font-medium"
                    aria-label="Sign in to your account"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="btn-primary focus:outline-none focus:ring-2 focus:ring-md-sys-primary focus:ring-offset-2"
                    aria-label="Create a new account"
                  >
                    Sign Up
                  </Link>
                </div>
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
            ref={mobileDrawerRef}
            id="mobile-navigation-drawer"
            className="fixed top-0 left-0 h-full w-80 max-w-[85vw] surface-container-high elevation-1 z-50 transform transition-transform duration-md-medium3 ease-md-emphasized"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation menu"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-md-sys-outline-variant">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-md-sys-primary rounded-lg flex items-center justify-center">
                  <Car className="h-5 w-5 text-md-sys-on-primary" aria-hidden="true" />
                </div>
                <span className="text-md-title-large font-heading text-md-sys-on-surface">
                  Project Cars
                </span>
              </div>
              
              <button
                type="button"
                className="inline-flex items-center justify-center w-10 h-10 rounded-full state-layer text-md-sys-on-surface hover:bg-md-sys-on-surface/[0.08] focus:bg-md-sys-on-surface/[0.12] focus:outline-none focus:ring-2 focus:ring-md-sys-primary focus:ring-offset-2 transition-all duration-md-short2 ease-md-standard"
                onClick={() => setMobileDrawerOpen(false)}
                aria-label="Close navigation menu"
              >
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            {/* User Section (if authenticated) */}
            {user && (
              <div className="p-4 border-b border-md-sys-outline-variant">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-md-sys-primary rounded-full flex items-center justify-center text-md-sys-on-primary text-lg font-medium">
                    {(user.user_metadata?.display_name || user.email)?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-md-body-medium text-md-sys-on-surface font-medium">
                      {user.user_metadata?.display_name || 'User'}
                    </p>
                    <p className="text-sm text-md-sys-on-surface-variant">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Links */}
            <nav className="flex-1 px-4 py-6 space-y-2" role="navigation" aria-label="Mobile navigation">
              {visibleLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center space-x-3 px-4 py-3 rounded-xl text-md-sys-on-surface hover:bg-md-sys-on-surface/[0.08] focus:bg-md-sys-on-surface/[0.12] focus:outline-none focus:ring-2 focus:ring-md-sys-primary focus:ring-offset-2 active:bg-md-sys-on-surface/[0.12] transition-all duration-md-short2 ease-md-standard text-md-label-large state-layer"
                    onClick={() => setMobileDrawerOpen(false)}
                    aria-label={`Navigate to ${link.label}`}
                  >
                    <Icon className="h-6 w-6" aria-hidden="true" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}

              {/* Mobile-only links */}
              {user && (
                <>
                  <Link
                    href="/profile"
                    className="flex items-center space-x-3 px-4 py-3 rounded-xl text-md-sys-on-surface hover:bg-md-sys-on-surface/[0.08] focus:bg-md-sys-on-surface/[0.12] focus:outline-none focus:ring-2 focus:ring-md-sys-primary focus:ring-offset-2 active:bg-md-sys-on-surface/[0.12] transition-all duration-md-short2 ease-md-standard text-md-label-large state-layer"
                    onClick={() => setMobileDrawerOpen(false)}
                    aria-label="View your profile"
                  >
                    <User className="h-6 w-6" aria-hidden="true" />
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
            <div className="p-4 border-t border-md-sys-outline-variant">
              {user ? (
                <button
                  onClick={() => {
                    signOut();
                    setMobileDrawerOpen(false);
                  }}
                  className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-md-sys-on-surface hover:bg-md-sys-on-surface/[0.08] focus:bg-md-sys-on-surface/[0.12] focus:outline-none focus:ring-2 focus:ring-md-sys-primary focus:ring-offset-2 active:bg-md-sys-on-surface/[0.12] transition-all duration-md-short2 ease-md-standard text-md-label-large state-layer"
                  aria-label="Sign out of your account"
                >
                  <LogOut className="h-6 w-6" aria-hidden="true" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/browse"
                    className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-md-sys-on-surface hover:bg-md-sys-on-surface/[0.08] focus:bg-md-sys-on-surface/[0.12] focus:outline-none focus:ring-2 focus:ring-md-sys-primary focus:ring-offset-2 transition-all duration-md-short2 ease-md-standard text-md-label-large state-layer"
                    onClick={() => setMobileDrawerOpen(false)}
                    aria-label="Browse available cars"
                  >
                    <Car className="h-6 w-6" aria-hidden="true" />
                    <span>Browse Cars</span>
                  </Link>
                  <Link
                    href="/login"
                    className="flex items-center justify-center w-full px-4 py-3 rounded-xl border border-md-sys-outline text-md-sys-on-surface hover:bg-md-sys-on-surface/[0.08] focus:bg-md-sys-on-surface/[0.12] focus:outline-none focus:ring-2 focus:ring-md-sys-primary focus:ring-offset-2 transition-all duration-md-short2 ease-md-standard text-md-label-large font-medium"
                    onClick={() => setMobileDrawerOpen(false)}
                    aria-label="Sign in to your account"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="btn-primary w-full text-center focus:outline-none focus:ring-2 focus:ring-md-sys-primary focus:ring-offset-2"
                    onClick={() => setMobileDrawerOpen(false)}
                    aria-label="Create a new account"
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