/**
 * @fileoverview Central export for all word bank datasets
 * @module lib/test-utils/wordBanks
 */

import type { WordDataset } from '../types'
import { EASY_WORDS } from './easy'
import { MEDIUM_WORDS } from './medium'
import { HARD_WORDS } from './hard'

/**
 * Easy difficulty dataset metadata
 */
export const EASY_DATASET: WordDataset = {
  name: 'Easy Words',
  difficulty: 'easy',
  description: 'High crossing potential with common letters (E, A, R, T, I, O, N, S)',
  words: EASY_WORDS
}

/**
 * Medium difficulty dataset metadata
 */
export const MEDIUM_DATASET: WordDataset = {
  name: 'Medium Words',
  difficulty: 'medium',
  description: 'Balanced letter distribution with varied word lengths',
  words: MEDIUM_WORDS
}

/**
 * Hard difficulty dataset metadata
 */
export const HARD_DATASET: WordDataset = {
  name: 'Hard Words',
  difficulty: 'hard',
  description: 'Challenging words with rare letters (Q, X, Z, J, K, V, W)',
  words: HARD_WORDS
}

/**
 * Mixed difficulty dataset combining all levels
 */
export const MIXED_DATASET: WordDataset = {
  name: 'Mixed Words',
  difficulty: 'mixed',
  description: 'Combination of easy, medium, and hard words for realistic testing',
  words: [
    ...EASY_WORDS.slice(0, 80),
    ...MEDIUM_WORDS.slice(0, 90),
    ...HARD_WORDS.slice(0, 80)
  ]
}

/**
 * All available datasets indexed by difficulty
 */
export const DATASETS = {
  easy: EASY_DATASET,
  medium: MEDIUM_DATASET,
  hard: HARD_DATASET,
  mixed: MIXED_DATASET
} as const

/**
 * Export individual word banks for direct access
 */
export { EASY_WORDS, MEDIUM_WORDS, HARD_WORDS }

/**
 * Get dataset by difficulty level
 * @param difficulty - The difficulty level to retrieve
 * @returns The corresponding word dataset
 */
export function getDataset(difficulty: 'easy' | 'medium' | 'hard' | 'mixed'): WordDataset {
  return DATASETS[difficulty]
}

/**
 * Get all datasets as an array
 * @returns Array of all word datasets
 */
export function getAllDatasets(): WordDataset[] {
  return Object.values(DATASETS)
}
