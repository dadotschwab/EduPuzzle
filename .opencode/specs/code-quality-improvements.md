# Specification: Code Quality Improvements

## 0. Original User Request

> please implement the fixes and improvements mentioned and implied by the following report on the codebase: Code Quality Assessment
>
> Type Safety Issues: 13 instances of as any type assertions in API layers, primarily in src/lib/api/words.ts, src/lib/api/puzzles.ts, and src/hooks/useCollaborativeLists.ts. This removes compile-time protection and could cause runtime errors.
> Missing Error Boundaries: No React Error Boundaries implemented anywhere in the application, meaning unhandled component errors can crash the entire app.
> Inconsistent Error Handling: While try/catch blocks exist, error recovery patterns vary across the codebase.
> Security Analysis
> Good Practices: ✅ Strong RLS policies, proper API key management, robust auth flow, Stripe webhook verification
> Areas for Improvement: Webhook handlers lack rate limiting, and some API endpoints could benefit from enhanced input validation.
> Performance Bottlenecks
> Critical: Puzzle generation algorithm has a 10-second timeout that can block the UI (src/lib/algorithms/generator.ts:30). This should be moved to a Web Worker.
> Moderate: Database queries in src/lib/api/srs.ts have potential N+1 issues, and collaborative features may cause excessive React re-renders.
> Race Conditions (Likely Cause of Buggy Behavior)
> Critical Issue: Collaborative list operations in src/hooks/useCollaborativeLists.ts (lines 96-233) have optimistic update conflicts. Multiple rapid add/update/delete operations can corrupt state due to shared query cache without proper conflict resolution.
> Moderate Issues:
>
> - Real-time subscriptions and optimistic updates race in collaborative features
> - Auth state changes during API calls aren't properly guarded
> - Some timer cleanup is missing in components
>   Immediate Recommendations
>
> 1. Fix collaborative race conditions - This is likely causing your buggy interactions
> 2. Add error boundaries to prevent app crashes
> 3. Move puzzle generation to Web Worker to prevent UI blocking
> 4. Fix type safety by regenerating Supabase types
>    The collaborative race conditions in useCollaborativeLists.ts are most likely responsible for the buggy interactions you're experiencing, especially when multiple users edit simultaneously or rapid operations occur

## 1. Goal & Context

Implement comprehensive code quality improvements to address type safety issues, add error boundaries, fix race conditions in collaborative features, improve performance, and enhance security. This is a critical maintenance and stability update that will prevent crashes, improve developer experience, and resolve buggy behavior in collaborative features.

**Key Requirements:**

- Fix 13 instances of `as any` type assertions in API layers
- Implement React Error Boundaries throughout the application
- Resolve race conditions in collaborative list operations
- Move puzzle generation to Web Worker to prevent UI blocking
- Add rate limiting to webhook handlers
- Improve input validation in API endpoints
- Fix N+1 database query issues
- Standardize error handling patterns

**User Flow:**

1. Users experience fewer crashes and errors due to proper error boundaries
2. Collaborative features work reliably without race conditions
3. Puzzle generation doesn't block the UI
4. Developers have better type safety and debugging capabilities
5. Application is more secure with proper input validation and rate limiting

## 2. Requirements

### Functional:

- [ ] Replace all `as any` type assertions with proper TypeScript types
- [ ] Implement React Error Boundary components at strategic levels
- [ ] Fix race conditions in useCollaborativeLists.ts optimistic updates
- [ ] Move puzzle generation algorithm to Web Worker
- [ ] Add rate limiting to Stripe webhook handlers
- [ ] Enhance input validation for API endpoints
- [ ] Resolve N+1 query issues in SRS database operations
- [ ] Standardize error handling patterns across the codebase
- [ ] Add proper cleanup for timers and subscriptions
- [ ] Guard against auth state changes during API calls

### Non-Functional:

- [ ] Maintain 100% type safety (no `any` types)
- [ ] Ensure UI remains responsive during puzzle generation
- [ ] Prevent app crashes from unhandled component errors
- [ ] Eliminate race conditions in collaborative features
- [ ] Improve security with rate limiting and input validation
- [ ] Maintain backward compatibility for existing features
- [ ] Ensure performance improvements don't break existing functionality

## 3. Architecture & Research

### Codebase Impact

**Files to Modify:**

- `src/lib/api/words.ts` (lines 87, 117, 149)
  - Current state: Uses `as any` type assertions for Supabase insert/update operations
  - Required change: Replace with proper Database type imports and remove `as any` casts

- `src/lib/api/puzzles.ts` (lines 141, 179, 199)
  - Current state: Uses `as any` type assertions for Supabase insert/update operations
  - Required change: Replace with proper Database type imports and remove `as any` casts

- `src/hooks/useCollaborativeLists.ts` (lines 96-233)
  - Current state: Optimistic updates with race conditions - multiple rapid operations can corrupt state
  - Required change: Implement proper conflict resolution and sequential operation handling

- `src/hooks/useCollaborativeLists.ts` (lines 116, 176)
  - Current state: Uses `as any` type assertions for Supabase operations
  - Required change: Replace with proper Database type imports and remove `as any` casts

- `src/lib/api/srs.ts` (lines 328, 369)
  - Current state: Uses `as any` type assertions for Supabase insert/update operations
  - Required change: Replace with proper Database type imports and remove `as any` casts

- `src/lib/api/srs.ts` (lines 188-193)
  - Current state: `fetchDueWordsCount` calls `fetchDueWords` which does full data fetch just to count
  - Required change: Implement efficient count query to avoid N+1 pattern

- `src/lib/algorithms/generator.ts` (line 30)
  - Current state: 10-second timeout that blocks UI during puzzle generation
  - Required change: Move generation logic to Web Worker

- `supabase/functions/stripe-webhook/index.ts`
  - Current state: No rate limiting on webhook endpoint
  - Required change: Add rate limiting middleware to prevent abuse

- `src/main.tsx`
  - Current state: No error boundaries at app root level
  - Required change: Wrap app with error boundary component

- `src/pages/PuzzleSolver.tsx`
  - Current state: Complex component with no error boundary protection
  - Required change: Wrap with error boundary

- `src/pages/Dashboard.tsx`
  - Current state: Complex component with no error boundary protection
  - Required change: Wrap with error boundary

- `src/pages/WordListDetail.tsx`
  - Current state: Complex component with no error boundary protection
  - Required change: Wrap with error boundary

**Files to Create:**

- `src/components/common/ErrorBoundary.tsx`
  - Purpose: Generic error boundary component for catching React errors
  - Pattern: Follow existing component patterns with proper TypeScript types

- `src/workers/puzzleGenerator.worker.ts`
  - Purpose: Web Worker for puzzle generation to prevent UI blocking
  - Pattern: Standard Web Worker pattern with message passing

- `src/hooks/usePuzzleGeneratorWorker.ts`
  - Purpose: Hook to manage Web Worker communication for puzzle generation
  - Pattern: Follow existing custom hook patterns (useAuth, useSubscription, etc.)

- `src/lib/middleware/rateLimit.ts`
  - Purpose: Rate limiting utility for Supabase Edge Functions
  - Pattern: Follow existing utility patterns in src/lib/utils/

- `supabase/functions/_middleware/rateLimit.ts`
  - Purpose: Rate limiting middleware for webhook endpoints
  - Pattern: Supabase Edge Function middleware pattern

**Existing Patterns Identified:**

- **Auth flow:** Uses Supabase Auth with custom `useAuth` hook and `ProtectedRoute` component
- **API layer:** Uses `query` and `mutate` wrapper functions from `supabaseClient.ts` for consistent error handling
- **Type safety:** Database types generated by Supabase CLI in `src/types/database.types.ts`
- **Component structure:** Feature-based folders under `src/components/` with shared UI in `src/components/ui/`
- **State management:** Zustand stores and React Query for server state
- **Error handling:** Try/catch blocks exist but error recovery patterns vary across codebase
- **Web Workers:** None currently implemented - new pattern needed
- **Middleware:** No existing middleware pattern in Supabase functions

**Dependencies Status:**

- ✅ `@supabase/supabase-js: ^2.39.0` (installed - for type regeneration)
- ✅ `@stripe/stripe-js: ^3.0.0` (installed - for webhook security)
- ❌ `@supabase/cli` (needs verification - for type regeneration)
- ⚠️ Web Workers support (built-in browser API - no additional dependency needed)
- ⚠️ Rate limiting (needs implementation - consider libraries like `express-rate-limit` equivalent for Edge Runtime)

## 4. Tech Stack Specifications

### Supabase (Backend)

**Schema Design:**

```sql
-- Migration: Add efficient SRS counting function and indexes
-- File: supabase/migrations/20251125000000_optimize_srs_performance.sql

-- Add composite index for due words query (existing, but ensure it exists)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_word_progress_due_words_composite
  ON word_progress(user_id, next_review_date)
  WHERE next_review_date <= CURRENT_DATE;

-- Add partial index for active subscriptions (Stripe integration)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active_subscriptions
  ON users(stripe_customer_id)
  WHERE subscription_status IN ('active', 'trial');

-- Function: Efficient due words count (eliminates N+1 query)
CREATE OR REPLACE FUNCTION public.get_due_words_count(user_id_param UUID)
RETURNS INTEGER AS $
DECLARE
  due_count INTEGER;
  today_date DATE := CURRENT_DATE;
BEGIN
  -- Count words that are due today or overdue
  SELECT COUNT(*) INTO due_count
  FROM words w
  INNER JOIN word_lists wl ON wl.id = w.list_id AND wl.user_id = user_id_param
  LEFT JOIN word_progress wp ON wp.word_id = w.id AND wp.user_id = user_id_param
  WHERE
    -- New words (no progress record)
    wp.id IS NULL
    -- OR words due today/overdue
    OR (wp.next_review_date IS NOT NULL AND wp.next_review_date <= today_date)
    -- Exclude words already reviewed today
    AND (wp.last_reviewed_at IS NULL OR DATE(wp.last_reviewed_at) < today_date);

  RETURN COALESCE(due_count, 0);
END;
$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function: Batch SRS progress calculation (reduces sequential queries)
CREATE OR REPLACE FUNCTION public.calculate_srs_progress(
  word_id_param UUID,
  user_id_param UUID,
  was_correct_param BOOLEAN
)
RETURNS TABLE (
  new_stage INTEGER,
  new_interval_days INTEGER,
  new_ease_factor DECIMAL(3,2),
  new_next_review_date DATE
) AS $
DECLARE
  current_progress RECORD;
  updates RECORD;
BEGIN
  -- Get current progress
  SELECT * INTO current_progress
  FROM word_progress
  WHERE word_id = word_id_param AND user_id = user_id_param;

  -- If no progress exists, create initial
  IF NOT FOUND THEN
    -- Return initial values for new word
    RETURN QUERY SELECT
      CASE WHEN was_correct_param THEN 1 ELSE 0 END as new_stage,
      CASE WHEN was_correct_param THEN 2 ELSE 1 END as new_interval_days,
      2.50::DECIMAL(3,2) as new_ease_factor,
      (CURRENT_DATE + INTERVAL '1 day' * CASE WHEN was_correct_param THEN 2 ELSE 1 END)::DATE as new_next_review_date;
    RETURN;
  END IF;

  -- Calculate SM-2 updates
  updates := current_progress;

  -- Update review counts
  updates.total_reviews := current_progress.total_reviews + 1;
  IF was_correct_param THEN
    updates.correct_reviews := current_progress.correct_reviews + 1;
    updates.current_streak := current_progress.current_streak + 1;
  ELSE
    updates.incorrect_reviews := current_progress.incorrect_reviews + 1;
    updates.current_streak := 0;
  END IF;

  -- Calculate new interval and ease factor
  IF was_correct_param THEN
    -- Correct answer
    IF current_progress.interval_days = 0 THEN
      updates.interval_days := 1;
    ELSIF current_progress.interval_days = 1 THEN
      updates.interval_days := 6;
    ELSE
      updates.interval_days := ROUND(current_progress.interval_days * current_progress.ease_factor)::INTEGER;
    END IF;

    updates.ease_factor := LEAST(2.5, current_progress.ease_factor + 0.1);

    -- Stage progression
    IF current_progress.stage = 0 THEN
      updates.stage := 1; -- New → Learning
    ELSIF current_progress.stage = 1 AND updates.interval_days >= 7 THEN
      updates.stage := 2; -- Learning → Young
    ELSIF current_progress.stage = 2 AND updates.interval_days >= 30 THEN
      updates.stage := 3; -- Young → Mature
    ELSIF current_progress.stage = 4 AND updates.interval_days >= 7 THEN
      updates.stage := 2; -- Relearning → Young
    END IF;
  ELSE
    -- Incorrect answer
    updates.interval_days := 1;
    updates.ease_factor := GREATEST(1.3, current_progress.ease_factor - 0.2);

    -- Demote mature words
    IF current_progress.stage = 3 THEN
      updates.stage := 4; -- Mature → Relearning
    END IF;
  END IF;

  -- Calculate next review date
  updates.next_review_date := CURRENT_DATE + INTERVAL '1 day' * updates.interval_days;

  RETURN QUERY SELECT
    updates.stage,
    updates.interval_days,
    updates.ease_factor,
    updates.next_review_date;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_due_words_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_srs_progress(UUID, UUID, BOOLEAN) TO authenticated;

-- Comments for documentation
COMMENT ON FUNCTION public.get_due_words_count(UUID) IS 'Efficiently counts due words for SRS dashboard without N+1 queries';
COMMENT ON FUNCTION public.calculate_srs_progress(UUID, UUID, BOOLEAN) IS 'Calculates SM-2 algorithm updates for word progress';
```

**RLS Policies:**

Current RLS policies are comprehensive and secure. No changes needed for the performance improvements. The existing policies properly:

- ✅ Isolate user data with `auth.uid()` checks
- ✅ Allow service role access for webhooks
- ✅ Support collaborative list sharing through proper foreign key relationships
- ✅ Prevent unauthorized access to sensitive data

**Database Functions:**

```sql
-- Function: Rate limiting for webhook endpoints
-- File: supabase/functions/_middleware/rateLimit.ts

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();

  constructor(
    private windowMs: number = 60000, // 1 minute
    private maxRequests: number = 10   // 10 requests per minute for webhooks
  ) {}

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const entry = this.limits.get(identifier);

    if (!entry || now > entry.resetTime) {
      // First request or window expired
      this.limits.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return true;
    }

    if (entry.count >= this.maxRequests) {
      return false; // Rate limit exceeded
    }

    entry.count++;
    return true;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }
}

// Global rate limiter instance (persists across requests)
const webhookRateLimiter = new RateLimiter(60000, 10); // 10 req/min

export function checkRateLimit(request: Request): Response | null {
  // Use client IP as identifier (in production, use proper IP extraction)
  const clientIP = request.headers.get('CF-Connecting-IP') ||
                   request.headers.get('X-Forwarded-For') ||
                   request.headers.get('X-Real-IP') ||
                   'unknown';

  // Cleanup old entries periodically
  webhookRateLimiter.cleanup();

  if (!webhookRateLimiter.isAllowed(clientIP)) {
    console.warn(`Rate limit exceeded for IP: ${clientIP}`);
    return new Response(JSON.stringify({
      error: 'Too many requests',
      retryAfter: 60
    }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '60'
      }
    });
  }

  return null; // Allowed
}
```

**Rate Limiting Implementation:**

```typescript
// File: supabase/functions/stripe-webhook/index.ts (updated)

// ... existing imports ...
import { checkRateLimit } from '../_middleware/rateLimit.ts'

Deno.serve(async (request) => {
  // Add rate limiting BEFORE any processing
  const rateLimitResponse = checkRateLimit(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  // ... rest of existing webhook logic ...
})
```

**Migration Strategy:**

1. **Create migration:**

   ```bash
   supabase migration new optimize_srs_performance
   ```

2. **Add SQL to migration file** (all CREATE statements above)

3. **Test locally:**

   ```bash
   supabase db reset  # Test with fresh database
   supabase db push   # Apply to remote
   ```

4. **Verify performance:**
   - Test `get_due_words_count()` returns same results as old method
   - Confirm rate limiting blocks excessive webhook requests
   - Validate SRS calculations match existing logic

**Type Generation:**

After migration, regenerate TypeScript types:

```bash
# Generate updated types
supabase gen types typescript --local > src/types/database.types.ts

# Verify new function types are included
grep -A 10 "get_due_words_count" src/types/database.types.ts
```

**Best Practices from Docs:**

- [Supabase Database Functions](https://supabase.com/docs/guides/database/functions)
  - Key insight: Use `SECURITY DEFINER` for functions that need elevated privileges
  - Applied: Both functions use `SECURITY DEFINER` to access user-scoped data

- [Supabase Performance](https://supabase.com/docs/guides/database/postgres/optimization)
  - Key insight: Use partial indexes for common WHERE clauses
  - Applied: Added partial index for active subscriptions

- [PostgreSQL Rate Limiting](https://supabase.com/docs/guides/database/extensions/pg_cron)
  - Key insight: For webhooks, implement application-level rate limiting
  - Applied: In-memory rate limiter with cleanup prevents abuse

**Security Considerations:**

- ✅ Database functions use `SECURITY DEFINER` appropriately
- ✅ Rate limiting prevents webhook abuse (10 req/min per IP)
- ✅ Functions validate user access through existing RLS policies
- ✅ No direct client access to sensitive operations
- ⚠️ Rate limiter uses IP-based identification (consider user-based for authenticated endpoints)

### Stripe (Payments)

**Webhook Rate Limiting Implementation:**

Rate limiting is critical for webhook endpoints to prevent abuse and ensure system stability. The current webhook handler lacks rate limiting, making it vulnerable to DoS attacks and excessive processing costs.

**Rate Limiting Middleware Pattern:**

```typescript
// File: supabase/functions/_middleware/rateLimit.ts

interface RateLimitEntry {
  count: number
  resetTime: number
  lastRequest: number
}

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  burstLimit?: number // Burst allowance for legitimate retries
  cleanupInterval?: number // Cleanup interval in milliseconds
}

class RateLimiter {
  private limits = new Map<string, RateLimitEntry>()
  private config: Required<RateLimitConfig>

  constructor(config: RateLimitConfig) {
    this.config = {
      burstLimit: Math.ceil(config.maxRequests * 0.2), // 20% burst allowance
      cleanupInterval: 300000, // 5 minutes default cleanup
      ...config,
    }

    // Periodic cleanup to prevent memory leaks
    setInterval(() => this.cleanup(), this.config.cleanupInterval)
  }

  isAllowed(identifier: string): { allowed: boolean; resetTime?: number; retryAfter?: number } {
    const now = Date.now()
    const entry = this.limits.get(identifier)

    if (!entry || now > entry.resetTime) {
      // First request or window expired
      this.limits.set(identifier, {
        count: 1,
        resetTime: now + this.config.windowMs,
        lastRequest: now,
      })
      return { allowed: true }
    }

    // Check burst allowance for rapid retries (Stripe retries failed webhooks)
    const timeSinceLastRequest = now - entry.lastRequest
    const isBurstAllowed =
      entry.count < this.config.maxRequests + this.config.burstLimit && timeSinceLastRequest < 10000 // 10 second burst window

    if (entry.count >= this.config.maxRequests && !isBurstAllowed) {
      return {
        allowed: false,
        resetTime: entry.resetTime,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      }
    }

    entry.count++
    entry.lastRequest = now
    return { allowed: true }
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime + this.config.cleanupInterval) {
        this.limits.delete(key)
      }
    }
  }
}

// Global rate limiter instances for different endpoints
export const webhookRateLimiter = new RateLimiter({
  windowMs: 60000, // 1 minute window
  maxRequests: 50, // 50 requests per minute (handles Stripe retries)
  burstLimit: 20, // Additional burst for webhook retries
})

export const checkoutRateLimiter = new RateLimiter({
  windowMs: 60000, // 1 minute window
  maxRequests: 10, // 10 checkout creations per minute per IP
})

export function checkRateLimit(
  request: Request,
  limiter: RateLimiter,
  identifier?: string
): Response | null {
  // Use provided identifier or extract from request
  const clientIP =
    identifier ||
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For') ||
    request.headers.get('X-Real-IP') ||
    request.headers.get('Forwarded')?.split(',')[0]?.trim() ||
    'unknown'

  const result = limiter.isAllowed(clientIP)

  if (!result.allowed) {
    console.warn(`Rate limit exceeded for ${clientIP}`, {
      resetTime: result.resetTime,
      retryAfter: result.retryAfter,
    })

    return new Response(
      JSON.stringify({
        error: 'Too many requests',
        retryAfter: result.retryAfter,
        resetTime: new Date(result.resetTime!).toISOString(),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': result.retryAfter!.toString(),
          'X-RateLimit-Reset': result.resetTime!.toString(),
        },
      }
    )
  }

  return null // Request allowed
}
```

**Webhook Handler Integration:**

```typescript
// File: supabase/functions/stripe-webhook/index.ts (updated)

// ... existing imports ...
import { checkRateLimit, webhookRateLimiter } from '../_middleware/rateLimit.ts'

Deno.serve(async (request) => {
  // Apply rate limiting BEFORE any processing
  const rateLimitResponse = checkRateLimit(request, webhookRateLimiter)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  // ... rest of existing webhook logic ...
})
```

**Input Validation Patterns for Stripe Webhook Handlers:**

Implement comprehensive input validation using Zod schemas to ensure webhook payloads are properly structured and contain expected data.

```typescript
// File: supabase/functions/_shared/validation.ts

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

// Base Stripe event validation
export const stripeEventSchema = z.object({
  id: z.string().regex(/^evt_/, 'Invalid Stripe event ID format'),
  object: z.literal('event'),
  api_version: z.string(),
  created: z.number().int().positive(),
  data: z.object({
    object: z.any(), // Will be validated by specific event schemas
    previous_attributes: z.any().optional(),
  }),
  livemode: z.boolean(),
  pending_webhooks: z.number().int().min(0),
  request: z
    .object({
      id: z.string().nullable(),
      idempotency_key: z.string().nullable(),
    })
    .optional(),
  type: z.string(),
})

// Specific event type validations
export const checkoutSessionCompletedSchema = stripeEventSchema.extend({
  type: z.literal('checkout.session.completed'),
  data: z.object({
    object: z.object({
      id: z.string().regex(/^cs_/, 'Invalid checkout session ID'),
      object: z.literal('checkout_session'),
      customer: z.string().regex(/^cus_/, 'Invalid customer ID'),
      subscription: z.string().regex(/^sub_/, 'Invalid subscription ID'),
      metadata: z.record(z.string()).optional(),
      payment_status: z.enum(['paid', 'unpaid', 'no_payment_required']),
      status: z.enum(['complete', 'expired', 'open']),
    }),
  }),
})

export const subscriptionUpdatedSchema = stripeEventSchema.extend({
  type: z.literal('customer.subscription.updated'),
  data: z.object({
    object: z.object({
      id: z.string().regex(/^sub_/, 'Invalid subscription ID'),
      object: z.literal('subscription'),
      customer: z.string().regex(/^cus_/, 'Invalid customer ID'),
      status: z.enum([
        'active',
        'canceled',
        'incomplete',
        'incomplete_expired',
        'past_due',
        'trialing',
        'unpaid',
      ]),
      current_period_start: z.number().int().positive(),
      current_period_end: z.number().int().positive(),
      cancel_at_period_end: z.boolean(),
      metadata: z.record(z.string()).optional(),
      items: z.object({
        data: z.array(
          z.object({
            price: z.object({
              id: z.string().regex(/^price_/, 'Invalid price ID'),
              lookup_key: z.string().optional(),
            }),
          })
        ),
      }),
    }),
  }),
})

export const paymentSucceededSchema = stripeEventSchema.extend({
  type: z.literal('invoice.payment_succeeded'),
  data: z.object({
    object: z.object({
      id: z.string().regex(/^in_/, 'Invalid invoice ID'),
      object: z.literal('invoice'),
      customer: z.string().regex(/^cus_/, 'Invalid customer ID'),
      subscription: z.string().regex(/^sub_/, 'Invalid subscription ID').nullable(),
      status: z.enum(['draft', 'open', 'paid', 'void', 'uncollectible']),
      amount_paid: z.number().int().min(0),
      currency: z.string().length(3),
      billing_reason: z
        .enum(['subscription_cycle', 'subscription_create', 'manual', 'upcoming'])
        .optional(),
    }),
  }),
})

// Union type for all supported events
export const supportedStripeEventSchema = z.discriminatedUnion('type', [
  checkoutSessionCompletedSchema,
  subscriptionUpdatedSchema,
  paymentSucceededSchema,
  // Add other supported event schemas...
])

// Validation helper functions
export function validateStripeEvent(rawEvent: unknown) {
  try {
    return supportedStripeEventSchema.parse(rawEvent)
  } catch (error) {
    console.error('Stripe event validation failed:', error)
    throw new Error(`Invalid Stripe event structure: ${error.message}`)
  }
}

export function validateWebhookSignature(
  rawBody: string,
  signature: string,
  webhookSecret: string,
  tolerance: number = 300 // 5 minutes tolerance
): boolean {
  try {
    // Use Stripe's built-in signature verification
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2024-11-20',
    })

    const cryptoProvider = Stripe.createSubtleCryptoProvider()
    stripe.webhooks.constructEvent(rawBody, signature, webhookSecret, undefined, cryptoProvider)

    return true
  } catch (error) {
    console.error('Webhook signature verification failed:', error.message)
    return false
  }
}
```

**Webhook Handler with Enhanced Validation:**

```typescript
// File: supabase/functions/stripe-webhook/index.ts (enhanced)

// ... existing imports ...
import { validateStripeEvent, validateWebhookSignature } from '../_shared/validation.ts'

Deno.serve(async (request) => {
  // Rate limiting first
  const rateLimitResponse = checkRateLimit(request, webhookRateLimiter)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    // Enhanced signature validation with detailed error messages
    const signature = request.headers.get('Stripe-Signature')
    if (!signature) {
      console.error('Missing Stripe-Signature header')
      return new Response(
        JSON.stringify({
          error: 'Missing Stripe signature',
          code: 'MISSING_SIGNATURE',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const rawBody = await request.text()
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured')
      return new Response('Server configuration error', { status: 500 })
    }

    // Validate signature with detailed error handling
    if (!validateWebhookSignature(rawBody, signature, webhookSecret)) {
      return new Response(
        JSON.stringify({
          error: 'Invalid webhook signature',
          code: 'INVALID_SIGNATURE',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Parse and validate event structure
    let parsedBody: any
    try {
      parsedBody = JSON.parse(rawBody)
    } catch (error) {
      console.error('Invalid JSON in webhook body:', error)
      return new Response(
        JSON.stringify({
          error: 'Invalid JSON payload',
          code: 'INVALID_JSON',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Validate event structure using Zod schema
    const validatedEvent = validateStripeEvent(parsedBody)

    console.log(`✅ Validated event: ${validatedEvent.id} - Type: ${validatedEvent.type}`)

    // ... rest of existing processing logic using validatedEvent instead of receivedEvent ...
  } catch (error) {
    console.error('Webhook processing error:', error)

    // Enhanced error response with error codes
    const errorResponse = {
      error: error instanceof Error ? error.message : 'Internal server error',
      code: error instanceof Error && 'code' in error ? error.code : 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
    }

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

**Security Improvements for Webhook Processing:**

**1. Request Sanitization Middleware:**

```typescript
// File: supabase/functions/_middleware/security.ts

export function sanitizeHeaders(request: Request): Request {
  // Remove potentially dangerous headers
  const headers = new Headers(request.headers)

  // Remove headers that could be used for header injection
  const dangerousHeaders = [
    'host',
    'x-forwarded-host',
    'x-forwarded-proto',
    'x-forwarded-port',
    'x-original-url',
    'x-rewrite-url',
  ]

  dangerousHeaders.forEach((header) => headers.delete(header))

  return new Request(request.url, {
    method: request.method,
    headers,
    body: request.body,
    signal: request.signal,
  })
}

export function validateRequestSize(request: Request, maxSizeBytes: number = 1048576): boolean {
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength) > maxSizeBytes) {
    return false
  }
  return true
}

export function detectSuspiciousPatterns(request: Request): string[] {
  const warnings: string[] = []

  // Check for suspicious user agents
  const userAgent = request.headers.get('user-agent') || ''
  if (userAgent.includes('curl') || userAgent.includes('wget')) {
    warnings.push('suspicious_user_agent')
  }

  // Check for rapid successive requests (additional to rate limiting)
  const forwardedFor = request.headers.get('x-forwarded-for') || ''
  if (forwardedFor.split(',').length > 5) {
    warnings.push('multiple_forwarded_ips')
  }

  return warnings
}
```

**2. Enhanced Idempotency with Request Deduplication:**

```typescript
// File: supabase/functions/_shared/idempotency.ts

interface IdempotencyConfig {
  keyGenerator?: (request: Request, event: any) => string
  ttlMs?: number
}

class IdempotencyStore {
  private processedRequests = new Map<string, { timestamp: number; response: any }>()

  constructor(private config: IdempotencyConfig = {}) {
    // Cleanup old entries every 5 minutes
    setInterval(() => this.cleanup(), 300000)
  }

  async checkAndStore(key: string, operation: () => Promise<any>): Promise<any> {
    const now = Date.now()
    const existing = this.processedRequests.get(key)

    if (existing && now - existing.timestamp < (this.config.ttlMs || 300000)) {
      // 5 minutes default
      console.log(`Idempotency hit for key: ${key}`)
      return existing.response
    }

    try {
      const result = await operation()
      this.processedRequests.set(key, { timestamp: now, response: result })
      return result
    } catch (error) {
      // Don't cache errors to allow retries
      throw error
    }
  }

  private cleanup(): void {
    const now = Date.now()
    const ttl = this.config.ttlMs || 300000

    for (const [key, entry] of this.processedRequests.entries()) {
      if (now - entry.timestamp > ttl) {
        this.processedRequests.delete(key)
      }
    }
  }
}

export const idempotencyStore = new IdempotencyStore()

export function generateEventIdempotencyKey(event: any): string {
  // Use event ID and type for idempotency key
  return `${event.type}:${event.id}`
}
```

**3. Comprehensive Security Headers:**

```typescript
// File: supabase/functions/_shared/securityHeaders.ts

export function getSecurityHeaders(): Record<string, string> {
  return {
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    // Enable XSS protection
    'X-XSS-Protection': '1; mode=block',
    // Strict transport security (for HTTPS endpoints)
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    // Content Security Policy
    'Content-Security-Policy': "default-src 'self'; script-src 'none'; object-src 'none'",
    // Prevent caching of sensitive responses
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  }
}
```

**Error Handling and Retry Mechanisms:**

**1. Exponential Backoff for Database Operations:**

```typescript
// File: supabase/functions/_shared/retry.ts

interface RetryConfig {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
  backoffFactor: number
  retryableErrors: string[]
}

export class RetryHandler {
  constructor(private config: RetryConfig) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error

        if (attempt === this.config.maxAttempts || !this.isRetryable(error)) {
          throw error
        }

        const delay = Math.min(
          this.config.baseDelay * Math.pow(this.config.backoffFactor, attempt - 1),
          this.config.maxDelay
        )

        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms:`, error.message)
        await this.sleep(delay)
      }
    }

    throw lastError!
  }

  private isRetryable(error: any): boolean {
    if (!error) return false

    const errorMessage = error.message || String(error)
    return this.config.retryableErrors.some((pattern) =>
      errorMessage.toLowerCase().includes(pattern.toLowerCase())
    )
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// Pre-configured retry handlers for different operations
export const databaseRetryHandler = new RetryHandler({
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds max
  backoffFactor: 2,
  retryableErrors: ['connection', 'timeout', 'temporary', 'rate limit'],
})

export const stripeRetryHandler = new RetryHandler({
  maxAttempts: 2,
  baseDelay: 2000, // 2 seconds
  maxDelay: 5000, // 5 seconds max
  backoffFactor: 1.5,
  retryableErrors: ['network', 'timeout', 'api_error'],
})
```

**2. Circuit Breaker Pattern for External Services:**

```typescript
// File: supabase/functions/_shared/circuitBreaker.ts

interface CircuitBreakerConfig {
  failureThreshold: number
  recoveryTimeout: number
  monitoringPeriod: number
}

enum CircuitState {
  CLOSED = 'closed', // Normal operation
  OPEN = 'open', // Failing, reject requests
  HALF_OPEN = 'half_open', // Testing recovery
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED
  private failures = 0
  private lastFailureTime = 0
  private successCount = 0

  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.config.recoveryTimeout) {
        this.state = CircuitState.HALF_OPEN
        this.successCount = 0
      } else {
        throw new Error('Circuit breaker is OPEN')
      }
    }

    try {
      const result = await operation()

      if (this.state === CircuitState.HALF_OPEN) {
        this.successCount++
        if (this.successCount >= 2) {
          // Require 2 successes to close
          this.state = CircuitState.CLOSED
          this.failures = 0
        }
      }

      return result
    } catch (error) {
      this.recordFailure()
      throw error
    }
  }

  private recordFailure(): void {
    this.failures++
    this.lastFailureTime = Date.now()

    if (this.failures >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN
      console.warn(`Circuit breaker opened after ${this.failures} failures`)
    }
  }

  getState(): CircuitState {
    return this.state
  }
}

// Circuit breakers for different services
export const stripeCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  recoveryTimeout: 60000, // 1 minute
  monitoringPeriod: 300000, // 5 minutes
})

export const databaseCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  recoveryTimeout: 30000, // 30 seconds
  monitoringPeriod: 300000, // 5 minutes
})
```

**3. Enhanced Error Handling with Structured Logging:**

```typescript
// File: supabase/functions/_shared/errorHandling.ts

export interface ErrorContext {
  operation: string
  userId?: string
  eventId?: string
  customerId?: string
  attempt?: number
  timestamp: string
}

export class WebhookError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number,
    public context: ErrorContext,
    public retryable: boolean = false
  ) {
    super(message)
    this.name = 'WebhookError'
  }
}

export function createErrorHandler(operation: string) {
  return {
    handle: (error: any, context: Partial<ErrorContext> = {}): never => {
      const fullContext: ErrorContext = {
        operation,
        timestamp: new Date().toISOString(),
        ...context,
      }

      console.error(`[${operation}] Error:`, {
        message: error.message,
        code: error.code,
        stack: error.stack,
        context: fullContext,
      })

      if (error instanceof WebhookError) {
        throw error
      }

      // Classify error types
      const isRetryable = isRetryableError(error)
      const statusCode = getStatusCode(error)

      throw new WebhookError(
        error.message || 'Unknown error',
        error.code || 'UNKNOWN_ERROR',
        statusCode,
        fullContext,
        isRetryable
      )
    },
  }
}

function isRetryableError(error: any): boolean {
  if (!error) return false

  const retryablePatterns = [
    'network',
    'timeout',
    'connection',
    'temporary',
    'rate limit',
    'service unavailable',
    'internal server error',
  ]

  const errorMessage = (error.message || String(error)).toLowerCase()
  return retryablePatterns.some((pattern) => errorMessage.includes(pattern))
}

function getStatusCode(error: any): number {
  if (error.statusCode) return error.statusCode
  if (error.status) return error.status

  // Map error types to status codes
  if (error.message?.includes('signature')) return 400
  if (error.message?.includes('validation')) return 400
  if (error.message?.includes('unauthorized')) return 401
  if (error.message?.includes('not found')) return 404
  if (error.message?.includes('rate limit')) return 429

  return 500
}
```

**Integration with Supabase Rate Limiting Middleware:**

**1. Unified Middleware Stack:**

```typescript
// File: supabase/functions/_middleware/index.ts

import { checkRateLimit, webhookRateLimiter } from './rateLimit.ts'
import { sanitizeHeaders, validateRequestSize, detectSuspiciousPatterns } from './security.ts'
import { getSecurityHeaders } from '../_shared/securityHeaders.ts'

export async function applyMiddleware(
  request: Request,
  options: {
    rateLimiter?: any
    maxBodySize?: number
    requireAuth?: boolean
  } = {}
): Promise<{ request: Request; response?: Response }> {
  // 1. Security sanitization
  const sanitizedRequest = sanitizeHeaders(request)

  // 2. Request size validation
  if (!validateRequestSize(sanitizedRequest, options.maxBodySize || 1048576)) {
    return {
      request: sanitizedRequest,
      response: new Response(
        JSON.stringify({
          error: 'Request too large',
          code: 'REQUEST_TOO_LARGE',
        }),
        {
          status: 413,
          headers: { 'Content-Type': 'application/json', ...getSecurityHeaders() },
        }
      ),
    }
  }

  // 3. Suspicious pattern detection
  const warnings = detectSuspiciousPatterns(sanitizedRequest)
  if (warnings.length > 0) {
    console.warn('Suspicious patterns detected:', warnings, {
      ip: sanitizedRequest.headers.get('CF-Connecting-IP'),
      userAgent: sanitizedRequest.headers.get('user-agent'),
    })
  }

  // 4. Rate limiting
  if (options.rateLimiter) {
    const rateLimitResponse = checkRateLimit(sanitizedRequest, options.rateLimiter)
    if (rateLimitResponse) {
      return {
        request: sanitizedRequest,
        response: new Response(rateLimitResponse.body, {
          status: rateLimitResponse.status,
          headers: { ...rateLimitResponse.headers, ...getSecurityHeaders() },
        }),
      }
    }
  }

  return { request: sanitizedRequest }
}
```

**2. Webhook Handler with Full Middleware Integration:**

```typescript
// File: supabase/functions/stripe-webhook/index.ts (final)

// ... existing imports ...
import { applyMiddleware } from '../_middleware/index.ts'
import { validateStripeEvent, validateWebhookSignature } from '../_shared/validation.ts'
import { idempotencyStore, generateEventIdempotencyKey } from '../_shared/idempotency.ts'
import { databaseRetryHandler, stripeRetryHandler } from '../_shared/retry.ts'
import { stripeCircuitBreaker, databaseCircuitBreaker } from '../_shared/circuitBreaker.ts'
import { createErrorHandler } from '../_shared/errorHandling.ts'

const errorHandler = createErrorHandler('stripe-webhook')

Deno.serve(async (request) => {
  try {
    // Apply comprehensive middleware stack
    const middlewareResult = await applyMiddleware(request, {
      rateLimiter: webhookRateLimiter,
      maxBodySize: 1048576, // 1MB limit for webhooks
    })

    if (middlewareResult.response) {
      return middlewareResult.response
    }

    const sanitizedRequest = middlewareResult.request

    // Enhanced webhook processing with all security layers
    const signature = sanitizedRequest.headers.get('Stripe-Signature')
    if (!signature) {
      throw new WebhookError('Missing Stripe signature', 'MISSING_SIGNATURE', 400, {
        operation: 'webhook-validation',
        timestamp: new Date().toISOString(),
      })
    }

    const rawBody = await sanitizedRequest.text()
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    if (!webhookSecret) {
      throw new WebhookError('Webhook secret not configured', 'CONFIG_ERROR', 500, {
        operation: 'webhook-validation',
        timestamp: new Date().toISOString(),
      })
    }

    // Validate signature
    if (!validateWebhookSignature(rawBody, signature, webhookSecret)) {
      throw new WebhookError('Invalid webhook signature', 'INVALID_SIGNATURE', 400, {
        operation: 'webhook-validation',
        timestamp: new Date().toISOString(),
      })
    }

    // Parse and validate event
    const parsedEvent = JSON.parse(rawBody)
    const validatedEvent = validateStripeEvent(parsedEvent)

    // Idempotency check with circuit breaker protection
    const idempotencyKey = generateEventIdempotencyKey(validatedEvent)

    const result = await idempotencyStore.checkAndStore(idempotencyKey, async () => {
      return await databaseCircuitBreaker.execute(async () => {
        return await databaseRetryHandler.execute(async () => {
          // Check existing event in database
          const supabaseClient = createClient(/* ... */)
          const { data: existingEvent } = await supabaseClient
            .from('stripe_webhook_events')
            .select('id')
            .eq('event_id', validatedEvent.id)
            .single()

          if (existingEvent) {
            console.log(`Event ${validatedEvent.id} already processed`)
            return { processed: false, skipped: true }
          }

          // Process event with Stripe circuit breaker
          const processingResult = await stripeCircuitBreaker.execute(async () => {
            return await processStripeEvent(validatedEvent, supabaseClient)
          })

          // Log successful processing
          await supabaseClient.from('stripe_webhook_events').insert({
            event_id: validatedEvent.id,
            event_type: validatedEvent.type,
            customer_id: validatedEvent.data.object.customer,
            subscription_id: validatedEvent.data.object.subscription,
            user_id: processingResult?.userId,
          })

          return { processed: true, result: processingResult }
        })
      })
    })

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return errorHandler.handle(error, {
      operation: 'webhook-processing',
    })
  }
})
```

**Best Practices Applied:**

- ✅ **Rate Limiting**: 50 requests/minute with burst allowance for Stripe retries
- ✅ **Input Validation**: Comprehensive Zod schemas for all webhook event types
- ✅ **Security**: Signature verification, header sanitization, suspicious pattern detection
- ✅ **Idempotency**: Event-based deduplication with TTL-based cleanup
- ✅ **Error Handling**: Structured errors with retry logic and circuit breakers
- ✅ **Circuit Breakers**: Prevent cascade failures when Stripe/Database services are down
- ✅ **Retry Logic**: Exponential backoff for transient failures
- ✅ **Security Headers**: Comprehensive headers to prevent various attacks
- ✅ **Request Size Limits**: Prevent oversized payload attacks
- ✅ **Comprehensive Logging**: Structured logging for debugging and monitoring

**Testing Strategy:**

```typescript
// File: supabase/functions/_test/webhookSecurity.test.ts

// Test rate limiting
// Test input validation with malformed events
// Test signature verification with invalid signatures
// Test idempotency with duplicate events
// Test circuit breaker behavior under failure conditions
// Test error handling and retry mechanisms
```

**Monitoring and Alerting:**

- Rate limit violations logged with client IP
- Circuit breaker state changes alerted
- Failed webhook processing with retry counts
- Signature validation failures flagged as security events

This comprehensive security and reliability layer ensures the Stripe integration can handle production traffic safely while maintaining data integrity and preventing abuse.

### React + Shadcn/UI (Frontend)

**Error Boundary Implementation Patterns:**

**1. Base Error Boundary Component:**

Location: `src/components/common/ErrorBoundary.tsx`

```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })

    // Log to error monitoring service (Sentry, LogRocket, etc.)
    console.error('Error Boundary caught an error:', error, errorInfo)

    // Call optional error handler
    this.props.onError?.(error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 text-destructive">
                <AlertTriangle className="h-full w-full" />
              </div>
              <CardTitle>Something went wrong</CardTitle>
              <CardDescription>
                An unexpected error occurred. You can try refreshing the page or contact support if the problem persists.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-sm text-muted-foreground">
                  <summary className="cursor-pointer font-medium">Error Details (Development)</summary>
                  <pre className="mt-2 whitespace-pre-wrap text-xs bg-muted p-2 rounded">
                    {this.state.error.message}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
              <div className="flex gap-2">
                <Button onClick={this.handleReset} className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="flex-1"
                >
                  Refresh Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
```

**2. Hook-based Error Boundary (for imperative error handling):**

Location: `src/hooks/useErrorBoundary.ts`

```typescript
import { useCallback, useState } from 'react'

interface ErrorBoundaryState {
  error: Error | null
  hasError: boolean
}

export function useErrorBoundary() {
  const [state, setState] = useState<ErrorBoundaryState>({
    error: null,
    hasError: false,
  })

  const resetError = useCallback(() => {
    setState({ error: null, hasError: false })
  }, [])

  const captureError = useCallback((error: Error) => {
    setState({ error, hasError: true })
  }, [])

  return {
    error: state.error,
    hasError: state.hasError,
    resetError,
    captureError,
  }
}
```

**3. Error Boundary Integration in App:**

Update `src/main.tsx`:

```typescript
// ... existing imports ...
import { ErrorBoundary } from '@/components/common/ErrorBoundary'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary onError={(error, info) => {
      // Send to error monitoring service
      console.error('App-level error:', error, info)
    }}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
```

**4. Feature-level Error Boundaries:**

Wrap complex components like `PuzzleSolver` and `Dashboard`:

```typescript
// In src/pages/PuzzleSolver.tsx
import { ErrorBoundary } from '@/components/common/ErrorBoundary'

export default function PuzzleSolver() {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Puzzle Loading Error</h2>
          <p className="text-muted-foreground mb-4">
            We encountered an issue loading your puzzle. Please try again.
          </p>
          <Button onClick={() => window.location.reload()}>
            Reload Puzzle
          </Button>
        </div>
      }
    >
      {/* Existing PuzzleSolver content */}
    </ErrorBoundary>
  )
}
```

---

**Web Worker Integration for Puzzle Generation:**

**1. Puzzle Generation Worker:**

Location: `src/workers/puzzleGenerator.worker.ts`

```typescript
import { generatePuzzle } from '@/lib/algorithms/generator'
import type { PuzzleConfig, PuzzleResult } from '@/lib/algorithms/types'

interface WorkerMessage {
  id: string
  type: 'generate' | 'cancel'
  payload: any
}

interface ProgressUpdate {
  stage: string
  percent: number
  message?: string
}

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const { id, type, payload } = e.data

  if (type === 'generate') {
    const { words, config }: { words: string[]; config: PuzzleConfig } = payload

    try {
      // Report initial progress
      self.postMessage({
        id,
        type: 'progress',
        payload: { stage: 'initializing', percent: 0 } as ProgressUpdate,
      })

      // Generate puzzle with progress callback
      const result = await generatePuzzle(words, config, (progress: ProgressUpdate) => {
        self.postMessage({
          id,
          type: 'progress',
          payload: progress,
        })
      })

      // Send completion result
      self.postMessage({
        id,
        type: 'complete',
        payload: result as PuzzleResult,
      })
    } catch (error) {
      // Send error back to main thread
      self.postMessage({
        id,
        type: 'error',
        payload: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        },
      })
    }
  }

  if (type === 'cancel') {
    // Cancel ongoing generation (if supported by generator)
    // This would require the generator to support cancellation tokens
    self.postMessage({
      id,
      type: 'cancelled',
    })
  }
}

// Signal worker is ready
self.postMessage({ type: 'ready' })
```

**2. Web Worker Hook:**

Location: `src/hooks/usePuzzleGeneratorWorker.ts`

```typescript
import { useCallback, useEffect, useRef, useState } from 'react'
import type { PuzzleConfig, PuzzleResult } from '@/lib/algorithms/types'

interface WorkerMessage {
  id: string
  type: 'ready' | 'progress' | 'complete' | 'error' | 'cancelled'
  payload: any
}

interface GenerationProgress {
  stage: string
  percent: number
  message?: string
}

interface UsePuzzleWorkerReturn {
  generatePuzzle: (words: string[], config: PuzzleConfig) => Promise<PuzzleResult>
  cancelGeneration: () => void
  isGenerating: boolean
  progress: GenerationProgress | null
  error: string | null
  isWorkerReady: boolean
}

export function usePuzzleGeneratorWorker(): UsePuzzleWorkerReturn {
  const [isWorkerReady, setIsWorkerReady] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState<GenerationProgress | null>(null)
  const [error, setError] = useState<string | null>(null)

  const workerRef = useRef<Worker | null>(null)
  const currentGenerationId = useRef<string | null>(null)

  useEffect(() => {
    // Create worker
    const worker = new Worker(new URL('../workers/puzzleGenerator.worker.ts', import.meta.url), {
      type: 'module',
    })

    workerRef.current = worker

    // Handle messages from worker
    const handleMessage = (e: MessageEvent<WorkerMessage>) => {
      const { id, type, payload } = e.data

      // Only process messages for current generation
      if (id && id !== currentGenerationId.current) return

      switch (type) {
        case 'ready':
          setIsWorkerReady(true)
          break

        case 'progress':
          setProgress(payload)
          break

        case 'complete':
          setIsGenerating(false)
          setProgress(null)
          setError(null)
          currentGenerationId.current = null
          break

        case 'error':
          setIsGenerating(false)
          setProgress(null)
          setError(payload.message)
          currentGenerationId.current = null
          break

        case 'cancelled':
          setIsGenerating(false)
          setProgress(null)
          setError(null)
          currentGenerationId.current = null
          break
      }
    }

    // Handle worker errors
    const handleError = (e: ErrorEvent) => {
      console.error('Puzzle worker error:', e)
      setError('Worker failed to process puzzle generation')
      setIsGenerating(false)
      setProgress(null)
      currentGenerationId.current = null
    }

    worker.addEventListener('message', handleMessage)
    worker.addEventListener('error', handleError)

    // Cleanup
    return () => {
      worker.removeEventListener('message', handleMessage)
      worker.removeEventListener('error', handleError)
      worker.terminate()
      workerRef.current = null
    }
  }, [])

  const generatePuzzle = useCallback(
    async (words: string[], config: PuzzleConfig): Promise<PuzzleResult> => {
      if (!workerRef.current || !isWorkerReady) {
        throw new Error('Puzzle worker not ready')
      }

      if (isGenerating) {
        throw new Error('Puzzle generation already in progress')
      }

      return new Promise((resolve, reject) => {
        const generationId = crypto.randomUUID()
        currentGenerationId.current = generationId

        setIsGenerating(true)
        setError(null)
        setProgress({ stage: 'starting', percent: 0 })

        // Set up one-time message handler for this generation
        const handleResult = (e: MessageEvent<WorkerMessage>) => {
          const { id, type, payload } = e.data

          if (id !== generationId) return

          if (type === 'complete') {
            workerRef.current?.removeEventListener('message', handleResult)
            resolve(payload)
          } else if (type === 'error') {
            workerRef.current?.removeEventListener('message', handleResult)
            reject(new Error(payload.message))
          }
        }

        workerRef.current.addEventListener('message', handleResult)

        // Send generation request
        workerRef.current.postMessage({
          id: generationId,
          type: 'generate',
          payload: { words, config },
        })
      })
    },
    [isWorkerReady, isGenerating]
  )

  const cancelGeneration = useCallback(() => {
    if (workerRef.current && currentGenerationId.current) {
      workerRef.current.postMessage({
        id: currentGenerationId.current,
        type: 'cancel',
      })
    }
  }, [])

  return {
    generatePuzzle,
    cancelGeneration,
    isGenerating,
    progress,
    error,
    isWorkerReady,
  }
}
```

**3. Integration in Puzzle Generation Hook:**

Update `src/hooks/usePuzzleGeneration.ts`:

```typescript
import { usePuzzleGeneratorWorker } from './usePuzzleGeneratorWorker'
// ... existing imports ...

export function usePuzzleGeneration() {
  const worker = usePuzzleGeneratorWorker()
  // ... existing state ...

  const generatePuzzle = useCallback(
    async (words: string[]) => {
      if (!words.length) throw new Error('No words provided')

      try {
        setIsGenerating(true)
        setError(null)

        // Use worker for generation instead of blocking main thread
        const result = await worker.generatePuzzle(words, {
          maxGridSize: 16,
          minGridSize: 10,
          timeoutMs: 10000,
          minCrossingsPerWord: 1,
          maxAttemptsPerWord: 100,
        })

        setPuzzle(result)
        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Generation failed')
        setError(error.message)
        throw error
      } finally {
        setIsGenerating(false)
      }
    },
    [worker]
  )

  return {
    generatePuzzle,
    puzzle: puzzle,
    isGenerating: worker.isGenerating,
    progress: worker.progress,
    error: worker.error || error,
    cancelGeneration: worker.cancelGeneration,
  }
}
```

---

**State Management Fixes for Collaborative Race Conditions:**

**1. Sequential Operation Queue:**

Location: `src/hooks/useSequentialOperations.ts`

```typescript
import { useCallback, useRef } from 'react'

interface QueuedOperation<T = any> {
  id: string
  operation: () => Promise<T>
  resolve: (value: T) => void
  reject: (error: any) => void
}

export function useSequentialOperations() {
  const queueRef = useRef<QueuedOperation[]>([])
  const processingRef = useRef(false)

  const addToQueue = useCallback(<T>(operation: () => Promise<T>, id?: string): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      const operationId = id || crypto.randomUUID()

      queueRef.current.push({
        id: operationId,
        operation,
        resolve,
        reject,
      })

      processQueue()
    })
  }, [])

  const processQueue = useCallback(async () => {
    if (processingRef.current || queueRef.current.length === 0) return

    processingRef.current = true

    while (queueRef.current.length > 0) {
      const { operation, resolve, reject } = queueRef.current.shift()!

      try {
        const result = await operation()
        resolve(result)
      } catch (error) {
        reject(error)
      }
    }

    processingRef.current = false
  }, [])

  const clearQueue = useCallback(() => {
    // Reject all pending operations
    queueRef.current.forEach(({ reject }) => {
      reject(new Error('Operation cancelled'))
    })
    queueRef.current = []
  }, [])

  return { addToQueue, clearQueue }
}
```

**2. Conflict Resolution Hook:**

Location: `src/hooks/useConflictResolution.ts`

```typescript
import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'

interface ConflictResolutionOptions {
  onConflict?: (local: any, remote: any) => 'local' | 'remote' | 'merge'
  maxRetries?: number
  retryDelay?: number
}

export function useConflictResolution(options: ConflictResolutionOptions = {}) {
  const queryClient = useQueryClient()
  const { onConflict, maxRetries = 3, retryDelay = 1000 } = options

  const resolveConflict = useCallback(
    async <T>(
      operation: () => Promise<T>,
      queryKey: string[],
      optimisticUpdate: (old: any) => any,
      rollbackUpdate: (old: any) => any
    ): Promise<T> => {
      // Store original data for rollback
      const originalData = queryClient.getQueryData(queryKey)

      // Apply optimistic update
      queryClient.setQueryData(queryKey, optimisticUpdate)

      let lastError: Error | null = null

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const result = await operation()

          // Success - invalidate to get fresh data
          queryClient.invalidateQueries({ queryKey })

          return result
        } catch (error) {
          lastError = error as Error

          // Check if it's a conflict error (version mismatch, etc.)
          if (isConflictError(error) && attempt < maxRetries) {
            // Get latest remote data
            await queryClient.invalidateQueries({ queryKey, refetchType: 'none' })
            const latestData = queryClient.getQueryData(queryKey)

            // Determine resolution strategy
            const resolution = onConflict?.(optimisticUpdate(originalData), latestData) || 'remote'

            if (resolution === 'local') {
              // Retry with local changes
              continue
            } else if (resolution === 'remote') {
              // Accept remote changes
              queryClient.setQueryData(queryKey, latestData)
              throw new Error('Conflict resolved by accepting remote changes')
            } else if (resolution === 'merge') {
              // Merge changes (application-specific logic needed)
              const merged = mergeChanges(optimisticUpdate(originalData), latestData)
              queryClient.setQueryData(queryKey, merged)
              continue
            }
          }

          // Non-conflict error or max retries reached - rollback
          queryClient.setQueryData(queryKey, rollbackUpdate)
          break
        }
      }

      throw lastError || new Error('Operation failed after retries')
    },
    [queryClient, onConflict, maxRetries, retryDelay]
  )

  return { resolveConflict }
}

function isConflictError(error: any): boolean {
  // Check for Supabase conflict errors, version mismatches, etc.
  return (
    error?.code === '23505' || // Unique constraint violation
    error?.message?.includes('version') ||
    error?.message?.includes('conflict')
  )
}

function mergeChanges(local: any, remote: any): any {
  // Basic merge strategy - override with more complex logic as needed
  if (Array.isArray(local) && Array.isArray(remote)) {
    // Merge arrays by ID
    const merged = [...remote]
    local.forEach((item) => {
      const existingIndex = merged.findIndex((r) => r.id === item.id)
      if (existingIndex >= 0) {
        merged[existingIndex] = { ...merged[existingIndex], ...item }
      } else {
        merged.push(item)
      }
    })
    return merged
  }

  // Object merge
  return { ...remote, ...local }
}
```

**3. Fixed Collaborative Lists Hook:**

Update `src/hooks/useCollaborativeLists.ts`:

```typescript
import { useSequentialOperations } from './useSequentialOperations'
import { useConflictResolution } from './useConflictResolution'
// ... existing imports ...

export function useCollaborativeLists(listId?: string) {
  const { addToQueue } = useSequentialOperations()
  const { resolveConflict } = useConflictResolution({
    onConflict: (local, remote) => {
      // Simple strategy: prefer local changes for user-initiated actions
      return 'local'
    },
  })

  // ... existing state and effects ...

  const addWord = useCallback(
    async (wordData: Omit<Word, 'id'>) => {
      if (!user || !listId) throw new Error('User not authenticated or list not specified')

      return addToQueue(async () => {
        const tempId = `temp-${Date.now()}-${Math.random()}`

        return resolveConflict(
          // Actual operation
          async () => {
            const { data, error } = await supabase
              .from('words')
              .insert({
                list_id: listId,
                term: wordData.term,
                translation: wordData.translation,
                definition: wordData.definition ?? null,
                example_sentence: wordData.exampleSentence ?? null,
              })
              .select()
              .single()

            if (error) throw error
            return data
          },
          // Query key
          ['words', listId],
          // Optimistic update
          (old: Word[] | undefined) => {
            const optimisticWord: Word = {
              ...wordData,
              id: tempId,
              listId,
              createdAt: new Date().toISOString(),
            }
            return old ? [...old, optimisticWord] : [optimisticWord]
          },
          // Rollback update
          (old: Word[] | undefined) => {
            return old?.filter((word) => word.id !== tempId) || []
          }
        )
      })
    },
    [user, listId, addToQueue, resolveConflict]
  )

  const updateWord = useCallback(
    async (wordId: string, updates: Partial<Word>) => {
      if (!user || !listId) throw new Error('User not authenticated or list not specified')

      return addToQueue(async () => {
        // Store original for rollback
        let originalWord: Word | undefined

        return resolveConflict(
          // Actual operation
          async () => {
            const { error } = await supabase
              .from('words')
              .update({
                term: updates.term,
                translation: updates.translation,
                definition: updates.definition ?? null,
                example_sentence: updates.exampleSentence ?? null,
              })
              .eq('id', wordId)

            if (error) throw error
          },
          // Query key
          ['words', listId],
          // Optimistic update
          (old: Word[] | undefined) => {
            return (
              old?.map((word) => {
                if (word.id === wordId) {
                  originalWord = { ...word }
                  return { ...word, ...updates }
                }
                return word
              }) || []
            )
          },
          // Rollback update
          (old: Word[] | undefined) => {
            return old?.map((word) => (word.id === wordId ? originalWord || word : word)) || []
          }
        )
      })
    },
    [user, listId, addToQueue, resolveConflict]
  )

  const deleteWord = useCallback(
    async (wordId: string) => {
      if (!user || !listId) throw new Error('User not authenticated or list not specified')

      return addToQueue(async () => {
        // Store deleted word for rollback
        let deletedWord: Word | undefined

        return resolveConflict(
          // Actual operation
          async () => {
            const { error } = await supabase.from('words').delete().eq('id', wordId)

            if (error) throw error
          },
          // Query key
          ['words', listId],
          // Optimistic update
          (old: Word[] | undefined) => {
            return (
              old?.filter((word) => {
                if (word.id === wordId) {
                  deletedWord = { ...word }
                  return false
                }
                return true
              }) || []
            )
          },
          // Rollback update
          (old: Word[] | undefined) => {
            if (deletedWord) {
              return old ? [...old, deletedWord] : [deletedWord]
            }
            return old || []
          }
        )
      })
    },
    [user, listId, addToQueue, resolveConflict]
  )

  // ... rest of existing hook ...
}
```

---

**Performance Optimizations for React Re-renders:**

**1. Memoized Collaborative Components:**

Update `src/components/words/CollaborativeWordList.tsx`:

```typescript
import React, { memo, useCallback, useMemo } from 'react'
import { useCollaborativeLists } from '@/hooks/useCollaborativeLists'
// ... existing imports ...

const WordItem = memo(({ word, onUpdate, onDelete }: WordItemProps) => {
  const handleUpdate = useCallback((field: string, value: string) => {
    onUpdate(word.id, { [field]: value })
  }, [word.id, onUpdate])

  const handleDelete = useCallback(() => {
    onDelete(word.id)
  }, [word.id, onDelete])

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <Input
            value={word.term}
            onChange={(e) => handleUpdate('term', e.target.value)}
            placeholder="Term"
            className="font-medium"
          />
          <Input
            value={word.translation}
            onChange={(e) => handleUpdate('translation', e.target.value)}
            placeholder="Translation"
          />
          <Textarea
            value={word.definition || ''}
            onChange={(e) => handleUpdate('definition', e.target.value)}
            placeholder="Definition (optional)"
            rows={2}
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          className="ml-2 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
})

WordItem.displayName = 'WordItem'

const CollaborativeWordList = memo(() => {
  const { words, addWord, updateWord, deleteWord, isOnline, collaborators } = useCollaborativeLists()

  const handleAddWord = useCallback(async () => {
    await addWord({
      term: '',
      translation: '',
      definition: '',
      exampleSentence: '',
    })
  }, [addWord])

  const handleUpdateWord = useCallback(async (wordId: string, updates: Partial<Word>) => {
    await updateWord(wordId, updates)
  }, [updateWord])

  const handleDeleteWord = useCallback(async (wordId: string) => {
    await deleteWord(wordId)
  }, [deleteWord])

  // Memoize collaborator count to prevent re-renders
  const collaboratorCount = useMemo(() => collaborators.length, [collaborators.length])

  // Memoize words list to prevent unnecessary re-renders
  const wordItems = useMemo(() =>
    words.map(word => (
      <WordItem
        key={word.id}
        word={word}
        onUpdate={handleUpdateWord}
        onDelete={handleDeleteWord}
      />
    )),
    [words, handleUpdateWord, handleDeleteWord]
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">Collaborative List</h2>
          {isOnline && collaboratorCount > 0 && (
            <Badge variant="secondary">
              {collaboratorCount} collaborator{collaboratorCount !== 1 ? 's' : ''} online
            </Badge>
          )}
        </div>
        <Button onClick={handleAddWord}>
          <Plus className="mr-2 h-4 w-4" />
          Add Word
        </Button>
      </div>

      <div className="space-y-2">
        {wordItems}
      </div>
    </div>
  )
})

CollaborativeWordList.displayName = 'CollaborativeWordList'

export default CollaborativeWordList
```

**2. Debounced Input Hook:**

Location: `src/hooks/useDebounce.ts`

```typescript
import { useEffect, useState } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
```

**3. Optimized Word Input Component:**

Location: `src/components/words/DebouncedWordInput.tsx`

```typescript
import React, { memo, useCallback, useState } from 'react'
import { Input } from '@/components/ui/input'
import { useDebounce } from '@/hooks/useDebounce'

interface DebouncedWordInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  debounceMs?: number
  className?: string
}

const DebouncedWordInput = memo<DebouncedWordInputProps>(({
  value,
  onChange,
  placeholder,
  debounceMs = 500,
  className
}) => {
  const [localValue, setLocalValue] = useState(value)
  const debouncedValue = useDebounce(localValue, debounceMs)

  // Update local value when prop value changes (external updates)
  React.useEffect(() => {
    setLocalValue(value)
  }, [value])

  // Call onChange when debounced value changes
  React.useEffect(() => {
    if (debouncedValue !== value) {
      onChange(debouncedValue)
    }
  }, [debouncedValue, onChange, value])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value)
  }, [])

  return (
    <Input
      value={localValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
    />
  )
})

DebouncedWordInput.displayName = 'DebouncedWordInput'

export default DebouncedWordInput
```

---

**Timer Cleanup and Subscription Management Patterns:**

**1. Timer Management Hook:**

Location: `src/hooks/useTimer.ts`

```typescript
import { useCallback, useEffect, useRef } from 'react'

export function useTimer() {
  const timersRef = useRef<Set<number>>(new Set())
  const intervalsRef = useRef<Set<number>>(new Set())

  const setTimeout = useCallback((callback: () => void, delay: number) => {
    const id = window.setTimeout(() => {
      timersRef.current.delete(id)
      callback()
    }, delay)

    timersRef.current.add(id)
    return id
  }, [])

  const clearTimeout = useCallback((id: number) => {
    window.clearTimeout(id)
    timersRef.current.delete(id)
  }, [])

  const setInterval = useCallback((callback: () => void, delay: number) => {
    const id = window.setInterval(callback, delay)
    intervalsRef.current.add(id)
    return id
  }, [])

  const clearInterval = useCallback((id: number) => {
    window.clearInterval(id)
    intervalsRef.current.delete(id)
  }, [])

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id))
      intervalsRef.current.forEach((id) => window.clearInterval(id))
      timersRef.current.clear()
      intervalsRef.current.clear()
    }
  }, [])

  return {
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
  }
}
```

**2. Subscription Management Hook:**

Location: `src/hooks/useSubscriptions.ts`

```typescript
import { useCallback, useEffect, useRef } from 'react'

interface Subscription {
  unsubscribe: () => void
  id?: string
}

export function useSubscriptions() {
  const subscriptionsRef = useRef<Set<Subscription>>(new Set())

  const addSubscription = useCallback((subscription: Subscription) => {
    subscriptionsRef.current.add(subscription)
    return subscription
  }, [])

  const removeSubscription = useCallback((subscription: Subscription) => {
    subscription.unsubscribe()
    subscriptionsRef.current.delete(subscription)
  }, [])

  const clearAllSubscriptions = useCallback(() => {
    subscriptionsRef.current.forEach((sub) => sub.unsubscribe())
    subscriptionsRef.current.clear()
  }, [])

  // Cleanup all subscriptions on unmount
  useEffect(() => {
    return () => {
      clearAllSubscriptions()
    }
  }, [clearAllSubscriptions])

  return {
    addSubscription,
    removeSubscription,
    clearAllSubscriptions,
  }
}
```

**3. Auth State Guarding During API Calls:**

**1. Auth Guard Hook:**

Location: `src/hooks/useAuthGuard.ts`

```typescript
import { useCallback } from 'react'
import { useAuth } from './useAuth'

interface AuthGuardOptions {
  requireAuth?: boolean
  redirectTo?: string
  onUnauthenticated?: () => void
}

export function useAuthGuard(options: AuthGuardOptions = {}) {
  const { user, isAuthenticated, loading } = useAuth()
  const { requireAuth = true, redirectTo = '/login', onUnauthenticated } = options

  const guard = useCallback(
    async <T>(operation: () => Promise<T>): Promise<T> => {
      // Wait for auth state to load
      if (loading) {
        await new Promise((resolve) => {
          const checkAuth = () => {
            if (!loading) resolve(undefined)
            else setTimeout(checkAuth, 50)
          }
          checkAuth()
        })
      }

      // Check authentication
      if (requireAuth && !isAuthenticated) {
        if (onUnauthenticated) {
          onUnauthenticated()
        } else if (redirectTo) {
          window.location.href = redirectTo
        }
        throw new Error('Authentication required')
      }

      // Check session validity (refresh if needed)
      if (user) {
        try {
          const { data: sessionData, error } = await supabase.auth.getSession()
          if (error || !sessionData.session) {
            throw new Error('Invalid session')
          }

          // Check if session expires soon (within 5 minutes)
          const expiresAt = sessionData.session.expires_at
          if (expiresAt) {
            const expiryTime = expiresAt * 1000
            const timeUntilExpiry = expiryTime - Date.now()

            if (timeUntilExpiry < 5 * 60 * 1000) {
              const { error: refreshError } = await supabase.auth.refreshSession()
              if (refreshError) {
                throw new Error('Session refresh failed')
              }
            }
          }
        } catch (error) {
          // Session invalid - redirect to login
          if (onUnauthenticated) {
            onUnauthenticated()
          } else if (redirectTo) {
            window.location.href = redirectTo
          }
          throw new Error('Session expired. Please log in again.')
        }
      }

      // Execute operation with valid auth
      return operation()
    },
    [user, isAuthenticated, loading, requireAuth, redirectTo, onUnauthenticated]
  )

  return { guard, isAuthenticated, loading }
}
```

**2. Protected API Client:**

Update `src/lib/api/supabaseClient.ts`:

```typescript
import { useAuthGuard } from '@/hooks/useAuthGuard'
// ... existing imports ...

// Enhanced query wrapper with auth guarding
export async function query<T>(
  queryFn: () => PromiseLike<{ data: T | null; error: PostgrestError | null }>,
  options: {
    requireAuth?: boolean
    table?: string
    operation?: string
  } = {}
): Promise<T> {
  const { requireAuth = true } = options

  // Auth guard check
  if (requireAuth) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Authentication required for this operation')
    }
  }

  try {
    const { data, error } = await queryFn()

    if (error) {
      // Handle specific auth errors
      if (error.code === 'PGRST301' || error.message.includes('JWT')) {
        throw new Error('Authentication expired. Please log in again.')
      }

      throw new SupabaseQueryError(error, options.table, options.operation)
    }

    if (data === null) {
      throw new SupabaseQueryError(
        {
          message: 'Query returned null data',
          code: 'NULL_DATA',
          details: '',
          hint: '',
        } as PostgrestError,
        options.table,
        options.operation
      )
    }

    return data
  } catch (error) {
    // Re-throw with additional context
    if (error instanceof SupabaseQueryError) {
      throw error
    }

    throw new Error(
      `Database operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

// Enhanced mutate wrapper
export async function mutate<T>(
  mutateFn: () => PromiseLike<{ data: T | null; error: PostgrestError | null }>,
  options: {
    requireAuth?: boolean
    table?: string
    operation?: string
    optimisticUpdate?: () => void
    rollback?: () => void
  } = {}
): Promise<T> {
  const { optimisticUpdate, rollback } = options

  // Apply optimistic update if provided
  optimisticUpdate?.()

  try {
    const result = await query(mutateFn, options)
    return result
  } catch (error) {
    // Rollback optimistic update on error
    rollback?.()
    throw error
  }
}
```

---

**Shadcn/UI Components Integration:**

**Install Required Components:**

```bash
npx shadcn-ui@latest add card button input textarea badge alert-dialog dialog
```

**Component Usage in Error Boundaries:**

```typescript
// Error fallback using Shadcn components
<Card className="w-full max-w-md mx-auto">
  <CardHeader className="text-center">
    <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-destructive" />
    <CardTitle>Something went wrong</CardTitle>
    <CardDescription>
      An unexpected error occurred. Please try again.
    </CardDescription>
  </CardHeader>
  <CardContent>
    <Button onClick={resetError} className="w-full">
      <RefreshCw className="mr-2 h-4 w-4" />
      Try Again
    </Button>
  </CardContent>
</Card>
```

**Progress Indicators for Puzzle Generation:**

```typescript
// Progress display using Shadcn components
{isGenerating && progress && (
  <Card className="p-4">
    <div className="flex items-center space-x-4">
      <div className="flex-1">
        <div className="flex justify-between text-sm mb-1">
          <span>{progress.stage}</span>
          <span>{progress.percent}%</span>
        </div>
        <Progress value={progress.percent} className="w-full" />
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={cancelGeneration}
        disabled={!isGenerating}
      >
        Cancel
      </Button>
    </div>
  </Card>
)}
```

**Error Handling in Forms:**

```typescript
// Error display using Shadcn Alert
{error && (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Error</AlertTitle>
    <AlertDescription>{error}</AlertDescription>
  </Alert>
)}
```

**Best Practices Applied:**

- ✅ **Error Boundaries**: Prevent app crashes with graceful fallbacks
- ✅ **Web Workers**: Move heavy computation off main thread
- ✅ **Sequential Operations**: Prevent race conditions in collaborative features
- ✅ **Memoization**: Reduce unnecessary re-renders with React.memo and useMemo
- ✅ **Debounced Inputs**: Prevent excessive API calls during typing
- ✅ **Timer Cleanup**: Proper cleanup of all timers and intervals
- ✅ **Subscription Management**: Centralized cleanup of real-time subscriptions
- ✅ **Auth Guarding**: Prevent operations when authentication is invalid
- ✅ **Shadcn Integration**: Consistent UI components with proper accessibility

**Integration Points:**

- **From Codebase**: Follows existing hook patterns (useAuth, useCollaborativeLists)
- **From Research**: Applies React performance patterns and error handling best practices
- **From Supabase**: Uses proper type safety and error classification
- **From Stripe**: Maintains security patterns for protected operations

**Testing Strategy:**

- Unit tests for hooks (useSequentialOperations, useConflictResolution)
- Integration tests for error boundaries and Web Worker communication
- E2E tests for collaborative features with race condition prevention
- Performance tests to verify reduced re-renders and UI responsiveness

## 5. Implementation Plan

### Phase 1: Database Performance & Type Safety

- [ ] Create migration `20251125000000_optimize_srs_performance.sql` with SRS optimization functions
- [ ] Add composite indexes for due words and active subscriptions queries
- [ ] Implement `get_due_words_count()` and `calculate_srs_progress()` database functions
- [ ] Regenerate TypeScript types: `supabase gen types typescript --local > src/types/database.types.ts`
- [ ] Replace all `as any` type assertions in `src/lib/api/words.ts` (lines 87, 117, 149)
- [ ] Replace all `as any` type assertions in `src/lib/api/puzzles.ts` (lines 141, 179, 199)
- [ ] Replace all `as any` type assertions in `src/lib/api/srs.ts` (lines 328, 369)
- [ ] Replace all `as any` type assertions in `src/hooks/useCollaborativeLists.ts` (lines 116, 176)
- [ ] Update `fetchDueWordsCount` in `src/lib/api/srs.ts` to use new `get_due_words_count()` function

**Git Commit:** `feat(database): optimize SRS queries and improve type safety`

---

### Phase 2: Error Boundaries Implementation

- [ ] Create `src/components/common/ErrorBoundary.tsx` with class-based error boundary
- [ ] Create `src/hooks/useErrorBoundary.ts` for imperative error handling
- [ ] Wrap app root in `src/main.tsx` with ErrorBoundary component
- [ ] Wrap `src/pages/PuzzleSolver.tsx` with feature-level error boundary
- [ ] Wrap `src/pages/Dashboard.tsx` with feature-level error boundary
- [ ] Wrap `src/pages/WordListDetail.tsx` with feature-level error boundary
- [ ] Install required Shadcn components: `npx shadcn-ui@latest add card button input textarea badge alert-dialog dialog`

**Git Commit:** `feat(error-handling): add React Error Boundaries to prevent app crashes`

---

### Phase 3: Web Worker for Puzzle Generation

- [ ] Create `src/workers/puzzleGenerator.worker.ts` with puzzle generation logic
- [ ] Create `src/hooks/usePuzzleGeneratorWorker.ts` for worker communication
- [ ] Update `src/hooks/usePuzzleGeneration.ts` to use Web Worker instead of blocking main thread
- [ ] Add progress tracking and cancellation support to worker interface
- [ ] Update `src/lib/algorithms/generator.ts` to support progress callbacks
- [ ] Test worker communication and error handling

**Git Commit:** `perf(puzzle): move puzzle generation to Web Worker to prevent UI blocking`

---

### Phase 4: Collaborative Race Condition Fixes

- [ ] Create `src/hooks/useSequentialOperations.ts` for operation queuing
- [ ] Create `src/hooks/useConflictResolution.ts` for optimistic update conflict handling
- [ ] Update `src/hooks/useCollaborativeLists.ts` (lines 96-233) with sequential operations
- [ ] Implement proper conflict resolution for add/update/delete operations
- [ ] Add operation queue management and cleanup
- [ ] Test rapid collaborative operations to ensure no state corruption

**Git Commit:** `fix(collaborative): resolve race conditions in list operations with sequential processing`

---

### Phase 5: Performance Optimizations

- [ ] Create `src/hooks/useDebounce.ts` for input debouncing
- [ ] Create `src/components/words/DebouncedWordInput.tsx` for optimized inputs
- [ ] Update `src/components/words/CollaborativeWordList.tsx` with React.memo optimizations
- [ ] Add memoization to prevent unnecessary re-renders in collaborative components
- [ ] Implement debounced updates for word editing to reduce API calls
- [ ] Add performance monitoring for render optimization verification

**Git Commit:** `perf(react): optimize collaborative components with memoization and debouncing`

---

### Phase 6: Security & Rate Limiting

- [ ] Create `supabase/functions/_middleware/rateLimit.ts` with in-memory rate limiting
- [ ] Create `supabase/functions/_shared/validation.ts` with Zod schemas for webhook validation
- [ ] Create `supabase/functions/_shared/security.ts` with request sanitization
- [ ] Create `supabase/functions/_shared/idempotency.ts` for request deduplication
- [ ] Create `supabase/functions/_shared/retry.ts` with exponential backoff
- [ ] Create `supabase/functions/_shared/circuitBreaker.ts` for service protection
- [ ] Update `supabase/functions/stripe-webhook/index.ts` with comprehensive security layers
- [ ] Add rate limiting (50 req/min) and input validation to webhook handler

**Git Commit:** `security(webhook): add rate limiting, validation, and circuit breakers to Stripe webhooks`

---

### Phase 7: Timer & Subscription Management

- [ ] Create `src/hooks/useTimer.ts` for centralized timer cleanup
- [ ] Create `src/hooks/useSubscriptions.ts` for subscription management
- [ ] Create `src/hooks/useAuthGuard.ts` for auth state validation
- [ ] Update `src/lib/api/supabaseClient.ts` with enhanced auth guarding
- [ ] Add session validation and refresh logic to API calls
- [ ] Implement proper cleanup for all timers and subscriptions in components

**Git Commit:** `fix(cleanup): add proper timer and subscription management to prevent memory leaks`

---

### Phase 8: Testing & Validation

**Automated Tests:**

- [ ] Unit test: `useSequentialOperations` hook queue processing
- [ ] Unit test: `useConflictResolution` conflict resolution strategies
- [ ] Unit test: `usePuzzleGeneratorWorker` worker communication
- [ ] Integration test: Error Boundary component error catching and recovery
- [ ] Integration test: Web Worker puzzle generation with progress tracking
- [ ] Integration test: Rate limiting middleware behavior under load
- [ ] E2E test: Collaborative list operations with multiple rapid actions
- [ ] Performance test: UI responsiveness during puzzle generation
- [ ] Security test: Webhook validation and rate limiting effectiveness

**Manual Validation:**

- [ ] Verify puzzle generation doesn't block UI (should remain responsive)
- [ ] Test collaborative features with multiple users making rapid changes
- [ ] Verify error boundaries prevent app crashes from component errors
- [ ] Test rate limiting by sending excessive webhook requests
- [ ] Validate type safety improvements (no TypeScript errors)
- [ ] Confirm database query performance improvements
- [ ] Test auth state changes during API operations
- [ ] Verify timer and subscription cleanup on component unmount

**Git Commit:** `test(quality): add comprehensive tests and validate all improvements`

---

### Phase 9: Documentation & Monitoring

- [ ] Update README.md with new architecture patterns
- [ ] Add error handling documentation for developers
- [ ] Document Web Worker usage and limitations
- [ ] Create monitoring hooks for error boundary events
- [ ] Add performance metrics collection for puzzle generation
- [ ] Document rate limiting configuration and thresholds
- [ ] Add debugging guides for collaborative race conditions

**Git Commit:** `docs(quality): document new patterns and add monitoring capabilities`
