/**
 * @fileoverview Crossword puzzle solver page
 *
 * Provides the interactive crossword solving interface with:
 * - Responsive grid that adapts to puzzle size
 * - Clues panel with controls
 * - Keyboard navigation
 * - Check/hint functionality
 *
 * Used for both daily puzzles and list-based puzzles.
 *
 * @module pages/PuzzleSolver
 */

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { PuzzleGrid } from '@/components/puzzle/PuzzleGrid'
import { PuzzleClues } from '@/components/puzzle/PuzzleClues'
import { PuzzleCompletionCard } from '@/components/puzzle/PuzzleCompletionCard'
import { PuzzleHelpDialog } from '@/components/puzzle/PuzzleHelpDialog'
import {
  PuzzleLoadingState,
  PuzzleErrorState,
  PuzzleNotLoadedState,
} from '@/components/puzzle/PuzzlePageStates'
import { Button } from '@/components/ui/button'
import { HelpCircle } from 'lucide-react'
import { usePuzzleGeneration, useCurrentPuzzle } from '@/hooks/usePuzzleGeneration'
import { usePuzzleSolver } from '@/hooks/usePuzzleSolver'

/**
 * Main puzzle solver page component
 */
export function PuzzleSolver() {
  const { listId } = useParams<{ listId: string }>()
  const navigate = useNavigate()

  // Generate puzzle from database words (30 random words)
  const { data: allPuzzles, isLoading, error } = usePuzzleGeneration(listId || '', 30, !!listId)

  // Track which puzzle we're showing
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0)
  const puzzle = useCurrentPuzzle(allPuzzles, currentPuzzleIndex)

  // Track help dialog visibility
  const [helpDialogOpen, setHelpDialogOpen] = useState(false)

  // Use shared puzzle solver logic
  const solver = usePuzzleSolver(puzzle)

  /**
   * Advances to next puzzle or returns to dashboard
   */
  const handleNextPuzzle = () => {
    if (allPuzzles && currentPuzzleIndex < allPuzzles.length - 1) {
      setCurrentPuzzleIndex(prev => prev + 1)
      solver.resetPuzzle()
    } else {
      navigate('/app/dashboard')
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <AppLayout>
        <PuzzleLoadingState message="Generating your puzzle..." />
      </AppLayout>
    )
  }

  // Error state
  if (error) {
    return (
      <AppLayout>
        <PuzzleErrorState
          title="Failed to Generate Puzzle"
          message={error instanceof Error ? error.message : 'An unexpected error occurred'}
          showCreateButton={false}
        />
      </AppLayout>
    )
  }

  // No puzzle state
  if (!puzzle) {
    return (
      <AppLayout>
        <PuzzleNotLoadedState />
      </AppLayout>
    )
  }

  // At this point, puzzle is guaranteed to be non-null
  const stats = solver.getPuzzleStats()
  const isLastPuzzle = !allPuzzles || currentPuzzleIndex >= allPuzzles.length - 1

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 min-h-[calc(100vh-4rem)] flex flex-col justify-center">
        {/* Main Puzzle Layout - Grid on Left, Clues/Results on Right */}
        <div className="grid lg:grid-cols-[1.2fr,1fr] gap-8">
          {/* Left: Puzzle Grid */}
          <div className="flex items-start justify-center">
            <PuzzleGrid
              puzzle={puzzle}
              userInput={solver.userInput}
              onCellChange={solver.handleCellChange}
              selectedWord={solver.selectedWord}
              onWordSelect={solver.setSelectedWord}
              onFocusedCellChange={solver.setFocusedCell}
              focusedCell={solver.focusedCell}
              checkedWords={solver.checkedWords}
              isPuzzleCompleted={solver.isPuzzleCompleted}
              showCorrectAnswers={solver.showCorrectAnswers}
            />
          </div>

          {/* Right: Clues/Controls or Completion Stats */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            {/* Title with Help Icon */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Crossword Puzzle</h1>
                <button
                  onClick={() => setHelpDialogOpen(true)}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Show puzzle controls help"
                >
                  <HelpCircle className="w-5 h-5 text-gray-500 hover:text-blue-600" />
                </button>
              </div>
              {allPuzzles && allPuzzles.length > 1 && (
                <p className="text-sm text-muted-foreground mt-1">
                  Puzzle {currentPuzzleIndex + 1} of {allPuzzles.length}
                </p>
              )}
            </div>

            {!solver.isPuzzleCompleted ? (
              <PuzzleClues
                placedWords={puzzle.placedWords}
                selectedWord={solver.selectedWord}
                onWordSelect={solver.setSelectedWord}
                onCheckPuzzle={solver.handleCheckPuzzle}
                onEndPuzzle={() => solver.handleEndPuzzle()}
                onGiveHint={solver.handleGiveHint}
                hintsRemaining={solver.hintsRemaining}
                checkedWords={solver.checkedWords}
                onFocusFirstCell={(word) => solver.setFocusedCell({ x: word.x, y: word.y })}
              />
            ) : (
              <div className="space-y-4">
                {/* Dashboard Button */}
                <Button
                  onClick={() => navigate('/app/dashboard')}
                  variant="outline"
                  className="w-full"
                >
                  Back to Dashboard
                </Button>

                {/* Completion Card */}
                <PuzzleCompletionCard
                  stats={stats}
                  showCorrectAnswers={solver.showCorrectAnswers}
                  onToggleAnswersView={solver.setShowCorrectAnswers}
                  onNext={handleNextPuzzle}
                  nextButtonLabel={isLastPuzzle ? 'Back to Dashboard' : 'Next Puzzle'}
                  showNextButton={!isLastPuzzle}
                />
              </div>
            )}
          </div>
        </div>

        {/* Help Dialog */}
        <PuzzleHelpDialog open={helpDialogOpen} onOpenChange={setHelpDialogOpen} />
      </div>
    </AppLayout>
  )
}
