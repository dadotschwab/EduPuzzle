-- Migration: Add collaborative leaderboard feature
-- File: supabase/migrations/20251126100000_add_collaborative_leaderboard.sql

-- Extend SRS stages to support leaderboard scoring (0-6 instead of 0-4)
ALTER TABLE public.word_progress
  DROP CONSTRAINT stage_values,
  ADD CONSTRAINT stage_values CHECK (stage >= 0 AND stage <= 6);

-- Update stage comments for leaderboard scoring
COMMENT ON COLUMN public.word_progress.stage IS 'SRS Stage: 0=New(0pts), 1=Learning(1pt), 2=Young(2pts), 3=Mature(4pts), 4=Relearning(7pts), 5=Expert(12pts), 6=Master(20pts)';

-- Add leaderboard columns to list_collaborators table
ALTER TABLE public.list_collaborators
ADD COLUMN leaderboard_opted_in BOOLEAN DEFAULT false,
ADD COLUMN cached_score INTEGER DEFAULT 0,
ADD COLUMN score_updated_at TIMESTAMPTZ DEFAULT now();

-- Comments for documentation
COMMENT ON COLUMN public.list_collaborators.leaderboard_opted_in IS 'Whether user participates in leaderboard for this collaborative list';
COMMENT ON COLUMN public.list_collaborators.cached_score IS 'Cached total score for leaderboard display (updated by trigger)';
COMMENT ON COLUMN public.list_collaborators.score_updated_at IS 'When cached score was last updated';

-- Indexes for leaderboard performance
CREATE INDEX idx_list_collaborators_leaderboard
  ON public.list_collaborators(shared_list_id, cached_score DESC, score_updated_at DESC)
  WHERE leaderboard_opted_in = true;

CREATE INDEX idx_list_collaborators_score_update
  ON public.list_collaborators(score_updated_at)
  WHERE leaderboard_opted_in = true;

-- Function: Calculate leaderboard score for a user in a collaborative list
CREATE OR REPLACE FUNCTION public.calculate_leaderboard_score(
  p_shared_list_id UUID,
  p_user_id UUID
)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(SUM(
    CASE wp.stage
      WHEN 0 THEN 0   -- New words
      WHEN 1 THEN 1   -- Learning
      WHEN 2 THEN 2   -- Young
      WHEN 3 THEN 4   -- Mature
      WHEN 4 THEN 7   -- Relearning
      WHEN 5 THEN 12  -- Expert
      WHEN 6 THEN 20  -- Master
      ELSE 0
    END
  ), 0)::INTEGER
  FROM public.words w
  JOIN public.word_lists wl ON wl.id = w.list_id
  JOIN public.shared_lists sl ON sl.original_list_id = wl.id
  LEFT JOIN public.word_progress wp ON wp.word_id = w.id AND wp.user_id = p_user_id
  WHERE sl.id = p_shared_list_id
  AND sl.share_mode = 'collaborative'
  AND sl.is_active = true;
$$;

-- Function: Get leaderboard data for a collaborative list
CREATE OR REPLACE FUNCTION public.get_collaborative_leaderboard(
  p_shared_list_id UUID
)
RETURNS TABLE (
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  cached_score INTEGER,
  score_updated_at TIMESTAMPTZ,
  rank BIGINT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    lc.user_id,
    u.email as user_email,
    u.name as user_name,
    lc.cached_score,
    lc.score_updated_at,
    ROW_NUMBER() OVER (ORDER BY lc.cached_score DESC, lc.score_updated_at ASC) as rank
  FROM public.list_collaborators lc
  JOIN auth.users u ON u.id = lc.user_id
  WHERE lc.shared_list_id = p_shared_list_id
  AND lc.leaderboard_opted_in = true
  ORDER BY lc.cached_score DESC, lc.score_updated_at ASC;
$$;

-- Function: Toggle leaderboard opt-in status
CREATE OR REPLACE FUNCTION public.toggle_leaderboard_opt_in(
  p_shared_list_id UUID,
  p_opt_in BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_current_score INTEGER;
BEGIN
  -- Validate user is a collaborator
  IF NOT EXISTS (
    SELECT 1 FROM public.list_collaborators
    WHERE shared_list_id = p_shared_list_id
    AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'User is not a collaborator on this list';
  END IF;

  -- Calculate current score if opting in
  IF p_opt_in THEN
    v_current_score := calculate_leaderboard_score(p_shared_list_id, v_user_id);
  ELSE
    v_current_score := 0;
  END IF;

  -- Update opt-in status and score
  UPDATE public.list_collaborators
  SET
    leaderboard_opted_in = p_opt_in,
    cached_score = v_current_score,
    score_updated_at = now()
  WHERE shared_list_id = p_shared_list_id
  AND user_id = v_user_id;

  RETURN true;
END;
$$;

-- Trigger function: Update leaderboard scores when word progress changes
CREATE OR REPLACE FUNCTION public.trg_update_leaderboard_scores()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_shared_list_ids UUID[];
  v_user_id UUID;
BEGIN
  -- Determine which user and words changed
  IF TG_OP = 'DELETE' THEN
    v_user_id := OLD.user_id;
  ELSE
    v_user_id := NEW.user_id;
  END IF;

  -- Find all collaborative lists containing this word that the user participates in
  SELECT array_agg(DISTINCT sl.id)
  INTO v_shared_list_ids
  FROM public.words w
  JOIN public.word_lists wl ON wl.id = w.list_id
  JOIN public.shared_lists sl ON sl.original_list_id = wl.id
  JOIN public.list_collaborators lc ON lc.shared_list_id = sl.id
  WHERE w.id = COALESCE(NEW.word_id, OLD.word_id)
  AND sl.share_mode = 'collaborative'
  AND sl.is_active = true
  AND lc.user_id = v_user_id
  AND lc.leaderboard_opted_in = true;

  -- Update cached scores for affected collaborative lists
  IF v_shared_list_ids IS NOT NULL THEN
    UPDATE public.list_collaborators
    SET
      cached_score = calculate_leaderboard_score(shared_list_id, user_id),
      score_updated_at = now()
    WHERE shared_list_id = ANY(v_shared_list_ids)
    AND user_id = v_user_id
    AND leaderboard_opted_in = true;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger on word_progress table
DROP TRIGGER IF EXISTS trg_update_leaderboard_scores ON public.word_progress;
CREATE TRIGGER trg_update_leaderboard_scores
  AFTER INSERT OR UPDATE OR DELETE ON public.word_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_update_leaderboard_scores();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.calculate_leaderboard_score(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_collaborative_leaderboard(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_leaderboard_opt_in(UUID, BOOLEAN) TO authenticated;

-- Enhanced RLS policies for leaderboard
-- Users can view leaderboard data for lists they collaborate on
CREATE POLICY "collaborators_view_leaderboard"
  ON public.list_collaborators
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.list_collaborators lc2
      WHERE lc2.shared_list_id = list_collaborators.shared_list_id
      AND lc2.user_id = auth.uid()
      AND lc2.leaderboard_opted_in = true
    )
  );

-- Users can update their own leaderboard opt-in status
CREATE POLICY "users_update_own_leaderboard_opt_in"
  ON public.list_collaborators
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Enable Realtime for leaderboard updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.list_collaborators;