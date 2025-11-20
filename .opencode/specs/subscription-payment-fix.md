# Specification: Subscription Payment Completion Fix

## 0. Original User Request

> i want improve the subscriptions page. when clicking on "upgrade subsription" i am directed to the stripe checkout, however, the console shows errors: link rel=preload> uses an unsupported `as` valueUnderstand this warning
> cs_test_b1TOw8XLHGTZtCLNCl6XWSL6SdvDAacpFml6KmcNfhODGiTrSnrW9Plwy9#fidnandhYHdWcXxpYCc%2FJ2FgY2RwaXEnKSdkdWxOYHwnPyd1blpxYHZxWjA0VlZ%2FRnFATVZuUVBpamxvQ3NrMDw1NkhLTmRqSlJWSVNDXGdvf0FwS3A3YFBfaklrdUhgZ1xvS1AyQkhLVWlLTkNsRzxyVXZyR043Q1Z8cXxdM2l%2Fam1oNTVAd2k9ZEdsMCcpJ2N3amhWYHdzYHcnP3F3cGApJ2dkZm5id2pwa2FGamlqdyc%2FJyZjY2NjY2MnKSdpZHxqcHFRfHVgJz8naHBpcWxabHFgaCcpJ2BrZGdpYFVpZGZgbWppYWB3dic%2FcXdwYHgl:1 <link rel=preload> uses an unsupported `as` valueUnderstand this warning
> 6Fetch finished loading: GET "<URL>".
> cs_test_b1TOw8XLHGTZtCLNCl6XWSL6SdvDAacpFml6KmcNfhODGiTrSnrW9Plwy9#fidnandhYHdWcXxpYCc%2FJ2FgY2RwaXEnKSdkdWxOYHwnPyd1blpxYHZxWjA0VlZ%2FRnFATVZuUVBpamxvQ3NrMDw1NkhLTmRqSlJWSVNDXGdvf0FwS3A3YFBfaklrdUhgZ1xvS1AyQkhLVWlLTkNsRzxyVXZyR043Q1Z8cXxdM2l%2Fam1oNTVAd2k9ZEdsMCcpJ2N3amhWYHdzYHcnP3F3cGApJ2dkZm5id2pwa2FGamlqdyc%2FJyZjY2NjY2MnKSdpZHxqcHFRfHVgJz8naHBpcWxabHFgaCcpJ2BrZGdpYFVpZGZgbWppYWB3dic%2FcXdwYHgl:1 Error in event handler: TypeError: Cannot read properties of null (reading 'excerpt')

    at Object.article (chrome-extension://llimhhconnjiflfimocjggfjdlmlhblm/content-script.js:153:39)
    at Object.article (chrome-extension://llimhhconnjiflfimocjggfjdlmlhblm/content-script.js:198:23)
    at Object.init (chrome-extension://llimhhconnjiflfimocjggfjdlmlhblm/content-script.js:570:19)
    at chrome-extension://llimhhconnjiflfimocjggfjdlmlhblm/content-script.js:514:23Understand this error

11Fetch finished loading: POST "<URL>".
10Fetch finished loading: GET "<URL>".
9Fetch finished loading: POST "<URL>".
api.js?onload=captchaLoad&render=explicit:4 XHR finished loading: GET "https://newassets.hcaptcha.com/captcha/v1/39ca38cec26912bf31f8bcdfd7795cb758e47e36/static/i18n/de.json".
(anonymous) @ trycatch.js:220
(anonymous) @ instrument.js:266
(anonymous) @ api.js?onload=captchaLoad&render=explicit:4
i @ helpers.js:72
setTimeout
(anonymous) @ trycatch.js:86
(anonymous) @ api.js?onload=captchaLoad&render=explicit:4
Zt @ api.js?onload=captchaLoad&render=explicit:4
Gt @ api.js?onload=captchaLoad&render=explicit:4
Yt @ api.js?onload=captchaLoad&render=explicit:4
(anonymous) @ api.js?onload=captchaLoad&render=explicit:4
Kt.load @ api.js?onload=captchaLoad&render=explicit:4
$t @ api.js?onload=captchaLoad&render=explicit:4
(anonymous) @ api.js?onload=captchaLoad&render=explicit:4
Promise.then
(anonymous) @ api.js?onload=captchaLoad&render=explicit:4
or @ api.js?onload=captchaLoad&render=explicit:4
(anonymous) @ api.js?onload=captchaLoad&render=explicit:4
(anonymous) @ api.js?onload=captchaLoad&render=explicit:4
(anonymous) @ api.js?onload=captchaLoad&render=explicit:4
i @ helpers.js:72
setTimeout
(anonymous) @ trycatch.js:86
(anonymous) @ api.js?onload=captchaLoad&render=explicit:4
(anonymous) @ api.js?onload=captchaLoad&render=explicit:4
(anonymous) @ api.js?onload=captchaLoad&render=explicit:4
(anonymous) @ api.js?onload=captchaLoad&render=explicit:4
7XHR finished loading: POST "<URL>". after paying the log is as follows: react-router-dom.js?v=646410be:4413 ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition.

react-router-dom.js?v=646410be:4413 ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath.
logger.ts:52 [DEBUG] Checking subscription status
highlighter-menu.js:388 Fetch finished loading: GET "chrome-extension://llimhhconnjiflfimocjggfjdlmlhblm/highlighter-menu.html".
toolbar.js:714 Fetch finished loading: GET "chrome-extension://llimhhconnjiflfimocjggfjdlmlhblm/toolbar.html".
logger.ts:52 [DEBUG] Checking subscription status
logger.ts:52 [DEBUG] Session is valid
{userId: 'd9b18d67-9734-4cae-9a4a-c8fd2c6bf143', expiresAt: 1763661917}
logger.ts:52 [DEBUG] Session is valid
{userId: 'd9b18d67-9734-4cae-9a4a-c8fd2c6bf143', expiresAt: 1763661917}
stripe.ts:240 Fetch finished loading: POST "https://gqalsczfephexbserzqp.supabase.co/functions/v1/check-subscription".
logger.ts:52 [DEBUG] Subscription status retrieved
{status: 'expired', hasAccess: false}
logger.ts:52 [DEBUG] Subscription status retrieved
{status: 'expired', hasAccess: false}
stripe.ts:240 Fetch finished loading: POST "https://gqalsczfephexbserzqp.supabase.co/functions/v1/check-subscription". and after clicking "back to dashboard" the log looks like this: :5173/app/dashboard:1 Error in event handler: TypeError: Cannot read properties of null (reading 'tagName')
at Readability.\_grabArticle (chrome-extension://llimhhconnjiflfimocjggfjdlmlhblm/js/plugins/readability.js:1140:37)
at Readability.parse (chrome-extension://llimhhconnjiflfimocjggfjdlmlhblm/content-script.js:94:61)
at Object.article (chrome-extension://llimhhconnjiflfimocjggfjdlmlhblm/content-script.js:148:44)
at Object.article (chrome-extension://llimhhconnjiflfimocjggfjdlmlhblm/content-script.js:198:23)
at Object.init (chrome-extension://llimhhconnjiflfimocjggfjdlmlhblm/content-script.js:570:19)
at chrome-extension://llimhhconnjiflfimocjggfjdlmlhblm/content-script.js:514:23Understand this error
@supabase_supabase-js.js?v=646410be:7428 Fetch finished loading: GET "https://gqalsczfephexbserzqp.supabase.co/rest/v1/word_lists?select=*&order=created_at.desc".
(anonymous) @ @supabase_supabase-js.js?v=646410be:7428
(anonymous) @ @supabase_supabase-js.js?v=646410be:7446
await in (anonymous)
then @ @supabase_supabase-js.js?v=646410be:632
@supabase_supabase-js.js?v=646410be:7428 Fetch failed loading: HEAD "https://gqalsczfephexbserzqp.supabase.co/rest/v1/words?select=*&list_id=eq.038806bb-9567-4188-a3aa-c8ce925821d5".
(anonymous) @ @supabase_supabase-js.js?v=646410be:7428
(anonymous) @ @supabase_supabase-js.js?v=646410be:7446
await in (anonymous)
then @ @supabase_supabase-js.js?v=646410be:632
@supabase_supabase-js.js?v=646410be:7428 Fetch failed loading: HEAD "https://gqalsczfephexbserzqp.supabase.co/rest/v1/words?select=*&list_id=eq.05407c86-444e-43f9-aca3-4aec09b844b6".
(anonymous) @ @supabase_supabase-js.js?v=646410be:7428
(anonymous) @ @supabase_supabase-js.js?v=646410be:7446
await in @supabase_supabase-js.js?v=646410be:632
@supabase_supabase-js.js?v=646410be:7428 Fetch finished loading: GET "https://gqalsczfephexbserzqp.supabase.co/rest/v1/words?select=id%2Clist_id%2Cterm%2Ctranslation%2Cdefinition%2Cexample_sentence%2Ccreated_at%2Cword_lists%21inner%28id%2Cname%2Csource_language%2Ctarget_language%2Cuser_id%29%2Cword_progress%21left%28id%2Cuser_id%2Cword_id%2Cstage%2Cease_factor%2Cinterval_days%2Cnext_review_date%2Clast_reviewed_at%2Ctotal_reviews%2Ccorrect_reviews%2Cincorrect_reviews%2Ccurrent_streak%2Cupdated_at%29&word_lists.user_id=eq.d9b18d67-9734-4cae-9a4a-c8fd2c6bf143&word_progress.user_id=eq.d9b18d67-9734-4cae-9a4a-c8fd2c6bf143".
(anonymous) @ @supabase_supabase-js.js?v=646410be:7428
(anonymous) @ @supabase_supabase-js.js?v=646410be:7446
await in (anonymous)
then @ @supabase_supabase-js.js?v=646410be:632
srs.ts:132 [SRS API] Filter breakdown: 0 new words, 0 already reviewed today, 0 not due yet
srs.ts:134 [SRS API] Found 492 total words, 492 due today (filtered out 0 not due or already reviewed)
srs.ts:136 [SRS API] Sample due words: (5) ['TIME (next: 2025-11-19)', 'LIFE (next: 2025-11-20)', 'YEAR (next: 2025-11-20)', 'WORK (next: 2025-11-20)', 'PART (next: 2025-11-19)'] . when i go back to the subscription page it still says i am in free tier, i am unsure if that is a ui problem or a backend problem, either way, we need to fix this..

## 1. Goal & Context

The subscription system has critical issues where users can complete payment through Stripe Checkout but subscription status is not properly updated in UI or backend. The user reports being stuck in "free tier" even after successful payment, with console errors indicating webhook and subscription status checking problems.

**Key Requirements:**

- Fix Stripe webhook processing to properly update subscription status after payment
- Resolve subscription status checking issues (returns 'expired' even after payment)
- Eliminate console errors during checkout process
- Ensure UI correctly reflects subscription status after successful payment
- Debug and fix disconnect between payment completion and subscription activation

**User Flow:**

1. User clicks "upgrade subscription" button
2. User is redirected to Stripe Checkout (with console errors)
3. User completes payment successfully
4. User returns to application but subscription still shows "free tier"
5. Subscription status check returns 'expired' despite successful payment
6. User experience is broken - paid features remain locked

## 2. Requirements

### Functional:

- [ ] Fix Stripe webhook handler to properly process successful payments
- [ ] Ensure subscription status is correctly updated in database after payment
- [ ] Fix subscription status checking logic to return accurate status
- [ ] Eliminate console errors during Stripe Checkout process
- [ ] Ensure UI updates to reflect correct subscription tier after payment
- [ ] Add proper error handling and logging for subscription flows
- [ ] Verify webhook endpoint security and proper event processing
- [ ] Test end-to-end subscription flow from checkout to activation

### Non-Functional:

- [ ] Ensure webhook processing is reliable and idempotent
- [ ] Add comprehensive logging for debugging subscription issues
- [ ] Implement proper error boundaries for subscription-related components
- [ ] Ensure subscription status checks are performant and cached appropriately
- [ ] Add monitoring/alerting for webhook failures
- [ ] Validate subscription data integrity across database tables

## 3. Architecture & Research

### Codebase Impact

**Files to Modify:**

- `supabase/functions/stripe-webhook/index.ts` (lines 184-222)
  - Current state: handleCheckoutCompleted sets status to 'trial' for subscriptions with trial period
  - Required change: For paid subscriptions (no trial), set status to 'active' immediately; add logging for subscription status mapping

- `supabase/functions/stripe-webhook/index.ts` (lines 309-351)
  - Current state: handlePaymentSucceeded hardcodes status to 'active' without checking subscription status
  - Required change: Use mapStripeStatus(subscription.status) instead of hardcoded 'active'; add comprehensive error logging

- `supabase/functions/stripe-webhook/index.ts` (lines 58-67)
  - Current state: mapStripeStatus maps 'trialing' to 'trial'
  - Required change: Ensure 'trialing' status is handled correctly in subscription flow

- `supabase/functions/check-subscription/index.ts` (lines 178-216)
  - Current state: Trial expiry logic immediately sets status to 'expired' without checking payment status
  - Required change: Before marking trial as expired, check if user has stripe_customer_id (indicating payment attempt) and query Stripe for subscription status

- `src/hooks/useSubscription.ts` (lines 58-76)
  - Current state: React Query cache may hold stale 'expired' status after payment completion
  - Required change: Add query invalidation after successful checkout redirect; reduce stale time for subscription queries

- `src/lib/api/stripe.ts` (lines 191-281)
  - Current state: checkSubscriptionStatus may fail with expired sessions during status checks
  - Required change: Add retry logic for session refresh failures; improve error classification for subscription checks

- `src/pages/Settings/SubscriptionSettings.tsx` (lines 161-172)
  - Current state: Success/cancel URLs don't trigger subscription status refresh
  - Required change: Add useEffect to refetch subscription status when component mounts after redirect from Stripe

**Files to Create:**

- `src/hooks/usePostPayment.ts`
  - Purpose: Enhanced post-payment handling with Stripe session verification
  - Pattern: Follow useCheckout.ts pattern with React Query invalidation and error handling

- `supabase/functions/stripe-webhook/test-webhook.ts`
  - Purpose: Test webhook event processing and database updates
  - Pattern: Follow existing Edge Function structure with comprehensive logging

- `scripts/test-stripe-webhooks.sh`
  - Purpose: Local webhook testing script using Stripe CLI
  - Pattern: Follow existing shell script patterns (like WEBHOOK_SECRET_QUICK_FIX.sh)

**Existing Files Verified:**

- `src/pages/SubscriptionSuccess.tsx` (lines 17-20)
  - Current state: Already refetches subscription status on mount
  - Status: ✅ Working correctly, no changes needed

**Existing Patterns Identified:**

- **Webhook handling:** Uses service role client for database updates (correct pattern)
- **Subscription status:** Mapped from Stripe status to internal status (trial/active/expired)
- **API error handling:** Custom StripeApiError class with status codes
- **React Query caching:** 5-minute stale time for subscription data
- **Database updates:** Direct SQL updates in webhooks using service role

**Dependencies Status:**

- ✅ @stripe/stripe-js: ^3.0.0 (installed - frontend Stripe.js)
- ✅ @supabase/supabase-js: ^2.39.0 (installed)
- ✅ @tanstack/react-query: ^5.20.0 (installed)
- ⚠️ Stripe webhook testing: No testing utilities found - recommend adding stripe-cli for local webhook testing
- ✅ Database schema: Users table has stripe_customer_id, subscription_status, subscription_end_date fields

**Critical Issues Identified:**

1. **Webhook Event Processing Gap**: `checkout.session.completed` sets status to 'trial' for subscriptions with trial, but `invoice.payment_succeeded` may not fire immediately or may fail silently, leaving users in expired trial status.

2. **Trial Expiry Race Condition**: User completes payment → status='trial' → trial expires before invoice event processes → status becomes 'expired' → invoice event finally processes but user sees 'expired' due to caching.

3. **Missing Payment Success Confirmation**: No mechanism to confirm payment succeeded and subscription activated when user returns from Stripe checkout.

4. **Silent Webhook Failures**: Webhook error handling returns 500 but doesn't alert developers to processing failures.

5. **Frontend Cache Issues**: React Query may cache 'expired' status and not refetch after successful payment redirect.

6. **Database Query Issues**: `check-subscription` creates trial users but doesn't verify Stripe subscription status for users with `stripe_customer_id`.

7. **Event Metadata Confusion**: Webhook uses different metadata sources (`session.metadata` vs `subscription.metadata`) which may cause user lookup failures.

## 4. Tech Stack Specifications

### Supabase (Backend)

[TODO: @supabase-specialist - SQL Schema, RLS Policies, Database Functions, Realtime subscriptions]

### Stripe (Payments)

#### Webhook Handler Issues

**Current Problems Identified:**

1. **Event Processing Gap**: `checkout.session.completed` sets status to 'trial' for subscriptions with trial period, but `invoice.payment_succeeded` may not fire immediately, leaving users stuck in expired trial status.

2. **Status Mapping Bug**: `handlePaymentSucceeded` hardcodes status to 'active' instead of using `mapStripeStatus(subscription.status)`, potentially overriding correct Stripe status.

3. **Trial Expiry Race Condition**: User completes payment → status='trial' → trial expires before invoice event → status becomes 'expired' → invoice event processes but user sees cached 'expired'.

4. **Metadata Inconsistency**: Webhook handlers use different metadata sources (`session.metadata` vs `subscription.metadata`) causing user lookup failures.

5. **Silent Failures**: Webhook errors return 500 but don't provide detailed logging for debugging payment issues.

**Specific Code Issues:**

- `supabase/functions/stripe-webhook/index.ts:340`: Hardcoded `'active'` instead of `mapStripeStatus(subscription.status)`
- `supabase/functions/stripe-webhook/index.ts:211`: Uses `mapStripeStatus(subscription.status)` which may be 'trialing' for trial subscriptions
- `supabase/functions/check-subscription/index.ts:202-215`: Trial expiry logic immediately sets status to 'expired' without checking Stripe subscription status

#### Payment Flow Analysis

**Current Flow Issues:**

1. **Checkout Creation**: Creates subscription with 7-day trial (`trial_period_days: 7`)
2. **Webhook Processing**: `checkout.session.completed` sets status to 'trial' (mapped from 'trialing')
3. **Trial Expiry**: `check-subscription` expires trial without checking if payment was completed
4. **Invoice Events**: `invoice.payment_succeeded` may process after trial expiry, but status remains 'expired'

**Race Condition Scenario:**

```
Time 0: User completes checkout → status = 'trial' (7 days remaining)
Time 6 days: Trial expires → status = 'expired' (cached in React Query)
Time 6.5 days: invoice.payment_succeeded fires → status = 'active' (but user sees cached 'expired')
```

#### Security & Reliability Issues

**Current Security Gaps:**

1. **Webhook Signature Verification**: ✅ Working correctly with proper error handling
2. **Idempotency**: ❌ No event deduplication - events could be processed multiple times
3. **Error Recovery**: ❌ Silent failures without alerting mechanisms
4. **Logging**: ⚠️ Basic logging but missing critical payment flow tracking

**Reliability Issues:**

1. **Event Ordering**: Stripe events may arrive out of order
2. **Webhook Retries**: Stripe retries failed webhooks but no local retry logic
3. **Database Consistency**: No transaction handling for webhook updates
4. **Session Management**: Frontend may cache stale subscription status

#### Specific Fixes Required

**1. Fix Status Mapping in Webhook Handler:**

```typescript
// supabase/functions/stripe-webhook/index.ts:309-351
async function handlePaymentSucceeded(supabase: any, stripe: Stripe, invoice: Stripe.Invoice) {
  // ... existing code ...

  // FIX: Use mapStripeStatus instead of hardcoded 'active'
  const { error } = await supabase
    .from('users')
    .update({
      subscription_status: mapStripeStatus(subscription.status), // Was: 'active'
      subscription_end_date: subscriptionEndDate.toISOString(),
    })
    .eq('id', user.id)
}
```

**2. Add Trial Payment Verification:**

```typescript
// supabase/functions/check-subscription/index.ts:178-216
// BEFORE checking trial expiry, verify if user has active Stripe subscription
if (userData.subscription_status === 'trial' && userData.stripe_customer_id) {
  try {
    // Query Stripe for current subscription status
    const stripeSubscription = await stripe.subscriptions.list({
      customer: userData.stripe_customer_id,
      status: 'active',
      limit: 1,
    })

    if (stripeSubscription.data.length > 0) {
      // User has active paid subscription, override trial expiry
      hasAccess = true
      status = 'active'
      message = 'Your subscription is active'
      // Update database status to prevent future checks
      await serviceClient.from('users').update({ subscription_status: 'active' }).eq('id', user.id)
      continue // Skip trial expiry logic
    }
  } catch (stripeError) {
    console.error('[check-subscription] Stripe verification failed:', stripeError)
    // Continue with normal trial logic if Stripe check fails
  }
}
```

**3. Add Webhook Event Deduplication:**

```typescript
// supabase/functions/stripe-webhook/index.ts
// Add event deduplication table check
const { data: existingEvent, error: eventCheckError } = await supabase
  .from('stripe_webhook_events')
  .select('id')
  .eq('event_id', receivedEvent.id)
  .single()

if (existingEvent) {
  console.log(`Event ${receivedEvent.id} already processed, skipping`)
  return new Response(JSON.stringify({ ok: true, skipped: true }), { status: 200 })
}

// Process event...

// After successful processing, log the event
await supabase.from('stripe_webhook_events').insert({
  event_id: receivedEvent.id,
  event_type: receivedEvent.type,
  processed_at: new Date().toISOString(),
  customer_id: receivedEvent.data.object.customer,
})
```

**4. Fix Metadata Consistency:**

```typescript
// supabase/functions/stripe-webhook/index.ts:184-222
async function handleCheckoutCompleted(
  supabase: any,
  stripe: Stripe,
  session: Stripe.Checkout.Session
) {
  const userId = session.metadata?.supabase_user_id
  const customerId = session.customer as string
  const subscriptionId = session.subscription as string

  if (!userId) {
    console.error('No supabase_user_id in session metadata')
    return
  }

  // Get subscription details to ensure we have correct status
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  // Use subscription.metadata if session.metadata is missing
  const metadataUserId = subscription.metadata?.supabase_user_id || userId

  // Update with correct status mapping
  const { error } = await supabase
    .from('users')
    .update({
      stripe_customer_id: customerId,
      subscription_status: mapStripeStatus(subscription.status), // Use actual subscription status
      subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('id', metadataUserId)
}
```

**5. Add Post-Payment Status Refresh:**

```typescript
// src/hooks/useSubscription.ts:58-76
const query = useQuery<SubscriptionStatusResponse>({
  queryKey: ['subscription', user?.id],
  queryFn: checkSubscriptionStatus,
  enabled: !loading && isAuthenticated && !!user?.id,
  staleTime: 2 * 60 * 1000, // Reduced from 5 minutes to 2 minutes
  gcTime: 10 * 60 * 1000,
  // Add refetch on window focus to catch payment completion
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
})

// Add subscription status invalidation after checkout
export function usePostPaymentRefresh() {
  const queryClient = useQueryClient()

  const invalidateSubscription = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['subscription'] })
  }, [queryClient])

  return { invalidateSubscription }
}
```

**6. Add Enhanced Logging:**

```typescript
// supabase/functions/stripe-webhook/index.ts
console.log(`🔔 Event received: ${receivedEvent.id} - Type: ${receivedEvent.type}`, {
  customer: receivedEvent.data.object.customer,
  subscription: receivedEvent.data.object.subscription,
  amount: receivedEvent.data.object.amount_total || receivedEvent.data.object.amount,
  status: receivedEvent.data.object.status,
})

// After processing
console.log(`✅ Successfully processed ${receivedEvent.type}`, {
  eventId: receivedEvent.id,
  customerId: receivedEvent.data.object.customer,
  userId: user?.id || 'not found',
  newStatus: updatedStatus,
  subscriptionEndDate: subscriptionEndDate?.toISOString(),
})
```

#### Database Schema Changes Required

**Add Webhook Events Table:**

```sql
-- Migration: Add webhook event deduplication
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  customer_id TEXT,
  subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_event_id ON stripe_webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_customer_id ON stripe_webhook_events(customer_id);
```

#### Testing Strategy

**1. Local Webhook Testing:**

```bash
# Install Stripe CLI
npm install -g stripe

# Forward webhooks to local development
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger invoice.payment_succeeded
stripe trigger customer.subscription.updated
```

**2. Test Scenarios:**

- **Happy Path**: Checkout → Payment Success → Status becomes 'active'
- **Trial Expiry Race**: Checkout → Trial Expires → Payment Success → Status becomes 'active'
- **Failed Payment**: Checkout → Payment Fails → Status becomes 'past_due'
- **Webhook Retry**: Simulate webhook failure → Verify retry handling
- **Event Deduplication**: Send duplicate events → Verify only processed once

**3. Monitoring Queries:**

```sql
-- Check webhook event processing
SELECT event_type, COUNT(*) as count, MAX(processed_at) as last_processed
FROM stripe_webhook_events
GROUP BY event_type
ORDER BY last_processed DESC;

-- Check subscription status consistency
SELECT
  u.id,
  u.email,
  u.subscription_status,
  u.stripe_customer_id,
  CASE
    WHEN u.stripe_customer_id IS NOT NULL THEN 'Has Stripe Customer'
    ELSE 'No Stripe Customer'
  END as stripe_status
FROM users u
WHERE u.subscription_status IN ('trial', 'expired')
  AND u.stripe_customer_id IS NOT NULL;
```

#### Environment Variables Required

```env
# Server-side (Supabase Edge Functions)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Client-side (Vite)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_STRIPE_MONTHLY_PRICE_ID=price_...
```

#### Deployment Checklist

- [ ] Update webhook handler with status mapping fix
- [ ] Add Stripe verification in check-subscription for trial users
- [ ] Create stripe_webhook_events table
- [ ] Add event deduplication logic
- [ ] Update frontend cache settings
- [ ] Test with Stripe CLI
- [ ] Deploy and monitor webhook logs
- [ ] Verify payment flow end-to-end

#### Best Practices Implemented

- ✅ **Webhook Security**: Signature verification with proper error handling
- ✅ **Idempotency**: Event deduplication prevents duplicate processing
- ✅ **Error Recovery**: Comprehensive logging and error classification
- ✅ **Status Synchronization**: Real-time sync between Stripe and database
- ✅ **Cache Management**: Reduced stale time and added invalidation triggers
- ✅ **Race Condition Handling**: Stripe verification before trial expiry
- ✅ **Metadata Consistency**: Unified user lookup across all webhook events
- ✅ **Monitoring**: Detailed logging for payment flow debugging

This comprehensive fix addresses all identified issues and ensures reliable subscription payment processing with proper status synchronization between Stripe and the application database.

### React + Shadcn/UI (Frontend)

#### Current Frontend Issues

**1. Cache Staleness Problem:**

- React Query caches subscription status for 5 minutes
- After successful payment, user still sees 'expired' status due to cached data
- No automatic cache invalidation after checkout completion

**2. Missing Post-Payment Refresh:**

- `SubscriptionSettings.tsx` doesn't refresh subscription status after Stripe redirect
- `SubscriptionSuccess.tsx` already handles refresh but users may navigate to settings first
- No global mechanism to update subscription state across components

**3. Error Handling Gaps:**

- No retry mechanism for failed subscription status checks
- Limited error classification for better user experience
- Missing loading states during post-payment refresh

#### Frontend Fixes Implemented

**1. Enhanced Subscription Hook:**

```typescript
// src/hooks/useSubscription.ts:58-76
const query = useQuery<SubscriptionStatusResponse>({
  queryKey: ['subscription', user?.id],
  queryFn: checkSubscriptionStatus,
  enabled: !loading && isAuthenticated && !!user?.id,
  staleTime: 2 * 60 * 1000, // Reduced from 5 minutes to 2 minutes
  gcTime: 10 * 60 * 1000,
  // Add refetch on window focus to catch payment completion
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
})
```

**2. Post-Payment Refresh Hook:**

```typescript
// src/hooks/usePostPayment.ts (NEW FILE)
export function usePostPayment() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const invalidateSubscription = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ['subscription', user?.id],
      exact: true,
    })
  }, [queryClient, user?.id])

  const refreshSubscription = useCallback(async () => {
    await queryClient.refetchQueries({
      queryKey: ['subscription', user?.id],
      exact: true,
      type: 'active',
    })
  }, [queryClient, user?.id])

  return { invalidateSubscription, refreshSubscription }
}
```

**3. Enhanced Subscription Settings Component:**

```typescript
// src/pages/Settings/SubscriptionSettings.tsx:17-40
import { usePostPayment } from '@/hooks/usePostPayment'

export function SubscriptionSettings() {
  const { refreshSubscription } = usePostPayment()

  // Refresh subscription status after returning from Stripe checkout
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const sessionId = urlParams.get('session_id')

    if (sessionId) {
      console.log('Detected Stripe checkout return, refreshing subscription status')
      refreshSubscription()

      // Clean up URL parameter
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('session_id')
      window.history.replaceState({}, '', newUrl.toString())
    }
  }, [refreshSubscription])
}
```

**4. Enhanced Error Handling:**

```typescript
// src/lib/api/stripe.ts:191-281
export async function checkSubscriptionStatus(): Promise<SubscriptionStatusResponse> {
  try {
    // 1. Check if user is authenticated and session is valid
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      logger.error('Failed to get session', { error: sessionError })
      throw new StripeApiError('Authentication session error. Please log in again.', 401)
    }

    // 2. Check if session is about to expire (within 5 minutes)
    const expiresAt = sessionData.session?.expires_at
    if (expiresAt) {
      const expiryTime = expiresAt * 1000
      const now = Date.now()
      const timeUntilExpiry = expiryTime - now
      const fiveMinutes = 5 * 60 * 1000

      if (timeUntilExpiry < fiveMinutes) {
        logger.debug('Session expiring soon, refreshing...')
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()

        if (refreshError) {
          throw new StripeApiError('Failed to refresh session. Please log in again.', 401)
        }
      }
    }

    // 3. Invoke the Edge Function with refreshed session
    const { data, error } = await supabase.functions.invoke('check-subscription', {
      headers: {
        Authorization: `Bearer ${sessionData.session.access_token}`,
      },
    })

    if (error) {
      // Enhanced error classification
      if (error.status === 401 || error.message?.includes('Unauthorized')) {
        throw new StripeApiError(
          'Authentication failed. Please log out and log in again.',
          401,
          'AUTH_FAILED'
        )
      }
      throw new StripeApiError(error.message || 'Failed to check subscription status', error.status)
    }

    return data as SubscriptionStatusResponse
  } catch (error) {
    if (error instanceof StripeApiError) {
      throw error
    }
    throw new StripeApiError(
      error instanceof Error ? error.message : 'Unknown error checking subscription status'
    )
  }
}
```

#### UI Components to Use

**1. Status Badges:**

```typescript
// Use existing Badge component with status colors
<Badge variant={isActive ? 'default' : 'secondary'}>
  {subscription?.status}
</Badge>
```

**2. Loading States:**

```typescript
// Use existing Loader2 component for loading states
<Loader2 className="w-4 h-4 animate-spin" />
```

**3. Alert Components:**

```typescript
// Use existing AlertCircle for error states
<AlertCircle className="w-4 h-4 text-destructive" />
```

**4. Button Components:**

```typescript
// Use existing Button component with proper loading states
<Button
  onClick={handleUpgrade}
  disabled={checkoutPending}
>
  {checkoutPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
  Upgrade Subscription
</Button>
```

#### State Management Strategy

**1. React Query Configuration:**

- **Query Key**: `['subscription', user?.id]` for user-specific caching
- **Stale Time**: 2 minutes (reduced from 5 for faster updates)
- **Cache Time**: 10 minutes for offline support
- **Refetch Triggers**: Window focus, reconnection, manual refresh

**2. Cache Invalidation Strategy:**

```typescript
// After successful checkout
queryClient.invalidateQueries({ queryKey: ['subscription'] })

// After webhook confirmation
queryClient.refetchQueries({ queryKey: ['subscription'] })

// On user logout
queryClient.removeQueries({ queryKey: ['subscription'] })
```

**3. Error Recovery:**

```typescript
// Retry failed requests with exponential backoff
retry: (failureCount, error: Error) => {
  if (error instanceof StripeApiError && error.statusCode === 401) {
    return false // Don't retry auth errors
  }
  return failureCount < 3 // Retry network errors up to 3 times
}
```

#### User Experience Improvements

**1. Immediate Feedback:**

- Show loading state during post-payment refresh
- Display success message after payment completion
- Clear URL parameters after processing

**2. Error Communication:**

- Classify errors (auth, network, server) for appropriate messaging
- Provide retry buttons for recoverable errors
- Show helpful error messages with action items

**3. Progressive Enhancement:**

- Graceful degradation if webhooks fail
- Manual refresh option for users
- Fallback to database status if Stripe API unavailable

#### Testing Strategy

**1. Component Testing:**

```typescript
// Test subscription status refresh after checkout
test('refreshes subscription status after checkout redirect', async () => {
  const { refreshSubscription } = renderHook(() => usePostPayment())

  // Mock URL with session_id parameter
  Object.defineProperty(window, 'location', {
    value: { search: '?session_id=cs_test_123' },
    writable: true,
  })

  // Verify refresh is called
  await waitFor(() => {
    expect(refreshSubscription).toHaveBeenCalled()
  })
})
```

**2. Integration Testing:**

```typescript
// Test end-to-end payment flow
test('complete payment flow updates subscription status', async () => {
  // 1. Start checkout
  const { startCheckout } = renderHook(() => useCheckout())
  await act(() => startCheckout())

  // 2. Mock successful payment
  mockStripeWebhook('checkout.session.completed')

  // 3. Verify status update
  const { data: subscription } = renderHook(() => useSubscription())
  await waitFor(() => {
    expect(subscription.status).toBe('active')
  })
})
```

**3. Manual Testing Scenarios:**

- Complete checkout and verify status updates
- Test with slow network connections
- Verify error handling for failed payments
- Test cache invalidation across multiple tabs
- Verify URL parameter cleanup after redirect

#### Performance Optimizations

**1. Query Optimization:**

- Reduced stale time for faster updates
- Selective refetching only when needed
- Background refetching on window focus

**2. Bundle Optimization:**

- Lazy load Stripe components
- Code split payment-related features
- Optimize React Query cache size

**3. Network Optimization:**

- Debounce rapid status checks
- Use HTTP caching headers where possible
- Implement request deduplication

This comprehensive frontend fix ensures users see immediate subscription status updates after payment completion, with proper error handling and user experience improvements.

## 5. Implementation Plan

### Phase 1: Database Schema & Webhook Infrastructure

- [ ] Create `stripe_webhook_events` table for event deduplication
- [ ] Add RLS policies for webhook events table
- [ ] Create indexes for fast webhook event lookups
- [ ] Test webhook events table creation and permissions

**Git Commit:** `feat(subscription): add webhook event deduplication infrastructure`

---

### Phase 2: Webhook Handler Fixes

- [ ] Fix status mapping in `handlePaymentSucceeded` (use `mapStripeStatus` instead of hardcoded 'active')
- [ ] Add event deduplication logic to prevent duplicate processing
- [ ] Enhance logging with detailed payment flow information
- [ ] Update all webhook handlers to return processing results for tracking
- [ ] Add webhook event logging to database after successful processing

**Git Commit:** `fix(webhook): fix status mapping and add event deduplication`

---

### Phase 3: Subscription Status Verification

- [ ] Add Stripe verification in `check-subscription` for trial users with `stripe_customer_id`
- [ ] Implement trial expiry race condition protection
- [ ] Add automatic database status updates when active Stripe subscription found
- [ ] Enhance error handling for Stripe API failures in status checks
- [ ] Add comprehensive logging for subscription status verification

**Git Commit:** `fix(subscription): add Stripe verification for trial expiry race conditions`

---

### Phase 4: Frontend Cache Management

- [ ] Reduce subscription query stale time from 5 minutes to 2 minutes
- [ ] Add `refetchOnWindowFocus` and `refetchOnReconnect` to subscription queries
- [ ] Create `usePostPayment` hook for post-payment subscription refresh
- [ ] Add session refresh logic for expiring authentication tokens
- [ ] Enhance error classification in subscription status API calls

**Git Commit:** `feat(frontend): improve subscription cache management and error handling`

---

### Phase 5: Post-Payment UI Updates

- [ ] Add subscription status refresh after Stripe checkout redirect in `SubscriptionSettings`
- [ ] Implement URL parameter cleanup after processing checkout return
- [ ] Add loading states during post-payment refresh
- [ ] Update `SubscriptionSuccess` component with enhanced error handling
- [ ] Add manual refresh option for users experiencing stale status

**Git Commit:** `feat(ui): add post-payment subscription status refresh`

---

### Phase 6: Testing Infrastructure

- [ ] Create `scripts/test-stripe-webhooks.sh` for local webhook testing
- [ ] Add webhook event testing scenarios (checkout, payment, failure, race condition)
- [ ] Create monitoring queries for webhook event processing
- [ ] Add integration tests for end-to-end payment flow
- [ ] Set up Stripe CLI webhook forwarding for local development

**Git Commit:** `test(subscription): add webhook testing infrastructure and monitoring`

---

### Phase 7: Error Handling & Monitoring

- [ ] Add comprehensive error logging for all webhook events
- [ ] Implement webhook failure alerting mechanisms
- [ ] Add subscription status consistency monitoring queries
- [ ] Create dashboard for webhook event processing status
- [ ] Add automated health checks for subscription synchronization

**Git Commit:** `feat(monitoring): add webhook error handling and subscription monitoring`

---

### Phase 8: Testing & Validation

**Automated Tests:**

- [ ] Unit test: `mapStripeStatus` function with all Stripe status values
- [ ] Unit test: webhook event deduplication logic
- [ ] Integration test: complete checkout to subscription activation flow
- [ ] Integration test: trial expiry race condition scenario
- [ ] E2E test: payment completion with UI status update

**Manual Validation:**

- [ ] Test complete payment flow from checkout to activation
- [ ] Verify subscription status updates across multiple browser tabs
- [ ] Test webhook failure scenarios and retry mechanisms
- [ ] Validate trial expiry protection with real Stripe payments
- [ ] Test error handling for network failures and API errors

**Performance Validation:**

- [ ] Measure subscription status check response times
- [ ] Verify webhook processing latency under load
- [ ] Test concurrent payment processing scenarios
- [ ] Validate database query performance with webhook events table

**Git Commit:** `test(subscription): add comprehensive tests and validate payment flow`

---

### Phase 9: Documentation & Deployment

- [ ] Update API documentation for webhook event handling
- [ ] Create troubleshooting guide for subscription payment issues
- [ ] Document webhook testing procedures for developers
- [ ] Add deployment checklist for subscription system changes
- [ ] Create monitoring dashboard setup instructions

**Git Commit:** `docs(subscription): update documentation and deployment procedures`

---

### Phase 10: Production Rollout

- [ ] Deploy webhook handler changes to staging environment
- [ ] Test payment flow with Stripe test mode in staging
- [ ] Monitor webhook event processing in staging
- [ ] Deploy database schema changes to production
- [ ] Roll out webhook handler changes to production with monitoring
- [ ] Verify payment flow with real transactions in production

**Git Commit:** `release(subscription): deploy payment completion fixes to production`

---

## Implementation Notes

### Critical Path Dependencies

1. **Phase 1** must complete before **Phase 2** (webhook deduplication requires database table)
2. **Phase 2** must complete before **Phase 3** (status verification relies on fixed webhook handlers)
3. **Phase 4** should complete before **Phase 5** (cache management needed for UI updates)
4. **Phase 6** can run in parallel with **Phase 4-5** (testing infrastructure independent)

### Risk Mitigation

- **Database Changes**: Use migration rollback procedures and test in staging first
- **Webhook Changes**: Implement feature flags to enable/disable new logic
- **Frontend Changes**: Use gradual rollout with error boundaries
- **Payment Flow**: Test extensively with Stripe test mode before production

### Success Metrics

- **Payment Success Rate**: >99% of successful payments result in active subscription status
- **Status Update Latency**: <30 seconds from payment completion to status update
- **Error Rate**: <0.1% webhook processing failures
- **User Experience**: No users stuck in 'expired' status after successful payment

### Monitoring Requirements

- Webhook event processing success/failure rates
- Subscription status consistency between Stripe and database
- Payment completion to activation time metrics
- Error rates and patterns in subscription flows

This implementation plan addresses all identified issues with the subscription payment completion system, ensuring reliable status synchronization between Stripe and the application database.
