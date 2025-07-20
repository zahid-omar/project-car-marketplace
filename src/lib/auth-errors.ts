/**
 * Google OAuth and general authentication error handling utilities
 */

export interface AuthError {
  code: string
  message: string
  userMessage: string
  retryable: boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface AuthErrorContext {
  provider?: 'google' | 'email' | 'phone'
  operation?: 'signin' | 'signup' | 'callback' | 'token_refresh' | 'logout'
  userId?: string
  timestamp: string
  userAgent?: string
  url?: string
}

/**
 * Standard OAuth error codes from RFC 6749 and Google-specific errors
 */
export const OAUTH_ERROR_CODES = {
  // Standard OAuth 2.0 errors
  INVALID_REQUEST: 'invalid_request',
  UNAUTHORIZED_CLIENT: 'unauthorized_client',
  ACCESS_DENIED: 'access_denied',
  UNSUPPORTED_RESPONSE_TYPE: 'unsupported_response_type',
  INVALID_SCOPE: 'invalid_scope',
  SERVER_ERROR: 'server_error',
  TEMPORARILY_UNAVAILABLE: 'temporarily_unavailable',
  
  // Google-specific errors
  INVALID_CLIENT: 'invalid_client',
  INVALID_GRANT: 'invalid_grant',
  UNSUPPORTED_GRANT_TYPE: 'unsupported_grant_type',
  
  // Custom application errors
  MISSING_CODE: 'missing_code',
  AUTH_EXCHANGE_FAILED: 'auth_exchange_failed',
  NO_USER_DATA: 'no_user_data',
  PROFILE_CREATE_FAILED: 'profile_create_failed',
  NETWORK_ERROR: 'network_error',
  POPUP_BLOCKED: 'popup_blocked',
  POPUP_CLOSED: 'popup_closed',
  UNEXPECTED_ERROR: 'unexpected_error',
} as const

/**
 * Maps error codes to user-friendly messages and error metadata
 */
export const ERROR_MAPPINGS: Record<string, Omit<AuthError, 'code'>> = {
  [OAUTH_ERROR_CODES.ACCESS_DENIED]: {
    message: 'User denied access to their Google account',
    userMessage: 'Sign-in was cancelled. Please try again if you want to continue with Google.',
    retryable: true,
    severity: 'low',
  },
  [OAUTH_ERROR_CODES.INVALID_REQUEST]: {
    message: 'Invalid OAuth request parameters',
    userMessage: 'There was a problem with the sign-in request. Please try again.',
    retryable: true,
    severity: 'medium',
  },
  [OAUTH_ERROR_CODES.INVALID_CLIENT]: {
    message: 'Invalid OAuth client configuration',
    userMessage: 'There was a configuration problem. Please contact support if this persists.',
    retryable: false,
    severity: 'high',
  },
  [OAUTH_ERROR_CODES.SERVER_ERROR]: {
    message: 'Google server error during OAuth flow',
    userMessage: 'Google is experiencing issues. Please try again in a few moments.',
    retryable: true,
    severity: 'medium',
  },
  [OAUTH_ERROR_CODES.TEMPORARILY_UNAVAILABLE]: {
    message: 'Google OAuth service temporarily unavailable',
    userMessage: 'Google sign-in is temporarily unavailable. Please try again later.',
    retryable: true,
    severity: 'medium',
  },
  [OAUTH_ERROR_CODES.MISSING_CODE]: {
    message: 'No authorization code received from Google',
    userMessage: 'Sign-in failed. Please try again.',
    retryable: true,
    severity: 'medium',
  },
  [OAUTH_ERROR_CODES.AUTH_EXCHANGE_FAILED]: {
    message: 'Failed to exchange authorization code for access token',
    userMessage: 'Sign-in failed. Please try again.',
    retryable: true,
    severity: 'medium',
  },
  [OAUTH_ERROR_CODES.NO_USER_DATA]: {
    message: 'No user data received after successful authentication',
    userMessage: 'Sign-in completed but user information could not be retrieved. Please try again.',
    retryable: true,
    severity: 'high',
  },
  [OAUTH_ERROR_CODES.PROFILE_CREATE_FAILED]: {
    message: 'Failed to create user profile in database',
    userMessage: 'Your account was created but there was an issue setting up your profile. You can still use the app.',
    retryable: false,
    severity: 'medium',
  },
  [OAUTH_ERROR_CODES.NETWORK_ERROR]: {
    message: 'Network error during authentication',
    userMessage: 'Network connection issue. Please check your connection and try again.',
    retryable: true,
    severity: 'medium',
  },
  [OAUTH_ERROR_CODES.POPUP_BLOCKED]: {
    message: 'OAuth popup was blocked by browser',
    userMessage: 'Please allow popups for this site and try again.',
    retryable: true,
    severity: 'medium',
  },
  [OAUTH_ERROR_CODES.POPUP_CLOSED]: {
    message: 'OAuth popup was closed before completion',
    userMessage: 'Sign-in window was closed. Please try again if you want to continue.',
    retryable: true,
    severity: 'low',
  },
  [OAUTH_ERROR_CODES.UNEXPECTED_ERROR]: {
    message: 'An unexpected error occurred during authentication',
    userMessage: 'Something went wrong. Please try again or contact support if the problem persists.',
    retryable: true,
    severity: 'high',
  },
}

/**
 * Creates a standardized AuthError object from an error code and optional context
 */
export function createAuthError(
  code: string,
  message?: string,
  context?: Partial<AuthErrorContext>
): AuthError {
  const mapping = ERROR_MAPPINGS[code] || ERROR_MAPPINGS[OAUTH_ERROR_CODES.UNEXPECTED_ERROR]
  
  return {
    code,
    message: message || mapping.message,
    userMessage: mapping.userMessage,
    retryable: mapping.retryable,
    severity: mapping.severity,
  }
}

/**
 * Parses and categorizes errors from Supabase Auth
 */
export function parseSupabaseAuthError(error: any, context?: Partial<AuthErrorContext>): AuthError {
  const errorMessage = error?.message || error?.error_description || 'Unknown error'
  const errorCode = error?.error || error?.code
  
  // Map common Supabase error patterns to our error codes
  if (errorMessage.includes('Email not confirmed')) {
    return createAuthError('email_not_confirmed', errorMessage, context)
  }
  
  if (errorMessage.includes('Invalid login credentials')) {
    return createAuthError('invalid_credentials', errorMessage, context)
  }
  
  if (errorMessage.includes('User not found')) {
    return createAuthError('user_not_found', errorMessage, context)
  }
  
  if (errorMessage.includes('Email rate limit exceeded')) {
    return createAuthError('rate_limit_exceeded', errorMessage, context)
  }
  
  // Use the error code if it maps to a known OAuth error
  if (errorCode && ERROR_MAPPINGS[errorCode]) {
    return createAuthError(errorCode, errorMessage, context)
  }
  
  // Default to unexpected error
  return createAuthError(OAUTH_ERROR_CODES.UNEXPECTED_ERROR, errorMessage, context)
}

/**
 * Logs authentication errors with structured data for monitoring
 */
export function logAuthError(error: AuthError, context: AuthErrorContext) {
  const logData = {
    timestamp: context.timestamp,
    level: error.severity,
    code: error.code,
    message: error.message,
    retryable: error.retryable,
    provider: context.provider,
    operation: context.operation,
    userId: context.userId,
    userAgent: context.userAgent,
    url: context.url,
  }
  
  // In production, this would integrate with your logging service
  // (e.g., Sentry, LogRocket, DataDog, etc.)
  if (error.severity === 'critical' || error.severity === 'high') {
    console.error('[AUTH ERROR]', logData)
  } else {
    console.warn('[AUTH ERROR]', logData)
  }
  
  // TODO: Integrate with error monitoring service
  // await sendToErrorMonitoring(logData)
}

/**
 * Determines if an error is retryable and suggests retry strategy
 */
export function getRetryStrategy(error: AuthError): {
  shouldRetry: boolean
  delayMs?: number
  maxRetries?: number
} {
  if (!error.retryable) {
    return { shouldRetry: false }
  }
  
  // Different retry strategies based on error type
  switch (error.code) {
    case OAUTH_ERROR_CODES.SERVER_ERROR:
    case OAUTH_ERROR_CODES.TEMPORARILY_UNAVAILABLE:
      return { shouldRetry: true, delayMs: 5000, maxRetries: 3 }
    
    case OAUTH_ERROR_CODES.NETWORK_ERROR:
      return { shouldRetry: true, delayMs: 2000, maxRetries: 2 }
    
    case OAUTH_ERROR_CODES.ACCESS_DENIED:
    case OAUTH_ERROR_CODES.POPUP_CLOSED:
      return { shouldRetry: true, delayMs: 0, maxRetries: 1 }
    
    default:
      return { shouldRetry: true, delayMs: 1000, maxRetries: 2 }
  }
}

/**
 * Additional error mappings for common authentication scenarios
 */
export const ADDITIONAL_ERROR_MAPPINGS: Record<string, Omit<AuthError, 'code'>> = {
  email_not_confirmed: {
    message: 'Email address not confirmed',
    userMessage: 'Please check your email and click the confirmation link before signing in.',
    retryable: false,
    severity: 'medium',
  },
  invalid_credentials: {
    message: 'Invalid email or password',
    userMessage: 'The email or password you entered is incorrect. Please try again.',
    retryable: true,
    severity: 'low',
  },
  user_not_found: {
    message: 'User account not found',
    userMessage: 'No account found with this email address. Please sign up or check your email.',
    retryable: false,
    severity: 'low',
  },
  rate_limit_exceeded: {
    message: 'Rate limit exceeded for authentication requests',
    userMessage: 'Too many attempts. Please wait a few minutes before trying again.',
    retryable: true,
    severity: 'medium',
  },
}

// Merge additional error mappings
Object.assign(ERROR_MAPPINGS, ADDITIONAL_ERROR_MAPPINGS)
