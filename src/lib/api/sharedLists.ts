/**
 * @fileoverview API functions for word list sharing operations
 *
 * This module provides functions to interact with the shared lists backend,
 * including creating shares, importing copies, and joining collaborative lists.
 */

import { supabase } from '@/lib/supabase'
import type {
  ShareMode,
  SharedListWithDetails,
  Collaborator,
  CreateSharedListResult,
  JoinedCollaborativeList,
} from '@/types'

// Helper type for RPC calls - Supabase's type inference can be overly restrictive
type SupabaseRpcFn = (
  fn: string,
  args: Record<string, unknown>
) => Promise<{ data: unknown; error: Error | null }>

/**
 * Generate a share link for a word list
 */
export async function createShareLink(
  listId: string,
  shareMode: ShareMode
): Promise<CreateSharedListResult[]> {
  // Use type assertion for RPC calls as Supabase types can be restrictive
  const { data, error } = await (supabase.rpc as unknown as SupabaseRpcFn)('create_shared_list', {
    p_list_id: listId,
    p_share_mode: shareMode,
  })

  if (error) throw error
  return data as CreateSharedListResult[]
}

/**
 * Raw response type from shared_lists query with joined word_lists
 */
interface SharedListQueryResult {
  id: string
  original_list_id: string
  share_token: string
  share_mode: string
  created_by: string
  created_at: string
  expires_at?: string | null
  is_active: boolean
  access_count: number
  last_accessed_at?: string | null
  original_list: {
    id: string
    name: string
    source_language: string
    target_language: string
    words: Array<{ count: number }>
  }
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
  const result = data as unknown as SharedListQueryResult
  return {
    ...result,
    share_mode: result.share_mode as ShareMode,
    original_list: {
      ...result.original_list,
      wordCount: result.original_list.words?.[0]?.count || 0,
    },
  }
}

/**
 * Import a shared list as a personal copy
 * @returns The new list ID
 */
export async function importSharedListCopy(token: string): Promise<string> {
  const { data, error } = await (supabase.rpc as unknown as SupabaseRpcFn)(
    'import_shared_list_copy',
    {
      p_share_token: token,
    }
  )

  if (error) throw error
  return data as string
}

/**
 * Join a collaborative shared list
 * @returns The shared list ID
 */
export async function joinCollaborativeList(token: string): Promise<string> {
  const { data, error } = await (supabase.rpc as unknown as SupabaseRpcFn)(
    'join_collaborative_list',
    {
      p_share_token: token,
    }
  )

  if (error) throw error
  return data as string
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

  return (
    data?.map((collab: any) => ({
      id: collab.id,
      shared_list_id: collab.shared_list_id,
      user_id: collab.user_id,
      joined_at: collab.joined_at,
      role: collab.role as 'owner' | 'member' | null,
      user: collab.user,
      isOnline: false, // Default value, would need real-time implementation
    })) || []
  )
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

/**
 * Leave a collaborative list and delete all associated data
 */
export async function leaveCollaborativeListDelete(sharedListId: string): Promise<boolean> {
  const { data, error } = await (supabase.rpc as unknown as SupabaseRpcFn)(
    'leave_collaborative_list_delete',
    {
      p_shared_list_id: sharedListId,
    }
  )

  if (error) throw error
  return data as boolean
}

/**
 * Leave a collaborative list but keep a personal copy
 * @returns The new personal list ID
 */
export async function leaveCollaborativeListKeepCopy(sharedListId: string): Promise<string> {
  const { data, error } = await (supabase.rpc as unknown as SupabaseRpcFn)(
    'leave_collaborative_list_keep_copy',
    {
      p_shared_list_id: sharedListId,
    }
  )

  if (error) throw error
  return data as string
}

/**
 * Get collaborative lists that the user has joined (where they are a member, not owner)
 */
export async function getJoinedCollaborativeLists(
  userId: string
): Promise<JoinedCollaborativeList[]> {
  const { data, error } = await supabase
    .from('list_collaborators')
    .select(
      `
      shared_list_id,
      role,
      joined_at,
      shared_list:shared_lists(
        id,
        share_mode,
        original_list_id,
        original_list:word_lists(id, name, source_language, target_language)
      )
    `
    )
    .eq('user_id', userId)
    .eq('role', 'member')

  if (error) throw error
  return (data || []) as unknown as JoinedCollaborativeList[]
}
