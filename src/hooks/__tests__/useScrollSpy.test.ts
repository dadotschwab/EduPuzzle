import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useScrollSpy } from '../useScrollSpy'

describe('useScrollSpy', () => {
  let mockElement: HTMLElement

  beforeEach(() => {
    // Create a mock element
    mockElement = document.createElement('div')
    mockElement.id = 'test-section'
    mockElement.getBoundingClientRect = vi.fn(() => ({
      top: 100,
      left: 0,
      right: 100,
      bottom: 200,
      width: 100,
      height: 100,
      x: 0,
      y: 100,
      toJSON: () => ({}),
    }))
    Object.defineProperty(mockElement, 'offsetTop', { value: 100 })
    Object.defineProperty(mockElement, 'offsetHeight', { value: 100 })

    // Mock getElementById
    vi.spyOn(document, 'getElementById').mockImplementation((id) => {
      if (id === 'test-section') return mockElement
      return null
    })

    // Mock window.scrollY
    Object.defineProperty(window, 'scrollY', { value: 150, writable: true })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return activeSection and scrollToSection function', () => {
    const { result } = renderHook(() => useScrollSpy({ sectionIds: ['test-section'], offset: 50 }))

    expect(result.current).toHaveProperty('activeSection')
    expect(result.current).toHaveProperty('scrollToSection')
    expect(typeof result.current.scrollToSection).toBe('function')
  })

  it('should detect active section based on scroll position', () => {
    const { result } = renderHook(() => useScrollSpy({ sectionIds: ['test-section'], offset: 50 }))

    // Initial check should set active section
    expect(result.current.activeSection).toBe('test-section')
  })

  it('should call scrollIntoView when scrollToSection is called', () => {
    const mockScrollIntoView = vi.fn()
    mockElement.scrollIntoView = mockScrollIntoView

    const { result } = renderHook(() => useScrollSpy({ sectionIds: ['test-section'] }))

    act(() => {
      result.current.scrollToSection('test-section')
    })

    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' })
  })

  it('should handle non-existent section gracefully', () => {
    const { result } = renderHook(() => useScrollSpy({ sectionIds: ['non-existent'] }))

    act(() => {
      result.current.scrollToSection('non-existent')
    })

    // Should not throw error
    expect(result.current.activeSection).toBe('')
  })

  it('should use custom offset', () => {
    const { result } = renderHook(() => useScrollSpy({ sectionIds: ['test-section'], offset: 200 }))

    // With offset 200, scroll position 150 + 200 = 350
    // Section is at 100-200, so should not be active
    expect(result.current.activeSection).toBe('')
  })
})
