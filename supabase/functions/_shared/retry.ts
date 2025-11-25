// Retry logic with exponential backoff for Supabase Edge Functions

/**
 * Error interface for retryable errors
 */
interface RetryableError {
  name?: string
  message?: string
  status?: number
}

interface RetryOptions {
  maxRetries: number
  baseDelay: number // milliseconds
  maxDelay: number // milliseconds
  backoffFactor: number
  retryableErrors?: (error: RetryableError) => boolean
}

const defaultRetryOptions: RetryOptions = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffFactor: 2,
  retryableErrors: (error: RetryableError) => {
    // Retry on network errors, timeouts, and 5xx status codes
    if (error?.name === 'NetworkError' || error?.name === 'TimeoutError') {
      return true
    }

    // Retry on Supabase connection errors
    if (error?.message?.includes('connection') || error?.message?.includes('timeout')) {
      return true
    }

    // Retry on rate limiting (429)
    if (error?.status === 429) {
      return true
    }

    // Retry on server errors (5xx)
    if (error?.status && error.status >= 500) {
      return true
    }

    return false
  },
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...defaultRetryOptions, ...options }
  let lastError: RetryableError | unknown

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      // Don't retry on the last attempt
      if (attempt === opts.maxRetries) {
        break
      }

      // Check if error is retryable (cast to RetryableError for type checking)
      if (!opts.retryableErrors?.(error as RetryableError)) {
        break
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(opts.baseDelay * Math.pow(opts.backoffFactor, attempt), opts.maxDelay)

      // Add jitter (±25%)
      const jitter = delay * 0.25 * (Math.random() * 2 - 1)
      const finalDelay = Math.max(0, delay + jitter)

      logger.info(
        `Retry attempt ${attempt + 1}/${opts.maxRetries} after ${finalDelay.toFixed(0)}ms delay`
      )

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, finalDelay))
    }
  }

  throw lastError
}

// Circuit breaker pattern to prevent cascading failures
interface CircuitBreakerOptions {
  failureThreshold: number // Number of failures before opening circuit
  recoveryTimeout: number // Time to wait before trying again (milliseconds)
  monitoringPeriod: number // Time window to count failures (milliseconds)
}

interface CircuitState {
  failures: number
  lastFailureTime: number
  state: 'closed' | 'open' | 'half-open'
}

class CircuitBreaker {
  private state: CircuitState = {
    failures: 0,
    lastFailureTime: 0,
    state: 'closed',
  }

  constructor(private options: CircuitBreakerOptions) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state.state === 'open') {
      // Check if recovery timeout has passed
      if (Date.now() - this.state.lastFailureTime > this.options.recoveryTimeout) {
        this.state.state = 'half-open'
      } else {
        throw new Error('Circuit breaker is open')
      }
    }

    try {
      const result = await operation()

      // Success - reset circuit
      if (this.state.state === 'half-open') {
        this.state.state = 'closed'
        this.state.failures = 0
      }

      return result
    } catch (error) {
      this.recordFailure()

      if (this.state.state === 'half-open') {
        this.state.state = 'open'
      }

      throw error
    }
  }

  private recordFailure() {
    this.state.failures++
    this.state.lastFailureTime = Date.now()

    // Reset failure count if outside monitoring period
    const timeSinceFirstFailure =
      Date.now() - (this.state.lastFailureTime - this.options.monitoringPeriod)
    if (timeSinceFirstFailure > this.options.monitoringPeriod) {
      this.state.failures = 1
    }

    // Open circuit if threshold exceeded
    if (this.state.failures >= this.options.failureThreshold) {
      this.state.state = 'open'
    }
  }

  getState() {
    return { ...this.state }
  }
}

// Global circuit breaker instance for Stripe operations
export const stripeCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  recoveryTimeout: 60000, // 1 minute
  monitoringPeriod: 300000, // 5 minutes
})
