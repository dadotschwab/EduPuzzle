import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'

interface ConflictResolutionOptions {
  onConflict?: (local: any, remote: any) => 'local' | 'remote' | 'merge'
  maxRetries?: number
  retryDelay?: number
}

export function useConflictResolution(options: ConflictResolutionOptions = {}) {
  const queryClient = useQueryClient()
  const { onConflict, maxRetries = 3, retryDelay = 1000 } = options

  const resolveConflict = useCallback(
    async <T>(
      operation: () => Promise<T>,
      queryKey: string[],
      optimisticUpdate: (old: any) => any,
      rollbackUpdate: (old: any) => any
    ): Promise<T> => {
      // Store original data for rollback
      const originalData = queryClient.getQueryData(queryKey)

      // Apply optimistic update
      queryClient.setQueryData(queryKey, optimisticUpdate)

      let lastError: Error | null = null

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const result = await operation()

          // Success - invalidate to get fresh data
          queryClient.invalidateQueries({ queryKey })

          return result
        } catch (error) {
          lastError = error as Error

          // Check if it's a conflict error (version mismatch, etc.)
          if (isConflictError(error) && attempt < maxRetries) {
            // Get latest remote data
            await queryClient.invalidateQueries({ queryKey, refetchType: 'none' })
            const latestData = queryClient.getQueryData(queryKey)

            // Determine resolution strategy
            const resolution = onConflict?.(optimisticUpdate(originalData), latestData) || 'remote'

            if (resolution === 'local') {
              // Retry with local changes
              continue
            } else if (resolution === 'remote') {
              // Accept remote changes
              queryClient.setQueryData(queryKey, latestData)
              throw new Error('Conflict resolved by accepting remote changes')
            } else if (resolution === 'merge') {
              // Merge changes (application-specific logic needed)
              const merged = mergeChanges(optimisticUpdate(originalData), latestData)
              queryClient.setQueryData(queryKey, merged)
              continue
            }
          }

          // Non-conflict error or max retries reached - rollback
          queryClient.setQueryData(queryKey, rollbackUpdate)
          break
        }
      }

      throw lastError || new Error('Operation failed after retries')
    },
    [queryClient, onConflict, maxRetries, retryDelay]
  )

  return { resolveConflict }
}

function isConflictError(error: any): boolean {
  // Check for Supabase conflict errors, version mismatches, etc.
  return (
    error?.code === '23505' || // Unique constraint violation
    error?.message?.includes('version') ||
    error?.message?.includes('conflict')
  )
}

function mergeChanges(local: any, remote: any): any {
  // Basic merge strategy - override with more complex logic as needed
  if (Array.isArray(local) && Array.isArray(remote)) {
    // Merge arrays by ID
    const merged = [...remote]
    local.forEach((item) => {
      const existingIndex = merged.findIndex((r) => r.id === item.id)
      if (existingIndex >= 0) {
        merged[existingIndex] = { ...merged[existingIndex], ...item }
      } else {
        merged.push(item)
      }
    })
    return merged
  }

  // Object merge
  return { ...remote, ...local }
}
