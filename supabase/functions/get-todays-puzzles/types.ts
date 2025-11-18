/**
 * Type definitions for crossword puzzle generation algorithm
 * Adapted for Deno Edge Functions
 */

/**
 * Word to be placed in puzzle
 */
export interface Word {
  id: string
  listId: string
  term: string
  translation: string
  definition?: string
  exampleSentence?: string
  createdAt: string
}

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
 * Crossing point between two words
 */
export interface CrossingPoint {
  position: number           // Position in the current word (0-indexed)
  otherWordId: string       // ID of the word being crossed
  otherWordPosition: number // Position in the other word (0-indexed)
  gridX: number             // Grid X coordinate of crossing
  gridY: number             // Grid Y coordinate of crossing
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
 * Internal representation of a placed word during generation
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
 * Public crossing format (for client)
 */
export interface Crossing {
  position: number
  otherWordId: string
  otherWordPosition: number
}

/**
 * Public placed word format (for client)
 */
export interface PlacedWord {
  id: string
  word: string
  clue: string
  x: number
  y: number
  direction: Direction
  number: number
  crossings: Crossing[]
}

/**
 * Complete puzzle structure
 */
export interface Puzzle {
  id: string
  gridSize: number
  placedWords: PlacedWord[]
  grid: (string | null)[][]
}

/**
 * Configuration for puzzle generation
 */
export interface GenerationConfig {
  maxGridSize: number       // Maximum grid dimensions (e.g., 16)
  minGridSize: number       // Minimum grid dimensions (e.g., 10)
  timeoutMs: number         // Generation timeout in milliseconds
  minCrossingsPerWord: number // Minimum crossings to attempt
  maxAttemptsPerWord: number  // Max placement attempts per word
  seed?: string             // Deterministic seed for reproducibility
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
 * Word cluster with metadata
 */
export interface WordCluster {
  words: Word[]
  score: number              // Overall cluster quality
  avgLetterOverlap: number   // Average shared letters between words
  difficulty: 'easy' | 'medium' | 'hard'
}

/**
 * Configuration for clustering
 */
export interface ClusterConfig {
  minClusterSize: number     // Minimum words per cluster
  maxClusterSize: number     // Maximum words per cluster
  targetClusterSize: number  // Ideal cluster size
  minOverlap: number         // Minimum shared letters to consider
}
