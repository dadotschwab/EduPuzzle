-- EduPuzzle Database Updates - Only Missing/Changed Items
-- Run this script to add only what's missing from the existing database

-- Add missing tables
CREATE TABLE IF NOT EXISTS buddies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (user1_id < user2_id),
  UNIQUE(user1_id, user2_id)
);

CREATE TABLE IF NOT EXISTS buddy_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(requester_id, target_id)
);

-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_list_collaborators_leaderboard_perf
ON list_collaborators(shared_list_id, cached_score DESC, score_updated_at DESC)
WHERE leaderboard_opted_in = true;

CREATE INDEX IF NOT EXISTS idx_shared_lists_active_lookup
ON shared_lists(share_token, is_active)
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_word_progress_user_next_review
ON word_progress(user_id, next_review_date)
WHERE next_review_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_list_collaborators_user_lookup
ON list_collaborators(user_id, shared_list_id);

CREATE INDEX IF NOT EXISTS idx_words_list_lookup
ON words(list_id, created_at)
WHERE list_id IS NOT NULL;

-- Enable RLS on new tables
ALTER TABLE buddies ENABLE ROW LEVEL SECURITY;
ALTER TABLE buddy_requests ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for new tables
CREATE POLICY "buddy_requests_own_or_target" ON buddy_requests FOR ALL USING (auth.uid() = requester_id OR auth.uid() = target_id);
CREATE POLICY "buddies_own_relationships" ON buddies FOR ALL USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Update existing function signatures to match current database
DROP FUNCTION IF EXISTS calculate_srs_progress(UUID);
DROP FUNCTION IF EXISTS import_shared_list_copy(TEXT);
DROP FUNCTION IF EXISTS join_collaborative_list(TEXT);

CREATE OR REPLACE FUNCTION calculate_srs_progress(
  user_id_param UUID,
  was_correct_param BOOLEAN,
  word_id_param UUID
)
RETURNS TABLE(
  new_ease_factor DECIMAL,
  new_interval_days INTEGER,
  new_next_review_date DATE,
  new_stage INTEGER
) AS $$
DECLARE
  current_progress RECORD;
  new_ease_factor DECIMAL(3,2) := 2.50;
  new_interval_days INTEGER := 1;
  new_stage INTEGER := 0;
  new_next_review DATE := CURRENT_DATE;
BEGIN
  -- Get current progress
  SELECT * INTO current_progress
  FROM word_progress
  WHERE user_id = user_id_param AND word_id = word_id_param;

  IF NOT FOUND THEN
    -- New word
    new_stage := CASE WHEN was_correct_param THEN 1 ELSE 0 END;
    new_next_review := CASE WHEN was_correct_param THEN CURRENT_DATE + INTERVAL '1 day' ELSE CURRENT_DATE END;
  ELSE
    -- Existing word - apply SRS algorithm
    new_ease_factor := GREATEST(1.30, current_progress.ease_factor + (CASE WHEN was_correct_param THEN 0.10 ELSE -0.20 END));
    new_stage := CASE
      WHEN was_correct_param THEN LEAST(6, current_progress.stage + 1)
      ELSE GREATEST(0, current_progress.stage - 1)
    END;

    CASE new_stage
      WHEN 0 THEN new_interval_days := 1;
      WHEN 1 THEN new_interval_days := 3;
      WHEN 2 THEN new_interval_days := 7;
      WHEN 3 THEN new_interval_days := 14;
      WHEN 4 THEN new_interval_days := 30;
      WHEN 5 THEN new_interval_days := 90;
      WHEN 6 THEN new_interval_days := 180;
    END CASE;

    new_next_review := CURRENT_DATE + (new_interval_days || ' days')::INTERVAL;
  END IF;

  -- Update or insert progress
  INSERT INTO word_progress (
    user_id, word_id, stage, ease_factor, interval_days, next_review_date,
    total_reviews, correct_reviews, incorrect_reviews, updated_at
  ) VALUES (
    user_id_param, word_id_param, new_stage, new_ease_factor, new_interval_days, new_next_review,
    COALESCE(current_progress.total_reviews, 0) + 1,
    COALESCE(current_progress.correct_reviews, 0) + CASE WHEN was_correct_param THEN 1 ELSE 0 END,
    COALESCE(current_progress.incorrect_reviews, 0) + CASE WHEN was_correct_param THEN 0 ELSE 1 END,
    NOW()
  )
  ON CONFLICT (user_id, word_id) DO UPDATE SET
    stage = EXCLUDED.stage,
    ease_factor = EXCLUDED.ease_factor,
    interval_days = EXCLUDED.interval_days,
    next_review_date = EXCLUDED.next_review_date,
    total_reviews = EXCLUDED.total_reviews,
    correct_reviews = EXCLUDED.correct_reviews,
    incorrect_reviews = EXCLUDED.incorrect_reviews,
    updated_at = EXCLUDED.updated_at;

  RETURN QUERY SELECT new_ease_factor, new_interval_days, new_next_review, new_stage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION import_shared_list_copy(p_share_token TEXT)
RETURNS TEXT AS $$
DECLARE
  shared_list_record RECORD;
  new_list_id UUID;
  copied_word_count INTEGER := 0;
BEGIN
  SELECT sl.*, wl.name, wl.description, wl.source_language, wl.target_language
  INTO shared_list_record
  FROM shared_lists sl
  JOIN word_lists wl ON sl.original_list_id = wl.id
  WHERE sl.share_token = p_share_token AND sl.is_active = true;

  IF NOT FOUND THEN
    RETURN 'Shared list not found or inactive';
  END IF;

  INSERT INTO word_lists (user_id, name, description, source_language, target_language)
  VALUES (auth.uid(), shared_list_record.name || ' (Copy)', shared_list_record.description, shared_list_record.source_language, shared_list_record.target_language)
  RETURNING id INTO new_list_id;

  INSERT INTO words (list_id, term, translation, definition, example_sentence)
  SELECT new_list_id, term, translation, definition, example_sentence
  FROM words WHERE list_id = shared_list_record.original_list_id;

  GET DIAGNOSTICS copied_word_count = ROW_COUNT;

  RETURN 'Successfully imported ' || copied_word_count || ' words';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION join_collaborative_list(p_share_token TEXT)
RETURNS TEXT AS $$
DECLARE
  shared_list_record RECORD;
BEGIN
  SELECT sl.* INTO shared_list_record
  FROM shared_lists sl
  WHERE sl.share_token = p_share_token AND sl.is_active = true AND sl.share_mode = 'collaborative';

  IF NOT FOUND THEN
    RETURN 'Collaborative list not found or not available';
  END IF;

  IF EXISTS (SELECT 1 FROM list_collaborators WHERE shared_list_id = shared_list_record.id AND user_id = auth.uid()) THEN
    RETURN 'You are already a collaborator on this list';
  END IF;

  INSERT INTO list_collaborators (shared_list_id, user_id) VALUES (shared_list_record.id, auth.uid());

  RETURN 'Successfully joined collaborative list';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add missing triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_word_lists_updated_at ON word_lists;
DROP TRIGGER IF EXISTS update_word_progress_updated_at ON word_progress;
DROP TRIGGER IF EXISTS update_buddy_requests_updated_at ON buddy_requests;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_word_lists_updated_at BEFORE UPDATE ON word_lists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_word_progress_updated_at BEFORE UPDATE ON word_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_buddy_requests_updated_at BEFORE UPDATE ON buddy_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();