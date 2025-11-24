import { useCallback, useRef } from 'react'

interface QueuedOperation<T = any> {
  id: string
  operation: () => Promise<T>
  resolve: (value: T) => void
  reject: (error: any) => void
}

export function useSequentialOperations() {
  const queueRef = useRef<QueuedOperation[]>([])
  const processingRef = useRef(false)

  const addToQueue = useCallback(<T>(operation: () => Promise<T>, id?: string): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      const operationId = id || crypto.randomUUID()

      queueRef.current.push({
        id: operationId,
        operation,
        resolve,
        reject,
      })

      processQueue()
    })
  }, [])

  const processQueue = useCallback(async () => {
    if (processingRef.current || queueRef.current.length === 0) return

    processingRef.current = true

    while (queueRef.current.length > 0) {
      const { operation, resolve, reject } = queueRef.current.shift()!

      try {
        const result = await operation()
        resolve(result)
      } catch (error) {
        reject(error)
      }
    }

    processingRef.current = false
  }, [])

  const clearQueue = useCallback(() => {
    // Reject all pending operations
    queueRef.current.forEach(({ reject }) => {
      reject(new Error('Operation cancelled'))
    })
    queueRef.current = []
  }, [])

  return { addToQueue, clearQueue }
}
