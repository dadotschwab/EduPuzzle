import { useCallback } from 'react'

interface ErrorEvent {
  message: string
  stack?: string
  componentStack?: string
  timestamp: number
  userAgent: string
  url: string
}

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  metadata?: Record<string, any>
}

export function useMonitoring() {
  const logError = useCallback((error: Error, componentStack?: string) => {
    const errorEvent: ErrorEvent = {
      message: error.message,
      stack: error.stack,
      componentStack,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    }

    // In production, send to error monitoring service (Sentry, LogRocket, etc.)
    console.error('Error logged:', errorEvent)

    // Could send to analytics/monitoring service
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.message,
        fatal: false,
      })
    }
  }, [])

  const logPerformance = useCallback(
    (name: string, value: number, metadata?: Record<string, any>) => {
      const metric: PerformanceMetric = {
        name,
        value,
        timestamp: Date.now(),
        metadata,
      }

      // In production, send to performance monitoring service
      console.log('Performance metric:', metric)

      // Could send to analytics service
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'timing_complete', {
          name,
          value: Math.round(value),
          event_category: 'performance',
        })
      }
    },
    []
  )

  const measurePerformance = useCallback(
    (name: string, fn: () => void | Promise<void>, metadata?: Record<string, any>) => {
      const start = performance.now()

      const result = fn()

      if (result instanceof Promise) {
        return result.finally(() => {
          const duration = performance.now() - start
          logPerformance(name, duration, metadata)
        })
      } else {
        const duration = performance.now() - start
        logPerformance(name, duration, metadata)
        return result
      }
    },
    [logPerformance]
  )

  return {
    logError,
    logPerformance,
    measurePerformance,
  }
}
