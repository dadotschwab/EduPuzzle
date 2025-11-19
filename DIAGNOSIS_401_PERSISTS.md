# 🔍 401 Error Still Persisting - Root Cause Analysis

## Current Situation

**Status:** 401 error still occurs even after loading guard fix
**Evidence:** User is accessing the page (not redirected to login), but API returns 401

## Key Findings

### 1. The Supabase Client
```typescript
// src/lib/supabase.ts
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

**Issue:** Supabase client is created once at module load time, BEFORE user logs in.

### 2. How Auth Headers Are Added

When you call `supabase.functions.invoke()`, the Supabase client:
1. Checks if there's a current session in browser storage
2. If yes, automatically adds `Authorization: Bearer <token>` header
3. If no, sends request without auth header → 401

### 3. The Real Problem

**Your observation is CORRECT!**

> "the test user i am currently using was created before the stripe integration"

This means:
- User exists in `auth.users` table ✅
- User has valid session/JWT token ✅
- BUT: User might NOT exist in `users` table (custom users table) ❌

### 4. What's Happening in the Function

```typescript
// check-subscription/index.ts (lines 51-64)
const {
  data: { user },
  error: authError,
} = await supabaseClient.auth.getUser()

if (authError || !user) {
  return new Response(
    JSON.stringify({ error: 'Unauthorized' }),
    { status: 401 }
  )
}
```

**Then later (lines 67-71):**
```typescript
const { data: userData, error: userError } = await supabaseClient
  .from('users')
  .select('subscription_status, trial_end_date, subscription_end_date')
  .eq('id', user.id)
  .single()

if (userError) {
  throw new Error(`Failed to fetch user data: ${userError.message}`)
}
```

**THIS IS THE ISSUE!**

The function validates JWT successfully, but then tries to query the `users` table.
If the user doesn't exist in the custom `users` table, this fails!

## Root Cause: Two Separate Issues

### Issue 1: Auth Validation (CONFIRMED WORKING)
- ✅ JWT token is being sent
- ✅ Token is valid
- ✅ `auth.getUser()` succeeds

### Issue 2: User Record Missing (LIKELY ISSUE)
- ❌ User doesn't exist in custom `users` table
- ❌ Database query fails
- ❌ Function might be returning 401 instead of 500

## Why This Happens

When a user signs up through Supabase Auth:
1. ✅ Record created in `auth.users` (system table)
2. ❌ Record NOT automatically created in `users` (custom table)

**You need a database trigger or signup hook to create the custom user record!**

## Diagnosis Steps

### Step 1: Check if User Exists in Custom Table

```sql
-- Run in Supabase SQL Editor
SELECT id, email, subscription_status, trial_end_date 
FROM users 
WHERE id = 'd9b18d67-9734-4cae-9a4a-c8fd2c6bf143';
```

**If returns NO ROWS:**
→ User doesn't exist in custom users table
→ This is the problem!

**If returns a row:**
→ User exists
→ Different issue (maybe RLS policies?)

### Step 2: Check Auth User Exists

```sql
-- Run in Supabase SQL Editor
SELECT id, email, created_at 
FROM auth.users 
WHERE id = 'd9b18d67-9734-4cae-9a4a-c8fd2c6bf143';
```

**Should return a row** (since you can log in)

### Step 3: Check Function Logs

```bash
# The actual error in the function logs will tell us
cd /home/linux/EduPuzzle/EduPuzzle
# Unfortunately we can't view logs easily from CLI
# Need to check Supabase Dashboard → Edge Functions → check-subscription → Logs
```

## Solutions

### Solution A: Create Missing User Record (Quick Fix)

```sql
-- Run in Supabase SQL Editor
INSERT INTO users (id, email, subscription_status, trial_end_date)
SELECT 
  id, 
  email,
  'trial' as subscription_status,
  NOW() + INTERVAL '7 days' as trial_end_date
FROM auth.users 
WHERE id = 'd9b18d67-9734-4cae-9a4a-c8fd2c6bf143'
ON CONFLICT (id) DO NOTHING;
```

### Solution B: Create Database Trigger (Proper Fix)

```sql
-- Create function to auto-create user record on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, subscription_status, trial_end_date)
  VALUES (
    NEW.id,
    NEW.email,
    'trial',
    NOW() + INTERVAL '7 days'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to run on new auth user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### Solution C: Fix Function Error Handling

The function should return 500 (server error) when user record is missing, not 401 (unauthorized).

```typescript
// In check-subscription/index.ts
if (userError) {
  console.error('Failed to fetch user data:', userError)
  return new Response(
    JSON.stringify({ 
      error: 'User record not found. Please contact support.',
      details: userError.message 
    }),
    { 
      status: 500,  // Changed from potential 401
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}
```

## Verification

### After Creating User Record

1. **Run SQL to create user:**
   ```sql
   INSERT INTO users (id, email, subscription_status, trial_end_date)
   SELECT id, email, 'trial', NOW() + INTERVAL '7 days'
   FROM auth.users 
   WHERE id = 'd9b18d67-9734-4cae-9a4a-c8fd2c6bf143';
   ```

2. **Refresh browser page**

3. **Check console:**
   ```
   ✅ [DEBUG] Checking subscription status
   ✅ Subscription status retrieved
   ```

4. **Page should display:**
   - Status: "Free Trial"
   - Days remaining: "7 days remaining in trial"
   - "Start Free Trial" button visible

## Why User Record Was Missing

Possible reasons:
1. User created before database trigger was set up
2. Trigger doesn't exist yet
3. Signup flow doesn't create user record
4. Manual user creation in Auth dashboard

## Recommended Actions (In Order)

1. **Verify user exists in custom users table** (SQL Step 1)
2. **If missing, create user record** (Solution A - SQL INSERT)
3. **Test subscription page again**
4. **If fixed, implement trigger for future users** (Solution B)
5. **Consider improving error handling** (Solution C)

## Expected Behavior After Fix

```
✅ User logs in
✅ Session token stored
✅ User record exists in users table
✅ check-subscription function finds user
✅ Returns subscription status
✅ UI displays correctly
```

---

**Most Likely Issue:** User record missing in custom `users` table
**Quick Fix:** Run SQL INSERT to create user record
**Proper Fix:** Implement database trigger for auto-creation
**Time to Fix:** 2 minutes (SQL INSERT)

See next steps in ACTION_PLAN_USER_RECORD.md
