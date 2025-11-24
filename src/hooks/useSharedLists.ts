/**
 * @fileoverview React hooks for word list sharing operations
 *
 * This module provides React Query hooks for managing shared lists,
 * including creating shares, importing copies, and joining collaborative lists.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import type { ShareMode } from '@/types'
import {
  createShareLink,
  getSharedList,
  importSharedListCopy,
  joinCollaborativeList,
  getUserSharedLists,
  leaveCollaborativeListDelete,
  leaveCollaborativeListKeepCopy,
  getJoinedCollaborativeLists,
} from '@/lib/api/sharedLists'

/**
 * Hook for creating share links
 */
export function useCreateShareLink() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ listId, shareMode }: { listId: string; shareMode: ShareMode }) => {
      return await createShareLink(listId, shareMode)
    },
    onSuccess: () => {
      // Invalidate word lists to show shared status
      queryClient.invalidateQueries({ queryKey: ['wordLists'] })
    },
  })
}

/**
 * Hook for getting shared list details by token
 */
export function useSharedList(token: string) {
  return useQuery({
    queryKey: ['sharedList', token],
    queryFn: async () => {
      return await getSharedList(token)
    },
    enabled: !!token,
  })
}

/**
 * Hook for importing shared list copies or joining collaborative lists
 */
export function useImportSharedList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ token, mode }: { token: string; mode: ShareMode }) => {
      if (mode === 'copy') {
        return await importSharedListCopy(token)
      } else {
        return await joinCollaborativeList(token)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wordLists'] })
    },
  })
}

/**
 * Hook for getting user's shared lists
 */
export function useUserSharedLists() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['userSharedLists', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated')
      return await getUserSharedLists(user.id)
    },
    enabled: !!user?.id,
  })
}

/**
 * Hook for leaving a collaborative list
 */
export function useLeaveCollaborativeList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ sharedListId, keepCopy }: { sharedListId: string; keepCopy: boolean }) => {
      if (keepCopy) {
        return await leaveCollaborativeListKeepCopy(sharedListId)
      } else {
        return await leaveCollaborativeListDelete(sharedListId)
      }
    },
    onSuccess: () => {
      // Invalidate word lists to refresh the dashboard
      queryClient.invalidateQueries({ queryKey: ['wordLists'] })
      queryClient.invalidateQueries({ queryKey: ['collaborativeLists'] })
      queryClient.invalidateQueries({ queryKey: ['joinedCollaborativeLists'] })
    },
  })
}

/**
 * Hook for getting collaborative lists the user has joined
 */
export function useJoinedCollaborativeLists() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['joinedCollaborativeLists', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated')
      return await getJoinedCollaborativeLists(user.id)
    },
    enabled: !!user?.id,
  })
}
