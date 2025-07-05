import { z } from 'zod';

// Zod schemas for favorites validation
export const FavoriteInputSchema = z.object({
  listing_id: z.string().min(1, 'Listing ID is required'),
});

export const FavoriteQuerySchema = z.object({
  limit: z.string().optional().transform(val => {
    if (!val) return 50;
    const parsed = parseInt(val);
    return isNaN(parsed) ? 50 : Math.min(Math.max(parsed, 1), 100);
  }),
  offset: z.string().optional().transform(val => {
    if (!val) return 0;
    const parsed = parseInt(val);
    return isNaN(parsed) ? 0 : Math.max(parsed, 0);
  }),
  sort_by: z.string().optional().transform(val => {
    if (!val || !['created_at', 'listing_price', 'listing_year'].includes(val)) {
      return 'created_at';
    }
    return val as 'created_at' | 'listing_price' | 'listing_year';
  }),
  sort_order: z.string().optional().transform(val => {
    if (!val || !['asc', 'desc'].includes(val)) {
      return 'desc';
    }
    return val as 'asc' | 'desc';
  }),
});

export const FavoriteResponseSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  listing_id: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  listing: z.object({
    id: z.string(),
    title: z.string(),
    make: z.string(),
    model: z.string(),
    year: z.number(),
    price: z.number(),
    location: z.string(),
    description: z.string().nullable(),
    engine: z.string().nullable(),
    transmission: z.string().nullable(),
    mileage: z.number().nullable(),
    condition: z.string().nullable(),
    status: z.string(),
    created_at: z.string().datetime(),
    listing_images: z.array(z.object({
      id: z.string(),
      image_url: z.string().url(),
      is_primary: z.boolean(),
    })),
  }),
});

// Types derived from schemas
export type FavoriteInput = z.infer<typeof FavoriteInputSchema>;
export type FavoriteQuery = z.infer<typeof FavoriteQuerySchema>;
export type FavoriteResponse = z.infer<typeof FavoriteResponseSchema>;

// Validation functions
export function validateFavoriteInput(data: unknown): { success: true; data: FavoriteInput } | { success: false; error: string } {
  try {
    const validatedData = FavoriteInputSchema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      return { success: false, error: errorMessage };
    }
    return { success: false, error: 'Invalid input data' };
  }
}

export function validateFavoriteQuery(data: unknown): { success: true; data: FavoriteQuery } | { success: false; error: string } {
  try {
    // Convert null values to undefined for better Zod handling
    const cleanData = data && typeof data === 'object' ? 
      Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== null)
      ) : {};
    
    const validatedData = FavoriteQuerySchema.parse(cleanData);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      return { success: false, error: errorMessage };
    }
    return { success: false, error: 'Invalid query parameters' };
  }
}

// Business logic validation
export async function validateListingExists(supabase: any, listingId: string): Promise<{ exists: boolean; listing?: any; error?: string }> {
  try {
    const { data: listing, error } = await supabase
      .from('listings')
      .select('id, status, user_id, title')
      .eq('id', listingId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return { exists: false, error: 'Listing not found' };
      }
      return { exists: false, error: error.message };
    }

    return { exists: true, listing };
  } catch (error) {
    return { exists: false, error: 'Failed to validate listing' };
  }
}

export async function validateNotOwnListing(supabase: any, listingId: string, userId: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const { data: listing, error } = await supabase
      .from('listings')
      .select('user_id')
      .eq('id', listingId)
      .single();

    if (error) {
      return { valid: false, error: 'Failed to check listing ownership' };
    }

    if (listing.user_id === userId) {
      return { valid: false, error: 'Cannot favorite your own listing' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Failed to validate listing ownership' };
  }
}

export async function validateNotAlreadyFavorited(supabase: any, listingId: string, userId: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const { data: existingFavorite, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('listing_id', listingId)
      .single();

    if (error && error.code !== 'PGRST116') { // Error other than "no rows returned"
      return { valid: false, error: 'Failed to check existing favorite' };
    }

    if (existingFavorite) {
      return { valid: false, error: 'Listing already favorited' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Failed to validate favorite status' };
  }
}

export async function validateFavoriteExists(supabase: any, listingId: string, userId: string): Promise<{ exists: boolean; favoriteId?: string; error?: string }> {
  try {
    const { data: favorite, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('listing_id', listingId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return { exists: false, error: 'Favorite not found' };
      }
      return { exists: false, error: error.message };
    }

    return { exists: true, favoriteId: favorite.id };
  } catch (error) {
    return { exists: false, error: 'Failed to validate favorite existence' };
  }
}

// Error response helpers
export function createValidationErrorResponse(message: string, details?: any) {
  return {
    error: 'Validation Error',
    message,
    details,
    timestamp: new Date().toISOString(),
  };
}

export function createAuthErrorResponse(message: string = 'Authentication required') {
  return {
    error: 'Authentication Error',
    message,
    timestamp: new Date().toISOString(),
  };
}

export function createNotFoundErrorResponse(resource: string) {
  return {
    error: 'Not Found',
    message: `${resource} not found`,
    timestamp: new Date().toISOString(),
  };
}

export function createConflictErrorResponse(message: string) {
  return {
    error: 'Conflict',
    message,
    timestamp: new Date().toISOString(),
  };
}

export function createServerErrorResponse(message: string, details?: any) {
  return {
    error: 'Server Error',
    message,
    details,
    timestamp: new Date().toISOString(),
  };
}

// Data sanitization
export function sanitizeFavoriteData(data: any): Partial<FavoriteResponse> {
  return {
    id: data.id,
    user_id: data.user_id,
    listing_id: data.listing_id,
    created_at: data.created_at,
    updated_at: data.updated_at,
    listing: data.listing ? {
      id: data.listing.id,
      title: data.listing.title?.trim(),
      make: data.listing.make?.trim(),
      model: data.listing.model?.trim(),
      year: parseInt(data.listing.year),
      price: parseFloat(data.listing.price),
      location: data.listing.location?.trim(),
      description: data.listing.description?.trim() || null,
      engine: data.listing.engine?.trim() || null,
      transmission: data.listing.transmission?.trim() || null,
      mileage: data.listing.mileage ? parseInt(data.listing.mileage) : null,
      condition: data.listing.condition?.trim() || null,
      status: data.listing.status,
      created_at: data.listing.created_at,
      listing_images: data.listing.listing_images || [],
    } : undefined,
  };
}

// Performance and security helpers
export function createRateLimitKey(userId: string, action: string): string {
  return `favorites:${action}:${userId}`;
}

export function validateRequestSize(request: any, maxSize: number = 1024): boolean {
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > maxSize) {
    return false;
  }
  return true;
}

// Database query helpers
export function buildFavoritesQuery(supabase: any, userId: string, options: FavoriteQuery) {
  let query = supabase
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
    .eq('user_id', userId);

  // Apply sorting
  const sortField = options.sort_by === 'listing_price' ? 'listing.price' : 
                   options.sort_by === 'listing_year' ? 'listing.year' : 
                   'created_at';
  
  query = query.order(sortField, { ascending: options.sort_order === 'asc' });

  // Apply pagination
  if (options.limit && options.offset !== undefined) {
    query = query.range(options.offset, options.offset + options.limit - 1);
  }

  return query;
}

// Logging helpers for debugging
export function logFavoriteOperation(operation: string, userId: string, listingId: string, success: boolean, error?: string) {
  const logData = {
    timestamp: new Date().toISOString(),
    operation,
    user_id: userId,
    listing_id: listingId,
    success,
    error,
  };
  
  console.log(`[FAVORITES] ${operation}:`, logData);
  return logData;
} 