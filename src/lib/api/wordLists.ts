/**
 * @fileoverview Word List API functions for Supabase
 *
 * Handles CRUD operations for vocabulary lists (word_lists table)
 */

import { supabase } from '@/lib/supabase'
import { query, mutate } from './supabaseClient'
import type { WordList } from '@/types'
import type { Database } from '@/types/database.types'

type WordListInsert = Database['public']['Tables']['word_lists']['Insert']
type WordListUpdate = Database['public']['Tables']['word_lists']['Update']

export async function getWordLists(params?: { withCounts?: boolean }): Promise<WordList[]> {
  if (params?.withCounts) {
    const { data, error } = await supabase
      .from('word_lists')
      .select(
        `
        *,
        wordCount:words(count)
      `
      )
      .order('created_at', { ascending: false })

    if (error) throw error
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase type inference limitation
    return (
      (data as any)?.map((list: any) => ({
        ...list,
        wordCount:
          Array.isArray(list.wordCount) && list.wordCount.length > 0
            ? (list.wordCount[0] as { count: number }).count
            : 0,
      })) || []
    )
  }

  return query(
    () => supabase.from('word_lists').select('*').order('created_at', { ascending: false }),
    { table: 'word_lists', operation: 'select' }
  )
}

export async function getWordList(id: string): Promise<WordList> {
  return query(() => supabase.from('word_lists').select('*').eq('id', id).single(), {
    table: 'word_lists',
    operation: 'select',
  })
}

export async function createWordList(wordList: {
  name: string
  source_language: string
  target_language: string
}): Promise<WordList> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const insertData: WordListInsert = {
    user_id: user.id,
    name: wordList.name,
    source_language: wordList.source_language,
    target_language: wordList.target_language,
  }

  return mutate(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase type inference limitation
    () => (supabase.from('word_lists') as any).insert(insertData).select().single(),
    {
      table: 'word_lists',
      operation: 'insert',
    }
  )
}

export async function updateWordList(
  id: string,
  updates: {
    name?: string
    source_language?: string
    target_language?: string
  }
): Promise<WordList> {
  const updateData: WordListUpdate = {}
  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.source_language !== undefined) updateData.source_language = updates.source_language
  if (updates.target_language !== undefined) updateData.target_language = updates.target_language

  return mutate(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase type inference limitation
    () => (supabase.from('word_lists') as any).update(updateData).eq('id', id).select().single(),
    { table: 'word_lists', operation: 'update' }
  )
}

export async function deleteWordList(id: string): Promise<void> {
  // DELETE operations return null data on success, so we handle errors directly
  const { error } = await supabase.from('word_lists').delete().eq('id', id)
  if (error) throw error
}
