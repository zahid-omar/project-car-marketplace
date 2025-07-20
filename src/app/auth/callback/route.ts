import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { parseSupabaseAuthError, logAuthError, OAUTH_ERROR_CODES, createAuthError } from '@/lib/auth-errors'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  console.log('=== OAuth Callback Handler ===')

  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const redirectPath = requestUrl.searchParams.get('redirect') || '/dashboard'

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error)
    const errorDescription = requestUrl.searchParams.get('error_description')
    
    // Create structured error for logging
    const authError = createAuthError(error, errorDescription || 'Authentication failed', {
      provider: 'google',
      operation: 'callback',
      timestamp: new Date().toISOString(),
      url: request.url,
    })
    
    // Log the error
    logAuthError(authError, {
      provider: 'google',
      operation: 'callback',
      timestamp: new Date().toISOString(),
      url: request.url,
    })
    
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(authError.userMessage)}`,
        requestUrl.origin
      )
    )
  }

  // Handle missing authorization code
  if (!code) {
    console.error('No authorization code received')
    return NextResponse.redirect(
      new URL(
        `/login?error=missing_code&error_description=${encodeURIComponent('No authorization code received')}`,
        requestUrl.origin
      )
    )
  }

  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Exchange the authorization code for a session
    console.log('Exchanging authorization code for session...')
    const { data: authData, error: authError } = await supabase.auth.exchangeCodeForSession(code)

    if (authError) {
      console.error('Error exchanging code for session:', authError)
      
      const structuredError = parseSupabaseAuthError(authError, {
        provider: 'google',
        operation: 'callback',
        timestamp: new Date().toISOString(),
        url: request.url,
      })
      
      logAuthError(structuredError, {
        provider: 'google',
        operation: 'callback',
        timestamp: new Date().toISOString(),
        url: request.url,
      })
      
      return NextResponse.redirect(
        new URL(
          `/login?error=auth_exchange_failed&error_description=${encodeURIComponent(structuredError.userMessage)}`,
          requestUrl.origin
        )
      )
    }

    if (!authData.user) {
      console.error('No user data received after authentication')
      return NextResponse.redirect(
        new URL(
          `/login?error=no_user_data&error_description=${encodeURIComponent('User authentication failed')}`,
          requestUrl.origin
        )
      )
    }

    const user = authData.user
    console.log('User authenticated successfully:', user.email)

    // Check if user profile exists
    const { data: existingProfile, error: profileFetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileFetchError && profileFetchError.code !== 'PGRST116') {
      console.error('Error fetching user profile:', profileFetchError)
    }

    // Create or update user profile if needed
    if (!existingProfile) {
      console.log('Creating new user profile...')
      
      const profileData = {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
        provider: 'google',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { error: profileCreateError } = await supabase
        .from('profiles')
        .insert(profileData)

      if (profileCreateError) {
        console.error('Error creating user profile:', profileCreateError)
        // Don't block the login for profile creation errors
      } else {
        console.log('User profile created successfully')
      }
    } else {
      console.log('User profile already exists, updating if needed...')
      
      // Update profile with latest Google data
      const updateData: any = {
        updated_at: new Date().toISOString(),
      }

      // Update name if available from Google and not already set
      if (!existingProfile.full_name && (user.user_metadata?.full_name || user.user_metadata?.name)) {
        updateData.full_name = user.user_metadata.full_name || user.user_metadata.name
      }

      // Update avatar if available from Google and not already set
      if (!existingProfile.avatar_url && (user.user_metadata?.avatar_url || user.user_metadata?.picture)) {
        updateData.avatar_url = user.user_metadata.avatar_url || user.user_metadata.picture
      }

      if (Object.keys(updateData).length > 1) { // More than just updated_at
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', user.id)

        if (profileUpdateError) {
          console.error('Error updating user profile:', profileUpdateError)
        } else {
          console.log('User profile updated successfully')
        }
      }
    }

    // Redirect to the intended destination
    console.log(`Redirecting to: ${redirectPath}`)
    return NextResponse.redirect(new URL(redirectPath, requestUrl.origin))

  } catch (error) {
    console.error('Unexpected error in OAuth callback:', error)
    
    const authError = parseSupabaseAuthError(error, {
      provider: 'google',
      operation: 'callback',
      timestamp: new Date().toISOString(),
      url: request.url,
    })
    
    logAuthError(authError, {
      provider: 'google',
      operation: 'callback',
      timestamp: new Date().toISOString(),
      url: request.url,
    })
    
    return NextResponse.redirect(
      new URL(
        `/login?error=unexpected_error&error_description=${encodeURIComponent(authError.userMessage)}`,
        requestUrl.origin
      )
    )
  }
}
