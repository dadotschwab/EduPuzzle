-- Fix: Update streak table foreign key references to use public.users instead of auth.users
-- This ensures consistency with the rest of the schema

-- Drop existing foreign key constraints
ALTER TABLE public.user_streaks DROP CONSTRAINT IF EXISTS user_streaks_user_id_fkey;
ALTER TABLE public.daily_completions DROP CONSTRAINT IF EXISTS daily_completions_user_id_fkey;

-- Update foreign key references to point to public.users
ALTER TABLE public.user_streaks
  ADD CONSTRAINT user_streaks_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.daily_completions
  ADD CONSTRAINT daily_completions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;