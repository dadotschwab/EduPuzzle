/**
 * @fileoverview Usage examples for test utilities
 *
 * This file demonstrates various ways to use the test utilities.
 * These examples can be run directly or adapted for your needs.
 *
 * @module lib/test-utils/examples
 */

import {
  generateMockSRSWords,
  generateFixedMockWords,
  EASY_DATASET,
  MEDIUM_DATASET,
  HARD_DATASET,
  MIXED_DATASET,
  getStandardMixedScenario,
  getAllScenarios,
  analyzeLetterFrequency,
  filterWordsByLength
} from './index'

/**
 * Example 1: Basic Mock SRS Word Generation
 * Simulates selecting 30-50 words as if they were due for review
 */
export function example1_BasicMockGeneration() {
  console.log('=== Example 1: Basic Mock Generation ===')

  // Generate random words like SRS would
  const mockWords = generateMockSRSWords(EASY_DATASET.words)

  console.log(`Generated ${mockWords.length} words`)
  console.log('First 5 words:')
  mockWords.slice(0, 5).forEach(word => {
    console.log(`  - ${word.term}: ${word.translation}`)
  })

  return mockWords
}

/**
 * Example 2: Using Different Difficulty Levels
 */
export function example2_DifferentDifficulties() {
  console.log('\n=== Example 2: Different Difficulties ===')

  const easyWords = generateMockSRSWords(EASY_DATASET.words, { minWords: 30, maxWords: 40 })
  const mediumWords = generateMockSRSWords(MEDIUM_DATASET.words, { minWords: 30, maxWords: 40 })
  const hardWords = generateMockSRSWords(HARD_DATASET.words, { minWords: 30, maxWords: 40 })

  console.log(`Easy words: ${easyWords.length}`)
  console.log(`Medium words: ${mediumWords.length}`)
  console.log(`Hard words: ${hardWords.length}`)

  // Analyze letter frequency
  console.log('\nLetter frequency in hard words:')
  const frequency = analyzeLetterFrequency(HARD_DATASET.words)
  const rareLetters = ['Q', 'X', 'Z', 'J', 'K']
  rareLetters.forEach(letter => {
    console.log(`  ${letter}: ${frequency.get(letter) || 0} occurrences`)
  })

  return { easyWords, mediumWords, hardWords }
}

/**
 * Example 3: Using Pre-Configured Scenarios
 */
export function example3_UsingScenarios() {
  console.log('\n=== Example 3: Using Scenarios ===')

  const scenario = getStandardMixedScenario()

  console.log(`Scenario: ${scenario.name}`)
  console.log(`Description: ${scenario.description}`)
  console.log(`Difficulty: ${scenario.difficulty}`)
  console.log(`Words: ${scenario.words.length}`)
  console.log(`Expected puzzles: ${scenario.expectedPuzzles}`)

  return scenario
}

/**
 * Example 4: Testing All Scenarios
 */
export function example4_TestAllScenarios() {
  console.log('\n=== Example 4: All Scenarios ===')

  const scenarios = getAllScenarios()

  scenarios.forEach(scenario => {
    console.log(`\n${scenario.name}:`)
    console.log(`  Words: ${scenario.words.length}`)
    console.log(`  Difficulty: ${scenario.difficulty}`)
    console.log(`  Expected puzzles: ${scenario.expectedPuzzles || 'N/A'}`)

    // Show word length distribution
    const lengths = scenario.words.map(w => w.term.length)
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length
    const minLength = Math.min(...lengths)
    const maxLength = Math.max(...lengths)

    console.log(`  Word lengths: ${minLength}-${maxLength} (avg: ${avgLength.toFixed(1)})`)
  })

  return scenarios
}

/**
 * Example 5: Deterministic Testing
 * Useful for unit tests where you need reproducible results
 */
export function example5_DeterministicTesting() {
  console.log('\n=== Example 5: Deterministic Testing ===')

  // Using same seed produces same results
  const seed = 42
  const words1 = generateFixedMockWords(EASY_DATASET.words, 20, seed)
  const words2 = generateFixedMockWords(EASY_DATASET.words, 20, seed)

  console.log('Generated twice with same seed (42):')
  console.log(`  First run: ${words1.map(w => w.term).join(', ')}`)
  console.log(`  Second run: ${words2.map(w => w.term).join(', ')}`)
  console.log(`  Are identical: ${JSON.stringify(words1) === JSON.stringify(words2)}`)

  return { words1, words2 }
}

/**
 * Example 6: Custom Word Filtering
 */
export function example6_CustomFiltering() {
  console.log('\n=== Example 6: Custom Filtering ===')

  // Only 5-7 letter words
  const mediumLength = filterWordsByLength(MIXED_DATASET.words, 5, 7)
  console.log(`Words with 5-7 letters: ${mediumLength.length}`)

  // Only short words
  const shortWords = filterWordsByLength(EASY_DATASET.words, 3, 4)
  console.log(`Words with 3-4 letters: ${shortWords.length}`)

  // Only long words
  const longWords = filterWordsByLength(MEDIUM_DATASET.words, 8, 12)
  console.log(`Words with 8-12 letters: ${longWords.length}`)

  // Generate mock SRS with only medium length words
  const mockWords = generateMockSRSWords(mediumLength, { minWords: 25, maxWords: 35 })
  console.log(`\nGenerated ${mockWords.length} words of medium length`)

  return mockWords
}

/**
 * Example 7: Performance Benchmarking Setup
 * Shows how to measure generation time (algorithm implementation needed)
 */
export function example7_BenchmarkingSetup() {
  console.log('\n=== Example 7: Benchmarking Setup ===')

  const scenarios = [
    getStandardMixedScenario(),
  ]

  scenarios.forEach(scenario => {
    console.log(`\nScenario: ${scenario.name}`)
    console.log(`Words to process: ${scenario.words.length}`)
    console.log('Ready for benchmarking with your puzzle generator!')

    // When you implement the generator, you can do:
    // const start = performance.now()
    // const puzzles = await generatePuzzles(scenario.words)
    // const end = performance.now()
    // console.log(`Time: ${(end - start).toFixed(2)}ms`)
    // console.log(`Puzzles generated: ${puzzles.length}`)
  })

  return scenarios
}

/**
 * Example 8: Dataset Statistics
 */
export function example8_DatasetStats() {
  console.log('\n=== Example 8: Dataset Statistics ===')

  const datasets = [
    { name: 'Easy', dataset: EASY_DATASET },
    { name: 'Medium', dataset: MEDIUM_DATASET },
    { name: 'Hard', dataset: HARD_DATASET },
    { name: 'Mixed', dataset: MIXED_DATASET },
  ]

  datasets.forEach(({ name, dataset }) => {
    const words = dataset.words
    const totalWords = words.length
    const avgLength = words.reduce((sum, w) => sum + w.term.length, 0) / totalWords
    const minLength = Math.min(...words.map(w => w.term.length))
    const maxLength = Math.max(...words.map(w => w.term.length))

    console.log(`\n${name} Dataset:`)
    console.log(`  Total words: ${totalWords}`)
    console.log(`  Avg length: ${avgLength.toFixed(1)} letters`)
    console.log(`  Range: ${minLength}-${maxLength} letters`)

    // Letter frequency
    const frequency = analyzeLetterFrequency(words)
    const sortedLetters = Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    console.log(`  Most common letters: ${sortedLetters.map(([l, c]) => `${l}(${c})`).join(', ')}`)
  })
}

/**
 * Run all examples
 * Demonstrates complete usage of the test utilities
 */
export function runAllExamples() {
  console.log('╔════════════════════════════════════════════╗')
  console.log('║  Test Utilities Usage Examples            ║')
  console.log('╚════════════════════════════════════════════╝')

  example1_BasicMockGeneration()
  example2_DifferentDifficulties()
  example3_UsingScenarios()
  example4_TestAllScenarios()
  example5_DeterministicTesting()
  example6_CustomFiltering()
  example7_BenchmarkingSetup()
  example8_DatasetStats()

  console.log('\n✅ All examples completed!')
}

// Uncomment to run when importing this file
// runAllExamples()
