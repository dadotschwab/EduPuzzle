/**
 * Scoring system for evaluating word placements
 * Adapted for Deno Edge Functions
 */

import type { PlacementOption, ScoringWeights } from './types.ts'
import { Grid } from './grid.ts'

const LETTER_SCORES: Record<string, number> = {
  'E': 1, 'T': 1, 'A': 1, 'O': 1, 'I': 1, 'N': 1, 'S': 1, 'H': 1, 'R': 1,
  'D': 2, 'L': 2, 'C': 2, 'U': 2, 'M': 2, 'W': 2, 'F': 2, 'G': 2, 'Y': 2, 'P': 2, 'B': 2,
  'V': 3, 'K': 3,
  'J': 5, 'X': 5, 'Q': 5, 'Z': 5,
}

function getLetterScore(letter: string): number {
  return LETTER_SCORES[letter.toUpperCase()] || 1
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  crossingCount: 100,
  gridDensity: 50,
  letterRarity: 10,
  symmetry: 25,
  boundingBoxPenalty: 15,
}

export function scorePlacement(
  placement: PlacementOption,
  grid: Grid,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): number {
  let score = 0

  // 1. Crossing count score
  const crossingScore = placement.crossings.length * weights.crossingCount
  score += crossingScore

  // 2. Grid density score
  const densityScore = calculateDensityScore(placement, grid) * weights.gridDensity
  score += densityScore

  // 3. Letter rarity score
  const rarityScore = calculateRarityScore(placement) * weights.letterRarity
  score += rarityScore

  // 4. Center proximity score
  const centerScore = calculateCenterScore(placement, grid) * weights.symmetry
  score += centerScore

  // 5. Bounding box penalty
  const boundingBoxPenalty = calculateBoundingBoxPenalty(placement, grid) * weights.boundingBoxPenalty
  score -= boundingBoxPenalty

  return score
}

function getFilledCells(grid: Grid): Array<{ x: number; y: number }> {
  const gridSize = grid.getSize()
  const filled: Array<{ x: number; y: number }> = []

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if (grid.getLetter(x, y) !== null) {
        filled.push({ x, y })
      }
    }
  }

  return filled
}

function calculateDensityScore(placement: PlacementOption, grid: Grid): number {
  const { x, y, direction, word } = placement
  const gridSize = grid.getSize()
  const filledCells = getFilledCells(grid)

  if (filledCells.length === 0) return 0

  let totalDistance = 0

  for (const cell of filledCells) {
    const dist = getDistanceToWord(cell.x, cell.y, x, y, word.term.length, direction)
    totalDistance += dist
  }

  const avgDistance = totalDistance / filledCells.length
  const normalizedScore = 1 - (avgDistance / gridSize)
  return Math.max(0, normalizedScore)
}

function getDistanceToWord(
  px: number,
  py: number,
  wordX: number,
  wordY: number,
  wordLength: number,
  direction: 'horizontal' | 'vertical'
): number {
  let minDist = Infinity

  for (let i = 0; i < wordLength; i++) {
    const wx = direction === 'horizontal' ? wordX + i : wordX
    const wy = direction === 'horizontal' ? wordY : wordY + i

    const dist = Math.abs(px - wx) + Math.abs(py - wy)
    minDist = Math.min(minDist, dist)
  }

  return minDist
}

function calculateRarityScore(placement: PlacementOption): number {
  if (placement.crossings.length === 0) return 0

  let totalRarity = 0

  placement.crossings.forEach(crossing => {
    const letter = placement.word.term[crossing.position]
    const letterScore = getLetterScore(letter)
    totalRarity += letterScore
  })

  const avgRarity = totalRarity / placement.crossings.length
  return avgRarity / 5
}

function calculateCenterScore(placement: PlacementOption, grid: Grid): number {
  const gridSize = grid.getSize()
  const center = gridSize / 2

  const wordLength = placement.word.term.length
  let wordCenterX: number, wordCenterY: number

  if (placement.direction === 'horizontal') {
    wordCenterX = placement.x + wordLength / 2
    wordCenterY = placement.y
  } else {
    wordCenterX = placement.x
    wordCenterY = placement.y + wordLength / 2
  }

  const distFromCenter = Math.sqrt(
    Math.pow(wordCenterX - center, 2) + Math.pow(wordCenterY - center, 2)
  )

  const maxDist = Math.sqrt(2 * Math.pow(gridSize / 2, 2))
  const normalizedScore = 1 - (distFromCenter / maxDist)

  return Math.max(0, normalizedScore)
}

function calculateBoundingBoxPenalty(placement: PlacementOption, grid: Grid): number {
  const placedWords = grid.getPlacedWords()

  if (placedWords.length === 0) {
    return 0
  }

  let currentMinX = Infinity
  let currentMinY = Infinity
  let currentMaxX = -Infinity
  let currentMaxY = -Infinity

  placedWords.forEach(word => {
    const startX = word.x
    const startY = word.y
    const endX = word.direction === 'horizontal' ? word.x + word.word.length - 1 : word.x
    const endY = word.direction === 'vertical' ? word.y + word.word.length - 1 : word.y

    currentMinX = Math.min(currentMinX, startX)
    currentMinY = Math.min(currentMinY, startY)
    currentMaxX = Math.max(currentMaxX, endX)
    currentMaxY = Math.max(currentMaxY, endY)
  })

  const newMinX = Math.min(currentMinX, placement.x)
  const newMinY = Math.min(currentMinY, placement.y)
  const newMaxX = Math.max(
    currentMaxX,
    placement.direction === 'horizontal' ? placement.x + placement.word.term.length - 1 : placement.x
  )
  const newMaxY = Math.max(
    currentMaxY,
    placement.direction === 'vertical' ? placement.y + placement.word.term.length - 1 : placement.y
  )

  const currentWidth = currentMaxX - currentMinX + 1
  const currentHeight = currentMaxY - currentMinY + 1
  const newWidth = newMaxX - newMinX + 1
  const newHeight = newMaxY - newMinY + 1

  const widthExpansion = (newWidth - currentWidth) / currentWidth
  const heightExpansion = (newHeight - currentHeight) / currentHeight

  const penalty = Math.max(0, Math.max(widthExpansion, heightExpansion))

  return penalty
}

export function getBestPlacement(
  placements: PlacementOption[],
  grid: Grid,
  weights?: ScoringWeights
): PlacementOption | null {
  if (placements.length === 0) return null

  // Score each placement
  const scored = placements.map(placement => ({
    ...placement,
    score: scorePlacement(placement, grid, weights)
  }))

  // Sort by score (descending)
  scored.sort((a, b) => b.score - a.score)

  return scored[0]
}
