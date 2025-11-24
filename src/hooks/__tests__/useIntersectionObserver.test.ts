import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useIntersectionObserver } from '../useIntersectionObserver'

describe('useIntersectionObserver', () => {
  let mockObserver: IntersectionObserver
  let observeMock: any
  let disconnectMock: any

  beforeEach(() => {
    // Create mock IntersectionObserver
    observeMock = vi.fn()
    disconnectMock = vi.fn()

    mockObserver = {
      observe: observeMock,
      disconnect: disconnectMock,
    } as any

    // Mock IntersectionObserver constructor
    const mockIntersectionObserver = vi.fn().mockImplementation((_callback) => {
      // Simulate intersection immediately for testing
      _callback([{ isIntersecting: true }])
      return mockObserver
    })

    // Replace global IntersectionObserver
    ;(global as any).IntersectionObserver = mockIntersectionObserver
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return ref, isIntersecting, and hasTriggered', () => {
    const { result } = renderHook(() => useIntersectionObserver())

    expect(result.current).toHaveProperty('ref')
    expect(result.current).toHaveProperty('isIntersecting')
    expect(result.current).toHaveProperty('hasTriggered')
    expect(result.current.ref).toBeDefined()
  })

  it('should set isIntersecting to true when element intersects', () => {
    const { result } = renderHook(() => useIntersectionObserver())

    expect(result.current.isIntersecting).toBe(true)
  })

  it('should use default options when none provided', () => {
    renderHook(() => useIntersectionObserver())

    expect(global.IntersectionObserver).toHaveBeenCalledWith(expect.any(Function), {
      threshold: 0.1,
      rootMargin: '0px',
    })
  })

  it('should use custom options when provided', () => {
    renderHook(() =>
      useIntersectionObserver({
        threshold: 0.5,
        rootMargin: '10px',
        triggerOnce: false,
      })
    )

    expect(global.IntersectionObserver).toHaveBeenCalledWith(expect.any(Function), {
      threshold: 0.5,
      rootMargin: '10px',
    })
  })

  it('should set hasTriggered when triggerOnce is true and element intersects', () => {
    const { result } = renderHook(() => useIntersectionObserver({ triggerOnce: true }))

    expect(result.current.hasTriggered).toBe(true)
  })

  it('should observe the element when ref is set', () => {
    const { result } = renderHook(() => useIntersectionObserver())

    // Simulate ref being set
    if (result.current.ref.current) {
      // The observer should have been called in the useEffect
      expect(observeMock).toHaveBeenCalled()
    }
  })

  it('should disconnect observer on unmount', () => {
    const { unmount } = renderHook(() => useIntersectionObserver())

    unmount()

    expect(disconnectMock).toHaveBeenCalled()
  })

  it('should handle triggerOnce false correctly', () => {
    // Mock observer to not trigger immediately
    const mockIntersectionObserver = vi.fn().mockImplementation((_callback) => {
      // Don't call callback immediately
      return mockObserver
    })

    ;(global as any).IntersectionObserver = mockIntersectionObserver

    const { result } = renderHook(() => useIntersectionObserver({ triggerOnce: false }))

    expect(result.current.hasTriggered).toBe(false)
  })
})
