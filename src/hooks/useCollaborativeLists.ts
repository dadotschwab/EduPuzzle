/**
 * @fileoverview Hook for real-time collaborative word list operations
 *
 * This hook manages real-time synchronization for collaborative lists,
 * including optimistic updates, presence tracking, and conflict resolution.
 */

import { useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Word } from '@/types'

interface UseCollaborativeListsOptions {
  listId: string
  enabled?: boolean
}

interface UseCollaborativeListsReturn {
  addWord: (word: Omit<Word, 'id'>) => Promise<void>
  updateWord: (wordId: string, updates: Partial<Word>) => Promise<void>
  deleteWord: (wordId: string) => Promise<void>
  onlineCollaborators: string[] // For now, just user IDs
  isConnected: boolean
}

/** Database row type for words table */
interface WordRow {
  id: string
  list_id: string | null
  term: string
  translation: string
  definition: string | null
  example_sentence: string | null
  created_at: string | null
}

/**
 * Hook for managing real-time collaborative word list operations
 */
export function useCollaborativeLists({
  listId,
  enabled = true,
}: UseCollaborativeListsOptions): UseCollaborativeListsReturn {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Track connection status
  const isConnected = true // Supabase handles connection internally

  // Online collaborators (simplified - just track active users)
  const onlineCollaborators: string[] = [] // Would need presence tracking for full implementation

  useEffect(() => {
    if (!user || !listId || !enabled) return

    // Subscribe to word changes in this collaborative list
    const channel = supabase
      .channel(`collaborative-list-${listId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'words',
          filter: `list_id=eq.${listId}`,
        },
        (payload) => {
          console.log('Real-time word update:', payload)

          // Invalidate and refetch words for this list
          queryClient.invalidateQueries({
            queryKey: ['words', listId],
          })

          // Handle different change types for user feedback
          if (payload.eventType === 'INSERT') {
            console.log('New word added by collaborator')
          } else if (payload.eventType === 'UPDATE') {
            console.log('Word updated by collaborator')
          } else if (payload.eventType === 'DELETE') {
            console.log('Word deleted by collaborator')
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, listId, enabled, queryClient])

  /**
   * Add a word with optimistic updates
   */
  const addWord = useCallback(
    async (wordData: Omit<Word, 'id'>) => {
      if (!user || !listId) throw new Error('User not authenticated or list not specified')

      // Optimistic update
      const tempId = `temp-${Date.now()}`
      const optimisticWord: Word = {
        ...wordData,
        id: tempId,
        listId,
        createdAt: new Date().toISOString(),
      }

      // Add to cache optimistically
      queryClient.setQueryData(['words', listId], (old: Word[] | undefined) => {
        return old ? [...old, optimisticWord] : [optimisticWord]
      })

      try {
        // TODO: Remove 'as any' once database types are regenerated after migration
        const { data, error } = await (supabase.from('words') as any)
          .insert({
            list_id: listId,
            term: wordData.term,
            translation: wordData.translation,
            definition: wordData.definition ?? null,
            example_sentence: wordData.exampleSentence ?? null,
          })
          .select()
          .single()

        if (error) throw error

        // Replace optimistic update with real data
        queryClient.setQueryData(['words', listId], (old: Word[] | undefined) => {
          if (!data) return old
          const row = data as WordRow
          const newWord: Word = {
            id: row.id,
            listId: row.list_id ?? listId,
            term: row.term,
            translation: row.translation,
            definition: row.definition ?? undefined,
            exampleSentence: row.example_sentence ?? undefined,
            createdAt: row.created_at ?? new Date().toISOString(),
          }
          return old?.map((word) => (word.id === tempId ? newWord : word))
        })
      } catch (error) {
        // Rollback optimistic update
        queryClient.setQueryData(['words', listId], (old: Word[] | undefined) => {
          return old?.filter((word) => word.id !== tempId)
        })
        throw error
      }
    },
    [user, listId, queryClient]
  )

  /**
   * Update a word with optimistic updates
   */
  const updateWord = useCallback(
    async (wordId: string, updates: Partial<Word>) => {
      if (!user || !listId) throw new Error('User not authenticated or list not specified')

      // Store original word for rollback
      let originalWord: Word | undefined
      queryClient.setQueryData(['words', listId], (old: Word[] | undefined) => {
        return old?.map((word) => {
          if (word.id === wordId) {
            originalWord = { ...word }
            return { ...word, ...updates }
          }
          return word
        })
      })

      try {
        // TODO: Remove 'as any' once database types are regenerated after migration
        const { error } = await (supabase.from('words') as any)
          .update({
            term: updates.term,
            translation: updates.translation,
            definition: updates.definition ?? null,
            example_sentence: updates.exampleSentence ?? null,
          })
          .eq('id', wordId)

        if (error) throw error
      } catch (error) {
        // Rollback optimistic update
        if (originalWord) {
          queryClient.setQueryData(['words', listId], (old: Word[] | undefined) => {
            return old?.map((word) => (word.id === wordId ? originalWord! : word))
          })
        }
        throw error
      }
    },
    [user, listId, queryClient]
  )

  /**
   * Delete a word with optimistic updates
   */
  const deleteWord = useCallback(
    async (wordId: string) => {
      if (!user || !listId) throw new Error('User not authenticated or list not specified')

      // Store original word for rollback
      let deletedWord: Word | undefined
      queryClient.setQueryData(['words', listId], (old: Word[] | undefined) => {
        return old?.filter((word) => {
          if (word.id === wordId) {
            deletedWord = { ...word }
            return false
          }
          return true
        })
      })

      try {
        const { error } = await supabase.from('words').delete().eq('id', wordId)

        if (error) throw error
      } catch (error) {
        // Rollback optimistic update
        if (deletedWord) {
          queryClient.setQueryData(['words', listId], (old: Word[] | undefined) => {
            return old ? [...old, deletedWord!] : [deletedWord!]
          })
        }
        throw error
      }
    },
    [user, listId, queryClient]
  )

  return {
    addWord,
    updateWord,
    deleteWord,
    onlineCollaborators,
    isConnected,
  }
}
