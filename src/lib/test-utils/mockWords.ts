/**
 * @fileoverview Mock word generation utilities for testing crossword algorithm
 *
 * Simulates SRS word selection by randomly picking words from test datasets.
 * This allows testing the crossword generation without waiting for real SRS intervals.
 *
 * @module lib/test-utils/mockWords
 */

import type { Word } from '@/types'
import type { TestWord, MockSRSConfig } from './types'

/**
 * Generates a random UUID for test purposes
 * @returns A mock UUID string
 */
function generateMockId(): string {
  return `mock-${Math.random().toString(36).substring(2, 11)}`
}

/**
 * Converts a TestWord to a full Word object with generated IDs
 * @param testWord - The test word to convert
 * @param listId - The word list ID to associate with
 * @returns A complete Word object
 */
export function testWordToWord(testWord: TestWord, listId: string = 'test-list-1'): Word {
  return {
    id: generateMockId(),
    listId,
    term: testWord.term.toUpperCase(),
    translation: testWord.translation,
    definition: testWord.definition,
    exampleSentence: testWord.exampleSentence,
    createdAt: new Date().toISOString()
  }
}

/**
 * Simulates SRS word selection for testing
 * Randomly selects between minWords and maxWords from the provided dataset
 *
 * @param wordBank - Array of test words to select from
 * @param config - Configuration for selection (defaults: 30-50 words)
 * @returns Array of randomly selected words converted to Word objects
 *
 * @example
 * ```typescript
 * const mockWords = generateMockSRSWords(EASY_WORDS, { minWords: 30, maxWords: 50 })
 * const puzzles = await generatePuzzles(mockWords)
 * ```
 */
export function generateMockSRSWords(
  wordBank: TestWord[],
  config: MockSRSConfig = { minWords: 30, maxWords: 50 }
): Word[] {
  const { minWords, maxWords } = config

  // Calculate random count between min and max
  const count = Math.floor(Math.random() * (maxWords - minWords + 1)) + minWords

  // Ensure we don't try to select more words than available
  const actualCount = Math.min(count, wordBank.length)

  // Shuffle and select
  const shuffled = [...wordBank].sort(() => Math.random() - 0.5)
  const selected = shuffled.slice(0, actualCount)

  // Convert to full Word objects
  return selected.map(word => testWordToWord(word))
}

/**
 * Generates a fixed set of mock words for deterministic testing
 * Useful for unit tests that need consistent results
 *
 * @param wordBank - Array of test words to select from
 * @param count - Exact number of words to select
 * @param seed - Optional seed for deterministic randomization
 * @returns Array of selected words
 */
export function generateFixedMockWords(
  wordBank: TestWord[],
  count: number,
  seed?: number
): Word[] {
  // Simple seeded shuffle for deterministic tests
  let rng = seed ?? 42
  const seededRandom = () => {
    rng = (rng * 9301 + 49297) % 233280
    return rng / 233280
  }

  const shuffled = [...wordBank].sort(() => seededRandom() - 0.5)
  const selected = shuffled.slice(0, Math.min(count, wordBank.length))

  return selected.map(word => testWordToWord(word))
}

/**
 * Analyzes a word list to determine letter frequency distribution
 * Useful for understanding dataset characteristics
 *
 * @param words - Array of test words to analyze
 * @returns Map of letter to frequency count
 */
export function analyzeLetterFrequency(words: TestWord[]): Map<string, number> {
  const frequency = new Map<string, number>()

  words.forEach(word => {
    const letters = word.term.toUpperCase().split('')
    letters.forEach(letter => {
      if (/[A-Z]/.test(letter)) {
        frequency.set(letter, (frequency.get(letter) || 0) + 1)
      }
    })
  })

  return frequency
}

/**
 * Filters words by length range
 * Useful for testing specific puzzle sizes
 *
 * @param words - Array of test words
 * @param minLength - Minimum word length (inclusive)
 * @param maxLength - Maximum word length (inclusive)
 * @returns Filtered array of words
 */
export function filterWordsByLength(
  words: TestWord[],
  minLength: number,
  maxLength: number
): TestWord[] {
  return words.filter(w => w.term.length >= minLength && w.term.length <= maxLength)
}
