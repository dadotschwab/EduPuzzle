/**
 * Word placement logic for crossword puzzle generation
 * Adapted for Deno Edge Functions
 */

import type { Word, PlacementOption, Direction, CrossingPoint, PlacedWordInternal } from './types.ts'
import { Grid } from './grid.ts'

export function findPlacements(word: Word, grid: Grid): PlacementOption[] {
  const placedWords = grid.getPlacedWords()

  // If grid is empty, place first word in center
  if (placedWords.length === 0) {
    return getFirstWordPlacements(word, grid)
  }

  // Find all possible crossings with existing words
  return findCrossingPlacements(word, grid, placedWords)
}

function getFirstWordPlacements(word: Word, grid: Grid): PlacementOption[] {
  const gridSize = grid.getSize()
  const wordLength = word.term.length

  // Center the word horizontally in the middle of the grid
  const y = Math.floor(gridSize / 2)
  const x = Math.floor((gridSize - wordLength) / 2)

  const placements: PlacementOption[] = []

  // Horizontal placement
  if (grid.canPlaceWord(word, x, y, 'horizontal')) {
    placements.push({
      word,
      x,
      y,
      direction: 'horizontal',
      score: 100,
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
    score: 0,
    crossings: [crossing],
  }
}
