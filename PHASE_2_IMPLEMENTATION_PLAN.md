# 🚀 Phase 2: Frontend UI Integration - Implementation Plan

## ✅ Current Status

### Backend (Phase 1) - COMPLETE
- ✅ Stripe webhook working (200 OK responses)
- ✅ Database updates on subscription events
- ✅ All Edge Functions deployed:
  - `stripe-webhook` - Handles Stripe events ✅
  - `create-checkout` - Creates checkout sessions ✅
  - `check-subscription` - Validates subscription status ✅
  - `create-portal-session` - Customer portal access ✅

### Frontend Code - COMPLETE (Needs Testing)
- ✅ Stripe API client (`src/lib/api/stripe.ts`)
- ✅ React hooks:
  - `useSubscription` - Subscription status management
  - `useCheckout` - Checkout flow handling
  - `useCustomerPortal` - Portal session management
- ✅ UI Components:
  - `SubscriptionSettings` - Full settings page
  - `SubscriptionSuccess` - Post-checkout success page
  - `SubscriptionCancel` - Checkout cancellation page
- ✅ Routes configured in App.tsx
- ✅ Environment variables set in `.env.local`

---

## 🎯 Phase 2 Objectives

### Primary Goals
1. **Verify all UI components work correctly**
2. **Test the complete checkout flow end-to-end**
3. **Ensure subscription status updates in real-time**
4. **Validate customer portal integration**
5. **Test edge cases and error handling**

### Success Criteria
- ✅ User can navigate to subscription settings
- ✅ Subscription status displays correctly
- ✅ "Start Free Trial" button redirects to Stripe Checkout
- ✅ Checkout success redirects back to app
- ✅ Database updates after successful checkout
- ✅ "Manage Subscription" opens Stripe Customer Portal
- ✅ Subscription status updates after changes
- ✅ Error states display properly

---

## 📋 Implementation Steps

### Step 1: Environment Variable Verification ✅

**Status:** COMPLETE - Variables already set in `.env.local`

```bash
# Verify these are set:
VITE_SUPABASE_URL=https://gqalsczfephexbserzqp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51SSzCtEHSkTUloij...
VITE_STRIPE_MONTHLY_PRICE_ID=price_1SUvPDEHSkTUloijL1ChpOaT
```

**Actions:** None needed - already configured

---

### Step 2: Deploy All Edge Functions

**Status:** NEEDS VERIFICATION

```bash
# Deploy all Stripe-related functions
supabase functions deploy create-checkout
supabase functions deploy check-subscription
supabase functions deploy create-portal-session
supabase functions deploy stripe-webhook  # Already deployed

# Verify all are deployed
supabase functions list
```

**Expected output:**
```
create-checkout         │ deployed
check-subscription      │ deployed
create-portal-session   │ deployed
stripe-webhook          │ deployed
get-todays-puzzles      │ deployed
```

**Actions:**
1. Deploy all functions
2. Verify deployment status
3. Test each function individually

---

### Step 3: Test Subscription Settings Page

**Status:** NEEDS TESTING

**Test Plan:**

#### 3.1: Navigate to Settings
```
1. Start dev server: npm run dev
2. Login to app
3. Navigate to /settings/subscription
4. Verify page loads without errors
```

**Expected:**
- ✅ Page loads successfully
- ✅ Shows "Free Trial" status badge
- ✅ Displays "€6.99 per month" pricing
- ✅ Shows "7 days remaining in trial" (if trial active)
- ✅ "Start Free Trial" button visible
- ✅ Premium features list displayed

#### 3.2: Check Loading States
```
1. Observe initial page load
2. Check for loading spinner
3. Verify smooth transition to loaded state
```

**Expected:**
- ✅ Loading spinner shows while fetching subscription
- ✅ No flash of incorrect content
- ✅ Error boundaries handle failures

#### 3.3: Test Error Handling
```
1. Simulate network error (disconnect WiFi briefly)
2. Refresh page
3. Observe error state
```

**Expected:**
- ✅ Error card displays with helpful message
- ✅ "Try Again" button appears
- ✅ No app crash

---

### Step 4: Test Checkout Flow (End-to-End)

**Status:** NEEDS TESTING

**Test Plan:**

#### 4.1: Initiate Checkout
```
1. Navigate to /settings/subscription
2. Click "Start Free Trial" button
3. Observe loading state
4. Wait for Stripe redirect
```

**Expected:**
- ✅ Button shows "Starting Checkout..." with spinner
- ✅ No errors in browser console
- ✅ Redirects to Stripe Checkout (stripe.com domain)
- ✅ Checkout page shows €6.99/month with 7-day trial

**Check Logs:**
```bash
# Monitor Edge Function logs
supabase functions logs create-checkout --follow
```

**Expected logs:**
- ✅ "Creating checkout session for user..."
- ✅ "Checkout session created: cs_test_..."
- ✅ No error messages

#### 4.2: Complete Checkout
```
1. On Stripe Checkout page:
   - Use test card: 4242 4242 4242 4242
   - Expiry: 12/34
   - CVC: 123
   - ZIP: 12345
2. Click "Subscribe"
3. Wait for redirect
```

**Expected:**
- ✅ Payment processes successfully
- ✅ Redirects to /subscription/success?session_id=cs_test_...
- ✅ Success page displays
- ✅ Shows "Welcome to Premium!" message

**Check Webhook Logs:**
```bash
# Monitor webhook processing
supabase functions logs stripe-webhook --follow
```

**Expected logs:**
- ✅ "🔔 Event received: evt_... - Type: checkout.session.completed"
- ✅ "Handling checkout.session.completed: cs_test_..."
- ✅ "User [uuid] subscription activated"
- ✅ No error messages

#### 4.3: Verify Database Update
```sql
-- Run in Supabase SQL Editor
SELECT 
  id,
  email,
  subscription_status,
  stripe_customer_id,
  subscription_end_date,
  updated_at
FROM users
WHERE email = 'your-test-email@example.com';
```

**Expected:**
- ✅ `subscription_status` = 'trial' or 'active'
- ✅ `stripe_customer_id` populated (cus_...)
- ✅ `subscription_end_date` set to future date
- ✅ `updated_at` shows recent timestamp

#### 4.4: Test Cancellation Flow
```
1. Navigate to /settings/subscription
2. Click "Start Free Trial"
3. On Stripe Checkout, click "Back" or close tab
4. Should redirect to /subscription/cancel
```

**Expected:**
- ✅ Cancel page displays
- ✅ Shows "Payment Cancelled" message
- ✅ Explains no charges made
- ✅ Provides option to retry or continue with free plan

---

### Step 5: Test Customer Portal Integration

**Status:** NEEDS TESTING

**Test Plan:**

#### 5.1: Open Customer Portal (Requires Active Subscription)
```
1. Complete checkout flow first (Step 4)
2. Navigate to /settings/subscription
3. Verify status shows "Active" or "Free Trial"
4. Click "Manage Subscription" button
5. Wait for redirect
```

**Expected:**
- ✅ Button shows "Opening Portal..." with spinner
- ✅ Redirects to Stripe Customer Portal
- ✅ Portal shows subscription details
- ✅ Can view invoices, update payment method, cancel subscription

**Check Logs:**
```bash
supabase functions logs create-portal-session --follow
```

**Expected logs:**
- ✅ "Creating portal session for customer: cus_..."
- ✅ "Portal session created successfully"

#### 5.2: Cancel Subscription via Portal
```
1. In Customer Portal, click "Cancel Subscription"
2. Confirm cancellation
3. Return to app
4. Navigate to /settings/subscription
```

**Expected:**
- ✅ Status updates to "Cancelled"
- ✅ Shows "Subscription ends on [date]"
- ✅ Badge shows "Cancelled"

**Check Webhook:**
```bash
supabase functions logs stripe-webhook --follow
```

**Expected logs:**
- ✅ "🔔 Event received: customer.subscription.deleted"
- ✅ "User [uuid] subscription cancelled"

---

### Step 6: Test Real-Time Updates

**Status:** NEEDS TESTING

**Test Plan:**

#### 6.1: Test Subscription Status Refetch
```
1. Have app open at /settings/subscription
2. Open Stripe Dashboard in another tab
3. Manually trigger subscription event (or cancel via portal)
4. Wait 5 minutes (React Query staleTime)
5. OR manually refresh the page
```

**Expected:**
- ✅ Status updates automatically (after staleTime)
- ✅ Manual refresh shows updated status
- ✅ No need to re-login

#### 6.2: Test After Webhook Processing
```
1. Trigger a Stripe event (payment succeeded, etc.)
2. Wait for webhook to process
3. Refresh app page
4. Check subscription status
```

**Expected:**
- ✅ Status reflects webhook changes
- ✅ Database and UI in sync

---

### Step 7: Test Edge Cases

**Status:** NEEDS TESTING

**Test Plan:**

#### 7.1: Expired Trial
```
1. Manually update user in database:
   UPDATE users 
   SET trial_end_date = NOW() - INTERVAL '1 day'
   WHERE email = 'test@example.com';
2. Refresh /settings/subscription
```

**Expected:**
- ✅ Status shows "Expired"
- ✅ Badge shows "Expired"
- ✅ Message: "Your trial has expired"
- ✅ "Upgrade Now" button displayed

#### 7.2: Past Due Payment
```
1. In Stripe Dashboard, mark subscription as past_due
2. Wait for webhook to process
3. Refresh app
```

**Expected:**
- ✅ Status shows "Past Due"
- ✅ Badge shows warning color
- ✅ Message indicates payment issue
- ✅ "Update Payment" button available

#### 7.3: Multiple Rapid Clicks
```
1. Navigate to /settings/subscription
2. Rapidly click "Start Free Trial" multiple times
```

**Expected:**
- ✅ Only one checkout session created
- ✅ Button disables after first click
- ✅ No duplicate charges

#### 7.4: Network Failure During Checkout
```
1. Click "Start Free Trial"
2. Disconnect network before redirect
3. Reconnect and retry
```

**Expected:**
- ✅ Error message displays
- ✅ Can retry checkout
- ✅ No orphaned sessions

---

## 🔍 Testing Checklist

### Pre-Testing Setup
- [ ] All Edge Functions deployed
- [ ] Environment variables set correctly
- [ ] Stripe Dashboard in TEST mode
- [ ] Test user account created
- [ ] Database accessible for verification

### Core Functionality
- [ ] Subscription settings page loads
- [ ] Current status displays correctly
- [ ] Loading states work properly
- [ ] Error states display correctly
- [ ] "Start Free Trial" creates checkout session
- [ ] Redirects to Stripe Checkout
- [ ] Checkout completion redirects to success page
- [ ] Database updates after checkout
- [ ] "Manage Subscription" opens portal
- [ ] Portal displays subscription details
- [ ] Cancellation updates status

### Edge Cases
- [ ] Expired trial status shown
- [ ] Past due status handled
- [ ] Multiple clicks prevented
- [ ] Network errors handled gracefully
- [ ] Invalid session IDs handled

### User Experience
- [ ] All buttons have loading states
- [ ] Error messages are user-friendly
- [ ] Success messages are clear
- [ ] Navigation flows smoothly
- [ ] No console errors
- [ ] Responsive on mobile

---

## 🛠️ Development Workflow

### Start Development Server
```bash
cd /home/linux/EduPuzzle/EduPuzzle
npm run dev
```

### Monitor Edge Function Logs
```bash
# In separate terminal
supabase functions logs stripe-webhook --follow

# Or check specific function
supabase functions logs create-checkout --limit 50
```

### Check Database Changes
```sql
-- Monitor subscription updates
SELECT 
  email,
  subscription_status,
  stripe_customer_id,
  trial_end_date,
  subscription_end_date,
  updated_at
FROM users
ORDER BY updated_at DESC
LIMIT 5;
```

---

## 🚨 Common Issues & Solutions

### Issue: "STRIPE_SECRET_KEY not configured"
**Solution:**
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase functions deploy create-checkout
```

### Issue: Checkout button doesn't respond
**Causes:**
1. Edge Function not deployed
2. Missing environment variables
3. Network error

**Debug:**
```bash
# Check browser console for errors
# Check Edge Function logs
supabase functions logs create-checkout --limit 20
```

### Issue: Webhook not processing
**Causes:**
1. STRIPE_WEBHOOK_SECRET not set
2. Webhook URL incorrect in Stripe
3. Signature verification failing

**Debug:**
```bash
supabase functions logs stripe-webhook --limit 50
# Look for "signature verification failed"
```

### Issue: Database not updating
**Causes:**
1. Webhook not receiving events
2. User ID mismatch
3. RLS policies blocking

**Debug:**
```sql
-- Check recent webhook events
SELECT * FROM users WHERE updated_at > NOW() - INTERVAL '1 hour';
```

---

## 📊 Success Metrics

After completing Phase 2, you should have:

- ✅ **100% functional checkout flow** - Users can subscribe
- ✅ **Real-time status updates** - UI reflects subscription state
- ✅ **Customer portal access** - Users can manage subscriptions
- ✅ **Error handling** - Graceful degradation on failures
- ✅ **Database synchronization** - Webhooks update DB correctly
- ✅ **Production-ready** - All edge cases handled

---

## 📚 Next Steps After Phase 2

### Phase 3: Additional Features (Optional)
1. Add subscription gate for premium features
2. Implement usage limits for free tier
3. Add analytics for subscription conversions
4. Create admin dashboard for subscription management
5. Add email notifications for subscription events

### Phase 4: Production Deployment
1. Switch to live Stripe keys
2. Update webhook URL to production domain
3. Test with real payment methods
4. Set up monitoring and alerts
5. Document user onboarding flow

---

## 🎉 Ready to Start Testing!

**First Test:**
```bash
# 1. Start dev server
npm run dev

# 2. Login to app
# Navigate to http://localhost:5173/login

# 3. Go to subscription settings
# Navigate to http://localhost:5173/settings/subscription

# 4. Verify page loads
# Should see subscription status and "Start Free Trial" button
```

**Time estimate:** 2-3 hours for complete testing  
**Difficulty:** Easy - mostly verification and testing

---

**All code is ready - let's test it! 🚀**
