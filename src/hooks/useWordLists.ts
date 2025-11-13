import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getWordLists,
  getWordList,
  createWordList,
  updateWordList,
  deleteWordList,
} from '@/lib/api/wordLists'

/**
 * Get all word lists
 */
export function useWordLists() {
  return useQuery({
    queryKey: ['wordLists'],
    queryFn: getWordLists,
  })
}

/**
 * Get a single word list
 */
export function useWordList(id: string) {
  return useQuery({
    queryKey: ['wordLists', id],
    queryFn: () => getWordList(id),
    enabled: !!id,
  })
}

/**
 * Create a new word list
 */
export function useCreateWordList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createWordList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wordLists'] })
      queryClient.invalidateQueries({ queryKey: ['wordListsWithCounts'] })
    },
  })
}

/**
 * Update a word list
 */
export function useUpdateWordList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof updateWordList>[1] }) =>
      updateWordList(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['wordLists'] })
      queryClient.invalidateQueries({ queryKey: ['wordLists', data.id] })
      queryClient.invalidateQueries({ queryKey: ['wordListsWithCounts'] })
    },
  })
}

/**
 * Delete a word list
 */
export function useDeleteWordList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteWordList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wordLists'] })
      queryClient.invalidateQueries({ queryKey: ['wordListsWithCounts'] })
    },
  })
}
