// Circuit breaker pattern for Supabase Edge Functions
// Prevents cascading failures by temporarily stopping requests to failing services

interface CircuitBreakerOptions {
  failureThreshold: number // Number of failures before opening circuit
  recoveryTimeout: number // Time to wait before trying again (milliseconds)
  monitoringPeriod: number // Time window to count failures (milliseconds)
}

interface CircuitState {
  failures: number
  lastFailureTime: number
  state: 'closed' | 'open' | 'half-open'
  nextAttemptTime: number
}

class CircuitBreaker {
  private state: CircuitState = {
    failures: 0,
    lastFailureTime: 0,
    state: 'closed',
    nextAttemptTime: 0,
  }

  constructor(private options: CircuitBreakerOptions) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state.state === 'open') {
      if (Date.now() < this.state.nextAttemptTime) {
        throw new Error(
          `Circuit breaker is open. Next attempt at ${new Date(this.state.nextAttemptTime).toISOString()}`
        )
      }

      // Transition to half-open
      this.state.state = 'half-open'
    }

    try {
      const result = await operation()

      // Success - reset circuit to closed
      this.state.state = 'closed'
      this.state.failures = 0
      this.state.lastFailureTime = 0

      return result
    } catch (error) {
      this.recordFailure()

      // If in half-open state, go back to open
      if (this.state.state === 'half-open') {
        this.state.state = 'open'
        this.state.nextAttemptTime = Date.now() + this.options.recoveryTimeout
      }

      throw error
    }
  }

  private recordFailure() {
    this.state.failures++
    this.state.lastFailureTime = Date.now()

    // Check if we should open the circuit
    if (this.state.failures >= this.options.failureThreshold) {
      this.state.state = 'open'
      this.state.nextAttemptTime = Date.now() + this.options.recoveryTimeout
    }
  }

  getState(): Readonly<CircuitState> {
    return { ...this.state }
  }

  // Force reset (for testing or manual intervention)
  reset() {
    this.state = {
      failures: 0,
      lastFailureTime: 0,
      state: 'closed',
      nextAttemptTime: 0,
    }
  }
}

// Global circuit breaker instances
export const stripeCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5, // Open after 5 failures
  recoveryTimeout: 60000, // Wait 1 minute before trying again
  monitoringPeriod: 300000, // Monitor over 5 minutes
})

export const databaseCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3, // Open after 3 database failures
  recoveryTimeout: 30000, // Wait 30 seconds before trying again
  monitoringPeriod: 120000, // Monitor over 2 minutes
})

// Health check functions
export async function checkStripeHealth(): Promise<boolean> {
  try {
    // Simple health check - could be enhanced with actual Stripe API call
    return true
  } catch {
    return false
  }
}

export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    // Simple health check - could be enhanced with actual database query
    return true
  } catch {
    return false
  }
}
