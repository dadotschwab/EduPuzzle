// Input validation functions for Supabase Edge Functions
// Basic validation without external dependencies

// Stripe webhook event validation
export function validateStripeEvent(
  event: any
): { success: true; data: any } | { success: false; error: string } {
  if (!event || typeof event !== 'object') {
    return { success: false, error: 'Event must be an object' }
  }

  if (!event.id || typeof event.id !== 'string') {
    return { success: false, error: 'Event must have a valid id' }
  }

  if (!event.type || typeof event.type !== 'string') {
    return { success: false, error: 'Event must have a valid type' }
  }

  if (typeof event.created !== 'number') {
    return { success: false, error: 'Event must have a valid created timestamp' }
  }

  if (!event.data || typeof event.data !== 'object') {
    return { success: false, error: 'Event must have valid data' }
  }

  return { success: true, data: event }
}

// Subscription data validation
export function validateSubscriptionData(
  data: any
): { success: true; data: any } | { success: false; error: string } {
  if (!data || typeof data !== 'object') {
    return { success: false, error: 'Subscription data must be an object' }
  }

  if (data.object !== 'subscription') {
    return { success: false, error: 'Object must be a subscription' }
  }

  const validStatuses = [
    'incomplete',
    'incomplete_expired',
    'trialing',
    'active',
    'past_due',
    'canceled',
    'unpaid',
  ]
  if (!validStatuses.includes(data.status)) {
    return { success: false, error: 'Invalid subscription status' }
  }

  if (!data.customer || typeof data.customer !== 'string') {
    return { success: false, error: 'Subscription must have a valid customer ID' }
  }

  return { success: true, data }
}

// Invoice data validation
export function validateInvoiceData(
  data: any
): { success: true; data: any } | { success: false; error: string } {
  if (!data || typeof data !== 'object') {
    return { success: false, error: 'Invoice data must be an object' }
  }

  if (data.object !== 'invoice') {
    return { success: false, error: 'Object must be an invoice' }
  }

  const validStatuses = ['draft', 'open', 'paid', 'void', 'uncollectible']
  if (!validStatuses.includes(data.status)) {
    return { success: false, error: 'Invalid invoice status' }
  }

  if (!data.customer || typeof data.customer !== 'string') {
    return { success: false, error: 'Invoice must have a valid customer ID' }
  }

  return { success: true, data }
} // Request sanitization
export function sanitizeRequest(request: Request): {
  method: string
  url: string
  headers: Record<string, string>
  body?: any
} {
  const sanitized = {
    method: request.method,
    url: request.url,
    headers: {} as Record<string, string>,
  }

  // Only include safe headers
  const safeHeaders = [
    'content-type',
    'content-length',
    'user-agent',
    'accept',
    'accept-encoding',
    'stripe-signature',
  ]

  for (const [key, value] of request.headers.entries()) {
    if (safeHeaders.includes(key.toLowerCase())) {
      sanitized.headers[key] = value
    }
  }

  return sanitized
}

// Suspicious pattern detection
export function detectSuspiciousPatterns(request: Request): string[] {
  const warnings: string[] = []

  // Check for unusual user agents
  const userAgent = request.headers.get('user-agent') || ''
  if (!userAgent || userAgent.length < 10) {
    warnings.push('Suspicious user agent')
  }

  // Check for excessive headers
  if (Array.from(request.headers.entries()).length > 20) {
    warnings.push('Excessive headers')
  }

  // Check for unusual content types for webhook endpoints
  const url = new URL(request.url)
  if (url.pathname.includes('webhook')) {
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      warnings.push('Unexpected content type for webhook')
    }
  }

  return warnings
}
