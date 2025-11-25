import { describe, it, expect, vi } from 'vitest'
import {
  BuddyApiError,
  getBuddyStatus,
  generateBuddyInvite,
  acceptBuddyInvite,
  removeBuddy,
} from './buddy'
import { supabase } from '@/lib/supabase'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}))

describe('BuddyApiError', () => {
  it('should create error with message and status code', () => {
    const error = new BuddyApiError('Test error', 400)
    expect(error.message).toBe('Test error')
    expect(error.statusCode).toBe(400)
    expect(error.name).toBe('BuddyApiError')
  })
})

describe('getBuddyStatus', () => {
  it('should return buddy data when successful', async () => {
    const mockData = [
      {
        buddy_name: 'John Doe',
        has_learned_today: true,
        completion_percentage: 75,
      },
    ]

    ;(supabase.rpc as any).mockResolvedValueOnce({
      data: mockData,
      error: null,
    })

    const result = await getBuddyStatus()
    expect(result).toEqual({
      buddyName: 'John Doe',
      hasLearnedToday: true,
      completionPercentage: 75,
    })
  })

  it('should return default data when no buddy exists', async () => {
    (supabase.rpc as any).mockResolvedValueOnce({
      data: [],
      error: null,
    })

    const result = await getBuddyStatus()
    expect(result).toEqual({
      buddyName: null,
      hasLearnedToday: false,
      completionPercentage: 0,
    })
  })

  it('should throw BuddyApiError on database error', async () => {
    (supabase.rpc as any).mockResolvedValueOnce({
      data: null,
      error: { message: 'Database error', code: 'PGRST116' },
    })

    await expect(getBuddyStatus()).rejects.toThrow(BuddyApiError)
  })
})

describe('generateBuddyInvite', () => {
  it('should return invite token and expiry when successful', async () => {
    const mockData = [
      {
        invite_token: 'abc123',
        expires_at: '2024-01-01T00:00:00Z',
      },
    ]

    ;(supabase.rpc as any).mockResolvedValueOnce({
      data: mockData,
      error: null,
    })

    const result = await generateBuddyInvite()
    expect(result).toEqual({
      inviteToken: 'abc123',
      expiresAt: '2024-01-01T00:00:00Z',
    })
  })

  it('should throw BuddyApiError on error', async () => {
    (supabase.rpc as any).mockResolvedValueOnce({
      data: null,
      error: { message: 'Already has buddy', code: 'PGRST116' },
    })

    await expect(generateBuddyInvite()).rejects.toThrow(BuddyApiError)
  })
})

describe('acceptBuddyInvite', () => {
  it('should complete successfully when valid token', async () => {
    (supabase.rpc as any).mockResolvedValueOnce({
      error: null,
    })

    await expect(acceptBuddyInvite('valid-token')).resolves.toBeUndefined()
  })

  it('should throw BuddyApiError on invalid token', async () => {
    (supabase.rpc as any).mockResolvedValueOnce({
      error: { message: 'Invalid token', code: 'PGRST116' },
    })

    await expect(acceptBuddyInvite('invalid-token')).rejects.toThrow(BuddyApiError)
  })
})

describe('removeBuddy', () => {
  it('should complete successfully', async () => {
    (supabase.rpc as any).mockResolvedValueOnce({
      error: null,
    })

    await expect(removeBuddy()).resolves.toBeUndefined()
  })

  it('should throw BuddyApiError on error', async () => {
    (supabase.rpc as any).mockResolvedValueOnce({
      error: { message: 'Removal failed', code: 'PGRST116' },
    })

    await expect(removeBuddy()).rejects.toThrow(BuddyApiError)
  })
})
