# EDU-PUZZLE Database Setup Guide

This guide walks you through setting up your Supabase database for EDU-PUZZLE.

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Your Supabase project created
- Your `.env.local` file configured with Supabase credentials

## Step 1: Apply Database Migrations

You have two SQL migration files in `supabase/migrations/`:

1. `20250113_initial_schema.sql` - Creates all tables, indexes, and RLS policies
2. `20250113_auth_sync.sql` - Syncs Supabase Auth users with your users table

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **"New Query"**
4. Copy the contents of `supabase/migrations/20250113_initial_schema.sql`
5. Paste into the SQL editor
6. Click **"Run"** or press `Ctrl+Enter`
7. Verify success (you should see "Success. No rows returned")
8. Repeat steps 3-7 for `supabase/migrations/20250113_auth_sync.sql`

### Option B: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

## Step 2: Disable Email Confirmation (DEVELOPMENT ONLY)

⚠️ **For development/testing only** - Disable email confirmation:

1. Go to **Authentication** → **Providers** in Supabase dashboard
2. Find the **Email** provider section
3. Scroll to **"Confirm email"** toggle
4. **Turn it OFF** (disable it)
5. Click **Save**

This allows you to test with mock emails like `test@test.de` without verification.

**For later:** When testing password resets or other email features, use real email addresses.

> **🚨 CRITICAL**: Before production, you MUST re-enable email confirmation!
> See `DEVELOPMENT.md` for the complete production setup guide.

## Step 3: Verify Database Setup

After running the migrations, verify your tables were created:

1. Go to **Table Editor** in Supabase dashboard
2. You should see these tables:
   - `users`
   - `word_lists`
   - `words`
   - `word_progress`
   - `puzzle_sessions`
   - `word_reviews`

## Step 4: Understanding Row Level Security (RLS)

All tables have RLS enabled with these policies:

### Users Table
- Users can only view and update their own data
- Tied to `auth.uid()`

### Word Lists Table
- Users have full CRUD access to their own lists
- Access controlled by `user_id` column

### Words Table
- Users can manage words in lists they own
- Access verified through `word_lists.user_id`

### Word Progress Table
- Users can manage their own learning progress
- Tied to `user_id`

### Puzzle Sessions & Word Reviews
- Users can only access their own sessions and reviews
- Tied to `user_id`

## Step 5: Test Authentication & RLS

### Create a test user:

1. Start your dev server: `pnpm dev`
2. Navigate to `http://localhost:5173/signup`
3. Create a test account
4. Check your Supabase dashboard:
   - **Authentication** → **Users**: Your user should appear
   - **Table Editor** → **users**: A corresponding row should exist

### Test RLS Policies:

Try creating a word list:

1. Navigate to `/app/lists`
2. Click "New List"
3. Fill in the form and create a list
4. Check **Table Editor** → **word_lists**: Your list should appear with your `user_id`

## Step 6: Verify RLS is Working

To ensure RLS is properly protecting your data:

1. Go to **SQL Editor** in Supabase
2. Run this query:

```sql
-- This should ONLY return data for the current authenticated user
SELECT * FROM word_lists;

-- Try to query another user's data (should return nothing)
SELECT * FROM word_lists WHERE user_id != auth.uid();
```

When authenticated in your app, the first query returns your data. The second returns nothing (as it should).

## Common Issues & Solutions

### Issue: "Cannot read properties of null (auth.uid())"

**Solution**: Make sure you're signed in. RLS policies require authentication.

### Issue: "Row Level Security policy violation"

**Cause**: Trying to access data you don't own.

**Solution**: Ensure queries use proper authentication and the `user_id` matches `auth.uid()`.

### Issue: User not created in `users` table after signup

**Cause**: The trigger didn't fire.

**Solution**:
1. Check that `20250113_auth_sync.sql` was applied
2. Try signing up again
3. Verify in **Database** → **Triggers** that `on_auth_user_created` exists

### Issue: "relation public.users does not exist"

**Cause**: Migrations weren't applied.

**Solution**: Re-run the migration SQL files in the SQL Editor.

## Next Steps

After completing the database setup:

1. ✅ Authentication works
2. ✅ Word lists can be created
3. ✅ Words can be added to lists
4. ✅ RLS policies protect user data

You're now ready to:
- Build vocabulary lists
- Add words
- Start developing the puzzle generation system
- Implement the spaced repetition algorithm

## Database Schema Reference

### Quick Reference

```sql
-- Get all word lists for current user
SELECT * FROM word_lists;

-- Get words for a specific list
SELECT * FROM words WHERE list_id = 'your-list-id';

-- Get words due for review today
SELECT w.*, wp.repetition_level, wp.next_review_date
FROM words w
JOIN word_progress wp ON w.id = wp.word_id
WHERE wp.user_id = auth.uid()
  AND wp.next_review_date <= CURRENT_DATE;
```

## Support

If you encounter issues:

1. Check the Supabase logs in **Database** → **Logs**
2. Verify your RLS policies in **Authentication** → **Policies**
3. Test queries manually in the SQL Editor
4. Check browser console for errors

For Supabase-specific help, visit: https://supabase.com/docs
