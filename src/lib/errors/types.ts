/**
 * Error category classification
 */
export type ErrorCategory = 
  | 'network'      // Connection issues, timeouts (status 0)
  | 'client'       // 4xx errors (bad request, not found, validation)
  | 'server'       // 5xx errors (server crash, database down)
  | 'validation'   // Form/schema validation failures
  | 'unknown'      // Unexpected errors

/**
 * Structured application error with user-friendly messaging
 * and collapsible technical details
 */
export interface AppError {
  // User-facing (always visible)
  title: string           // "Failed to Load Configuration"
  message: string         // User-friendly explanation
  category: ErrorCategory
  
  // Technical details (collapsible)
  technical?: {
    statusCode?: number   // HTTP status code
    endpoint?: string     // API endpoint called
    method?: string       // GET, POST, etc.
    timestamp?: Date | string
    apiMessage?: string   // Raw message from backend API
  }
  
  // Recovery actions (optional)
  actions?: ErrorAction[]
}

/**
 * Action button for error recovery
 */
export interface ErrorAction {
  label: string           // "Retry", "Go Back", "Go Home"
  handler: () => void
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link'
}
