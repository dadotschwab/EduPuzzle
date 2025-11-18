import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getWords, createWord, createWords, updateWord, deleteWord, deleteWords } from '@/lib/api/words'

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
      // Supabase returns snake_case (list_id) but we cast to camelCase (listId)
      const listId = (data as any).list_id || data.listId
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
        // Supabase returns snake_case (list_id) but we cast to camelCase (listId)
        const listId = (data[0] as any).list_id || data[0].listId
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
      // Supabase returns snake_case (list_id) but we cast to camelCase (listId)
      const listId = (data as any).list_id || data.listId
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
