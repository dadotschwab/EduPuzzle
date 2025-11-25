import { useQuery } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getPerformanceInsights, PerformanceApiError } from '@/lib/api/performance'
import type { PerformanceInsightsData } from '@/types/performance.types'

/**
 * Hook for fetching comprehensive performance insights data
 *
 * Fetches aggregated data from materialized view and analysis functions.
 * Includes auth guards and proper error handling.
 *
 * @returns Performance insights data and loading states
 */
export function usePerformanceInsights() {
  const { user, isAuthenticated, loading: authLoading } = useAuth()

  const query = useQuery<PerformanceInsightsData>({
    queryKey: ['performance-insights', user?.id],
    queryFn: getPerformanceInsights,
    enabled: !authLoading && isAuthenticated && !!user?.id,
    staleTime: 15 * 60 * 1000, // 15 minutes - insights don't change often
    gcTime: 60 * 60 * 1000, // 1 hour cache time
    refetchOnWindowFocus: false,
    retry: (failureCount, error: Error) => {
      if (error instanceof PerformanceApiError && error.statusCode === 401) {
        return false // Don't retry auth errors
      }
      return failureCount < 2 // Retry other errors up to 2 times
    },
  })

  const retry = useCallback(() => {
    query.refetch()
  }, [query])

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    retry,
    refetch: query.refetch,
  }
}
