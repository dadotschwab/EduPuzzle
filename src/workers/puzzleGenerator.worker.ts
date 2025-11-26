import { generatePuzzles } from '@/lib/algorithms/generator'
import type { GenerationConfig } from '@/lib/algorithms/types'
import type { Word, Puzzle } from '@/types'

interface WorkerMessage {
  id: string
  type: 'generate' | 'cancel'
  payload: any
}

interface ProgressUpdate {
  stage: string
  percent: number
  message?: string
}

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const { id, type, payload } = e.data

  if (type === 'generate') {
    const { words, config }: { words: Word[]; config: Partial<GenerationConfig> } = payload

    try {
      // Report initial progress
      self.postMessage({
        id,
        type: 'progress',
        payload: { stage: 'initializing', percent: 0 } as ProgressUpdate,
      })

      // Report clustering progress
      self.postMessage({
        id,
        type: 'progress',
        payload: { stage: 'clustering', percent: 25 } as ProgressUpdate,
      })

      // Generate puzzles (this is the heavy computation)
      const puzzles = await generatePuzzles(words, config, (progress) => {
        self.postMessage({
          id,
          type: 'progress',
          payload: progress,
        })
      })

      // Report completion progress
      self.postMessage({
        id,
        type: 'progress',
        payload: { stage: 'finalizing', percent: 100 } as ProgressUpdate,
      })

      // Send completion result
      self.postMessage({
        id,
        type: 'complete',
        payload: puzzles as Puzzle[],
      })
    } catch (error) {
      // Send error back to main thread
      self.postMessage({
        id,
        type: 'error',
        payload: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        },
      })
    }
  }

  if (type === 'cancel') {
    // Cancel ongoing generation (if supported by generator)
    // This would require the generator to support cancellation tokens
    self.postMessage({
      id,
      type: 'cancelled',
    })
  }
}

// Signal worker is ready
// Use setTimeout to ensure the message is sent after the event listener is attached
setTimeout(() => {
  self.postMessage({ type: 'ready' })
}, 0)
