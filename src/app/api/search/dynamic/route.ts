import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { SearchQueryBuilder, ComplexQuery } from '@/lib/query-builder/SearchQueryBuilder';
import { CommonQueryPatterns, QueryOptimizer } from '@/lib/query-builder/QueryBuilderHelpers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();
    
    const {
      type = 'carSearch', // Type of search pattern to use
      params = {},        // Parameters for the search pattern
      customQuery = null, // Custom ComplexQuery object
      includeAnalytics = false, // Whether to include performance analytics
      optimize = true     // Whether to optimize the query
    } = body;

    console.log('Dynamic search request:', { type, params, includeAnalytics, optimize });

    let complexQuery: ComplexQuery;

    // Build query based on type
    if (customQuery) {
      // Use custom query directly
      complexQuery = customQuery;
    } else {
      // Use predefined patterns
      switch (type) {
        case 'carSearch':
          complexQuery = CommonQueryPatterns.carSearch(params);
          break;
        case 'advancedSearch':
          complexQuery = CommonQueryPatterns.advancedSearch(params);
          break;
        case 'modificationSearch':
          complexQuery = CommonQueryPatterns.modificationSearch(params);
          break;
        case 'priceAnalysis':
          complexQuery = CommonQueryPatterns.priceAnalysis(params);
          break;
        case 'locationSearch':
          complexQuery = CommonQueryPatterns.locationSearch(params);
          break;
        default:
          // Default to basic car search
          complexQuery = CommonQueryPatterns.carSearch(params);
          break;
      }
    }

    // Optimize query if requested
    if (optimize) {
      complexQuery = QueryOptimizer.optimizeQuery(complexQuery);
    }

    // Create query builder instance
    const queryBuilder = new SearchQueryBuilder(supabase, 'listings', `
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
      created_at,
      listing_images!inner(
        image_url,
        is_primary
      ),
      modifications(
        name,
        description,
        category,
        created_at
      )
    `);

    // Execute query with validation and analytics
    const startTime = Date.now();
    const result = await queryBuilder.executeQuery(complexQuery);
    const totalExecutionTime = Date.now() - startTime;

    // Prepare response
    const response: any = {
      listings: result.data,
      pagination: complexQuery.pagination ? {
        page: complexQuery.pagination.page,
        limit: complexQuery.pagination.limit,
        totalItems: result.count || 0,
        totalPages: result.count ? Math.ceil(result.count / complexQuery.pagination.limit) : 0,
        hasNextPage: complexQuery.pagination && result.count ? 
          complexQuery.pagination.page < Math.ceil(result.count / complexQuery.pagination.limit) : false,
        hasPrevPage: complexQuery.pagination ? complexQuery.pagination.page > 1 : false
      } : null,
      query: {
        type,
        params,
        optimized: optimize
      }
    };

    // Add analytics if requested
    if (includeAnalytics) {
      const complexity = QueryOptimizer.analyzeComplexity(complexQuery);
      const indexSuggestions = QueryOptimizer.suggestIndexes(complexQuery);

      response.analytics = {
        executionTime: totalExecutionTime,
        queryExecutionTime: result.executionTime,
        validation: result.validation,
        complexity: complexity,
        indexSuggestions: indexSuggestions,
        resultCount: result.data.length,
        totalCount: result.count
      };
    }

    // Add validation warnings to response if any
    if (result.validation.warnings.length > 0) {
      response.warnings = result.validation.warnings;
    }

    if (result.validation.optimizations && result.validation.optimizations.length > 0) {
      response.optimizations = result.validation.optimizations;
    }

    console.log(`Dynamic search completed - found ${result.data.length} results in ${totalExecutionTime}ms`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Dynamic search API error:', error);
    
    // Provide detailed error information for debugging
    const errorResponse = {
      error: 'Dynamic search failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };

    // Include stack trace in development
    if (process.env.NODE_ENV === 'development' && error instanceof Error) {
      errorResponse.details = error.stack || error.message;
    }

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// GET endpoint for simpler queries using URL parameters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract parameters from URL
    const queryParams = {
      searchTerm: searchParams.get('q') || undefined,
      make: searchParams.get('make') || undefined,
      model: searchParams.get('model') || undefined,
      yearRange: {
        min: searchParams.get('yearFrom') ? parseInt(searchParams.get('yearFrom')!) : undefined,
        max: searchParams.get('yearTo') ? parseInt(searchParams.get('yearTo')!) : undefined
      },
      priceRange: {
        min: searchParams.get('priceFrom') ? parseInt(searchParams.get('priceFrom')!) : undefined,
        max: searchParams.get('priceTo') ? parseInt(searchParams.get('priceTo')!) : undefined
      },
      mileageRange: {
        min: searchParams.get('mileageFrom') ? parseInt(searchParams.get('mileageFrom')!) : undefined,
        max: searchParams.get('mileageTo') ? parseInt(searchParams.get('mileageTo')!) : undefined
      },
      condition: searchParams.get('condition')?.split(',') || undefined,
      transmission: searchParams.get('transmission')?.split(',') || undefined,
      location: searchParams.get('location') || undefined,
      hasModifications: searchParams.get('hasModifications') === 'true' || undefined,
      modificationCategories: searchParams.get('modCategories')?.split(',') || undefined,
      specificModifications: searchParams.get('specificMods')?.split(',') || undefined,
      sortBy: (searchParams.get('sortBy') as any) || 'relevance',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '12')
    };

        // Remove undefined values
    Object.keys(queryParams).forEach(key => {
      const value = (queryParams as any)[key];
      if (value === undefined ||
          (typeof value === 'object' &&
           Object.values(value).every(v => v === undefined))) {
        delete (queryParams as any)[key];
      }
    });

    // Use POST logic with carSearch pattern
    const body = {
      type: 'carSearch',
      params: queryParams,
      includeAnalytics: searchParams.get('analytics') === 'true',
      optimize: searchParams.get('optimize') !== 'false' // Default to true
    };

    // Create a mock request for the POST handler
    const mockRequest = {
      json: async () => body
    } as any;

    // Call the POST handler
    return await POST(mockRequest as NextRequest);

  } catch (error) {
    console.error('Dynamic search GET error:', error);
    return NextResponse.json({ 
      error: 'Dynamic search failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// OPTIONS endpoint for CORS support
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// Endpoint for query analysis without execution
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, analyzeOnly = true } = body;

    if (!query) {
      return NextResponse.json({ 
        error: 'Query is required for analysis' 
      }, { status: 400 });
    }

    // Validate query
    const supabase = createRouteHandlerClient({ cookies });
    const queryBuilder = new SearchQueryBuilder(supabase);
    const validation = queryBuilder.validateQuery(query);

    // Analyze complexity
    const complexity = QueryOptimizer.analyzeComplexity(query);
    const indexSuggestions = QueryOptimizer.suggestIndexes(query);
    const optimizedQuery = QueryOptimizer.optimizeQuery(query);

    const analysis = {
      validation,
      complexity,
      indexSuggestions,
      optimizedQuery,
      analysis: {
        isValid: validation.isValid,
        complexityScore: complexity.score,
        hasOptimizations: JSON.stringify(query) !== JSON.stringify(optimizedQuery),
        recommendationCount: complexity.recommendations.length,
        warningCount: validation.warnings.length + complexity.warnings.length
      }
    };

    console.log('Query analysis completed:', {
      isValid: validation.isValid,
      complexityScore: complexity.score,
      hasOptimizations: analysis.analysis.hasOptimizations
    });

    return NextResponse.json(analysis);

  } catch (error) {
    console.error('Query analysis error:', error);
    return NextResponse.json({ 
      error: 'Query analysis failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 