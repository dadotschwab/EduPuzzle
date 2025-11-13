# Development Configuration Guide

This document contains development-specific configurations that **MUST BE CHANGED** before going to production.

## ⚠️ Email Configuration (DEVELOPMENT ONLY)

### Recommended Approach: Disable Email Confirmation

**Note**: Supabase requires valid SMTP settings to use Custom SMTP, so the simplest approach for development is to disable email confirmation:

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers**
3. Scroll down to **"Email"** provider settings
4. Find **"Confirm email"** toggle
5. **Turn it OFF** (disable it)
6. Click **Save**

**What this does:**
- ✅ Users can sign up without email verification
- ✅ No confirmation emails sent (avoids bounces)
- ⚠️ Other emails may still be sent (password resets, magic links if enabled)

**For thorough testing later:** Use real email addresses when testing password resets and other auth features.

### Alternative: Disable Email Confirmation (Practical for Development)

### If You Need to Disable ALL Emails (Advanced)

If you experience bounce issues even with confirmation disabled, you'll need to configure a test SMTP provider:

**Option 1**: Use a free service like [Mailtrap.io](https://mailtrap.io) (development email testing)
**Option 2**: Use SendGrid free tier (100 emails/day)

For most development, just disabling confirmation is sufficient.

### 🚨 BEFORE PRODUCTION: Configure Email Properly

**CRITICAL**: Before launching to production, you MUST:

1. Go to **Authentication** → **Providers**
2. Find **"Confirm email"** toggle
3. **Turn it ON** (enable it)
4. Configure your email templates in **Authentication** → **Email Templates**
5. Set up a custom SMTP provider (highly recommended for production):
   - Host: e.g., `smtp.sendgrid.net`
   - Port: `587`
   - Username: Your SMTP username
   - Password: Your SMTP password
   - Or use services like SendGrid, Mailgun, AWS SES

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

With email confirmation disabled, you can use test emails for signup:
- `test@test.de`
- `user@example.com`
- `demo@localhost`

**Tips:**
- ✅ Signup works fine with any email
- ⚠️ Avoid testing password resets with fake emails (may bounce)
- 💡 For thorough auth testing later, use real email addresses

---

## Production Checklist

Before deploying to production, verify:

### ✅ Authentication
- [ ] Email sending is **ENABLED** (turn off "Enable Custom SMTP" or configure real SMTP)
- [ ] Email confirmation is **ENABLED**
- [ ] Email templates are customized
- [ ] Password requirements are appropriate (currently 6 chars minimum)
- [ ] Rate limiting is configured
- [ ] Custom SMTP provider is set up (recommended)

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
| Email Sending | ❌ Disabled (Option 1) | ✅ Enabled |
| Email Confirmation | ❌ Disabled | ✅ Enabled |
| Stripe Keys | Test Mode | Live Mode |
| SMTP Provider | None/Empty | Custom SMTP |
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
