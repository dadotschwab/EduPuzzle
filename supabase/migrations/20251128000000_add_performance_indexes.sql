-- Migration: Add performance indexes for leaderboard and shared lists
-- Created: 2025-11-28
-- Purpose: Improve query performance for collaborative leaderboard and shared list lookups

-- Add composite index for leaderboard queries
-- This index optimizes queries that filter by shared_list_id and sort by cached_score
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_list_collaborators_leaderboard_perf
ON public.list_collaborators(shared_list_id, cached_score DESC, score_updated_at DESC)
WHERE leaderboard_opted_in = true;

-- Add index for active shared list token lookups
-- This index optimizes the common pattern of looking up shared lists by token
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shared_lists_active_lookup
ON public.shared_lists(share_token, is_active)
WHERE is_active = true;

-- Add index for word progress due date queries
-- This index optimizes queries to find words due for review
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_word_progress_user_next_review
ON public.word_progress(user_id, next_review_date)
WHERE next_review_date IS NOT NULL;

-- Add index for collaborative list lookups by user
-- This index optimizes queries to find all lists a user is collaborating on
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_list_collaborators_user_lookup
ON public.list_collaborators(user_id, shared_list_id);

-- Add partial index for words in collaborative lists
-- This index optimizes queries to fetch words for shared lists
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_words_list_lookup
ON public.words(list_id, created_at)
WHERE list_id IS NOT NULL;

-- Comment on indexes for documentation
COMMENT ON INDEX idx_list_collaborators_leaderboard_perf IS 
  'Optimizes leaderboard queries by shared_list_id with score ordering';

COMMENT ON INDEX idx_shared_lists_active_lookup IS 
  'Optimizes shared list token lookups for active lists only';

COMMENT ON INDEX idx_word_progress_user_next_review IS 
  'Optimizes queries to find words due for review by user';

COMMENT ON INDEX idx_list_collaborators_user_lookup IS 
  'Optimizes lookups of collaborative lists by user';

COMMENT ON INDEX idx_words_list_lookup IS 
  'Optimizes word fetching for collaborative lists';
