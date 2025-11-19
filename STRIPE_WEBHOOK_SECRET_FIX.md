# 🔧 Stripe Webhook Signature Error Fix

## ✅ Progress Made
- 401 error FIXED! Configuration changes worked
- Webhook now reaches your function
- Issue: Signature verification failing (400 error)

## 🎯 Root Cause
The `STRIPE_WEBHOOK_SECRET` environment variable is either:
1. Not set in Supabase
2. Set to the wrong value
3. Using test mode secret when live mode is active (or vice versa)

## 🚀 Fix Steps

### Step 1: Get Your Webhook Signing Secret from Stripe

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click on your webhook endpoint
3. Find the "Signing secret" section
4. Click "Reveal" to show the secret
5. Copy the secret (starts with `whsec_`)

**Important:** Make sure you're in TEST mode in Stripe dashboard (toggle in top right)

### Step 2: Set the Secret in Supabase

```bash
# Set the webhook secret
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_actual_secret_here

# Verify it was set
supabase secrets list
```

**Expected output:**
```
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET  ← Should appear here
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

### Step 3: Re-deploy the Function

After setting secrets, you MUST re-deploy:

```bash
supabase functions deploy stripe-webhook
```

**Why?** Environment variables are injected at deployment time.

### Step 4: Test Again

```bash
# Test with Stripe CLI
stripe trigger checkout.session.completed

# Expected: 200 OK (not 400)
```

## 🔍 Verification

Check Supabase logs:

```bash
supabase functions logs stripe-webhook --limit 10
```

**What to look for:**
- ✅ "🔔 Event received: evt_xxxxx"
- ✅ "Handling checkout.session.completed"
- ❌ NOT: "No signatures found matching"

## 🆘 Still Getting 400?

### Double-check the secret matches:

1. **In Stripe Dashboard:**
   - Go to Webhooks → Your endpoint
   - Copy the signing secret

2. **In Supabase:**
   ```bash
   # List secrets (won't show values, just names)
   supabase secrets list
   
   # If wrong, update it
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_correct_secret
   
   # Re-deploy
   supabase functions deploy stripe-webhook
   ```

### Make sure you're in the right mode:

- **Test mode webhook** needs **test mode secret** (starts with `whsec_`)
- **Live mode webhook** needs **live mode secret**
- Check the toggle in top-right of Stripe Dashboard

### Check for multiple webhook endpoints:

If you have multiple webhook endpoints in Stripe, make sure you're using the secret from the CORRECT endpoint (the one pointing to your Supabase URL).

## ✅ Success Criteria

After fix:
- ✅ Test webhook returns 200 OK
- ✅ Logs show "Event received"
- ✅ No signature verification errors
- ✅ Database updates with subscription data

---

**Time to fix:** 5 minutes  
**Difficulty:** Easy - just environment variable configuration
