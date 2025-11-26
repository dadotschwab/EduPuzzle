-- Set a user to trial status (7 days from now)
-- Usage: Run this in your Supabase SQL editor, replacing the user_id

UPDATE users 
SET 
  subscription_status = 'trial',
  trial_end_date = NOW() + INTERVAL '7 days'
WHERE id = 'd9b18d67-9734-4cae-9a4a-c8fd2c6bf143';

-- Verify the update
SELECT 
  email,
  subscription_status,
  trial_end_date,
  subscription_end_date
FROM users 
WHERE id = 'd9b18d67-9734-4cae-9a4a-c8fd2c6bf143';
