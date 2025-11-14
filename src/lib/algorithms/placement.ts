/**
 * @fileoverview Word placement logic for crossword puzzle generation
 *
 * Handles finding valid placement positions for words, including:
 * - First word placement (center of grid)
 * - Crossing detection (finding where words can intersect)
 * - Placement option generation
 *
 * @module lib/algorithms/placement
 */

import type { Word } from '@/types'
import type { PlacementOption, Direction, CrossingPoint, PlacedWordInternal } from './types'
import { Grid } from './grid'

/**
 * Finds all possible placements for a word in the grid
 *
 * @param word - The word to place
 * @param grid - The current grid state
 * @returns Array of valid placement options
 */
export function findPlacements(word: Word, grid: Grid): PlacementOption[] {
  const placedWords = grid.getPlacedWords()

  // If grid is empty, place first word in center
  if (placedWords.length === 0) {
    return getFirstWordPlacements(word, grid)
  }

  // Find all possible crossings with existing words
  return findCrossingPlacements(word, grid, placedWords)
}

/**
 * Generates placement options for the first word
 * Places horizontally in the center of the grid
 *
 * @param word - The word to place
 * @param grid - The empty grid
 * @returns Array with single centered placement
 */
function getFirstWordPlacements(word: Word, grid: Grid): PlacementOption[] {
  const gridSize = grid.getSize()
  const wordLength = word.term.length

  // Center the word horizontally in the middle of the grid
  const y = Math.floor(gridSize / 2)
  const x = Math.floor((gridSize - wordLength) / 2)

  // Also try vertical placement
  const placements: PlacementOption[] = []

  // Horizontal placement
  if (grid.canPlaceWord(word, x, y, 'horizontal')) {
    placements.push({
      word,
      x,
      y,
      direction: 'horizontal',
      score: 100, // Base score for first word
      crossings: [],
    })
  }

  // Vertical placement
  if (grid.canPlaceWord(word, y, x, 'vertical')) {
    placements.push({
      word,
      x: y,
      y: x,
      direction: 'vertical',
      score: 100,
      crossings: [],
    })
  }

  return placements
}

/**
 * Finds all valid placements that cross existing words
 *
 * @param word - The word to place
 * @param grid - The current grid
 * @param placedWords - Words already in the grid
 * @returns Array of crossing placement options
 */
function findCrossingPlacements(
  word: Word,
  grid: Grid,
  placedWords: PlacedWordInternal[]
): PlacementOption[] {
  const placements: PlacementOption[] = []

  // Try crossing with each placed word
  for (const placedWord of placedWords) {
    const crossingPlacements = findCrossingsWithWord(word, placedWord, grid)
    placements.push(...crossingPlacements)
  }

  return placements
}

/**
 * Finds all ways a word can cross a specific placed word
 *
 * @param word - The word to place
 * @param placedWord - The word already in the grid
 * @param grid - The current grid
 * @returns Array of valid crossing placements
 */
function findCrossingsWithWord(
  word: Word,
  placedWord: PlacedWordInternal,
  grid: Grid
): PlacementOption[] {
  const placements: PlacementOption[] = []
  const wordTerm = word.term
  const placedTerm = placedWord.word

  // Find shared letters between the two words
  for (let i = 0; i < wordTerm.length; i++) {
    const letter = wordTerm[i]

    for (let j = 0; j < placedTerm.length; j++) {
      if (placedTerm[j] === letter) {
        // Found a matching letter - try placing here
        const placement = calculateCrossingPlacement(
          word,
          i,
          placedWord,
          j,
          grid
        )

        if (placement) {
          placements.push(placement)
        }
      }
    }
  }

  return placements
}

/**
 * Calculates the grid position for a crossing placement
 *
 * @param word - The word to place
 * @param wordPos - Position of crossing letter in new word
 * @param placedWord - The existing word
 * @param placedPos - Position of crossing letter in existing word
 * @param grid - The current grid
 * @returns Placement option if valid, null otherwise
 */
function calculateCrossingPlacement(
  word: Word,
  wordPos: number,
  placedWord: PlacedWordInternal,
  placedPos: number,
  grid: Grid
): PlacementOption | null {
  // Calculate crossing point in grid coordinates
  let crossX: number, crossY: number

  if (placedWord.direction === 'horizontal') {
    crossX = placedWord.x + placedPos
    crossY = placedWord.y
  } else {
    crossX = placedWord.x
    crossY = placedWord.y + placedPos
  }

  // Calculate start position of new word
  // New word must be perpendicular to placed word
  const newDirection: Direction =
    placedWord.direction === 'horizontal' ? 'vertical' : 'horizontal'

  let startX: number, startY: number

  if (newDirection === 'horizontal') {
    startX = crossX - wordPos
    startY = crossY
  } else {
    startX = crossX
    startY = crossY - wordPos
  }

  // Check if this placement is valid
  if (!grid.canPlaceWord(word, startX, startY, newDirection)) {
    return null
  }

  // Create crossing point record
  const crossing: CrossingPoint = {
    position: wordPos,
    otherWordId: placedWord.id,
    otherWordPosition: placedPos,
    gridX: crossX,
    gridY: crossY,
  }

  return {
    word,
    x: startX,
    y: startY,
    direction: newDirection,
    score: 0, // Will be calculated by scoring system
    crossings: [crossing],
  }
}
