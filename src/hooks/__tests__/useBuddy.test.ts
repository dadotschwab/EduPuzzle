import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient } from '@tanstack/react-query'
import { useBuddy } from '../useBuddy'
import { getBuddyStatus, generateBuddyInvite, removeBuddy } from '@/lib/api/buddy'

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
      removeChannel: vi.fn(),
    })),
    removeChannel: vi.fn(),
  },
}))

vi.mock('../useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/lib/api/buddy', () => ({
  getBuddyStatus: vi.fn(),
  generateBuddyInvite: vi.fn(),
  removeBuddy: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('useBuddy', () => {
  let queryClient: QueryClient
  let mockUseAuth: any

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    mockUseAuth = vi.mocked(require('../useAuth').useAuth)
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1' },
      isAuthenticated: true,
      loading: false,
    })

    vi.clearAllMocks()
  })

  afterEach(() => {
    queryClient.clear()
  })

  it('should return default state when no buddy exists', async () => {
    (getBuddyStatus as any).mockResolvedValue({
      buddyName: null,
      hasLearnedToday: false,
      completionPercentage: 0,
    })

    const { result } = renderHook(() => useBuddy())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.hasBuddy).toBe(false)
    expect(result.current.buddyName).toBe(null)
    expect(result.current.buddyHasLearnedToday).toBe(false)
    expect(result.current.buddyCompletionPercentage).toBe(0)
  })

  it('should return buddy data when buddy exists', async () => {
    (getBuddyStatus as any).mockResolvedValue({
      buddyName: 'John Doe',
      hasLearnedToday: true,
      completionPercentage: 75,
    })

    const { result } = renderHook(() => useBuddy())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.hasBuddy).toBe(true)
    expect(result.current.buddyName).toBe('John Doe')
    expect(result.current.buddyHasLearnedToday).toBe(true)
    expect(result.current.buddyCompletionPercentage).toBe(75)
  })

  it('should handle generate invite mutation', async () => {
    (getBuddyStatus as any).mockResolvedValue({
      buddyName: null,
      hasLearnedToday: false,
      completionPercentage: 0,
    })
    ;(generateBuddyInvite as any).mockResolvedValue({
      inviteToken: 'abc123',
      expiresAt: '2024-01-01T00:00:00Z',
    })

    const { result } = renderHook(() => useBuddy())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    result.current.generateInvite()

    await waitFor(() => {
      expect(result.current.isGeneratingInvite).toBe(false)
    })

    expect(generateBuddyInvite).toHaveBeenCalled()
  })

  it('should handle remove buddy mutation', async () => {
    (getBuddyStatus as any).mockResolvedValue({
      buddyName: 'John Doe',
      hasLearnedToday: true,
      completionPercentage: 75,
    })
    ;(removeBuddy as any).mockResolvedValue(undefined)

    const { result } = renderHook(() => useBuddy())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    result.current.removeBuddy()

    await waitFor(() => {
      expect(result.current.isRemovingBuddy).toBe(false)
    })

    expect(removeBuddy).toHaveBeenCalled()
  })

  it('should not fetch when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      loading: false,
    })

    renderHook(() => useBuddy())

    expect(getBuddyStatus).not.toHaveBeenCalled()
  })

  it('should not fetch when auth is loading', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1' },
      isAuthenticated: true,
      loading: true,
    })

    renderHook(() => useBuddy())

    expect(getBuddyStatus).not.toHaveBeenCalled()
  })
})
