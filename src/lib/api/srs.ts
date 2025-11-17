/**
 * @fileoverview SRS (Spaced Repetition System) API using SM-2 algorithm
 *
 * Implements SuperMemo SM-2 algorithm for optimal vocabulary retention:
 * - Ease factors: 1.3-2.5
 * - Intervals calculated based on performance
 * - Stage progression: New → Learning → Young → Mature / Relearning
 *
 * @module lib/api/srs
 */

import { supabase } from '@/lib/supabase'
import type { WordWithProgress, WordProgress, SRSStage } from '@/types'

/**
 * Fetches all words due for review today (including new words)
 */
export async function fetchDueWords(userId: string): Promise<WordWithProgress[]> {
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('words')
    .select(`
      id,
      list_id,
      term,
      translation,
      definition,
      example_sentence,
      created_at,
      word_lists!inner (
        id,
        name,
        source_language,
        target_language,
        user_id
      ),
      word_progress (
        id,
        user_id,
        word_id,
        stage,
        ease_factor,
        interval_days,
        next_review_date,
        last_reviewed_at,
        total_reviews,
        correct_reviews,
        incorrect_reviews,
        current_streak,
        updated_at
      )
    `)
    .eq('word_lists.user_id', userId)
    .or(`next_review_date.lte.${today},next_review_date.is.null`, { foreignTable: 'word_progress' })

  if (error) throw error

  // Transform to WordWithProgress format
  const words: WordWithProgress[] = (data || []).map((row: any) => {
    const wordList = row.word_lists
    const progress = row.word_progress?.[0]

    return {
      id: row.id,
      listId: row.list_id,
      term: row.term,
      translation: row.translation,
      definition: row.definition,
      example_sentence: row.example_sentence,
      createdAt: row.created_at,
      sourceLanguage: wordList.source_language,
      targetLanguage: wordList.target_language,
      progress: progress
        ? {
            id: progress.id,
            userId: progress.user_id,
            wordId: progress.word_id,
            stage: progress.stage as SRSStage,
            easeFactor: progress.ease_factor,
            intervalDays: progress.interval_days,
            nextReviewDate: progress.next_review_date,
            lastReviewedAt: progress.last_reviewed_at,
            totalReviews: progress.total_reviews,
            correctReviews: progress.correct_reviews,
            incorrectReviews: progress.incorrect_reviews,
            currentStreak: progress.current_streak,
            updatedAt: progress.updated_at,
          }
        : undefined,
    }
  })

  return words
}

/**
 * Gets count of due words for dashboard badge
 */
export async function fetchDueWordsCount(userId: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0]

  const { count, error } = await supabase
    .from('words')
    .select('id', { count: 'exact', head: true })
    .eq('word_lists.user_id', userId)
    .or(`next_review_date.lte.${today},next_review_date.is.null`, { foreignTable: 'word_progress' })

  if (error) throw error
  return count || 0
}

/**
 * SM-2 Algorithm: Calculate next review date and ease factor
 *
 * Progression thresholds:
 * - Learning (stage 1): interval ≥ 7 days → Young (stage 2)
 * - Young (stage 2): interval ≥ 30 days → Mature (stage 3)
 * - Mature (stage 3): incorrect → Relearning (stage 4)
 * - Relearning (stage 4): correct with interval ≥ 7 → Young (stage 2)
 */
function calculateNextReview(
  progress: WordProgress,
  wasCorrect: boolean
): Partial<WordProgress> {
  const updates: Partial<WordProgress> = {
    lastReviewedAt: new Date().toISOString(),
    totalReviews: progress.totalReviews + 1,
  }

  if (wasCorrect) {
    // Correct answer: increase interval and ease factor
    updates.correctReviews = progress.correctReviews + 1
    updates.currentStreak = progress.currentStreak + 1

    // Calculate new interval
    let newInterval: number
    if (progress.intervalDays === 0) {
      newInterval = 1 // First review: 1 day
    } else if (progress.intervalDays === 1) {
      newInterval = 6 // Second review: 6 days
    } else {
      // Subsequent reviews: interval × easeFactor
      newInterval = Math.round(progress.intervalDays * progress.easeFactor)
    }

    updates.intervalDays = newInterval
    updates.easeFactor = Math.min(2.5, progress.easeFactor + 0.1)

    // Stage progression based on interval
    if (progress.stage === 0) {
      // New → Learning
      updates.stage = 1
    } else if (progress.stage === 1 && newInterval >= 7) {
      // Learning → Young (7+ days)
      updates.stage = 2
    } else if (progress.stage === 2 && newInterval >= 30) {
      // Young → Mature (30+ days)
      updates.stage = 3
    } else if (progress.stage === 4 && newInterval >= 7) {
      // Relearning → Young (recovered with 7+ days)
      updates.stage = 2
    }
  } else {
    // Incorrect answer: reset interval, decrease ease factor
    updates.incorrectReviews = progress.incorrectReviews + 1
    updates.currentStreak = 0
    updates.intervalDays = 1 // Reset to 1 day
    updates.easeFactor = Math.max(1.3, progress.easeFactor - 0.2)

    // Demote mature words to relearning
    if (progress.stage === 3) {
      updates.stage = 4 // Mature → Relearning
    }
  }

  // Calculate next review date
  const nextDate = new Date()
  nextDate.setDate(nextDate.getDate() + (updates.intervalDays || 1))
  updates.nextReviewDate = nextDate.toISOString().split('T')[0]

  return updates
}

/**
 * Updates a single word's SRS progress
 */
export async function updateWordProgress(
  wordId: string,
  userId: string,
  wasCorrect: boolean
): Promise<void> {
  // Fetch current progress
  const { data: progressData, error: fetchError } = await supabase
    .from('word_progress')
    .select('*')
    .eq('word_id', wordId)
    .eq('user_id', userId)
    .single()

  if (fetchError) throw fetchError
  if (!progressData) throw new Error('Word progress not found')

  const currentProgress: WordProgress = {
    id: progressData.id,
    userId: progressData.user_id,
    wordId: progressData.word_id,
    stage: progressData.stage as SRSStage,
    easeFactor: progressData.ease_factor,
    intervalDays: progressData.interval_days,
    nextReviewDate: progressData.next_review_date,
    lastReviewedAt: progressData.last_reviewed_at,
    totalReviews: progressData.total_reviews,
    correctReviews: progressData.correct_reviews,
    incorrectReviews: progressData.incorrect_reviews,
    currentStreak: progressData.current_streak,
    updatedAt: progressData.updated_at,
  }

  // Calculate updates using SM-2
  const updates = calculateNextReview(currentProgress, wasCorrect)

  // Update database
  const { error: updateError } = await supabase
    .from('word_progress')
    .update(updates)
    .eq('id', progressData.id)

  if (updateError) throw updateError
}

/**
 * Batch update word progress after puzzle completion
 */
export async function batchUpdateWordProgress(
  updates: Array<{ wordId: string; wasCorrect: boolean }>,
  userId: string
): Promise<void> {
  // Process each update sequentially to ensure proper SRS calculations
  for (const { wordId, wasCorrect } of updates) {
    try {
      await updateWordProgress(wordId, userId, wasCorrect)
    } catch (error) {
      console.error(`Failed to update progress for word ${wordId}:`, error)
      // Continue with other updates even if one fails
    }
  }
}
