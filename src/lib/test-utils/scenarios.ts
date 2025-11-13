/**
 * @fileoverview Pre-configured test scenarios for puzzle generation
 *
 * Provides ready-to-use test cases for different scenarios:
 * - Quick tests with small word sets
 * - Stress tests with large word sets
 * - Edge cases (all same length, very long/short words)
 * - Difficulty-specific scenarios
 *
 * @module lib/test-utils/scenarios
 */

import type { Word } from '@/types'
import { generateMockSRSWords, generateFixedMockWords } from './mockWords'
import { EASY_DATASET, MEDIUM_DATASET, HARD_DATASET, MIXED_DATASET } from './wordBanks'

/**
 * Test scenario configuration
 */
export interface TestScenario {
  name: string
  description: string
  words: Word[]
  expectedPuzzles?: number
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed'
}

/**
 * Quick test with 10 easy words
 * Good for rapid algorithm validation
 */
export function getQuickTestScenario(): TestScenario {
  return {
    name: 'Quick Test (10 words)',
    description: 'Small set of easy words for rapid testing',
    words: generateFixedMockWords(EASY_DATASET.words, 10, 1),
    expectedPuzzles: 1,
    difficulty: 'easy'
  }
}

/**
 * Standard SRS simulation with 30-50 easy words
 * Mimics typical daily review session
 */
export function getStandardEasyScenario(): TestScenario {
  const words = generateMockSRSWords(EASY_DATASET.words, { minWords: 30, maxWords: 50 })
  return {
    name: 'Standard Easy (30-50 words)',
    description: 'Typical daily review with high crossing potential',
    words,
    expectedPuzzles: 3,
    difficulty: 'easy'
  }
}

/**
 * Standard SRS simulation with 30-50 medium words
 */
export function getStandardMediumScenario(): TestScenario {
  const words = generateMockSRSWords(MEDIUM_DATASET.words, { minWords: 30, maxWords: 50 })
  return {
    name: 'Standard Medium (30-50 words)',
    description: 'Typical daily review with balanced difficulty',
    words,
    expectedPuzzles: 4,
    difficulty: 'medium'
  }
}

/**
 * Standard SRS simulation with 30-50 hard words
 * Stress test for the algorithm
 */
export function getStandardHardScenario(): TestScenario {
  const words = generateMockSRSWords(HARD_DATASET.words, { minWords: 30, maxWords: 50 })
  return {
    name: 'Standard Hard (30-50 words)',
    description: 'Challenging words with rare letters',
    words,
    expectedPuzzles: 5,
    difficulty: 'hard'
  }
}

/**
 * Mixed difficulty scenario
 * Most realistic representation of user word lists
 */
export function getStandardMixedScenario(): TestScenario {
  const words = generateMockSRSWords(MIXED_DATASET.words, { minWords: 30, maxWords: 50 })
  return {
    name: 'Standard Mixed (30-50 words)',
    description: 'Realistic mix of all difficulty levels',
    words,
    expectedPuzzles: 4,
    difficulty: 'mixed'
  }
}

/**
 * Large batch scenario - stress test
 * Tests algorithm with maximum expected daily review
 */
export function getLargeBatchScenario(): TestScenario {
  const words = generateMockSRSWords(MIXED_DATASET.words, { minWords: 80, maxWords: 100 })
  return {
    name: 'Large Batch (80-100 words)',
    description: 'Stress test with many words',
    words,
    expectedPuzzles: 8,
    difficulty: 'mixed'
  }
}

/**
 * All short words (3-4 letters)
 * Edge case testing
 */
export function getShortWordsScenario(): TestScenario {
  const shortWords = EASY_DATASET.words.filter(w => w.term.length <= 4)
  const words = generateFixedMockWords(shortWords, 30, 2)
  return {
    name: 'Short Words Only (3-4 letters)',
    description: 'Edge case with only short words',
    words,
    expectedPuzzles: 2,
    difficulty: 'easy'
  }
}

/**
 * All long words (8+ letters)
 * Edge case testing
 */
export function getLongWordsScenario(): TestScenario {
  const longWords = MEDIUM_DATASET.words.filter(w => w.term.length >= 8)
  const words = generateFixedMockWords(longWords, 30, 3)
  return {
    name: 'Long Words Only (8+ letters)',
    description: 'Edge case with only long words',
    words,
    expectedPuzzles: 3,
    difficulty: 'medium'
  }
}

/**
 * Words with no common letters
 * Worst-case scenario - should force multiple puzzles
 */
export function getNoOverlapScenario(): TestScenario {
  // Manually select words with minimal letter overlap
  const difficultWords = HARD_DATASET.words.filter(w =>
    w.term.includes('Q') ||
    w.term.includes('X') ||
    w.term.includes('Z') ||
    w.term.includes('J')
  )
  const words = generateFixedMockWords(difficultWords, 20, 4)
  return {
    name: 'Minimal Overlap (20 words)',
    description: 'Worst case with minimal letter overlap',
    words,
    expectedPuzzles: 6,
    difficulty: 'hard'
  }
}

/**
 * High overlap scenario
 * Best case - words should cross easily
 */
export function getHighOverlapScenario(): TestScenario {
  // Words with lots of E, A, R, T
  const easyWords = EASY_DATASET.words.filter(w => {
    const commonLetters = (w.term.match(/[EART]/g) || []).length
    return commonLetters >= 2
  })
  const words = generateFixedMockWords(easyWords, 40, 5)
  return {
    name: 'High Overlap (40 words)',
    description: 'Best case with high letter overlap',
    words,
    expectedPuzzles: 2,
    difficulty: 'easy'
  }
}

/**
 * Single word scenario
 * Edge case for minimal puzzle
 */
export function getSingleWordScenario(): TestScenario {
  const words = generateFixedMockWords(EASY_DATASET.words, 1, 6)
  return {
    name: 'Single Word',
    description: 'Minimal edge case with one word',
    words,
    expectedPuzzles: 1,
    difficulty: 'easy'
  }
}

/**
 * Two words scenario
 * Tests basic crossing logic
 */
export function getTwoWordsScenario(): TestScenario {
  // Select two words that share a letter
  const words = generateFixedMockWords(
    EASY_DATASET.words.filter(w => w.term.includes('E')),
    2,
    7
  )
  return {
    name: 'Two Words',
    description: 'Simple case to test basic crossing',
    words,
    expectedPuzzles: 1,
    difficulty: 'easy'
  }
}

/**
 * All scenarios for comprehensive testing
 */
export const ALL_SCENARIOS = [
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
  getTwoWordsScenario
] as const

/**
 * Get a random scenario for ad-hoc testing
 * @returns A randomly selected test scenario
 */
export function getRandomScenario(): TestScenario {
  const scenarios = [
    getStandardEasyScenario,
    getStandardMediumScenario,
    getStandardHardScenario,
    getStandardMixedScenario
  ]
  const randomIndex = Math.floor(Math.random() * scenarios.length)
  return scenarios[randomIndex]()
}

/**
 * Get all scenarios as an array
 * Useful for running comprehensive test suites
 * @returns Array of all test scenarios
 */
export function getAllScenarios(): TestScenario[] {
  return ALL_SCENARIOS.map(fn => fn())
}
