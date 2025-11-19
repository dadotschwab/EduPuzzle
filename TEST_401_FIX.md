# 🧪 Testing the 401 Error Fix

## Quick Verification Steps

### Step 1: Restart Dev Server
```bash
# Stop current server (Ctrl+C)
# Then restart
npm run dev
```

### Step 2: Clear Browser Cache
```
1. Open http://localhost:5173
2. Open DevTools (F12)
3. Right-click refresh button → "Empty Cache and Hard Reload"
```

### Step 3: Log In
```
1. Navigate to http://localhost:5173/login
2. Enter your credentials
3. Log in successfully
```

### Step 4: Test Subscription Page
```
1. Navigate to http://localhost:5173/settings/subscription
2. Open browser console (F12)
3. Watch for debug messages
```

## Expected Results

### ✅ Success Indicators
- No 401 errors in console
- Page loads successfully
- Subscription status displays (even if "trial")
- Console shows: `[DEBUG] Checking subscription status`
- No error messages after the debug log

### ❌ Failure Indicators
- Still seeing 401 errors
- Error message: "Subscription status check failed"
- Page shows error state
- Infinite loading spinner

## Console Output Comparison

### Before Fix (Bad)
```
[DEBUG] Checking subscription status
POST https://...supabase.co/functions/v1/check-subscription 401 (Unauthorized)
[ERROR] Subscription status check failed {error: FunctionsHttpError...}
```

### After Fix (Good)
```
[DEBUG] Checking subscription status
[INFO] Subscription status retrieved {status: "trial", hasAccess: false, ...}
```

## Troubleshooting

### If Still Getting 401 Errors

**Check 1: Are you logged in?**
```
- Look for user info in app header
- Check Local Storage for auth token:
  DevTools → Application → Local Storage → sb-gqalsczfephexbserzqp-auth-token
```

**Check 2: Did the fix apply?**
```bash
# Verify the code was changed
cd /home/linux/EduPuzzle/EduPuzzle
grep -n "loading" src/hooks/useSubscription.ts

# Should see:
# Line 45: const { user, isAuthenticated, loading } = useAuth()
# Line 50: enabled: !loading && isAuthenticated && !!user?.id,
```

**Check 3: Is the function deployed?**
```bash
supabase functions list | grep check-subscription

# Should show: ACTIVE status with version 8
```

### If Page Shows Error State

The error boundary is working correctly. Check console for actual error message.

### If Still Having Issues

1. **Logout and login again**
   - Sometimes auth state gets stuck
   - Fresh login session helps

2. **Check function logs**
   ```bash
   # In separate terminal
   supabase functions logs check-subscription
   ```

3. **Test function directly**
   ```bash
   # Get JWT from browser Local Storage
   # Then test:
   curl -X POST https://gqalsczfephexbserzqp.supabase.co/functions/v1/check-subscription \
     -H "Authorization: Bearer YOUR_JWT_HERE" \
     -H "apikey: YOUR_ANON_KEY"
   ```

## What You Should See

### Subscription Settings Page

The page should display:
- ✅ "Subscription Status" card
- ✅ Current plan information
- ✅ "Free Trial" or subscription status badge
- ✅ "Start Free Trial" or "Manage Subscription" button
- ✅ Premium features list
- ✅ Payment method section
- ✅ Billing history section

### No Error Messages
- ❌ No "Unable to Load Subscription" error card
- ❌ No 401 errors in console
- ❌ No loading spinner stuck forever

## Next Steps After Verification

Once the 401 error is fixed:

1. **Test "Start Free Trial" button**
   - Should create checkout session
   - Should redirect to Stripe
   - May take a few seconds

2. **Complete test checkout**
   - Use card: 4242 4242 4242 4242
   - Any future expiry
   - Any 3-digit CVC

3. **Verify webhook processing**
   - After checkout, check database
   - Subscription status should update

---

**Fix Version:** v1.0  
**Last Updated:** 2025-11-19  
**Status:** Ready for testing
