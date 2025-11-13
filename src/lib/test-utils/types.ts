/**
 * @fileoverview Type definitions for test utilities and mock data
 * @module lib/test-utils/types
 */

import type { Word } from '@/types'

/**
 * Simplified word structure for test data
 * Can be converted to full Word type with generated IDs
 */
export interface TestWord {
  term: string
  translation: string
  definition?: string
  exampleSentence?: string
}

/**
 * Word difficulty categories for testing
 */
export type WordDifficulty = 'easy' | 'medium' | 'hard' | 'mixed'

/**
 * Configuration for mock SRS word selection
 */
export interface MockSRSConfig {
  minWords: number
  maxWords: number
  difficulty?: WordDifficulty
}

/**
 * Test word dataset with metadata
 */
export interface WordDataset {
  name: string
  difficulty: WordDifficulty
  description: string
  words: TestWord[]
}
