/**
 * @fileoverview Core TypeScript type definitions for EDU-PUZZLE
 *
 * This file contains all the domain models and interfaces used throughout
 * the application, including:
 * - Word and WordList types for vocabulary management
 * - Crossword puzzle types (Puzzle, PlacedWord, Crossing)
 * - Spaced Repetition System types (WordProgress, ReviewType)
 * - Session tracking types (PuzzleSession, WordReview)
 *
 * @module types
 */

// ============================================================================
// Spaced Repetition System Types
// ============================================================================

/**
 * SRS learning stages based on SM-2 algorithm
 * Determines review intervals and progression through the learning curve
 * New → Learning → Young → Mature / Relearning
 */
export enum SRSStage {
  New = 0,         // Never studied
  Learning = 1,    // Recently introduced (1-3 days)
  Young = 2,       // Passed initial learning (1-4 weeks)
  Mature = 3,      // Well-known (1+ months)
  Relearning = 4   // Was mature but failed, back to learning
}

/**
 * Represents the performance level of a user on a specific word
 * Used by the SRS engine to determine the next review interval
 */
export type ReviewType = 'perfect' | 'half_known' | 'conditional' | 'unknown' | 'not_evaluated'

/**
 * Tracks a user's progress for a specific word in the SRS system
 * Enhanced with SM-2 algorithm fields for optimal spaced repetition
 */
export interface WordProgress {
  id: string
  userId: string
  wordId: string
  stage: SRSStage                // Learning stage (0-4)
  easeFactor: number             // SM-2 ease factor (1.3-2.5)
  intervalDays: number           // Days between reviews
  nextReviewDate: string         // ISO date string for next review
  lastReviewedAt?: string        // Last time this word was reviewed
  totalReviews: number           // Total number of reviews
  correctReviews: number         // Number of correct reviews
  incorrectReviews: number       // Number of incorrect reviews
  currentStreak: number          // Consecutive correct answers
  updatedAt?: string             // Last update timestamp
}

// ============================================================================
// Vocabulary Management Types
// ============================================================================

/**
 * Represents a single vocabulary word with translation and example
 */
export interface Word {
  id: string
  listId: string
  term: string                  // The word to learn (e.g., "Apple")
  translation: string           // Translation or definition (e.g., "A fruit")
  definition?: string           // Optional detailed definition
  exampleSentence?: string      // Optional example usage
  createdAt: string
}

/**
 * Word with its SRS progress data and language information
 * Used for displaying words with their learning status and for today's puzzles
 */
export interface WordWithProgress extends Word {
  source_language: string        // Language being learned
  target_language: string        // User's native language
  progress?: WordProgress        // Optional SRS progress data
}

/**
 * Summary of due words grouped by language pair
 * Used for generating today's puzzles
 */
export interface DueWordsSummary {
  languagePair: string           // e.g., "en-de"
  sourceLanguage: string
  targetLanguage: string
  totalDue: number
  byList: Array<{
    listId: string
    listName: string
    wordCount: number
    words: WordWithProgress[]
  }>
}

/**
 * Represents a collection of vocabulary words
 */
export interface WordList {
  id: string
  user_id: string
  name: string
  source_language: string        // Language being learned
  target_language: string        // User's native language
  created_at: string
  updated_at: string
}

// ============================================================================
// Crossword Puzzle Types
// ============================================================================

/**
 * Represents where one word crosses another in the puzzle grid
 */
export interface Crossing {
  position: number              // Position in current word (0-indexed)
  otherWordId: string          // ID of the word that crosses this one
  otherWordPosition: number    // Position in the other word (0-indexed)
}

/**
 * A word that has been placed in the crossword grid
 */
export interface PlacedWord {
  id: string
  word: string                  // The actual word text
  clue: string                  // The clue shown to the user (translation)
  x: number                     // Starting X coordinate in grid
  y: number                     // Starting Y coordinate in grid
  direction: 'horizontal' | 'vertical'
  number: number                // Clue number (1, 2, 3, etc.)
  crossings: Crossing[]         // All crossing points with other words
}

/**
 * The complete crossword puzzle with grid and placed words
 */
export interface Puzzle {
  id: string
  gridSize: number              // Grid dimensions (e.g., 15 = 15x15 grid)
  placedWords: PlacedWord[]     // All words placed in the puzzle
  grid: (string | null)[][]     // 2D array of letters (null = empty cell)
}

// ============================================================================
// Session and Review Types
// ============================================================================

/**
 * A puzzle solving session tracking user progress
 */
export interface PuzzleSession {
  id: string
  userId: string
  listId?: string               // Optional: the word list this puzzle is from
  startedAt: string
  completedAt?: string
  puzzleData: Puzzle[]          // Array of puzzles in this session
  totalWords: number
  correctWords: number
}

/**
 * Records how a user performed on a specific word during a puzzle session
 */
export interface WordReview {
  id: string
  sessionId: string
  wordId: string
  userId: string
  reviewType: ReviewType        // Performance rating for SRS
  timeToSolve?: number          // Time in seconds
  hintsUsed: number             // Number of hints/reveals used
  reviewedAt: string
}

/**
 * Extended user type with subscription information
 */
export interface User {
  id: string
  email: string
  createdAt: string
  subscriptionStatus: 'trial' | 'active' | 'cancelled' | 'expired'
  subscriptionEndDate?: string
  trialEndDate: string
}
