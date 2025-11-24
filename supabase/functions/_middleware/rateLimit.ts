// Rate limiting middleware for Supabase Edge Functions
// Implements in-memory rate limiting with sliding window

interface RateLimitEntry {
  count: number
  windowStart: number
}

interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  keyGenerator?: (request: Request) => string // Function to generate rate limit key
}

class RateLimiter {
  private limits = new Map<string, RateLimitEntry>()
  private cleanupInterval: number | null = null

  constructor(private options: RateLimitOptions) {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60000) as unknown as number
  }

  isRateLimited(request: Request): boolean {
    const key = this.options.keyGenerator?.(request) || this.getDefaultKey(request)
    const now = Date.now()
    const entry = this.limits.get(key)

    if (!entry || now - entry.windowStart >= this.options.windowMs) {
      // First request in window or window expired
      this.limits.set(key, {
        count: 1,
        windowStart: now,
      })
      return false
    }

    if (entry.count >= this.options.maxRequests) {
      return true
    }

    entry.count++
    return false
  }

  private getDefaultKey(request: Request): string {
    // Use IP address as default key
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const clientIp = request.headers.get('cf-connecting-ip') || forwarded || realIp || 'unknown'

    // For Stripe webhooks, also include the event type to prevent abuse
    const url = new URL(request.url)
    if (url.pathname.includes('stripe-webhook')) {
      return `${clientIp}:stripe-webhook`
    }

    return clientIp
  }

  private cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.limits.entries()) {
      if (now - entry.windowStart >= this.options.windowMs) {
        this.limits.delete(key)
      }
    }
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.limits.clear()
  }
}

// Default rate limiter instance (50 requests per minute)
const defaultRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 50, // 50 requests per minute
  keyGenerator: (request) => {
    const url = new URL(request.url)
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const clientIp = request.headers.get('cf-connecting-ip') || forwarded || realIp || 'unknown'

    // For Stripe webhooks, use IP + endpoint
    if (url.pathname.includes('stripe-webhook')) {
      return `${clientIp}:stripe-webhook`
    }

    return clientIp
  },
})

export function checkRateLimit(request: Request): boolean {
  return defaultRateLimiter.isRateLimited(request)
}

export function createRateLimitResponse(): Response {
  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: 60, // seconds
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '60',
        'X-RateLimit-Limit': '50',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(Date.now() + 60000).toISOString(),
      },
    }
  )
}
