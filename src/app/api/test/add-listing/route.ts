import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    console.log('=== CREATE TEST LISTING DEBUG ===');
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    
    // Try multiple methods to get session
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    console.log('Session from getSession:', { session: !!session, error: authError?.message, userId: session?.user?.id });
    
    // Also try getUser method
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('User from getUser:', { user: !!user, error: userError?.message, userId: user?.id });
    
    // Check if we have any user info
    const currentUser = session?.user || user;
    const currentUserId = currentUser?.id;
    
    console.log('Final user info:', { hasUser: !!currentUser, userId: currentUserId, email: currentUser?.email });
    
    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Authentication error', details: authError.message }, { status: 401 });
    }
    
    if (!currentUserId) {
      console.log('No user ID found - returning unauthorized');
      return NextResponse.json({ error: 'No session found. Please log in again.' }, { status: 401 });
    }

    console.log('Creating test listing for user:', currentUserId);

    // Create a test listing
    const { data: listing, error } = await supabase
      .from('listings')
      .insert({
        user_id: currentUserId,
        title: '1995 Honda Civic EK Hatchback - Turbo Build',
        make: 'Honda',
        model: 'Civic',
        year: 1995,
        engine: 'B16A2 Turbo',
        transmission: 'Manual',
        mileage: 145000,
        condition: 'excellent',
        price: 15000,
        location: 'Toronto, ON',
        description: 'Clean 1995 Honda Civic EK hatchback with a fully built B16A2 turbo setup. Recent engine rebuild, new turbo, intercooler, and supporting mods. Strong runner, ready for track or street. Clean title, no accidents.',
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to create test listing', details: error.message }, { status: 500 });
    }

    console.log('Test listing created successfully:', listing);

    return NextResponse.json({ 
      message: 'Test listing created successfully',
      listing 
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
} 