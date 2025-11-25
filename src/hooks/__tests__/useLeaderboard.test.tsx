/**
 * @fileoverview Tests for useLeaderboard hook
 */

import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useLeaderboard } from '@/hooks/useLeaderboard'
import * as leaderboardApi from '@/lib/api/leaderboard'

// Mock the API functions
vi.mock('@/lib/api/leaderboard', () => ({
  getLeaderboard: vi.fn(),
  toggleLeaderboardOptIn: vi.fn(),
}))

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
      removeChannel: vi.fn(),
    })),
  },
}))

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-123', email: 'test@example.com' },
  }),
}))

describe('useLeaderboard', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('returns leaderboard data when enabled', async () => {
    const mockData = [
      {
        userId: 'user-1',
        user: { id: 'user-1', email: 'user1@example.com', fullName: 'User One' },
        score: 150,
        wordsLearned: 10,
        totalWords: 20,
        isOptedIn: true,
        lastUpdated: '2024-01-01T00:00:00Z',
      },
    ]

    vi.mocked(leaderboardApi.getLeaderboard).mockResolvedValue(mockData)

    const { result } = renderHook(
      () => useLeaderboard({ sharedListId: 'list-123', enabled: true }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual(mockData)
    expect(leaderboardApi.getLeaderboard).toHaveBeenCalledWith('list-123')
  })

  it('handles opt-in toggle with optimistic updates', async () => {
    const mockData = [
      {
        userId: 'user-123',
        user: { id: 'user-123', email: 'test@example.com' },
        score: 100,
        wordsLearned: 5,
        totalWords: 10,
        isOptedIn: false,
        lastUpdated: '2024-01-01T00:00:00Z',
      },
    ]

    vi.mocked(leaderboardApi.getLeaderboard).mockResolvedValue(mockData)
    vi.mocked(leaderboardApi.toggleLeaderboardOptIn).mockResolvedValue()

    const { result } = renderHook(
      () => useLeaderboard({ sharedListId: 'list-123', enabled: true }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Initially opted out
    expect(result.current.data?.[0].isOptedIn).toBe(false)

    // Toggle to opt in
    result.current.toggleOptIn.mutate(true)

    await waitFor(() => {
      expect(result.current.toggleOptIn.isPending).toBe(true)
    })

    // Should optimistically update
    expect(result.current.data?.[0].isOptedIn).toBe(true)
    expect(result.current.data?.[0].score).toBe(100) // Score should remain when opting in
  })

  it('handles errors gracefully', async () => {
    const errorMessage = 'Failed to fetch leaderboard'
    vi.mocked(leaderboardApi.getLeaderboard).mockRejectedValue(new Error(errorMessage))

    const { result } = renderHook(
      () => useLeaderboard({ sharedListId: 'list-123', enabled: true }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error?.message).toBe(errorMessage)
    expect(result.current.data).toBeUndefined()
  })

  it('does not fetch when disabled', () => {
    renderHook(() => useLeaderboard({ sharedListId: 'list-123', enabled: false }), { wrapper })

    expect(leaderboardApi.getLeaderboard).not.toHaveBeenCalled()
  })
})
