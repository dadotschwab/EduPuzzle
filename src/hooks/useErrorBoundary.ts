import { useCallback, useState } from 'react'

interface ErrorBoundaryState {
  error: Error | null
  hasError: boolean
}

export function useErrorBoundary() {
  const [state, setState] = useState<ErrorBoundaryState>({
    error: null,
    hasError: false,
  })

  const resetError = useCallback(() => {
    setState({ error: null, hasError: false })
  }, [])

  const captureError = useCallback((error: Error) => {
    setState({ error, hasError: true })
  }, [])

  return {
    error: state.error,
    hasError: state.hasError,
    resetError,
    captureError,
  }
}
