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

/**
 * Fetches all word lists for the current user
 * @returns React Query result with word lists data
 */
export function useWordLists() {
  return useQuery({
    queryKey: ['wordLists'],
    queryFn: getWordLists,
  })
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
      // Invalidate both simple lists and lists with word counts
      queryClient.invalidateQueries({ queryKey: ['wordLists'] })
      queryClient.invalidateQueries({ queryKey: ['wordListsWithCounts'] })
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
    onSuccess: (data) => {
      // Invalidate list collection, specific list, and lists with counts
      queryClient.invalidateQueries({ queryKey: ['wordLists'] })
      queryClient.invalidateQueries({ queryKey: ['wordLists', data.id] })
      queryClient.invalidateQueries({ queryKey: ['wordListsWithCounts'] })
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
      // Invalidate all list queries
      queryClient.invalidateQueries({ queryKey: ['wordLists'] })
      queryClient.invalidateQueries({ queryKey: ['wordListsWithCounts'] })
    },
  })
}
