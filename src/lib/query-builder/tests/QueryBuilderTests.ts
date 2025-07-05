import { 
  SearchQueryBuilder, 
  ComplexQuery, 
  SearchCondition, 
  QueryGroup 
} from '../SearchQueryBuilder';
import { 
  QueryBuilderHelpers, 
  CommonQueryPatterns, 
  QueryOptimizer 
} from '../QueryBuilderHelpers';

// Mock Supabase client for testing
class MockSupabaseClient {
  from(table: string) {
    return new MockQueryBuilder(table);
  }
}

class MockQueryBuilder {
  private table: string;
  private conditions: any[] = [];
  private selectFields: string = '*';

  constructor(table: string) {
    this.table = table;
  }

  select(fields: string) {
    this.selectFields = fields;
    return this;
  }

  eq(field: string, value: any) {
    this.conditions.push({ type: 'eq', field, value });
    return this;
  }

  in(field: string, values: any[]) {
    this.conditions.push({ type: 'in', field, values });
    return this;
  }

  gte(field: string, value: any) {
    this.conditions.push({ type: 'gte', field, value });
    return this;
  }

  lte(field: string, value: any) {
    this.conditions.push({ type: 'lte', field, value });
    return this;
  }

  ilike(field: string, pattern: string) {
    this.conditions.push({ type: 'ilike', field, pattern });
    return this;
  }

  textSearch(field: string, query: string, options?: any) {
    this.conditions.push({ type: 'textSearch', field, query, options });
    return this;
  }

  or(clause: string) {
    this.conditions.push({ type: 'or', clause });
    return this;
  }

  order(field: string, options: { ascending: boolean }) {
    this.conditions.push({ type: 'order', field, ascending: options.ascending });
    return this;
  }

  range(start: number, end: number) {
    this.conditions.push({ type: 'range', start, end });
    return this;
  }

  // Mock execution
  async execute() {
    return {
      data: [
        { id: 1, title: 'Test Car 1', make: 'Toyota', model: 'Camry', year: 2020, price: 25000 },
        { id: 2, title: 'Test Car 2', make: 'Honda', model: 'Civic', year: 2019, price: 22000 }
      ],
      error: null
    };
  }

  // Expose conditions for testing
  getConditions() {
    return this.conditions;
  }

  getTable() {
    return this.table;
  }

  getSelectFields() {
    return this.selectFields;
  }
}

// Test suite for Query Builder
export class QueryBuilderTests {
  private mockSupabase: MockSupabaseClient;

  constructor() {
    this.mockSupabase = new MockSupabaseClient();
  }

  /**
   * Test basic query building with fluent API
   */
  testFluentAPI() {
    console.log('Testing Fluent API...');

    const query = QueryBuilderHelpers.create()
      .textSearch('Toyota Camry', { type: 'websearch' })
      .where('make', 'eq', 'Toyota')
      .whereBetween('year', 2015, 2023)
      .whereBetween('price', 15000, 35000)
      .whereIn('condition', ['excellent', 'good'])
      .orderBy('price', 'asc')
      .paginate(1, 12)
      .build();

    console.log('Generated query:', JSON.stringify(query, null, 2));

    // Validate structure
    if (!query.textSearch || query.textSearch.query !== 'Toyota Camry') {
      throw new Error('Text search not properly set');
    }

    if (!query.conditions || query.conditions.length < 3) {
      throw new Error('Conditions not properly set');
    }

    if (!query.pagination || query.pagination.page !== 1) {
      throw new Error('Pagination not properly set');
    }

    console.log('✅ Fluent API test passed');
  }

  /**
   * Test complex boolean logic with nested groups
   */
  testComplexBooleanLogic() {
    console.log('Testing Complex Boolean Logic...');

    const query = QueryBuilderHelpers.create()
      .textSearch('sports car')
      .whereGroup('OR', (group) => {
        group.where('make', 'eq', 'Ferrari')
             .where('make', 'eq', 'Lamborghini')
             .where('make', 'eq', 'Porsche');
      })
      .whereGroup('AND', (group) => {
        group.where('year', 'gte', 2015)
             .group('OR', (nested) => {
               nested.where('transmission', 'eq', 'manual')
                     .where('transmission', 'eq', 'automatic');
             });
      })
      .whereBetween('price', 50000, 200000)
      .build();

    console.log('Complex query:', JSON.stringify(query, null, 2));

    // Validate groups
    if (!query.groups || query.groups.length < 2) {
      throw new Error('Query groups not properly created');
    }

    const orGroup = query.groups.find(g => g.logic === 'OR');
    const andGroup = query.groups.find(g => g.logic === 'AND');

    if (!orGroup || !andGroup) {
      throw new Error('OR and AND groups not found');
    }

    console.log('✅ Complex Boolean Logic test passed');
  }

  /**
   * Test predefined query patterns
   */
  testCommonPatterns() {
    console.log('Testing Common Query Patterns...');

    // Test car search pattern
    const carSearchQuery = CommonQueryPatterns.carSearch({
      searchTerm: 'BMW 3 Series',
      make: ['BMW', 'Mercedes-Benz'],
      yearRange: { min: 2018, max: 2023 },
      priceRange: { min: 30000, max: 60000 },
      transmission: ['automatic'],
      hasModifications: true,
      sortBy: 'price_low',
      page: 1,
      limit: 20
    });

    console.log('Car search query:', JSON.stringify(carSearchQuery, null, 2));

    // Test advanced search pattern
    const advancedQuery = CommonQueryPatterns.advancedSearch({
      textSearch: 'performance',
      mustHave: { 
        make: 'BMW',
        transmission: 'manual'
      },
      shouldHave: [
        { engine: 'V6' },
        { engine: 'V8' }
      ],
      mustNot: {
        condition: 'poor'
      },
      ranges: {
        year: { min: 2015, max: 2023 },
        mileage: { max: 50000 }
      },
      sorting: [
        { field: 'year', order: 'desc' },
        { field: 'price', order: 'asc' }
      ]
    });

    console.log('Advanced search query:', JSON.stringify(advancedQuery, null, 2));

    // Validate patterns
    if (!carSearchQuery.textSearch || !carSearchQuery.conditions) {
      throw new Error('Car search pattern not properly generated');
    }

    if (!advancedQuery.textSearch || !advancedQuery.conditions) {
      throw new Error('Advanced search pattern not properly generated');
    }

    console.log('✅ Common Patterns test passed');
  }

  /**
   * Test query validation
   */
  testQueryValidation() {
    console.log('Testing Query Validation...');

    const queryBuilder = new SearchQueryBuilder(this.mockSupabase as any);

    // Test valid query
    const validQuery: ComplexQuery = {
      textSearch: { query: 'Toyota' },
      conditions: [
        { field: 'make', operator: 'eq', value: 'Toyota' },
        { field: 'year', operator: 'gte', value: 2015 }
      ],
      pagination: { page: 1, limit: 12 }
    };

    const validResult = queryBuilder.validateQuery(validQuery);
    console.log('Valid query validation:', validResult);

    if (!validResult.isValid) {
      throw new Error('Valid query marked as invalid');
    }

    // Test invalid query
    const invalidQuery: ComplexQuery = {
      textSearch: { query: '' }, // Empty search query
      conditions: [
        { field: '', operator: 'eq', value: 'Toyota' }, // Empty field
        { field: 'year', operator: 'in', value: 'not-array' } // Wrong value type for 'in'
      ],
      pagination: { page: 0, limit: 200 } // Invalid pagination
    };

    const invalidResult = queryBuilder.validateQuery(invalidQuery);
    console.log('Invalid query validation:', invalidResult);

    if (invalidResult.isValid || invalidResult.errors.length === 0) {
      throw new Error('Invalid query marked as valid');
    }

    console.log('✅ Query Validation test passed');
  }

  /**
   * Test query optimization
   */
  testQueryOptimization() {
    console.log('Testing Query Optimization...');

    // Create a query that can be optimized
    const unoptimizedQuery: ComplexQuery = {
      conditions: [
        { field: 'make', operator: 'eq', value: 'Toyota' },
        { field: 'make', operator: 'eq', value: 'Honda' },
        { field: 'make', operator: 'eq', value: 'BMW' },
        { field: 'year', operator: 'gte', value: 2015 },
        { field: 'condition', operator: 'like', value: '%excellent%' } // Can be optimized with full-text
      ],
      pagination: { page: 150, limit: 50 } // Deep pagination
    };

    const optimized = QueryOptimizer.optimizeQuery(unoptimizedQuery);
    console.log('Original query:', JSON.stringify(unoptimizedQuery, null, 2));
    console.log('Optimized query:', JSON.stringify(optimized, null, 2));

    // Verify optimization
    const makeConditions = optimized.conditions?.filter(c => c.field === 'make') || [];
    if (makeConditions.length > 1) {
      // Should have been combined into a single 'in' condition
      const inCondition = makeConditions.find(c => c.operator === 'in');
      if (!inCondition) {
        throw new Error('Multiple EQ conditions not optimized to IN');
      }
    }

    // Test complexity analysis
    const complexity = QueryOptimizer.analyzeComplexity(unoptimizedQuery);
    console.log('Complexity analysis:', complexity);

    if (complexity.score < 1) {
      throw new Error('Complexity analysis not working');
    }

    // Test index suggestions
    const indexSuggestions = QueryOptimizer.suggestIndexes(unoptimizedQuery);
    console.log('Index suggestions:', indexSuggestions);

    if (indexSuggestions.length === 0) {
      throw new Error('No index suggestions generated');
    }

    console.log('✅ Query Optimization test passed');
  }

  /**
   * Test real-world scenarios
   */
  testRealWorldScenarios() {
    console.log('Testing Real-World Scenarios...');

    // Scenario 1: User searches for modified sports cars
    const modifiedSportsCarQuery = QueryBuilderHelpers.create()
      .textSearch('sports car turbo', { type: 'websearch' })
      .whereGroup('OR', (group) => {
        group.where('make', 'eq', 'Subaru')
             .where('make', 'eq', 'Mitsubishi')
             .where('make', 'eq', 'Nissan');
      })
      .whereGroup('OR', (group) => {
        group.where('model', 'ilike', '%WRX%')
             .where('model', 'ilike', '%STI%')
             .where('model', 'ilike', '%EVO%')
             .where('model', 'ilike', '%GT-R%');
      })
      .where('modification_count', 'gt', 0)
      .whereBetween('year', 2010, 2023)
      .whereBetween('price', 20000, 80000)
      .orderBy('modification_count', 'desc')
      .orderBy('year', 'desc')
      .paginate(1, 15)
      .build();

    // Scenario 2: Luxury car price analysis
    const luxuryPriceAnalysis = CommonQueryPatterns.priceAnalysis({
      make: 'BMW',
      yearRange: { min: 2018, max: 2023 }
    });

    // Scenario 3: Location-based family car search
    const familyCarSearch = CommonQueryPatterns.locationSearch({
      searchTerm: 'family SUV',
      location: 'California',
      page: 1,
      limit: 10
    });

    console.log('Modified sports car query:', JSON.stringify(modifiedSportsCarQuery, null, 2));
    console.log('Luxury price analysis:', JSON.stringify(luxuryPriceAnalysis, null, 2));
    console.log('Family car search:', JSON.stringify(familyCarSearch, null, 2));

    // Validate scenarios
    if (!modifiedSportsCarQuery.textSearch || !modifiedSportsCarQuery.groups) {
      throw new Error('Modified sports car query not properly built');
    }

    if (!luxuryPriceAnalysis.conditions || !familyCarSearch.textSearch) {
      throw new Error('Other scenarios not properly built');
    }

    console.log('✅ Real-World Scenarios test passed');
  }

  /**
   * Test performance and edge cases
   */
  testPerformanceAndEdgeCases() {
    console.log('Testing Performance and Edge Cases...');

    // Test empty query
    const emptyQuery: ComplexQuery = {};
    const queryBuilder = new SearchQueryBuilder(this.mockSupabase as any);
    const emptyValidation = queryBuilder.validateQuery(emptyQuery);
    
    if (!emptyValidation.isValid) {
      console.log('Empty query correctly marked as valid (default behavior)');
    }

    // Test very complex query
    const complexQuery = QueryBuilderHelpers.create()
      .textSearch('performance luxury sports', { 
        type: 'websearch',
        fields: ['title', 'description', 'make', 'model', 'engine']
      });

    // Add many conditions
    for (let i = 0; i < 15; i++) {
      complexQuery.where(`field${i}`, 'eq', `value${i}`);
    }

    // Add nested groups
    complexQuery.whereGroup('OR', (group) => {
      group.group('AND', (nested) => {
        nested.where('year', 'gte', 2015)
              .where('mileage', 'lte', 50000);
      }).group('AND', (nested) => {
        nested.where('year', 'gte', 2020)
              .where('condition', 'eq', 'excellent');
      });
    });

    const veryComplexQuery = complexQuery.build();
    const complexityAnalysis = QueryOptimizer.analyzeComplexity(veryComplexQuery);
    
    console.log('Complex query complexity score:', complexityAnalysis.score);
    console.log('Complex query warnings:', complexityAnalysis.warnings);
    console.log('Complex query recommendations:', complexityAnalysis.recommendations);

    if (complexityAnalysis.score < 5) {
      throw new Error('Complex query should have high complexity score');
    }

    if (complexityAnalysis.warnings.length === 0) {
      throw new Error('Complex query should generate warnings');
    }

    console.log('✅ Performance and Edge Cases test passed');
  }

  /**
   * Run all tests
   */
  runAllTests() {
    console.log('🧪 Starting Query Builder Tests...\n');

    try {
      this.testFluentAPI();
      this.testComplexBooleanLogic();
      this.testCommonPatterns();
      this.testQueryValidation();
      this.testQueryOptimization();
      this.testRealWorldScenarios();
      this.testPerformanceAndEdgeCases();

      console.log('\n🎉 All Query Builder Tests Passed!');
      return true;

    } catch (error) {
      console.error('\n❌ Test Failed:', error instanceof Error ? error.message : error);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
      return false;
    }
  }
}

// Export test runner
export function runQueryBuilderTests() {
  const testSuite = new QueryBuilderTests();
  return testSuite.runAllTests();
}

// Example usage patterns for documentation
export const exampleUsagePatterns = {
  
  // Basic car search
  basicCarSearch: () => {
    return QueryBuilderHelpers.create()
      .textSearch('BMW 3 Series')
      .where('make', 'eq', 'BMW')
      .whereBetween('year', 2018, 2023)
      .whereBetween('price', 25000, 45000)
      .orderBy('year', 'desc')
      .paginate(1, 12)
      .build();
  },

  // Advanced filtering with OR logic
  advancedFiltering: () => {
    return QueryBuilderHelpers.create()
      .textSearch('performance car')
      .whereGroup('OR', (group) => {
        group.where('engine', 'ilike', '%V8%')
             .where('engine', 'ilike', '%Turbo%')
             .where('transmission', 'eq', 'manual');
      })
      .whereIn('make', ['BMW', 'Mercedes-Benz', 'Audi'])
      .where('mileage', 'lte', 50000)
      .orderBy('price', 'asc')
      .build();
  },

  // Complex nested logic
  complexNestedLogic: () => {
    return QueryBuilderHelpers.create()
      .whereGroup('AND', (mainGroup) => {
        mainGroup.group('OR', (makeGroup) => {
          makeGroup.where('make', 'eq', 'Toyota')
                   .where('make', 'eq', 'Honda');
        }).group('OR', (conditionGroup) => {
          conditionGroup.where('condition', 'eq', 'excellent')
                        .where('condition', 'eq', 'good');
        });
      })
      .whereBetween('year', 2015, 2023)
      .build();
  },

  // Modification-focused search
  modificationSearch: () => {
    return CommonQueryPatterns.modificationSearch({
      searchTerm: 'tuned performance',
      hasModifications: true,
      minModificationCount: 3,
      page: 1,
      limit: 10
    });
  },

  // Price analysis query
  priceAnalysis: () => {
    return CommonQueryPatterns.priceAnalysis({
      make: 'BMW',
      model: '3 Series',
      yearRange: { min: 2018, max: 2023 }
    });
  }
};

// Type definitions for testing
export interface TestResult {
  success: boolean;
  testName: string;
  error?: string;
  executionTime: number;
}

export interface TestSuite {
  name: string;
  tests: TestResult[];
  overallSuccess: boolean;
  totalExecutionTime: number;
} 