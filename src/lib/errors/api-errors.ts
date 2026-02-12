import type { AppError, ErrorCategory } from './types'

export type { AppError, ErrorCategory }

/**
 * Parse openapi-fetch error into structured AppError
 * 
 * @param error - Error object from fetchClient (contains message from API)
 * @param response - HTTP Response object (contains status, statusText, headers)
 * @param context - Additional context (endpoint, method)
 * @returns Structured AppError with user-friendly messaging
 */
export function parseApiError(
  error: { message: string },
  response: Response | undefined,
  context?: {
    endpoint?: string
    method?: string
  }
): AppError {
  const statusCode = response?.status || 0
  const category = categorizeHttpError(statusCode)
  const { title, message } = getUserFriendlyMessage(statusCode, error.message)
  
  return {
    title,
    message,
    category,
    technical: {
      statusCode,
      endpoint: context?.endpoint,
      method: context?.method,
      timestamp: new Date(),
      apiMessage: error.message,
    },
    actions: getDefaultActions(category, statusCode),
  }
}

/**
 * Map HTTP status code to error category
 */
function categorizeHttpError(status: number): ErrorCategory {
  if (status === 0) return 'network'      // Network failure
  if (status >= 400 && status < 500) return 'client'
  if (status >= 500) return 'server'
  return 'unknown'
}

/**
 * Generate user-friendly error messages based on HTTP status
 */
function getUserFriendlyMessage(
  status: number,
  apiMessage: string
): { title: string; message: string } {
  const messages: Record<number, { title: string; message: string }> = {
    0: {
      title: 'Connection Failed',
      message: 'Unable to reach the server. Check your internet connection and verify the server is running.',
    },
    400: {
      title: 'Invalid Request',
      message: 'The request was malformed. This is likely a bug in the application.',
    },
    401: {
      title: 'Unauthorized',
      message: 'You need to log in to access this resource.',
    },
    403: {
      title: 'Access Denied',
      message: 'You don\'t have permission to access this resource.',
    },
    404: {
      title: 'Not Found',
      message: 'The requested resource could not be found. It may have been deleted or never existed.',
    },
    409: {
      title: 'Conflict',
      message: apiMessage || 'The operation conflicts with the current state. Another change may have been made.',
    },
    422: {
      title: 'Validation Failed',
      message: apiMessage || 'The data provided did not pass validation. Check the format and try again.',
    },
    500: {
      title: 'Server Error',
      message: 'The server encountered an internal error. Please try again later.',
    },
    502: {
      title: 'Bad Gateway',
      message: 'The server is temporarily unreachable. It may be restarting or under heavy load.',
    },
    503: {
      title: 'Service Unavailable',
      message: 'The server is temporarily down for maintenance. Please try again later.',
    },
  }
  
  return messages[status] || {
    title: 'Error',
    message: apiMessage || 'An unexpected error occurred. Please try again.',
  }
}

/**
 * Generate default recovery actions based on error type
 */
function getDefaultActions(
  category: ErrorCategory,
  status: number
): AppError['actions'] {
  const actions: AppError['actions'] = []
  
  // Network errors - suggest reload
  if (category === 'network') {
    actions.push({
      label: 'Retry',
      handler: () => window.location.reload(),
      variant: 'default',
    })
  }
  
  // 404 - suggest navigation home
  if (status === 404) {
    actions.push({
      label: 'Go Home',
      handler: () => window.location.href = '/',
      variant: 'default',
    })
  }
  
  // Always offer "Go Back" as fallback
  actions.push({
    label: 'Go Back',
    handler: () => window.history.back(),
    variant: 'secondary',
  })
  
  return actions
}

/**
 * Parse TanStack Query error into AppError
 * 
 * TanStack Query wraps fetch errors, we need to extract the underlying error
 */
export function parseTanStackQueryError(error: unknown): AppError {
  // TanStack Query errors typically have a message property
  if (error && typeof error === 'object' && 'message' in error) {
    // Try to extract response info if available
    const response = 'response' in error ? error.response as Response : undefined
    
    return parseApiError(
      error as { message: string },
      response,
      undefined
    )
  }
  
  // Fallback for unknown error types
  return {
    title: 'Error',
    message: error instanceof Error ? error.message : 'An unknown error occurred',
    category: 'unknown',
    technical: {
      timestamp: new Date(),
      apiMessage: String(error),
    },
  }
}
