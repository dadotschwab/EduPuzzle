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
 * SRS learning stages based on SM-2 algorithm with leaderboard scoring
 * Determines review intervals and progression through the learning curve
 * Extended to 7 stages (0-6) for leaderboard point system
 */
export enum SRSStage {
  New = 0, // Never studied (0 points)
  Learning = 1, // Recently introduced (1-3 days) (1 point)
  Young = 2, // Passed initial learning (1-4 weeks) (2 points)
  Mature = 3, // Well-known (1+ months) (4 points)
  Relearning = 4, // Was mature but failed, back to learning (7 points)
  Expert = 5, // Advanced mastery (12 points)
  Master = 6, // Complete mastery (20 points)
}

/**
 * Tracks a user's progress for a specific word in the SRS system
 * Enhanced with SM-2 algorithm fields for optimal spaced repetition
 */
export interface WordProgress {
  id: string
  userId: string | null
  wordId: string | null
  stage: SRSStage // Learning stage (0-4)
  easeFactor: number | null // SM-2 ease factor (1.3-2.5)
  intervalDays: number | null // Days between reviews
  nextReviewDate: string // ISO date string for next review
  lastReviewedAt?: string // Last time this word was reviewed
  totalReviews: number | null // Total number of reviews
  correctReviews: number | null // Number of correct reviews
  incorrectReviews: number | null // Number of incorrect reviews
  currentStreak: number | null // Consecutive correct answers
  updatedAt?: string // Last update timestamp
}

// ============================================================================
// Vocabulary Management Types
// ============================================================================

/**
 * Represents a single vocabulary word with translation and example
 */
export interface Word {
  id: string
  listId: string | null
  term: string // The word to learn (e.g., "Apple")
  translation: string // Translation or definition (e.g., "A fruit")
  definition?: string // Optional detailed definition
  exampleSentence?: string // Optional example usage
  createdAt: string | null
}

/**
 * Word with its SRS progress data and language information
 * Used for displaying words with their learning status and for today's puzzles
 */
export interface WordWithProgress extends Word {
  source_language: string // Language being learned
  target_language: string // User's native language
  progress?: WordProgress // Optional SRS progress data
}

/**
 * Represents a collection of vocabulary words
 */
export interface WordList {
  id: string
  user_id: string | null
  name: string
  source_language: string // Language being learned
  target_language: string // User's native language
  created_at: string | null
  updated_at: string | null
  wordCount?: number // Optional: included when fetched with counts
}

// ============================================================================
// Crossword Puzzle Types
// ============================================================================

/**
 * Represents where one word crosses another in the puzzle grid
 */
export interface Crossing {
  position: number // Position in current word (0-indexed)
  otherWordId: string // ID of the word that crosses this one
  otherWordPosition: number // Position in the other word (0-indexed)
}

/**
 * A word that has been placed in the crossword grid
 */
export interface PlacedWord {
  id: string
  word: string // The actual word text
  clue: string // The clue shown to the user (translation)
  x: number // Starting X coordinate in grid
  y: number // Starting Y coordinate in grid
  direction: 'horizontal' | 'vertical'
  number: number // Clue number (1, 2, 3, etc.)
  crossings: Crossing[] // All crossing points with other words
}

/**
 * The complete crossword puzzle with grid and placed words
 */
export interface Puzzle {
  id: string
  gridSize: number // Grid dimensions (e.g., 15 = 15x15 grid)
  placedWords: PlacedWord[] // All words placed in the puzzle
  grid: (string | null)[][] // 2D array of letters (null = empty cell)
}

// ============================================================================
// Session and Review Types
// ============================================================================

/**
 * A puzzle solving session tracking user progress
 */
export interface PuzzleSession {
  id: string
  userId: string | null
  listId?: string // Optional: the word list this puzzle is from
  startedAt: string | null
  completedAt?: string
  puzzleData: Puzzle[] // Array of puzzles in this session
  totalWords: number
  correctWords: number | null
}

// ============================================================================
// Word List Sharing Types
// ============================================================================

/**
 * Sharing modes for word lists
 */
export type ShareMode = 'copy' | 'collaborative'

/**
 * A shared word list with metadata
 */
export interface SharedList {
  id: string
  original_list_id: string
  share_token: string
  share_mode: ShareMode
  created_by: string
  created_at: string
  expires_at?: string | null
  is_active: boolean
  access_count: number
  last_accessed_at?: string | null
}

/**
 * A shared list with additional details for display
 */
export interface SharedListWithDetails extends SharedList {
  original_list: {
    id: string
    name: string
    source_language: string
    target_language: string
    wordCount: number
  }
}

/**
 * A collaborator on a shared list
 */
export interface Collaborator {
  id: string
  shared_list_id: string
  user_id: string
  joined_at: string | null
  role: 'owner' | 'member' | null
  user?: {
    id: string
    email: string
    full_name?: string
  }
  isOnline?: boolean
  // Leaderboard fields
  leaderboard_opted_in?: boolean
  cached_score?: number
  score_updated_at?: string
}

// ============================================================================
// Database Row Types (for direct Supabase queries)
// ============================================================================

/**
 * Raw word row from database
 */
export interface WordRow {
  id: string
  list_id: string
  term: string
  translation: string
  definition?: string | null
  example_sentence?: string | null
  created_at: string
}

/**
 * Raw word list row from database
 */
export interface WordListRow {
  id: string
  user_id: string
  name: string
  source_language: string
  target_language: string
  created_at: string
  updated_at: string
  is_shared?: boolean
  shared_at?: string | null
}

/**
 * Joined collaborator data from list_collaborators with shared_lists
 */
export interface JoinedCollaborativeList {
  shared_list_id: string
  role: string
  joined_at: string
  shared_list: {
    id: string
    original_list_id: string
    share_mode: string
    original_list?: WordListRow
  } | null
}

/**
 * Result from create_shared_list RPC
 */
export interface CreateSharedListResult {
  id: string
  share_token: string
}

// ============================================================================
// Collaborative Leaderboard Types
// ============================================================================

/**
 * Stage-based point values for leaderboard scoring
 * Extended SRS stages 0-6 with corresponding point values
 */
export enum LeaderboardPoints {
  New = 0, // Stage 0: 0 points
  Learning = 1, // Stage 1: 1 point
  Young = 2, // Stage 2: 2 points
  Mature = 4, // Stage 3: 4 points
  Relearning = 7, // Stage 4: 7 points
  Expert = 12, // Stage 5: 12 points
  Master = 20, // Stage 6: 20 points
}

/**
 * Leaderboard entry with ranking information
 */
export interface LeaderboardEntry {
  user_id: string
  user_email: string
  user_name?: string
  cached_score: number
  score_updated_at: string
  rank: number
}

/**
 * Leaderboard statistics for a collaborative list
 */
export interface LeaderboardStats {
  total_participants: number
  user_rank?: number
  user_score?: number
  top_score: number
  average_score: number
}

/**
 * Enhanced collaborator with leaderboard information
 */
export interface LeaderboardCollaborator extends Collaborator {
  leaderboard_opted_in: boolean
  cached_score: number
  score_updated_at: string
}
