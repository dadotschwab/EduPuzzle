/**
 * @fileoverview API functions for collaborative leaderboard functionality
 */

import { supabase } from '@/lib/supabase'
import type { LeaderboardEntry } from '@/types/leaderboard.types'

/**
 * Type for the raw database response from get_collaborative_leaderboard RPC
 */
interface LeaderboardRow {
  user_id: string
  user_email: string
  user_name: string | null
  cached_score: number
  score_updated_at: string
  rank: number
}

/**
 * Fetches leaderboard data for a collaborative list
 * Returns ranked collaborators with scores, sorted by score descending
 *
 * @param sharedListId - The ID of the shared collaborative list
 * @returns Promise resolving to array of leaderboard entries
 * @throws Error if the query fails or user lacks permissions
 */
export async function getLeaderboard(sharedListId: string): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase.rpc('get_collaborative_leaderboard', {
    p_shared_list_id: sharedListId,
  })

  if (error) {
    throw new Error(`Failed to fetch leaderboard: ${error.message}`)
  }

  // Transform the database response to our API format
  return data.map((row: LeaderboardRow) => ({
    userId: row.user_id,
    user: {
      id: row.user_id,
      email: row.user_email,
      fullName: row.user_name || undefined,
    },
    score: row.cached_score,
    wordsLearned: 0, // TODO: Calculate from word_progress
    totalWords: 0, // TODO: Calculate from words table
    isOptedIn: true, // All returned rows are opted in
    lastUpdated: row.score_updated_at,
    rank: row.rank,
  }))
}

/**
 * Toggles leaderboard opt-in status for the current user
 *
 * @param sharedListId - The ID of the shared collaborative list
 * @param optedIn - Whether the user wants to opt in (true) or out (false)
 * @returns Promise resolving when the operation completes
 * @throws Error if the operation fails or user lacks permissions
 */
export async function toggleLeaderboardOptIn(
  sharedListId: string,
  optedIn: boolean
): Promise<void> {
  const { error } = await supabase.rpc('toggle_leaderboard_opt_in', {
    p_shared_list_id: sharedListId,
    p_opt_in: optedIn,
  })

  if (error) {
    throw new Error(`Failed to update leaderboard opt-in status: ${error.message}`)
  }
}

/**
 * Gets leaderboard statistics for a collaborative list
 * This is a helper function that can be used for dashboard widgets
 *
 * @param sharedListId - The ID of the shared collaborative list
 * @returns Promise resolving to leaderboard statistics
 */
export async function getLeaderboardStats(sharedListId: string) {
  // Get total collaborators count
  const { data: totalCollaborators, error: totalError } = await supabase
    .from('list_collaborators')
    .select('id', { count: 'exact', head: true })
    .eq('shared_list_id', sharedListId)

  if (totalError) {
    throw new Error(`Failed to fetch collaborator count: ${totalError.message}`)
  }

  // Get active leaderboard participants
  const { data: activeParticipants, error: activeError } = await supabase
    .from('list_collaborators')
    .select('cached_score', { count: 'exact', head: true })
    .eq('shared_list_id', sharedListId)
    .eq('leaderboard_opted_in', true)

  if (activeError) {
    throw new Error(`Failed to fetch active participants: ${activeError.message}`)
  }

  // Get leaderboard data for calculations
  const leaderboardData = await getLeaderboard(sharedListId)

  const highestScore =
    leaderboardData.length > 0 ? Math.max(...leaderboardData.map((entry) => entry.score)) : 0

  const averageScore =
    leaderboardData.length > 0
      ? Math.round(
          leaderboardData.reduce((sum, entry) => sum + entry.score, 0) / leaderboardData.length
        )
      : 0

  return {
    totalParticipants: totalCollaborators || 0,
    activeParticipants: activeParticipants || 0,
    highestScore,
    averageScore,
    currentUserRank: undefined, // Would need current user ID to calculate
  }
}
