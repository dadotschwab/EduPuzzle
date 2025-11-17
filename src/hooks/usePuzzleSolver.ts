/**
 * @fileoverview Shared puzzle solving logic
 *
 * Provides common state management and validation logic for puzzle solving,
 * eliminating code duplication between TodaysPuzzles and PuzzleSolver pages.
 *
 * @module hooks/usePuzzleSolver
 */

import { useState } from 'react'
import type { Puzzle, PlacedWord } from '@/types'

interface PuzzleSolverState {
  userInput: Record<string, string>
  selectedWord: PlacedWord | null
  focusedCell: { x: number; y: number } | null
  hintsRemaining: number
  checkedWords: Record<string, 'correct' | 'incorrect'>
  isPuzzleCompleted: boolean
  showCorrectAnswers: boolean
}

interface PuzzleStats {
  totalWords: number
  correctWords: number
  incorrectWords: number
  hintsUsed: number
}

/**
 * Shared hook for puzzle solving functionality
 *
 * Provides all the state management, validation, and interaction logic
 * needed for solving crossword puzzles.
 *
 * @param puzzle - The current puzzle being solved
 * @returns State, handlers, and utility functions for puzzle solving
 *
 * @example
 * ```typescript
 * function PuzzlePage() {
 *   const { data: puzzle } = usePuzzle()
 *   const solver = usePuzzleSolver(puzzle)
 *
 *   return (
 *     <PuzzleGrid
 *       puzzle={puzzle}
 *       userInput={solver.userInput}
 *       onCellChange={solver.handleCellChange}
 *       // ... other props
 *     />
 *   )
 * }
 * ```
 */
export function usePuzzleSolver(puzzle: Puzzle | null) {
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
   * Handles user input in a cell
   */
  const handleCellChange = (x: number, y: number, value: string) => {
    const key = `${x},${y}`
    setUserInput(prev => ({ ...prev, [key]: value.toUpperCase() }))
  }

  /**
   * Checks the current puzzle and shows validation results
   */
  const handleCheckPuzzle = () => {
    const validationResults = validateAllWords()
    setCheckedWords(validationResults)
  }

  /**
   * Ends the puzzle and shows final results
   *
   * @param onComplete - Optional callback with validation results for SRS updates
   */
  const handleEndPuzzle = (onComplete?: (results: Record<string, 'correct' | 'incorrect'>) => void) => {
    if (!puzzle) return

    const validationResults = validateAllWords()
    setCheckedWords(validationResults)
    setIsPuzzleCompleted(true)
    setShowCorrectAnswers(true)

    // Call completion callback if provided (for SRS updates)
    if (onComplete) {
      onComplete(validationResults)
    }
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
   * Calculates puzzle statistics
   */
  const getPuzzleStats = (): PuzzleStats => {
    if (!puzzle) return { totalWords: 0, correctWords: 0, incorrectWords: 0, hintsUsed: 0 }

    const totalWords = puzzle.placedWords.length
    const correctWords = Object.values(checkedWords).filter(status => status === 'correct').length
    const incorrectWords = Object.values(checkedWords).filter(status => status === 'incorrect').length
    const hintsUsed = 3 - hintsRemaining

    return { totalWords, correctWords, incorrectWords, hintsUsed }
  }

  /**
   * Resets the puzzle state for a new puzzle
   */
  const resetPuzzle = () => {
    setUserInput({})
    setSelectedWord(null)
    setFocusedCell(null)
    setCheckedWords({})
    setHintsRemaining(3)
    setIsPuzzleCompleted(false)
    setShowCorrectAnswers(false)
  }

  return {
    // State
    userInput,
    selectedWord,
    focusedCell,
    hintsRemaining,
    checkedWords,
    isPuzzleCompleted,
    showCorrectAnswers,

    // Setters
    setSelectedWord,
    setFocusedCell,
    setShowCorrectAnswers,

    // Actions
    handleCellChange,
    handleCheckPuzzle,
    handleEndPuzzle,
    handleGiveHint,

    // Utils
    validateAllWords,
    getPuzzleStats,
    resetPuzzle,
  }
}
