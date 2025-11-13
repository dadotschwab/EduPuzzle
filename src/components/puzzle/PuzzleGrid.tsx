/**
 * @fileoverview Interactive crossword puzzle grid component
 *
 * Displays a responsive crossword grid that:
 * - Adapts to different grid sizes (8x8 to 15x15)
 * - Always maintains consistent screen space
 * - Advanced keyboard navigation (arrows, tab)
 * - Smart auto-advance within words
 * - Auto-jump to next word when complete
 * - Highlights selected word
 * - Shows cell numbers for clue references
 *
 * @module components/puzzle/PuzzleGrid
 */

import { useState, useRef, useEffect } from 'react'
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
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map())
  const [focusedCell, setFocusedCell] = useState<{ x: number; y: number } | null>(null)
  // Track which word the user is actively working on (for auto-advance)
  const [activeWord, setActiveWord] = useState<PlacedWord | null>(null)

  /**
   * Focus the input element for a specific cell
   */
  useEffect(() => {
    if (focusedCell) {
      const key = `${focusedCell.x},${focusedCell.y}`
      const input = inputRefs.current.get(key)
      if (input) {
        input.focus()
      }
    }
  }, [focusedCell])

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
   * Finds the word at a specific cell position, preferring a specific direction
   */
  const getWordAtCell = (x: number, y: number, preferDirection?: 'horizontal' | 'vertical'): PlacedWord | null => {
    const wordsAtCell = puzzle.placedWords.filter(w => {
      if (w.direction === 'horizontal') {
        return w.y === y && x >= w.x && x < w.x + w.word.length
      } else {
        return w.x === x && y >= w.y && y < w.y + w.word.length
      }
    })

    if (wordsAtCell.length === 0) return null
    if (wordsAtCell.length === 1) return wordsAtCell[0]

    // Multiple words at this cell - prefer the specified direction
    if (preferDirection) {
      return wordsAtCell.find(w => w.direction === preferDirection) || wordsAtCell[0]
    }

    return wordsAtCell[0]
  }

  /**
   * Gets the next word in the puzzle (by number)
   */
  const getNextWord = (currentWord: PlacedWord): PlacedWord | null => {
    const sortedWords = [...puzzle.placedWords].sort((a, b) => a.number - b.number)
    const currentIndex = sortedWords.findIndex(w => w.id === currentWord.id)
    if (currentIndex === -1 || currentIndex === sortedWords.length - 1) return null
    return sortedWords[currentIndex + 1]
  }

  /**
   * Moves to the next cell in the active word
   * @param currentX - Current cell X coordinate
   * @param currentY - Current cell Y coordinate
   * @param justTypedLetter - Letter that was just typed (for completion check)
   */
  const moveToNextCellInWord = (currentX: number, currentY: number, justTypedLetter?: string) => {
    if (!activeWord) return

    // Check if word is complete (including the letter we just typed)
    const checkWordComplete = (): boolean => {
      for (let i = 0; i < activeWord.word.length; i++) {
        const cellX = activeWord.direction === 'horizontal' ? activeWord.x + i : activeWord.x
        const cellY = activeWord.direction === 'horizontal' ? activeWord.y : activeWord.y + i
        const key = `${cellX},${cellY}`

        // If this is the current cell and we just typed a letter, count it as filled
        if (cellX === currentX && cellY === currentY && justTypedLetter) {
          continue
        }

        if (!userInput[key]) return false
      }
      return true
    }

    if (activeWord.direction === 'horizontal') {
      const nextX = currentX + 1
      if (nextX < activeWord.x + activeWord.word.length) {
        // Still within the word - advance to next cell
        setFocusedCell({ x: nextX, y: currentY })
      } else if (checkWordComplete()) {
        // Reached end of word and it's complete - jump to next word
        const nextWord = getNextWord(activeWord)
        if (nextWord) {
          onWordSelect(nextWord)
          setActiveWord(nextWord)
          setFocusedCell({ x: nextWord.x, y: nextWord.y })
        }
      }
    } else {
      const nextY = currentY + 1
      if (nextY < activeWord.y + activeWord.word.length) {
        // Still within the word - advance to next cell
        setFocusedCell({ x: currentX, y: nextY })
      } else if (checkWordComplete()) {
        // Reached end of word and it's complete - jump to next word
        const nextWord = getNextWord(activeWord)
        if (nextWord) {
          onWordSelect(nextWord)
          setActiveWord(nextWord)
          setFocusedCell({ x: nextWord.x, y: nextWord.y })
        }
      }
    }
  }

  /**
   * Moves to an adjacent cell based on arrow key direction
   */
  const moveToAdjacentCell = (currentX: number, currentY: number, direction: 'up' | 'down' | 'left' | 'right') => {
    let newX = currentX
    let newY = currentY

    switch (direction) {
      case 'up':
        newY = currentY - 1
        break
      case 'down':
        newY = currentY + 1
        break
      case 'left':
        newX = currentX - 1
        break
      case 'right':
        newX = currentX + 1
        break
    }

    // Check if new position is valid and not a black square
    if (newX >= 0 && newX < puzzle.gridSize && newY >= 0 && newY < puzzle.gridSize) {
      if (puzzle.grid[newY][newX] !== null) {
        setFocusedCell({ x: newX, y: newY })
        // Update selected word and active word based on the new cell
        const word = getWordAtCell(newX, newY, activeWord?.direction)
        if (word) {
          onWordSelect(word)
          setActiveWord(word)
        }
      }
    }
  }

  /**
   * Switches to the next word (tab key)
   */
  const switchToNextWord = () => {
    if (!selectedWord) return
    const nextWord = getNextWord(selectedWord)
    if (nextWord) {
      onWordSelect(nextWord)
      setActiveWord(nextWord)
      setFocusedCell({ x: nextWord.x, y: nextWord.y })
    }
  }

  /**
   * Handles keyboard input for a cell
   */
  const handleCellInput = (x: number, y: number, value: string) => {
    // Only allow single letters
    const letter = value.toUpperCase().replace(/[^A-Z]/g, '').charAt(0)

    if (letter) {
      onCellChange(x, y, letter)
      // Set active word if not already set (first letter typed)
      if (!activeWord && selectedWord) {
        setActiveWord(selectedWord)
        // Use selectedWord for auto-advance since we just set it as active
        moveToNextCellInWord(x, y, letter)
      } else if (activeWord) {
        // Auto-advance to next cell in the active word
        moveToNextCellInWord(x, y, letter)
      }
    } else if (value === '') {
      // User pressed backspace or deleted the letter
      onCellChange(x, y, '')
    }
  }

  /**
   * Handles keyboard navigation (arrows, tab, backspace)
   */
  const handleKeyDown = (e: React.KeyboardEvent, x: number, y: number) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault()
      const directionMap = {
        'ArrowUp': 'up' as const,
        'ArrowDown': 'down' as const,
        'ArrowLeft': 'left' as const,
        'ArrowRight': 'right' as const,
      }
      moveToAdjacentCell(x, y, directionMap[e.key])
    } else if (e.key === 'Tab') {
      e.preventDefault()
      switchToNextWord()
    } else if (e.key === 'Backspace' && !userInput[`${x},${y}`]) {
      // If backspace on empty cell, move to previous cell in active word
      e.preventDefault()
      if (activeWord) {
        if (activeWord.direction === 'horizontal') {
          const prevX = x - 1
          if (prevX >= activeWord.x) {
            setFocusedCell({ x: prevX, y })
          }
        } else {
          const prevY = y - 1
          if (prevY >= activeWord.y) {
            setFocusedCell({ x, y: prevY })
          }
        }
      }
    }
  }

  /**
   * Handles cell click - selects the word at that position
   */
  const handleCellClick = (x: number, y: number) => {
    // If clicking on the currently selected word, toggle direction if possible
    if (selectedWord && isCellInSelectedWord(x, y)) {
      const otherWord = getWordAtCell(
        x,
        y,
        selectedWord.direction === 'horizontal' ? 'vertical' : 'horizontal'
      )
      if (otherWord && otherWord.id !== selectedWord.id) {
        onWordSelect(otherWord)
        setActiveWord(otherWord)
        setFocusedCell({ x, y })
        return
      }
    }

    // Find word at this position
    const word = getWordAtCell(x, y, activeWord?.direction)
    if (word) {
      onWordSelect(word)
      setActiveWord(word)
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
                  ref={(el) => {
                    if (el) {
                      inputRefs.current.set(cellKey, el)
                    } else {
                      inputRefs.current.delete(cellKey)
                    }
                  }}
                  type="text"
                  maxLength={1}
                  value={userLetter}
                  onChange={(e) => handleCellInput(x, y, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, x, y)}
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
