-- Enhance SRS System with SM-2 Algorithm Fields
-- Migration: Add ease factor, interval tracking, and streak data

-- Add new columns to word_progress table for enhanced SRS
ALTER TABLE word_progress
  ADD COLUMN IF NOT EXISTS ease_factor DECIMAL(3,2) DEFAULT 2.50,
  ADD COLUMN IF NOT EXISTS interval_days INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS incorrect_reviews INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stage INTEGER DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN word_progress.ease_factor IS 'SM-2 ease factor: 1.30 (hard) to 2.50 (easy)';
COMMENT ON COLUMN word_progress.interval_days IS 'Days between reviews, calculated by SM-2';
COMMENT ON COLUMN word_progress.stage IS '0=New, 1=Learning, 2=Young, 3=Mature, 4=Relearning';
COMMENT ON COLUMN word_progress.current_streak IS 'Consecutive correct answers';

-- Update existing records to have proper defaults
UPDATE word_progress
SET
  ease_factor = 2.50,
  interval_days = 0,
  incorrect_reviews = 0,
  current_streak = 0,
  stage = 0
WHERE ease_factor IS NULL;

-- Add constraint to keep ease_factor in valid range
ALTER TABLE word_progress
  ADD CONSTRAINT ease_factor_range CHECK (ease_factor >= 1.30 AND ease_factor <= 2.50);

-- Add constraint for stage values
ALTER TABLE word_progress
  ADD CONSTRAINT stage_values CHECK (stage >= 0 AND stage <= 4);

-- Create index for finding due words efficiently
CREATE INDEX IF NOT EXISTS idx_word_progress_due_words
  ON word_progress(user_id, next_review_date)
  WHERE next_review_date <= CURRENT_DATE;

-- Create function to initialize word progress for new words
CREATE OR REPLACE FUNCTION initialize_word_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new word is created, initialize progress for the word's list owner
  INSERT INTO word_progress (user_id, word_id, stage, next_review_date, ease_factor, interval_days)
  SELECT
    wl.user_id,
    NEW.id,
    0, -- New word stage
    CURRENT_DATE, -- Available for review immediately
    2.50, -- Default ease factor
    0 -- Initial interval
  FROM word_lists wl
  WHERE wl.id = NEW.list_id
  ON CONFLICT (user_id, word_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-initialize progress when words are created
DROP TRIGGER IF EXISTS auto_initialize_word_progress ON words;
CREATE TRIGGER auto_initialize_word_progress
  AFTER INSERT ON words
  FOR EACH ROW
  EXECUTE FUNCTION initialize_word_progress();

-- Add updated_at to word_progress for tracking
ALTER TABLE word_progress ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Create trigger to update updated_at
DROP TRIGGER IF EXISTS update_word_progress_updated_at ON word_progress;
CREATE TRIGGER update_word_progress_updated_at
  BEFORE UPDATE ON word_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
