/**
 * Grid data structure for crossword puzzle construction
 * Adapted for Deno Edge Functions
 */

import type { GridCell, Direction, PlacedWordInternal, Word } from './types.ts'

/**
 * Grid manager for crossword puzzle construction
 */
export class Grid {
  private cells: GridCell[][]
  private size: number
  private placedWords: Map<string, PlacedWordInternal>
  private nextClueNumber: number

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

  getSize(): number {
    return this.size
  }

  getPlacedWords(): PlacedWordInternal[] {
    return Array.from(this.placedWords.values())
  }

  getPlacedWordCount(): number {
    return this.placedWords.size
  }

  isInBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.size && y >= 0 && y < this.size
  }

  getLetter(x: number, y: number): string | null {
    if (!this.isInBounds(x, y)) return null
    return this.cells[y][x].letter
  }

  getCell(x: number, y: number): GridCell | null {
    if (!this.isInBounds(x, y)) return null
    return this.cells[y][x]
  }

  isEmpty(x: number, y: number): boolean {
    if (!this.isInBounds(x, y)) return false
    return this.cells[y][x].letter === null
  }

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

      if (!cell) {
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

  exportGrid(): (string | null)[][] {
    return this.cells.map(row =>
      row.map(cell => cell.letter)
    )
  }

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
}
