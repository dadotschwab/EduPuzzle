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

  return useQuery({
    queryKey: ['puzzles', listId, wordCount],
    queryFn: async () => {
      console.log(`🎲 Fetching ${wordCount} random words from list ${listId}...`)

      // Step 1: Fetch random words from database
      const words = await getRandomWordsForPuzzle(listId, wordCount)

      console.log(`✅ Fetched ${words.length} words`)
      console.log(`🔄 Generating puzzles...`)

      // Step 2: Generate puzzles using our algorithm
      const puzzles = await generatePuzzles(words)

      console.log(`✅ Generated ${puzzles.length} puzzles`)

      // Step 3: Save to database if user is authenticated
      if (user) {
        console.log(`💾 Saving puzzle session...`)
        await savePuzzleSession(user.id, listId, puzzles)
        console.log(`✅ Session saved`)
      }

      return puzzles
    },
    enabled: enabled && !!listId,
    staleTime: 0, // Always fetch fresh puzzles
    gcTime: 0, // Don't cache (was cacheTime in older versions)
    retry: false, // Don't retry on error
  })
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
  if (!puzzles || puzzles.length === 0) {
    return null
  }

  if (puzzleIndex < 0 || puzzleIndex >= puzzles.length) {
    console.warn(`Invalid puzzle index ${puzzleIndex}, using 0`)
    return puzzles[0]
  }

  return puzzles[puzzleIndex]
}
