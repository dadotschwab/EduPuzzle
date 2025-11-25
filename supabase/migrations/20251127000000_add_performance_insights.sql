-- Migration: Add performance insights feature
-- File: supabase/migrations/20251127000000_add_performance_insights.sql

-- Create materialized view for user insights aggregation
CREATE MATERIALIZED VIEW public.mv_user_insights AS
SELECT
  wp.user_id,
  COUNT(*) FILTER (WHERE wp.stage = 0) as stage_0_count,
  COUNT(*) FILTER (WHERE wp.stage = 1) as stage_1_count,
  COUNT(*) FILTER (WHERE wp.stage = 2) as stage_2_count,
  COUNT(*) FILTER (WHERE wp.stage = 3) as stage_3_count,
  COUNT(*) FILTER (WHERE wp.stage = 4) as stage_4_count,
  COUNT(*) FILTER (WHERE wp.stage = 5) as stage_5_count,
  COUNT(*) FILTER (WHERE wp.stage = 6) as stage_6_count,
  COUNT(*) as total_words_learned,
  SUM(wp.total_reviews) as total_reviews,
  SUM(wp.correct_reviews) as total_correct_reviews,
  ROUND(
    CASE
      WHEN SUM(wp.total_reviews) > 0
      THEN (SUM(wp.correct_reviews)::DECIMAL / SUM(wp.total_reviews)::DECIMAL) * 100
      ELSE 0
    END,
    1
  ) as global_success_rate
FROM public.word_progress wp
GROUP BY wp.user_id;

-- Create indexes for performance
CREATE UNIQUE INDEX idx_mv_user_insights_user_id ON public.mv_user_insights(user_id);
CREATE INDEX idx_mv_user_insights_total_words ON public.mv_user_insights(total_words_learned DESC);

-- Add comments for documentation
COMMENT ON MATERIALIZED VIEW public.mv_user_insights IS 'Aggregated user learning statistics for performance insights dashboard';
COMMENT ON COLUMN public.mv_user_insights.stage_0_count IS 'Words in New stage (0)';
COMMENT ON COLUMN public.mv_user_insights.stage_1_count IS 'Words in Learning stage (1)';
COMMENT ON COLUMN public.mv_user_insights.stage_2_count IS 'Words in Young stage (2)';
COMMENT ON COLUMN public.mv_user_insights.stage_3_count IS 'Words in Mature stage (3)';
COMMENT ON COLUMN public.mv_user_insights.stage_4_count IS 'Words in Relearning stage (4)';
COMMENT ON COLUMN public.mv_user_insights.stage_5_count IS 'Words in Expert stage (5)';
COMMENT ON COLUMN public.mv_user_insights.stage_6_count IS 'Words in Master stage (6)';
COMMENT ON COLUMN public.mv_user_insights.global_success_rate IS 'Overall success rate percentage (0-100)';

-- Note: Materialized views do not support RLS directly.
-- Security is implemented at the function level with SECURITY DEFINER
-- and explicit user validation in the application layer.

-- Function: Get best learning time analysis
CREATE OR REPLACE FUNCTION public.get_best_learning_time(
  p_user_id UUID
)
RETURNS TABLE (
  hour_of_day INTEGER,
  total_reviews BIGINT,
  successful_reviews BIGINT,
  success_rate DECIMAL(5,2)
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    EXTRACT(HOUR FROM wr.reviewed_at)::INTEGER as hour_of_day,
    COUNT(*) as total_reviews,
    COUNT(*) FILTER (
      WHERE wr.review_type IN ('perfect', 'half_known', 'conditional')
    ) as successful_reviews,
    ROUND(
      CASE
        WHEN COUNT(*) > 0
        THEN (COUNT(*) FILTER (WHERE wr.review_type IN ('perfect', 'half_known', 'conditional'))::DECIMAL / COUNT(*)::DECIMAL) * 100
        ELSE 0
      END,
      2
    ) as success_rate
  FROM public.word_reviews wr
  WHERE wr.user_id = p_user_id
  AND wr.reviewed_at >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY EXTRACT(HOUR FROM wr.reviewed_at)
  HAVING COUNT(*) >= 5
  ORDER BY success_rate DESC, total_reviews DESC;
$$;

-- Function: Get weakest words
CREATE OR REPLACE FUNCTION public.get_weakest_words(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  word_id UUID,
  word_term TEXT,
  word_translation TEXT,
  total_reviews BIGINT,
  successful_reviews BIGINT,
  success_rate DECIMAL(5,2),
  last_reviewed_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    w.id as word_id,
    w.term as word_term,
    w.translation as word_translation,
    COUNT(wr.*) as total_reviews,
    COUNT(*) FILTER (
      WHERE wr.review_type IN ('perfect', 'half_known', 'conditional')
    ) as successful_reviews,
    ROUND(
      CASE
        WHEN COUNT(wr.*) > 0
        THEN (COUNT(*) FILTER (WHERE wr.review_type IN ('perfect', 'half_known', 'conditional'))::DECIMAL / COUNT(wr.*)::DECIMAL) * 100
        ELSE 0
      END,
      2
    ) as success_rate,
    MAX(wr.reviewed_at) as last_reviewed_at
  FROM public.words w
  JOIN public.word_lists wl ON wl.id = w.list_id
  JOIN public.word_reviews wr ON wr.word_id = w.id AND wr.user_id = p_user_id
  WHERE wl.user_id = p_user_id
  GROUP BY w.id, w.term, w.translation
  HAVING COUNT(wr.*) >= 5
  ORDER BY success_rate ASC, total_reviews DESC
  LIMIT p_limit;
$$;

-- Function: Get weekly activity
CREATE OR REPLACE FUNCTION public.get_weekly_activity(
  p_user_id UUID
)
RETURNS TABLE (
  activity_date DATE,
  day_name TEXT,
  puzzle_sessions_count BIGINT,
  words_reviewed_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    d.activity_date,
    TO_CHAR(d.activity_date, 'Day') as day_name,
    COALESCE(ps.puzzle_count, 0) as puzzle_sessions_count,
    COALESCE(wr.word_count, 0) as words_reviewed_count
  FROM (
    SELECT
      CURRENT_DATE - INTERVAL '6 days' + (n || ' days')::INTERVAL as activity_date
    FROM generate_series(0, 6) n
  ) d
  LEFT JOIN (
    SELECT
      DATE(ps.started_at) as session_date,
      COUNT(*) as puzzle_count
    FROM public.puzzle_sessions ps
    WHERE ps.user_id = p_user_id
    AND ps.started_at >= CURRENT_DATE - INTERVAL '6 days'
    GROUP BY DATE(ps.started_at)
  ) ps ON ps.session_date = d.activity_date
  LEFT JOIN (
    SELECT
      DATE(wr.reviewed_at) as review_date,
      COUNT(*) as word_count
    FROM public.word_reviews wr
    WHERE wr.user_id = p_user_id
    AND wr.reviewed_at >= CURRENT_DATE - INTERVAL '6 days'
    GROUP BY DATE(wr.reviewed_at)
  ) wr ON wr.review_date = d.activity_date
  ORDER BY d.activity_date;
$$;

-- Function: Refresh materialized view
CREATE OR REPLACE FUNCTION public.refresh_user_insights()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_user_insights;
  SELECT true;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_best_learning_time(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_weakest_words(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_weekly_activity(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_user_insights() TO authenticated;

-- Trigger function: Refresh materialized view on significant changes
CREATE OR REPLACE FUNCTION public.trg_refresh_user_insights()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Determine which user changed
  IF TG_OP = 'DELETE' THEN
    v_user_id := OLD.user_id;
  ELSE
    v_user_id := NEW.user_id;
  END IF;

  -- Only refresh if this is a significant change (stage advancement or new word)
  -- Avoid refreshing on every minor review update for performance
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.stage != NEW.stage) THEN
    -- Refresh materialized view for this specific user
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_user_insights;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger on word_progress table
DROP TRIGGER IF EXISTS trg_refresh_user_insights ON public.word_progress;
CREATE TRIGGER trg_refresh_user_insights
  AFTER INSERT OR UPDATE ON public.word_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_refresh_user_insights();

-- Enable Realtime for performance insights
ALTER PUBLICATION supabase_realtime ADD TABLE public.mv_user_insights;