# Code Quality Improvements - Setup Instructions

## Manual Configuration Required

### 1. Supabase CLI Installation

Ensure you have the Supabase CLI installed for type regeneration:

```bash
# Install Supabase CLI (if not already installed)
npm install -g @supabase/cli

# Or using brew (macOS)
brew install supabase/tap/supabase

# Verify installation
supabase --version
```

### 2. Database Migration

After implementation, apply the database migration:

```bash
# Navigate to project root
cd /path/to/EduPuzzle

# Apply the SRS optimization migration
supabase db push

# Or apply locally first
supabase db reset
supabase db push
```

### 3. TypeScript Type Regeneration

After database migration, regenerate types:

```bash
# Generate updated types from local database
supabase gen types typescript --local > src/types/database.types.ts

# Verify new function types are included
grep -A 10 "get_due_words_count" src/types/database.types.ts
grep -A 10 "calculate_srs_progress" src/types/database.types.ts
```

### 4. Shadcn/UI Components Installation

Install required components for Error Boundaries:

```bash
npx shadcn-ui@latest add card button input textarea badge alert-dialog dialog
```

### 5. Environment Variables

Ensure these environment variables are configured for webhook security:

```bash
# In .env file
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# In Supabase Edge Functions secrets
supabase secrets set STRIPE_SECRET_KEY=your_stripe_secret_key
supabase secrets set STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

### 6. Web Worker Configuration

Vite should automatically handle Web Workers, but verify `vite.config.ts` includes:

```typescript
export default defineConfig({
  // ... existing config ...
  worker: {
    format: 'es',
  },
})
```

### 7. Development Testing

Test the improvements in development:

```bash
# Start development server
pnpm dev

# Test puzzle generation (should not block UI)
# Test collaborative features (should handle rapid operations)
# Test error boundaries (try triggering component errors)
# Test webhook rate limiting (use webhook testing tools)
```

### 8. Production Deployment

After testing, deploy changes:

```bash
# Build application
pnpm build

# Deploy Edge Functions with new security features
supabase functions deploy stripe-webhook

# Deploy frontend (if using Netlify/Vercel)
# Follow your hosting provider's deployment process
```

## Verification Checklist

- [ ] Puzzle generation doesn't block UI (test with large word lists)
- [ ] Collaborative lists handle rapid operations without corruption
- [ ] Error boundaries prevent app crashes (test with intentional errors)
- [ ] TypeScript compilation succeeds with no `any` types
- [ ] Database queries are faster (check SRS dashboard loading)
- [ ] Webhook rate limiting blocks excessive requests
- [ ] All timers and subscriptions clean up properly
- [ ] Auth state changes don't cause API call failures

## Monitoring Setup

Consider setting up monitoring for:

1. **Error Boundary Events**: Track errors caught by boundaries
2. **Puzzle Generation Performance**: Monitor generation times
3. **Collaborative Operation Conflicts**: Track conflict resolution events
4. **Webhook Rate Limiting**: Monitor rate limit violations
5. **Database Query Performance**: Track SRS query improvements

## Troubleshooting

### Web Worker Issues

- Ensure worker files are in `src/workers/` directory
- Check browser console for worker loading errors
- Verify Vite worker configuration

### Type Errors

- Run `supabase gen types` after database migration
- Check that `src/types/database.types.ts` includes new function types
- Verify all imports use correct type paths

### Rate Limiting Issues

- Check Supabase Edge Function logs for rate limit violations
- Verify webhook secret is correctly configured
- Test with proper Stripe webhook signatures

### Collaborative Race Conditions

- Test with multiple browser tabs or users
- Monitor browser console for conflict resolution logs
- Verify operation queue processes sequentially

## Support

If you encounter issues during implementation:

1. Check the Git commit messages for each phase's specific changes
2. Review the test files for expected behavior patterns
3. Monitor browser console and Supabase logs for error details
4. Refer to the main specification document for technical details

Remember to test thoroughly in development before deploying to production!
