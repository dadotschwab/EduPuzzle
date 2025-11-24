import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getWords,
  createWord,
  createWords,
  updateWord,
  deleteWord,
  deleteWords,
} from '@/lib/api/words'
import type { Database } from '@/types/database.types'

// Helper type for word rows from database (has both snake_case and camelCase)
type WordRow = Database['public']['Tables']['words']['Row']

/**
 * Get all words for a list
 */
export function useWords(listId: string) {
  return useQuery({
    queryKey: ['words', listId],
    queryFn: () => getWords(listId),
    enabled: !!listId,
  })
}

/**
 * Create a new word
 */
export function useCreateWord() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createWord,
    onSuccess: (data) => {
      // Extract list_id from database row
      const wordRow = data as unknown as WordRow
      const listId = wordRow.list_id
      queryClient.invalidateQueries({ queryKey: ['words', listId] })
      queryClient.invalidateQueries({ queryKey: ['wordLists'] })
    },
  })
}

/**
 * Create multiple words
 */
export function useCreateWords() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createWords,
    onSuccess: (data) => {
      if (data.length > 0) {
        // Extract list_id from first database row
        const wordRow = data[0] as unknown as WordRow
        const listId = wordRow.list_id
        queryClient.invalidateQueries({ queryKey: ['words', listId] })
        queryClient.invalidateQueries({ queryKey: ['wordLists'] })
      }
    },
  })
}

/**
 * Update a word
 */
export function useUpdateWord() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof updateWord>[1] }) =>
      updateWord(id, updates),
    onSuccess: (data) => {
      // Extract list_id from database row
      const wordRow = data as unknown as WordRow
      const listId = wordRow.list_id
      queryClient.invalidateQueries({ queryKey: ['words', listId] })
      queryClient.invalidateQueries({ queryKey: ['words', 'single', data.id] })
    },
  })
}

/**
 * Delete a word
 */
export function useDeleteWord() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteWord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['words'] })
      queryClient.invalidateQueries({ queryKey: ['wordLists'] })
    },
  })
}

/**
 * Delete multiple words
 */
export function useDeleteWords() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteWords,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['words'] })
      queryClient.invalidateQueries({ queryKey: ['wordLists'] })
    },
  })
}
