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
import { query, mutate } from './supabaseClient'
import type { Database, Json } from '@/types/database'
import type { Word, Puzzle } from '@/types'
import { logger } from '@/lib/logger'

type PuzzleSessionInsert = Database['public']['Tables']['puzzle_sessions']['Insert']
type PuzzleSessionUpdate = Database['public']['Tables']['puzzle_sessions']['Update']
type WordRow = Database['public']['Tables']['words']['Row']
type PuzzleSessionRow = Database['public']['Tables']['puzzle_sessions']['Row']

export interface PuzzleSession {
  id: string
  user_id: string
  list_id: string | null
  started_at: string
  completed_at: string | null
  puzzle_data: unknown
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
export async function getRandomWordsForPuzzle(listId: string, count: number = 30): Promise<Word[]> {
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
    logger.warn(
      `List only has ${totalWords} words, but ${count} were requested. Using all available.`
    )
  }

  // Fetch random words using consistent ordering
  const data = await query(
    () =>
      supabase
        .from('words')
        .select('*')
        .eq('list_id', listId)
        .limit(Math.min(count, totalWords))
        .order('id', { ascending: false }),
    { table: 'words', operation: 'select' }
  )

  if (!data || data.length === 0) {
    logger.error('No data returned from words query')
    throw new Error('No words returned from database')
  }

  // Shuffle the results client-side to ensure randomness
  const shuffled = [...data].sort(() => Math.random() - 0.5)

  const mappedWords: Word[] = shuffled.map((word: WordRow) => ({
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

  const insertData: PuzzleSessionInsert = {
    user_id: userId,
    list_id: listId,
    puzzle_data: puzzles as unknown as Json,
    total_words: totalWords,
    correct_words: 0,
    started_at: new Date().toISOString(),
  }

  const data = await mutate(
    // TODO: Remove 'as any' once database types are regenerated after migration
    () => (supabase.from('puzzle_sessions') as any).insert(insertData).select().single(),
    { table: 'puzzle_sessions', operation: 'insert' }
  )

  const sessionRow = data as unknown as PuzzleSessionRow

  return {
    id: sessionRow.id,
    user_id: sessionRow.user_id,
    list_id: sessionRow.list_id,
    started_at: sessionRow.started_at,
    completed_at: sessionRow.completed_at,
    puzzle_data: sessionRow.puzzle_data,
    total_words: sessionRow.total_words,
    correct_words: sessionRow.correct_words,
  }
}

export async function createPuzzleSession(session: {
  listId: string | null
  puzzleData: unknown
  totalWords: number
}): Promise<PuzzleSession> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const insertData: PuzzleSessionInsert = {
    user_id: user.id,
    list_id: session.listId,
    puzzle_data:
      session.puzzleData as Database['public']['Tables']['puzzle_sessions']['Row']['puzzle_data'],
    total_words: session.totalWords,
  }

  return mutate(
    // TODO: Remove 'as any' once database types are regenerated after migration
    () => (supabase.from('puzzle_sessions') as any).insert(insertData).select().single(),
    {
      table: 'puzzle_sessions',
      operation: 'insert',
    }
  )
}

export async function completePuzzleSession(
  id: string,
  correctWords: number
): Promise<PuzzleSession> {
  const updateData: PuzzleSessionUpdate = {
    completed_at: new Date().toISOString(),
    correct_words: correctWords,
  }

  return mutate(
    // TODO: Remove 'as any' once database types are regenerated after migration
    () =>
      (supabase.from('puzzle_sessions') as any).update(updateData).eq('id', id).select().single(),
    { table: 'puzzle_sessions', operation: 'update' }
  )
}

export async function getPuzzleSessions(listId?: string): Promise<PuzzleSession[]> {
  const query_builder = supabase
    .from('puzzle_sessions')
    .select('*')
    .order('started_at', { ascending: false })

  if (listId) {
    query_builder.eq('list_id', listId)
  }

  return query(() => query_builder, { table: 'puzzle_sessions', operation: 'select' })
}
