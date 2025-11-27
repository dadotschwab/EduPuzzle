import { supabase } from '@/lib/supabase'
import type { PerformanceInsightsData } from '@/types/performance.types'

/**
 * Custom error class for performance API errors
 */
export class PerformanceApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'PerformanceApiError'
  }
}

/**
 * Default performance data structure for when database objects are missing
 */
function getDefaultPerformanceData(_userId: string): PerformanceInsightsData {
  return {
    totalLearned: 0,
    successRate: 0,
    weeklyPuzzles: 0,
    bestLearningTime: null,
    stageDistribution: [
      { stage: 0, count: 0 },
      { stage: 1, count: 0 },
      { stage: 2, count: 0 },
      { stage: 3, count: 0 },
      { stage: 4, count: 0 },
      { stage: 5, count: 0 },
      { stage: 6, count: 0 },
    ],
    weakestWords: [],
    weeklyActivity: [],
    learningTimeData: [],
    trends: {
      learned: 0,
      successRate: 0,
      puzzles: 0,
    },
  }
}

/**
 * Fetches comprehensive performance insights data
 * Combines materialized view data with analysis functions
 */
export async function getPerformanceInsights(): Promise<PerformanceInsightsData> {
  const { data: session } = await supabase.auth.getSession()
  if (!session.session) {
    throw new PerformanceApiError('Not authenticated', 401)
  }

  const userId = session.session.user.id

  // Fetch from materialized view (aggregated data)
  // Note: mv_user_insights is a materialized view not in generated types
  const { data: insights, error: insightsError } = await supabase
    .from('mv_user_insights' as 'word_lists') // Type assertion for materialized view
    .select('*')
    .eq('user_id', userId)
    .single()

  if (insightsError) {
    // Handle missing materialized view gracefully
    if (insightsError.code === 'PGRST116' || insightsError.message?.includes('does not exist')) {
      console.warn(
        '[getPerformanceInsights] Performance insights not available yet - using default data'
      )
      return getDefaultPerformanceData(userId)
    }
    throw new PerformanceApiError(insightsError.message, 500)
  }

  // Fetch additional analysis data
  const [bestTimeResult, weakestWordsResult, weeklyActivityResult] = await Promise.all([
    supabase.rpc('get_best_learning_time', { p_user_id: userId }),
    supabase.rpc('get_weakest_words', { p_user_id: userId, p_limit: 5 }),
    supabase.rpc('get_weekly_activity', { p_user_id: userId }),
  ])

  // Handle potential RPC errors gracefully and extract data
  const bestTimeData =
    bestTimeResult.error || !bestTimeResult.data || bestTimeResult.data.length === 0
      ? null
      : bestTimeResult.data[0]

  const weakestWords = weakestWordsResult.error ? [] : weakestWordsResult.data || []
  const weeklyActivity = weeklyActivityResult.error ? [] : weeklyActivityResult.data || []

  // Extract insights data with proper typing
  const insightsData = insights as Record<string, unknown>

  return {
    totalLearned: (insightsData.total_words_learned as number) || 0,
    successRate: (insightsData.global_success_rate as number) || 0,
    weeklyPuzzles: weeklyActivity.reduce((sum, day) => sum + (day.puzzle_sessions_count || 0), 0),
    bestLearningTime: bestTimeData
      ? {
          hour: bestTimeData.hour_of_day,
          success_rate: bestTimeData.success_rate,
        }
      : null,
    stageDistribution: [
      { stage: 0, count: (insightsData.stage_0_count as number) || 0 },
      { stage: 1, count: (insightsData.stage_1_count as number) || 0 },
      { stage: 2, count: (insightsData.stage_2_count as number) || 0 },
      { stage: 3, count: (insightsData.stage_3_count as number) || 0 },
      { stage: 4, count: (insightsData.stage_4_count as number) || 0 },
      { stage: 5, count: (insightsData.stage_5_count as number) || 0 },
      { stage: 6, count: (insightsData.stage_6_count as number) || 0 },
    ],
    weakestWords: weakestWords.map((word) => ({
      id: word.word_id,
      word: word.word_term,
      attempts: word.total_reviews,
      accuracy: word.success_rate,
    })),
    weeklyActivity: weeklyActivity.map((day) => ({
      day: day.day_name?.trim() || 'Unknown',
      puzzles: day.puzzle_sessions_count || 0,
    })),
    learningTimeData: bestTimeData
      ? [
          {
            hour: bestTimeData.hour_of_day,
            successRate: bestTimeData.success_rate,
          },
        ]
      : [],
    trends: {
      // Trend data would require historical snapshots - not implemented yet
      learned: 0,
      successRate: 0,
      puzzles: 0,
    },
  }
}
