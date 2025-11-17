/**
 * @fileoverview React Query hook for SRS-based puzzle generation
 *
 * Handles "Play Today's Puzzles" feature with smart grouping:
 * - Fetches all words due for review today
 * - Groups by language pair
 * - Applies hybrid grouping strategy (≥15 words = separate puzzle)
 * - Generates crossword puzzles
 * - Tracks progress through SRS algorithm
 *
 * @module hooks/useTodaysPuzzles
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { fetchDueWords, fetchDueWordsCount, batchUpdateWordProgress } from '@/lib/api/srs'
import { generatePuzzles } from '@/lib/algorithms/generator'
import { savePuzzleSession } from '@/lib/api/puzzles'
import type { Puzzle, WordWithProgress, Word } from '@/types'
import { logger } from '@/lib/logger'
import { supabase } from '@/lib/supabase'

const MIN_WORDS_FOR_PUZZLE = 10

/**
 * Represents a group of words for puzzle generation
 */
interface PuzzleGroup {
  languagePair: string
  listIds: string[]
  words: Word[]
}

/**
 * Groups due words by language pair with hybrid strategy
 *
 * Strategy:
 * 1. Group by language pair (e.g., en-de vs en-es)
 * 2. Within each language pair:
 *    - Lists with ≥15 words → Own puzzle
 *    - Lists with <15 words → Combine together
 * 3. Only create puzzles with ≥10 words minimum
 *
 * @param dueWords - Words due for review
 * @returns Array of puzzle groups ready for generation
 */
async function smartGroupWords(dueWords: WordWithProgress[]): Promise<PuzzleGroup[]> {
  if (dueWords.length === 0) return []

  logger.debug(`Smart grouping ${dueWords.length} due words`)

  // Step 1: Group by language pair
  const byLanguagePair = new Map<string, Map<string, WordWithProgress[]>>()

  for (const word of dueWords) {
    // Fetch list info
    const { data: listData, error } = await supabase
      .from('word_lists')
      .select('source_language, target_language')
      .eq('id', word.listId)
      .single()

    if (error || !listData) {
      logger.warn(`Could not fetch list data for word ${word.id}`)
      continue
    }

    const langPair = `${listData.source_language}-${listData.target_language}`

    if (!byLanguagePair.has(langPair)) {
      byLanguagePair.set(langPair, new Map())
    }

    const listsMap = byLanguagePair.get(langPair)!
    if (!listsMap.has(word.listId)) {
      listsMap.set(word.listId, [])
    }
    listsMap.get(word.listId)!.push(word)
  }

  // Step 2: Apply hybrid grouping within each language pair
  const puzzleGroups: PuzzleGroup[] = []

  for (const [langPair, listsMap] of byLanguagePair) {
    const largeLists: Array<{ listId: string; words: WordWithProgress[] }> = []
    const smallLists: Array<{ listId: string; words: WordWithProgress[] }> = []

    // Categorize lists by size
    for (const [listId, words] of listsMap) {
      if (words.length >= 15) {
        largeLists.push({ listId, words })
      } else {
        smallLists.push({ listId, words })
      }
    }

    // Large lists get their own puzzles
    for (const { listId, words } of largeLists) {
      if (words.length >= MIN_WORDS_FOR_PUZZLE) {
        puzzleGroups.push({
          languagePair: langPair,
          listIds: [listId],
          words: words.map(w => ({
            id: w.id,
            listId: w.listId,
            term: w.term,
            translation: w.translation,
            definition: w.definition,
            exampleSentence: w.exampleSentence,
            createdAt: w.createdAt,
          })),
        })
        logger.debug(`Large list ${listId}: ${words.length} words → Own puzzle`)
      }
    }

    // Combine small lists
    if (smallLists.length > 0) {
      const combinedWords: WordWithProgress[] = []
      const combinedListIds: string[] = []

      for (const { listId, words } of smallLists) {
        combinedWords.push(...words)
        combinedListIds.push(listId)
      }

      // Only create puzzle if we have enough words
      if (combinedWords.length >= MIN_WORDS_FOR_PUZZLE) {
        puzzleGroups.push({
          languagePair: langPair,
          listIds: combinedListIds,
          words: combinedWords.map(w => ({
            id: w.id,
            listId: w.listId,
            term: w.term,
            translation: w.translation,
            definition: w.definition,
            exampleSentence: w.exampleSentence,
            createdAt: w.createdAt,
          })),
        })
        logger.debug(`Combined ${smallLists.length} small lists: ${combinedWords.length} words → Mixed puzzle`)
      } else {
        logger.warn(
          `Skipped ${smallLists.length} small lists: Only ${combinedWords.length} words (minimum: ${MIN_WORDS_FOR_PUZZLE})`
        )
      }
    }
  }

  logger.debug(`Created ${puzzleGroups.length} puzzle groups`)
  return puzzleGroups
}

/**
 * Hook to fetch count of words due today
 *
 * @returns Query result with due word count
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
    staleTime: 1000 * 60, // Cache for 1 minute
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  })
}

/**
 * Hook to generate today's puzzles from due words
 *
 * @returns Query result with puzzles and metadata
 */
export function useTodaysPuzzles() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['todaysPuzzles', user?.id],
    queryFn: async () => {
      if (!user) {
        throw new Error('User must be authenticated')
      }

      logger.info('Generating todays puzzles')

      try {
        // Step 1: Fetch due words
        const dueWords = await fetchDueWords(user.id)
        logger.info(`Found ${dueWords.length} words due for review`)

        if (dueWords.length === 0) {
          return {
            puzzles: [],
            totalWords: 0,
            message: 'No words due for review today. Great job! 🎉',
          }
        }

        if (dueWords.length < MIN_WORDS_FOR_PUZZLE) {
          return {
            puzzles: [],
            totalWords: dueWords.length,
            message: `You have ${dueWords.length} words due, but need at least ${MIN_WORDS_FOR_PUZZLE} to generate a puzzle. Add more words to your lists!`,
          }
        }

        // Step 2: Smart grouping
        const puzzleGroups = await smartGroupWords(dueWords)

        if (puzzleGroups.length === 0) {
          return {
            puzzles: [],
            totalWords: dueWords.length,
            message: `Could not create puzzles from ${dueWords.length} words. Try adding more words to your lists.`,
          }
        }

        // Step 3: Generate puzzles for each group
        const allPuzzles: Puzzle[] = []

        for (const group of puzzleGroups) {
          logger.debug(`Generating puzzle for ${group.words.length} words (${group.languagePair})`)
          const puzzles = await generatePuzzles(group.words)

          // Tag puzzles with metadata
          puzzles.forEach(puzzle => {
            (puzzle as any).languagePair = group.languagePair
            ;(puzzle as any).listIds = group.listIds
          })

          allPuzzles.push(...puzzles)
        }

        logger.info(`Generated ${allPuzzles.length} puzzles from ${dueWords.length} words`)

        // Step 4: Save session
        // For multi-list puzzles, we'll use the first list ID as primary
        // The puzzle_data JSONB will contain all puzzles with their metadata
        if (allPuzzles.length > 0) {
          const primaryListId = puzzleGroups[0].listIds[0]
          await savePuzzleSession(user.id, primaryListId, allPuzzles)
          logger.debug('Saved puzzle session')
        }

        return {
          puzzles: allPuzzles,
          totalWords: dueWords.length,
          message: undefined,
        }
      } catch (error) {
        logger.error('Error generating todays puzzles:', error)
        throw error
      }
    },
    enabled: !!user,
    staleTime: 0, // Always fresh
    gcTime: 0, // Don't cache
    refetchOnMount: 'always',
    retry: false,
  })
}

/**
 * Mutation hook for completing a puzzle and updating SRS progress
 *
 * @returns Mutation function to submit puzzle results
 */
export function useCompletePuzzle() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (results: Array<{ wordId: string; wasCorrect: boolean }>) => {
      if (!user) {
        throw new Error('User must be authenticated')
      }

      logger.info(`Completing puzzle with ${results.length} words`)

      // Update SRS progress for all words
      await batchUpdateWordProgress(results, user.id)

      logger.info('Puzzle completion processed successfully')
    },
    onSuccess: () => {
      // Invalidate queries to refresh due word counts
      queryClient.invalidateQueries({ queryKey: ['dueWordsCount'] })
      queryClient.invalidateQueries({ queryKey: ['todaysPuzzles'] })
      logger.debug('Invalidated due words queries')
    },
    onError: (error) => {
      logger.error('Error completing puzzle:', error)
    },
  })
}
