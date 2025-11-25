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
  const { data: insights, error: insightsError } = await (supabase as any)
    .from('mv_user_insights')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (insightsError) {
    // Handle missing materialized view gracefully
    if (insightsError.code === 'PGRST116' || insightsError.message?.includes('does not exist')) {
      console.warn('[getPerformanceInsights] Performance insights not available yet')
      throw new PerformanceApiError('Performance insights not available', 503)
    }
    throw new PerformanceApiError(insightsError.message, 500)
  }

  // Fetch additional analysis data
  const [bestTimeResult, weakestWordsResult, weeklyActivityResult] = await Promise.all([
    (supabase as any).rpc('get_best_learning_time', { p_user_id: userId }),
    (supabase as any).rpc('get_weakest_words', { p_user_id: userId, p_limit: 5 }),
    (supabase as any).rpc('get_weekly_activity', { p_user_id: userId }),
  ])

  // Handle potential RPC errors gracefully
  const bestLearningTime = bestTimeResult.error ? null : bestTimeResult.data
  const weakestWords = weakestWordsResult.error ? [] : weakestWordsResult.data || []
  const weeklyActivity = weeklyActivityResult.error ? [] : weeklyActivityResult.data || []

  return {
    totalLearned: (insights as any).total_words_learned || 0,
    successRate: (insights as any).global_success_rate || 0,
    weeklyPuzzles: 0, // TODO: Calculate from weekly activity data
    bestLearningTime,
    stageDistribution: [
      { stage: 0, count: (insights as any).stage_0_count || 0 },
      { stage: 1, count: (insights as any).stage_1_count || 0 },
      { stage: 2, count: (insights as any).stage_2_count || 0 },
      { stage: 3, count: (insights as any).stage_3_count || 0 },
      { stage: 4, count: (insights as any).stage_4_count || 0 },
      { stage: 5, count: (insights as any).stage_5_count || 0 },
      { stage: 6, count: (insights as any).stage_6_count || 0 },
    ],
    weakestWords: weakestWords.map((word: any) => ({
      id: word.word_id,
      word: word.word_term,
      attempts: word.total_reviews,
      accuracy: word.success_rate,
    })),
    weeklyActivity: weeklyActivity.map((day: any) => ({
      day: day.day_name?.trim() || 'Unknown',
      puzzles: day.puzzle_sessions_count || 0,
    })),
    learningTimeData: bestLearningTime
      ? [
          {
            hour: (bestLearningTime as any).hour_of_day,
            successRate: (bestLearningTime as any).success_rate,
          },
        ]
      : [],
    trends: {
      learned: 0, // TODO: Calculate trend data
      successRate: 0,
      puzzles: 0,
    },
  }
}
