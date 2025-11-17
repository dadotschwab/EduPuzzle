/**
 * @fileoverview Spaced Repetition System (SRS) API functions
 *
 * Implements the SM-2 algorithm for optimal spaced repetition learning.
 * Handles:
 * - Fetching due words for review
 * - Updating word progress after reviews
 * - Calculating next review intervals
 * - Grouping words by language for puzzle generation
 *
 * @module lib/api/srs
 */

import { supabase } from '@/lib/supabase'
import type { WordProgress, WordWithProgress, DueWordsSummary, SRSStage } from '@/types'
import { logger } from '@/lib/logger'

/**
 * Database row type for word_progress table
 */
interface WordProgressRow {
  id: string
  user_id: string
  word_id: string
  stage: number
  ease_factor: number
  interval_days: number
  next_review_date: string
  last_reviewed_at: string | null
  total_reviews: number
  correct_reviews: number
  incorrect_reviews: number
  current_streak: number
  updated_at: string
}

/**
 * Fetches all words due for review today for a specific user
 *
 * @param userId - The user ID
 * @returns Array of words with their progress data
 * @throws Error if fetch fails
 */
export async function fetchDueWords(userId: string): Promise<WordWithProgress[]> {
  logger.debug(`Fetching due words for user ${userId}`)

  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

  // Cast to any to work around Supabase type inference issues
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = (await (supabase
    .from('word_progress') as any)
    .select(`
      *,
      words:word_id (
        id,
        list_id,
        term,
        translation,
        definition,
        example_sentence,
        created_at,
        word_lists:list_id (
          id,
          name,
          source_language,
          target_language
        )
      )
    `)
    .eq('user_id', userId)
    .lte('next_review_date', today)
    .order('next_review_date', { ascending: true })) as { data: any[] | null; error: any }

  if (error) {
    logger.error('Error fetching due words:', error)
    throw new Error(`Failed to fetch due words: ${error.message}`)
  }

  if (!data || data.length === 0) {
    logger.debug('No words due for review')
    return []
  }

  // Map database rows to WordWithProgress objects
  const wordsWithProgress: WordWithProgress[] = data.map(row => ({
    id: row.words.id,
    listId: row.words.list_id,
    term: row.words.term,
    translation: row.words.translation,
    definition: row.words.definition || undefined,
    exampleSentence: row.words.example_sentence || undefined,
    createdAt: row.words.created_at,
    progress: {
      id: row.id,
      userId: row.user_id,
      wordId: row.word_id,
      stage: row.stage as SRSStage,
      easeFactor: parseFloat(row.ease_factor),
      intervalDays: row.interval_days,
      nextReviewDate: row.next_review_date,
      lastReviewedAt: row.last_reviewed_at || undefined,
      totalReviews: row.total_reviews,
      correctReviews: row.correct_reviews,
      incorrectReviews: row.incorrect_reviews,
      currentStreak: row.current_streak,
      updatedAt: row.updated_at,
    },
  }))

  logger.debug(`Found ${wordsWithProgress.length} words due for review`)
  return wordsWithProgress
}

/**
 * Fetches count of words due today for a user
 *
 * @param userId - The user ID
 * @returns Number of words due
 */
export async function fetchDueWordsCount(userId: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0]

  const { count, error } = await supabase
    .from('word_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .lte('next_review_date', today)

  if (error) {
    logger.error('Error fetching due words count:', error)
    return 0
  }

  return count || 0
}

/**
 * Groups due words by language pair and list for smart puzzle generation
 *
 * @param userId - The user ID
 * @returns Summary of due words grouped by language and list
 */
export async function fetchDueWordsSummary(userId: string): Promise<DueWordsSummary[]> {
  const dueWords = await fetchDueWords(userId)

  if (dueWords.length === 0) {
    return []
  }

  // Group by language pair
  const byLanguagePair = new Map<string, WordWithProgress[]>()

  for (const word of dueWords) {
    // Fetch list info to get languages
    const { data: listData, error } = await supabase
      .from('word_lists')
      .select('source_language, target_language')
      .eq('id', word.listId)
      .single()

    if (error || !listData) continue

    const langPair = `${listData.source_language}-${listData.target_language}`

    if (!byLanguagePair.has(langPair)) {
      byLanguagePair.set(langPair, [])
    }
    byLanguagePair.get(langPair)!.push(word)
  }

  // Build summary
  const summaries: DueWordsSummary[] = []

  for (const [langPair, words] of byLanguagePair) {
    const [source, target] = langPair.split('-')

    // Group by list
    const byList = new Map<string, WordWithProgress[]>()

    for (const word of words) {
      if (!byList.has(word.listId)) {
        byList.set(word.listId, [])
      }
      byList.get(word.listId)!.push(word)
    }

    // Get list names
    const listSummaries = []
    for (const [listId, listWords] of byList) {
      const { data: listData } = await supabase
        .from('word_lists')
        .select('name')
        .eq('id', listId)
        .single()

      listSummaries.push({
        listId,
        listName: listData?.name || 'Unknown List',
        wordCount: listWords.length,
        words: listWords,
      })
    }

    summaries.push({
      languagePair: langPair,
      sourceLanguage: source,
      targetLanguage: target,
      totalDue: words.length,
      byList: listSummaries,
    })
  }

  return summaries
}

/**
 * Calculates the next interval and stage based on SM-2 algorithm
 *
 * @param progress - Current word progress
 * @param wasCorrect - Whether the answer was correct
 * @returns Updated progress fields
 */
function calculateNextReview(
  progress: WordProgress,
  wasCorrect: boolean
): Partial<WordProgress> {
  const updates: Partial<WordProgress> = {
    totalReviews: progress.totalReviews + 1,
    lastReviewedAt: new Date().toISOString(),
  }

  if (wasCorrect) {
    // Correct answer
    updates.correctReviews = progress.correctReviews + 1
    updates.currentStreak = progress.currentStreak + 1

    let newInterval: number
    let newStage = progress.stage

    if (progress.stage === 0) {
      // New → Learning (1 day)
      newInterval = 1
      newStage = 1
    } else if (progress.stage === 4) {
      // Relearning → Learning (1 day)
      newInterval = 1
      newStage = 1
    } else {
      // Apply SM-2 formula: new_interval = old_interval * ease_factor
      newInterval = Math.round(progress.intervalDays * progress.easeFactor)

      // Minimum interval of 1 day
      if (newInterval < 1) newInterval = 1

      // Promote stage based on interval
      if (newInterval >= 7 && progress.stage === 1) {
        // Learning → Young (1 week)
        newStage = 2
      } else if (newInterval >= 30 && progress.stage === 2) {
        // Young → Mature (1 month)
        newStage = 3
      }
    }

    updates.intervalDays = newInterval
    updates.stage = newStage
    updates.nextReviewDate = addDays(new Date(), newInterval)

    // Increase ease factor slightly (max 2.5)
    updates.easeFactor = Math.min(2.5, progress.easeFactor + 0.1)
  } else {
    // Incorrect answer
    updates.incorrectReviews = progress.incorrectReviews + 1
    updates.currentStreak = 0

    // Reset interval
    updates.intervalDays = 1

    // Demote stage if mature
    if (progress.stage === 3) {
      // Mature → Relearning
      updates.stage = 4
    } else {
      // Stay in current stage but reset interval
      updates.stage = progress.stage
    }

    updates.nextReviewDate = addDays(new Date(), 1)

    // Decrease ease factor (min 1.3)
    updates.easeFactor = Math.max(1.3, progress.easeFactor - 0.2)
  }

  return updates
}

/**
 * Helper function to add days to a date
 */
function addDays(date: Date, days: number): string {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result.toISOString().split('T')[0] // Return YYYY-MM-DD
}

/**
 * Updates word progress after a review
 *
 * @param wordId - The word ID
 * @param userId - The user ID
 * @param wasCorrect - Whether the answer was correct
 * @throws Error if update fails
 */
export async function updateWordProgress(
  wordId: string,
  userId: string,
  wasCorrect: boolean
): Promise<void> {
  logger.debug(`Updating progress for word ${wordId}, correct: ${wasCorrect}`)

  // Fetch current progress
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: progressData, error: fetchError } = (await (supabase
    .from('word_progress') as any)
    .select('*')
    .eq('user_id', userId)
    .eq('word_id', wordId)
    .single()) as { data: WordProgressRow | null; error: any }

  if (fetchError || !progressData) {
    logger.error('Error fetching word progress:', fetchError)
    throw new Error(`Failed to fetch word progress: ${fetchError?.message}`)
  }

  // Convert to WordProgress type
  const currentProgress: WordProgress = {
    id: progressData.id,
    userId: progressData.user_id,
    wordId: progressData.word_id,
    stage: progressData.stage as SRSStage,
    easeFactor: parseFloat(progressData.ease_factor.toString()),
    intervalDays: progressData.interval_days,
    nextReviewDate: progressData.next_review_date,
    lastReviewedAt: progressData.last_reviewed_at || undefined,
    totalReviews: progressData.total_reviews,
    correctReviews: progressData.correct_reviews,
    incorrectReviews: progressData.incorrect_reviews,
    currentStreak: progressData.current_streak,
  }

  // Calculate new values
  const updates = calculateNextReview(currentProgress, wasCorrect)

  // Update database
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = (await (supabase
    .from('word_progress') as any)
    .update({
      stage: updates.stage,
      ease_factor: updates.easeFactor,
      interval_days: updates.intervalDays,
      next_review_date: updates.nextReviewDate,
      last_reviewed_at: updates.lastReviewedAt,
      total_reviews: updates.totalReviews,
      correct_reviews: updates.correctReviews,
      incorrect_reviews: updates.incorrectReviews,
      current_streak: updates.currentStreak,
    })
    .eq('id', progressData.id)) as { error: any }

  if (updateError) {
    logger.error('Error updating word progress:', updateError)
    throw new Error(`Failed to update word progress: ${updateError.message}`)
  }

  logger.debug(`Successfully updated progress for word ${wordId}`)
}

/**
 * Batch updates word progress for multiple words (e.g., after puzzle completion)
 *
 * @param updates - Array of word IDs and their correctness
 * @param userId - The user ID
 */
export async function batchUpdateWordProgress(
  updates: Array<{ wordId: string; wasCorrect: boolean }>,
  userId: string
): Promise<void> {
  logger.debug(`Batch updating ${updates.length} word progress records`)

  // Process updates sequentially to avoid race conditions
  for (const update of updates) {
    try {
      await updateWordProgress(update.wordId, userId, update.wasCorrect)
    } catch (error) {
      logger.error(`Failed to update word ${update.wordId}:`, error)
      // Continue with other updates even if one fails
    }
  }

  logger.debug('Batch update completed')
}
