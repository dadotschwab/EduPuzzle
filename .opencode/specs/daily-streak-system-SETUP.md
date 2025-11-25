# Daily Streak System - Manual Setup

This document contains manual configuration steps required for the Daily Streak System implementation.

## 1. Supabase Cron Job Configuration

The streak system requires two cron jobs to be configured in your Supabase project:

### Daily Streak Maintenance

- **Schedule:** `5 0 * * *` (00:05 UTC daily)
- **Function:** `daily-streak-maintenance`
- **Purpose:** Process missed days and consume streak freezes

### Monthly Streak Reset

- **Schedule:** `10 0 1 * *` (00:10 UTC on 1st of each month)
- **Function:** `monthly-streak-reset`
- **Purpose:** Refill streak freezes for all users

### Setup Steps:

1. **Navigate to Supabase Dashboard** → Edge Functions
2. **Deploy the functions** using the Supabase CLI:
   ```bash
   supabase functions deploy daily-streak-maintenance
   supabase functions deploy monthly-streak-reset
   ```
3. **Configure cron schedules** in Supabase Dashboard:
   - Go to Settings → Edge Functions → Cron Jobs
   - Add the two schedules with the patterns above
   - Link each schedule to the corresponding function

## 2. Verify pg_cron Extension

Ensure the `pg_cron` extension is enabled in your Supabase project:

```sql
-- Check if extension is available
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- If not available, enable it (requires superuser access)
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

**Note:** In Supabase Cloud, `pg_cron` is typically pre-installed. If not available, you may need to contact Supabase support.

## 3. Environment Variables

No additional environment variables are required for this feature. The system uses existing Supabase configuration.

## 4. Database Migration

After implementing the code, run the migration:

```bash
# Local development
supabase db reset

# Production deployment
supabase db push
```

## 5. Type Generation

After migration, regenerate TypeScript types:

```bash
supabase gen types typescript --local > src/types/database.types.ts
```

## 6. Testing Cron Jobs

To test the cron jobs manually:

```sql
-- Test daily maintenance
SELECT public.process_daily_streak_maintenance();

-- Test monthly reset
SELECT public.refill_streak_freezes();
```

## 7. Monitoring

Set up monitoring for:

- Cron job execution failures
- Edge function logs
- Database function errors
- Realtime subscription performance

## 8. Rollback Plan

If issues occur:

1. Disable cron jobs in Supabase Dashboard
2. Roll back migration: `supabase migration rollback`
3. Remove deployed edge functions
4. Revert code changes

## 9. Security Considerations

- Cron jobs run with service role privileges - ensure they're properly secured
- RLS policies prevent unauthorized access to streak data
- Realtime subscriptions are filtered by user_id for security
- All database functions use SECURITY DEFINER appropriately

## 10. Performance Notes

- Database indexes are optimized for user_id and date queries
- Realtime subscriptions minimize unnecessary data transfer
- Cron jobs run during off-peak hours (UTC midnight)
- React Query caching reduces database load
