import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  console.log('=== Environment Validation Test ===');
  
  const validationResults = {
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    tests: {
      environmentVariables: { status: 'pending', details: {} },
      databaseConnection: { status: 'pending', details: {} },
      authSystem: { status: 'pending', details: {} },
      basicQueries: { status: 'pending', details: {} }
    }
  };

  try {
    // Test 1: Environment Variables
    console.log('Testing environment variables...');
    const envVars = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'Missing',
      NODE_ENV: process.env.NODE_ENV
    };

    const missingVars = Object.entries(envVars)
      .filter(([key, value]) => !value || value === 'Missing')
      .map(([key]) => key);

    if (missingVars.length > 0) {
      validationResults.tests.environmentVariables = {
        status: 'failed',
        details: { missing: missingVars, present: envVars }
      };
    } else {
      validationResults.tests.environmentVariables = {
        status: 'passed',
        details: { variables: envVars }
      };
    }

    // Test 2: Database Connection
    console.log('Testing database connection...');
    const supabase = createRouteHandlerClient({ cookies });
    
    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (connectionError) {
      validationResults.tests.databaseConnection = {
        status: 'failed',
        details: { error: connectionError.message, code: connectionError.code }
      };
    } else {
      validationResults.tests.databaseConnection = {
        status: 'passed',
        details: { message: 'Database connection successful' }
      };
    }

    // Test 3: Auth System
    console.log('Testing auth system...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      validationResults.tests.authSystem = {
        status: 'failed',
        details: { error: sessionError.message }
      };
    } else {
      validationResults.tests.authSystem = {
        status: 'passed',
        details: { 
          sessionExists: !!session,
          message: session ? 'User authenticated' : 'No active session (expected for API test)'
        }
      };
    }

    // Test 4: Basic Queries
    console.log('Testing basic queries...');
    const queries = [];
    
    // Test listings table
    try {
      const { data: listingsTest, error: listingsError } = await supabase
        .from('listings')
        .select('count')
        .limit(1);
      
      queries.push({
        table: 'listings',
        status: listingsError ? 'failed' : 'passed',
        error: listingsError?.message
      });
    } catch (err: any) {
      queries.push({
        table: 'listings',
        status: 'failed',
        error: err.message
      });
    }

    // Test profiles table
    try {
      const { data: profilesTest, error: profilesError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      queries.push({
        table: 'profiles',
        status: profilesError ? 'failed' : 'passed',
        error: profilesError?.message
      });
    } catch (err: any) {
      queries.push({
        table: 'profiles',
        status: 'failed',
        error: err.message
      });
    }

    const failedQueries = queries.filter(q => q.status === 'failed');
    validationResults.tests.basicQueries = {
      status: failedQueries.length > 0 ? 'failed' : 'passed',
      details: { queries, failedCount: failedQueries.length }
    };

    // Overall validation status
    const allTests = Object.values(validationResults.tests);
    const failedTests = allTests.filter(test => test.status === 'failed');
    const overallStatus = failedTests.length > 0 ? 'failed' : 'passed';

    console.log('Environment validation complete:', overallStatus);

    return NextResponse.json({
      ...validationResults,
      overallStatus,
      summary: {
        passed: allTests.filter(test => test.status === 'passed').length,
        failed: failedTests.length,
        total: allTests.length
      }
    });

  } catch (error: any) {
    console.error('Environment validation error:', error);
    return NextResponse.json({
      ...validationResults,
      overallStatus: 'error',
      error: {
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    }, { status: 500 });
  }
} 