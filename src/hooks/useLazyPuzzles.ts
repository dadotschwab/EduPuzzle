/**
 * @fileoverview Lazy puzzle generation for Today's Puzzles
 *
 * Generates puzzles on-demand to avoid processing all 700+ words at once.
 * Keeps a buffer of 3 puzzles ahead of the user.
 *
 * @module hooks/useLazyPuzzles
 */

import { useState, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchDueWords, batchUpdateWordProgress } from '@/lib/api/srs'
import { generatePuzzle } from '@/lib/puzzleGenerator'
import type { WordWithProgress, Puzzle } from '@/types'
import { useAuth } from '@/hooks/useAuth'

const MIN_WORDS_FOR_PUZZLE = 10
const LARGE_LIST_THRESHOLD = 15
const PUZZLE_BUFFER_SIZE = 3 // Keep 3 puzzles ahead

interface PuzzleGroup {
  languagePair: string
  source_language: string
  target_language: string
  words: WordWithProgress[]
  listIds: string[]
}

interface LazyPuzzlesData {
  puzzles: Puzzle[]
  totalWords: number
  canGenerateMore: boolean
  generateMore: () => Promise<void>
  isGenerating: boolean
}

/**
 * Prioritizes words by how overdue they are
 */
function prioritizeWordsByOverdue(words: WordWithProgress[]): WordWithProgress[] {
  const today = new Date().toISOString().split('T')[0]

  return [...words].sort((a, b) => {
    const aDate = a.progress?.nextReviewDate || today
    const bDate = b.progress?.nextReviewDate || today
    return aDate.localeCompare(bDate)
  })
}

/**
 * Groups words for puzzle generation
 */
async function createPuzzleGroups(dueWords: WordWithProgress[]): Promise<PuzzleGroup[]> {
  const groups: PuzzleGroup[] = []
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

    // Combine small lists
    if (smallLists.length > 0) {
      const combinedWords: WordWithProgress[] = []
      const combinedListIds: string[] = []

      for (const { listId, words } of smallLists) {
        combinedWords.push(...words)
        combinedListIds.push(listId)
      }

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
 * Hook for lazy puzzle generation
 * Generates puzzles on-demand as user progresses
 */
export function useLazyPuzzles(): LazyPuzzlesData | null {
  const { user } = useAuth()
  const [puzzles, setPuzzles] = useState<Puzzle[]>([])
  const [remainingGroups, setRemainingGroups] = useState<PuzzleGroup[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [totalWords, setTotalWords] = useState(0)

  // Fetch and group all due words
  const { data: dueWords, isLoading } = useQuery({
    queryKey: ['dueWords', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated')
      return fetchDueWords(user.id)
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  })

  // Initialize: create groups and generate first batch
  useEffect(() => {
    if (!dueWords || dueWords.length === 0) return

    const initialize = async () => {
      const groups = await createPuzzleGroups(dueWords)
      setTotalWords(dueWords.length)

      // Generate first batch of puzzles
      const initialPuzzles: Puzzle[] = []
      const groupsToGenerate = groups.slice(0, PUZZLE_BUFFER_SIZE)
      const remaining = groups.slice(PUZZLE_BUFFER_SIZE)

      for (const group of groupsToGenerate) {
        try {
          const puzzle = await generatePuzzle(group.words)
          if (puzzle) {
            initialPuzzles.push(puzzle)
          }
        } catch (error) {
          console.error(`Failed to generate puzzle for ${group.languagePair}:`, error)
        }
      }

      setPuzzles(initialPuzzles)
      setRemainingGroups(remaining)
    }

    initialize()
  }, [dueWords])

  /**
   * Generates more puzzles from remaining groups
   */
  const generateMore = useCallback(async () => {
    if (remainingGroups.length === 0 || isGenerating) return

    setIsGenerating(true)

    const groupsToGenerate = remainingGroups.slice(0, PUZZLE_BUFFER_SIZE)
    const newPuzzles: Puzzle[] = []

    for (const group of groupsToGenerate) {
      try {
        const puzzle = await generatePuzzle(group.words)
        if (puzzle) {
          newPuzzles.push(puzzle)
        }
      } catch (error) {
        console.error(`Failed to generate puzzle for ${group.languagePair}:`, error)
      }
    }

    setPuzzles(prev => [...prev, ...newPuzzles])
    setRemainingGroups(prev => prev.slice(PUZZLE_BUFFER_SIZE))
    setIsGenerating(false)
  }, [remainingGroups, isGenerating])

  if (isLoading || !dueWords) return null

  if (dueWords.length === 0) {
    return {
      puzzles: [],
      totalWords: 0,
      canGenerateMore: false,
      generateMore: async () => {},
      isGenerating: false,
    }
  }

  return {
    puzzles,
    totalWords,
    canGenerateMore: remainingGroups.length > 0,
    generateMore,
    isGenerating,
  }
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
      // Invalidate queries to refresh due words count
      queryClient.invalidateQueries({ queryKey: ['dueWords'] })
      queryClient.invalidateQueries({ queryKey: ['dueWordsCount'] })
      queryClient.invalidateQueries({ queryKey: ['wordProgress'] })
    },
  })
}
