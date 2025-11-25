/**
 * @fileoverview useLeaderboard Hook
 *
 * Manages collaborative leaderboard data with real-time updates and opt-in/out functionality.
 */

import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { getLeaderboard, toggleLeaderboardOptIn } from '@/lib/api/leaderboard'
import type {
  LeaderboardEntry,
  UseLeaderboardOptions,
  UseLeaderboardReturn,
} from '@/types/leaderboard.types'

/**
 * useLeaderboard - Manages collaborative leaderboard data with real-time updates
 * Fetches ranked collaborators with scores and handles opt-in/out functionality
 *
 * @example
 * ```tsx
 * const { data, toggleOptIn } = useLeaderboard({ sharedListId: 'list-123' });
 * ```
 */
export function useLeaderboard({
  sharedListId,
  enabled = true,
}: UseLeaderboardOptions): UseLeaderboardReturn {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Query for leaderboard data
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['leaderboard', sharedListId],
    queryFn: () => getLeaderboard(sharedListId),
    enabled: enabled && !!sharedListId,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: true,
  })

  // Mutation for toggling opt-in status
  const toggleOptInMutation = useMutation({
    mutationFn: (optedIn: boolean) => toggleLeaderboardOptIn(sharedListId, optedIn),
    onMutate: async (optedIn) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['leaderboard', sharedListId] })

      // Snapshot previous value
      const previousData = queryClient.getQueryData(['leaderboard', sharedListId])

      // Optimistically update
      queryClient.setQueryData(
        ['leaderboard', sharedListId],
        (old: LeaderboardEntry[] | undefined) => {
          if (!old || !user) return old

          return old.map((entry: LeaderboardEntry) =>
            entry.userId === user.id
              ? { ...entry, isOptedIn: optedIn, score: optedIn ? entry.score : 0 }
              : entry
          )
        }
      )

      return { previousData }
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['leaderboard', sharedListId], context.previousData)
      }
    },
    onSettled: () => {
      // Always refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['leaderboard', sharedListId] })
    },
  })

  // Real-time subscription for leaderboard updates
  useEffect(() => {
    if (!sharedListId || !enabled) return

    const channel = supabase
      .channel(`leaderboard-${sharedListId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'word_progress',
        },
        () => {
          // Invalidate leaderboard when word progress changes
          queryClient.invalidateQueries({ queryKey: ['leaderboard', sharedListId] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'list_collaborators',
          filter: `shared_list_id=eq.${sharedListId}`,
        },
        () => {
          // Invalidate when collaborators change opt-in status
          queryClient.invalidateQueries({ queryKey: ['leaderboard', sharedListId] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sharedListId, enabled, queryClient])

  return {
    data,
    isLoading,
    error: error as Error | null,
    refetch,
    toggleOptIn: {
      mutate: toggleOptInMutation.mutate,
      isPending: toggleOptInMutation.isPending,
    },
  }
}
