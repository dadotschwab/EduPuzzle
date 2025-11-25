// Production-ready logging utility for Supabase Edge Functions
// Only logs in development, remains silent in production unless error level

declare const Deno: {
  env: {
    get(key: string): string | undefined
  }
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  function?: string
  userId?: string
  eventId?: string
  [key: string]: unknown
}

class EdgeFunctionLogger {
  private isDevelopment: boolean

  constructor() {
    // Check if we're in development mode
    // In production, DENO_ENV should be set to 'production'
    this.isDevelopment = Deno.env.get('DENO_ENV') !== 'production'
  }

  private shouldLog(level: LogLevel): boolean {
    // Always log errors
    if (level === 'error') return true

    // Log warnings in all environments
    if (level === 'warn') return true

    // Only log info and debug in development
    return this.isDevelopment
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` | ${JSON.stringify(context)}` : ''
    return `[${timestamp}] [${level.toUpperCase()}]${contextStr} ${message}`
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      logger.info(this.formatMessage('debug', message, context))
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      logger.info(this.formatMessage('info', message, context))
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      logger.warn(this.formatMessage('warn', message, context))
    }
  }

  error(message: string, error?: unknown, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const errorDetails =
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
              name: error.name,
            }
          : error

      const fullContext = { ...context, error: errorDetails }
      logger.error(this.formatMessage('error', message, fullContext))
    }
  }
}

// Singleton instance
export const logger = new EdgeFunctionLogger()

// Export for testing or custom configuration
export { EdgeFunctionLogger }
