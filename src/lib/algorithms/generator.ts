/**
 * @fileoverview Main crossword puzzle generator
 *
 * Orchestrates the complete puzzle generation process:
 * 1. Sorts words by length (longest first for better placement)
 * 2. Creates grid and places words incrementally
 * 3. Uses scoring to choose optimal placements
 * 4. Validates connectivity throughout
 * 5. Returns complete puzzle ready for display
 *
 * @module lib/algorithms/generator
 */

import type { Word, Puzzle, PlacedWord, Crossing } from '@/types'
import type { GenerationConfig, GenerationResult, PlacedWordInternal } from './types'
import { Grid } from './grid'
import { findPlacements } from './placement'
import { getBestPlacement } from './scoring'
import { isConnected } from './connectivity'

/**
 * Default configuration for puzzle generation
 */
const DEFAULT_CONFIG: GenerationConfig = {
  maxGridSize: 25,
  minGridSize: 15,
  timeoutMs: 10000,
  minCrossingsPerWord: 1,
  maxAttemptsPerWord: 100,
}

/**
 * Generates a crossword puzzle from a list of words
 *
 * @param words - Array of words to place in the puzzle
 * @param config - Optional generation configuration
 * @returns Generated puzzle or null if generation failed
 *
 * @example
 * ```typescript
 * const words = generateMockSRSWords(EASY_DATASET.words)
 * const puzzle = await generatePuzzle(words)
 * ```
 */
export async function generatePuzzle(
  words: Word[],
  config: Partial<GenerationConfig> = {}
): Promise<Puzzle | null> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config }
  const startTime = performance.now()

  // Sort words by length (longest first - better for initial placement)
  const sortedWords = [...words].sort((a, b) => b.term.length - a.term.length)

  // Calculate initial grid size based on longest word
  const longestWord = sortedWords[0].term.length
  const initialGridSize = Math.max(
    fullConfig.minGridSize,
    Math.min(fullConfig.maxGridSize, longestWord * 2)
  )

  // Create grid
  const grid = new Grid(initialGridSize)

  // Track placement attempts
  let placedCount = 0
  let attempts = 0

  // Place words one by one
  for (const word of sortedWords) {
    if (attempts >= fullConfig.maxAttemptsPerWord * words.length) {
      console.warn('Max attempts reached, stopping generation')
      break
    }

    // Find all possible placements
    const placements = findPlacements(word, grid)

    if (placements.length === 0) {
      console.warn(`No valid placements found for word: ${word.term}`)
      continue
    }

    // Choose best placement using scoring
    const bestPlacement = getBestPlacement(placements, grid)

    if (!bestPlacement) {
      console.warn(`Could not score placements for word: ${word.term}`)
      continue
    }

    // Place the word
    const placed = grid.placeWord(
      word,
      bestPlacement.x,
      bestPlacement.y,
      bestPlacement.direction
    )

    if (placed) {
      placedCount++
      attempts = 0 // Reset attempts on successful placement
    } else {
      attempts++
    }
  }

  // Check if we placed enough words
  if (placedCount === 0) {
    console.error('Failed to place any words')
    return null
  }

  // Validate connectivity
  if (!isConnected(grid)) {
    console.warn('Warning: Generated puzzle has disconnected components')
  }

  // Convert to Puzzle format
  const puzzle = convertToPuzzle(grid)

  const endTime = performance.now()
  const timeElapsed = endTime - startTime

  console.log(`Generated puzzle in ${timeElapsed.toFixed(0)}ms`)
  console.log(`  Placed: ${placedCount}/${words.length} words`)
  console.log(`  Grid size: ${puzzle.gridSize}x${puzzle.gridSize}`)
  console.log(`  Connected: ${isConnected(grid)}`)

  return puzzle
}

/**
 * Converts internal grid representation to public Puzzle type
 */
function convertToPuzzle(grid: Grid): Puzzle {
  const placedWords = grid.getPlacedWords()

  // Convert internal PlacedWord format to public format
  const publicPlacedWords: PlacedWord[] = placedWords.map(word => {
    // Convert crossings format
    const crossings: Crossing[] = word.crossings.map(c => ({
      position: c.position,
      otherWordId: c.otherWordId,
      otherWordPosition: c.otherWordPosition,
    }))

    return {
      id: word.id,
      word: word.word,
      clue: word.clue,
      x: word.x,
      y: word.y,
      direction: word.direction,
      number: word.number,
      crossings,
    }
  })

  return {
    id: `puzzle-${Date.now()}`,
    gridSize: grid.getSize(),
    placedWords: publicPlacedWords,
    grid: grid.exportGrid(),
  }
}

/**
 * Generates multiple puzzles if needed to fit all words
 * (Future enhancement for handling large word sets)
 *
 * @param words - Words to place
 * @param config - Generation configuration
 * @returns Array of puzzles
 */
export async function generatePuzzles(
  words: Word[],
  config?: Partial<GenerationConfig>
): Promise<Puzzle[]> {
  // For now, just generate a single puzzle
  // Future: split into multiple puzzles if all words don't fit
  const puzzle = await generatePuzzle(words, config)

  if (!puzzle) {
    return []
  }

  return [puzzle]
}

/**
 * Generates a puzzle and returns detailed generation statistics
 *
 * @param words - Words to place
 * @param config - Generation configuration
 * @returns Generation result with statistics
 */
export async function generateWithStats(
  words: Word[],
  config?: Partial<GenerationConfig>
): Promise<GenerationResult> {
  const startTime = performance.now()

  const puzzle = await generatePuzzle(words, config)

  const endTime = performance.now()

  if (!puzzle) {
    return {
      success: false,
      placedWords: [],
      unplacedWords: words,
      gridSize: 0,
      timeElapsed: endTime - startTime,
      attemptsMade: 0,
    }
  }

  const placedWords: PlacedWordInternal[] = []
  const unplacedWordIds = new Set(words.map(w => w.id))

  puzzle.placedWords.forEach(pw => {
    unplacedWordIds.delete(pw.id)
    placedWords.push({
      ...pw,
      wordId: pw.id,
      usedInCrossing: new Set(pw.crossings.map(c => c.position)),
    })
  })

  const unplacedWords = words.filter(w => unplacedWordIds.has(w.id))

  return {
    success: true,
    puzzle,
    placedWords,
    unplacedWords,
    gridSize: puzzle.gridSize,
    timeElapsed: endTime - startTime,
    attemptsMade: 0, // Not tracked yet
  }
}

/**
 * Quick validation that a set of words can potentially form a puzzle
 * (Checks if words have shared letters)
 *
 * @param words - Words to validate
 * @returns true if words can potentially cross
 */
export function canFormPuzzle(words: Word[]): boolean {
  if (words.length === 0) return false
  if (words.length === 1) return true

  // Build letter frequency map
  const letterCounts = new Map<string, number>()

  words.forEach(word => {
    const letters = new Set(word.term.split(''))
    letters.forEach(letter => {
      letterCounts.set(letter, (letterCounts.get(letter) || 0) + 1)
    })
  })

  // Check if at least one letter appears in multiple words
  for (const count of letterCounts.values()) {
    if (count >= 2) return true
  }

  return false
}
