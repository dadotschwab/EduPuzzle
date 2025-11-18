/**
 * @fileoverview Word list API functions for Supabase database operations
 *
 * Provides CRUD operations for word lists, handling the conversion between
 * camelCase TypeScript types and snake_case database column names.
 *
 * All functions use Row Level Security (RLS) policies to ensure users
 * can only access their own word lists.
 *
 * @module lib/api/wordLists
 */

import { supabase } from '@/lib/supabase'
import { query, mutate } from './supabaseClient'
import type { WordList } from '@/types'

/**
 * Fetches all word lists for the current user
 * @returns Array of word lists, sorted by creation date (newest first)
 * @throws SupabaseQueryError if database query fails
 */
export async function getWordLists(): Promise<WordList[]> {
  return query(
    () => supabase
      .from('word_lists')
      .select('*')
      .order('created_at', { ascending: false }),
    { table: 'word_lists', operation: 'select' }
  )
}

/**
 * Fetches a single word list by ID
 * @param id - The word list ID
 * @returns The word list
 * @throws SupabaseQueryError if word list not found or database query fails
 */
export async function getWordList(id: string): Promise<WordList> {
  return query(
    () => supabase
      .from('word_lists')
      .select('*')
      .eq('id', id)
      .single(),
    { table: 'word_lists', operation: 'select' }
  )
}

/**
 * Creates a new word list for the current user
 * @param wordList - Word list details (name and languages)
 * @returns The created word list
 * @throws Error if user not authenticated or database operation fails
 */
export async function createWordList(wordList: {
  name: string
  source_language: string
  target_language: string
}): Promise<WordList> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  return mutate(
    () => supabase
      .from('word_lists')
      .insert({
        user_id: user.id,
        name: wordList.name,
        source_language: wordList.source_language,
        target_language: wordList.target_language,
      } as any)
      .select()
      .single(),
    { table: 'word_lists', operation: 'insert' }
  )
}

/**
 * Updates an existing word list
 * Only provided fields will be updated
 * @param id - The word list ID
 * @param updates - Partial word list updates
 * @returns The updated word list
 * @throws Error if database operation fails
 */
export async function updateWordList(
  id: string,
  updates: {
    name?: string
    source_language?: string
    target_language?: string
  }
): Promise<WordList> {
  // Cast to any to work around Supabase type inference issues
  return mutate(
    () => (supabase.from('word_lists') as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single(),
    { table: 'word_lists', operation: 'update' }
  )
}

/**
 * Deletes a word list and all its associated words
 * RLS policy ensures user can only delete their own lists
 * @param id - The word list ID
 * @throws Error if database operation fails
 */
export async function deleteWordList(id: string): Promise<void> {
  await mutate(
    () => supabase.from('word_lists').delete().eq('id', id),
    { table: 'word_lists', operation: 'delete' }
  )
}
