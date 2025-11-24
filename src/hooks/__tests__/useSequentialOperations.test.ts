import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSequentialOperations } from '../useSequentialOperations'

describe('useSequentialOperations', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should process operations sequentially', async () => {
    const { result } = renderHook(() => useSequentialOperations())

    const operations: string[] = []
    const delays = [100, 50, 25]

    const promises = delays.map((delay, index) =>
      result.current.addToQueue(async () => {
        await new Promise((resolve) => setTimeout(resolve, delay))
        operations.push(`op${index}`)
        return `result${index}`
      })
    )

    // Fast-forward timers
    await act(async () => {
      vi.advanceTimersByTime(200)
    })

    const results = await Promise.all(promises)

    expect(operations).toEqual(['op0', 'op1', 'op2'])
    expect(results).toEqual(['result0', 'result1', 'result2'])
  })

  it('should handle operation failures gracefully', async () => {
    const { result } = renderHook(() => useSequentialOperations())

    const mockError = new Error('Operation failed')

    await expect(
      result.current.addToQueue(async () => {
        throw mockError
      })
    ).rejects.toThrow('Operation failed')
  })

  it('should clear queue on demand', async () => {
    const { result } = renderHook(() => useSequentialOperations())

    let completed = false

    const promise = result.current.addToQueue(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
      completed = true
      return 'done'
    })

    // Clear queue before completion
    act(() => {
      result.current.clearQueue()
    })

    await expect(promise).rejects.toThrow('Operation cancelled')
    expect(completed).toBe(false)
  })
})
