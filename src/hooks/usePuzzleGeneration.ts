/**
 * @fileoverview React Query hook for puzzle generation
 *
 * Handles:
 * - Fetching random words from database
 * - Generating crossword puzzles using our algorithm
 * - Saving puzzle sessions
 * - Loading states and error handling
 *
 * @module hooks/usePuzzleGeneration
 */

import { useMutation, useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { getRandomWordsForPuzzle, savePuzzleSession } from '@/lib/api/puzzles'
import { generatePuzzles } from '@/lib/algorithms/generator'
import type { Puzzle } from '@/types'

/**
 * Hook to generate puzzles from a word list
 *
 * Fetches random words, generates puzzles, and saves to database
 *
 * @param listId - The word list ID to generate puzzles from
 * @param wordCount - Number of words to use (default: 30)
 * @param enabled - Whether to automatically fetch (default: true)
 * @returns Query result with puzzles, loading state, and error
 *
 * @example
 * ```typescript
 * function PuzzlePage() {
 *   const { data: puzzles, isLoading, error } = usePuzzleGeneration(listId, 30)
 *
 *   if (isLoading) return <LoadingSpinner />
 *   if (error) return <ErrorMessage error={error} />
 *   if (puzzles && puzzles.length > 0) {
 *     return <PuzzleGrid puzzle={puzzles[0]} />
 *   }
 * }
 * ```
 */
export function usePuzzleGeneration(
  listId: string,
  wordCount: number = 30,
  enabled: boolean = true
) {
  const { user } = useAuth()

  console.log('[usePuzzleGeneration] Hook called with:', { listId, wordCount, enabled, hasUser: !!user })

  const result = useQuery({
    queryKey: ['puzzles', listId, wordCount],
    queryFn: async () => {
      console.log('[usePuzzleGeneration] Query function starting...')
      console.log(`🎲 Fetching ${wordCount} random words from list ${listId}...`)

      try {
        // Step 1: Fetch random words from database
        const words = await getRandomWordsForPuzzle(listId, wordCount)

        console.log(`✅ Fetched ${words.length} words`)
        console.log('[usePuzzleGeneration] Sample words:', words.slice(0, 3))
        console.log(`🔄 Generating puzzles...`)

        // Step 2: Generate puzzles using our algorithm
        const puzzles = await generatePuzzles(words)

        console.log(`✅ Generated ${puzzles.length} puzzles`)
        console.log('[usePuzzleGeneration] Puzzle details:', puzzles.map(p => ({
          id: p.id,
          gridSize: p.gridSize,
          wordCount: p.placedWords.length
        })))

        // Step 3: Save to database if user is authenticated
        if (user) {
          console.log(`💾 Saving puzzle session for user ${user.id}...`)
          await savePuzzleSession(user.id, listId, puzzles)
          console.log(`✅ Session saved`)
        } else {
          console.warn('[usePuzzleGeneration] No user found, skipping session save')
        }

        console.log('[usePuzzleGeneration] Returning puzzles:', puzzles)
        return puzzles
      } catch (error) {
        console.error('[usePuzzleGeneration] Error in query function:', error)
        throw error
      }
    },
    enabled: enabled && !!listId,
    staleTime: 0, // Always fetch fresh puzzles
    gcTime: 0, // Don't cache (was cacheTime in older versions)
    retry: false, // Don't retry on error
  })

  console.log('[usePuzzleGeneration] Query result:', {
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    dataExists: !!result.data,
    dataLength: result.data?.length,
    status: result.status
  })

  return result
}

/**
 * Mutation hook for generating puzzles on-demand (e.g., from a button click)
 *
 * @returns Mutation function and state
 *
 * @example
 * ```typescript
 * function GeneratePuzzleButton({ listId }: { listId: string }) {
 *   const { mutate, isPending } = usePuzzleGenerationMutation()
 *
 *   return (
 *     <Button
 *       onClick={() => mutate({ listId, wordCount: 30 })}
 *       disabled={isPending}
 *     >
 *       {isPending ? 'Generating...' : 'Generate Puzzle'}
 *     </Button>
 *   )
 * }
 * ```
 */
export function usePuzzleGenerationMutation() {
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({
      listId,
      wordCount = 30,
    }: {
      listId: string
      wordCount?: number
    }) => {
      // Step 1: Fetch random words
      const words = await getRandomWordsForPuzzle(listId, wordCount)

      // Step 2: Generate puzzles
      const puzzles = await generatePuzzles(words)

      // Step 3: Save to database
      let sessionId: string | null = null
      if (user) {
        const session = await savePuzzleSession(user.id, listId, puzzles)
        sessionId = session.id
      }

      return { puzzles, sessionId }
    },
  })
}

/**
 * Hook to load a specific puzzle from a multi-puzzle set
 *
 * @param puzzles - Array of all puzzles in the session
 * @param puzzleIndex - Index of the puzzle to display (default: 0)
 * @returns The selected puzzle or null
 *
 * @example
 * ```typescript
 * const { data: allPuzzles } = usePuzzleGeneration(listId)
 * const currentPuzzle = useCurrentPuzzle(allPuzzles, 0) // First puzzle
 * ```
 */
export function useCurrentPuzzle(
  puzzles: Puzzle[] | undefined,
  puzzleIndex: number = 0
): Puzzle | null {
  console.log('[useCurrentPuzzle] Called with:', {
    hasPuzzles: !!puzzles,
    puzzlesLength: puzzles?.length,
    puzzleIndex
  })

  if (!puzzles || puzzles.length === 0) {
    console.warn('[useCurrentPuzzle] No puzzles available, returning null')
    return null
  }

  if (puzzleIndex < 0 || puzzleIndex >= puzzles.length) {
    console.warn(`[useCurrentPuzzle] Invalid puzzle index ${puzzleIndex}, using 0`)
    return puzzles[0]
  }

  const selectedPuzzle = puzzles[puzzleIndex]
  console.log('[useCurrentPuzzle] Returning puzzle:', {
    id: selectedPuzzle.id,
    gridSize: selectedPuzzle.gridSize,
    wordCount: selectedPuzzle.placedWords.length
  })

  return selectedPuzzle
}
