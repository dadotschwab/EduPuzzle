import { useCallback, useEffect, useRef } from 'react'

export function useTimer() {
  const timersRef = useRef<Set<number>>(new Set())
  const intervalsRef = useRef<Set<number>>(new Set())

  const setTimeout = useCallback((callback: () => void, delay: number) => {
    const id = window.setTimeout(() => {
      timersRef.current.delete(id)
      callback()
    }, delay)

    timersRef.current.add(id)
    return id
  }, [])

  const clearTimeout = useCallback((id: number) => {
    window.clearTimeout(id)
    timersRef.current.delete(id)
  }, [])

  const setInterval = useCallback((callback: () => void, delay: number) => {
    const id = window.setInterval(callback, delay)
    intervalsRef.current.add(id)
    return id
  }, [])

  const clearInterval = useCallback((id: number) => {
    window.clearInterval(id)
    intervalsRef.current.delete(id)
  }, [])

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id))
      intervalsRef.current.forEach((id) => window.clearInterval(id))
      timersRef.current.clear()
      intervalsRef.current.clear()
    }
  }, [])

  return {
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
  }
}
