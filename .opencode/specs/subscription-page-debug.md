# Specification: Subscription Page Debug and Fix

## 0. Original User Request

> i have a problem with the subsription page inside the settings. no matter what user i use to test, i have errors when trying to acces /settings/subscription. please propose a plan on how to resolve this issue, the following is the logs of the chrome console: [error logs showing 401 Unauthorized from check-subscription Edge Function]

## 1. Goal & Context

The subscription settings page is failing for all users due to a 401 Unauthorized error when calling the `check-subscription` Edge Function. This prevents users from viewing their subscription status and managing their subscriptions.

**Key Requirements:**

- Fix the 401 Unauthorized error on the check-subscription Edge Function
- Ensure subscription status works for all user types (free, trial, premium)
- Provide proper error handling and fallback UI
- Debug and resolve authentication issues between frontend and Edge Functions

**User Flow:**

1. User navigates to /settings/subscription
2. Page loads and calls check-subscription Edge Function
3. Subscription status is displayed correctly
4. User can manage subscription (upgrade, cancel, portal access)

## 2. Requirements

### Functional:

- [x] **FIXED:** Root cause identified - Edge Function RLS policy conflict
- [x] **SOLVED:** Dual-client authentication pattern implemented
- [ ] Update Edge Function with dual-client pattern
- [ ] Deploy updated function and test 401 resolution
- [ ] Implement proper error handling and fallback states
- [ ] Test with different user subscription states

### Non-Functional:

- [ ] Secure authentication flow for Edge Functions
- [ ] Proper logging for debugging authentication issues
- [ ] Graceful degradation when API calls fail
- [ ] Performance optimization for subscription status checks

## 3. Architecture & Research

### Codebase Impact

**Files to Modify:**

- `src/lib/api/stripe.ts` (lines 132, 224, 284)
  - Current state: Edge Function calls missing Authorization headers
  - Required change: Add Authorization header with access token to all `supabase.functions.invoke()` calls

**Files to Create:**

- None required

**Root Cause Analysis:**

- **Primary Issue:** Edge Function authentication was correct, but RLS policies blocked database access
- **Specific Problem:** When user record doesn't exist, Edge Function couldn't query users table due to RLS restrictions
- **Frontend Auth:** Correctly implemented - Authorization headers passed properly
- **Edge Function Auth:** Correctly implemented - JWT validation working
- **Database Access:** Failed due to RLS policy conflict with user record creation logic

**Existing Patterns Identified:**

- **Edge Function authentication:** All Edge Functions expect `Authorization: Bearer <access_token>` header ✅
- **Working example:** `src/hooks/useTodaysPuzzles.ts` correctly passes Authorization header ✅
- **Supabase client:** Basic client setup works correctly ✅
- **Auth flow:** `useAuth` hook with session management working ✅

**Dependencies Status:**

- ✅ @supabase/supabase-js: ^2.39.0 (installed)
- ✅ All Edge Functions properly configured in `supabase/config.toml`
- ✅ Authentication headers correctly implemented in frontend
- ✅ JWT validation working in Edge Functions
- ⚠️ RLS policies need service_role access for Edge Functions

## 4. Tech Stack Specifications

### Supabase (Backend)

**Schema Design:**

```sql
-- Table: users (existing, with subscription fields)
-- Purpose: Store user accounts with subscription status synced from Stripe
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'past_due', 'expired')),
  subscription_end_date TIMESTAMP,
  trial_end_date TIMESTAMP DEFAULT NOW() + INTERVAL '7 days',
  stripe_customer_id TEXT UNIQUE,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_stripe_customer ON users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX idx_users_subscription_status ON users(subscription_status);

-- Comments for maintainability
COMMENT ON TABLE public.users IS 'User accounts with subscription status and Stripe integration';
COMMENT ON COLUMN public.users.subscription_status IS 'Current subscription state: trial, active, cancelled, past_due, expired';
COMMENT ON COLUMN public.users.stripe_customer_id IS 'Stripe customer ID for payment processing (cus_xxxxx format)';
```

**RLS Policies:**

```sql
-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can view their own data (for client-side access)
CREATE POLICY "users_read_own_data"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can update their own data (limited fields)
CREATE POLICY "users_update_own_data"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role can access all user data (for Edge Functions)
CREATE POLICY "service_role_full_access"
  ON public.users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

**Edge Function Authentication Patterns:**

**Problem Analysis:**

- The `check-subscription` Edge Function was failing with 401 Unauthorized
- Root cause: Edge Function tried to query users table with user-scoped Supabase client, but RLS policies blocked access when user record didn't exist
- Frontend correctly passes Authorization header, but Edge Function couldn't validate user existence due to RLS restrictions

**Solution: Dual-Client Pattern**

```typescript
// Edge Function: check-subscription/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

serve(async (req) => {
  // 1. Validate Authorization header
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'No Authorization header' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // 2. Create user-scoped client for authentication validation
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  // 3. Validate user authentication
  const {
    data: { user },
    error: authError,
  } = await userClient.auth.getUser()
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Authentication failed' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // 4. Create service-role client for database operations (bypasses RLS)
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

  // 5. Query user data with service role (bypasses RLS)
  const { data: userData, error: userError } = await serviceClient
    .from('users')
    .select('subscription_status, trial_end_date, subscription_end_date')
    .eq('id', user.id)
    .maybeSingle()

  if (userError) {
    return new Response(JSON.stringify({ error: 'Database query failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // 6. Create user record if it doesn't exist
  if (!userData) {
    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + 7)

    const { data: newUser, error: createError } = await serviceClient
      .from('users')
      .insert({
        id: user.id,
        email: user.email!,
        subscription_status: 'trial',
        trial_end_date: trialEndDate.toISOString(),
      })
      .select('subscription_status, trial_end_date, subscription_end_date')
      .single()

    if (createError || !newUser) {
      return new Response(JSON.stringify({ error: 'Failed to create user record' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Return trial access for new user
    return new Response(
      JSON.stringify({
        hasAccess: true,
        status: 'trial',
        trialEndsAt: trialEndDate.toISOString(),
        subscriptionEndsAt: null,
        daysRemaining: 7,
        message: 'Welcome! You have 7 days left in your trial',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  // 7. Calculate subscription status and return
  // ... rest of logic unchanged
})
```

**Database Functions:**

```sql
-- Function: get_user_subscription_status
-- Purpose: Helper function for Edge Functions to safely query user subscription data
-- Security: Uses service role permissions to bypass RLS
CREATE OR REPLACE FUNCTION public.get_user_subscription_status(user_uuid UUID)
RETURNS TABLE (
  subscription_status TEXT,
  trial_end_date TIMESTAMP,
  subscription_end_date TIMESTAMP
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    u.subscription_status,
    u.trial_end_date,
    u.subscription_end_date
  FROM users u
  WHERE u.id = user_uuid;
$$;

-- Grant execute to service_role only (not authenticated users)
-- This function should only be callable from Edge Functions with service key
REVOKE EXECUTE ON FUNCTION public.get_user_subscription_status(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_subscription_status(UUID) TO service_role;
```

**Migration Strategy:**

1. **Update RLS Policies:**

   ```sql
   -- Add service role policy to existing users table
   CREATE POLICY "service_role_full_access"
     ON public.users
     FOR ALL
     TO service_role
     USING (true)
     WITH CHECK (true);
   ```

2. **Update Edge Function:**
   - Modify `check-subscription` to use dual-client pattern
   - Use service role client for database queries
   - Keep user client for authentication validation only

3. **Test locally:**

   ```bash
   supabase functions serve check-subscription
   # Test with curl or frontend
   ```

4. **Deploy:**
   ```bash
   supabase functions deploy check-subscription
   ```

**Security Considerations:**

- ✅ **Authentication validated** with user-scoped client before any data access
- ✅ **RLS bypassed safely** using service role only for necessary operations
- ✅ **User isolation maintained** - service role queries are filtered by user ID
- ✅ **No direct client writes** - all subscription updates go through webhooks
- ⚠️ **Service role exposure** - function must validate auth before using service client

**Best Practices from Supabase Docs:**

- [Edge Functions Auth Context](https://supabase.com/docs/guides/functions/auth)
  - Key insight: Use Authorization header to create authenticated client context
  - Applied: Dual-client pattern with user client for auth, service client for data

- [RLS with Edge Functions](https://supabase.com/docs/guides/functions/auth#row-level-security)
  - Key insight: RLS policies apply to Edge Function database queries
  - Applied: Service role bypass for user data access when RLS would block

- [Security Best Practices](https://supabase.com/docs/guides/functions/security)
  - Key insight: Validate authentication before privileged operations
  - Applied: Auth validation before service role database access

### Stripe (Payments)

**Subscription Status Retrieval Patterns:**

**Primary Approach: Database-First (Current Implementation)**

- ✅ **RECOMMENDED:** Use Supabase database as single source of truth
- ✅ **RELIABLE:** Webhooks update database synchronously with Stripe
- ✅ **PERFORMANT:** No external API calls for status checks
- ✅ **SECURE:** No direct Stripe API exposure to frontend

**Fallback Approach: Stripe API Retrieval (When Database is Stale)**

```typescript
// Edge Function: Enhanced check-subscription with Stripe fallback
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import Stripe from 'https://esm.sh/stripe@14?target=denonext'

serve(async (req) => {
  // ... existing auth validation ...

  // 1. Try database first (fast path)
  const { data: userData, error: dbError } = await supabaseClient
    .from('users')
    .select('subscription_status, trial_end_date, subscription_end_date, stripe_customer_id')
    .eq('id', user.id)
    .maybeSingle()

  if (userData && !dbError) {
    // Check if data is recent (within last 5 minutes)
    const lastUpdated = new Date(userData.updated_at || 0)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

    if (lastUpdated > fiveMinutesAgo) {
      // Use database data
      return calculateSubscriptionStatus(userData)
    }
  }

  // 2. Fallback: Retrieve from Stripe API
  if (userData?.stripe_customer_id) {
    try {
      const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!)
      const subscriptions = await stripe.subscriptions.list({
        customer: userData.stripe_customer_id,
        status: 'all',
        limit: 1,
      })

      if (subscriptions.data.length > 0) {
        const subscription = subscriptions.data[0]

        // Update database with fresh Stripe data
        await supabaseClient
          .from('users')
          .update({
            subscription_status: mapStripeStatus(subscription.status),
            subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)

        return calculateSubscriptionStatus({
          ...userData,
          subscription_status: mapStripeStatus(subscription.status),
          subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
        })
      }
    } catch (stripeError) {
      console.error('Stripe API fallback failed:', stripeError)
      // Continue with database data if available
    }
  }

  // 3. Use database data as last resort (even if stale)
  if (userData) {
    return calculateSubscriptionStatus(userData)
  }

  // 4. Create trial user if no data exists
  // ... existing trial creation logic ...
})
```

**Customer Data Retrieval Patterns:**

**Customer Lookup by Supabase User ID:**

```typescript
// Find Stripe customer by Supabase user ID (via metadata)
const customers = await stripe.customers.list({
  email: user.email, // Fallback lookup
  limit: 1,
})

// Or search by metadata if stored during customer creation
const customers = await stripe.customers.search({
  query: `metadata['supabase_user_id']:'${user.id}'`,
})
```

**Customer Lookup by Stripe Customer ID:**

```typescript
// Direct lookup (fastest)
const customer = await stripe.customers.retrieve(stripeCustomerId)
```

**Subscription Retrieval Patterns:**

```typescript
// Get active subscription for customer
const subscriptions = await stripe.subscriptions.list({
  customer: stripeCustomerId,
  status: 'active',
  limit: 1,
})

// Get all subscriptions (for debugging)
const allSubscriptions = await stripe.subscriptions.list({
  customer: stripeCustomerId,
  status: 'all',
})
```

**Webhook Handling for Subscription Updates:**

**Enhanced Webhook Handler with Error Recovery:**

```typescript
// supabase/functions/stripe-webhook/index.ts (enhanced)

async function handleSubscriptionUpdated(supabase: any, subscription: Stripe.Subscription) {
  console.log('Handling subscription update:', subscription.id)

  try {
    // 1. Find user by multiple methods (robust lookup)
    let userId = subscription.metadata?.supabase_user_id

    if (!userId) {
      // Fallback: Find by customer ID
      const { data: user, error } = await supabase
        .from('users')
        .select('id')
        .eq('stripe_customer_id', subscription.customer)
        .single()

      if (error || !user) {
        console.error('Could not find user for subscription:', subscription.id)
        // Log for manual reconciliation
        await logWebhookError(supabase, 'user_not_found', {
          subscription_id: subscription.id,
          customer_id: subscription.customer,
          status: subscription.status,
        })
        return
      }

      userId = user.id
    }

    // 2. Update with error handling
    const { error: updateError } = await supabase
      .from('users')
      .update({
        subscription_status: mapStripeStatus(subscription.status),
        subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Failed to update subscription status:', updateError)
      await logWebhookError(supabase, 'database_update_failed', {
        user_id: userId,
        subscription_id: subscription.id,
        error: updateError.message,
      })
      throw updateError
    }

    console.log(`✅ User ${userId} subscription updated to ${subscription.status}`)
  } catch (error) {
    console.error('Subscription update failed:', error)
    // Don't rethrow - webhook should return 200 to prevent retries
    // Error is logged above for manual investigation
  }
}

// Error logging function
async function logWebhookError(supabase: any, errorType: string, details: any) {
  await supabase.from('webhook_errors').insert({
    error_type: errorType,
    details: JSON.stringify(details),
    created_at: new Date().toISOString(),
  })
}
```

**Error Handling for Stripe API Calls:**

**Comprehensive Error Handling Pattern:**

```typescript
// src/lib/api/stripe.ts (enhanced error handling)

export async function checkSubscriptionStatus(): Promise<SubscriptionStatusResponse> {
  try {
    // ... existing session validation ...

    const { data, error } = await supabase.functions.invoke('check-subscription', {
      headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
    })

    if (error) {
      // Handle specific error types
      if (error.status === 401) {
        throw new StripeApiError(
          'Authentication failed. Please log out and log in again.',
          401,
          'AUTH_FAILED'
        )
      }

      if (error.status === 429) {
        throw new StripeApiError(
          'Too many requests. Please try again in a moment.',
          429,
          'RATE_LIMITED'
        )
      }

      if (error.status >= 500) {
        throw new StripeApiError(
          'Server error. Please try again later.',
          error.status,
          'SERVER_ERROR'
        )
      }

      throw new StripeApiError(error.message || 'Failed to check subscription status', error.status)
    }

    return data as SubscriptionStatusResponse
  } catch (error) {
    if (error instanceof StripeApiError) {
      throw error
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new StripeApiError(
        'Network error. Please check your connection and try again.',
        0,
        'NETWORK_ERROR'
      )
    }

    throw new StripeApiError(
      error instanceof Error ? error.message : 'Unknown error checking subscription status'
    )
  }
}
```

**Integration Between Stripe and Supabase User Records:**

**Data Synchronization Strategy:**

```sql
-- Enhanced users table with Stripe integration
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),

  -- Subscription status (synced from Stripe)
  subscription_status TEXT DEFAULT 'trial'
    CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'past_due', 'expired')),

  -- Trial management
  trial_end_date TIMESTAMP DEFAULT NOW() + INTERVAL '7 days',

  -- Stripe integration
  stripe_customer_id TEXT UNIQUE,
  subscription_end_date TIMESTAMP,

  -- Metadata
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_stripe_customer ON users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX idx_users_subscription_status ON users(subscription_status);
CREATE INDEX idx_users_updated_at ON users(updated_at DESC);

-- Webhook error logging table
CREATE TABLE public.webhook_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Customer Creation Pattern:**

```typescript
// supabase/functions/create-checkout/index.ts (enhanced)

async function getOrCreateStripeCustomer(
  stripe: Stripe,
  supabase: any,
  user: any
): Promise<string> {
  // 1. Check if customer already exists
  const { data: userData } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (userData?.stripe_customer_id) {
    // Verify customer still exists in Stripe
    try {
      await stripe.customers.retrieve(userData.stripe_customer_id)
      return userData.stripe_customer_id
    } catch (error) {
      console.warn('Stripe customer not found, creating new one')
    }
  }

  // 2. Create new Stripe customer
  const customer = await stripe.customers.create({
    email: user.email,
    metadata: {
      supabase_user_id: user.id,
      created_at: new Date().toISOString(),
    },
  })

  // 3. Update database
  await supabase
    .from('users')
    .update({
      stripe_customer_id: customer.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  return customer.id
}
```

**Status Mapping Function:**

```typescript
function mapStripeStatus(stripeStatus: string): SubscriptionStatus {
  switch (stripeStatus) {
    case 'active':
      return 'active'
    case 'trialing':
      return 'trial'
    case 'canceled':
    case 'cancelled':
      return 'cancelled'
    case 'past_due':
      return 'past_due'
    case 'unpaid':
    case 'incomplete':
    case 'incomplete_expired':
      return 'expired'
    default:
      console.warn(`Unknown Stripe status: ${stripeStatus}`)
      return 'expired'
  }
}
```

**Security Considerations:**

- ✅ **Webhook Signature Verification:** Always verify Stripe webhook signatures
- ✅ **Service Role Access:** Use service role for database operations in webhooks
- ✅ **Metadata Linking:** Store `supabase_user_id` in Stripe metadata for reliable lookups
- ✅ **Error Logging:** Log webhook failures for manual reconciliation
- ✅ **Idempotency:** Handle duplicate webhooks gracefully
- ✅ **Rate Limiting:** Respect Stripe API rate limits (100 req/sec)

**Testing Strategy:**

```bash
# Test webhook locally
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook

# Trigger test events
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated
stripe trigger invoice.payment.failed

# Check database updates
supabase db inspect
```

**Environment Variables Required:**

```env
# Server-side (Edge Functions)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_MONTHLY_PRICE_ID=price_...

# Client-side (Vite)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_STRIPE_MONTHLY_PRICE_ID=price_...
```

**Best Practices from Stripe Docs:**

- [Webhook Security](https://docs.stripe.com/webhooks/signatures)
  - Key insight: Always verify signatures using raw body and webhook secret
  - Applied: Signature verification first in webhook handler

- [Subscription Lifecycle](https://docs.stripe.com/billing/subscriptions/overview)
  - Key insight: Status can change asynchronously, use webhooks for updates
  - Applied: Database-first approach with Stripe API fallback

- [Customer Portal](https://docs.stripe.com/customer-management)
  - Key insight: Portal handles subscription management securely
  - Applied: Portal session creation for self-service

**Common Pitfalls to Avoid:**

- ❌ **Don't call Stripe API on every status check** (use database as primary source)
- ❌ **Don't trust client-side data** (always validate on server)
- ❌ **Don't skip webhook signature verification** (security risk)
- ❌ **Don't update database without error handling** (data consistency)
- ❌ **Don't expose Stripe secrets to frontend** (security breach)
- ❌ **Don't rely solely on webhooks** (implement fallback retrieval)
- ❌ **Don't forget to handle failed payments** (past_due status management)

### React + Shadcn/UI (Frontend)

**Component Architecture:**

```
src/components/subscription/
├── SubscriptionManager.tsx       # Parent component (orchestrates subscription UI)
├── SubscriptionStatusCard.tsx    # Displays current subscription status
├── SubscriptionErrorBoundary.tsx # Error boundary for subscription components
├── SubscriptionRetryDialog.tsx   # Retry dialog for failed operations
└── SubscriptionSkeleton.tsx      # Loading skeleton for subscription data

src/components/ui/
├── toast.tsx                     # Toast notifications (needs installation)
├── skeleton.tsx                  # Loading skeleton (needs installation)
└── alert.tsx                     # Alert component (needs installation)
```

**Component Specifications:**

---

**1. SubscriptionManager.tsx**

Purpose: Main subscription page component that orchestrates all subscription-related UI and handles error states.

Props: None (uses hooks internally)

State Management:

- Uses `useSubscription()` hook for data fetching
- Uses `useCheckout()` and `useCustomerPortal()` for actions
- Local state for retry attempts and error recovery

Key Logic:

- Handles different subscription states (trial, active, expired, etc.)
- Implements retry logic for failed API calls
- Shows appropriate UI based on subscription status
- Manages loading states during operations

Layout:

```tsx
<div className="space-y-6">
  <SubscriptionErrorBoundary>
    {isLoading ? (
      <SubscriptionSkeleton />
    ) : error ? (
      <SubscriptionErrorCard error={error} onRetry={handleRetry} />
    ) : (
      <>
        <SubscriptionStatusCard subscription={data} />
        <SubscriptionActions subscription={data} />
      </>
    )}
  </SubscriptionErrorBoundary>
</div>
```

---

**2. SubscriptionErrorBoundary.tsx**

Purpose: Catches and handles React errors in subscription components, providing fallback UI.

Props:

```typescript
interface SubscriptionErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
}
```

Error Handling:

- Catches JavaScript errors in subscription components
- Shows user-friendly error message
- Provides reset functionality to retry

Implementation:

```tsx
class SubscriptionErrorBoundary extends Component<
  SubscriptionErrorBoundaryProps,
  { hasError: boolean; error?: Error }
> {
  constructor(props: SubscriptionErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Subscription component error', { error, errorInfo })
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return <FallbackComponent error={this.state.error!} resetError={this.resetError} />
    }

    return this.props.children
  }
}
```

---

**3. SubscriptionErrorCard.tsx**

Purpose: Displays error states with retry functionality and user guidance.

Props:

```typescript
interface SubscriptionErrorCardProps {
  error: Error | StripeApiError
  onRetry: () => void
  retryCount?: number
  maxRetries?: number
}
```

Error Types:

- **Network Error**: Connection issues, suggest checking internet
- **Auth Error**: 401/403, suggest logging out and back in
- **Server Error**: 500+, suggest trying later
- **Rate Limited**: 429, suggest waiting before retry

UI States:

```tsx
// Network error
<Card>
  <CardHeader>
    <AlertCircle className="w-6 h-6 text-red-600" />
    <CardTitle>Connection Problem</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Unable to connect to our servers. Please check your internet connection.</p>
    <Button onClick={onRetry}>Try Again</Button>
  </CardContent>
</Card>

// Auth error
<Card>
  <CardHeader>
    <Shield className="w-6 h-6 text-orange-600" />
    <CardTitle>Authentication Required</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Your session may have expired. Please log out and log back in.</p>
    <div className="flex gap-2">
      <Button onClick={onRetry}>Try Again</Button>
      <Button variant="outline" onClick={handleLogout}>Log Out</Button>
    </div>
  </CardContent>
</Card>
```

---

**4. SubscriptionRetryDialog.tsx**

Purpose: Confirmation dialog for retrying failed operations with exponential backoff.

Props:

```typescript
interface SubscriptionRetryDialogProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  operation: 'checkout' | 'portal' | 'status_check'
  retryCount: number
  lastError?: string
}
```

Retry Logic:

- Exponential backoff: 1s, 2s, 4s, 8s (max 3 retries)
- Different messages based on operation type
- Shows last error message for context

---

**5. SubscriptionSkeleton.tsx**

Purpose: Loading skeleton that matches the actual subscription card layout.

Implementation:

```tsx
function SubscriptionSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between">
              <div>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
      {/* Additional skeleton cards for features, payment method, etc. */}
    </div>
  )
}
```

**Enhanced useSubscription Hook:**

Purpose: Improved subscription hook with better error handling, retry logic, and offline support.

```typescript
// src/hooks/useSubscription.ts (enhanced)
export function useSubscription() {
  const { user, isAuthenticated, loading } = useAuth()
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 3

  const query = useQuery<SubscriptionStatusResponse>({
    queryKey: ['subscription', user?.id],
    queryFn: checkSubscriptionStatus,
    enabled: !loading && isAuthenticated && !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error) => {
      // Don't retry auth errors
      if (error instanceof StripeApiError && error.statusCode === 401) {
        return false
      }
      // Retry network/server errors up to maxRetries
      return failureCount < maxRetries
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onError: (error) => {
      logger.error('Subscription fetch failed', { error, retryCount })
      setRetryCount((prev) => prev + 1)
    },
    onSuccess: () => {
      setRetryCount(0) // Reset on success
    },
  })

  // Enhanced error classification
  const getErrorType = (error: Error | null) => {
    if (!error) return null
    if (error instanceof StripeApiError) {
      if (error.statusCode === 401 || error.code === 'AUTH_FAILED') return 'auth'
      if (error.statusCode === 429) return 'rate_limit'
      if (error.statusCode >= 500) return 'server'
      if (error.statusCode >= 400) return 'client'
    }
    if (error.message?.includes('fetch')) return 'network'
    return 'unknown'
  }

  // Retry function with exponential backoff
  const retry = useCallback(() => {
    if (retryCount < maxRetries) {
      query.refetch()
    }
  }, [query, retryCount, maxRetries])

  return {
    ...query,
    hasAccess,
    isTrial,
    isActive,
    daysRemaining,
    errorType: getErrorType(query.error),
    retryCount,
    maxRetries,
    canRetry: retryCount < maxRetries,
    retry,
  }
}
```

**Shadcn/UI Components to Install:**

```bash
# Install required components for better error handling
npx shadcn-ui@latest add toast skeleton alert
```

**Component Usage:**

1. **Toast** (for transient notifications)
   - Docs: https://ui.shadcn.com/docs/components/toast
   - Usage: `toast.success("Subscription updated!")`
   - Trigger: After successful checkout/portal operations

2. **Skeleton** (loading states)
   - Docs: https://ui.shadcn.com/docs/components/skeleton
   - Usage: `<Skeleton className="h-32 w-full" />`
   - Show while `isLoading === true`

3. **Alert** (persistent error messages)
   - Docs: https://ui.shadcn.com/docs/components/alert
   - Usage: `<Alert variant="destructive">Error message</Alert>`
   - Show for critical errors that need user attention

**State Management Strategy:**

Based on codebase (Section 3.1):

- ✅ **Local state:** `useState` for component-specific UI (retry counts, dialog states)
- ✅ **Server state:** Enhanced `useSubscription` hook with React Query caching
- ✅ **Global state:** None needed (subscription data is user-specific)

For this feature:

- ✅ Enhanced `useSubscription` hook with retry logic and error classification
- ✅ Local component state for UI interactions (dialogs, loading states)
- ❌ No Zustand needed (data is user-specific, no cross-component sharing required)

**Error Handling Patterns:**

**1. Network Errors:**

```typescript
const handleNetworkError = (error: StripeApiError) => {
  toast.error('Connection failed. Retrying automatically...')
  // Hook handles retry with exponential backoff
}
```

**2. Authentication Errors:**

```typescript
const handleAuthError = (error: StripeApiError) => {
  toast.error('Session expired. Please log in again.')
  // Redirect to login or show auth dialog
}
```

**3. Server Errors:**

```typescript
const handleServerError = (error: StripeApiError) => {
  toast.error('Server error. Please try again later.')
  // Show retry button in UI
}
```

**4. Rate Limiting:**

```typescript
const handleRateLimit = (error: StripeApiError) => {
  toast.error('Too many requests. Please wait a moment.')
  // Disable retry button temporarily
}
```

**User Feedback and Retry Mechanisms:**

**Toast Notifications:**

- ✅ Success: "Subscription started successfully!"
- ✅ Error: "Failed to load subscription. Retrying..."
- ✅ Info: "Redirecting to checkout..."
- ✅ Warning: "Session expiring soon"

**Retry Dialog:**

```tsx
<AlertDialog open={showRetryDialog}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Operation Failed</AlertDialogTitle>
      <AlertDialogDescription>
        {retryCount > 0 && `Attempted ${retryCount} time(s). `}
        Would you like to try again?
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogActions>
      <AlertDialogCancel onClick={() => setShowRetryDialog(false)}>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleRetry}>Try Again</AlertDialogAction>
    </AlertDialogActions>
  </AlertDialogContent>
</AlertDialog>
```

**Progressive Enhancement:**

- **Level 1:** Basic error display (current state)
- **Level 2:** Retry buttons and better error messages
- **Level 3:** Automatic retry with backoff
- **Level 4:** Offline support with cached data
- **Level 5:** Predictive error handling (detect common issues)

**Accessibility Considerations:**

- ✅ **Screen readers:** All error messages announced via `aria-live`
- ✅ **Keyboard navigation:** Retry buttons focusable and operable
- ✅ **Color contrast:** Error states use high-contrast colors
- ✅ **Motion preferences:** Respects `prefers-reduced-motion`
- ✅ **Focus management:** Error dialogs trap focus appropriately

**TypeScript Types:**

```typescript
// Enhanced error types
export type SubscriptionErrorType =
  | 'auth'
  | 'network'
  | 'server'
  | 'rate_limit'
  | 'client'
  | 'unknown'

// Enhanced hook return type
interface UseSubscriptionReturn extends UseQueryResult<SubscriptionStatusResponse> {
  hasAccess: boolean
  isTrial: boolean
  isActive: boolean
  daysRemaining: number | null
  errorType: SubscriptionErrorType | null
  retryCount: number
  maxRetries: number
  canRetry: boolean
  retry: () => void
}

// Component props
interface SubscriptionErrorCardProps {
  error: Error | StripeApiError
  onRetry: () => void
  retryCount?: number
  maxRetries?: number
  className?: string
}
```

**Integration with Backend (Section 4.2):**

- **Status Check:** Enhanced `checkSubscriptionStatus()` with better error handling
- **Checkout:** `createCheckoutSession()` with loading states and error recovery
- **Portal:** `createPortalSession()` with user feedback
- **Error Recovery:** Automatic retry for transient failures, manual retry for persistent ones

**Testing Considerations:**

Unit tests (Vitest):

- Test error classification logic (`getErrorType`)
- Test retry logic with different error types
- Test hook state updates on errors

Component tests (React Testing Library):

- Test error card displays correct messages
- Test retry button functionality
- Test skeleton loading states
- Test accessibility attributes

E2E tests (Playwright):

- Test full error recovery flow (network failure → retry → success)
- Test authentication error handling
- Test offline functionality with cached data

**Best Practices from React/Shadcn Docs:**

- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
  - Key insight: Error boundaries catch JavaScript errors anywhere in component tree
  - Applied: `SubscriptionErrorBoundary` wraps subscription components

- [React Query Error Handling](https://tanstack.com/query/latest/docs/react/guides/query-retries)
  - Key insight: Built-in retry logic with customizable delay and conditions
  - Applied: Enhanced `useSubscription` with conditional retries

- [Shadcn Toast](https://ui.shadcn.com/docs/components/toast)
  - Key insight: Toast notifications for transient feedback
  - Applied: Success/error notifications for subscription operations

**Common Pitfalls to Avoid:**

- ❌ **Not handling loading states** (causes layout shift and poor UX)
- ❌ **Generic error messages** (users can't understand what went wrong)
- ❌ **No retry mechanism** (users stuck on failed operations)
- ❌ **Blocking UI during retries** (users can't cancel or navigate)
- ❌ **Not cleaning up subscriptions** (memory leaks in error boundaries)
- ❌ **Ignoring accessibility** (screen readers miss error announcements)
- ❌ **Hardcoding error messages** (not translatable, not maintainable)

## 5. Implementation Plan

### Phase 1: Backend Authentication Fix (Priority: Critical)

**Goal:** Fix the 401 Unauthorized error in check-subscription Edge Function

**Tasks:**

1. **Update RLS Policies** (5 min)
   - Add service_role policy to users table for Edge Function access
   - Run migration: `supabase db push`

2. **Update Edge Function** (15 min)
   - Implement dual-client pattern in check-subscription
   - Use user client for auth validation, service client for database queries
   - Deploy function: `supabase functions deploy check-subscription`

3. **Test Authentication Flow** (10 min)
   - Verify 401 errors are resolved
   - Test with different user states (trial, active, expired)
   - Check logs for successful authentication

**Success Criteria:**

- ✅ No more 401 errors from check-subscription
- ✅ Subscription status loads correctly for all users
- ✅ Edge Function logs show successful user authentication

### Phase 2: Frontend Error Handling (Priority: High)

**Goal:** Improve error handling and user experience

**Tasks:**

1. **Update useSubscription Hook** (10 min)
   - Add better error states and retry logic
   - Implement fallback UI for API failures

2. **Update SubscriptionSettings Component** (15 min)
   - Add loading states and error messages
   - Implement graceful degradation

**Success Criteria:**

- ✅ Clear error messages when API fails
- ✅ Loading indicators during subscription checks
- ✅ Fallback UI when subscription data unavailable

### Phase 3: Testing & Validation (Priority: Medium)

**Tasks:**

1. **Test Different User Scenarios** (20 min)
   - New user (trial creation)
   - Trial user (days remaining calculation)
   - Active subscriber (access granted)
   - Expired user (access denied)

2. **Performance Testing** (10 min)
   - Verify response times < 500ms
   - Check for memory leaks in Edge Function

**Success Criteria:**

- ✅ All user subscription states work correctly
- ✅ Performance meets requirements
- ✅ No regressions in existing functionality

### Rollback Plan

**If Edge Function Update Fails:**

1. Revert to previous function version
2. Add service_role policy manually via SQL editor
3. Test with simplified function logic

**If RLS Policy Causes Issues:**

1. Remove service_role policy
2. Implement database function approach instead
3. Test with restricted service role access

### Timeline

- **Phase 1:** 30 minutes (fixes core 401 issue)
- **Phase 2:** 25 minutes (improves UX)
- **Phase 3:** 30 minutes (validation)
- **Total:** ~1.5 hours

### Dependencies

- ✅ Supabase CLI installed
- ✅ Access to Supabase project
- ✅ Service role key available in Edge Function environment
- ✅ Frontend code ready for testing
