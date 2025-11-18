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
    queryFn: withCounts ? getWordListsWithCounts : getWordLists,
  })
}

/**
 * Fetches word lists with word counts
 * @returns Promise resolving to word lists with counts
 */
async function getWordListsWithCounts(): Promise<WordListWithCount[]> {
  // Get all word lists
  const { data: lists, error: listsError } = await supabase
    .from('word_lists')
    .select('*')
    .order('created_at', { ascending: false })

  if (listsError) throw listsError
  if (!lists) return []

  // Get word counts for each list
  const listsWithCounts = await Promise.all(
    lists.map(async (list: any) => {
      const { count, error } = await supabase
        .from('words')
        .select('*', { count: 'exact', head: true })
        .eq('list_id', list.id)

      if (error) throw error

      return {
        ...list,
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
