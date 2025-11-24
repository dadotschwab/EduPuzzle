/**
 * @fileoverview API functions for word list sharing operations
 *
 * This module provides functions to interact with the shared lists backend,
 * including creating shares, importing copies, and joining collaborative lists.
 */

import { supabase } from '@/lib/supabase'
import type { ShareMode, SharedListWithDetails, Collaborator } from '@/types'

/**
 * Generate a share link for a word list
 */
export async function createShareLink(listId: string, shareMode: ShareMode) {
  const { data, error } = await supabase.rpc('create_shared_list', {
    p_list_id: listId,
    p_share_mode: shareMode,
  } as any)

  if (error) throw error
  return data
}

/**
 * Get shared list details by token
 */
export async function getSharedList(token: string): Promise<SharedListWithDetails> {
  const { data, error } = await supabase
    .from('shared_lists')
    .select(
      `
      *,
      original_list:word_lists(
        id, name, source_language, target_language,
        words(count)
      )
    `
    )
    .eq('share_token', token)
    .eq('is_active', true)
    .single()

  if (error) throw error

  // Transform the data to match our interface
  const result = data as any
  return {
    ...result,
    original_list: {
      ...result.original_list,
      wordCount: result.original_list.words?.[0]?.count || 0,
    },
  }
}

/**
 * Import a shared list as a personal copy
 */
export async function importSharedListCopy(token: string) {
  const { data, error } = await supabase.rpc('import_shared_list_copy', {
    p_share_token: token,
  } as any)

  if (error) throw error
  return data
}

/**
 * Join a collaborative shared list
 */
export async function joinCollaborativeList(token: string) {
  const { data, error } = await supabase.rpc('join_collaborative_list', {
    p_share_token: token,
  } as any)

  if (error) throw error
  return data
}

/**
 * Get collaborators for a shared list
 */
export async function getListCollaborators(sharedListId: string): Promise<Collaborator[]> {
  const { data, error } = await supabase
    .from('list_collaborators')
    .select(
      `
      *,
      user:users(id, email)
    `
    )
    .eq('shared_list_id', sharedListId)

  if (error) throw error
  return data
}

/**
 * Check if user is a collaborator on a shared list
 */
export async function checkCollaboratorStatus(sharedListId: string, userId: string) {
  const { data, error } = await supabase
    .from('list_collaborators')
    .select('role')
    .eq('shared_list_id', sharedListId)
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned
  return data
}

/**
 * Get user's shared lists
 */
export async function getUserSharedLists(userId: string) {
  const { data, error } = await supabase
    .from('shared_lists')
    .select(
      `
      *,
      original_list:word_lists(name, source_language, target_language),
      collaborators:list_collaborators(count)
    `
    )
    .eq('created_by', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}
