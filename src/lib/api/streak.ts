import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database.types'

type UserStreak = Database['public']['Tables']['user_streaks']['Row']
type DailyCompletion = Database['public']['Tables']['daily_completions']['Row']

export interface StreakData {
  userStreak: UserStreak | null
  todaysCompletion: DailyCompletion | null
  yesterdayCompletion: DailyCompletion | null
}

export interface RecordCompletionRequest {
  puzzlesCompleted?: number
  wordsCompleted?: number
  dueWordsCount?: number
}

export interface RecordCompletionResponse {
  streakMaintained: boolean
  currentStreak: number
  longestStreak: number
  freezeUsed: boolean
}

// Custom error class for streak API errors
export class StreakApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'StreakApiError'
  }
}

// Get current streak data for authenticated user
export async function getStreakData(): Promise<StreakData> {
  const { data: session } = await supabase.auth.getSession()
  if (!session.session) {
    throw new StreakApiError('Not authenticated', 401)
  }

  const userId = session.session.user.id
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  // Get the user's streak record
  const { data: userStreak, error: streakError } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (streakError && streakError.code !== 'PGRST116') {
    // Check if it's a table not found error (migration not run yet)
    if (
      streakError.message?.includes('relation') &&
      streakError.message?.includes('does not exist')
    ) {
      console.warn('[getStreakData] Streak tables not found - migration may not be run yet')
      return { userStreak: null, todaysCompletion: null, yesterdayCompletion: null }
    }
    throw new StreakApiError(streakError.message, 500)
  }

  // Get today's completion
  const { data: todaysCompletion, error: todayError } = await supabase
    .from('daily_completions')
    .select('*')
    .eq('user_id', userId)
    .eq('completion_date', today)
    .single()

  if (todayError && todayError.code !== 'PGRST116') {
    // Check if it's a table not found error (migration not run yet)
    if (
      todayError.message?.includes('relation') &&
      todayError.message?.includes('does not exist')
    ) {
      console.warn('[getStreakData] Streak tables not found - migration may not be run yet')
      return { userStreak: userStreak || null, todaysCompletion: null, yesterdayCompletion: null }
    }
    throw new StreakApiError(todayError.message, 500)
  }

  // Get yesterday's completion
  const { data: yesterdayCompletion, error: yesterdayError } = await supabase
    .from('daily_completions')
    .select('*')
    .eq('user_id', userId)
    .eq('completion_date', yesterday)
    .single()

  if (yesterdayError && yesterdayError.code !== 'PGRST116') {
    // Check if it's a table not found error (migration not run yet)
    if (
      yesterdayError.message?.includes('relation') &&
      yesterdayError.message?.includes('does not exist')
    ) {
      console.warn('[getStreakData] Streak tables not found - migration may not be run yet')
      return {
        userStreak: userStreak || null,
        todaysCompletion: todaysCompletion || null,
        yesterdayCompletion: null,
      }
    }
    throw new StreakApiError(yesterdayError.message, 500)
  }

  return {
    userStreak: userStreak || null,
    todaysCompletion: todaysCompletion || null,
    yesterdayCompletion: yesterdayCompletion || null,
  }
}

// Record daily completion and update streaks
export async function recordDailyCompletion(
  request: RecordCompletionRequest
): Promise<RecordCompletionResponse> {
  const { data: session } = await supabase.auth.getSession()
  if (!session.session) {
    throw new StreakApiError('Not authenticated', 401)
  }

  const { data, error } = await supabase.rpc('record_daily_completion', {
    user_id_param: session.session.user.id,
    puzzles_completed_param: request.puzzlesCompleted || 0,
    words_completed_param: request.wordsCompleted || 0,
    due_words_count_param: request.dueWordsCount || 0,
  })

  if (error) {
    throw new StreakApiError(error.message, 500)
  }

  // The RPC returns an array with one object
  const result = data[0] as {
    streak_maintained: boolean
    current_streak: number
    longest_streak: number
    freeze_used: boolean
  }

  return {
    streakMaintained: result.streak_maintained,
    currentStreak: result.current_streak,
    longestStreak: result.longest_streak,
    freezeUsed: result.freeze_used,
  }
}
