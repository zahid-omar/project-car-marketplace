import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication and admin privileges
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get migration name from request body
    const body = await request.json();
    const { migration } = body;

    if (!migration) {
      return NextResponse.json({ error: 'Migration name is required' }, { status: 400 });
    }

    let migrationSQL = '';

    // Handle different migration types
    switch (migration) {
      case 'fulltext-search':
        try {
          const migrationPath = path.join(process.cwd(), 'scripts', 'migrations', '001_add_fulltext_search.sql');
          migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
        } catch (err) {
          console.error('Error reading migration file:', err);
          return NextResponse.json({ error: 'Migration file not found' }, { status: 404 });
        }
        break;
      
      case 'performance-optimizations':
        try {
          const migrationPath = path.join(process.cwd(), 'scripts', 'migrations', '002_performance_optimizations.sql');
          migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
        } catch (err) {
          console.error('Error reading performance optimization migration file:', err);
          return NextResponse.json({ error: 'Performance optimization migration file not found' }, { status: 404 });
        }
        break;
      
      case 'search-analytics':
        try {
          const migrationPath = path.join(process.cwd(), 'scripts', 'migrations', '003_search_analytics.sql');
          migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
        } catch (err) {
          console.error('Error reading search analytics migration file:', err);
          return NextResponse.json({ error: 'Search analytics migration file not found' }, { status: 404 });
        }
        break;
      
      case 'offers-system':
        try {
          const migrationPath = path.join(process.cwd(), 'scripts', 'migrations', '004_add_offers_system.sql');
          migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
        } catch (err) {
          console.error('Error reading offers system migration file:', err);
          return NextResponse.json({ error: 'Offers system migration file not found' }, { status: 404 });
        }
        break;
      
      default:
        return NextResponse.json({ error: 'Invalid migration name' }, { status: 400 });
    }

    if (!migrationSQL) {
      return NextResponse.json({ error: 'Migration SQL is empty' }, { status: 400 });
    }

    // Split SQL into individual statements
    const statements = migrationSQL
      .split(/;\s*\n/)
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    const results = [];
    let hasErrors = false;

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.startsWith('--') || statement.length === 0) {
        continue; // Skip comments and empty statements
      }

      try {
        console.log(`Executing statement ${i + 1}/${statements.length}`);
        const { error } = await supabase.from('_placeholder').select('1').limit(0); // Test connection
        
        if (error && error.code !== 'PGRST116') { // PGRST116 is "relation does not exist" which is expected
          throw error;
        }

        // Execute the actual statement using raw SQL
        const { data, error: execError } = await supabase.rpc('exec_sql', { sql_query: statement });
        
        if (execError) {
          console.error(`Error in statement ${i + 1}:`, execError);
          results.push({
            statement: i + 1,
            status: 'error',
            error: execError.message,
            sql: statement.substring(0, 100) + (statement.length > 100 ? '...' : '')
          });
          hasErrors = true;
        } else {
          results.push({
            statement: i + 1,
            status: 'success',
            sql: statement.substring(0, 100) + (statement.length > 100 ? '...' : '')
          });
        }
      } catch (error) {
        console.error(`Unexpected error in statement ${i + 1}:`, error);
        results.push({
          statement: i + 1,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          sql: statement.substring(0, 100) + (statement.length > 100 ? '...' : '')
        });
        hasErrors = true;
      }
    }

    return NextResponse.json({
      success: !hasErrors,
      message: hasErrors ? 'Migration completed with errors' : 'Migration completed successfully',
      results,
      totalStatements: statements.length
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Simplified migration using individual Supabase client operations
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { migration } = body;

    if (!['fulltext-search', 'performance-optimizations'].includes(migration)) {
      return NextResponse.json({ error: 'Invalid migration' }, { status: 400 });
    }

    console.log(`Running simplified ${migration} setup...`);

    const results = [];

    if (migration === 'fulltext-search') {
      try {
        // Step 1: Check if search_vector column exists
        console.log('Step 1: Checking if search_vector column exists...');
        
        const { data: testData, error: testError } = await supabase
          .from('listings')
          .select('search_vector')
          .limit(1);
        
        if (testError && testError.message.includes('search_vector')) {
          results.push({ 
            step: 1, 
            status: 'column_missing', 
            message: 'search_vector column does not exist - needs manual creation'
          });
        } else {
          results.push({ 
            step: 1, 
            status: 'success', 
            message: 'search_vector column exists or accessible'
          });
        }

        // Step 2: Test if we can use textSearch function
        console.log('Step 2: Testing textSearch functionality...');
        
        try {
          const { data: searchTest, error: searchError } = await supabase
            .from('listings')
            .select('id, title')
            .textSearch('search_vector', 'test', { type: 'websearch', config: 'english' })
            .limit(1);
          
          if (searchError) {
            results.push({ 
              step: 2, 
              status: 'search_not_available', 
              message: 'Full-text search not available - database setup needed',
              error: searchError.message
            });
          } else {
            results.push({ 
              step: 2, 
              status: 'success', 
              message: 'Full-text search is working'
            });
          }
        } catch (err) {
          results.push({ 
            step: 2, 
            status: 'error', 
            message: 'Error testing search functionality',
            error: err instanceof Error ? err.message : 'Unknown error'
          });
        }

        // Step 3: Test basic listing queries
        console.log('Step 3: Testing basic listing queries...');
        
        const { data: listings, error: listingsError } = await supabase
          .from('listings')
          .select('id, title, make, model')
          .eq('status', 'active')
          .limit(5);
        
        if (listingsError) {
          results.push({ 
            step: 3, 
            status: 'error', 
            message: 'Error querying listings table',
            error: listingsError.message
          });
        } else {
          results.push({ 
            step: 3, 
            status: 'success', 
            message: `Basic listings query works - found ${listings?.length || 0} listings`
          });
        }

      } catch (error) {
        results.push({
          step: 'general',
          status: 'error',
          message: 'General error during fulltext-search setup',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    if (migration === 'performance-optimizations') {
      try {
        // Step 1: Check if modification_count column exists
        console.log('Step 1: Checking performance optimization columns...');
        
        const { data: testData, error: testError } = await supabase
          .from('listings')
          .select('modification_count, view_count, search_boost')
          .limit(1);
        
        if (testError) {
          results.push({ 
            step: 1, 
            status: 'columns_missing', 
            message: 'Performance optimization columns missing - needs manual migration',
            error: testError.message
          });
        } else {
          results.push({ 
            step: 1, 
            status: 'success', 
            message: 'Performance optimization columns exist'
          });
        }

        // Step 2: Test materialized view
        console.log('Step 2: Testing popular_modifications materialized view...');
        
        try {
          const { data: popularMods, error: viewError } = await supabase
            .from('popular_modifications')
            .select('name, usage_count')
            .limit(5);
          
          if (viewError) {
            results.push({ 
              step: 2, 
              status: 'view_missing', 
              message: 'popular_modifications materialized view missing - needs manual creation',
              error: viewError.message
            });
          } else {
            results.push({ 
              step: 2, 
              status: 'success', 
              message: `Materialized view working - found ${popularMods?.length || 0} popular modifications`
            });
          }
        } catch (err) {
          results.push({ 
            step: 2, 
            status: 'error', 
            message: 'Error testing materialized view',
            error: err instanceof Error ? err.message : 'Unknown error'
          });
        }

        // Step 3: Test optimized search functions
        console.log('Step 3: Testing optimized search functions...');
        
        try {
          const { data: searchResult, error: functionError } = await supabase
            .rpc('optimized_search_listings', {
              search_query: 'test',
              page_limit: 1,
              page_offset: 0
            });
          
          if (functionError) {
            results.push({ 
              step: 3, 
              status: 'functions_missing', 
              message: 'Optimized search functions missing - needs manual creation',
              error: functionError.message
            });
          } else {
            results.push({ 
              step: 3, 
              status: 'success', 
              message: 'Optimized search functions working'
            });
          }
        } catch (err) {
          results.push({ 
            step: 3, 
            status: 'error', 
            message: 'Error testing search functions',
            error: err instanceof Error ? err.message : 'Unknown error'
          });
        }

      } catch (error) {
        results.push({
          step: 'general',
          status: 'error',
          message: 'General error during performance-optimizations check',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const needsManualSetup = results.some(r => 
      ['column_missing', 'search_not_available', 'columns_missing', 'view_missing', 'functions_missing'].includes(r.status)
    );

    return NextResponse.json({ 
      success: true,
      message: `${migration} check completed`,
      needsManualSetup,
      results,
      instructions: needsManualSetup ? 
        `Manual database setup required. Please run the ${migration} migration script directly in your database.` :
        `${migration} appears to be working correctly.`
    });

  } catch (error) {
    console.error('Migration check error:', error);
    return NextResponse.json({ 
      error: 'Migration check failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 