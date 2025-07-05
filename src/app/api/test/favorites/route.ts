import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    console.log('[FAVORITES TEST] Starting test...');
    
    // Check auth
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    console.log('[FAVORITES TEST] Session:', { session: !!session, error: authError?.message, userId: session?.user?.id, email: session?.user?.email });
    
    if (!session) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    // Test direct query
    const { data: favorites, error: favError } = await supabase
      .from('favorites')
      .select(`
        id,
        created_at,
        listing:listings(
          id,
          title,
          make,
          model,
          year,
          price,
          location,
          description,
          engine,
          transmission,
          mileage,
          condition,
          status,
          created_at,
          listing_images(
            id,
            image_url,
            is_primary
          )
        )
      `)
      .eq('user_id', session.user.id);

    console.log('[FAVORITES TEST] Raw query result:', { favorites, error: favError });

    if (favError) {
      return NextResponse.json({ error: 'Database error', details: favError }, { status: 500 });
    }

    // Test API endpoint
    let apiResult;
    try {
      const apiResponse = await fetch(`${request.nextUrl.origin}/api/favorites`, {
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('Cookie') || '',
        },
      });
      apiResult = {
        status: apiResponse.status,
        data: apiResponse.ok ? await apiResponse.json() : await apiResponse.text(),
      };
    } catch (err) {
      apiResult = { error: 'Failed to call API', details: err };
    }

    return NextResponse.json({
      session: {
        userId: session.user.id,
        email: session.user.email,
      },
      directQuery: {
        count: favorites?.length || 0,
        favorites,
      },
      apiCall: apiResult,
    });

  } catch (error) {
    console.error('[FAVORITES TEST] Error:', error);
    return NextResponse.json(
      { error: 'Test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ 
        error: 'Authentication required',
        test: 'favorites_integration_test',
        status: 'failed' 
      }, { status: 401 });
    }

    const body = await request.json();
    const { test_type = 'full_integration' } = body;

    const testResults = {
      test: 'favorites_integration_test',
      test_type,
      timestamp: new Date().toISOString(),
      user_id: session.user.id,
      operations: [] as any[]
    };

    // Integration Test: Full CRUD cycle
    if (test_type === 'full_integration') {
      // Step 1: Get a test listing
      const { data: testListing, error: listingError } = await supabase
        .from('listings')
        .select('id, title, user_id')
        .neq('user_id', session.user.id) // Don't use own listing
        .limit(1)
        .single();

      if (listingError || !testListing) {
        return NextResponse.json({
          ...testResults,
          error: 'No suitable test listing found',
          status: 'skipped'
        });
      }

      testResults.operations.push({
        step: 1,
        operation: 'found_test_listing',
        status: 'passed',
        listing_id: testListing.id,
        listing_title: testListing.title
      });

      // Step 2: Add to favorites
      const { data: addedFavorite, error: addError } = await supabase
        .from('favorites')
        .insert({
          user_id: session.user.id,
          listing_id: testListing.id
        })
        .select()
        .single();

      testResults.operations.push({
        step: 2,
        operation: 'add_favorite',
        status: addError ? 'failed' : 'passed',
        error: addError?.message,
        favorite_id: addedFavorite?.id
      });

      if (!addError && addedFavorite) {
        // Step 3: Verify favorite exists
        const { data: verifyFavorite, error: verifyError } = await supabase
          .from('favorites')
          .select('id, created_at')
          .eq('id', addedFavorite.id)
          .single();

        testResults.operations.push({
          step: 3,
          operation: 'verify_favorite_exists',
          status: verifyError ? 'failed' : 'passed',
          error: verifyError?.message,
          verified: !!verifyFavorite
        });

        // Step 4: Test duplicate prevention
        const { data: duplicateFavorite, error: duplicateError } = await supabase
          .from('favorites')
          .insert({
            user_id: session.user.id,
            listing_id: testListing.id
          });

        const duplicatePrevented = !!duplicateError;
        testResults.operations.push({
          step: 4,
          operation: 'test_duplicate_prevention',
          status: duplicatePrevented ? 'passed' : 'failed',
          error: duplicateError?.message,
          result: duplicatePrevented ? 'Duplicate correctly prevented' : 'Duplicate was allowed (should not happen)'
        });

        // Step 5: Remove favorite (cleanup)
        const { error: removeError } = await supabase
          .from('favorites')
          .delete()
          .eq('id', addedFavorite.id);

        testResults.operations.push({
          step: 5,
          operation: 'remove_favorite_cleanup',
          status: removeError ? 'failed' : 'passed',
          error: removeError?.message
        });
      }
    }

    // Calculate test status
    const failedOps = testResults.operations.filter(op => op.status === 'failed').length;
    const overallStatus = failedOps > 0 ? 'failed' : 'passed';

    return NextResponse.json({
      ...testResults,
      summary: {
        overall_status: overallStatus,
        total_operations: testResults.operations.length,
        failed_operations: failedOps,
        success_rate: ((testResults.operations.length - failedOps) / testResults.operations.length * 100).toFixed(1) + '%'
      }
    });

  } catch (error) {
    console.error('Favorites integration test error:', error);
    return NextResponse.json({ 
      test: 'favorites_integration_test',
      error: 'Integration test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      status: 'error'
    }, { status: 500 });
  }
} 