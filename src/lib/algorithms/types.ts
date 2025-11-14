/**
 * @fileoverview Type definitions for crossword puzzle generation algorithm
 *
 * Internal types used during puzzle construction. These differ from the public
 * Puzzle types as they track additional metadata needed during generation.
 *
 * @module lib/algorithms/types
 */

import type { Word, PlacedWord, Puzzle } from '@/types'

/**
 * Direction a word can be placed in the grid
 */
export type Direction = 'horizontal' | 'vertical'

/**
 * Represents a cell in the crossword grid
 */
export interface GridCell {
  letter: string | null
  wordIds: Set<string>  // IDs of words using this cell
  isBlocked: boolean     // True if cell cannot be used
}

/**
 * Position in the grid (0-indexed)
 */
export interface Position {
  x: number
  y: number
}

/**
 * A potential placement option for a word
 */
export interface PlacementOption {
  word: Word
  x: number
  y: number
  direction: Direction
  score: number              // Higher is better
  crossings: CrossingPoint[] // Where this placement crosses existing words
}

/**
 * Point where two words intersect (extends Crossing with grid coordinates)
 */
export interface CrossingPoint {
  position: number           // Position in the current word (0-indexed)
  otherWordId: string       // ID of the word being crossed
  otherWordPosition: number // Position in the other word (0-indexed)
  gridX: number             // Grid X coordinate of crossing
  gridY: number             // Grid Y coordinate of crossing
}

/**
 * Internal representation of a placed word during generation
 * Contains all PlacedWord properties plus additional tracking data
 */
export interface PlacedWordInternal {
  id: string
  word: string
  clue: string
  x: number
  y: number
  direction: Direction
  number: number
  crossings: Array<{
    position: number
    otherWordId: string
    otherWordPosition: number
  }>
  wordId: string            // Original Word ID for reference
  usedInCrossing: Set<number> // Which positions are used in crossings
}

/**
 * Letter frequency data for scoring
 */
export interface LetterFrequency {
  letter: string
  frequency: number
  score: number  // Derived score (rare letters = higher score)
}

/**
 * Configuration for puzzle generation
 */
export interface GenerationConfig {
  maxGridSize: number       // Maximum grid dimensions (e.g., 25)
  minGridSize: number       // Minimum grid dimensions (e.g., 10)
  timeoutMs: number         // Generation timeout in milliseconds
  minCrossingsPerWord: number // Minimum crossings to attempt
  maxAttemptsPerWord: number  // Max placement attempts per word
}

/**
 * Default generation configuration
 */
export const DEFAULT_CONFIG: GenerationConfig = {
  maxGridSize: 25,
  minGridSize: 10,
  timeoutMs: 5000,
  minCrossingsPerWord: 1,
  maxAttemptsPerWord: 100,
}

/**
 * Result of a generation attempt
 */
export interface GenerationResult {
  success: boolean
  puzzle?: Puzzle
  placedWords: PlacedWordInternal[]
  unplacedWords: Word[]
  gridSize: number
  timeElapsed: number
  attemptsMade: number
}

/**
 * Scoring weights for placement evaluation
 */
export interface ScoringWeights {
  crossingCount: number     // Weight for number of crossings
  gridDensity: number       // Weight for compact placement
  letterRarity: number      // Weight for rare letter usage
  symmetry: number          // Weight for symmetric placement
  boundingBoxPenalty: number // Weight for penalizing bounding box expansion
}

/**
 * Default scoring weights
 */
export const DEFAULT_WEIGHTS: ScoringWeights = {
  crossingCount: 100,
  gridDensity: 50,
  letterRarity: 10,
  symmetry: 25,
  boundingBoxPenalty: 15,
}
