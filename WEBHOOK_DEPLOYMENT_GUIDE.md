# Stripe Webhook 401 Error - Deployment Guide

## Problem

Stripe webhooks are getting **401 "Missing authorization header"** errors even after removing `?apikey=` from the webhook URL.

**Root Cause:** Supabase is enforcing JWT authentication at the edge runtime level, before your function code runs.

---

## Solution Steps

### Option 1: Deploy Function with Configuration (Recommended)

1. **On your local machine** (where Supabase CLI is installed):

```bash
# Navigate to project
cd /path/to/EduPuzzle

# Pull latest changes
git pull origin claude/debug-stripe-payments-01ML5UiA32srVLpB4raiVY7f

# Deploy the webhook function
supabase functions deploy stripe-webhook

# Verify deployment shows the new version
supabase functions list
```

2. **Test the webhook:**

```bash
# Using Stripe CLI
stripe trigger customer.subscription.created

# Should now return 200 OK instead of 401
```

---

### Option 2: Configure via Supabase Dashboard

If deployment doesn't work, you need to configure the function via the Supabase Dashboard:

#### A. Check Project-Level Settings

1. Go to: https://supabase.com/dashboard/project/gqalsczfephexbserzqp
2. Navigate to: **Settings** → **API**
3. Look for **"Edge Functions"** section
4. Check if there's a **"Require JWT for all functions"** setting
5. If yes, **disable it** or add `stripe-webhook` to an exceptions list

#### B. Check Function-Level Settings

1. Go to: **Edge Functions** → **stripe-webhook**
2. Click **"Settings"** or **"Edit"**
3. Look for:
   - **"Authorization Required"** - Set to **OFF/False**
   - **"JWT Verification"** - Set to **Disabled**
   - **"Public Access"** - Set to **Enabled**
4. Save changes

#### C. Check Function Permissions

1. Still in the `stripe-webhook` function page
2. Look for **"Permissions"** or **"Access Control"** tab
3. Ensure it's set to **"Public"** or **"Allow anonymous requests"**

---

### Option 3: Manual Verification Check

Check if the function is actually using the latest code:

1. **Add a test endpoint** to verify deployment:

You can temporarily add this to the top of your `stripe-webhook/index.ts` (after the `serve` line):

```typescript
serve(async (req) => {
  // TEST ENDPOINT - Remove after debugging
  if (req.url.includes('test-deployment')) {
    return new Response(
      JSON.stringify({
        deployed: true,
        version: 'v2-with-config',
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  // ... rest of function code
```

2. **Deploy and test:**

```bash
supabase functions deploy stripe-webhook

# Test the endpoint
curl https://gqalsczfephexbserzqp.supabase.co/functions/v1/stripe-webhook/test-deployment
```

Expected response:
```json
{
  "deployed": true,
  "version": "v2-with-config",
  "timestamp": "2025-11-19T14:30:00.000Z"
}
```

If you get 401, the function isn't being deployed correctly or there's a project-level auth requirement.

---

## Understanding the Issue

### What's Happening:

```
Stripe Webhook Request
    ↓
Supabase API Gateway
    ↓
[BLOCKED HERE] - Checks for JWT Authorization
    ↓
Returns 401 - "Missing authorization header"
    ↓
Function code NEVER runs
```

### What Should Happen:

```
Stripe Webhook Request
    ↓
Supabase API Gateway (JWT check disabled for this function)
    ↓
Function Code Runs
    ↓
Stripe Signature Verification
    ↓
Process Event & Update Database
    ↓
Return 200 OK
```

---

## Debugging Checklist

- [ ] Removed `?apikey=` from Stripe webhook URL
- [ ] Deployed function with `.supabase.yaml` config file
- [ ] Checked Supabase Dashboard for project-level auth settings
- [ ] Checked Supabase Dashboard for function-level auth settings
- [ ] Verified function is using latest code (via test endpoint)
- [ ] Tested webhook with Stripe CLI
- [ ] Checked Supabase function logs for errors

---

## If Still Not Working

### Check Supabase Support Documentation

1. Search for: **"Edge Functions public access"** or **"Edge Functions without authentication"**
2. Check: https://supabase.com/docs/guides/functions/auth
3. Look for any project-specific configuration requirements

### Contact Supabase Support

If none of the above works, you may need to contact Supabase support:

1. Go to: https://supabase.com/dashboard/support
2. Explain: "Edge Function returning 401 for webhook even though no JWT verification in code"
3. Mention: "Need to make stripe-webhook function publicly accessible for Stripe webhooks"
4. Provide: Function name (`stripe-webhook`) and project ref (`gqalsczfephexbserzqp`)

### Alternative: Use Supabase Service Role Key (NOT RECOMMENDED)

As a **last resort** (not recommended for security reasons), you could:

1. Add the service role key to Stripe webhook configuration
2. But this exposes your service role key to Stripe
3. **DO NOT DO THIS** - defeats the purpose of webhook signature verification

---

## Expected Result After Fix

✅ Stripe webhook sends event
✅ Supabase allows request through (no JWT check)
✅ Function verifies Stripe signature
✅ Database is updated
✅ Returns 200 OK
✅ Stripe shows "Delivered" status in dashboard

---

## Testing After Fix

```bash
# 1. Test with Stripe CLI
stripe trigger customer.subscription.created

# 2. Check Stripe Dashboard
# Go to: Developers → Webhooks → Your endpoint
# Recent deliveries should show 200 status

# 3. Check Supabase logs
# Go to: Edge Functions → stripe-webhook → Logs
# Should see: "Webhook signature verified successfully"

# 4. Check database
# Run in Supabase SQL Editor:
SELECT id, email, subscription_status, stripe_customer_id, updated_at
FROM users
WHERE stripe_customer_id IS NOT NULL
ORDER BY updated_at DESC
LIMIT 5;
```

---

## Summary

**Primary Issue:** Supabase enforcing JWT authentication at runtime level

**Primary Solution:** Configure function to allow public/anonymous access

**How to Fix:**
1. Deploy updated function with `.supabase.yaml` config
2. OR configure via Supabase Dashboard settings
3. Test with Stripe CLI
4. Verify in logs and database

**Time Estimate:** 10-15 minutes once you have access to deployment tools
