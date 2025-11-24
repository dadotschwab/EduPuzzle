/**
 * @fileoverview Word API functions for Supabase database operations
 *
 * Provides CRUD operations for vocabulary words within word lists.
 * Handles conversion between camelCase TypeScript types and snake_case
 * database column names.
 *
 * Includes support for:
 * - Single word operations (create, read, update, delete)
 * - Bulk operations (createWords, deleteWords) for efficiency
 *
 * @module lib/api/words
 */

import { supabase } from '@/lib/supabase'
import { query, mutate } from './supabaseClient'
import type { Word } from '@/types'

// Type aliases for cleaner code
// TODO: Use Database['public']['Tables']['words']['Insert'] once types are regenerated
type WordInsert = {
  id?: string
  list_id: string
  term: string
  translation: string
  definition?: string | null
  example_sentence?: string | null
  created_at?: string
}

/**
 * Database update object for words (snake_case for Supabase)
 */
interface WordUpdateData {
  term?: string
  translation?: string
  definition?: string
  example_sentence?: string
}

/**
 * Fetches all words for a specific word list
 * @param listId - The word list ID
 * @returns Array of words, sorted by creation date (oldest first)
 * @throws SupabaseQueryError if database query fails
 */
export async function getWords(listId: string): Promise<Word[]> {
  const words = await query(
    () =>
      supabase
        .from('words')
        .select('*')
        .eq('list_id', listId)
        .order('created_at', { ascending: true }),
    { table: 'words', operation: 'select' }
  )

  return words.map((word: any) => ({
    id: word.id,
    listId: word.list_id || '',
    term: word.term,
    translation: word.translation,
    definition: word.definition || undefined,
    exampleSentence: word.example_sentence || undefined,
    createdAt: word.created_at || '',
  }))
}

/**
 * Get a single word by ID
 * @param id - The word ID
 * @returns The word
 * @throws SupabaseQueryError if word not found or database query fails
 */
export async function getWord(id: string): Promise<Word> {
  return query(() => supabase.from('words').select('*').eq('id', id).single(), {
    table: 'words',
    operation: 'select',
  })
}

/**
 * Create a new word
 * @param word - Word details
 * @returns The created word
 * @throws SupabaseQueryError if database operation fails
 */
export async function createWord(word: {
  listId: string
  term: string
  translation: string
  definition?: string
  exampleSentence?: string
}): Promise<Word> {
  const insertData: WordInsert = {
    list_id: word.listId,
    term: word.term,
    translation: word.translation,
    definition: word.definition || null,
    example_sentence: word.exampleSentence || null,
  }

  return mutate(
    // TODO: Remove 'as any' once database types are regenerated after migration
    () =>
      supabase
        .from('words')
        .insert(insertData as any)
        .select()
        .single(),
    { table: 'words', operation: 'insert' }
  )
}

/**
 * Create multiple words at once (bulk insert)
 * @param words - Array of word details
 * @returns Array of created words
 * @throws SupabaseQueryError if database operation fails
 */
export async function createWords(
  words: Array<{
    listId: string
    term: string
    translation: string
    definition?: string
    exampleSentence?: string
  }>
): Promise<Word[]> {
  const insertData: WordInsert[] = words.map((w) => ({
    list_id: w.listId,
    term: w.term,
    translation: w.translation,
    definition: w.definition || null,
    example_sentence: w.exampleSentence || null,
  }))

  return mutate(
    // TODO: Remove 'as any' once database types are regenerated after migration
    () =>
      supabase
        .from('words')
        .insert(insertData as any)
        .select(),
    {
      table: 'words',
      operation: 'insert',
    }
  )
}

/**
 * Update a word
 * @param id - The word ID
 * @param updates - Partial word updates
 * @returns The updated word
 * @throws SupabaseQueryError if database operation fails
 */
export async function updateWord(
  id: string,
  updates: {
    term?: string
    translation?: string
    definition?: string
    exampleSentence?: string
  }
): Promise<Word> {
  const updateData: WordUpdateData = {}
  if (updates.term !== undefined) updateData.term = updates.term
  if (updates.translation !== undefined) updateData.translation = updates.translation
  if (updates.definition !== undefined) updateData.definition = updates.definition
  if (updates.exampleSentence !== undefined) updateData.example_sentence = updates.exampleSentence

  return mutate(
    // TODO: Remove 'as any' once database types are regenerated after migration
    () => (supabase.from('words') as any).update(updateData).eq('id', id).select().single(),
    {
      table: 'words',
      operation: 'update',
    }
  )
}

/**
 * Delete a word
 * @param id - The word ID
 * @throws SupabaseQueryError if database operation fails
 */
export async function deleteWord(id: string): Promise<void> {
  await mutate(() => supabase.from('words').delete().eq('id', id), {
    table: 'words',
    operation: 'delete',
  })
}

/**
 * Delete multiple words at once
 * @param ids - Array of word IDs to delete
 * @throws SupabaseQueryError if database operation fails
 */
export async function deleteWords(ids: string[]): Promise<void> {
  await mutate(() => supabase.from('words').delete().in('id', ids), {
    table: 'words',
    operation: 'delete',
  })
}
