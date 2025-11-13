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
import { AppLayout } from '@/components/layout/AppLayout'
import { PuzzleGrid } from '@/components/puzzle/PuzzleGrid'
import { PuzzleClues } from '@/components/puzzle/PuzzleClues'
import type { Puzzle, PlacedWord } from '@/types'

// TODO: Replace with actual puzzle data from API/database
const mockPuzzle: Puzzle = {
  id: 'mock-puzzle-1',
  gridSize: 10,
  placedWords: [
    {
      id: '1',
      word: 'HELLO',
      clue: 'A greeting',
      x: 0,
      y: 0,
      direction: 'horizontal',
      number: 1,
      crossings: []
    },
    {
      id: '2',
      word: 'WORLD',
      clue: 'Planet Earth',
      x: 2,
      y: 0,
      direction: 'vertical',
      number: 2,
      crossings: []
    },
    {
      id: '3',
      word: 'HELP',
      clue: 'Assistance',
      x: 0,
      y: 2,
      direction: 'horizontal',
      number: 3,
      crossings: []
    }
  ],
  grid: Array(10).fill(null).map((_, y) =>
    Array(10).fill(null).map((_, x) => {
      // HELLO at row 0
      if (y === 0 && x < 5) return 'HELLO'[x]
      // WORLD at column 2
      if (x === 2 && y < 5) return 'WORLD'[y]
      // HELP at row 2
      if (y === 2 && x < 4) return 'HELP'[x]
      return null
    })
  )
}

/**
 * Main puzzle solver page component
 */
export function PuzzleSolver() {
  // TODO: Use sessionId to load puzzle from API
  // const { sessionId } = useParams<{ sessionId: string }>()

  const [puzzle] = useState<Puzzle>(mockPuzzle) // TODO: Load from API
  const [userInput, setUserInput] = useState<Record<string, string>>({})
  const [selectedWord, setSelectedWord] = useState<PlacedWord | null>(
    puzzle.placedWords[0] || null
  )
  const [focusedCell, setFocusedCell] = useState<{ x: number; y: number } | null>(null)
  const [hintsRemaining, setHintsRemaining] = useState(3)
  const [checkedWords, setCheckedWords] = useState<Record<string, 'correct' | 'incorrect'>>({})

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
    const newCheckedWords: Record<string, 'correct' | 'incorrect'> = {}

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
      newCheckedWords[word.id] = isCorrect ? 'correct' : 'incorrect'
    })

    setCheckedWords(newCheckedWords)
  }

  /**
   * Ends the puzzle and shows results
   */
  const handleEndPuzzle = () => {
    // TODO: Implement end puzzle logic
    console.log('Ending puzzle...')
  }

  /**
   * Reveals a letter as a hint
   */
  const handleGiveHint = () => {
    if (hintsRemaining <= 0 || !focusedCell) return

    // Get the correct letter for the focused cell
    const correctLetter = puzzle.grid[focusedCell.y][focusedCell.x]
    if (correctLetter) {
      handleCellChange(focusedCell.x, focusedCell.y, correctLetter)
      setHintsRemaining(prev => prev - 1)
    }
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Crossword Puzzle</h1>
        </div>

        {/* Main Puzzle Layout - Grid on Left, Clues on Right */}
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

          {/* Right: Clues and Controls */}
          <div className="lg:sticky lg:top-24 lg:self-start">
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
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
