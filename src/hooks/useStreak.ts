/**
 * @fileoverview React Query hook for streak state management
 *
 * Provides streak data, daily progress, and completion recording
 * using React Query for caching and Supabase Realtime for live updates.
 *
 * @module hooks/useStreak
 */

import { useQuery, useMutation } from '@tanstack/react-query'
import { useCallback, useEffect } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '@/lib/supabase'
import {
  getStreakData,
  recordDailyCompletion,
  type StreakData,
  type RecordCompletionRequest,
  type RecordCompletionResponse,
  StreakApiError,
} from '@/lib/api/streak'

/**
 * Hook for accessing streak data and managing completions
 *
 * Fetches and caches streak data using React Query with Supabase Realtime updates.
 * Only fetches when user is authenticated and auth loading is complete.
 * Provides streak counters, daily progress, and completion recording functionality.
 *
 * @returns Streak state and helper functions
 * @returns data - Current streak data (null if no streak yet)
 * @returns isLoading - Whether streak data is being fetched
 * @returns error - Any error that occurred during fetching
 * @returns recordCompletion - Function to record daily completion
 * @returns isRecording - Whether completion is being recorded
 * @returns errorType - Classified error type for better UX
 * @returns retry - Function to manually retry failed requests
 * @returns refetch - Function to manually refetch streak data
 *
 * @example
 * ```typescript
 * const { data, recordCompletion, isRecording, isLoading, errorType, retry } = useStreak()
 *
 * if (isLoading) return <Skeleton />
 *
 * if (errorType === 'auth') {
 *   return <AuthError onRetry={retry} />
 * }
 *
 * const { currentStreak, longestStreak, streakFreezesAvailable } = data?.userStreak || {}
 * const { puzzlesCompleted, wordsCompleted, dueWords } = data?.todaysCompletion || {}
 * ```
 */
export function useStreak() {
  const { user, isAuthenticated, loading: authLoading } = useAuth()

  const query = useQuery<StreakData>({
    queryKey: ['streak', user?.id],
    queryFn: getStreakData,
    enabled: !authLoading && isAuthenticated && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes - streak data doesn't change often
    gcTime: 30 * 60 * 1000, // 30 minutes cache time
    refetchOnWindowFocus: false, // Less aggressive than subscription
    refetchOnReconnect: true,
    retry: (failureCount, error: Error) => {
      // Don't retry auth errors
      if (error instanceof StreakApiError && error.statusCode === 401) {
        return false
      }
      // Don't retry server errors (likely missing tables) after 1 attempt
      if (error instanceof StreakApiError && error.statusCode === 500) {
        return false
      }
      // Retry network/client errors up to 3 times
      return failureCount < 3
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  // Supabase Realtime subscription for live streak updates
  useEffect(() => {
    if (!user?.id || !isAuthenticated) return

    const channel = supabase
      .channel(`streak-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_streaks',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[useStreak] Realtime update received:', payload)
          // Refetch streak data on changes
          query.refetch()
        }
      )
      .subscribe()

    return () => {
      console.log('[useStreak] Cleaning up realtime subscription')
      supabase.removeChannel(channel)
    }
  }, [user?.id, isAuthenticated, query])

  // Mutation for recording completions
  const recordCompletionMutation = useMutation<
    RecordCompletionResponse,
    StreakApiError,
    RecordCompletionRequest
  >({
    mutationFn: recordDailyCompletion,
    onSuccess: (data) => {
      console.log('[useStreak] Completion recorded successfully:', data)
      // Refetch streak data after successful completion recording
      query.refetch()
    },
    onError: (error) => {
      console.error('[useStreak] Failed to record completion:', error)
    },
  })

  // Enhanced error classification
  const getErrorType = (error: Error | null) => {
    if (!error) return null
    if (error instanceof StreakApiError) {
      if (error.statusCode === 401) return 'auth'
      if (error.statusCode === 429) return 'rate_limit'
      if (error.statusCode && error.statusCode >= 500) return 'server'
      if (error.statusCode && error.statusCode >= 400) return 'client'
    }
    if (error.message?.includes('fetch')) return 'network'
    return 'unknown'
  }

  // Retry function
  const retry = useCallback(() => {
    query.refetch()
  }, [query])

  return {
    ...query,
    recordCompletion: recordCompletionMutation.mutate,
    isRecording: recordCompletionMutation.isPending,
    errorType: getErrorType(query.error),
    retry,
  }
}

/**
 * Helper hook with streak logic utilities
 *
 * Provides computed values and helper functions for streak-related logic.
 * Should be used alongside useStreak for additional functionality.
 *
 * @returns Helper functions and computed values
 * @returns hasActiveStreak - Whether user has an active streak (> 0)
 * @returns isStreakAtRisk - Whether streak is at risk (1 day streak)
 * @returns canUseFreeze - Whether user has freezes available
 * @returns streakConditionMet - Function to check if streak condition is met
 * @returns todaysProgress - Computed progress for today
 *
 * @example
 * ```typescript
 * const { hasActiveStreak, canUseFreeze, streakConditionMet } = useStreakHelpers()
 *
 * const conditionMet = streakConditionMet(puzzlesCompleted, wordsCompleted, dueWords)
 * if (conditionMet && !hasActiveStreak) {
 *   // User will start a new streak
 * }
 * ```
 */
export function useStreakHelpers() {
  const { data } = useStreak()

  const hasActiveStreak = (data?.userStreak?.current_streak ?? 0) > 0
  const isStreakAtRisk = (data?.userStreak?.current_streak ?? 0) === 1
  const canUseFreeze = (data?.userStreak?.streak_freezes_available ?? 0) > 0

  const streakConditionMet = useCallback(
    (puzzles: number, words: number, dueWords: number): boolean => {
      return puzzles >= 5 || words >= dueWords
    },
    []
  )

  const todaysProgress = {
    puzzlesCompleted: data?.todaysCompletion?.puzzles_completed ?? 0,
    wordsCompleted: data?.todaysCompletion?.words_completed ?? 0,
    dueWords: data?.todaysCompletion?.due_words_count ?? 0,
    progressPercentage: (() => {
      const puzzles = data?.todaysCompletion?.puzzles_completed ?? 0
      const words = data?.todaysCompletion?.words_completed ?? 0
      const dueWords = data?.todaysCompletion?.due_words_count ?? 0

      // Calculate progress toward streak condition (5 puzzles OR all due words)
      const puzzleProgress = Math.min(puzzles / 5, 1) * 50 // 50% weight for puzzles
      const wordProgress = dueWords > 0 ? Math.min(words / dueWords, 1) * 50 : 0 // 50% weight for words

      return Math.max(puzzleProgress, wordProgress) // Use the higher of the two
    })(),
  }

  return {
    hasActiveStreak,
    isStreakAtRisk,
    canUseFreeze,
    streakConditionMet,
    todaysProgress,
  }
}
