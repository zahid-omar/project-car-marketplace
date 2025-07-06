import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  console.log('=== Auth Test Endpoint ===');
  
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Try to get the current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.log('Session error:', sessionError);
      return NextResponse.json({ 
        error: 'Failed to get session', 
        details: sessionError.message 
      }, { status: 500 });
    }

    // Try to get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.log('User error:', userError);
      return NextResponse.json({ 
        error: 'Failed to get user', 
        details: userError.message 
      }, { status: 500 });
    }

    // Test database connection by getting user profile
    let profile = null;
    if (user) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.log('Profile error:', profileError);
      } else {
        profile = profileData;
      }
    }

    return NextResponse.json({
      success: true,
      authenticated: !!session,
      user: user ? {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      } : null,
      profile,
      session: session ? {
        expires_at: session.expires_at,
        expires_in: session.expires_in,
      } : null,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.log('Auth test error:', error);
    return NextResponse.json({
      error: 'Authentication test failed',
      details: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
} 