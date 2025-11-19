# 🔍 Environment Variable Name Issue

## The Problem

Your webhook function is looking for: `STRIPE_WEBHOOK_SECRET`

But the official Supabase documentation uses: `STRIPE_WEBHOOK_SIGNING_SECRET`

You might have set the wrong variable name!

## Quick Check

Run this command to see what secrets you have:

```bash
supabase secrets list
```

Look for either:
- `STRIPE_WEBHOOK_SECRET` ✅ (what your code expects)
- `STRIPE_WEBHOOK_SIGNING_SECRET` ❌ (what the docs show, but your code doesn't use)

## Fix Option 1: Set the Correct Variable Name

If you don't see `STRIPE_WEBHOOK_SECRET` in the list:

```bash
# Get the secret from Stripe Dashboard
# Then set it with the correct name:
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_actual_secret

# Re-deploy
supabase functions deploy stripe-webhook

# Test
stripe trigger checkout.session.completed
```

## Fix Option 2: Update Code to Match Docs (Alternative)

If you prefer to use the official naming convention, update the code:

Change line 62 and 98 in `supabase/functions/stripe-webhook/index.ts`:

From:
```typescript
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
// and
Deno.env.get('STRIPE_WEBHOOK_SECRET')!,
```

To:
```typescript
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET')
// and
Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET')!,
```

Then:
```bash
supabase secrets set STRIPE_WEBHOOK_SIGNING_SECRET=whsec_your_secret
supabase functions deploy stripe-webhook
```

## Recommended: Option 1

Stick with `STRIPE_WEBHOOK_SECRET` (what your code currently uses) - it's simpler and doesn't require code changes.

---

**Next step:** Set the secret with the correct name and re-deploy!
