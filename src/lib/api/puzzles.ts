/**
 * @fileoverview API functions for puzzle generation and management
 *
 * Handles:
 * - Fetching random words from word lists
 * - Saving puzzle sessions to database
 * - Retrieving puzzle sessions
 *
 * @module lib/api/puzzles
 */

import { supabase } from '@/lib/supabase'
import type { Word, Puzzle, PuzzleSession } from '@/types'
import { logger } from '@/lib/logger'

/**
 * Database row type for words table
 */
interface WordRow {
  id: string
  list_id: string
  term: string
  translation: string
  definition: string | null
  example_sentence: string | null
  created_at: string
}

/**
 * Database row type for puzzle_sessions table
 */
interface PuzzleSessionRow {
  id: string
  user_id: string
  list_id: string
  started_at: string
  completed_at: string | null
  puzzle_data: Puzzle[]
  total_words: number
  correct_words: number
}

/**
 * Fetches random words from a word list for puzzle generation
 *
 * @param listId - The word list ID to fetch words from
 * @param count - Number of random words to fetch (default: 30)
 * @returns Array of words from the list
 * @throws Error if fetch fails or list has insufficient words
 *
 * @example
 * ```typescript
 * const words = await getRandomWordsForPuzzle('list-id-123', 30)
 * // Returns 30 random words from the list
 * ```
 */
export async function getRandomWordsForPuzzle(
  listId: string,
  count: number = 30
): Promise<Word[]> {
  logger.debug(`Getting ${count} random words from list ${listId}`)

  // First, get total word count to verify we have enough words
  const { count: totalWords, error: countError } = await supabase
    .from('words')
    .select('*', { count: 'exact', head: true })
    .eq('list_id', listId)

  if (countError) {
    logger.error('Error counting words:', countError)
    throw new Error(`Failed to count words: ${countError.message}`)
  }

  if (!totalWords || totalWords === 0) {
    logger.error(`No words found in list: ${listId}`)
    throw new Error('No words found in this list. Please add some words first.')
  }

  if (totalWords < count) {
    logger.warn(`List only has ${totalWords} words, but ${count} were requested. Using all available.`)
  }

  // Fetch random words using PostgreSQL's random() function
  const { data, error } = await supabase
    .from('words')
    .select<'*', WordRow>('*')
    .eq('list_id', listId)
    .limit(Math.min(count, totalWords))
    .order('id', { ascending: false }) // Use consistent ordering

  if (error) {
    logger.error('Error fetching words:', error)
    throw new Error(`Failed to fetch words: ${error.message}`)
  }

  if (!data || data.length === 0) {
    logger.error('No data returned from words query')
    throw new Error('No words returned from database')
  }

  // Shuffle the results client-side to ensure randomness
  const shuffled = [...data].sort(() => Math.random() - 0.5)

  const mappedWords = shuffled.map(word => ({
    id: word.id,
    listId: word.list_id,
    term: word.term,
    translation: word.translation,
    definition: word.definition || undefined,
    exampleSentence: word.example_sentence || undefined,
    createdAt: word.created_at,
  }))

  logger.debug(`Returning ${mappedWords.length} words`)

  return mappedWords
}

/**
 * Saves a puzzle session to the database
 *
 * @param userId - The user ID who created the session
 * @param listId - The word list ID this puzzle is from
 * @param puzzles - Array of generated puzzles
 * @returns The created puzzle session
 * @throws Error if save fails
 *
 * @example
 * ```typescript
 * const session = await savePuzzleSession(userId, listId, puzzles)
 * // Navigate to /app/puzzle/${session.id}
 * ```
 */
export async function savePuzzleSession(
  userId: string,
  listId: string,
  puzzles: Puzzle[]
): Promise<PuzzleSession> {
  const totalWords = puzzles.reduce((sum, p) => sum + p.placedWords.length, 0)

  // Cast to any to work around Supabase type inference issues when database types are not available
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = (await (supabase
    .from('puzzle_sessions') as any)
    .insert({
      user_id: userId,
      list_id: listId,
      puzzle_data: puzzles, // Store all puzzles as JSONB
      total_words: totalWords,
      correct_words: 0, // Will be updated when puzzle is solved
      started_at: new Date().toISOString(),
    })
    .select()
    .single()) as { data: PuzzleSessionRow | null; error: any }

  if (error) {
    throw new Error(`Failed to save puzzle session: ${error.message}`)
  }

  if (!data) {
    throw new Error('No data returned from puzzle session insert')
  }

  return {
    id: data.id,
    userId: data.user_id,
    listId: data.list_id,
    startedAt: data.started_at,
    completedAt: data.completed_at || undefined,
    puzzleData: data.puzzle_data,
    totalWords: data.total_words,
    correctWords: data.correct_words,
  }
}
