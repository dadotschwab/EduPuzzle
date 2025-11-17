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
import type { WordList } from '@/types'

/**
 * Fetches all word lists for the current user
 * @returns Array of word lists, sorted by creation date (newest first)
 * @throws Error if database query fails
 */
export async function getWordLists() {
  const { data, error } = await supabase
    .from('word_lists')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as WordList[]
}

/**
 * Fetches a single word list by ID
 * @param id - The word list ID
 * @returns The word list
 * @throws Error if word list not found or database query fails
 */
export async function getWordList(id: string) {
  const { data, error } = await supabase
    .from('word_lists')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as WordList
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
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('word_lists')
    .insert({
      user_id: user.id,
      name: wordList.name,
      source_language: wordList.source_language,
      target_language: wordList.target_language,
    } as any)
    .select()
    .single()

  if (error) throw error
  return data as WordList
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
) {
  // Cast to any to work around Supabase type inference issues
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from('word_lists') as any)
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as WordList
}

/**
 * Deletes a word list and all its associated words
 * RLS policy ensures user can only delete their own lists
 * @param id - The word list ID
 * @throws Error if database operation fails
 */
export async function deleteWordList(id: string) {
  const { error } = await supabase.from('word_lists').delete().eq('id', id)

  if (error) throw error
}
