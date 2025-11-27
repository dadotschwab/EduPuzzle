/**
 * @fileoverview Sentry error monitoring configuration
 *
 * Initializes Sentry for production error tracking and performance monitoring.
 * Includes browser tracing, session replay, and custom error filtering.
 *
 * @module lib/sentry
 */

import * as Sentry from '@sentry/react'

/**
 * Initialize Sentry error monitoring
 *
 * Call this once at application startup (in main.tsx)
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  const environment =
    import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE || 'development'

  // Only initialize if DSN is configured
  if (!dsn) {
    console.warn('Sentry DSN not configured - error monitoring disabled')
    return
  }

  // Skip initialization in development to reduce noise
  if (environment === 'development') {
    console.log('Sentry disabled in development mode')
    return
  }

  Sentry.init({
    dsn,
    environment,

    // Performance Monitoring
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        // Mask all text and block all media by default for privacy
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Performance sampling rates
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in staging

    // Session Replay sampling
    replaysSessionSampleRate: 0.1, // Sample 10% of sessions
    replaysOnErrorSampleRate: 1.0, // Sample 100% of sessions with errors

    // Error filtering and enrichment
    beforeSend(event, hint) {
      const error = hint.originalException

      // Filter out specific errors
      if (error instanceof Error) {
        // Ignore network errors from browser extensions
        if (error.message?.includes('Extension context invalidated')) {
          return null
        }

        // Ignore ResizeObserver errors (browser quirk)
        if (error.message?.includes('ResizeObserver')) {
          return null
        }
      }

      // Add custom context
      if (event.contexts) {
        event.contexts.app = {
          app_version: import.meta.env.VITE_APP_VERSION || 'unknown',
          build_time: import.meta.env.VITE_BUILD_TIME || 'unknown',
        }
      }

      return event
    },

    // Breadcrumbs configuration
    maxBreadcrumbs: 50,

    // Don't capture console.log as breadcrumbs in production
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.category === 'console' && breadcrumb.level === 'log') {
        return null
      }
      return breadcrumb
    },
  })

  console.log(`Sentry initialized for environment: ${environment}`)
}

/**
 * Manually capture an exception
 *
 * Use this for caught errors that you want to track
 */
export function captureException(error: Error, context?: Record<string, unknown>) {
  Sentry.captureException(error, {
    extra: context,
  })
}

/**
 * Manually capture a message
 *
 * Use this for non-error events you want to track
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level)
}

/**
 * Set user context for error tracking
 *
 * Call this after user login
 */
export function setUser(user: { id: string; email?: string; username?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  })
}

/**
 * Clear user context
 *
 * Call this on logout
 */
export function clearUser() {
  Sentry.setUser(null)
}

/**
 * Add custom context to errors
 */
export function setContext(name: string, context: Record<string, unknown>) {
  Sentry.setContext(name, context)
}

/**
 * Add a breadcrumb for tracking user actions
 */
export function addBreadcrumb(message: string, category?: string, level?: Sentry.SeverityLevel) {
  Sentry.addBreadcrumb({
    message,
    category: category || 'custom',
    level: level || 'info',
    timestamp: Date.now() / 1000,
  })
}
