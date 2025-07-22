/**
 * Utility functions for handling URLs in different environments
 */

/**
 * Get the base URL for the current environment
 * Uses environment variables with fallbacks for different deployment scenarios
 */
export function getSiteUrl(): string {
  // Check for explicit site URL first (useful for production)
  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  // Server-side: try various environment variables
  const siteUrl = 
    process.env.NEXT_PUBLIC_SITE_URL || 
    process.env.VERCEL_URL || 
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    process.env.NEXTAUTH_URL ||
    'http://localhost:3000'

  // Ensure HTTPS for production domains
  if (siteUrl.includes('vercel.app') && !siteUrl.startsWith('https://')) {
    return `https://${siteUrl}`
  }

  // If it starts with a protocol, return as is
  if (siteUrl.startsWith('http://') || siteUrl.startsWith('https://')) {
    return siteUrl
  }

  // Default to https for production domains, http for localhost
  const protocol = siteUrl.includes('localhost') || siteUrl.includes('127.0.0.1') ? 'http://' : 'https://'
  return `${protocol}${siteUrl}`
}

/**
 * Get the OAuth callback URL for the current environment
 */
export function getOAuthCallbackUrl(redirectPath: string = '/dashboard'): string {
  const baseUrl = getSiteUrl()
  return `${baseUrl}/auth/callback?redirect=${encodeURIComponent(redirectPath)}`
}

/**
 * Get the correct redirect URL for different environments
 * This is useful for OAuth providers that need specific redirect URLs
 */
export function getAuthRedirectUrl(provider: 'google' | 'github' | 'facebook' = 'google'): string {
  // In production, always use the production domain
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_SITE_URL || 'https://www.projectcarlistings.com'
  }

  // In development, use localhost
  return getSiteUrl()
}

/**
 * Check if we're running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Check if we're running on Vercel
 */
export function isVercel(): boolean {
  return !!process.env.VERCEL || !!process.env.VERCEL_URL
}
