# Development Configuration Guide

This document contains development-specific configurations that **MUST BE CHANGED** before going to production.

## ⚠️ Email Verification (DEVELOPMENT ONLY)

### For Development: Disable Email Confirmation

To test authentication without needing to verify emails:

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers**
3. Scroll down to **"Email"** provider settings
4. Find **"Confirm email"** toggle
5. **Turn it OFF** (disable it)
6. Click **Save**

Now users can sign up and log in immediately without email verification.

### 🚨 BEFORE PRODUCTION: Re-enable Email Confirmation

**CRITICAL**: Before launching to production, you MUST:

1. Go to **Authentication** → **Providers**
2. Find **"Confirm email"** toggle
3. **Turn it ON** (enable it)
4. Configure your email templates in **Authentication** → **Email Templates**
5. Set up a custom SMTP provider (optional but recommended)

---

## Development Environment Variables

Your `.env.local` file can use test credentials:

```bash
# Development Supabase
VITE_SUPABASE_URL=https://your-dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_dev_anon_key

# Stripe (not needed until Phase 4)
# VITE_STRIPE_PUBLISHABLE_KEY=
```

---

## Testing with Mock Emails

With email confirmation disabled (dev mode), you can use any email format:

- `test@test.de`
- `user@example.com`
- `demo@localhost`

These will work fine in development since we're not sending actual emails.

---

## Production Checklist

Before deploying to production, verify:

### ✅ Authentication
- [ ] Email confirmation is **ENABLED**
- [ ] Email templates are customized
- [ ] Password requirements are appropriate (currently 6 chars minimum)
- [ ] Rate limiting is configured
- [ ] Custom SMTP provider is set up (optional)

### ✅ Security
- [ ] RLS policies are enabled on all tables
- [ ] Environment variables use production values
- [ ] Supabase project is on a paid plan (for production usage limits)
- [ ] API keys are rotated and secured

### ✅ Stripe (Phase 4)
- [ ] Using live Stripe keys (not test keys)
- [ ] Webhook endpoint is configured with live secret
- [ ] Subscription plans are set up
- [ ] Test the full payment flow

### ✅ Domain & Hosting
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Redirect URLs updated in Supabase Auth settings
- [ ] CORS policies configured

---

## Development vs Production Settings

| Setting | Development | Production |
|---------|-------------|------------|
| Email Confirmation | ❌ Disabled | ✅ Enabled |
| Stripe Keys | Test Mode | Live Mode |
| SMTP Provider | Supabase Default | Custom SMTP |
| Rate Limiting | Relaxed | Strict |
| Error Logging | Console | Sentry/Service |
| Database | Dev Project | Production Project |

---

## Quick Dev Setup Summary

1. **Disable email confirmation** (as described above)
2. Use `.env.local` for credentials
3. Test with any email format
4. No need for Stripe until Phase 4

## Support

Remember: **ALL** development shortcuts must be reverted before production!

For production deployment checklist, see the main specification document.
