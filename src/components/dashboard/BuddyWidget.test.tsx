import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BuddyWidget } from './BuddyWidget'
import { useBuddy } from '@/hooks/useBuddy'

// Mock the hook
vi.mock('@/hooks/useBuddy', () => ({
  useBuddy: vi.fn(),
}))

describe('BuddyWidget', () => {
  const mockUseBuddy = vi.mocked(useBuddy)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show loading state', () => {
    mockUseBuddy.mockReturnValue({
      hasBuddy: false,
      buddyName: null,
      buddyHasLearnedToday: false,
      isLoading: true,
      error: null,
      isGeneratingInvite: false,
    } as any)

    render(<BuddyWidget />)

    expect(screen.getByText('Buddy Status')).toBeInTheDocument()
  })

  it('should show error state', () => {
    mockUseBuddy.mockReturnValue({
      hasBuddy: false,
      buddyName: null,
      buddyHasLearnedToday: false,
      isLoading: false,
      error: new Error('Network error'),
      isGeneratingInvite: false,
    } as any)

    render(<BuddyWidget />)

    expect(screen.getByText('Unable to load')).toBeInTheDocument()
    expect(screen.getByText('Check your connection')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })

  it('should show "no buddy" state', () => {
    mockUseBuddy.mockReturnValue({
      hasBuddy: false,
      buddyName: null,
      buddyHasLearnedToday: false,
      isLoading: false,
      error: null,
      isGeneratingInvite: false,
    } as any)

    render(<BuddyWidget />)

    expect(screen.getByText('Learning Buddy')).toBeInTheDocument()
    expect(screen.getByText('Find a buddy')).toBeInTheDocument()
    expect(screen.getByText('Share progress and stay motivated')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Find Buddy' })).toBeInTheDocument()
  })

  it('should show buddy information when buddy exists and has learned today', () => {
    mockUseBuddy.mockReturnValue({
      hasBuddy: true,
      buddyName: 'John Doe',
      buddyHasLearnedToday: true,
      isLoading: false,
      error: null,
      isGeneratingInvite: false,
    } as any)

    render(<BuddyWidget />)

    expect(screen.getByText('Your Buddy')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('✅ Learned today!')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Manage' })).toBeInTheDocument()
  })

  it('should show buddy information when buddy exists but has not learned today', () => {
    mockUseBuddy.mockReturnValue({
      hasBuddy: true,
      buddyName: 'Jane Smith',
      buddyHasLearnedToday: false,
      isLoading: false,
      error: null,
      isGeneratingInvite: false,
    } as any)

    render(<BuddyWidget />)

    expect(screen.getByText('Your Buddy')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('⏳ Not yet today')).toBeInTheDocument()
  })

  it('should disable button when generating invite', () => {
    mockUseBuddy.mockReturnValue({
      hasBuddy: false,
      buddyName: null,
      buddyHasLearnedToday: false,
      isLoading: false,
      error: null,
      isGeneratingInvite: true,
    } as any)

    render(<BuddyWidget />)

    const button = screen.getByRole('button', { name: 'Find Buddy' })
    expect(button).toBeDisabled()
  })
})
