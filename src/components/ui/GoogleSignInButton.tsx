'use client'

import { useState } from 'react'
import { supabase } from '@/lib/auth'
import LoadingSpinner from '@/components/LoadingSpinner'
import { parseSupabaseAuthError, logAuthError, getRetryStrategy, OAUTH_ERROR_CODES } from '@/lib/auth-errors'

interface GoogleSignInButtonProps {
  /**
   * The redirect URL after successful authentication
   * @default '/dashboard'
   */
  redirectTo?: string
  /**
   * Button variant - filled or outlined
   * @default 'filled'
   */
  variant?: 'filled' | 'outlined'
  /**
   * Button size - small, medium, or large
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large'
  /**
   * Full width button
   * @default true
   */
  fullWidth?: boolean
  /**
   * Additional CSS classes
   */
  className?: string
  /**
   * Callback function called on sign-in success
   */
  onSuccess?: () => void
  /**
   * Callback function called on sign-in error
   */
  onError?: (error: Error) => void
}

export default function GoogleSignInButton({
  redirectTo = '/dashboard',
  variant = 'filled',
  size = 'medium',
  fullWidth = true,
  className = '',
  onSuccess,
  onError,
}: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    if (isLoading) return

    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        console.error('Google Sign-In error:', error)
        
        // Parse and handle the error using our error handling system
        const authError = parseSupabaseAuthError(error, {
          provider: 'google',
          operation: 'signin',
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        })
        
        // Log the error for monitoring
        logAuthError(authError, {
          provider: 'google',
          operation: 'signin',
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        })
        
        // Create a user-friendly error message
        const userError = new Error(authError.userMessage)
        userError.name = authError.code
        onError?.(userError)
      } else {
        console.log('Google Sign-In initiated successfully')
        onSuccess?.()
      }
    } catch (err) {
      console.error('Unexpected error during Google Sign-In:', err)
      
      // Handle network errors and other unexpected issues
      const authError = parseSupabaseAuthError(err, {
        provider: 'google',
        operation: 'signin',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      })
      
      logAuthError(authError, {
        provider: 'google',
        operation: 'signin',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      })
      
      const userError = new Error(authError.userMessage)
      userError.name = authError.code
      onError?.(userError)
    } finally {
      setIsLoading(false)
    }
  }

  // Size variants
  const sizeClasses = {
    small: 'py-2 px-4 text-md-label-medium',
    medium: 'py-3 px-6 text-md-label-large',
    large: 'py-4 px-8 text-md-label-large',
  }

  // Icon size variants
  const iconSizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6',
  }

  // Base classes
  const baseClasses = `
    inline-flex items-center justify-center gap-3 
    rounded-2xl font-semibold transition-all duration-200 
    focus:outline-none focus:ring-2 focus:ring-offset-2 
    disabled:opacity-60 disabled:cursor-not-allowed 
    disabled:hover:scale-100 hover:scale-105
    shadow-md-elevation-1 hover:shadow-md-elevation-2
    border border-transparent
  `.trim()

  // Variant classes
  const variantClasses = {
    filled: `
      bg-md-sys-primary text-md-sys-on-primary 
      hover:bg-md-sys-primary/90 
      focus:ring-md-sys-primary/20
    `.trim(),
    outlined: `
      bg-md-sys-surface text-md-sys-on-surface 
      border-md-sys-outline hover:border-md-sys-outline/80 
      hover:bg-md-sys-surface-variant/50 
      focus:ring-md-sys-primary/20
    `.trim(),
  }

  // Width classes
  const widthClasses = fullWidth ? 'w-full' : 'w-auto'

  const buttonClasses = `
    ${baseClasses} 
    ${sizeClasses[size]} 
    ${variantClasses[variant]} 
    ${widthClasses} 
    ${className}
  `.trim()

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      className={buttonClasses}
      aria-label="Sign in with Google"
    >
      {isLoading ? (
        <>
          <LoadingSpinner />
          <span>Signing in with Google...</span>
        </>
      ) : (
        <>
          {/* Google Logo SVG */}
          <svg
            className={iconSizeClasses[size]}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span>Continue with Google</span>
        </>
      )}
    </button>
  )
}
