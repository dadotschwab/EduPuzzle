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
import { supabase } from '@/lib/supabase'
import type { Puzzle } from '@/types'
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
    onSuccess: () => {
      // ✅ SAFE: Update counts immediately (for dashboard badges)
      queryClient.invalidateQueries({ queryKey: ['dueWordsCount'] })
      queryClient.invalidateQueries({ queryKey: ['wordProgress'] })

      // ❌ DON'T invalidate todaysPuzzles here - causes layout bug!
      // Puzzle regeneration happens when user advances or navigates away
    },
  })
}

/**
 * Hook for managing current puzzle in multi-puzzle session
 */
export function useCurrentPuzzle(puzzles: Puzzle[] | undefined | null, currentIndex: number): Puzzle | null {
  if (!puzzles || puzzles.length === 0) return null
  if (currentIndex < 0 || currentIndex >= puzzles.length) return null
  return puzzles[currentIndex]
}
