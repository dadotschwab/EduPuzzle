# Supabase Specification: Performance Insights

## Overview

The Performance Insights feature provides advanced statistics for users to analyze their learning habits. Includes "Best Time to Learn", "Word Stage Distribution", and "Weakest Words" analysis with a compact dashboard widget and detailed statistics page. Data is aggregated using materialized views for optimal performance.

## Schema Design

### Materialized View: mv_user_insights

**Purpose**: Aggregates user learning statistics for fast dashboard queries. Refreshed daily to balance performance and data freshness.

```sql
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

-- Indexes for performance
CREATE UNIQUE INDEX idx_mv_user_insights_user_id ON public.mv_user_insights(user_id);
CREATE INDEX idx_mv_user_insights_total_words ON public.mv_user_insights(total_words_learned DESC);

-- Comments for documentation
COMMENT ON MATERIALIZED VIEW public.mv_user_insights IS 'Aggregated user learning statistics for performance insights dashboard';
COMMENT ON COLUMN public.mv_user_insights.stage_0_count IS 'Words in New stage (0)';
COMMENT ON COLUMN public.mv_user_insights.stage_1_count IS 'Words in Learning stage (1)';
COMMENT ON COLUMN public.mv_user_insights.stage_2_count IS 'Words in Young stage (2)';
COMMENT ON COLUMN public.mv_user_insights.stage_3_count IS 'Words in Mature stage (3)';
COMMENT ON COLUMN public.mv_user_insights.stage_4_count IS 'Words in Relearning stage (4)';
COMMENT ON COLUMN public.mv_user_insights.stage_5_count IS 'Words in Expert stage (5)';
COMMENT ON COLUMN public.mv_user_insights.stage_6_count IS 'Words in Master stage (6)';
COMMENT ON COLUMN public.mv_user_insights.global_success_rate IS 'Overall success rate percentage (0-100)';
```

### Stage System Extension

**Purpose**: Extend SRS stages to support leaderboard scoring with 7 stages (0-6).

```sql
-- Update stage constraint to support stages 0-6
ALTER TABLE public.word_progress
  DROP CONSTRAINT stage_values,
  ADD CONSTRAINT stage_values CHECK (stage >= 0 AND stage <= 6);

-- Update stage comments
COMMENT ON COLUMN public.word_progress.stage IS 'SRS Stage: 0=New(0pts), 1=Learning(1pt), 2=Young(2pts), 3=Mature(4pts), 4=Relearning(7pts), 5=Expert(12pts), 6=Master(20pts)';
```

## RLS Policies

### Materialized View Access

```sql
-- Enable RLS on materialized view
ALTER MATERIALIZED VIEW public.mv_user_insights ENABLE ROW LEVEL SECURITY;

-- Users can only view their own insights data
CREATE POLICY "users_view_own_insights"
  ON public.mv_user_insights
  FOR SELECT
  USING (auth.uid() = user_id);
```

## Database Functions

### Best Learning Time Analysis

```sql
/**
 * get_best_learning_time
 * Purpose: Calculate success rates by hour of day for optimal learning time analysis
 * @param p_user_id - The user ID
 * @returns Table of hourly success rates
 */
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_best_learning_time(UUID) TO authenticated;
```

### Weakest Words Identification

```sql
/**
 * get_weakest_words
 * Purpose: Identify words with lowest success rates (minimum 5 attempts)
 * @param p_user_id - The user ID
 * @param p_limit - Maximum number of words to return (default 5)
 * @returns Table of weakest words with success metrics
 */
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_weakest_words(UUID, INTEGER) TO authenticated;
```

### Weekly Activity Analysis

```sql
/**
 * get_weekly_activity
 * Purpose: Calculate daily activity for the past 7 days
 * @param p_user_id - The user ID
 * @returns Table of daily activity counts
 */
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_weekly_activity(UUID) TO authenticated;
```

### Refresh Materialized View

```sql
/**
 * refresh_user_insights
 * Purpose: Refresh the materialized view with latest data
 * @returns Success status
 */
CREATE OR REPLACE FUNCTION public.refresh_user_insights()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_user_insights;
  SELECT true;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.refresh_user_insights() TO authenticated;
```

## Triggers

### Materialized View Refresh Trigger

```sql
/**
 * trg_refresh_user_insights
 * Purpose: Refresh materialized view when word progress changes significantly
 * Only triggers for major updates, not every single review
 */
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
```

## Realtime Configuration

```sql
-- Enable Realtime for performance insights updates
-- Purpose: Real-time dashboard updates when user progress changes
ALTER PUBLICATION supabase_realtime ADD TABLE public.mv_user_insights;

-- Note: Materialized views in Realtime require careful consideration
-- Client should poll or use periodic refresh rather than constant subscription
-- to avoid excessive bandwidth usage
```

## Migration Steps

1. **Create materialized view**:

   ```sql
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
   ```

2. **Create indexes**:

   ```sql
   CREATE UNIQUE INDEX idx_mv_user_insights_user_id ON public.mv_user_insights(user_id);
   CREATE INDEX idx_mv_user_insights_total_words ON public.mv_user_insights(total_words_learned DESC);
   ```

3. **Create functions** (as defined above)

4. **Create trigger** (as defined above)

5. **Enable RLS** (as defined above)

6. **Enable Realtime** (as defined above)

7. **Set up daily refresh cron job**:

   ```sql
   -- This should be configured in Supabase dashboard or via Edge Function
   -- Cron expression: "0 2 * * *" (daily at 2 AM)
   SELECT cron.schedule(
     'refresh-user-insights',
     '0 2 * * *',
     'REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_user_insights;'
   );
   ```

## Type Definitions

After migration, generate types:

```bash
supabase gen types typescript --local > src/types/database.types.ts
```

Expected types to be generated:

```typescript
// Materialized view for user insights
interface Database {
  public: {
    Views: {
      mv_user_insights: {
        Row: {
          user_id: string
          stage_0_count: number
          stage_1_count: number
          stage_2_count: number
          stage_3_count: number
          stage_4_count: number
          stage_5_count: number
          stage_6_count: number
          total_words_learned: number
          total_reviews: number
          total_correct_reviews: number
          global_success_rate: number
        }
      }
    }
    Functions: {
      get_best_learning_time: {
        Args: { p_user_id: string }
        Returns: {
          hour_of_day: number
          total_reviews: number
          successful_reviews: number
          success_rate: number
        }[]
      }
      get_weakest_words: {
        Args: { p_user_id: string; p_limit?: number }
        Returns: {
          word_id: string
          word_term: string
          word_translation: string
          total_reviews: number
          successful_reviews: number
          success_rate: number
          last_reviewed_at: string
        }[]
      }
      get_weekly_activity: {
        Args: { p_user_id: string }
        Returns: {
          activity_date: string
          day_name: string
          puzzle_sessions_count: number
          words_reviewed_count: number
        }[]
      }
      refresh_user_insights: {
        Args: never
        Returns: boolean
      }
    }
  }
}
```

Custom types to add manually (src/types/performance.types.ts):

```typescript
import type { Database } from './database.types'

/** Row type for user insights */
export type UserInsights = Database['public']['Views']['mv_user_insights']['Row']

/** Stage distribution data for charts */
export interface StageDistribution {
  stage: number
  count: number
  label: string
  color: string
}

/** Best learning time data */
export interface LearningTimeData {
  hour_of_day: number
  total_reviews: number
  successful_reviews: number
  success_rate: number
  hour_label: string
}

/** Weakest word data */
export interface WeakestWord {
  word_id: string
  word_term: string
  word_translation: string
  total_reviews: number
  successful_reviews: number
  success_rate: number
  last_reviewed_at: string
}

/** Weekly activity data */
export interface WeeklyActivity {
  activity_date: string
  day_name: string
  puzzle_sessions_count: number
  words_reviewed_count: number
  day_short: string
}

/** Dashboard performance metrics */
export interface PerformanceMetrics {
  total_words_learned: number
  global_success_rate: number
  weekly_puzzle_count: number
  trend_direction?: 'up' | 'down' | 'stable'
  trend_percentage?: number
}

/** Success rate review types */
export enum ReviewSuccessType {
  Perfect = 'perfect',
  HalfKnown = 'half_known',
  Conditional = 'conditional',
  Unknown = 'unknown',
  NotEvaluated = 'not_evaluated',
}

/** Stage labels for UI display */
export enum StageLabels {
  'New' = 0,
  'Learning' = 1,
  'Young' = 2,
  'Mature' = 3,
  'Relearning' = 4,
  'Expert' = 5,
  'Master' = 6,
}
```

## Performance Considerations

1. **Materialized View**: Aggregated data provides sub-second dashboard queries
2. **Concurrent Refresh**: CONCURRENTLY allows reads during refresh operations
3. **Function Optimization**: Complex calculations cached in functions for reuse
4. **Index Strategy**: Strategic indexes on frequently queried columns
5. **Minimal Triggers**: Only refresh on significant changes (stage advancements)

## Security Considerations

1. **RLS Policies**: Users can only access their own performance data
2. **Function Security**: All functions use SECURITY DEFINER with proper access controls
3. **Data Privacy**: No cross-user data leakage in aggregated statistics
4. **Input Validation**: Functions validate user permissions before calculations

## Monitoring and Maintenance

1. **Refresh Monitoring**: Track materialized view refresh performance and timing
2. **Data Consistency**: Periodic validation of aggregated statistics
3. **Performance Metrics**: Monitor query performance and function execution times
4. **Storage Optimization**: Consider partitioning if user base grows significantly
5. **Backup Strategy**: Include materialized view in backup procedures
