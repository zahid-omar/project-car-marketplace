 // Main query builder exports
export {
  SearchQueryBuilder,
  type ComplexQuery,
  type SearchCondition,
  type TextSearchCondition,
  type SortCondition,
  type QueryGroup,
  type JoinCondition,
  type QueryValidationResult
} from './SearchQueryBuilder';

// Helper classes and utilities
export {
  QueryBuilderHelpers,
  GroupBuilder,
  CommonQueryPatterns,
  QueryOptimizer
} from './QueryBuilderHelpers';

// Test utilities (for development/testing)
export {
  QueryBuilderTests,
  runQueryBuilderTests,
  exampleUsagePatterns,
  type TestResult,
  type TestSuite
} from './tests/QueryBuilderTests';

// Utility functions for common operations
export const createQueryBuilder = () => QueryBuilderHelpers.create();

export const createCarSearchQuery = (params: any) => CommonQueryPatterns.carSearch(params);

export const createAdvancedSearchQuery = (params: any) => CommonQueryPatterns.advancedSearch(params);

export const optimizeQuery = (query: ComplexQuery) => QueryOptimizer.optimizeQuery(query);

export const analyzeQueryComplexity = (query: ComplexQuery) => QueryOptimizer.analyzeComplexity(query);

export const validateQuerySyntax = (query: ComplexQuery, supabaseClient: any) => {
  const builder = new SearchQueryBuilder(supabaseClient);
  return builder.validateQuery(query);
};

// Constants for validation and limits
export const QUERY_LIMITS = {
  MAX_CONDITIONS: 50,
  MAX_GROUPS: 20,
  MAX_NESTING_DEPTH: 5,
  MAX_TEXT_SEARCH_LENGTH: 1000,
  MAX_PAGINATION_PAGE: 1000,
  MAX_PAGINATION_LIMIT: 100,
  DEFAULT_LIMIT: 12
} as const;

export const SUPPORTED_OPERATORS = [
  'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 
  'like', 'ilike', 'in', 'not_in', 
  'is_null', 'not_null', 'contains', 
  'contained_by', 'overlaps'
] as const;

export const TEXT_SEARCH_TYPES = [
  'websearch', 'plainto', 'phraseto', 'phrase'
] as const;

export const TEXT_SEARCH_CONFIGS = [
  'english', 'simple'
] as const;

// Quick start documentation
export const QUICK_START_GUIDE = {
  basicUsage: `
    // Basic car search with fluent API
    import { createQueryBuilder } from '@/lib/query-builder';
    
    const query = createQueryBuilder()
      .textSearch('BMW 3 Series')
      .where('make', 'eq', 'BMW')
      .whereBetween('year', 2018, 2023)
      .whereBetween('price', 25000, 45000)
      .orderBy('year', 'desc')
      .paginate(1, 12)
      .build();
  `,
  
  advancedFiltering: `
    // Advanced filtering with boolean logic
    import { createQueryBuilder } from '@/lib/query-builder';
    
    const query = createQueryBuilder()
      .textSearch('performance car')
      .whereGroup('OR', (group) => {
        group.where('engine', 'ilike', '%V8%')
             .where('engine', 'ilike', '%Turbo%')
             .where('transmission', 'eq', 'manual');
      })
      .whereIn('make', ['BMW', 'Mercedes-Benz', 'Audi'])
      .orderBy('price', 'asc')
      .build();
  `,
  
  predefinedPatterns: `
    // Using predefined query patterns
    import { createCarSearchQuery } from '@/lib/query-builder';
    
    const query = createCarSearchQuery({
      searchTerm: 'sports car',
      make: ['BMW', 'Mercedes-Benz'],
      yearRange: { min: 2018, max: 2023 },
      priceRange: { min: 30000, max: 60000 },
      sortBy: 'price_low',
      page: 1,
      limit: 12
    });
  `,
  
  reactHookUsage: `
    // Using with React hook
    import { useDynamicSearch } from '@/hooks/useDynamicSearch';
    
    const { search, listings, isLoading, error } = useDynamicSearch({
      type: 'carSearch',
      includeAnalytics: true,
      optimize: true
    });
    
    // Perform search
    await search({
      searchTerm: 'BMW 3 Series',
      make: 'BMW',
      yearRange: { min: 2018, max: 2023 }
    });
  `,
  
  customQueryExecution: `
    // Direct API usage with custom query
    const response = await fetch('/api/search/dynamic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'carSearch',
        params: {
          searchTerm: 'luxury sedan',
          make: ['BMW', 'Mercedes-Benz', 'Audi'],
          priceRange: { min: 40000, max: 80000 }
        },
        includeAnalytics: true,
        optimize: true
      })
    });
    
    const result = await response.json();
  `
};

// Performance tips and best practices
export const PERFORMANCE_TIPS = {
  indexing: [
    'Add indexes on frequently filtered fields (make, model, year, price)',
    'Use composite indexes for common filter combinations',
    'Add GIN indexes for full-text search fields',
    'Consider partial indexes for status-based filtering'
  ],
  
  queryOptimization: [
    'Use IN operators instead of multiple OR conditions',
    'Limit the number of conditions in complex queries',
    'Avoid deep nesting in query groups',
    'Use text search instead of LIKE with leading wildcards',
    'Implement cursor-based pagination for deep pages'
  ],
  
  caching: [
    'Cache query validation results',
    'Use query fingerprinting for result caching',
    'Implement search result caching with TTL',
    'Cache common query patterns and their results'
  ],
  
  monitoring: [
    'Monitor query execution times',
    'Track query complexity scores',
    'Analyze most common search patterns',
    'Monitor cache hit rates and performance'
  ]
};

// Export version for compatibility tracking
export const VERSION = '1.0.0';

// Default export for convenience
export default {
  SearchQueryBuilder,
  QueryBuilderHelpers,
  CommonQueryPatterns,
  QueryOptimizer,
  createQueryBuilder,
  createCarSearchQuery,
  createAdvancedSearchQuery,
  optimizeQuery,
  analyzeQueryComplexity,
  QUERY_LIMITS,
  SUPPORTED_OPERATORS,
  TEXT_SEARCH_TYPES,
  TEXT_SEARCH_CONFIGS,
  QUICK_START_GUIDE,
  PERFORMANCE_TIPS,
  VERSION
}; 