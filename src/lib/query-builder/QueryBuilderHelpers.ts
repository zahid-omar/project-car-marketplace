import { 
  SearchCondition, 
  ComplexQuery, 
  TextSearchCondition, 
  QueryGroup,
  SortCondition,
  JoinCondition
} from './SearchQueryBuilder';

// Helper class for building complex queries with fluent API
export class QueryBuilderHelpers {
  private query: ComplexQuery = {};

  /**
   * Start building a new query
   */
  static create(): QueryBuilderHelpers {
    return new QueryBuilderHelpers();
  }

  /**
   * Add text search with advanced options
   */
  textSearch(searchTerm: string, options?: {
    fields?: string[];
    type?: 'websearch' | 'plainto' | 'phraseto' | 'phrase';
    config?: 'english' | 'simple';
  }): QueryBuilderHelpers {
    this.query.textSearch = {
      query: searchTerm,
      ...options
    };
    return this;
  }

  /**
   * Add a simple condition
   */
  where(field: string, operator: SearchCondition['operator'], value: any, logic: 'AND' | 'OR' = 'AND'): QueryBuilderHelpers {
    if (!this.query.conditions) {
      this.query.conditions = [];
    }
    
    this.query.conditions.push({
      field,
      operator,
      value,
      logic
    });
    return this;
  }

  /**
   * Add multiple OR conditions for the same field
   */
  whereIn(field: string, values: any[]): QueryBuilderHelpers {
    return this.where(field, 'in', values);
  }

  /**
   * Add range condition (between two values)
   */
  whereBetween(field: string, min: any, max: any): QueryBuilderHelpers {
    if (min !== undefined && min !== null) {
      this.where(field, 'gte', min);
    }
    if (max !== undefined && max !== null) {
      this.where(field, 'lte', max);
    }
    return this;
  }

  /**
   * Add LIKE condition for partial text matching
   */
  whereLike(field: string, pattern: string, caseSensitive: boolean = false): QueryBuilderHelpers {
    return this.where(field, caseSensitive ? 'like' : 'ilike', `%${pattern}%`);
  }

  /**
   * Add null check condition
   */
  whereNull(field: string): QueryBuilderHelpers {
    return this.where(field, 'is_null', null);
  }

  /**
   * Add not null check condition
   */
  whereNotNull(field: string): QueryBuilderHelpers {
    return this.where(field, 'not_null', null);
  }

  /**
   * Start a complex grouped condition
   */
  whereGroup(logic: 'AND' | 'OR', builderFn: (group: GroupBuilder) => void): QueryBuilderHelpers {
    const groupBuilder = new GroupBuilder(logic);
    builderFn(groupBuilder);
    
    if (!this.query.groups) {
      this.query.groups = [];
    }
    
    this.query.groups.push(groupBuilder.build());
    return this;
  }

  /**
   * Add sorting
   */
  orderBy(field: string, order: 'asc' | 'desc' = 'desc'): QueryBuilderHelpers {
    if (!this.query.sorting) {
      this.query.sorting = [];
    }
    
    this.query.sorting.push({ field, order });
    return this;
  }

  /**
   * Add pagination
   */
  paginate(page: number, limit: number = 12): QueryBuilderHelpers {
    this.query.pagination = { page, limit };
    return this;
  }

  /**
   * Add join
   */
  join(table: string, select: string, options?: {
    type?: 'inner' | 'left' | 'right' | 'full';
    alias?: string;
    on?: string;
  }): QueryBuilderHelpers {
    if (!this.query.joins) {
      this.query.joins = [];
    }

    this.query.joins.push({
      table,
      select,
      type: options?.type || 'left',
      alias: options?.alias,
      on: options?.on || ''
    });
    return this;
  }

  /**
   * Build and return the final query
   */
  build(): ComplexQuery {
    return this.query;
  }
}

// Helper class for building grouped conditions
export class GroupBuilder {
  private conditions: (SearchCondition | QueryGroup)[] = [];
  private logic: 'AND' | 'OR';

  constructor(logic: 'AND' | 'OR') {
    this.logic = logic;
  }

  /**
   * Add a condition to the group
   */
  where(field: string, operator: SearchCondition['operator'], value: any): GroupBuilder {
    this.conditions.push({
      field,
      operator,
      value
    });
    return this;
  }

  /**
   * Add a nested group
   */
  group(logic: 'AND' | 'OR', builderFn: (group: GroupBuilder) => void): GroupBuilder {
    const nestedGroup = new GroupBuilder(logic);
    builderFn(nestedGroup);
    this.conditions.push(nestedGroup.build());
    return this;
  }

  /**
   * Build the query group
   */
  build(): QueryGroup {
    return {
      conditions: this.conditions,
      logic: this.logic
    };
  }
}

// Predefined query patterns for common use cases
export class CommonQueryPatterns {
  
  /**
   * Build a standard car search query
   */
  static carSearch(params: {
    searchTerm?: string;
    make?: string | string[];
    model?: string | string[];
    yearRange?: { min?: number; max?: number };
    priceRange?: { min?: number; max?: number };
    mileageRange?: { min?: number; max?: number };
    condition?: string | string[];
    transmission?: string | string[];
    location?: string;
    hasModifications?: boolean;
    modificationCategories?: string[];
    specificModifications?: string[];
    sortBy?: 'relevance' | 'price_low' | 'price_high' | 'year_new' | 'year_old' | 'newest';
    page?: number;
    limit?: number;
  }): ComplexQuery {
    const builder = QueryBuilderHelpers.create();

    // Add text search if provided
    if (params.searchTerm?.trim()) {
      builder.textSearch(params.searchTerm, { type: 'websearch' });
    }

    // Add make filter
    if (params.make) {
      const makes = Array.isArray(params.make) ? params.make : [params.make];
      builder.whereIn('make', makes);
    }

    // Add model filter
    if (params.model) {
      const models = Array.isArray(params.model) ? params.model : [params.model];
      builder.whereIn('model', models);
    }

    // Add year range
    if (params.yearRange) {
      builder.whereBetween('year', params.yearRange.min, params.yearRange.max);
    }

    // Add price range
    if (params.priceRange) {
      builder.whereBetween('price', params.priceRange.min, params.priceRange.max);
    }

    // Add mileage range
    if (params.mileageRange) {
      builder.whereBetween('mileage', params.mileageRange.min, params.mileageRange.max);
    }

    // Add condition filter
    if (params.condition) {
      const conditions = Array.isArray(params.condition) ? params.condition : [params.condition];
      builder.whereIn('condition', conditions);
    }

    // Add transmission filter
    if (params.transmission) {
      const transmissions = Array.isArray(params.transmission) ? params.transmission : [params.transmission];
      builder.whereIn('transmission', transmissions);
    }

    // Add location filter
    if (params.location) {
      builder.whereLike('location', params.location);
    }

    // Add sorting
    switch (params.sortBy) {
      case 'price_low':
        builder.orderBy('price', 'asc');
        break;
      case 'price_high':
        builder.orderBy('price', 'desc');
        break;
      case 'year_new':
        builder.orderBy('year', 'desc');
        break;
      case 'year_old':
        builder.orderBy('year', 'asc');
        break;
      case 'newest':
        builder.orderBy('created_at', 'desc');
        break;
      case 'relevance':
      default:
        if (params.searchTerm?.trim()) {
          // For text search, use relevance (default handled by query builder)
        } else {
          builder.orderBy('created_at', 'desc');
        }
        break;
    }

    // Add pagination
    if (params.page || params.limit) {
      builder.paginate(params.page || 1, params.limit || 12);
    }

    return builder.build();
  }

  /**
   * Build a advanced filter query with complex boolean logic
   */
  static advancedSearch(params: {
    textSearch?: string;
    mustHave?: { [field: string]: any };
    shouldHave?: { [field: string]: any }[];
    mustNot?: { [field: string]: any };
    ranges?: { [field: string]: { min?: any; max?: any } };
    sorting?: { field: string; order: 'asc' | 'desc' }[];
    page?: number;
    limit?: number;
  }): ComplexQuery {
    const builder = QueryBuilderHelpers.create();

    // Add text search
    if (params.textSearch?.trim()) {
      builder.textSearch(params.textSearch);
    }

    // Add must-have conditions (AND logic)
    if (params.mustHave) {
      Object.entries(params.mustHave).forEach(([field, value]) => {
        if (Array.isArray(value)) {
          builder.whereIn(field, value);
        } else {
          builder.where(field, 'eq', value);
        }
      });
    }

    // Add should-have conditions (OR logic within a group)
    if (params.shouldHave && params.shouldHave.length > 0) {
      builder.whereGroup('OR', (group) => {
        params.shouldHave!.forEach(conditions => {
          Object.entries(conditions).forEach(([field, value]) => {
            if (Array.isArray(value)) {
              value.forEach(v => group.where(field, 'eq', v));
            } else {
              group.where(field, 'eq', value);
            }
          });
        });
      });
    }

    // Add must-not conditions (exclusions)
    if (params.mustNot) {
      Object.entries(params.mustNot).forEach(([field, value]) => {
        if (Array.isArray(value)) {
          builder.where(field, 'not_in', value);
        } else {
          builder.where(field, 'neq', value);
        }
      });
    }

    // Add range conditions
    if (params.ranges) {
      Object.entries(params.ranges).forEach(([field, range]) => {
        builder.whereBetween(field, range.min, range.max);
      });
    }

    // Add sorting
    if (params.sorting) {
      params.sorting.forEach(sort => {
        builder.orderBy(sort.field, sort.order);
      });
    }

    // Add pagination
    if (params.page || params.limit) {
      builder.paginate(params.page || 1, params.limit || 12);
    }

    return builder.build();
  }

  /**
   * Build a modification-focused search query
   */
  static modificationSearch(params: {
    searchTerm?: string;
    categories?: string[];
    specificMods?: string[];
    dateRange?: { from?: string; to?: string };
    hasModifications?: boolean;
    minModificationCount?: number;
    page?: number;
    limit?: number;
  }): ComplexQuery {
    const builder = QueryBuilderHelpers.create();

    // Add text search
    if (params.searchTerm?.trim()) {
      builder.textSearch(params.searchTerm);
    }

    // Add modification requirements
    if (params.hasModifications) {
      builder.where('modification_count', 'gt', 0);
    }

    if (params.minModificationCount !== undefined) {
      builder.where('modification_count', 'gte', params.minModificationCount);
    }

    // Add joins for modification data
    if (params.categories || params.specificMods || params.dateRange) {
      builder.join('modifications', 'name, description, category, created_at');
    }

    // Add pagination
    if (params.page || params.limit) {
      builder.paginate(params.page || 1, params.limit || 12);
    }

    return builder.build();
  }

  /**
   * Build a price analysis query
   */
  static priceAnalysis(params: {
    make?: string;
    model?: string;
    yearRange?: { min?: number; max?: number };
    groupBy?: 'make' | 'model' | 'year' | 'condition';
    sortBy?: 'avg_price' | 'count' | 'min_price' | 'max_price';
  }): ComplexQuery {
    const builder = QueryBuilderHelpers.create();

    // Add filters
    if (params.make) {
      builder.where('make', 'eq', params.make);
    }

    if (params.model) {
      builder.where('model', 'eq', params.model);
    }

    if (params.yearRange) {
      builder.whereBetween('year', params.yearRange.min, params.yearRange.max);
    }

    // Default sorting by price
    builder.orderBy('price', 'desc');

    return builder.build();
  }

  /**
   * Build a location-based search query
   */
  static locationSearch(params: {
    searchTerm?: string;
    location?: string;
    radius?: number; // For future implementation with GPS coordinates
    state?: string;
    city?: string;
    sortByDistance?: boolean;
    page?: number;
    limit?: number;
  }): ComplexQuery {
    const builder = QueryBuilderHelpers.create();

    // Add text search
    if (params.searchTerm?.trim()) {
      builder.textSearch(params.searchTerm);
    }

    // Add location filters
    if (params.location) {
      builder.whereLike('location', params.location);
    }

    if (params.state) {
      builder.whereLike('location', params.state);
    }

    if (params.city) {
      builder.whereLike('location', params.city);
    }

    // Default sorting
    if (params.sortByDistance) {
      // Future implementation: sort by distance from user location
      builder.orderBy('created_at', 'desc');
    } else {
      builder.orderBy('created_at', 'desc');
    }

    // Add pagination
    if (params.page || params.limit) {
      builder.paginate(params.page || 1, params.limit || 12);
    }

    return builder.build();
  }
}

// Query validation and optimization utilities
export class QueryOptimizer {
  
  /**
   * Analyze query complexity and suggest optimizations
   */
  static analyzeComplexity(query: ComplexQuery): {
    score: number;
    recommendations: string[];
    warnings: string[];
  } {
    let complexity = 0;
    const recommendations: string[] = [];
    const warnings: string[] = [];

    // Analyze text search complexity
    if (query.textSearch) {
      complexity += 2;
      if (query.textSearch.fields && query.textSearch.fields.length > 5) {
        complexity += 2;
        warnings.push('Searching too many fields may impact performance');
        recommendations.push('Consider limiting search fields to most relevant ones');
      }
    }

    // Analyze condition complexity
    if (query.conditions) {
      complexity += query.conditions.length * 0.5;
      
      if (query.conditions.length > 10) {
        complexity += 3;
        warnings.push('Large number of conditions may slow down query');
        recommendations.push('Consider grouping related conditions or using different approach');
      }

      // Check for potentially expensive operations
      query.conditions.forEach(condition => {
        if (['like', 'ilike'].includes(condition.operator) && 
            typeof condition.value === 'string' && 
            condition.value.startsWith('%')) {
          complexity += 1;
          warnings.push(`Leading wildcard in LIKE operation for field '${condition.field}' is expensive`);
          recommendations.push(`Consider full-text search instead of LIKE for field '${condition.field}'`);
        }
      });
    }

    // Analyze group complexity
    if (query.groups) {
      complexity += query.groups.length * 1.5;
      
      const analyzeGroupComplexity = (group: QueryGroup, depth: number = 0): void => {
        if (depth > 3) {
          complexity += 5;
          warnings.push('Deep nesting in query groups can impact performance');
          recommendations.push('Consider flattening nested groups or simplifying logic');
        }
        
        group.conditions.forEach(condition => {
          if ('conditions' in condition) {
            analyzeGroupComplexity(condition as QueryGroup, depth + 1);
          }
        });
      };

      query.groups.forEach(group => analyzeGroupComplexity(group));
    }

    // Analyze pagination efficiency
    if (query.pagination && query.pagination.page > 100) {
      complexity += 2;
      warnings.push('Deep pagination is inefficient');
      recommendations.push('Consider cursor-based pagination for better performance');
    }

    // Analyze sorting efficiency
    if (query.sorting && query.sorting.length > 3) {
      complexity += 1;
      warnings.push('Multiple sort conditions may impact performance');
      recommendations.push('Consider reducing number of sort fields');
    }

    return {
      score: Math.min(complexity, 10), // Cap at 10
      recommendations,
      warnings
    };
  }

  /**
   * Suggest indexes for a query
   */
  static suggestIndexes(query: ComplexQuery): string[] {
    const suggestions: string[] = [];

    // Suggest indexes for conditions
    if (query.conditions) {
      const fields = query.conditions.map(c => c.field);
      const uniqueFields = [...new Set(fields)];
      
      if (uniqueFields.length > 1) {
        suggestions.push(`Composite index on (${uniqueFields.join(', ')}) for filter combinations`);
      }

      uniqueFields.forEach(field => {
        suggestions.push(`Index on '${field}' for filtering`);
      });
    }

    // Suggest indexes for sorting
    if (query.sorting) {
      query.sorting.forEach(sort => {
        suggestions.push(`Index on '${sort.field}' for sorting`);
      });
    }

    // Suggest text search indexes
    if (query.textSearch) {
      suggestions.push('GIN index on search_vector for full-text search');
      if (query.textSearch.fields) {
        query.textSearch.fields.forEach(field => {
          suggestions.push(`GIN index on '${field}' for field-specific text search`);
        });
      }
    }

    return [...new Set(suggestions)]; // Remove duplicates
  }

  /**
   * Optimize a query for better performance
   */
  static optimizeQuery(query: ComplexQuery): ComplexQuery {
    const optimized: ComplexQuery = JSON.parse(JSON.stringify(query)); // Deep clone

    // Optimize conditions by grouping similar operations
    if (optimized.conditions && optimized.conditions.length > 5) {
      const fieldGroups: { [field: string]: SearchCondition[] } = {};
      
      optimized.conditions.forEach(condition => {
        if (!fieldGroups[condition.field]) {
          fieldGroups[condition.field] = [];
        }
        fieldGroups[condition.field].push(condition);
      });

      // Convert multiple conditions on same field to IN operations where possible
      Object.entries(fieldGroups).forEach(([field, conditions]) => {
        if (conditions.length > 2 && conditions.every(c => c.operator === 'eq')) {
          const values = conditions.map(c => c.value);
          // Replace multiple EQ conditions with single IN condition
          optimized.conditions = optimized.conditions!.filter(c => 
            !(c.field === field && c.operator === 'eq')
          );
          optimized.conditions!.push({
            field,
            operator: 'in',
            value: values
          });
        }
      });
    }

    // Optimize pagination for deep pages
    if (optimized.pagination && optimized.pagination.page > 100) {
      // Suggest limiting deep pagination
      optimized.pagination.limit = Math.min(optimized.pagination.limit, 10);
    }

    return optimized;
  }
}

// Export all utilities
export default {
  QueryBuilderHelpers,
  GroupBuilder,
  CommonQueryPatterns,
  QueryOptimizer
};