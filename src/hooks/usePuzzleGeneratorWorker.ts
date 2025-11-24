import { useCallback, useEffect, useRef, useState } from 'react'
import type { GenerationConfig } from '@/lib/algorithms/types'
import type { Word, Puzzle } from '@/types'

interface WorkerMessage {
  id: string
  type: 'ready' | 'progress' | 'complete' | 'error' | 'cancelled'
  payload: any
}

interface GenerationProgress {
  stage: string
  percent: number
  message?: string
}

interface UsePuzzleWorkerReturn {
  generatePuzzles: (words: Word[], config?: Partial<GenerationConfig>) => Promise<Puzzle[]>
  cancelGeneration: () => void
  isGenerating: boolean
  progress: GenerationProgress | null
  error: string | null
  isWorkerReady: boolean
}

export function usePuzzleGeneratorWorker(): UsePuzzleWorkerReturn {
  const [isWorkerReady, setIsWorkerReady] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState<GenerationProgress | null>(null)
  const [error, setError] = useState<string | null>(null)

  const workerRef = useRef<Worker | null>(null)
  const currentGenerationId = useRef<string | null>(null)

  useEffect(() => {
    // Create worker
    const worker = new Worker(new URL('../workers/puzzleGenerator.worker.ts', import.meta.url), {
      type: 'module',
    })

    workerRef.current = worker

    // Handle messages from worker
    const handleMessage = (e: MessageEvent<WorkerMessage>) => {
      const { id, type, payload } = e.data

      // Only process messages for current generation
      if (id && id !== currentGenerationId.current) return

      switch (type) {
        case 'ready':
          setIsWorkerReady(true)
          break

        case 'progress':
          setProgress(payload)
          break

        case 'complete':
          setIsGenerating(false)
          setProgress(null)
          setError(null)
          currentGenerationId.current = null
          break

        case 'error':
          setIsGenerating(false)
          setProgress(null)
          setError(payload.message)
          currentGenerationId.current = null
          break

        case 'cancelled':
          setIsGenerating(false)
          setProgress(null)
          setError(null)
          currentGenerationId.current = null
          break
      }
    }

    // Handle worker errors
    const handleError = (e: ErrorEvent) => {
      console.error('Puzzle worker error:', e)
      setError('Worker failed to process puzzle generation')
      setIsGenerating(false)
      setProgress(null)
      currentGenerationId.current = null
    }

    worker.addEventListener('message', handleMessage)
    worker.addEventListener('error', handleError)

    // Cleanup
    return () => {
      worker.removeEventListener('message', handleMessage)
      worker.removeEventListener('error', handleError)
      worker.terminate()
      workerRef.current = null
    }
  }, [])

  const generatePuzzles = useCallback(
    async (words: Word[], config: Partial<GenerationConfig> = {}): Promise<Puzzle[]> => {
      if (!workerRef.current || !isWorkerReady) {
        throw new Error('Puzzle worker not ready')
      }

      if (isGenerating) {
        throw new Error('Puzzle generation already in progress')
      }

      return new Promise((resolve, reject) => {
        const generationId = crypto.randomUUID()
        currentGenerationId.current = generationId

        setIsGenerating(true)
        setError(null)
        setProgress({ stage: 'starting', percent: 0 })

        // Set up one-time message handler for this generation
        const handleResult = (e: MessageEvent<WorkerMessage>) => {
          const { id, type, payload } = e.data

          if (id !== generationId) return

          if (type === 'complete') {
            workerRef.current?.removeEventListener('message', handleResult)
            resolve(payload)
          } else if (type === 'error') {
            workerRef.current?.removeEventListener('message', handleResult)
            reject(new Error(payload.message))
          }
        }

        if (workerRef.current) {
          workerRef.current.addEventListener('message', handleResult)

          // Send generation request
          workerRef.current.postMessage({
            id: generationId,
            type: 'generate',
            payload: { words, config },
          })
        }
      })
    },
    [isWorkerReady, isGenerating]
  )

  const cancelGeneration = useCallback(() => {
    if (workerRef.current && currentGenerationId.current) {
      workerRef.current.postMessage({
        id: currentGenerationId.current,
        type: 'cancel',
      })
    }
  }, [])

  return {
    generatePuzzles,
    cancelGeneration,
    isGenerating,
    progress,
    error,
    isWorkerReady,
  }
}
