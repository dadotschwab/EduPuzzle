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

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { PuzzleGrid } from '@/components/puzzle/PuzzleGrid'
import { PuzzleClues } from '@/components/puzzle/PuzzleClues'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, Trophy, Loader2, AlertCircle, Calendar } from 'lucide-react'
import { useTodaysPuzzles, useCompletePuzzle, useCurrentPuzzle } from '@/hooks/useTodaysPuzzles'
import type { PlacedWord } from '@/types'

/**
 * Today's Puzzles page component - SRS-driven puzzle practice
 */
export function TodaysPuzzles() {
  const navigate = useNavigate()

  // Fetch today's due words and generate puzzles
  const { data: puzzleData, isLoading, error } = useTodaysPuzzles()
  const completePuzzle = useCompletePuzzle()

  // Track which puzzle we're showing
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0)
  const puzzle = useCurrentPuzzle(puzzleData?.puzzles ?? undefined, currentPuzzleIndex)
  const [userInput, setUserInput] = useState<Record<string, string>>({})
  const [selectedWord, setSelectedWord] = useState<PlacedWord | null>(null)
  const [focusedCell, setFocusedCell] = useState<{ x: number; y: number } | null>(null)
  const [hintsRemaining, setHintsRemaining] = useState(3)
  const [checkedWords, setCheckedWords] = useState<Record<string, 'correct' | 'incorrect'>>({})
  const [isPuzzleCompleted, setIsPuzzleCompleted] = useState(false)
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false)

  /**
   * Validates all words in the puzzle and returns their status
   */
  const validateAllWords = (): Record<string, 'correct' | 'incorrect'> => {
    if (!puzzle) return {}

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
   * Checks the current word only
   */
  const handleCheckPuzzle = () => {
    const validationResults = validateAllWords()
    setCheckedWords(validationResults)
  }

  /**
   * Ends the puzzle, validates all words, and updates SRS progress
   */
  const handleEndPuzzle = () => {
    if (!puzzle) return

    // Validate all words and show final results
    const validationResults = validateAllWords()
    setCheckedWords(validationResults)
    setIsPuzzleCompleted(true)
    setShowCorrectAnswers(true)

    // Update SRS progress for all words in this puzzle
    const srsUpdates = puzzle.placedWords.map(word => ({
      wordId: word.id,
      wasCorrect: validationResults[word.id] === 'correct',
    }))

    completePuzzle.mutate(srsUpdates)
  }

  /**
   * Calculates puzzle statistics
   */
  const getPuzzleStats = () => {
    if (!puzzle) return { totalWords: 0, correctWords: 0, incorrectWords: 0, hintsUsed: 0 }

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
    if (!puzzle || !selectedWord || hintsRemaining <= 0) return

    // Find first empty or incorrect cell in selected word
    for (let i = 0; i < selectedWord.word.length; i++) {
      const cellX = selectedWord.direction === 'horizontal' ? selectedWord.x + i : selectedWord.x
      const cellY = selectedWord.direction === 'horizontal' ? selectedWord.y : selectedWord.y + i
      const key = `${cellX},${cellY}`
      const userLetter = userInput[key] || ''
      const correctLetter = selectedWord.word[i]

      if (userLetter !== correctLetter) {
        // Reveal this letter
        setUserInput(prev => ({ ...prev, [key]: correctLetter }))
        setHintsRemaining(prev => prev - 1)
        break
      }
    }
  }

  /**
   * Handles cell value changes from the puzzle grid
   */
  const handleCellChange = (x: number, y: number, value: string) => {
    const key = `${x},${y}`
    setUserInput(prev => ({ ...prev, [key]: value.toUpperCase() }))
  }

  /**
   * Advances to the next puzzle
   */
  const handleNextPuzzle = () => {
    if (!puzzleData?.puzzles) return

    if (currentPuzzleIndex < puzzleData.puzzles.length - 1) {
      setCurrentPuzzleIndex(prev => prev + 1)
      setUserInput({})
      setSelectedWord(null)
      setFocusedCell(null)
      setCheckedWords({})
      setHintsRemaining(3)
      setIsPuzzleCompleted(false)
      setShowCorrectAnswers(false)
    } else {
      // All puzzles completed - go back to dashboard
      navigate('/app/dashboard')
    }
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
  const stats = getPuzzleStats()
  const isLastPuzzle = currentPuzzleIndex === (puzzleData.puzzles?.length || 1) - 1

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 min-h-[calc(100vh-4rem)] flex flex-col justify-center">
        {/* Progress Indicator */}
        <div className="mb-4 text-center">
          <p className="text-sm text-gray-600">
            Puzzle {currentPuzzleIndex + 1} of {puzzleData.puzzles?.length || 1} • {puzzleData.totalWords} words due today
          </p>
        </div>

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
            />
          </div>

          {/* Right: Clues/Controls or Completion Stats */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            {!isPuzzleCompleted ? (
              /* Clues Panel */
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
              /* Completion Card */
              <div className="space-y-6">
                {/* Completion Card */}
                <Card className="flex-1 flex flex-col overflow-hidden">
                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-2">
                      <Trophy className="w-12 h-12 text-yellow-500" />
                    </div>
                    <CardTitle className="text-xl">Puzzle Completed!</CardTitle>
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

                    {/* Toggle View Buttons */}
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

                    {/* Next Puzzle Button */}
                    <Button
                      onClick={handleNextPuzzle}
                      className="w-full mt-4"
                      size="lg"
                    >
                      {isLastPuzzle ? (
                        <>Back to Dashboard</>
                      ) : (
                        <>
                          Next Puzzle
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
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
