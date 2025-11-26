import { useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import {
  getBuddyStatus,
  generateBuddyInvite,
  removeBuddy,
  BuddyData,
  BuddyApiError,
} from '@/lib/api/buddy'
import { toast } from 'sonner'

// Hook return type
export interface UseBuddyReturn {
  data?: BuddyData
  isLoading: boolean
  error: Error | null
  hasBuddy: boolean
  buddyName: string | null
  buddyHasLearnedToday: boolean
  buddyCompletionPercentage: number
  generateInvite: () => void
  isGeneratingInvite: boolean
  removeBuddy: () => void
  isRemovingBuddy: boolean
  errorType: 'auth' | 'network' | 'server' | 'client' | 'rate_limit' | 'unknown' | null
  retry: () => void
}

export function useBuddy(): UseBuddyReturn {
  const { user, isAuthenticated, loading: authLoading } = useAuth()

  const query = useQuery<BuddyData>({
    queryKey: ['buddy', user?.id],
    queryFn: getBuddyStatus,
    enabled: !authLoading && isAuthenticated && !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes - buddy status changes less frequently
    gcTime: 10 * 60 * 1000, // 10 minutes cache time
    refetchOnWindowFocus: false,
    retry: (failureCount, error: Error) => {
      if (error instanceof BuddyApiError && error.statusCode === 401) {
        return false
      }
      if (error instanceof BuddyApiError && error.statusCode === 500) {
        return false
      }
      return failureCount < 3
    },
  })

  // Supabase Realtime subscription for buddy relationship changes
  useEffect(() => {
    if (!user?.id || !isAuthenticated) return

    const channel = supabase
      .channel(`buddy-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes on buddies
          schema: 'public',
          table: 'buddies',
          filter: `user1_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[useBuddy] Buddy relationship changed:', payload)
          query.refetch()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'buddies',
          filter: `user2_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[useBuddy] Buddy relationship changed:', payload)
          query.refetch()
        }
      )
      .subscribe()

    return () => {
      console.log('[useBuddy] Cleaning up realtime subscription')
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isAuthenticated])

  // Mutations for buddy operations
  const generateInviteMutation = useMutation({
    mutationFn: generateBuddyInvite,
    onSuccess: () => {
      toast.success('Invite link generated!')
      query.refetch()
    },
    onError: (error: BuddyApiError) => {
      toast.error(error.message || 'Failed to generate invite')
    },
  })

  const removeBuddyMutation = useMutation({
    mutationFn: removeBuddy,
    onSuccess: () => {
      toast.success('Buddy relationship removed')
      query.refetch()
    },
    onError: (error: BuddyApiError) => {
      toast.error(error.message || 'Failed to remove buddy')
    },
  })

  // Error classification
  const getErrorType = (error: Error | null) => {
    if (!error) return null
    if (error instanceof BuddyApiError) {
      if (error.statusCode === 401) return 'auth'
      if (error.statusCode === 429) return 'rate_limit'
      if (error.statusCode && error.statusCode >= 500) return 'server'
      if (error.statusCode && error.statusCode >= 400) return 'client'
    }
    if (error.message?.includes('fetch')) return 'network'
    return 'unknown'
  }

  return {
    ...query,
    hasBuddy: !!query.data?.buddyName,
    buddyName: query.data?.buddyName ?? null,
    buddyHasLearnedToday: query.data?.hasLearnedToday ?? false,
    buddyCompletionPercentage: query.data?.completionPercentage ?? 0,
    generateInvite: generateInviteMutation.mutate,
    isGeneratingInvite: generateInviteMutation.isPending,
    removeBuddy: removeBuddyMutation.mutate,
    isRemovingBuddy: removeBuddyMutation.isPending,
    errorType: getErrorType(query.error),
    retry: query.refetch,
  }
}

// Helper hook for buddy logic
export function useBuddyHelpers() {
  const { data } = useBuddy()

  return {
    canGenerateInvite: !data?.buddyName, // Only if no current buddy
    inviteExpiryTime: data?.inviteExpiresAt,
    isInviteExpired: data?.inviteExpiresAt && new Date(data.inviteExpiresAt) < new Date(),
  }
}
