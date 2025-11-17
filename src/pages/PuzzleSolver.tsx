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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, Trophy, Loader2, AlertCircle } from 'lucide-react'
import { usePuzzleGeneration, useCurrentPuzzle } from '@/hooks/usePuzzleGeneration'
import type { Puzzle, PlacedWord } from '@/types'

/**
 * Main puzzle solver page component
 */
export function PuzzleSolver() {
  const { listId } = useParams<{ listId: string }>()
  const navigate = useNavigate()


  // Generate puzzle from database words (30 random words)
  const { data: allPuzzles, isLoading, error } = usePuzzleGeneration(listId || '', 30, !!listId)

    isLoading,
    hasError: !!error,
    errorMessage: error?.message,
    hasPuzzles: !!allPuzzles,
    puzzleCount: allPuzzles?.length
  })

  // Track which puzzle we're showing
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0)
  const puzzle = useCurrentPuzzle(allPuzzles, currentPuzzleIndex)

    hasPuzzle: !!puzzle,
    puzzleId: puzzle?.id,
    gridSize: puzzle?.gridSize,
    wordCount: puzzle?.placedWords?.length
  })
  const [userInput, setUserInput] = useState<Record<string, string>>({})
  const [selectedWord, setSelectedWord] = useState<PlacedWord | null>(null)
  const [focusedCell, setFocusedCell] = useState<{ x: number; y: number } | null>(null)
  const [hintsRemaining, setHintsRemaining] = useState(3)
  const [checkedWords, setCheckedWords] = useState<Record<string, 'correct' | 'incorrect'>>({})
  const [isPuzzleCompleted, setIsPuzzleCompleted] = useState(false)
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false)

  /**
   * Validates all words in the puzzle and returns their status
   * Extracted to avoid code duplication
   * @returns Record mapping word IDs to their correctness status
   */
  const validateAllWords = (): Record<string, 'correct' | 'incorrect'> => {
    const results: Record<string, 'correct' | 'incorrect'> = {}

    puzzle.placedWords.forEach(word => {
      let isCorrect = true
      for (let i = 0; i < word.word.length; i++) {
        const cellX = word.direction === 'horizontal' ? word.x + i : word.x
        const cellY = word.direction === 'horizontal' ? word.y : word.y + i
        const key = `${cellX},${cellY}`
        const userLetter = userInput[key] || ''
        const correctLetter = word.word[i]

        if (userLetter !== correctLetter) {
          isCorrect = false
          break
        }
      }
      results[word.id] = isCorrect ? 'correct' : 'incorrect'
    })

    return results
  }

  /**
   * Handles user input in a cell
   */
  const handleCellChange = (x: number, y: number, value: string) => {
    const key = `${x},${y}`
    setUserInput(prev => ({
      ...prev,
      [key]: value
    }))
  }

  /**
   * Checks the puzzle and shows errors
   */
  const handleCheckPuzzle = () => {
    const validationResults = validateAllWords()
    setCheckedWords(validationResults)
  }

  /**
   * Ends the puzzle and shows results
   */
  const handleEndPuzzle = () => {
    // Validate all words and show final results
    const validationResults = validateAllWords()
    setCheckedWords(validationResults)
    setIsPuzzleCompleted(true)
    setShowCorrectAnswers(true) // Default to showing correct answers
    // TODO: Apply SRS logic based on results
  }

  /**
   * Calculates puzzle statistics
   */
  const getPuzzleStats = () => {
    const totalWords = puzzle.placedWords.length
    const correctWords = Object.values(checkedWords).filter(status => status === 'correct').length
    const incorrectWords = Object.values(checkedWords).filter(status => status === 'incorrect').length
    const hintsUsed = 3 - hintsRemaining

    return { totalWords, correctWords, incorrectWords, hintsUsed }
  }

  /**
   * Reveals a letter as a hint
   */
  const handleGiveHint = () => {
    if (hintsRemaining <= 0 || !focusedCell) return

    // Get the correct letter for the focused cell
    const correctLetter = puzzle?.grid[focusedCell.y][focusedCell.x]
    if (correctLetter) {
      handleCellChange(focusedCell.x, focusedCell.y, correctLetter)
      setHintsRemaining(prev => prev - 1)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center space-y-4">
              <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Generating Your Puzzle...</h2>
                <p className="text-muted-foreground">
                  Fetching words and creating crossword puzzle
                </p>
                <p className="text-sm text-muted-foreground">
                  This usually takes 2-5 seconds
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    )
  }

  // Error state
  if (error) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center">
          <Card className="w-full max-w-md border-destructive">
            <CardContent className="pt-6 text-center space-y-4">
              <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Failed to Generate Puzzle</h2>
                <p className="text-muted-foreground">
                  {error instanceof Error ? error.message : 'An unexpected error occurred'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => navigate('/app')}
                  variant="outline"
                  className="flex-1"
                >
                  Back to Dashboard
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  className="flex-1"
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    )
  }

  // No puzzle state
  if (!puzzle) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center space-y-4">
              <AlertCircle className="w-12 h-12 mx-auto text-yellow-500" />
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">No Puzzle Available</h2>
                <p className="text-muted-foreground">
                  Unable to load puzzle. The word list might be empty.
                </p>
              </div>
              <Button onClick={() => navigate('/app')}>
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    )
  }

  // At this point, puzzle is guaranteed to be non-null
  const stats = getPuzzleStats()

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 min-h-[calc(100vh-4rem)] flex flex-col justify-center">
        {/* Main Puzzle Layout - Grid on Left, Clues/Results on Right */}
        <div className="grid lg:grid-cols-[1.2fr,1fr] gap-8">
          {/* Left: Puzzle Grid */}
          <div className="flex items-start justify-center">
            <PuzzleGrid
              puzzle={puzzle}
              userInput={userInput}
              onCellChange={handleCellChange}
              selectedWord={selectedWord}
              onWordSelect={setSelectedWord}
              onFocusedCellChange={setFocusedCell}
              checkedWords={checkedWords}
              isPuzzleCompleted={isPuzzleCompleted}
              showCorrectAnswers={showCorrectAnswers}
            />
          </div>

          {/* Right: Clues/Controls or Completion Stats */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            {/* Title */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold">Crossword Puzzle</h1>
              {allPuzzles && allPuzzles.length > 1 && (
                <p className="text-sm text-muted-foreground mt-1">
                  Puzzle {currentPuzzleIndex + 1} of {allPuzzles.length}
                </p>
              )}
            </div>

            {!isPuzzleCompleted ? (
              <PuzzleClues
                placedWords={puzzle.placedWords}
                selectedWord={selectedWord}
                onWordSelect={setSelectedWord}
                onCheckPuzzle={handleCheckPuzzle}
                onEndPuzzle={handleEndPuzzle}
                onGiveHint={handleGiveHint}
                hintsRemaining={hintsRemaining}
                checkedWords={checkedWords}
              />
            ) : (
              <div className="flex flex-col h-full">
                {/* Action Buttons */}
                <div className="mb-4">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => window.location.href = '/app'}
                      className="flex-1"
                    >
                      Dashboard
                    </Button>
                    {/* Only show Next Puzzle button if not on last puzzle */}
                    {allPuzzles && currentPuzzleIndex < allPuzzles.length - 1 && (
                      <Button
                        onClick={() => {
                          setCurrentPuzzleIndex(currentPuzzleIndex + 1)
                          setIsPuzzleCompleted(false)
                          setUserInput({})
                          setCheckedWords({})
                          setHintsRemaining(3)
                          setShowCorrectAnswers(false)
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Next Puzzle
                      </Button>
                    )}
                  </div>
                </div>

                {/* Completion Card */}
                <Card className="flex-1 flex flex-col overflow-hidden">
                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-2">
                      <Trophy className="w-12 h-12 text-yellow-500" />
                    </div>
                    <CardTitle className="text-xl">Puzzle Completed!</CardTitle>

                    {/* Toggle between My Answers and Correct Answers */}
                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() => setShowCorrectAnswers(false)}
                        variant={!showCorrectAnswers ? "default" : "outline"}
                        size="sm"
                        className="flex-1"
                      >
                        My Answers
                      </Button>
                      <Button
                        onClick={() => setShowCorrectAnswers(true)}
                        variant={showCorrectAnswers ? "default" : "outline"}
                        size="sm"
                        className="flex-1"
                      >
                        Correct Answers
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto space-y-4">
                    {/* Statistics */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-blue-700">{stats.totalWords}</div>
                        <div className="text-xs text-blue-600 mt-1">Total Words</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-green-700">{stats.correctWords}</div>
                        <div className="text-xs text-green-600 mt-1">Correct</div>
                      </div>
                      <div className="bg-red-50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-red-700">{stats.incorrectWords}</div>
                        <div className="text-xs text-red-600 mt-1">Incorrect</div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-purple-700">{stats.hintsUsed}</div>
                        <div className="text-xs text-purple-600 mt-1">Hints Used</div>
                      </div>
                    </div>

                    {/* Performance Message */}
                    <div className="text-center py-4">
                      {stats.incorrectWords === 0 ? (
                        <div className="text-green-700 font-semibold">
                          Perfect! All words correct! 🎉
                        </div>
                      ) : stats.correctWords > stats.incorrectWords ? (
                        <div className="text-blue-700 font-semibold">
                          Great job! Keep it up! 👏
                        </div>
                      ) : (
                        <div className="text-orange-700 font-semibold">
                          Good effort! Try the next one! 💪
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
