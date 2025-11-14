/**
 * @fileoverview Scoring system for evaluating word placements
 *
 * Evaluates placement quality based on:
 * - Number of crossings (more = better)
 * - Grid compactness (tighter = better)
 * - Letter rarity (rare letters in crossings = better)
 * - Position quality (center proximity)
 *
 * @module lib/algorithms/scoring
 */

import type { PlacementOption, ScoringWeights } from './types'
import type { Word } from '@/types'
import { Grid } from './grid'

/**
 * Letter frequency scores (based on English letter frequency)
 * Rare letters get higher scores
 */
const LETTER_SCORES: Record<string, number> = {
  // Very common (1 point)
  'E': 1, 'T': 1, 'A': 1, 'O': 1, 'I': 1, 'N': 1, 'S': 1, 'H': 1, 'R': 1,
  // Common (2 points)
  'D': 2, 'L': 2, 'C': 2, 'U': 2, 'M': 2, 'W': 2, 'F': 2, 'G': 2, 'Y': 2, 'P': 2, 'B': 2,
  // Uncommon (3 points)
  'V': 3, 'K': 3,
  // Rare (5 points)
  'J': 5, 'X': 5, 'Q': 5, 'Z': 5,
}

/**
 * Gets the rarity score for a letter
 */
function getLetterScore(letter: string): number {
  return LETTER_SCORES[letter.toUpperCase()] || 1
}

/**
 * Default scoring weights
 */
export const DEFAULT_WEIGHTS: ScoringWeights = {
  crossingCount: 100,   // Each crossing is very valuable
  gridDensity: 50,      // Compact placements are good
  letterRarity: 10,     // Slight bonus for rare letters
  symmetry: 25,         // Center proximity bonus (increased from 5)
  boundingBoxPenalty: 15, // Penalty for expanding puzzle bounds
}

/**
 * Scores a placement option
 *
 * @param placement - The placement to score
 * @param grid - The current grid state
 * @param weights - Scoring weights (optional)
 * @returns Numerical score (higher is better)
 */
export function scorePlacement(
  placement: PlacementOption,
  grid: Grid,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): number {
  let score = 0

  // 1. Crossing count score (most important)
  const crossingScore = placement.crossings.length * weights.crossingCount
  score += crossingScore

  // 2. Grid density score (compactness)
  const densityScore = calculateDensityScore(placement, grid) * weights.gridDensity
  score += densityScore

  // 3. Letter rarity score (bonus for rare letters in crossings)
  const rarityScore = calculateRarityScore(placement) * weights.letterRarity
  score += rarityScore

  // 4. Center proximity score (preference for center placement)
  const centerScore = calculateCenterScore(placement, grid) * weights.symmetry
  score += centerScore

  // 5. Bounding box penalty (penalize expanding the puzzle bounds)
  const boundingBoxPenalty = calculateBoundingBoxPenalty(placement, grid) * weights.boundingBoxPenalty
  score -= boundingBoxPenalty

  return score
}

/**
 * Calculates density score based on proximity to existing words
 * Tighter placement = higher score
 */
function calculateDensityScore(placement: PlacementOption, grid: Grid): number {
  const { x, y, direction, word } = placement
  const gridSize = grid.getSize()

  // Calculate average distance to filled cells
  let totalDistance = 0
  let filledCells = 0

  for (let gy = 0; gy < gridSize; gy++) {
    for (let gx = 0; gx < gridSize; gx++) {
      if (grid.getLetter(gx, gy) !== null) {
        // Calculate Manhattan distance to word
        const dist = getDistanceToWord(gx, gy, x, y, word.term.length, direction)
        totalDistance += dist
        filledCells++
      }
    }
  }

  if (filledCells === 0) return 0

  const avgDistance = totalDistance / filledCells

  // Invert so closer = higher score (max distance is ~grid size)
  const normalizedScore = 1 - (avgDistance / gridSize)
  return Math.max(0, normalizedScore)
}

/**
 * Calculates Manhattan distance from a point to a word
 */
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

/**
 * Calculates score based on letter rarity in crossings
 * Crossing at rare letters is slightly preferred
 */
function calculateRarityScore(placement: PlacementOption): number {
  if (placement.crossings.length === 0) return 0

  let totalRarity = 0

  placement.crossings.forEach(crossing => {
    const letter = placement.word.term[crossing.position]
    const letterScore = getLetterScore(letter)
    totalRarity += letterScore
  })

  // Average rarity across all crossings, normalized to 0-1
  const avgRarity = totalRarity / placement.crossings.length
  return avgRarity / 5 // Normalize (max letter score is 5)
}

/**
 * Calculates score based on proximity to grid center
 * Preference for centered placements
 */
function calculateCenterScore(placement: PlacementOption, grid: Grid): number {
  const gridSize = grid.getSize()
  const center = gridSize / 2

  // Calculate word center point
  const wordLength = placement.word.term.length
  let wordCenterX: number, wordCenterY: number

  if (placement.direction === 'horizontal') {
    wordCenterX = placement.x + wordLength / 2
    wordCenterY = placement.y
  } else {
    wordCenterX = placement.x
    wordCenterY = placement.y + wordLength / 2
  }

  // Distance from grid center
  const distFromCenter = Math.sqrt(
    Math.pow(wordCenterX - center, 2) + Math.pow(wordCenterY - center, 2)
  )

  // Normalize and invert (closer to center = higher score)
  const maxDist = Math.sqrt(2 * Math.pow(gridSize / 2, 2))
  const normalizedScore = 1 - (distFromCenter / maxDist)

  return Math.max(0, normalizedScore)
}

/**
 * Calculates penalty for expanding the current bounding box
 * Encourages keeping puzzle compact by penalizing placements that
 * significantly expand the puzzle's current bounds
 */
function calculateBoundingBoxPenalty(placement: PlacementOption, grid: Grid): number {
  const placedWords = grid.getPlacedWords()

  // If no words placed yet, no penalty
  if (placedWords.length === 0) {
    return 0
  }

  // Calculate current bounding box
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

  // Calculate what the bounding box would be with this placement
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

  // Calculate expansion in each dimension
  const currentWidth = currentMaxX - currentMinX + 1
  const currentHeight = currentMaxY - currentMinY + 1
  const newWidth = newMaxX - newMinX + 1
  const newHeight = newMaxY - newMinY + 1

  // Calculate expansion percentages
  const widthExpansion = (newWidth - currentWidth) / currentWidth
  const heightExpansion = (newHeight - currentHeight) / currentHeight

  // Use the maximum expansion as penalty (0 to 1 scale)
  // Words that keep the puzzle compact get lower penalty
  const penalty = Math.max(0, Math.max(widthExpansion, heightExpansion))

  return penalty
}

/**
 * Scores all placements and returns them sorted by score
 *
 * @param placements - Array of placement options
 * @param grid - Current grid state
 * @param weights - Optional custom weights
 * @returns Placements sorted by score (highest first)
 */
export function rankPlacements(
  placements: PlacementOption[],
  grid: Grid,
  weights?: ScoringWeights
): PlacementOption[] {
  // Score each placement
  const scored = placements.map(placement => ({
    ...placement,
    score: scorePlacement(placement, grid, weights)
  }))

  // Sort by score (descending)
  scored.sort((a, b) => b.score - a.score)

  return scored
}

/**
 * Gets the best placement from a list of options
 *
 * @param placements - Array of placement options
 * @param grid - Current grid state
 * @param weights - Optional custom weights
 * @returns Best placement option, or null if no options
 */
export function getBestPlacement(
  placements: PlacementOption[],
  grid: Grid,
  weights?: ScoringWeights
): PlacementOption | null {
  if (placements.length === 0) return null

  const ranked = rankPlacements(placements, grid, weights)
  return ranked[0]
}

/**
 * Analyzes and compares multiple placements
 * Useful for debugging and understanding scoring
 *
 * @param placements - Placements to analyze
 * @param grid - Current grid
 * @returns Analysis of each placement
 */
export function analyzePlacements(
  placements: PlacementOption[],
  grid: Grid
): Array<{
  placement: PlacementOption
  score: number
  breakdown: {
    crossings: number
    density: number
    rarity: number
    center: number
    boundingBoxPenalty: number
  }
}> {
  return placements.map(placement => {
    const crossingScore = placement.crossings.length * DEFAULT_WEIGHTS.crossingCount
    const densityScore = calculateDensityScore(placement, grid) * DEFAULT_WEIGHTS.gridDensity
    const rarityScore = calculateRarityScore(placement) * DEFAULT_WEIGHTS.letterRarity
    const centerScore = calculateCenterScore(placement, grid) * DEFAULT_WEIGHTS.symmetry
    const boundingBoxPenaltyScore = calculateBoundingBoxPenalty(placement, grid) * DEFAULT_WEIGHTS.boundingBoxPenalty

    return {
      placement,
      score: crossingScore + densityScore + rarityScore + centerScore - boundingBoxPenaltyScore,
      breakdown: {
        crossings: crossingScore,
        density: densityScore,
        rarity: rarityScore,
        center: centerScore,
        boundingBoxPenalty: boundingBoxPenaltyScore,
      }
    }
  })
}
