/**
 * @fileoverview Centralized logging utility for EduPuzzle
 *
 * Provides configurable logging with different levels:
 * - ERROR: Always logged (production issues)
 * - WARN: Always logged (potential issues)
 * - INFO: Toggleable (important metrics/events)
 * - DEBUG: Toggleable (detailed debugging)
 *
 * @module lib/logger
 */

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'

interface LoggerConfig {
  enableDebug: boolean
  enableInfo: boolean
}

class Logger {
  private config: LoggerConfig

  constructor() {
    // Check environment variable or default to production mode
    const isDevelopment = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true'

    this.config = {
      enableDebug: isDevelopment,
      enableInfo: isDevelopment,
    }
  }

  /**
   * Enable or disable debug logs at runtime
   */
  setDebugEnabled(enabled: boolean): void {
    this.config.enableDebug = enabled
  }

  /**
   * Enable or disable info logs at runtime
   */
  setInfoEnabled(enabled: boolean): void {
    this.config.enableInfo = enabled
  }

  /**
   * Debug logs - detailed information for development
   */
  debug(message: string, ...args: unknown[]): void {
    if (this.config.enableDebug) {
      console.log(`[DEBUG] ${message}`, ...args)
    }
  }

  /**
   * Info logs - important events and metrics
   */
  info(message: string, ...args: unknown[]): void {
    if (this.config.enableInfo) {
      console.log(`[INFO] ${message}`, ...args)
    }
  }

  /**
   * Warning logs - potential issues (always shown)
   */
  warn(message: string, ...args: unknown[]): void {
    console.warn(`[WARN] ${message}`, ...args)
  }

  /**
   * Error logs - critical issues (always shown)
   * Also reports to Sentry in production
   */
  error(message: string, ...args: unknown[]): void {
    console.error(`[ERROR] ${message}`, ...args)

    // Send to Sentry in production
    if (import.meta.env.PROD && args.length > 0 && args[0] instanceof Error) {
      import('@/lib/sentry').then(({ captureException }) => {
        captureException(args[0] as Error, {
          message,
          additionalContext: args.slice(1),
        })
      })
    }
  }

  /**
   * Group logs together (respects debug/info settings)
   */
  group(label: string, level: LogLevel = 'INFO'): void {
    if (level === 'DEBUG' && !this.config.enableDebug) return
    if (level === 'INFO' && !this.config.enableInfo) return
    console.group(`[${level}] ${label}`)
  }

  /**
   * End a log group
   */
  groupEnd(): void {
    console.groupEnd()
  }
}

// Export singleton instance
export const logger = new Logger()

// Make it available globally for debugging (window.logger.setDebugEnabled(true))
if (typeof window !== 'undefined') {
  (window as typeof window & { logger: Logger }).logger = logger
}
