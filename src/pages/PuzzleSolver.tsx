import { useParams } from 'react-router-dom'

export function PuzzleSolver() {
  const { sessionId } = useParams<{ sessionId: string }>()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-6">Puzzle Solver</h1>
      <p className="text-gray-600">Session ID: {sessionId}</p>
    </div>
  )
}
