/**
 * @fileoverview Grid data structure for crossword puzzle construction
 *
 * Manages the 2D grid of cells, handles placement validation,
 * and tracks word positions during puzzle generation.
 *
 * @module lib/algorithms/grid
 */

import type { GridCell, Position, Direction, PlacedWordInternal } from './types'
import type { Word } from '@/types'

/**
 * Grid manager for crossword puzzle construction
 */
export class Grid {
  private cells: GridCell[][]
  private size: number
  private placedWords: Map<string, PlacedWordInternal>
  private nextClueNumber: number

  /**
   * Creates a new grid
   * @param size - Grid dimensions (size x size)
   */
  constructor(size: number) {
    this.size = size
    this.placedWords = new Map()
    this.nextClueNumber = 1

    // Initialize empty grid
    this.cells = Array(size).fill(null).map(() =>
      Array(size).fill(null).map(() => ({
        letter: null,
        wordIds: new Set<string>(),
        isBlocked: false,
      }))
    )
  }

  /**
   * Gets the grid size
   */
  getSize(): number {
    return this.size
  }

  /**
   * Gets all placed words
   */
  getPlacedWords(): PlacedWordInternal[] {
    return Array.from(this.placedWords.values())
  }

  /**
   * Gets number of placed words
   */
  getPlacedWordCount(): number {
    return this.placedWords.size
  }

  /**
   * Checks if position is within grid bounds
   */
  isInBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.size && y >= 0 && y < this.size
  }

  /**
   * Gets the letter at a position (null if empty)
   */
  getLetter(x: number, y: number): string | null {
    if (!this.isInBounds(x, y)) return null
    return this.cells[y][x].letter
  }

  /**
   * Gets the cell at a position
   */
  getCell(x: number, y: number): GridCell | null {
    if (!this.isInBounds(x, y)) return null
    return this.cells[y][x]
  }

  /**
   * Checks if a position is empty
   */
  isEmpty(x: number, y: number): boolean {
    if (!this.isInBounds(x, y)) return false
    return this.cells[y][x].letter === null
  }

  /**
   * Checks if a word can be placed at the given position
   *
   * @param word - The word to place
   * @param x - Starting X coordinate
   * @param y - Starting Y coordinate
   * @param direction - Placement direction
   * @returns true if placement is valid
   */
  canPlaceWord(word: Word, x: number, y: number, direction: Direction): boolean {
    const length = word.term.length

    // Check for negative coordinates or out of bounds
    if (x < 0 || y < 0 || x >= this.size || y >= this.size) {
      return false
    }

    // Check if word fits in grid
    if (direction === 'horizontal') {
      if (x + length > this.size) return false
    } else {
      if (y + length > this.size) return false
    }

    // Check each position
    for (let i = 0; i < length; i++) {
      const cellX = direction === 'horizontal' ? x + i : x
      const cellY = direction === 'horizontal' ? y : y + i
      const letter = word.term[i]
      const currentLetter = this.getLetter(cellX, cellY)

      // If cell is occupied, letters must match
      if (currentLetter !== null && currentLetter !== letter) {
        return false
      }

      // If cell is empty, check perpendicular conflicts
      if (currentLetter === null) {
        if (!this.checkPerpendicularClear(cellX, cellY, direction)) {
          return false
        }
      }
    }

    // Check before and after word are clear (no adjacent words)
    if (direction === 'horizontal') {
      if (x > 0 && this.getLetter(x - 1, y) !== null) return false
      if (x + length < this.size && this.getLetter(x + length, y) !== null) return false
    } else {
      if (y > 0 && this.getLetter(x, y - 1) !== null) return false
      if (y + length < this.size && this.getLetter(x, y + length) !== null) return false
    }

    return true
  }

  /**
   * Checks if cells perpendicular to a position are clear
   * (prevents accidental word formation)
   */
  private checkPerpendicularClear(x: number, y: number, direction: Direction): boolean {
    if (direction === 'horizontal') {
      // Check above and below
      const above = y > 0 ? this.getLetter(x, y - 1) : null
      const below = y < this.size - 1 ? this.getLetter(x, y + 1) : null
      return above === null && below === null
    } else {
      // Check left and right
      const left = x > 0 ? this.getLetter(x - 1, y) : null
      const right = x < this.size - 1 ? this.getLetter(x + 1, y) : null
      return left === null && right === null
    }
  }

  /**
   * Places a word in the grid
   *
   * @param word - The word to place
   * @param x - Starting X coordinate
   * @param y - Starting Y coordinate
   * @param direction - Placement direction
   * @returns The placed word data, or null if placement failed
   */
  placeWord(
    word: Word,
    x: number,
    y: number,
    direction: Direction
  ): PlacedWordInternal | null {
    // Validate placement
    if (!this.canPlaceWord(word, x, y, direction)) {
      return null
    }

    // Find crossing points with existing words
    const crossings: PlacedWordInternal['crossings'] = []

    for (let i = 0; i < word.term.length; i++) {
      const cellX = direction === 'horizontal' ? x + i : x
      const cellY = direction === 'horizontal' ? y : y + i
      const cell = this.getCell(cellX, cellY)

      // Safety check - should never happen if canPlaceWord worked correctly
      if (!cell) {
        console.error(`[Grid] Cell out of bounds at (${cellX}, ${cellY}) for word "${word.term}"`)
        return null
      }

      const letter = word.term[i]

      // If this position already has a letter, it's a crossing
      if (cell.letter === letter) {
        // Find which word(s) this crosses
        cell.wordIds.forEach(otherWordId => {
          const otherWord = this.placedWords.get(otherWordId)
          if (otherWord) {
            // Calculate position in other word
            let otherPosition: number
            if (otherWord.direction === 'horizontal') {
              otherPosition = cellX - otherWord.x
            } else {
              otherPosition = cellY - otherWord.y
            }

            crossings.push({
              position: i,
              otherWordId: otherWord.id,
              otherWordPosition: otherPosition,
            })

            // Mark the crossing in the other word too
            otherWord.crossings.push({
              position: otherPosition,
              otherWordId: word.id,
              otherWordPosition: i,
            })
          }
        })
      }

      // Place the letter
      cell.letter = letter
      cell.wordIds.add(word.id)
    }

    // Create placed word record
    const placedWord: PlacedWordInternal = {
      id: word.id,
      word: word.term,
      clue: word.translation,
      x,
      y,
      direction,
      number: this.nextClueNumber++,
      crossings,
      wordId: word.id,
      usedInCrossing: new Set(crossings.map(c => c.position)),
    }

    this.placedWords.set(word.id, placedWord)
    return placedWord
  }

  /**
   * Removes a word from the grid (for backtracking if needed)
   *
   * @param wordId - ID of the word to remove
   * @returns true if word was removed
   */
  removeWord(wordId: string): boolean {
    const placedWord = this.placedWords.get(wordId)
    if (!placedWord) return false

    const { x, y, direction, word } = placedWord

    // Remove letters from grid
    for (let i = 0; i < word.length; i++) {
      const cellX = direction === 'horizontal' ? x + i : x
      const cellY = direction === 'horizontal' ? y : y + i
      const cell = this.getCell(cellX, cellY)

      if (!cell) {
        console.error(`[Grid] Cell out of bounds during removal at (${cellX}, ${cellY})`)
        continue
      }

      cell.wordIds.delete(wordId)

      // Only clear letter if no other words use this cell
      if (cell.wordIds.size === 0) {
        cell.letter = null
      }
    }

    // Remove crossings from other words
    placedWord.crossings.forEach(crossing => {
      const otherWord = this.placedWords.get(crossing.otherWordId)
      if (otherWord) {
        otherWord.crossings = otherWord.crossings.filter(
          c => c.otherWordId !== wordId
        )
      }
    })

    this.placedWords.delete(wordId)
    return true
  }

  /**
   * Exports the grid to a 2D array format (for Puzzle type)
   */
  exportGrid(): (string | null)[][] {
    return this.cells.map(row =>
      row.map(cell => cell.letter)
    )
  }

  /**
   * Calculates the actual used bounds of the grid
   * Returns the minimum bounding box containing all placed words
   */
  getUsedBounds(): { minX: number; maxX: number; minY: number; maxY: number } {
    let minX = this.size
    let maxX = 0
    let minY = this.size
    let maxY = 0

    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (this.cells[y][x].letter !== null) {
          minX = Math.min(minX, x)
          maxX = Math.max(maxX, x)
          minY = Math.min(minY, y)
          maxY = Math.max(maxY, y)
        }
      }
    }

    return { minX, maxX, minY, maxY }
  }

  /**
   * Creates a compact grid containing only the used area
   * Useful for final puzzle output
   */
  createCompactGrid(): { grid: (string | null)[][]; size: number } {
    const bounds = this.getUsedBounds()
    const width = bounds.maxX - bounds.minX + 1
    const height = bounds.maxY - bounds.minY + 1
    const size = Math.max(width, height)

    const compactGrid: (string | null)[][] = []

    for (let y = bounds.minY; y <= bounds.maxY; y++) {
      const row: (string | null)[] = []
      for (let x = bounds.minX; x <= bounds.maxX; x++) {
        row.push(this.cells[y][x].letter)
      }
      compactGrid.push(row)
    }

    return { grid: compactGrid, size }
  }

  /**
   * Counts filled cells in the grid
   */
  getFilledCellCount(): number {
    let count = 0
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (this.cells[y][x].letter !== null) {
          count++
        }
      }
    }
    return count
  }

  /**
   * Calculates grid density (filled cells / total cells)
   */
  getDensity(): number {
    const filled = this.getFilledCellCount()
    const total = this.size * this.size
    return filled / total
  }

  /**
   * Creates a visual representation of the grid for debugging
   */
  toString(): string {
    const lines: string[] = []

    for (let y = 0; y < this.size; y++) {
      const row = this.cells[y]
        .map(cell => cell.letter || '·')
        .join(' ')
      lines.push(row)
    }

    return lines.join('\n')
  }

  /**
   * Clones the grid for testing different placements
   */
  clone(): Grid {
    const newGrid = new Grid(this.size)

    // Copy all placed words
    this.placedWords.forEach((word) => {
      newGrid.placeWord(
        { id: word.wordId, term: word.word, translation: word.clue } as Word,
        word.x,
        word.y,
        word.direction
      )
    })

    return newGrid
  }
}
