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

import { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react'
import type { Puzzle, PlacedWord } from '@/types'

interface PuzzleGridProps {
  puzzle: Puzzle
  userInput: Record<string, string> // Map of cell coordinates to user input
  onCellChange: (x: number, y: number, value: string) => void
  selectedWord: PlacedWord | null
  onWordSelect: (word: PlacedWord) => void
  onFocusedCellChange: (cell: { x: number; y: number } | null) => void
  checkedWords: Record<string, 'correct' | 'incorrect'>
  isPuzzleCompleted: boolean
  showCorrectAnswers: boolean
}

/**
 * Renders the interactive crossword puzzle grid
 * Grid size is responsive and scales to fill available space
 * Optimized with React.memo to prevent unnecessary re-renders
 */
export const PuzzleGrid = memo(function PuzzleGrid({
  puzzle,
  userInput,
  onCellChange,
  selectedWord,
  onWordSelect,
  onFocusedCellChange,
  checkedWords,
  isPuzzleCompleted,
  showCorrectAnswers
}: PuzzleGridProps) {
  const gridRef = useRef<HTMLDivElement>(null)
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map())
  const [focusedCell, setFocusedCell] = useState<{ x: number; y: number } | null>(null)
  // Track which word the user is actively working on (for auto-advance)
  const [activeWord, setActiveWord] = useState<PlacedWord | null>(null)

  /**
   * Memoized map of cells in the selected word
   * Only recalculates when selectedWord changes
   * Reduces 256 function calls per render to a single Map lookup
   */
  const selectedWordCellsMap = useMemo(() => {
    const map = new Map<string, boolean>()
    if (!selectedWord) return map

    if (selectedWord.direction === 'horizontal') {
      for (let i = 0; i < selectedWord.word.length; i++) {
        const key = `${selectedWord.x + i},${selectedWord.y}`
        map.set(key, true)
      }
    } else {
      for (let i = 0; i < selectedWord.word.length; i++) {
        const key = `${selectedWord.x},${selectedWord.y + i}`
        map.set(key, true)
      }
    }
    return map
  }, [selectedWord])

  /**
   * Memoized map of cell numbers
   * Only recalculates when puzzle changes
   */
  const cellNumbersMap = useMemo(() => {
    const map = new Map<string, number>()
    puzzle.placedWords.forEach(word => {
      const key = `${word.x},${word.y}`
      map.set(key, word.number)
    })
    return map
  }, [puzzle.placedWords])

  /**
   * Memoized map of cell statuses (correct/incorrect)
   * Only recalculates when checkedWords or puzzle changes
   */
  const cellStatusMap = useMemo(() => {
    const map = new Map<string, 'correct' | 'incorrect' | null>()

    // Build a map of which words occupy each cell
    const cellToWords = new Map<string, string[]>()
    puzzle.placedWords.forEach(word => {
      if (word.direction === 'horizontal') {
        for (let i = 0; i < word.word.length; i++) {
          const key = `${word.x + i},${word.y}`
          if (!cellToWords.has(key)) cellToWords.set(key, [])
          cellToWords.get(key)!.push(word.id)
        }
      } else {
        for (let i = 0; i < word.word.length; i++) {
          const key = `${word.x},${word.y + i}`
          if (!cellToWords.has(key)) cellToWords.set(key, [])
          cellToWords.get(key)!.push(word.id)
        }
      }
    })

    // Determine status for each cell
    cellToWords.forEach((wordIds, cellKey) => {
      // If any word at this cell is correct, the cell is correct
      const hasCorrect = wordIds.some(id => checkedWords[id] === 'correct')
      if (hasCorrect) {
        map.set(cellKey, 'correct')
        return
      }

      // If any word at this cell is incorrect, the cell is incorrect
      const hasIncorrect = wordIds.some(id => checkedWords[id] === 'incorrect')
      if (hasIncorrect) {
        map.set(cellKey, 'incorrect')
        return
      }

      map.set(cellKey, null)
    })

    return map
  }, [puzzle.placedWords, checkedWords])

  /**
   * Memoized map of correct answers for each cell
   * Maps cell coordinate to the correct letter
   */
  const correctAnswersMap = useMemo(() => {
    const map = new Map<string, string>()

    puzzle.placedWords.forEach(word => {
      if (word.direction === 'horizontal') {
        for (let i = 0; i < word.word.length; i++) {
          const key = `${word.x + i},${word.y}`
          map.set(key, word.word[i])
        }
      } else {
        for (let i = 0; i < word.word.length; i++) {
          const key = `${word.x},${word.y + i}`
          map.set(key, word.word[i])
        }
      }
    })

    return map
  }, [puzzle.placedWords])

  /**
   * Gets the display value for a cell based on current view mode
   * - My Answers: show user's input (or empty)
   * - Correct Answers: show correct answer
   */
  const getCellDisplayValue = useCallback((x: number, y: number): string => {
    const key = `${x},${y}`

    if (showCorrectAnswers) {
      // Show correct answer
      return correctAnswersMap.get(key) || ''
    } else {
      // Show user's input
      return userInput[key] || ''
    }
  }, [showCorrectAnswers, correctAnswersMap, userInput])

  /**
   * Gets the cell background color class based on view mode and status
   * - My Answers: green for correct, red for incorrect, empty stays empty
   * - Correct Answers: green for correct, amber/yellow for incorrect/empty
   */
  const getCellColorClass = useCallback((x: number, y: number): string => {
    const key = `${x},${y}`
    const status = cellStatusMap.get(key)
    const userValue = userInput[key]

    if (!isPuzzleCompleted) {
      // During puzzle solving - use normal status colors
      if (status === 'correct') return 'bg-green-100 border-green-300'
      if (status === 'incorrect') return 'bg-red-100 border-red-300'
      return 'bg-white border-gray-300'
    }

    // Puzzle completed
    if (showCorrectAnswers) {
      // Correct Answers view: green for correct, amber for wrong/empty
      if (status === 'correct') {
        return 'bg-green-100 border-green-300'
      } else {
        // Wrong or empty - use amber/yellow
        return 'bg-amber-100 border-amber-300'
      }
    } else {
      // My Answers view: green for correct, red for wrong, white for empty
      if (status === 'correct') return 'bg-green-100 border-green-300'
      if (status === 'incorrect') return 'bg-red-100 border-red-300'
      return 'bg-white border-gray-300'
    }
  }, [cellStatusMap, userInput, isPuzzleCompleted, showCorrectAnswers])

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
   * Notify parent when focused cell changes
   */
  useEffect(() => {
    onFocusedCellChange(focusedCell)
  }, [focusedCell, onFocusedCellChange])

  /**
   * Checks if a cell is part of the currently selected word
   * Optimized: O(1) lookup instead of O(n) calculation
   */
  const isCellInSelectedWord = useCallback((x: number, y: number): boolean => {
    return selectedWordCellsMap.get(`${x},${y}`) ?? false
  }, [selectedWordCellsMap])

  /**
   * Gets the clue number for a cell, if it's the start of a word
   * Optimized: O(1) lookup instead of O(n) search
   */
  const getCellNumber = useCallback((x: number, y: number): number | null => {
    return cellNumbersMap.get(`${x},${y}`) ?? null
  }, [cellNumbersMap])

  /**
   * Gets the status of a cell based on word checking
   * Returns 'correct' if part of any correct word, 'incorrect' if only part of incorrect words
   * Optimized: Pre-calculated map lookup
   */
  const getCellStatus = useCallback((x: number, y: number): 'correct' | 'incorrect' | null => {
    return cellStatusMap.get(`${x},${y}`) ?? null
  }, [cellStatusMap])

  /**
   * Finds the word at a specific cell position, preferring a specific direction
   */
  const getWordAtCell = useCallback((x: number, y: number, preferDirection?: 'horizontal' | 'vertical'): PlacedWord | null => {
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
  }, [puzzle.placedWords])

  /**
   * Gets the next word in the puzzle (by number)
   */
  const getNextWord = useCallback((currentWord: PlacedWord): PlacedWord | null => {
    const sortedWords = [...puzzle.placedWords].sort((a, b) => a.number - b.number)
    const currentIndex = sortedWords.findIndex(w => w.id === currentWord.id)
    if (currentIndex === -1 || currentIndex === sortedWords.length - 1) return null
    return sortedWords[currentIndex + 1]
  }, [puzzle.placedWords])

  /**
   * Moves to the next cell in the active word
   * @param currentX - Current cell X coordinate
   * @param currentY - Current cell Y coordinate
   * @param justTypedLetter - Letter that was just typed (for completion check)
   */
  const moveToNextCellInWord = useCallback((currentX: number, currentY: number, justTypedLetter?: string) => {
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
  }, [activeWord, userInput, getNextWord, onWordSelect])

  /**
   * Moves to an adjacent cell based on arrow key direction
   */
  const moveToAdjacentCell = useCallback((currentX: number, currentY: number, direction: 'up' | 'down' | 'left' | 'right') => {
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
  }, [puzzle.gridSize, puzzle.grid, activeWord, getWordAtCell, onWordSelect])

  /**
   * Switches to the next word (tab key)
   */
  const switchToNextWord = useCallback(() => {
    if (!selectedWord) return
    const nextWord = getNextWord(selectedWord)
    if (nextWord) {
      onWordSelect(nextWord)
      setActiveWord(nextWord)
      setFocusedCell({ x: nextWord.x, y: nextWord.y })
    }
  }, [selectedWord, getNextWord, onWordSelect])

  /**
   * Handles keyboard input for a cell
   */
  const handleCellInput = useCallback((x: number, y: number, value: string) => {
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
  }, [activeWord, selectedWord, onCellChange, moveToNextCellInWord])

  /**
   * Handles keyboard navigation (arrows, tab, backspace)
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent, x: number, y: number) => {
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
    } else if (e.key.length === 1 && e.key.match(/[a-zA-Z]/)) {
      // If a letter key is pressed and cell already has a value, clear it first
      const cellKey = `${x},${y}`
      if (userInput[cellKey]) {
        onCellChange(x, y, '')
      }
    }
  }, [moveToAdjacentCell, switchToNextWord, userInput, activeWord, onCellChange])

  /**
   * Handles cell click - selects the word at that position
   */
  const handleCellClick = useCallback((x: number, y: number) => {
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
  }, [selectedWord, isCellInSelectedWord, getWordAtCell, activeWord, onWordSelect])

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
            const displayValue = getCellDisplayValue(x, y)
            const cellNumber = getCellNumber(x, y)
            const isSelected = isCellInSelectedWord(x, y)
            const isFocused = focusedCell?.x === x && focusedCell?.y === y

            if (isBlackSquare) {
              return (
                <div
                  key={cellKey}
                  className="bg-gray-900 rounded-sm aspect-square"
                />
              )
            }

            // Get background color class based on view mode and status
            let bgColor = getCellColorClass(x, y)

            // Override with selection highlight if not completed and selected
            if (!isPuzzleCompleted && isSelected) {
              bgColor = 'bg-blue-100 border-blue-300'
            }

            return (
              <div
                key={cellKey}
                className={`
                  relative ${bgColor} border rounded-sm cursor-pointer
                  transition-colors duration-150
                  aspect-square
                  ${isFocused ? 'ring-2 ring-blue-500' : ''}
                `}
                onClick={() => !isPuzzleCompleted && handleCellClick(x, y)}
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
                  value={displayValue}
                  onChange={(e) => !isPuzzleCompleted && handleCellInput(x, y, e.target.value)}
                  onKeyDown={(e) => !isPuzzleCompleted && handleKeyDown(e, x, y)}
                  disabled={isPuzzleCompleted}
                  spellCheck={false}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  className={`
                    w-full h-full text-center font-bold
                    bg-transparent outline-none uppercase
                    ${isSelected && !isPuzzleCompleted ? 'text-blue-900' : 'text-gray-900'}
                    ${isPuzzleCompleted ? 'cursor-default' : ''}
                  `}
                  style={{ fontSize: 'clamp(1rem, 3vw, 2rem)', caretColor: 'transparent' }}
                />
              </div>
            )
          })
        )}
      </div>
    </div>
  )
})
