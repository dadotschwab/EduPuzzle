# Apply Buddy Invites Migration

The buddy invite functionality requires a database migration that needs to be applied manually via the Supabase dashboard SQL editor.

## Why Manual Application is Needed

The migration file `supabase/migrations/20251126184236_fix_buddy_invites.sql` exists locally but can't be automatically pushed because:

1. The remote database has migrations (20250113, 20251125000000, 20251128000000, 20251128000001) that don't exist in the local migrations folder
2. The Supabase CLI won't push until the migration history is synchronized
3. The execute_sql tool doesn't support DDL operations

## How to Apply the Migration

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/gqalsczfephexbserzqp
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the ENTIRE contents of `supabase/migrations/20251126184236_fix_buddy_invites.sql`
5. Click **Run** to execute the migration
6. Verify success by checking that the `buddy_invites` table appears in the Table Editor

### Option 2: Synchronize Migration History First

If you want to use the CLI:

```bash
# 1. Pull all remote migrations to local
cd /home/linux/EduPuzzle/EduPuzzle
npx supabase db pull

# 2. Then push the new migration
npx supabase db push
```

## What the Migration Does

1. **Creates `buddy_invites` table** - Proper storage for invite tokens with expiration
2. **Updates `create_buddy_invite()` function** - Stores tokens in the new table instead of the workaround
3. **Updates `accept_buddy_invite()` function** - Uses the buddy_invites table with proper validation
4. **Adds RLS policies** - Security for the buddy_invites table
5. **Adds indexes** - Fast token lookups

## After Migration is Applied

Once the migration is successfully applied:

1. The PostgREST schema cache will automatically reload (may take 30-60 seconds)
2. The buddy invite link generation should work without 404 errors
3. You can verify by testing the "Generate Invite Link" button in your app

## Already Applied

The following fixes have already been applied to the codebase:

- ✅ Fixed table name mismatch in `useBuddy.ts` (buddy_relationships → buddies)
- ✅ Created migration file with all necessary schema changes
- ✅ Updated function signatures for better error handling

## Troubleshooting

If you still get 404 errors after applying the migration:

1. Wait 60 seconds for PostgREST to reload the schema cache
2. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
3. Check the browser console for any authentication errors
4. Verify the function exists:
   ```sql
   SELECT routine_name FROM information_schema.routines
   WHERE routine_schema = 'public'
   AND routine_name = 'create_buddy_invite';
   ```
