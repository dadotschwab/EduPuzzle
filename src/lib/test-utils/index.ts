/**
 * @fileoverview Test utilities for crossword puzzle generation
 *
 * This module provides comprehensive testing infrastructure including:
 * - Mock word datasets (easy, medium, hard, mixed)
 * - Random word selection simulating SRS
 * - Pre-configured test scenarios
 * - Helper functions for analysis
 *
 * Usage Example:
 * ```typescript
 * import { generateMockSRSWords, EASY_DATASET, getStandardMixedScenario } from '@/lib/test-utils'
 *
 * // Generate random 30-50 words for testing
 * const mockWords = generateMockSRSWords(EASY_DATASET.words)
 *
 * // Or use a pre-configured scenario
 * const scenario = getStandardMixedScenario()
 * const puzzles = await generatePuzzles(scenario.words)
 * ```
 *
 * @module lib/test-utils
 */

// Export types
export type { TestWord, WordDifficulty, MockSRSConfig, WordDataset } from './types'
export type { TestScenario } from './scenarios'

// Export mock word utilities
export {
  generateMockSRSWords,
  generateFixedMockWords,
  testWordToWord,
  analyzeLetterFrequency,
  filterWordsByLength
} from './mockWords'

// Export word banks
export {
  EASY_DATASET,
  MEDIUM_DATASET,
  HARD_DATASET,
  MIXED_DATASET,
  DATASETS,
  EASY_WORDS,
  MEDIUM_WORDS,
  HARD_WORDS,
  getDataset,
  getAllDatasets
} from './wordBanks'

// Export test scenarios
export {
  getQuickTestScenario,
  getStandardEasyScenario,
  getStandardMediumScenario,
  getStandardHardScenario,
  getStandardMixedScenario,
  getLargeBatchScenario,
  getShortWordsScenario,
  getLongWordsScenario,
  getNoOverlapScenario,
  getHighOverlapScenario,
  getSingleWordScenario,
  getTwoWordsScenario,
  getRandomScenario,
  getAllScenarios,
  ALL_SCENARIOS
} from './scenarios'
