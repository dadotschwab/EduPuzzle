import { supabase } from '@/lib/supabase'
import type { WordList } from '@/types'

/**
 * Get all word lists for the current user
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
 * Get a single word list by ID
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
 * Create a new word list
 */
export async function createWordList(wordList: {
  name: string
  sourceLanguage: string
  targetLanguage: string
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
      source_language: wordList.sourceLanguage,
      target_language: wordList.targetLanguage,
    } as any)
    .select()
    .single()

  if (error) throw error
  return data as WordList
}

/**
 * Update a word list
 */
export async function updateWordList(
  id: string,
  updates: {
    name?: string
    sourceLanguage?: string
    targetLanguage?: string
  }
) {
  const updateData: any = {}
  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.sourceLanguage !== undefined)
    updateData.source_language = updates.sourceLanguage
  if (updates.targetLanguage !== undefined)
    updateData.target_language = updates.targetLanguage

  const { data, error } = await (supabase
    .from('word_lists') as any)
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as WordList
}

/**
 * Delete a word list
 */
export async function deleteWordList(id: string) {
  const { error } = await supabase.from('word_lists').delete().eq('id', id)

  if (error) throw error
}
