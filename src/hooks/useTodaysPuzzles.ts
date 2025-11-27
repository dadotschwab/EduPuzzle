/**
 * @fileoverview React Query hooks for SRS-driven puzzle generation
 *
 * Implements hybrid smart grouping strategy:
 * - Lists with ≥15 words get their own puzzle
 * - Lists with <15 words are combined by language pair
 * - Minimum 10 words required per puzzle
 *
 * @module hooks/useTodaysPuzzles
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchDueWordsCount, batchUpdateWordProgress } from '@/lib/api/srs'
import { recordDailyCompletion } from '@/lib/api/streak'
import { supabase } from '@/lib/supabase'
import { getCurrentPuzzle } from '@/lib/utils/helpers'
import type { Puzzle } from '@/types'

// Re-export for backward compatibility
export { getCurrentPuzzle as useCurrentPuzzle }
import { useAuth } from '@/hooks/useAuth'

interface TodaysPuzzlesData {
  puzzles: Puzzle[]
  totalWords: number
  message?: string
  cached?: boolean
}

/**
 * Fetches puzzles from Edge Function (server-side generation with caching)
 *
 * This replaces the old client-side generation approach with a proper
 * server-side architecture that:
 * - Generates puzzles deterministically (same words = same puzzle)
 * - Caches results for 24 hours for consistent experience
 * - Eliminates race conditions from client-side state management
 */
export function useTodaysPuzzles() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['todaysPuzzles', user?.id],
    queryFn: async (): Promise<TodaysPuzzlesData> => {
      if (!user) throw new Error('User not authenticated')

      console.log(`[TodaysPuzzles] Calling Edge Function for user: ${user.id}`)

      // Call Edge Function for server-side puzzle generation
      const { data, error } = await supabase.functions.invoke('get-todays-puzzles', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      })

      if (error) {
        console.error('[TodaysPuzzles] Edge Function error:', error)
        throw error
      }

      const response = data as TodaysPuzzlesData

      console.log(
        `[TodaysPuzzles] Received ${response.puzzles.length} puzzles ` +
          `(${response.totalWords} total words) ` +
          `${response.cached ? '[CACHED]' : '[FRESH]'}`
      )

      return response
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 60, // 1 hour (server handles caching for 24 hours)
  })
}

/**
 * Gets count of due words for dashboard badge
 */
export function useDueWordsCount() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['dueWordsCount', user?.id],
    queryFn: async () => {
      if (!user) return 0
      return fetchDueWordsCount(user.id)
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Mutation to update SRS progress after puzzle completion
 */
export function useCompletePuzzle() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updates: Array<{ wordId: string; wasCorrect: boolean }>) => {
      if (!user) throw new Error('User not authenticated')
      return batchUpdateWordProgress(updates, user.id)
    },
    onSuccess: (_, updates) => {
      // ✅ SAFE: Update counts immediately (for dashboard badges)
      queryClient.invalidateQueries({ queryKey: ['dueWordsCount'] })
      queryClient.invalidateQueries({ queryKey: ['wordProgress'] })

      // Record word completion for streak tracking
      // Note: dueWordsCount will be updated after this mutation completes
      // We'll get the updated count from the queryClient
      const dueWordsData = queryClient.getQueryData<{ count: number }>(['dueWordsCount', user?.id])
      const dueWordsCount = dueWordsData?.count || 0

      recordDailyCompletion({
        puzzlesCompleted: 0, // Words only, not puzzles
        wordsCompleted: updates.length, // Number of words reviewed
        dueWordsCount: dueWordsCount,
      }).catch((error) => {
        console.error('[useCompletePuzzle] Failed to record word completion for streak:', error)
        // Don't fail the mutation if streak recording fails
      })

      // ❌ DON'T invalidate todaysPuzzles here - causes layout bug!
      // Puzzle regeneration happens when user advances or navigates away
    },
  })
}
