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
import type { Word } from '@/types'

/**
 * Fetches all words for a specific word list
 * @param listId - The word list ID
 * @returns Array of words, sorted by creation date (oldest first)
 * @throws Error if database query fails
 */
export async function getWords(listId: string) {
  const { data, error } = await supabase
    .from('words')
    .select('*')
    .eq('list_id', listId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data as Word[]
}

/**
 * Get a single word by ID
 */
export async function getWord(id: string) {
  const { data, error } = await supabase.from('words').select('*').eq('id', id).single()

  if (error) throw error
  return data as Word
}

/**
 * Create a new word
 */
export async function createWord(word: {
  listId: string
  term: string
  translation: string
  definition?: string
  exampleSentence?: string
}) {
  const { data, error } = await supabase
    .from('words')
    .insert({
      list_id: word.listId,
      term: word.term,
      translation: word.translation,
      definition: word.definition,
      example_sentence: word.exampleSentence,
    } as any)
    .select()
    .single()

  if (error) throw error
  return data as Word
}

/**
 * Create multiple words at once (bulk insert)
 */
export async function createWords(
  words: Array<{
    listId: string
    term: string
    translation: string
    definition?: string
    exampleSentence?: string
  }>
) {
  const { data, error } = await supabase
    .from('words')
    .insert(
      words.map((w) => ({
        list_id: w.listId,
        term: w.term,
        translation: w.translation,
        definition: w.definition,
        example_sentence: w.exampleSentence,
      })) as any
    )
    .select()

  if (error) throw error
  return data as Word[]
}

/**
 * Update a word
 */
export async function updateWord(
  id: string,
  updates: {
    term?: string
    translation?: string
    definition?: string
    exampleSentence?: string
  }
) {
  const updateData: any = {}
  if (updates.term !== undefined) updateData.term = updates.term
  if (updates.translation !== undefined) updateData.translation = updates.translation
  if (updates.definition !== undefined) updateData.definition = updates.definition
  if (updates.exampleSentence !== undefined)
    updateData.example_sentence = updates.exampleSentence

  const { data, error } = await (supabase
    .from('words') as any)
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Word
}

/**
 * Delete a word
 */
export async function deleteWord(id: string) {
  const { error } = await supabase.from('words').delete().eq('id', id)

  if (error) throw error
}

/**
 * Delete multiple words at once
 */
export async function deleteWords(ids: string[]) {
  const { error } = await supabase.from('words').delete().in('id', ids)

  if (error) throw error
}
