// Input validation functions for Supabase Edge Functions
// Basic validation without external dependencies

// Stripe Event type definition
interface StripeEvent {
  id: string
  type: string
  created: number
  data: {
    object: Record<string, unknown>
  }
}

// Stripe Subscription type definition
interface StripeSubscription {
  object: 'subscription'
  id: string
  customer: string
  status:
    | 'incomplete'
    | 'incomplete_expired'
    | 'trialing'
    | 'active'
    | 'past_due'
    | 'canceled'
    | 'unpaid'
  current_period_end?: number
  cancel_at_period_end?: boolean
}

// Stripe Invoice type definition
interface StripeInvoice {
  object: 'invoice'
  id: string
  customer: string
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible'
  subscription?: string
  amount_due?: number
}

// Validation result types
type ValidationSuccess<T> = { success: true; data: T }
type ValidationFailure = { success: false; error: string }
type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure

// Stripe webhook event validation
export function validateStripeEvent(event: unknown): ValidationResult<StripeEvent> {
  if (!event || typeof event !== 'object') {
    return { success: false, error: 'Event must be an object' }
  }

  const evt = event as Record<string, unknown>

  if (!evt.id || typeof evt.id !== 'string') {
    return { success: false, error: 'Event must have a valid id' }
  }

  if (!evt.type || typeof evt.type !== 'string') {
    return { success: false, error: 'Event must have a valid type' }
  }

  if (typeof evt.created !== 'number') {
    return { success: false, error: 'Event must have a valid created timestamp' }
  }

  if (!evt.data || typeof evt.data !== 'object') {
    return { success: false, error: 'Event must have valid data' }
  }

  return {
    success: true,
    data: {
      id: evt.id,
      type: evt.type,
      created: evt.created as number,
      data: evt.data as { object: Record<string, unknown> },
    },
  }
}

// Subscription data validation
export function validateSubscriptionData(data: unknown): ValidationResult<StripeSubscription> {
  if (!data || typeof data !== 'object') {
    return { success: false, error: 'Subscription data must be an object' }
  }

  const sub = data as Record<string, unknown>

  if (sub.object !== 'subscription') {
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
  if (!validStatuses.includes(sub.status as string)) {
    return { success: false, error: 'Invalid subscription status' }
  }

  if (!sub.customer || typeof sub.customer !== 'string') {
    return { success: false, error: 'Subscription must have a valid customer ID' }
  }

  return { success: true, data: data as StripeSubscription }
}

// Invoice data validation
export function validateInvoiceData(data: unknown): ValidationResult<StripeInvoice> {
  if (!data || typeof data !== 'object') {
    return { success: false, error: 'Invoice data must be an object' }
  }

  const invoice = data as Record<string, unknown>

  if (invoice.object !== 'invoice') {
    return { success: false, error: 'Object must be an invoice' }
  }

  const validStatuses = ['draft', 'open', 'paid', 'void', 'uncollectible']
  if (!validStatuses.includes(invoice.status as string)) {
    return { success: false, error: 'Invalid invoice status' }
  }

  if (!invoice.customer || typeof invoice.customer !== 'string') {
    return { success: false, error: 'Invoice must have a valid customer ID' }
  }

  return { success: true, data: data as StripeInvoice }
}

// Sanitized request data
interface SanitizedRequest {
  method: string
  url: string
  headers: Record<string, string>
}

// Request sanitization
export function sanitizeRequest(request: Request): SanitizedRequest {
  const sanitized: SanitizedRequest = {
    method: request.method,
    url: request.url,
    headers: {},
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
