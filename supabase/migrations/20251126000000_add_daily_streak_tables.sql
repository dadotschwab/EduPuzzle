-- Migration: Add daily streak system tables
-- File: supabase/migrations/20251126000000_add_daily_streak_tables.sql

-- Table: user_streaks
-- Purpose: Store user streak data and freeze mechanics
CREATE TABLE public.user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  current_streak INTEGER DEFAULT 0 NOT NULL CHECK (current_streak >= 0),
  longest_streak INTEGER DEFAULT 0 NOT NULL CHECK (longest_streak >= 0),
  streak_freezes_available INTEGER DEFAULT 1 NOT NULL CHECK (streak_freezes_available >= 0),
  last_streak_update TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Table: daily_completions
-- Purpose: Track daily learning activity for streak calculation
CREATE TABLE public.daily_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  completion_date DATE NOT NULL,
  puzzles_completed INTEGER DEFAULT 0 NOT NULL CHECK (puzzles_completed >= 0),
  words_completed INTEGER DEFAULT 0 NOT NULL CHECK (words_completed >= 0),
  due_words_count INTEGER DEFAULT 0 NOT NULL CHECK (due_words_count >= 0),
  streak_maintained BOOLEAN DEFAULT false,
  freeze_used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, completion_date)
);

-- Indexes for performance
CREATE INDEX idx_user_streaks_user_id ON public.user_streaks(user_id);
CREATE INDEX idx_daily_completions_user_date ON public.daily_completions(user_id, completion_date DESC);
CREATE INDEX idx_daily_completions_date ON public.daily_completions(completion_date);
CREATE INDEX idx_daily_completions_streak_maintained ON public.daily_completions(streak_maintained) WHERE streak_maintained = true;

-- Comments for clarity
COMMENT ON TABLE public.user_streaks IS 'User streak counters and freeze mechanics for daily learning motivation';
COMMENT ON COLUMN public.user_streaks.current_streak IS 'Current consecutive days of streak maintenance';
COMMENT ON COLUMN public.user_streaks.longest_streak IS 'Personal best streak length';
COMMENT ON COLUMN public.user_streaks.streak_freezes_available IS 'Available streak freezes (refilled monthly)';
COMMENT ON TABLE public.daily_completions IS 'Daily learning activity tracking for streak calculation';
COMMENT ON COLUMN public.daily_completions.puzzles_completed IS 'Number of crossword puzzles completed today';
COMMENT ON COLUMN public.daily_completions.words_completed IS 'Number of vocabulary words reviewed today';
COMMENT ON COLUMN public.daily_completions.due_words_count IS 'Total due words at start of day';
COMMENT ON COLUMN public.daily_completions.streak_maintained IS 'Whether streak condition was met (5+ puzzles OR all due words)';

-- Enable RLS on both tables
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_completions ENABLE ROW LEVEL SECURITY;

-- User Streaks: Users can only read/write their own streak data
CREATE POLICY "users_read_own_streaks"
  ON public.user_streaks
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_update_own_streaks"
  ON public.user_streaks
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can manage all streak data (for cron jobs and webhooks)
CREATE POLICY "service_role_manage_streaks"
  ON public.user_streaks
  FOR ALL
  USING (auth.role() = 'service_role');

-- Daily Completions: Users can only read/write their own completion data
CREATE POLICY "users_read_own_completions"
  ON public.daily_completions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_completions"
  ON public.daily_completions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_completions"
  ON public.daily_completions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can manage all completion data (for cron jobs)
CREATE POLICY "service_role_manage_completions"
  ON public.daily_completions
  FOR ALL
  USING (auth.role() = 'service_role');

-- Function: record_daily_completion
-- Purpose: Record daily learning activity and update streaks
-- Usage: Called when user completes puzzles or reviews words
CREATE OR REPLACE FUNCTION public.record_daily_completion(
  user_id_param UUID,
  puzzles_completed_param INTEGER DEFAULT 0,
  words_completed_param INTEGER DEFAULT 0,
  due_words_count_param INTEGER DEFAULT 0
)
RETURNS TABLE (
  streak_maintained BOOLEAN,
  current_streak INTEGER,
  longest_streak INTEGER,
  freeze_used BOOLEAN
) AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
  existing_completion RECORD;
  streak_condition_met BOOLEAN;
  user_streak RECORD;
  freeze_used BOOLEAN := false;
BEGIN
  -- Check if completion already exists for today
  SELECT * INTO existing_completion
  FROM daily_completions
  WHERE user_id = user_id_param AND completion_date = today_date;

  -- Update or insert completion record
  IF existing_completion.id IS NOT NULL THEN
    -- Update existing record
    UPDATE daily_completions
    SET
      puzzles_completed = GREATEST(existing_completion.puzzles_completed, puzzles_completed_param),
      words_completed = GREATEST(existing_completion.words_completed, words_completed_param),
      due_words_count = GREATEST(existing_completion.due_words_count, due_words_count_param),
      updated_at = now()
    WHERE id = existing_completion.id;
  ELSE
    -- Insert new record
    INSERT INTO daily_completions (
      user_id, completion_date, puzzles_completed, words_completed, due_words_count
    ) VALUES (
      user_id_param, today_date, puzzles_completed_param, words_completed_param, due_words_count_param
    );
  END IF;

  -- Check streak condition: 5+ puzzles OR all due words completed
  SELECT (puzzles_completed >= 5 OR words_completed >= due_words_count) INTO streak_condition_met
  FROM daily_completions
  WHERE user_id = user_id_param AND completion_date = today_date;

  -- Get or create user streak record
  SELECT * INTO user_streak
  FROM user_streaks
  WHERE user_id = user_id_param;

  IF user_streak.id IS NULL THEN
    -- Create initial streak record
    INSERT INTO user_streaks (user_id) VALUES (user_id_param)
    RETURNING * INTO user_streak;
  END IF;

  -- Update streak based on condition
  IF streak_condition_met THEN
    -- Maintain/increase streak
    user_streak.current_streak := user_streak.current_streak + 1;
    user_streak.longest_streak := GREATEST(user_streak.longest_streak, user_streak.current_streak);
  ELSE
    -- Check if we can use a freeze
    IF user_streak.streak_freezes_available > 0 THEN
      user_streak.streak_freezes_available := user_streak.streak_freezes_available - 1;
      freeze_used := true;
      -- Keep current streak intact
    ELSE
      -- Reset streak
      user_streak.current_streak := 0;
    END IF;
  END IF;

  -- Update streak record
  UPDATE user_streaks
  SET
    current_streak = user_streak.current_streak,
    longest_streak = user_streak.longest_streak,
    streak_freezes_available = user_streak.streak_freezes_available,
    last_streak_update = now(),
    updated_at = now()
  WHERE id = user_streak.id;

  -- Update completion record with streak status
  UPDATE daily_completions
  SET
    streak_maintained = streak_condition_met,
    freeze_used = freeze_used,
    updated_at = now()
  WHERE user_id = user_id_param AND completion_date = today_date;

  -- Return updated values
  RETURN QUERY SELECT
    streak_condition_met,
    user_streak.current_streak,
    user_streak.longest_streak,
    freeze_used;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: refill_streak_freezes
-- Purpose: Monthly refill of streak freezes (called by cron job)
-- Usage: Run on 1st of each month at 00:10 UTC
CREATE OR REPLACE FUNCTION public.refill_streak_freezes()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Refill streak freezes to 1 for all users
  UPDATE user_streaks
  SET
    streak_freezes_available = 1,
    updated_at = now()
  WHERE streak_freezes_available < 1;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: process_daily_streak_maintenance
-- Purpose: Daily maintenance to handle missed days (called by cron job)
-- Usage: Run daily at 00:05 UTC
CREATE OR REPLACE FUNCTION public.process_daily_streak_maintenance()
RETURNS INTEGER AS $$
DECLARE
  yesterday_date DATE := CURRENT_DATE - INTERVAL '1 day';
  processed_count INTEGER := 0;
  user_record RECORD;
BEGIN
  -- Find users who didn't complete yesterday and don't have a completion record
  FOR user_record IN
    SELECT DISTINCT us.user_id
    FROM user_streaks us
    LEFT JOIN daily_completions dc ON dc.user_id = us.user_id AND dc.completion_date = yesterday_date
    WHERE dc.id IS NULL
  LOOP
    -- Record missed day (will trigger freeze consumption via record_daily_completion)
    PERFORM record_daily_completion(user_record.user_id, 0, 0, 0);
    processed_count := processed_count + 1;
  END LOOP;

  RETURN processed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.record_daily_completion(UUID, INTEGER, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refill_streak_freezes() TO service_role;
GRANT EXECUTE ON FUNCTION public.process_daily_streak_maintenance() TO service_role;

-- Trigger: Auto-update updated_at on user_streaks
CREATE OR REPLACE FUNCTION update_user_streaks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_streaks_updated_at
  BEFORE UPDATE ON public.user_streaks
  FOR EACH ROW
  EXECUTE FUNCTION update_user_streaks_updated_at();

-- Trigger: Auto-update updated_at on daily_completions
CREATE OR REPLACE FUNCTION update_daily_completions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_daily_completions_updated_at
  BEFORE UPDATE ON public.daily_completions
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_completions_updated_at();

-- Enable Realtime for user_streaks table
-- Purpose: Live streak updates on dashboard without page refresh
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_streaks;

-- Note: Client filters to own user_id, RLS ensures security
-- Realtime events will trigger on streak changes for instant UI updates