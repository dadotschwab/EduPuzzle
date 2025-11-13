/**
 * @fileoverview Interactive crossword puzzle grid component
 *
 * Displays a responsive crossword grid that:
 * - Adapts to different grid sizes (8x8 to 15x15)
 * - Always maintains consistent screen space
 * - Allows keyboard navigation and input
 * - Highlights selected word
 * - Shows cell numbers for clue references
 *
 * @module components/puzzle/PuzzleGrid
 */

import { useState, useRef } from 'react'
import type { Puzzle, PlacedWord } from '@/types'

interface PuzzleGridProps {
  puzzle: Puzzle
  userInput: Record<string, string> // Map of cell coordinates to user input
  onCellChange: (x: number, y: number, value: string) => void
  selectedWord: PlacedWord | null
  onWordSelect: (word: PlacedWord) => void
}

/**
 * Renders the interactive crossword puzzle grid
 * Grid size is responsive and scales to fill available space
 */
export function PuzzleGrid({
  puzzle,
  userInput,
  onCellChange,
  selectedWord,
  onWordSelect
}: PuzzleGridProps) {
  const gridRef = useRef<HTMLDivElement>(null)
  const [focusedCell, setFocusedCell] = useState<{ x: number; y: number } | null>(null)

  /**
   * Checks if a cell is part of the currently selected word
   */
  const isCellInSelectedWord = (x: number, y: number): boolean => {
    if (!selectedWord) return false

    if (selectedWord.direction === 'horizontal') {
      return y === selectedWord.y && x >= selectedWord.x && x < selectedWord.x + selectedWord.word.length
    } else {
      return x === selectedWord.x && y >= selectedWord.y && y < selectedWord.y + selectedWord.word.length
    }
  }

  /**
   * Gets the clue number for a cell, if it's the start of a word
   */
  const getCellNumber = (x: number, y: number): number | null => {
    const word = puzzle.placedWords.find(w => w.x === x && w.y === y)
    return word ? word.number : null
  }

  /**
   * Handles keyboard input for a cell
   */
  const handleCellInput = (x: number, y: number, value: string) => {
    // Only allow single letters
    const letter = value.toUpperCase().replace(/[^A-Z]/g, '').charAt(0)
    onCellChange(x, y, letter)

    // Auto-advance to next cell in selected word
    if (letter && selectedWord) {
      moveToNextCell(x, y)
    }
  }

  /**
   * Moves focus to the next cell in the current word
   */
  const moveToNextCell = (currentX: number, currentY: number) => {
    if (!selectedWord) return

    if (selectedWord.direction === 'horizontal') {
      const nextX = currentX + 1
      if (nextX < selectedWord.x + selectedWord.word.length) {
        setFocusedCell({ x: nextX, y: currentY })
      }
    } else {
      const nextY = currentY + 1
      if (nextY < selectedWord.y + selectedWord.word.length) {
        setFocusedCell({ x: currentX, y: nextY })
      }
    }
  }

  /**
   * Handles cell click - selects the word at that position
   */
  const handleCellClick = (x: number, y: number) => {
    // Find word at this position
    const word = puzzle.placedWords.find(w => {
      if (w.direction === 'horizontal') {
        return w.y === y && x >= w.x && x < w.x + w.word.length
      } else {
        return w.x === x && y >= w.y && y < w.y + w.word.length
      }
    })

    if (word) {
      onWordSelect(word)
      setFocusedCell({ x, y })
    }
  }

  return (
    <div
      ref={gridRef}
      className="w-full aspect-square max-w-2xl mx-auto"
    >
      <div
        className="grid gap-0.5 w-full h-full bg-gray-300 p-1 rounded-lg shadow-lg"
        style={{
          gridTemplateColumns: `repeat(${puzzle.gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${puzzle.gridSize}, 1fr)`,
        }}
      >
        {Array.from({ length: puzzle.gridSize }).map((_, y) =>
          Array.from({ length: puzzle.gridSize }).map((_, x) => {
            const cellKey = `${x},${y}`
            const letter = puzzle.grid[y][x]
            const isBlackSquare = letter === null
            const userLetter = userInput[cellKey] || ''
            const cellNumber = getCellNumber(x, y)
            const isSelected = isCellInSelectedWord(x, y)
            const isFocused = focusedCell?.x === x && focusedCell?.y === y

            if (isBlackSquare) {
              return (
                <div
                  key={cellKey}
                  className="bg-gray-900 rounded-sm"
                />
              )
            }

            return (
              <div
                key={cellKey}
                className={`
                  relative bg-white rounded-sm cursor-pointer
                  transition-colors duration-150
                  ${isSelected ? 'bg-blue-100' : ''}
                  ${isFocused ? 'ring-2 ring-blue-500' : ''}
                `}
                onClick={() => handleCellClick(x, y)}
              >
                {/* Cell number */}
                {cellNumber && (
                  <span className="absolute top-0 left-0.5 text-[0.5em] leading-none font-bold text-gray-600">
                    {cellNumber}
                  </span>
                )}

                {/* User input */}
                <input
                  type="text"
                  maxLength={1}
                  value={userLetter}
                  onChange={(e) => handleCellInput(x, y, e.target.value)}
                  onFocus={() => handleCellClick(x, y)}
                  className={`
                    w-full h-full text-center font-bold
                    bg-transparent outline-none uppercase
                    ${isSelected ? 'text-blue-900' : 'text-gray-900'}
                  `}
                  style={{ fontSize: 'clamp(1rem, 3vw, 2rem)' }}
                />
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
