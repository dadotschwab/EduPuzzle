// Security utilities for Supabase Edge Functions

// Request sanitization
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

// Input sanitization
export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') return ''

  // Remove null bytes and control characters
  let sanitized = input.replace(/[\x00-\x1F\x7F]/g, '')

  // Trim whitespace
  sanitized = sanitized.trim()

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength)
  }

  return sanitized
}

// SQL injection basic protection (additional to Supabase's built-in protection)
export function isSafeSqlIdentifier(identifier: string): boolean {
  // Only allow alphanumeric, underscore, and hyphen
  return /^[a-zA-Z0-9_-]+$/.test(identifier)
}

// XSS protection for HTML content
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }

  return text.replace(/[&<>"']/g, (m) => map[m])
}

// Log security events
export function logSecurityEvent(event: string, details: Record<string, any>) {
  console.warn(`[SECURITY] ${event}:`, details)
}
