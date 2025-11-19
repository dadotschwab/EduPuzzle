# Action Plan: Fix Missing User Record

## Problem
User exists in auth.users but not in custom users table

## Quick Fix (Run in Supabase SQL Editor)

```sql
INSERT INTO users (id, email, subscription_status, trial_end_date)
SELECT id, email, 'trial', NOW() + INTERVAL '7 days'
FROM auth.users 
WHERE id = 'd9b18d67-9734-4cae-9a4a-c8fd2c6bf143';
```

## Then refresh your browser!
