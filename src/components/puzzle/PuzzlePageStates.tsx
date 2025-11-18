/**
 * @fileoverview Common UI states for puzzle pages
 *
 * Provides reusable loading, error, and empty state components
 * used by both TodaysPuzzles and PuzzleSolver pages.
 *
 * @module components/puzzle/PuzzlePageStates
 */

import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle, Calendar } from 'lucide-react'

/**
 * Loading state component for puzzle generation
 */
export function PuzzleLoadingState({ message = 'Generating your puzzles...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-600" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  )
}

/**
 * Error state component for puzzle loading failures
 */
export function PuzzleErrorState({
  title = 'Error Loading Puzzles',
  message,
  showCreateButton = true,
}: {
  title?: string
  message?: string
  showCreateButton?: boolean
}) {
  const navigate = useNavigate()

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-6 h-6" />
            <CardTitle>{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {message ? (
            <p className="text-gray-700">{message}</p>
          ) : (
            <>
              <p className="text-gray-700">
                We couldn't generate your puzzles. This might be because:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>You don't have any word lists yet</li>
                <li>Your word lists don't have enough words (minimum 10 required)</li>
                <li>There was a connection issue</li>
              </ul>
            </>
          )}
          <div className="flex gap-4 pt-4">
            <Button onClick={() => navigate('/app/dashboard')}>
              Back to Dashboard
            </Button>
            {showCreateButton && (
              <Button variant="outline" onClick={() => navigate('/app/words')}>
                Create Word List
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Empty state component when no puzzles are available
 */
export function PuzzleEmptyState({
  title = 'No Puzzles Available',
  message,
  showTip = true,
}: {
  title?: string
  message?: string
  showTip?: boolean
}) {
  const navigate = useNavigate()

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-blue-600">
            <Calendar className="w-6 h-6" />
            <CardTitle>{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <p className="text-gray-700">{message}</p>
          )}
          {showTip && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                💡 <strong>Tip:</strong> Add more words to your lists or come back tomorrow!
              </p>
            </div>
          )}
          <div className="flex gap-4 pt-4">
            <Button onClick={() => navigate('/app/dashboard')}>
              Back to Dashboard
            </Button>
            <Button variant="outline" onClick={() => navigate('/app/words')}>
              Manage Word Lists
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * No current puzzle loaded state
 */
export function PuzzleNotLoadedState() {
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-orange-600" />
        <p className="text-gray-600">Unable to load puzzle. Please try again.</p>
        <Button className="mt-4" onClick={() => navigate('/app/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  )
}
