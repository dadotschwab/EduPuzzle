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
  // First, get total word count to verify we have enough words
  const { count: totalWords, error: countError } = await supabase
    .from('words')
    .select('*', { count: 'exact', head: true })
    .eq('list_id', listId)

  if (countError) {
    throw new Error(`Failed to count words: ${countError.message}`)
  }

  if (!totalWords || totalWords === 0) {
    throw new Error('No words found in this list. Please add some words first.')
  }

  if (totalWords < count) {
    console.warn(`List only has ${totalWords} words, but ${count} were requested. Using all available words.`)
  }

  // Fetch random words using PostgreSQL's random() function
  const { data, error } = await supabase
    .from('words')
    .select('*')
    .eq('list_id', listId)
    .limit(Math.min(count, totalWords))
    .order('id', { ascending: false }) // Use consistent ordering

  if (error) {
    throw new Error(`Failed to fetch words: ${error.message}`)
  }

  if (!data || data.length === 0) {
    throw new Error('No words returned from database')
  }

  // Shuffle the results client-side to ensure randomness
  const shuffled = [...data].sort(() => Math.random() - 0.5)

  return shuffled.map(word => ({
    id: word.id,
    listId: word.list_id,
    term: word.term,
    translation: word.translation,
    definition: word.definition || undefined,
    exampleSentence: word.example_sentence || undefined,
    createdAt: word.created_at,
  }))
}

/**
 * Fetches all words from a word list
 *
 * @param listId - The word list ID to fetch words from
 * @returns Array of all words from the list
 * @throws Error if fetch fails
 */
export async function getAllWordsFromList(listId: string): Promise<Word[]> {
  const { data, error } = await supabase
    .from('words')
    .select('*')
    .eq('list_id', listId)

  if (error) {
    throw new Error(`Failed to fetch words: ${error.message}`)
  }

  if (!data) {
    return []
  }

  return data.map(word => ({
    id: word.id,
    listId: word.list_id,
    term: word.term,
    translation: word.translation,
    definition: word.definition || undefined,
    exampleSentence: word.example_sentence || undefined,
    createdAt: word.created_at,
  }))
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

  const { data, error } = await supabase
    .from('puzzle_sessions')
    .insert({
      user_id: userId,
      list_id: listId,
      puzzle_data: puzzles, // Store all puzzles as JSONB
      total_words: totalWords,
      correct_words: 0, // Will be updated when puzzle is solved
      started_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to save puzzle session: ${error.message}`)
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

/**
 * Retrieves a puzzle session by ID
 *
 * @param sessionId - The puzzle session ID
 * @returns The puzzle session
 * @throws Error if fetch fails or session not found
 */
export async function getPuzzleSession(sessionId: string): Promise<PuzzleSession> {
  const { data, error } = await supabase
    .from('puzzle_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (error) {
    throw new Error(`Failed to fetch puzzle session: ${error.message}`)
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

/**
 * Updates a puzzle session when completed
 *
 * @param sessionId - The puzzle session ID
 * @param correctWords - Number of words answered correctly
 * @returns Updated puzzle session
 * @throws Error if update fails
 */
export async function completePuzzleSession(
  sessionId: string,
  correctWords: number
): Promise<PuzzleSession> {
  const { data, error } = await supabase
    .from('puzzle_sessions')
    .update({
      completed_at: new Date().toISOString(),
      correct_words: correctWords,
    })
    .eq('id', sessionId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to complete puzzle session: ${error.message}`)
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
