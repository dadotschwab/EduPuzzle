-- EduPuzzle Complete Database Schema
-- Run this script directly in Supabase SQL Editor
-- This includes all necessary tables, indexes, RLS policies, and functions

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===========================================
-- USERS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'expired', 'past_due')),
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  trial_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days',
  stripe_customer_id TEXT UNIQUE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- WORD LISTS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS word_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  source_language TEXT NOT NULL DEFAULT 'en',
  target_language TEXT NOT NULL DEFAULT 'es',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- WORDS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES word_lists(id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  translation TEXT NOT NULL,
  definition TEXT,
  example_sentence TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- WORD PROGRESS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS word_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word_id UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  stage INTEGER DEFAULT 0 CHECK (stage >= 0 AND stage <= 6),
  ease_factor DECIMAL(3,2) DEFAULT 2.50 CHECK (ease_factor >= 1.30 AND ease_factor <= 2.50),
  interval_days INTEGER DEFAULT 1 CHECK (interval_days >= 1),
  next_review_date DATE NOT NULL DEFAULT CURRENT_DATE,
  last_reviewed_at DATE,
  total_reviews INTEGER DEFAULT 0 CHECK (total_reviews >= 0),
  correct_reviews INTEGER DEFAULT 0 CHECK (correct_reviews >= 0),
  incorrect_reviews INTEGER DEFAULT 0 CHECK (incorrect_reviews >= 0),
  current_streak INTEGER DEFAULT 0 CHECK (current_streak >= 0),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, word_id)
);

-- ===========================================
-- PUZZLE SESSIONS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS puzzle_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word_ids UUID[] NOT NULL,
  grid_size INTEGER NOT NULL,
  placed_words JSONB NOT NULL,
  grid JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  score INTEGER DEFAULT 0
);

-- ===========================================
-- WORD REVIEWS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS word_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word_id UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  puzzle_session_id UUID REFERENCES puzzle_sessions(id) ON DELETE SET NULL,
  quality INTEGER NOT NULL CHECK (quality >= 0 AND quality <= 5),
  response_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- PUZZLE CACHE TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS puzzle_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word_ids TEXT NOT NULL, -- JSON array as string for indexing
  puzzle_data JSONB NOT NULL,
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, word_ids)
);

-- ===========================================
-- SHARED LISTS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS shared_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word_list_id UUID NOT NULL REFERENCES word_lists(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_collaborative BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days'
);

-- ===========================================
-- LIST COLLABORATORS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS list_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_list_id UUID NOT NULL REFERENCES shared_lists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  leaderboard_opted_in BOOLEAN DEFAULT true,
  cached_score INTEGER DEFAULT 0,
  score_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(shared_list_id, user_id)
);

-- ===========================================
-- WEBHOOK EVENTS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  customer_id TEXT,
  subscription_id TEXT,
  user_id UUID REFERENCES users(id),
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- DAILY STREAKS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS daily_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak INTEGER DEFAULT 0 CHECK (longest_streak >= 0),
  last_activity_date DATE,
  streak_start_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ===========================================
-- BUDDY SYSTEM TABLES
-- ===========================================
CREATE TABLE IF NOT EXISTS buddy_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(requester_id, target_id)
);

CREATE TABLE IF NOT EXISTS buddies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (user1_id < user2_id), -- Prevent duplicate pairs
  UNIQUE(user1_id, user2_id)
);

-- ===========================================
-- INDEXES FOR PERFORMANCE
-- ===========================================

-- Leaderboard performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_list_collaborators_leaderboard_perf
ON list_collaborators(shared_list_id, cached_score DESC, score_updated_at DESC)
WHERE leaderboard_opted_in = true;

-- Shared list access indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shared_lists_active_lookup
ON shared_lists(share_token, is_active)
WHERE is_active = true;

-- Word progress review indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_word_progress_user_next_review
ON word_progress(user_id, next_review_date)
WHERE next_review_date IS NOT NULL;

-- Collaborative list lookup indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_list_collaborators_user_lookup
ON list_collaborators(user_id, shared_list_id);

-- Word list lookup indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_words_list_lookup
ON words(list_id, created_at)
WHERE list_id IS NOT NULL;

-- ===========================================
-- ROW LEVEL SECURITY POLICIES
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE words ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE puzzle_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE puzzle_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE buddy_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE buddies ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "users_own_records" ON users
  FOR ALL USING (auth.uid() = id);

-- Word lists policies
CREATE POLICY "word_lists_owner_access" ON word_lists
  FOR ALL USING (auth.uid() = user_id);

-- Words policies
CREATE POLICY "words_list_owner_access" ON words
  FOR ALL USING (
    list_id IN (
      SELECT id FROM word_lists WHERE user_id = auth.uid()
    )
  );

-- Word progress policies
CREATE POLICY "word_progress_own_records" ON word_progress
  FOR ALL USING (auth.uid() = user_id);

-- Puzzle sessions policies
CREATE POLICY "puzzle_sessions_own_records" ON puzzle_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Word reviews policies
CREATE POLICY "word_reviews_own_records" ON word_reviews
  FOR ALL USING (auth.uid() = user_id);

-- Puzzle cache policies
CREATE POLICY "puzzle_cache_own_records" ON puzzle_cache
  FOR ALL USING (auth.uid() = user_id);

-- Shared lists policies (secure - authenticated only)
CREATE POLICY "authenticated_view_shared_lists" ON shared_lists
  FOR SELECT TO authenticated
  USING (
    is_active = true AND (
      created_by = auth.uid() OR
      id IN (
        SELECT shared_list_id
        FROM list_collaborators
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "shared_lists_owner_manage" ON shared_lists
  FOR ALL USING (auth.uid() = created_by);

-- List collaborators policies
CREATE POLICY "list_collaborators_member_access" ON list_collaborators
  FOR ALL USING (
    user_id = auth.uid() OR
    shared_list_id IN (
      SELECT id FROM shared_lists WHERE created_by = auth.uid()
    )
  );

-- Webhook events policies (service role only)
CREATE POLICY "webhook_events_service_only" ON stripe_webhook_events
  FOR ALL USING (auth.role() = 'service_role');

-- Daily streaks policies
CREATE POLICY "daily_streaks_own_records" ON daily_streaks
  FOR ALL USING (auth.uid() = user_id);

-- Buddy system policies
CREATE POLICY "buddy_requests_own_or_target" ON buddy_requests
  FOR ALL USING (auth.uid() = requester_id OR auth.uid() = target_id);

CREATE POLICY "buddies_own_relationships" ON buddies
  FOR ALL USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- ===========================================
-- FUNCTIONS
-- ===========================================

-- Function to calculate SRS progress
CREATE OR REPLACE FUNCTION calculate_srs_progress(user_uuid UUID)
RETURNS TABLE(
  total_words BIGINT,
  learned_words BIGINT,
  review_due BIGINT,
  success_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT w.id) as total_words,
    COUNT(DISTINCT CASE WHEN wp.stage > 0 THEN w.id END) as learned_words,
    COUNT(DISTINCT CASE WHEN wp.next_review_date <= CURRENT_DATE THEN w.id END) as review_due,
    COALESCE(
      ROUND(
        (SUM(CASE WHEN wp.total_reviews > 0 THEN wp.correct_reviews::DECIMAL / wp.total_reviews ELSE 0 END) /
         GREATEST(COUNT(DISTINCT CASE WHEN wp.total_reviews > 0 THEN w.id END), 1)) * 100,
        2
      ),
      0
    ) as success_rate
  FROM words w
  LEFT JOIN word_progress wp ON w.id = wp.word_id AND wp.user_id = user_uuid
  WHERE w.list_id IN (
    SELECT id FROM word_lists WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to import shared list copy (public access via token)
CREATE OR REPLACE FUNCTION import_shared_list_copy(share_token_param TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
  shared_list_record RECORD;
  new_list_id UUID;
  copied_word_count INTEGER := 0;
BEGIN
  -- Find the shared list
  SELECT sl.*, wl.name, wl.description, wl.source_language, wl.target_language
  INTO shared_list_record
  FROM shared_lists sl
  JOIN word_lists wl ON sl.word_list_id = wl.id
  WHERE sl.share_token = share_token_param
  AND sl.is_active = true;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Shared list not found or inactive');
  END IF;

  -- Create new word list for the current user
  INSERT INTO word_lists (user_id, name, description, source_language, target_language)
  VALUES (auth.uid(), shared_list_record.name || ' (Copy)', shared_list_record.description,
          shared_list_record.source_language, shared_list_record.target_language)
  RETURNING id INTO new_list_id;

  -- Copy all words
  INSERT INTO words (list_id, term, translation, definition, example_sentence)
  SELECT new_list_id, term, translation, definition, example_sentence
  FROM words
  WHERE list_id = shared_list_record.word_list_id;

  GET DIAGNOSTICS copied_word_count = ROW_COUNT;

  RETURN json_build_object(
    'success', true,
    'list_id', new_list_id,
    'word_count', copied_word_count,
    'message', format('Successfully imported %s words', copied_word_count)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to join collaborative list
CREATE OR REPLACE FUNCTION join_collaborative_list(share_token_param TEXT)
RETURNS JSON AS $$
DECLARE
  shared_list_record RECORD;
BEGIN
  -- Find the collaborative shared list
  SELECT sl.*
  INTO shared_list_record
  FROM shared_lists sl
  WHERE sl.share_token = share_token_param
  AND sl.is_active = true
  AND sl.is_collaborative = true;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Collaborative list not found or not available');
  END IF;

  -- Check if user is already a collaborator
  IF EXISTS (
    SELECT 1 FROM list_collaborators
    WHERE shared_list_id = shared_list_record.id
    AND user_id = auth.uid()
  ) THEN
    RETURN json_build_object('success', false, 'error', 'You are already a collaborator on this list');
  END IF;

  -- Add user as collaborator
  INSERT INTO list_collaborators (shared_list_id, user_id)
  VALUES (shared_list_record.id, auth.uid());

  RETURN json_build_object(
    'success', true,
    'list_id', shared_list_record.word_list_id,
    'message', 'Successfully joined collaborative list'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to leave collaborative list
CREATE OR REPLACE FUNCTION leave_collaborative_list(list_id_param UUID)
RETURNS JSON AS $$
BEGIN
  -- Remove user from collaborators
  DELETE FROM list_collaborators
  WHERE shared_list_id IN (
    SELECT id FROM shared_lists WHERE word_list_id = list_id_param
  )
  AND user_id = auth.uid();

  IF FOUND THEN
    RETURN json_build_object('success', true, 'message', 'Successfully left collaborative list');
  ELSE
    RETURN json_build_object('success', false, 'error', 'You are not a collaborator on this list');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- TRIGGERS FOR UPDATED_AT
-- ===========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to relevant tables
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_word_lists_updated_at
  BEFORE UPDATE ON word_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_word_progress_updated_at
  BEFORE UPDATE ON word_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_streaks_updated_at
  BEFORE UPDATE ON daily_streaks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_buddy_requests_updated_at
  BEFORE UPDATE ON buddy_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- INITIAL DATA SEEDING (OPTIONAL)
-- ===========================================

-- Insert a sample user if none exists (for testing)
INSERT INTO users (email, subscription_status, trial_end_date)
SELECT 'test@example.com', 'trial', NOW() + INTERVAL '7 days'
WHERE NOT EXISTS (SELECT 1 FROM users LIMIT 1);

-- Insert sample word list for the test user
INSERT INTO word_lists (user_id, name, description, source_language, target_language)
SELECT u.id, 'Sample Vocabulary', 'A sample word list to get started', 'en', 'es'
FROM users u
WHERE u.email = 'test@example.com'
AND NOT EXISTS (SELECT 1 FROM word_lists LIMIT 1);

-- Insert sample words
INSERT INTO words (list_id, term, translation, definition)
SELECT wl.id, 'hello', 'hola', 'A greeting used when meeting someone'
FROM word_lists wl
WHERE wl.name = 'Sample Vocabulary'
AND NOT EXISTS (SELECT 1 FROM words LIMIT 1);

INSERT INTO words (list_id, term, translation, definition)
SELECT wl.id, 'goodbye', 'adiós', 'A farewell expression'
FROM word_lists wl
WHERE wl.name = 'Sample Vocabulary'
AND (SELECT COUNT(*) FROM words) = 1;

INSERT INTO words (list_id, term, translation, definition)
SELECT wl.id, 'thank you', 'gracias', 'An expression of gratitude'
FROM word_lists wl
WHERE wl.name = 'Sample Vocabulary'
AND (SELECT COUNT(*) FROM words) = 2;

COMMIT;