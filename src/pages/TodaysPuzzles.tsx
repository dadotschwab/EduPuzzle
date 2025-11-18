/**
 * @fileoverview Today's Puzzles page - SRS-based crossword solving
 *
 * Generates puzzles from words due for review today using smart grouping:
 * - Fetches due words across all user's lists
 * - Groups by language pair with hybrid strategy
 * - Updates SRS progress after completion
 *
 * @module pages/TodaysPuzzles
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { AppLayout } from '@/components/layout/AppLayout'
import { PuzzleGrid } from '@/components/puzzle/PuzzleGrid'
import { PuzzleClues } from '@/components/puzzle/PuzzleClues'
import { PuzzleCompletionCard } from '@/components/puzzle/PuzzleCompletionCard'
import { PuzzleHelpDialog } from '@/components/puzzle/PuzzleHelpDialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle, Calendar, HelpCircle } from 'lucide-react'
import { useTodaysPuzzles, useCompletePuzzle, useCurrentPuzzle } from '@/hooks/useTodaysPuzzles'
import { usePuzzleSolver } from '@/hooks/usePuzzleSolver'
import {
  markPuzzleCompleted,
  getFirstUncompletedPuzzleIndex,
} from '@/lib/utils/puzzleProgress'

/**
 * Today's Puzzles page component - SRS-driven puzzle practice
 */
export function TodaysPuzzles() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Fetch today's due words and generate puzzles
  const { data: puzzleData, isLoading, error } = useTodaysPuzzles()
  const completePuzzle = useCompletePuzzle()

  // Track which puzzle we're showing
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0)
  const puzzle = useCurrentPuzzle(puzzleData?.puzzles ?? undefined, currentPuzzleIndex)

  // Use shared puzzle solver logic
  const solver = usePuzzleSolver(puzzle)

  // Track if this is the initial data load to prevent auto-advancing
  const isInitialLoadRef = useRef(true)

  // Track if we need to invalidate todaysPuzzles on unmount (when user navigates away)
  const hasPendingInvalidationRef = useRef(false)

  // Track total words practiced in this session (across multiple batches)
  // Persisted in localStorage to maintain progress across dashboard visits
  const [sessionWordsPracticed, setSessionWordsPracticed] = useState(() => {
    const today = new Date().toISOString().split('T')[0]
    const stored = localStorage.getItem(`session_progress_${today}`)
    return stored ? parseInt(stored, 10) : 0
  })

  // Track words from the batch we just completed (before fetching next batch)
  const [completedBatchWords, setCompletedBatchWords] = useState(0)

  // Track help dialog visibility
  const [helpDialogOpen, setHelpDialogOpen] = useState(false)

  /**
   * Initialize to first uncompleted puzzle ONLY on initial load
   * Don't auto-advance when data refetches after completing a puzzle
   */
  useEffect(() => {
    if (puzzleData?.puzzles && isInitialLoadRef.current) {
      const firstUncompletedIndex = getFirstUncompletedPuzzleIndex(puzzleData.puzzles)
      setCurrentPuzzleIndex(firstUncompletedIndex)
      isInitialLoadRef.current = false

      // If we just loaded new puzzles after "Continue Practicing", update session counter
      if (completedBatchWords > 0) {
        const newTotal = sessionWordsPracticed + completedBatchWords
        setSessionWordsPracticed(newTotal)
        setCompletedBatchWords(0)

        // Persist to localStorage
        const today = new Date().toISOString().split('T')[0]
        localStorage.setItem(`session_progress_${today}`, newTotal.toString())
      }
    }
  }, [puzzleData, sessionWordsPracticed, completedBatchWords])

  /**
   * Persist session progress to localStorage and clean up old sessions
   */
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]

    // Save current progress
    if (sessionWordsPracticed > 0) {
      localStorage.setItem(`session_progress_${today}`, sessionWordsPracticed.toString())
    }

    // Clean up old session progress (keep only today's)
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('session_progress_') && key !== `session_progress_${today}`) {
        localStorage.removeItem(key)
      }
    })
  }, [sessionWordsPracticed])

  /**
   * Cleanup effect: Invalidate todaysPuzzles when navigating away
   * This ensures dashboard badge is updated even if user doesn't click "Continue"
   * (e.g., clicks logo, back button, or closes tab)
   */
  useEffect(() => {
    return () => {
      // On unmount, invalidate todaysPuzzles if we completed any puzzles
      if (hasPendingInvalidationRef.current) {
        queryClient.invalidateQueries({ queryKey: ['todaysPuzzles'] })
      }
    }
  }, [queryClient])

  /**
   * Ends the puzzle, validates all words, and updates SRS progress
   */
  const handleEndPuzzle = () => {
    solver.handleEndPuzzle((validationResults) => {
      if (!puzzle) return

      // Mark this puzzle as completed
      markPuzzleCompleted(puzzle)

      // Update SRS progress for all words in this puzzle
      const srsUpdates = puzzle.placedWords.map(word => ({
        wordId: word.id,
        wasCorrect: validationResults[word.id] === 'correct',
      }))

      completePuzzle.mutate(srsUpdates)

      // Mark that we need to invalidate on unmount (if user navigates away)
      hasPendingInvalidationRef.current = true
    })
  }

  /**
   * Advances to the next puzzle
   */
  const handleNextPuzzle = () => {
    if (!puzzleData?.puzzles || !puzzle) return

    // Mark current puzzle as completed before moving on
    markPuzzleCompleted(puzzle)

    if (currentPuzzleIndex < puzzleData.puzzles.length - 1) {
      // Move to next puzzle in same batch (no need to invalidate)
      setCurrentPuzzleIndex(prev => prev + 1)
      solver.resetPuzzle()
    } else {
      // Last puzzle in batch - count words practiced and persist
      const wordsInBatch = puzzleData.puzzles.reduce((sum, p) => sum + p.placedWords.length, 0)
      const newTotal = sessionWordsPracticed + wordsInBatch
      setSessionWordsPracticed(newTotal)

      // Persist to localStorage
      const today = new Date().toISOString().split('T')[0]
      localStorage.setItem(`session_progress_${today}`, newTotal.toString())

      // Mark that we need to invalidate on unmount
      hasPendingInvalidationRef.current = true

      // All puzzles completed - go back to dashboard
      navigate('/app/dashboard')
    }
  }

  /**
   * Continues practicing with next batch of due words
   */
  const handleContinuePracticing = async () => {
    if (!puzzleData?.puzzles) return

    // Save current batch words count (will be added to session after new puzzles load)
    const wordsInBatch = puzzleData.puzzles.reduce((sum, p) => sum + p.placedWords.length, 0)
    setCompletedBatchWords(wordsInBatch)

    // Invalidate queries to fetch next batch
    await queryClient.invalidateQueries({ queryKey: ['todaysPuzzles'] })
    await queryClient.invalidateQueries({ queryKey: ['dueWordsCount'] })

    // Reset to first puzzle
    setCurrentPuzzleIndex(0)
    isInitialLoadRef.current = true // Allow auto-navigation to first uncompleted
    solver.resetPuzzle()
    hasPendingInvalidationRef.current = false
  }

  // Loading state
  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-600" />
            <p className="text-gray-600">Generating today's puzzles...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  // Error state
  if (error) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto px-4 py-16">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-6 h-6" />
                <CardTitle>Error Loading Puzzles</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                We couldn't generate your puzzles. This might be because:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>You don't have any word lists yet</li>
                <li>Your word lists don't have enough words (minimum 10 required)</li>
                <li>There was a connection issue</li>
              </ul>
              <div className="flex gap-4 pt-4">
                <Button onClick={() => navigate('/app/dashboard')}>
                  Back to Dashboard
                </Button>
                <Button variant="outline" onClick={() => navigate('/app/words')}>
                  Create Word List
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    )
  }

  // No puzzles available (no words due or insufficient words)
  if (!puzzleData?.puzzles || puzzleData.puzzles.length === 0) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto px-4 py-16">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-blue-600">
                <Calendar className="w-6 h-6" />
                <CardTitle>No Puzzles Today</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {puzzleData?.message && (
                <p className="text-gray-700">{puzzleData.message}</p>
              )}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> Add more words to your lists or come back tomorrow!
                </p>
              </div>
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
      </AppLayout>
    )
  }

  // No current puzzle loaded
  if (!puzzle) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-orange-600" />
            <p className="text-gray-600">Unable to load puzzle. Please try again.</p>
            <Button className="mt-4" onClick={() => navigate('/app/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  // At this point, puzzle is guaranteed to be non-null
  const stats = solver.getPuzzleStats()
  const isLastPuzzle = currentPuzzleIndex === (puzzleData.puzzles?.length || 1) - 1

  // Calculate session progress for "Continue Practicing" feature
  const wordsInCurrentBatch = puzzleData.puzzles.reduce((sum, p) => sum + p.placedWords.length, 0)
  const totalWordsPracticed = sessionWordsPracticed + wordsInCurrentBatch
  const wordsRemaining = Math.max(0, puzzleData.totalWords - totalWordsPracticed) // Remaining after all practiced words

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 min-h-[calc(100vh-4rem)] flex flex-col justify-center">
        {/* Progress Indicator with Help Icon */}
        <div className="mb-4 flex items-center justify-center gap-2">
          <p className="text-sm text-gray-600">
            Puzzle {currentPuzzleIndex + 1} • {puzzleData.totalWords} words to practice today
          </p>
          <button
            onClick={() => setHelpDialogOpen(true)}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Show puzzle controls help"
          >
            <HelpCircle className="w-5 h-5 text-gray-500 hover:text-blue-600" />
          </button>
        </div>

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
            {!solver.isPuzzleCompleted ? (
              /* Clues Panel */
              <PuzzleClues
                placedWords={puzzle.placedWords}
                selectedWord={solver.selectedWord}
                onWordSelect={solver.setSelectedWord}
                onCheckPuzzle={solver.handleCheckPuzzle}
                onEndPuzzle={handleEndPuzzle}
                onGiveHint={solver.handleGiveHint}
                hintsRemaining={solver.hintsRemaining}
                checkedWords={solver.checkedWords}
                onFocusFirstCell={(word) => solver.setFocusedCell({ x: word.x, y: word.y })}
              />
            ) : (
              /* Completion Card */
              <PuzzleCompletionCard
                stats={stats}
                showCorrectAnswers={solver.showCorrectAnswers}
                onToggleAnswersView={solver.setShowCorrectAnswers}
                onNext={handleNextPuzzle}
                nextButtonLabel={isLastPuzzle ? 'Back to Dashboard' : 'Next Puzzle'}
                onContinuePracticing={isLastPuzzle ? handleContinuePracticing : undefined}
                continuePracticingInfo={isLastPuzzle ? {
                  wordsPracticed: totalWordsPracticed,
                  wordsRemaining,
                } : undefined}
              />
            )}
          </div>
        </div>

        {/* Help Dialog */}
        <PuzzleHelpDialog open={helpDialogOpen} onOpenChange={setHelpDialogOpen} />
      </div>
    </AppLayout>
  )
}
