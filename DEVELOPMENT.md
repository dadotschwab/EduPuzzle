# Development Configuration Guide

This document contains development-specific configurations that **MUST BE CHANGED** before going to production.

## ⚠️ Email Configuration (DEVELOPMENT ONLY)

### Option 1: Disable ALL Email Sending (Recommended for Development)

To completely stop Supabase from sending emails and avoid bounce notifications:

1. Go to your Supabase Dashboard
2. Navigate to **Project Settings** → **Authentication**
3. Scroll down to **"SMTP Settings"**
4. Find the **"Enable Custom SMTP"** toggle
5. **Turn it ON**
6. Leave all SMTP fields **empty** (host, port, username, password)
7. Click **Save**

This will prevent Supabase from sending ANY emails, including:
- Confirmation emails
- Welcome emails
- Password reset emails
- Magic link emails

**Result**: No more bounce notifications! Users can still sign up and log in normally.

### Option 2: Just Disable Email Confirmation (Still Sends Other Emails)

If you want to keep some email functionality but skip verification:

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers**
3. Scroll down to **"Email"** provider settings
4. Find **"Confirm email"** toggle
5. **Turn it OFF** (disable it)
6. Click **Save**

⚠️ **Note**: This option still sends emails for other events (password resets, etc.) and may cause bounces with test emails.

### 🚨 BEFORE PRODUCTION: Configure Email Properly

**CRITICAL**: Before launching to production, you MUST:

#### If you used Option 1 (Disabled ALL emails):

1. Go to **Project Settings** → **Authentication** → **SMTP Settings**
2. Either:
   - **Option A**: Turn OFF "Enable Custom SMTP" to use Supabase's default email service
   - **Option B**: Configure a real SMTP provider (recommended):
     - Host: e.g., `smtp.sendgrid.net`
     - Port: `587`
     - Username: Your SMTP username
     - Password: Your SMTP password
3. Go to **Authentication** → **Providers**
4. Enable **"Confirm email"**
5. Configure email templates in **Authentication** → **Email Templates**

#### If you used Option 2 (Just disabled confirmation):

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

### With Option 1 (ALL emails disabled):
You can use any email format without any bounce issues:
- `test@test.de`
- `user@example.com`
- `demo@localhost`
- Any fake email you want

No emails are sent, no bounces occur.

### With Option 2 (Only confirmation disabled):
Be careful with fake emails - Supabase will still try to send password reset emails, etc., which may bounce.

**Recommended**: Use Option 1 for development to avoid bounce issues entirely.

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
