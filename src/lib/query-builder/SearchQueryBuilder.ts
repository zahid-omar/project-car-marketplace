import { SupabaseClient } from '@supabase/supabase-js';

// Types for query building
export interface SearchCondition {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'not_in' | 'is_null' | 'not_null' | 'contains' | 'contained_by' | 'overlaps';
  value: any;
  logic?: 'AND' | 'OR';
}

export interface TextSearchCondition {
  query: string;
  fields?: string[];
  type?: 'websearch' | 'plainto' | 'phraseto' | 'phrase';
  config?: 'english' | 'simple';
  weight?: 'A' | 'B' | 'C' | 'D';
}

export interface SortCondition {
  field: string;
  order: 'asc' | 'desc';
}

export interface QueryGroup {
  conditions: (SearchCondition | QueryGroup)[];
  logic: 'AND' | 'OR';
}

export interface ComplexQuery {
  textSearch?: TextSearchCondition;
  conditions?: SearchCondition[];
  groups?: QueryGroup[];
  sorting?: SortCondition[];
  pagination?: {
    page: number;
    limit: number;
  };
  joins?: JoinCondition[];
}

export interface JoinCondition {
  table: string;
  type: 'inner' | 'left' | 'right' | 'full';
  on: string;
  select?: string;
  alias?: string;
}

// Query validation result
export interface QueryValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  optimizations?: string[];
}

// Main query builder class
export class SearchQueryBuilder {
  private supabase: SupabaseClient;
  private baseTable: string;
  private selectFields: string;

  constructor(supabase: SupabaseClient, baseTable: string = 'listings', selectFields?: string) {
    this.supabase = supabase;
    this.baseTable = baseTable;
    this.selectFields = selectFields || `
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
      modification_count,
      view_count,
      search_boost
    `;
  }

  /**
   * Build a complex search query with dynamic conditions
   */
  async buildQuery(complexQuery: ComplexQuery): Promise<any> {
    let query = this.supabase.from(this.baseTable).select(this.selectFields);
    
    // Apply base filters (active status)
    query = query.eq('status', 'active');

    // Apply text search if provided
    if (complexQuery.textSearch) {
      query = this.applyTextSearch(query, complexQuery.textSearch);
    }

    // Apply simple conditions
    if (complexQuery.conditions && complexQuery.conditions.length > 0) {
      query = this.applyConditions(query, complexQuery.conditions);
    }

    // Apply complex grouped conditions
    if (complexQuery.groups && complexQuery.groups.length > 0) {
      query = this.applyGroups(query, complexQuery.groups);
    }

    // Apply joins
    if (complexQuery.joins && complexQuery.joins.length > 0) {
      query = this.applyJoins(query, complexQuery.joins);
    }

    // Apply sorting
    if (complexQuery.sorting && complexQuery.sorting.length > 0) {
      query = this.applySorting(query, complexQuery.sorting);
    } else if (complexQuery.textSearch) {
      // Default to relevance for text search
      query = this.applyTextSearchSorting(query, complexQuery.textSearch);
    } else {
      // Default sorting
      query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    if (complexQuery.pagination) {
      const { page, limit } = complexQuery.pagination;
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);
    }

    return query;
  }

  /**
   * Apply text search conditions with advanced options
   */
  private applyTextSearch(query: any, textSearch: TextSearchCondition): any {
    const { query: searchQuery, fields, type = 'websearch', config = 'english' } = textSearch;

    if (fields && fields.length > 0) {
      // Search specific fields using OR logic
      const fieldConditions = fields.map(field => {
        if (type === 'websearch') {
          return `${field}.wfts.${searchQuery}`;
        } else {
          return `${field}.fts(${config}).${searchQuery}`;
        }
      }).join(',');
      
      return query.or(fieldConditions);
    } else {
      // Use the search_vector for full-text search
      if (type === 'websearch') {
        return query.textSearch('search_vector', searchQuery, { 
          type: 'websearch',
          config 
        });
      } else {
        return query.textSearch('search_vector', searchQuery, { 
          type,
          config 
        });
      }
    }
  }

  /**
   * Apply simple conditions with proper operator handling
   */
  private applyConditions(query: any, conditions: SearchCondition[]): any {
    // Group conditions by logic operator
    const andConditions: SearchCondition[] = [];
    const orConditions: SearchCondition[] = [];

    conditions.forEach(condition => {
      if (condition.logic === 'OR') {
        orConditions.push(condition);
      } else {
        andConditions.push(condition);
      }
    });

    // Apply AND conditions
    andConditions.forEach(condition => {
      query = this.applyCondition(query, condition);
    });

    // Apply OR conditions as a group
    if (orConditions.length > 0) {
      const orClauses = orConditions.map(condition => 
        this.buildConditionClause(condition)
      ).join(',');
      query = query.or(orClauses);
    }

    return query;
  }

  /**
   * Apply a single condition to the query
   */
  private applyCondition(query: any, condition: SearchCondition): any {
    const { field, operator, value } = condition;

    switch (operator) {
      case 'eq':
        return query.eq(field, value);
      case 'neq':
        return query.neq(field, value);
      case 'gt':
        return query.gt(field, value);
      case 'gte':
        return query.gte(field, value);
      case 'lt':
        return query.lt(field, value);
      case 'lte':
        return query.lte(field, value);
      case 'like':
        return query.like(field, value);
      case 'ilike':
        return query.ilike(field, value);
      case 'in':
        return query.in(field, Array.isArray(value) ? value : [value]);
      case 'not_in':
        return query.not('in', field, Array.isArray(value) ? value : [value]);
      case 'is_null':
        return query.is(field, null);
      case 'not_null':
        return query.not('is', field, null);
      case 'contains':
        return query.contains(field, value);
      case 'contained_by':
        return query.containedBy(field, value);
      case 'overlaps':
        return query.overlaps(field, value);
      default:
        throw new Error(`Unsupported operator: ${operator}`);
    }
  }

  /**
   * Build a condition clause string for OR operations
   */
  private buildConditionClause(condition: SearchCondition): string {
    const { field, operator, value } = condition;

    switch (operator) {
      case 'eq':
        return `${field}.eq.${value}`;
      case 'neq':
        return `${field}.neq.${value}`;
      case 'gt':
        return `${field}.gt.${value}`;
      case 'gte':
        return `${field}.gte.${value}`;
      case 'lt':
        return `${field}.lt.${value}`;
      case 'lte':
        return `${field}.lte.${value}`;
      case 'like':
        return `${field}.like.${value}`;
      case 'ilike':
        return `${field}.ilike.${value}`;
      case 'in':
        const inValues = Array.isArray(value) ? value.join(',') : value;
        return `${field}.in.(${inValues})`;
      case 'is_null':
        return `${field}.is.null`;
      case 'not_null':
        return `${field}.not.is.null`;
      default:
        throw new Error(`Unsupported operator for OR clause: ${operator}`);
    }
  }

  /**
   * Apply complex grouped conditions with nested logic
   */
  private applyGroups(query: any, groups: QueryGroup[]): any {
    groups.forEach(group => {
      const groupClauses: string[] = [];

      group.conditions.forEach(condition => {
        if ('field' in condition) {
          // It's a SearchCondition
          groupClauses.push(this.buildConditionClause(condition as SearchCondition));
        } else {
          // It's a nested QueryGroup - recursively build
          const nestedClauses = this.buildNestedGroupClause(condition as QueryGroup);
          groupClauses.push(`(${nestedClauses})`);
        }
      });

      if (groupClauses.length > 0) {
        const groupClause = groupClauses.join(group.logic === 'AND' ? ',' : ',');
        if (group.logic === 'OR') {
          query = query.or(groupClause);
        } else {
          // For AND groups, we apply each condition individually
          group.conditions.forEach(condition => {
            if ('field' in condition) {
              query = this.applyCondition(query, condition as SearchCondition);
            }
          });
        }
      }
    });

    return query;
  }

  /**
   * Build nested group clauses for complex boolean logic
   */
  private buildNestedGroupClause(group: QueryGroup): string {
    const clauses: string[] = [];

    group.conditions.forEach(condition => {
      if ('field' in condition) {
        clauses.push(this.buildConditionClause(condition as SearchCondition));
      } else {
        const nestedClause = this.buildNestedGroupClause(condition as QueryGroup);
        clauses.push(`(${nestedClause})`);
      }
    });

    return clauses.join(group.logic === 'AND' ? ',' : ',');
  }

  /**
   * Apply joins to the query
   */
  private applyJoins(query: any, joins: JoinCondition[]): any {
    let selectFields = this.selectFields;

    joins.forEach(join => {
      if (join.select) {
        const joinSelect = join.alias ? 
          `${join.alias}:${join.table}(${join.select})` : 
          `${join.table}(${join.select})`;
        
        if (selectFields.includes('*')) {
          selectFields = selectFields.replace('*', `*, ${joinSelect}`);
        } else {
          selectFields += `, ${joinSelect}`;
        }
      }
    });

    // Update the query with new select fields
    return this.supabase.from(this.baseTable).select(selectFields);
  }

  /**
   * Apply sorting conditions
   */
  private applySorting(query: any, sorting: SortCondition[]): any {
    sorting.forEach(sort => {
      query = query.order(sort.field, { ascending: sort.order === 'asc' });
    });
    return query;
  }

  /**
   * Apply text search specific sorting with relevance
   */
  private applyTextSearchSorting(query: any, textSearch: TextSearchCondition): any {
    // For text search, we can add a custom relevance calculation
    // This would require a custom database function for precise control
    return query.order('search_boost', { ascending: false })
                .order('view_count', { ascending: false });
  }

  /**
   * Validate a complex query for syntax and logical errors
   */
  validateQuery(complexQuery: ComplexQuery): QueryValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const optimizations: string[] = [];

    // Validate text search
    if (complexQuery.textSearch) {
      const textErrors = this.validateTextSearch(complexQuery.textSearch);
      errors.push(...textErrors);
    }

    // Validate conditions
    if (complexQuery.conditions) {
      const conditionErrors = this.validateConditions(complexQuery.conditions);
      errors.push(...conditionErrors);
    }

    // Validate groups
    if (complexQuery.groups) {
      const groupErrors = this.validateGroups(complexQuery.groups);
      errors.push(...groupErrors);
    }

    // Validate sorting
    if (complexQuery.sorting) {
      const sortErrors = this.validateSorting(complexQuery.sorting);
      errors.push(...sortErrors);
    }

    // Validate pagination
    if (complexQuery.pagination) {
      const paginationErrors = this.validatePagination(complexQuery.pagination);
      errors.push(...paginationErrors);
    }

    // Check for optimization opportunities
    this.checkOptimizations(complexQuery, optimizations, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      optimizations
    };
  }

  /**
   * Validate text search parameters
   */
  private validateTextSearch(textSearch: TextSearchCondition): string[] {
    const errors: string[] = [];

    if (!textSearch.query || textSearch.query.trim().length === 0) {
      errors.push('Text search query cannot be empty');
    }

    if (textSearch.query && textSearch.query.length > 1000) {
      errors.push('Text search query too long (max 1000 characters)');
    }

    if (textSearch.type && !['websearch', 'plainto', 'phraseto', 'phrase'].includes(textSearch.type)) {
      errors.push(`Invalid text search type: ${textSearch.type}`);
    }

    if (textSearch.config && !['english', 'simple'].includes(textSearch.config)) {
      errors.push(`Invalid text search config: ${textSearch.config}`);
    }

    return errors;
  }

  /**
   * Validate search conditions
   */
  private validateConditions(conditions: SearchCondition[]): string[] {
    const errors: string[] = [];

    conditions.forEach((condition, index) => {
      if (!condition.field) {
        errors.push(`Condition ${index + 1}: field is required`);
      }

      if (!condition.operator) {
        errors.push(`Condition ${index + 1}: operator is required`);
      }

      if (condition.value === undefined && !['is_null', 'not_null'].includes(condition.operator)) {
        errors.push(`Condition ${index + 1}: value is required for operator ${condition.operator}`);
      }

      // Validate operator-specific requirements
      if (['in', 'not_in'].includes(condition.operator) && !Array.isArray(condition.value)) {
        errors.push(`Condition ${index + 1}: ${condition.operator} requires an array value`);
      }
    });

    return errors;
  }

  /**
   * Validate query groups
   */
  private validateGroups(groups: QueryGroup[]): string[] {
    const errors: string[] = [];

    groups.forEach((group, index) => {
      if (!group.conditions || group.conditions.length === 0) {
        errors.push(`Group ${index + 1}: must have at least one condition`);
      }

      if (!['AND', 'OR'].includes(group.logic)) {
        errors.push(`Group ${index + 1}: logic must be 'AND' or 'OR'`);
      }

      // Recursively validate nested conditions
      group.conditions.forEach((condition, condIndex) => {
        if ('field' in condition) {
          const conditionErrors = this.validateConditions([condition as SearchCondition]);
          errors.push(...conditionErrors.map(err => `Group ${index + 1}, ${err}`));
        } else {
          const nestedErrors = this.validateGroups([condition as QueryGroup]);
          errors.push(...nestedErrors.map(err => `Group ${index + 1}, Nested ${err}`));
        }
      });
    });

    return errors;
  }

  /**
   * Validate sorting conditions
   */
  private validateSorting(sorting: SortCondition[]): string[] {
    const errors: string[] = [];

    sorting.forEach((sort, index) => {
      if (!sort.field) {
        errors.push(`Sort ${index + 1}: field is required`);
      }

      if (!['asc', 'desc'].includes(sort.order)) {
        errors.push(`Sort ${index + 1}: order must be 'asc' or 'desc'`);
      }
    });

    return errors;
  }

  /**
   * Validate pagination parameters
   */
  private validatePagination(pagination: { page: number; limit: number }): string[] {
    const errors: string[] = [];

    if (pagination.page < 1) {
      errors.push('Page must be greater than 0');
    }

    if (pagination.limit < 1 || pagination.limit > 100) {
      errors.push('Limit must be between 1 and 100');
    }

    return errors;
  }

  /**
   * Check for optimization opportunities
   */
  private checkOptimizations(query: ComplexQuery, optimizations: string[], warnings: string[]): void {
    // Check for inefficient queries
    if (query.conditions && query.conditions.length > 10) {
      warnings.push('Large number of conditions may impact performance');
      optimizations.push('Consider grouping related conditions or using different filter strategy');
    }

    // Check for missing indexes
    if (query.textSearch && query.conditions && query.conditions.length > 5) {
      optimizations.push('Consider adding composite indexes for frequently used filter combinations');
    }

    // Check pagination efficiency
    if (query.pagination && query.pagination.page > 100) {
      warnings.push('Deep pagination may be slow');
      optimizations.push('Consider using cursor-based pagination for better performance');
    }

    // Check for redundant sorting
    if (query.textSearch && query.sorting && query.sorting.some(s => s.field === 'created_at')) {
      optimizations.push('Text search results are already ranked by relevance; additional sorting may reduce relevance accuracy');
    }
  }

  /**
   * Build a count query for the same conditions
   */
  async buildCountQuery(complexQuery: ComplexQuery): Promise<any> {
    let countQuery = this.supabase
      .from(this.baseTable)
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Apply text search
    if (complexQuery.textSearch) {
      countQuery = this.applyTextSearch(countQuery, complexQuery.textSearch);
    }

    // Apply conditions
    if (complexQuery.conditions) {
      countQuery = this.applyConditions(countQuery, complexQuery.conditions);
    }

    // Apply groups
    if (complexQuery.groups) {
      countQuery = this.applyGroups(countQuery, complexQuery.groups);
    }

    return countQuery;
  }

  /**
   * Execute a complex query and return results with metadata
   */
  async executeQuery(complexQuery: ComplexQuery): Promise<{
    data: any[];
    count?: number;
    validation: QueryValidationResult;
    executionTime: number;
  }> {
    const startTime = Date.now();
    
    // Validate query first
    const validation = this.validateQuery(complexQuery);
    if (!validation.isValid) {
      throw new Error(`Query validation failed: ${validation.errors.join(', ')}`);
    }

    try {
      // Build and execute main query
      const query = await this.buildQuery(complexQuery);
      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Build and execute count query if needed
      let count: number | undefined;
      if (complexQuery.pagination) {
        const countQuery = await this.buildCountQuery(complexQuery);
        const { count: totalCount, error: countError } = await countQuery;
        if (countError) {
          console.warn('Count query failed:', countError);
        } else {
          count = totalCount || 0;
        }
      }

      const executionTime = Date.now() - startTime;

      return {
        data: data || [],
        count,
        validation,
        executionTime
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      throw new Error(`Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}