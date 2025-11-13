import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getWords, getWord, createWord, createWords, updateWord, deleteWord, deleteWords } from '@/lib/api/words'

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
 * Get a single word
 */
export function useWord(id: string) {
  return useQuery({
    queryKey: ['words', 'single', id],
    queryFn: () => getWord(id),
    enabled: !!id,
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
      queryClient.invalidateQueries({ queryKey: ['words', data.listId] })
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
        queryClient.invalidateQueries({ queryKey: ['words', data[0].listId] })
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
      queryClient.invalidateQueries({ queryKey: ['words', data.listId] })
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
    },
  })
}
