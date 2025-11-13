-- EDU-PUZZLE Database Schema
-- Initial migration: Core tables and indexes

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  subscription_status TEXT DEFAULT 'trial',
  subscription_end_date TIMESTAMP,
  trial_end_date TIMESTAMP DEFAULT NOW() + INTERVAL '7 days'
);

-- Word Lists table
CREATE TABLE word_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  source_language TEXT NOT NULL,
  target_language TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Words table
CREATE TABLE words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES word_lists(id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  translation TEXT NOT NULL,
  definition TEXT,
  example_sentence TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Word Progress table (SRS tracking)
CREATE TABLE word_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  word_id UUID REFERENCES words(id) ON DELETE CASCADE,
  repetition_level INTEGER DEFAULT 0,
  next_review_date DATE DEFAULT CURRENT_DATE,
  last_reviewed_at TIMESTAMP,
  total_reviews INTEGER DEFAULT 0,
  correct_reviews INTEGER DEFAULT 0,
  UNIQUE(user_id, word_id)
);

-- Puzzle Sessions table
CREATE TABLE puzzle_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  list_id UUID REFERENCES word_lists(id),
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  puzzle_data JSONB NOT NULL,
  total_words INTEGER NOT NULL,
  correct_words INTEGER DEFAULT 0
);

-- Word Reviews table (individual word performance)
CREATE TABLE word_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES puzzle_sessions(id) ON DELETE CASCADE,
  word_id UUID REFERENCES words(id),
  user_id UUID REFERENCES users(id),
  review_type TEXT NOT NULL,
  time_to_solve INTEGER,
  hints_used INTEGER DEFAULT 0,
  reviewed_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_word_progress_next_review ON word_progress(user_id, next_review_date);
CREATE INDEX idx_words_list ON words(list_id);
CREATE INDEX idx_puzzle_sessions_user ON puzzle_sessions(user_id, started_at DESC);
CREATE INDEX idx_word_lists_user ON word_lists(user_id);
CREATE INDEX idx_word_reviews_session ON word_reviews(session_id);

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE words ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE puzzle_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_reviews ENABLE ROW LEVEL SECURITY;

-- Users: Can only read their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Word Lists: Full access to own lists
CREATE POLICY "Users can view own word lists" ON word_lists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own word lists" ON word_lists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own word lists" ON word_lists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own word lists" ON word_lists
  FOR DELETE USING (auth.uid() = user_id);

-- Words: Access through word_lists ownership
CREATE POLICY "Users can view words in their lists" ON words
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM word_lists
      WHERE word_lists.id = words.list_id
      AND word_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create words in their lists" ON words
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM word_lists
      WHERE word_lists.id = words.list_id
      AND word_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update words in their lists" ON words
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM word_lists
      WHERE word_lists.id = words.list_id
      AND word_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete words in their lists" ON words
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM word_lists
      WHERE word_lists.id = words.list_id
      AND word_lists.user_id = auth.uid()
    )
  );

-- Word Progress: Full access to own progress
CREATE POLICY "Users can view own word progress" ON word_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own word progress" ON word_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own word progress" ON word_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Puzzle Sessions: Full access to own sessions
CREATE POLICY "Users can view own puzzle sessions" ON puzzle_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own puzzle sessions" ON puzzle_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own puzzle sessions" ON puzzle_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Word Reviews: Full access to own reviews
CREATE POLICY "Users can view own word reviews" ON word_reviews
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own word reviews" ON word_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for word_lists updated_at
CREATE TRIGGER update_word_lists_updated_at
  BEFORE UPDATE ON word_lists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
