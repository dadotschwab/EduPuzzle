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
import { query, mutate } from './supabaseClient'
import { getTodayDate } from '@/lib/utils/helpers'
import type { WordWithProgress, WordProgress, SRSStage } from '@/types'

/**
 * Fetches all words due for review today (including new words)
 * Excludes words that have already been reviewed today
 */
export async function fetchDueWords(userId: string): Promise<WordWithProgress[]> {
  const today = getTodayDate()
  console.log(`[SRS API] Fetching due words for user ${userId} (today: ${today})`)

  // Fetch all user's words with their progress
  // We'll filter client-side for more reliable and clear logic
  const data = await query(
    () =>
      supabase
        .from('words')
        .select(
          `
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
        word_progress!left (
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
      `
        )
        .eq('word_lists.user_id', userId)
        .eq('word_progress.user_id', userId),
    { table: 'words', operation: 'select' }
  )

  // Define raw row type for Supabase query result
  interface WordQueryRow {
    id: string
    list_id: string
    term: string
    translation: string
    definition: string | null
    example_sentence: string | null
    created_at: string
    word_lists: {
      source_language: string
      target_language: string
    }
    word_progress: Array<{
      id: string
      user_id: string
      word_id: string
      stage: number
      ease_factor: number
      interval_days: number
      next_review_date: string | null
      last_reviewed_at: string | null
      total_reviews: number
      correct_reviews: number
      incorrect_reviews: number
      current_streak: number
      updated_at: string | null
    }> | null
  }

  // Transform to WordWithProgress format
  const allWords: WordWithProgress[] = (data || []).map((row: WordQueryRow) => {
    const wordList = row.word_lists
    const progress = row.word_progress?.[0]

    return {
      id: row.id,
      listId: row.list_id,
      term: row.term,
      translation: row.translation,
      definition: row.definition ?? undefined,
      exampleSentence: row.example_sentence ?? undefined,
      createdAt: row.created_at,
      source_language: wordList.source_language,
      target_language: wordList.target_language,
      progress: progress
        ? {
            id: progress.id,
            userId: progress.user_id,
            wordId: progress.word_id,
            stage: progress.stage as SRSStage,
            easeFactor: progress.ease_factor,
            intervalDays: progress.interval_days,
            nextReviewDate: progress.next_review_date ?? '',
            lastReviewedAt: progress.last_reviewed_at ?? undefined,
            totalReviews: progress.total_reviews,
            correctReviews: progress.correct_reviews,
            incorrectReviews: progress.incorrect_reviews,
            currentStreak: progress.current_streak,
            updatedAt: progress.updated_at ?? undefined,
          }
        : undefined,
    }
  })

  // Filter to only include words that are actually due today
  let newWordsCount = 0
  let reviewedTodayCount = 0
  let notDueYetCount = 0

  const words = allWords.filter((word) => {
    // Include new words (no progress = need first practice)
    if (!word.progress) {
      newWordsCount++
      return true
    }

    // Check if already reviewed today
    const lastReviewedDate = word.progress.lastReviewedAt?.split('T')[0]
    const wasReviewedToday = lastReviewedDate === today
    if (wasReviewedToday) {
      reviewedTodayCount++
      return false // Exclude words already reviewed today
    }

    // Check if word is due (next_review_date <= today or null)
    const nextReviewDate = word.progress.nextReviewDate
    if (!nextReviewDate) return true // No next review date = due

    const isDue = nextReviewDate <= today
    if (!isDue) {
      notDueYetCount++
    }
    return isDue // Only include if due today or overdue
  })

  console.log(
    `[SRS API] Filter breakdown: ${newWordsCount} new words, ${reviewedTodayCount} already reviewed today, ${notDueYetCount} not due yet`
  )

  console.log(
    `[SRS API] Found ${allWords.length} total words, ${words.length} due today (filtered out ${allWords.length - words.length} not due or already reviewed)`
  )
  if (words.length > 0) {
    console.log(
      `[SRS API] Sample due words:`,
      words.slice(0, 5).map((w) => `${w.term} (next: ${w.progress?.nextReviewDate || 'none'})`)
    )
  } else {
    console.log(`[SRS API] No words due today!`)
  }

  return words
}

/**
 * Gets count of due words for dashboard badge
 * Excludes words that have already been reviewed today
 */
export async function fetchDueWordsCount(userId: string): Promise<number> {
  // Use optimized database function to avoid N+1 query
  // TODO: Use get_due_words_count() once migration is applied and types regenerated
  const dueWords = await fetchDueWords(userId)
  return dueWords.length
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
function calculateNextReview(progress: WordProgress, wasCorrect: boolean): Partial<WordProgress> {
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
  // Define the word_progress row type
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
    updated_at: string | null
  }

  // Fetch current progress (use maybeSingle to handle new words)
  const { data: progressData, error: fetchError } = (await supabase
    .from('word_progress')
    .select('*')
    .eq('word_id', wordId)
    .eq('user_id', userId)
    .maybeSingle()) as { data: WordProgressRow | null; error: Error | null }

  if (fetchError) throw fetchError

  // If no progress exists, create initial entry for new word
  if (!progressData) {
    console.log(`[SRS API] Creating initial progress for new word ${wordId}`)

    const today = getTodayDate()

    // Calculate next review date based on correctness
    const nextReviewDate = new Date()
    if (wasCorrect) {
      nextReviewDate.setDate(nextReviewDate.getDate() + 2) // Correct: review in 2 days
    } else {
      nextReviewDate.setDate(nextReviewDate.getDate() + 1) // Incorrect: review tomorrow
    }

    const initialProgress = {
      user_id: userId,
      word_id: wordId,
      stage: wasCorrect ? 1 : 0, // Learning if correct, New if incorrect
      ease_factor: 2.5,
      interval_days: wasCorrect ? 2 : 1, // Correct: 2 days, Incorrect: 1 day
      next_review_date: nextReviewDate.toISOString().split('T')[0],
      last_reviewed_at: today,
      total_reviews: 1,
      correct_reviews: wasCorrect ? 1 : 0,
      incorrect_reviews: wasCorrect ? 0 : 1,
      current_streak: wasCorrect ? 1 : 0,
    }

    // TODO: Remove 'as any' once database types are regenerated after migration
    await mutate(() => (supabase.from('word_progress') as any).insert(initialProgress), {
      table: 'word_progress',
      operation: 'insert',
    })

    console.log(
      `  Created: next_review=${initialProgress.next_review_date}, interval=${initialProgress.interval_days}, stage=${initialProgress.stage}`
    )
    return
  }

  const currentProgress: WordProgress = {
    id: progressData.id,
    userId: progressData.user_id,
    wordId: progressData.word_id,
    stage: progressData.stage as SRSStage,
    easeFactor: progressData.ease_factor,
    intervalDays: progressData.interval_days,
    nextReviewDate: progressData.next_review_date,
    lastReviewedAt: progressData.last_reviewed_at ?? undefined,
    totalReviews: progressData.total_reviews,
    correctReviews: progressData.correct_reviews,
    incorrectReviews: progressData.incorrect_reviews,
    currentStreak: progressData.current_streak,
    updatedAt: progressData.updated_at ?? undefined,
  }

  // Calculate updates using SM-2
  const updates = calculateNextReview(currentProgress, wasCorrect)

  console.log(`[SRS API] Updating word ${wordId}: ${wasCorrect ? 'correct' : 'incorrect'}`)
  console.log(
    `  Previous: next_review=${currentProgress.nextReviewDate}, interval=${currentProgress.intervalDays}, stage=${currentProgress.stage}`
  )
  console.log(
    `  New: next_review=${updates.nextReviewDate}, interval=${updates.intervalDays}, stage=${updates.stage}`
  )

  // Update database
  await mutate(
    // TODO: Remove 'as any' once database types are regenerated after migration
    () => (supabase.from('word_progress') as any).update(updates).eq('id', progressData.id),
    { table: 'word_progress', operation: 'update' }
  )
}

/**
 * Batch update word progress after puzzle completion
 */
export async function batchUpdateWordProgress(
  updates: Array<{ wordId: string; wasCorrect: boolean }>,
  userId: string
): Promise<void> {
  console.log(`[SRS API] Starting batch update for ${updates.length} words`)

  // Process each update sequentially to ensure proper SRS calculations
  for (const { wordId, wasCorrect } of updates) {
    try {
      await updateWordProgress(wordId, userId, wasCorrect)
    } catch (error) {
      console.error(`Failed to update progress for word ${wordId}:`, error)
      // Continue with other updates even if one fails
    }
  }

  console.log(`[SRS API] Batch update completed`)
}
