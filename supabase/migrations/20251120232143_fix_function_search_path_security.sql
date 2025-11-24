-- Migration: Fix Function Search Path Security
-- Created: 2025-11-20
-- Purpose: Add search_path = '' to all SECURITY DEFINER functions to prevent SQL injection
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

-- 1. Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 2. Fix handle_new_user function  
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, email, subscription_status, trial_end_date, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    'trial',
    NEW.created_at + INTERVAL '7 days',
    NEW.created_at
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 3. Fix cleanup_expired_puzzle_cache function (if exists)
CREATE OR REPLACE FUNCTION public.cleanup_expired_puzzle_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.puzzle_cache
  WHERE valid_until < NOW();
END;
$$;

-- 4. Fix initialize_word_progress function (if exists)
CREATE OR REPLACE FUNCTION public.initialize_word_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.word_progress (user_id, word_id, stage, ease_factor, interval_days, next_review_date)
  SELECT 
    auth.uid(),
    NEW.id,
    0,
    2.5,
    1,
    CURRENT_DATE
  WHERE auth.uid() IS NOT NULL
  ON CONFLICT (user_id, word_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Add comments
COMMENT ON FUNCTION public.update_updated_at_column IS 'Automatically updates updated_at timestamp. SECURITY: search_path fixed.';
COMMENT ON FUNCTION public.handle_new_user IS 'Creates user record when auth user signs up. SECURITY: search_path fixed.';
COMMENT ON FUNCTION public.cleanup_expired_puzzle_cache IS 'Removes expired puzzle cache entries. SECURITY: search_path fixed.';
COMMENT ON FUNCTION public.initialize_word_progress IS 'Initializes progress tracking for new words. SECURITY: search_path fixed.';
