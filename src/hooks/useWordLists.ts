/**
 * @fileoverview React Query hooks for word list CRUD operations
 *
 * These hooks provide React Query wrappers around the word list API functions,
 * handling caching, optimistic updates, and cache invalidation automatically.
 *
 * @module hooks/useWordLists
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getWordLists,
  getWordList,
  createWordList,
  updateWordList,
  deleteWordList,
} from '@/lib/api/wordLists'
import { supabase } from '@/lib/supabase'
import type { WordList } from '@/types'

export interface WordListWithCount extends WordList {
  wordCount: number
  is_shared?: boolean | null
}

/**
 * Fetches word lists with optional word counts
 * @param options - Configuration options
 * @param options.withCounts - Whether to include word counts (default: false)
 * @returns React Query result with word lists data
 */
export function useWordLists(options?: { withCounts?: boolean }) {
  const { withCounts = false } = options || {}

  return useQuery({
    queryKey: withCounts ? ['wordLists', 'withCounts'] : ['wordLists'],
    queryFn: withCounts ? getWordListsWithCounts : () => getWordLists(),
  })
}

/** Type for collaboration query result */
interface CollaborationResult {
  shared_list: {
    original_list: WordListRow | null
  } | null
}

/** Raw word list row from database */
interface WordListRow {
  id: string
  user_id: string | null
  name: string
  source_language: string
  target_language: string
  created_at: string | null
  updated_at: string | null
  is_shared?: boolean | null
  shared_at?: string | null
}

/**
 * Fetches word lists with word counts for the current user
 * Only returns lists that the user owns OR is a collaborator on
 * @returns Promise resolving to word lists with counts
 */
async function getWordListsWithCounts(): Promise<WordListWithCount[]> {
  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  // Get lists the user owns
  const { data: ownedLists, error: ownedError } = await supabase
    .from('word_lists')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (ownedError) throw ownedError

  // Get lists the user collaborates on (via list_collaborators)
  const { data: collaborations, error: collabError } = await supabase
    .from('list_collaborators')
    .select(
      `
      shared_list:shared_lists(
        original_list:word_lists(*)
      )
    `
    )
    .eq('user_id', user.id)

  if (collabError) throw collabError

  // Extract collaborated lists
  const collaboratedLists: WordListRow[] = []
  if (collaborations) {
    for (const collab of collaborations as unknown as CollaborationResult[]) {
      if (collab.shared_list?.original_list) {
        collaboratedLists.push(collab.shared_list.original_list)
      }
    }
  }

  // Combine and deduplicate lists (user might own a list they also collaborate on)
  const allLists: WordListRow[] = [...((ownedLists || []) as unknown as WordListRow[])]
  const ownedIds = new Set(allLists.map((l) => l.id))

  for (const list of collaboratedLists) {
    if (!ownedIds.has(list.id)) {
      allLists.push(list)
    }
  }

  // Sort by created_at descending
  allLists.sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  )

  // Get word counts for each list
  const listsWithCounts = await Promise.all(
    allLists.map(async (list) => {
      const { count, error } = await supabase
        .from('words')
        .select('*', { count: 'exact', head: true })
        .eq('list_id', list.id)

      if (error) throw error

      return {
        id: list.id,
        user_id: list.user_id || '',
        name: list.name,
        source_language: list.source_language,
        target_language: list.target_language,
        created_at: list.created_at || '',
        updated_at: list.updated_at || '',
        is_shared: list.is_shared,
        wordCount: count || 0,
      } as WordListWithCount
    })
  )

  return listsWithCounts
}

/**
 * Fetches a single word list by ID
 * @param id - The word list ID
 * @returns React Query result with word list data
 */
export function useWordList(id: string) {
  return useQuery({
    queryKey: ['wordLists', id],
    queryFn: () => getWordList(id),
    enabled: !!id,
  })
}

/**
 * Creates a new word list
 * Automatically invalidates related queries on success
 * @returns Mutation hook for creating word lists
 */
export function useCreateWordList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createWordList,
    onSuccess: () => {
      // Invalidate all word list queries
      queryClient.invalidateQueries({ queryKey: ['wordLists'] })
    },
  })
}

/**
 * Updates an existing word list
 * Automatically invalidates related queries on success
 * @returns Mutation hook for updating word lists
 */
export function useUpdateWordList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof updateWordList>[1] }) =>
      updateWordList(id, updates),
    onSuccess: () => {
      // Invalidate all word list queries
      queryClient.invalidateQueries({ queryKey: ['wordLists'] })
    },
  })
}

/**
 * Deletes a word list and all its associated words
 * Automatically invalidates related queries on success
 * @returns Mutation hook for deleting word lists
 */
export function useDeleteWordList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteWordList,
    onSuccess: () => {
      // Invalidate all word list queries
      queryClient.invalidateQueries({ queryKey: ['wordLists'] })
    },
  })
}
