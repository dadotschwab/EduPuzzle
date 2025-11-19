# 🚀 Quick Deployment Guide - Stripe Webhook Fix

## ⚡ TL;DR

Configuration changes complete. Deploy now to fix 401 errors.

---

## 📋 Quick Checklist

```bash
# 1. Deploy function (REQUIRED)
cd /home/linux/EduPuzzle/EduPuzzle
supabase functions deploy stripe-webhook

# 2. Verify deployment
supabase functions list

# 3. Check secrets are set
supabase secrets list
# Should show: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET

# 4. Test webhook
stripe trigger checkout.session.completed

# 5. Check logs
supabase functions logs stripe-webhook --limit 10
```

---

## 🔧 Stripe Dashboard Fix

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click your webhook endpoint
3. Ensure URL is: `https://gqalsczfephexbserzqp.supabase.co/functions/v1/stripe-webhook`
4. Remove `?apikey=` if present
5. Save

---

## ✅ Expected Results

**Before Fix:**
```
❌ Status: 401
❌ Error: "Missing authorization header"
❌ Database: Not updated
```

**After Fix:**
```
✅ Status: 200 OK
✅ Response: {"ok": true}
✅ Database: Updated with subscription data
```

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Still 401 | Re-deploy: `supabase functions deploy stripe-webhook` |
| Invalid signature | Check: `supabase secrets list` for STRIPE_WEBHOOK_SECRET |
| No DB updates | Check logs: `supabase functions logs stripe-webhook` |

---

## 📚 Full Documentation

- **Deployment Guide:** `STRIPE_WEBHOOK_DEPLOYMENT.md`
- **Implementation Summary:** `IMPLEMENTATION_SUMMARY.md`
- **Fix Instructions:** `STRIPE_FIX_INSTRUCTIONS.md`

---

**Time to deploy:** 5 minutes  
**Difficulty:** Easy

**Ready? Run the commands above! 🚀**
