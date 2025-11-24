// Idempotency handling for Supabase Edge Functions
// Prevents duplicate processing of the same request

interface IdempotencyRecord {
  id: string
  processedAt: number
  result?: any
  expiresAt: number
}

class IdempotencyStore {
  private store = new Map<string, IdempotencyRecord>()
  private cleanupInterval: number | null = null

  constructor() {
    // Clean up expired records every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup()
      },
      5 * 60 * 1000
    ) as unknown as number
  }

  async checkAndStore(
    key: string,
    ttlMs: number = 24 * 60 * 60 * 1000 // 24 hours default
  ): Promise<{ isDuplicate: boolean; result?: any }> {
    const existing = this.store.get(key)

    if (existing) {
      // Check if expired
      if (Date.now() > existing.expiresAt) {
        this.store.delete(key)
      } else {
        return { isDuplicate: true, result: existing.result }
      }
    }

    // Store new record (without result yet)
    const record: IdempotencyRecord = {
      id: key,
      processedAt: Date.now(),
      expiresAt: Date.now() + ttlMs,
    }

    this.store.set(key, record)
    return { isDuplicate: false }
  }

  storeResult(key: string, result: any) {
    const record = this.store.get(key)
    if (record) {
      record.result = result
    }
  }

  private cleanup() {
    const now = Date.now()
    for (const [key, record] of this.store.entries()) {
      if (now > record.expiresAt) {
        this.store.delete(key)
      }
    }
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.store.clear()
  }
}

// Global idempotency store instance
const idempotencyStore = new IdempotencyStore()

// Generate idempotency key from request
export function generateIdempotencyKey(request: Request): string {
  // Use Stripe's idempotency key if provided
  const stripeKey = request.headers.get('idempotency-key')
  if (stripeKey) {
    return `stripe:${stripeKey}`
  }

  // For webhooks, use event ID
  try {
    const url = new URL(request.url)
    if (url.pathname.includes('webhook')) {
      // We'll set this after parsing the body
      return `webhook:${Date.now()}:${Math.random()}`
    }
  } catch {}

  // Fallback: method + url + body hash (simplified)
  const method = request.method
  const url = request.url
  return `${method}:${url}:${Date.now()}`
}

// Check idempotency for webhook events
export async function checkWebhookIdempotency(
  eventId: string,
  ttlMs: number = 24 * 60 * 60 * 1000
): Promise<{ isDuplicate: boolean; result?: any }> {
  const key = `webhook:${eventId}`
  return await idempotencyStore.checkAndStore(key, ttlMs)
}

// Store successful webhook processing result
export function storeWebhookResult(eventId: string, result: any) {
  const key = `webhook:${eventId}`
  idempotencyStore.storeResult(key, result)
}
