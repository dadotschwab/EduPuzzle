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
import { fetchDueWords, fetchDueWordsCount, batchUpdateWordProgress } from '@/lib/api/srs'
import { generatePuzzles } from '@/lib/algorithms/generator'
import type { WordWithProgress, Puzzle, Word } from '@/types'
import { useAuth } from '@/hooks/useAuth'

const MIN_WORDS_FOR_PUZZLE = 10
const LARGE_LIST_THRESHOLD = 15
const INITIAL_PUZZLE_BATCH = 3 // Generate 3 puzzles at a time

interface PuzzleGroup {
  languagePair: string
  source_language: string
  target_language: string
  words: WordWithProgress[]
  listIds: string[]
}

interface TodaysPuzzlesData {
  puzzles: Puzzle[]
  totalWords: number
  message?: string
}

/**
 * Prioritizes words by how overdue they are
 * Words that are more overdue appear first in the list
 */
function prioritizeWordsByOverdue(words: WordWithProgress[]): WordWithProgress[] {
  const today = new Date().toISOString().split('T')[0]

  return [...words].sort((a, b) => {
    const aDate = a.progress?.nextReviewDate || today
    const bDate = b.progress?.nextReviewDate || today

    // Earlier dates (more overdue) come first
    return aDate.localeCompare(bDate)
  })
}

/**
 * Smart grouping algorithm for multi-list puzzles
 *
 * Strategy:
 * 1. Prioritize words by how overdue they are (most overdue first)
 * 2. Group words by language pair
 * 3. Within each language pair, separate by list size
 * 4. Large lists (≥15 words) get their own puzzle
 * 5. Small lists (<15 words) are combined if total ≥ MIN_WORDS
 */
async function smartGroupWords(dueWords: WordWithProgress[]): Promise<PuzzleGroup[]> {
  const groups: PuzzleGroup[] = []

  // Prioritize overdue words first
  const prioritizedWords = prioritizeWordsByOverdue(dueWords)

  // Group by language pair
  const byLanguagePair = new Map<string, Map<string, WordWithProgress[]>>()

  for (const word of prioritizedWords) {
    const languagePair = `${word.source_language}-${word.target_language}`

    if (!byLanguagePair.has(languagePair)) {
      byLanguagePair.set(languagePair, new Map())
    }

    const listsMap = byLanguagePair.get(languagePair)!
    if (!listsMap.has(word.listId)) {
      listsMap.set(word.listId, [])
    }

    listsMap.get(word.listId)!.push(word)
  }

  // Process each language pair
  for (const [languagePair, listsMap] of byLanguagePair) {
    const [source_language, target_language] = languagePair.split('-')
    const largeLists: { listId: string; words: WordWithProgress[] }[] = []
    const smallLists: { listId: string; words: WordWithProgress[] }[] = []

    // Separate large and small lists
    for (const [listId, words] of listsMap) {
      if (words.length >= LARGE_LIST_THRESHOLD) {
        largeLists.push({ listId, words })
      } else {
        smallLists.push({ listId, words })
      }
    }

    // Large lists get their own puzzles
    for (const { listId, words } of largeLists) {
      groups.push({
        languagePair,
        source_language,
        target_language,
        words,
        listIds: [listId],
      })
    }

    // Combine small lists if they reach minimum threshold
    if (smallLists.length > 0) {
      const combinedWords: WordWithProgress[] = []
      const combinedListIds: string[] = []

      for (const { listId, words } of smallLists) {
        combinedWords.push(...words)
        combinedListIds.push(listId)
      }

      // Only create puzzle if we have enough words
      if (combinedWords.length >= MIN_WORDS_FOR_PUZZLE) {
        groups.push({
          languagePair,
          source_language,
          target_language,
          words: combinedWords,
          listIds: combinedListIds,
        })
      }
    }
  }

  return groups
}

/**
 * Fetches due words and generates puzzles using smart grouping
 */
export function useTodaysPuzzles() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['todaysPuzzles', user?.id],
    queryFn: async (): Promise<TodaysPuzzlesData> => {
      if (!user) throw new Error('User not authenticated')

      // Fetch all due words (including new words with stage 0)
      const dueWords = await fetchDueWords(user.id)
      console.log(`[TodaysPuzzles] Fetched ${dueWords.length} due words`)

      // No words due
      if (dueWords.length === 0) {
        return {
          puzzles: [],
          totalWords: 0,
          message: 'No words due for review today. Great job staying on top of your vocabulary!',
        }
      }

      // Apply smart grouping
      const groups = await smartGroupWords(dueWords)
      console.log(`[TodaysPuzzles] Created ${groups.length} puzzle groups:`)
      groups.forEach((group, index) => {
        console.log(`  Group ${index + 1}: ${group.languagePair}, ${group.words.length} words, lists: ${group.listIds.join(', ')}`)
      })

      // Generate puzzles for each group
      // Use generatePuzzles (plural) to get all clustered puzzles, not just the first one
      const puzzles: Puzzle[] = []
      for (const group of groups) {
        try {
          console.log(`[TodaysPuzzles] Generating puzzles for ${group.languagePair} (${group.words.length} words)...`)

          // Convert WordWithProgress to Word format
          const words: Word[] = group.words.map(w => ({
            id: w.id,
            listId: w.listId,
            term: w.term,
            translation: w.translation,
            definition: w.definition,
            exampleSentence: w.example_sentence,
            createdAt: w.createdAt,
          }))

          // Generate multiple puzzles via clustering
          const groupPuzzles = await generatePuzzles(words)

          if (groupPuzzles.length > 0) {
            puzzles.push(...groupPuzzles)
            console.log(`  ✓ Generated ${groupPuzzles.length} puzzle(s) with ${groupPuzzles.reduce((sum, p) => sum + p.placedWords.length, 0)} total words`)
          } else {
            console.log(`  ✗ No puzzles generated`)
          }
        } catch (error) {
          console.error(`  ✗ Failed to generate puzzles for ${group.languagePair}:`, error)
        }
      }

      console.log(`[TodaysPuzzles] Successfully generated ${puzzles.length} puzzles from ${dueWords.length} words`)

      // Not enough words to create any puzzles
      if (puzzles.length === 0) {
        return {
          puzzles: [],
          totalWords: dueWords.length,
          message: `You have ${dueWords.length} word(s) due, but we need at least ${MIN_WORDS_FOR_PUZZLE} words in the same language pair to create a puzzle. Add more words to your lists!`,
        }
      }

      return {
        puzzles,
        totalWords: dueWords.length,
      }
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
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
      // Invalidate queries to refresh due words count and puzzles
      queryClient.invalidateQueries({ queryKey: ['todaysPuzzles'] })
      queryClient.invalidateQueries({ queryKey: ['dueWordsCount'] })
      queryClient.invalidateQueries({ queryKey: ['wordProgress'] })
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
