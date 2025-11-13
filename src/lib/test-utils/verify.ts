/**
 * @fileoverview Verification script for test utilities
 *
 * Run this script to verify that all test utilities are working correctly.
 * This ensures the mock data infrastructure is ready for algorithm development.
 *
 * @module lib/test-utils/verify
 */

import {
  EASY_DATASET,
  MEDIUM_DATASET,
  HARD_DATASET,
  MIXED_DATASET,
  generateMockSRSWords,
  generateFixedMockWords,
  getAllScenarios,
  analyzeLetterFrequency
} from './index'

/**
 * Verification results
 */
interface VerificationResult {
  success: boolean
  message: string
  details?: unknown
}

/**
 * Verify dataset integrity
 */
function verifyDatasets(): VerificationResult {
  const datasets = [
    { name: 'Easy', dataset: EASY_DATASET, expectedMin: 200 },
    { name: 'Medium', dataset: MEDIUM_DATASET, expectedMin: 200 },
    { name: 'Hard', dataset: HARD_DATASET, expectedMin: 200 },
    { name: 'Mixed', dataset: MIXED_DATASET, expectedMin: 200 },
  ]

  for (const { name, dataset, expectedMin } of datasets) {
    if (dataset.words.length < expectedMin) {
      return {
        success: false,
        message: `${name} dataset has insufficient words: ${dataset.words.length} < ${expectedMin}`
      }
    }

    // Check word structure
    const sampleWord = dataset.words[0]
    if (!sampleWord.term || !sampleWord.translation) {
      return {
        success: false,
        message: `${name} dataset has invalid word structure`
      }
    }

    // Check for duplicates
    const terms = new Set(dataset.words.map(w => w.term))
    if (terms.size !== dataset.words.length) {
      return {
        success: false,
        message: `${name} dataset contains duplicate words`
      }
    }
  }

  return {
    success: true,
    message: 'All datasets verified successfully',
    details: datasets.map(d => ({
      name: d.name,
      count: d.dataset.words.length
    }))
  }
}

/**
 * Verify mock word generation
 */
function verifyMockGeneration(): VerificationResult {
  // Test random generation
  const randomWords = generateMockSRSWords(EASY_DATASET.words, { minWords: 30, maxWords: 50 })

  if (randomWords.length < 30 || randomWords.length > 50) {
    return {
      success: false,
      message: `Random generation produced ${randomWords.length} words, expected 30-50`
    }
  }

  // Test fixed generation
  const seed = 123
  const fixed1 = generateFixedMockWords(MEDIUM_DATASET.words, 25, seed)
  const fixed2 = generateFixedMockWords(MEDIUM_DATASET.words, 25, seed)

  if (JSON.stringify(fixed1) !== JSON.stringify(fixed2)) {
    return {
      success: false,
      message: 'Fixed generation is not deterministic with same seed'
    }
  }

  // Verify Word structure
  const sampleWord = randomWords[0]
  if (!sampleWord.id || !sampleWord.listId || !sampleWord.term || !sampleWord.translation) {
    return {
      success: false,
      message: 'Generated words missing required fields'
    }
  }

  return {
    success: true,
    message: 'Mock word generation working correctly',
    details: {
      randomGenerated: randomWords.length,
      fixedGenerated: fixed1.length,
      deterministicMatch: true
    }
  }
}

/**
 * Verify scenarios
 */
function verifyScenarios(): VerificationResult {
  const scenarios = getAllScenarios()

  if (scenarios.length < 10) {
    return {
      success: false,
      message: `Expected at least 10 scenarios, got ${scenarios.length}`
    }
  }

  for (const scenario of scenarios) {
    if (!scenario.name || !scenario.description || !scenario.words || scenario.words.length === 0) {
      return {
        success: false,
        message: `Invalid scenario structure: ${scenario.name || 'unnamed'}`
      }
    }
  }

  return {
    success: true,
    message: 'All scenarios verified successfully',
    details: {
      totalScenarios: scenarios.length,
      scenarios: scenarios.map(s => ({
        name: s.name,
        wordCount: s.words.length,
        difficulty: s.difficulty
      }))
    }
  }
}

/**
 * Verify utility functions
 */
function verifyUtilities(): VerificationResult {
  // Test letter frequency analysis
  const frequency = analyzeLetterFrequency(HARD_DATASET.words)

  if (frequency.size === 0) {
    return {
      success: false,
      message: 'Letter frequency analysis failed'
    }
  }

  // Check for expected rare letters in hard dataset
  const rareLetters = ['Q', 'X', 'Z', 'J']
  const hasRareLetters = rareLetters.some(letter => (frequency.get(letter) || 0) > 0)

  if (!hasRareLetters) {
    return {
      success: false,
      message: 'Hard dataset should contain rare letters (Q, X, Z, J)'
    }
  }

  return {
    success: true,
    message: 'Utility functions working correctly',
    details: {
      uniqueLetters: frequency.size,
      rareLetterCounts: Object.fromEntries(
        rareLetters.map(l => [l, frequency.get(l) || 0])
      )
    }
  }
}

/**
 * Run all verifications
 */
export function runVerification(): void {
  console.log('╔════════════════════════════════════════════╗')
  console.log('║  Test Utilities Verification              ║')
  console.log('╚════════════════════════════════════════════╝\n')

  const tests = [
    { name: 'Datasets', fn: verifyDatasets },
    { name: 'Mock Generation', fn: verifyMockGeneration },
    { name: 'Scenarios', fn: verifyScenarios },
    { name: 'Utilities', fn: verifyUtilities },
  ]

  let allPassed = true

  for (const test of tests) {
    process.stdout.write(`Testing ${test.name}... `)
    const result = test.fn()

    if (result.success) {
      console.log('✅ PASS')
      if (result.details) {
        console.log(`  ${JSON.stringify(result.details, null, 2).split('\n').join('\n  ')}`)
      }
    } else {
      console.log('❌ FAIL')
      console.log(`  Error: ${result.message}`)
      allPassed = false
    }
    console.log()
  }

  console.log('═'.repeat(48))
  if (allPassed) {
    console.log('✅ All verifications passed!')
    console.log('   Mock data infrastructure is ready for use.')
  } else {
    console.log('❌ Some verifications failed.')
    console.log('   Please check the errors above.')
  }
  console.log('═'.repeat(48))
}

// Run verification if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runVerification()
}
