-- Migration: Add efficient SRS counting function and indexes
-- File: supabase/migrations/20251125000000_optimize_srs_performance.sql

-- Add composite index for due words query (existing, but ensure it exists)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_word_progress_due_words_composite
  ON word_progress(user_id, next_review_date)
  WHERE next_review_date <= CURRENT_DATE;

-- Add partial index for active subscriptions (Stripe integration)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active_subscriptions
  ON users(stripe_customer_id)
  WHERE subscription_status IN ('active', 'trial');

-- Function: Efficient due words count (eliminates N+1 query)
CREATE OR REPLACE FUNCTION public.get_due_words_count(user_id_param UUID)
RETURNS INTEGER AS $
DECLARE
  due_count INTEGER;
  today_date DATE := CURRENT_DATE;
BEGIN
  -- Count words that are due today or overdue
  SELECT COUNT(*) INTO due_count
  FROM words w
  INNER JOIN word_lists wl ON wl.id = w.list_id AND wl.user_id = user_id_param
  LEFT JOIN word_progress wp ON wp.word_id = w.id AND wp.user_id = user_id_param
  WHERE
    -- New words (no progress record)
    wp.id IS NULL
    -- OR words due today/overdue
    OR (wp.next_review_date IS NOT NULL AND wp.next_review_date <= today_date)
    -- Exclude words already reviewed today
    AND (wp.last_reviewed_at IS NULL OR DATE(wp.last_reviewed_at) < today_date);

  RETURN COALESCE(due_count, 0);
END;
$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function: Batch SRS progress calculation (reduces sequential queries)
CREATE OR REPLACE FUNCTION public.calculate_srs_progress(
  word_id_param UUID,
  user_id_param UUID,
  was_correct_param BOOLEAN
)
RETURNS TABLE (
  new_stage INTEGER,
  new_interval_days INTEGER,
  new_ease_factor DECIMAL(3,2),
  new_next_review_date DATE
) AS $
DECLARE
  current_progress RECORD;
  updates RECORD;
BEGIN
  -- Get current progress
  SELECT * INTO current_progress
  FROM word_progress
  WHERE word_id = word_id_param AND user_id = user_id_param;

  -- If no progress exists, create initial
  IF NOT FOUND THEN
    -- Return initial values for new word
    RETURN QUERY SELECT
      CASE WHEN was_correct_param THEN 1 ELSE 0 END as new_stage,
      CASE WHEN was_correct_param THEN 2 ELSE 1 END as new_interval_days,
      2.50::DECIMAL(3,2) as new_ease_factor,
      (CURRENT_DATE + INTERVAL '1 day' * CASE WHEN was_correct_param THEN 2 ELSE 1 END)::DATE as new_next_review_date;
    RETURN;
  END IF;

  -- Calculate SM-2 updates
  updates := current_progress;

  -- Update review counts
  updates.total_reviews := current_progress.total_reviews + 1;
  IF was_correct_param THEN
    updates.correct_reviews := current_progress.correct_reviews + 1;
    updates.current_streak := current_progress.current_streak + 1;
  ELSE
    updates.incorrect_reviews := current_progress.incorrect_reviews + 1;
    updates.current_streak := 0;
  END IF;

  -- Calculate new interval and ease factor
  IF was_correct_param THEN
    -- Correct answer
    IF current_progress.interval_days = 0 THEN
      updates.interval_days := 1;
    ELSIF current_progress.interval_days = 1 THEN
      updates.interval_days := 6;
    ELSE
      updates.interval_days := ROUND(current_progress.interval_days * current_progress.ease_factor)::INTEGER;
    END IF;

    updates.ease_factor := LEAST(2.5, current_progress.ease_factor + 0.1);

    -- Stage progression
    IF current_progress.stage = 0 THEN
      updates.stage := 1; -- New → Learning
    ELSIF current_progress.stage = 1 AND updates.interval_days >= 7 THEN
      updates.stage := 2; -- Learning → Young
    ELSIF current_progress.stage = 2 AND updates.interval_days >= 30 THEN
      updates.stage := 3; -- Young → Mature
    ELSIF current_progress.stage = 4 AND updates.interval_days >= 7 THEN
      updates.stage := 2; -- Relearning → Young
    END IF;
  ELSE
    -- Incorrect answer
    updates.interval_days := 1;
    updates.ease_factor := GREATEST(1.3, current_progress.ease_factor - 0.2);

    -- Demote mature words
    IF current_progress.stage = 3 THEN
      updates.stage := 4; -- Mature → Relearning
    END IF;
  END IF;

  -- Calculate next review date
  updates.next_review_date := CURRENT_DATE + INTERVAL '1 day' * updates.interval_days;

  RETURN QUERY SELECT
    updates.stage,
    updates.interval_days,
    updates.ease_factor,
    updates.next_review_date;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_due_words_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_srs_progress(UUID, UUID, BOOLEAN) TO authenticated;

-- Comments for documentation
COMMENT ON FUNCTION public.get_due_words_count(UUID) IS 'Efficiently counts due words for SRS dashboard without N+1 queries';
COMMENT ON FUNCTION public.calculate_srs_progress(UUID, UUID, BOOLEAN) IS 'Calculates SM-2 algorithm updates for word progress';