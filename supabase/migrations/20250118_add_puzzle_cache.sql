-- Add puzzle_cache table for server-side puzzle generation caching
-- This moves puzzle generation from client to server (Edge Function)
-- and caches results for 24 hours for better performance and consistency

-- Create puzzle_cache table
CREATE TABLE IF NOT EXISTS puzzle_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word_ids TEXT[] NOT NULL,  -- Sorted array of word IDs (cache key)
  puzzle_data JSONB NOT NULL, -- The generated puzzles
  generated_at TIMESTAMP DEFAULT NOW(),
  valid_until TIMESTAMP DEFAULT NOW() + INTERVAL '24 hours',

  -- Ensure one cache entry per user per word set
  UNIQUE (user_id, word_ids)
);

-- Index for fast lookups by user and validity
CREATE INDEX idx_puzzle_cache_user_valid
  ON puzzle_cache(user_id, valid_until)
  WHERE valid_until > NOW();

-- Index for cleanup of expired cache entries
CREATE INDEX idx_puzzle_cache_expired
  ON puzzle_cache(valid_until)
  WHERE valid_until <= NOW();

-- Row Level Security
ALTER TABLE puzzle_cache ENABLE ROW LEVEL SECURITY;

-- Users can only see/manage their own cached puzzles
CREATE POLICY puzzle_cache_user_policy ON puzzle_cache
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Function to clean up expired cache entries (run via cron or manually)
CREATE OR REPLACE FUNCTION cleanup_expired_puzzle_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM puzzle_cache
  WHERE valid_until <= NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment for documentation
COMMENT ON TABLE puzzle_cache IS 'Caches generated crossword puzzles for 24 hours to ensure consistency and performance';
COMMENT ON COLUMN puzzle_cache.word_ids IS 'Sorted array of word IDs used as cache key - same words = same cache entry';
COMMENT ON COLUMN puzzle_cache.puzzle_data IS 'JSONB containing array of generated Puzzle objects';
COMMENT ON COLUMN puzzle_cache.valid_until IS 'Cache entries are invalid after this timestamp';
