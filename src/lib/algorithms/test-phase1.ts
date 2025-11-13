/**
 * @fileoverview Phase 1 Tests - Core functionality with 2-3 words
 *
 * Tests basic placement logic, grid management, and connectivity
 * with small word sets before moving to complex scenarios.
 *
 * @module lib/algorithms/test-phase1
 */

import type { Word } from '@/types'
import { Grid } from './grid'
import { findPlacements, findAllCrossings } from './placement'
import { isConnected, getConnectivityStats } from './connectivity'

/**
 * Test helper: Creates a mock word
 */
function createWord(id: string, term: string, translation: string): Word {
  return {
    id,
    listId: 'test-list',
    term: term.toUpperCase(),
    translation,
    createdAt: new Date().toISOString(),
  }
}

/**
 * Test 1: Grid creation and basic operations
 */
function test1_GridBasics(): boolean {
  console.log('\n=== Test 1: Grid Basics ===')

  const grid = new Grid(15)

  console.log(`Grid size: ${grid.getSize()}`)
  console.log(`Placed words: ${grid.getPlacedWordCount()}`)
  console.log(`Is empty at (5,5): ${grid.isEmpty(5, 5)}`)
  console.log(`Is in bounds (20,20): ${grid.isInBounds(20, 20)}`)

  const passed = grid.getSize() === 15 &&
    grid.getPlacedWordCount() === 0 &&
    grid.isEmpty(5, 5) &&
    !grid.isInBounds(20, 20)

  console.log(`✅ Test 1: ${passed ? 'PASS' : 'FAIL'}`)
  return passed
}

/**
 * Test 2: Place first word in center
 */
function test2_FirstWord(): boolean {
  console.log('\n=== Test 2: First Word Placement ===')

  const grid = new Grid(15)
  const word = createWord('1', 'HELLO', 'A greeting')

  const placements = findPlacements(word, grid)
  console.log(`Found ${placements.length} placement options`)

  if (placements.length === 0) {
    console.log('❌ Test 2: FAIL - No placements found')
    return false
  }

  // Place the first option
  const placement = placements[0]
  console.log(`Placing "${word.term}" at (${placement.x}, ${placement.y}) ${placement.direction}`)

  const placed = grid.placeWord(word, placement.x, placement.y, placement.direction)

  if (!placed) {
    console.log('❌ Test 2: FAIL - Could not place word')
    return false
  }

  console.log(`Placed word number: ${placed.number}`)
  console.log(`Word has ${placed.crossings.length} crossings`)
  console.log(`Grid density: ${(grid.getDensity() * 100).toFixed(2)}%`)

  console.log('\nGrid visualization:')
  console.log(grid.toString())

  const passed = grid.getPlacedWordCount() === 1 &&
    placed.crossings.length === 0

  console.log(`\n✅ Test 2: ${passed ? 'PASS' : 'FAIL'}`)
  return passed
}

/**
 * Test 3: Place second word with crossing
 */
function test3_SecondWord(): boolean {
  console.log('\n=== Test 3: Second Word with Crossing ===')

  const grid = new Grid(15)
  const word1 = createWord('1', 'HELLO', 'A greeting')
  const word2 = createWord('2', 'WORLD', 'Planet Earth')

  // Place first word
  const placements1 = findPlacements(word1, grid)
  grid.placeWord(word1, placements1[0].x, placements1[0].y, placements1[0].direction)

  console.log('First word placed: HELLO')

  // Find placements for second word
  const placements2 = findPlacements(word2, grid)
  console.log(`\nFound ${placements2.length} placement options for WORLD`)

  if (placements2.length === 0) {
    console.log('❌ Test 3: FAIL - No crossings found')
    return false
  }

  // Show all crossing options
  placements2.forEach((p, i) => {
    console.log(`  Option ${i + 1}: (${p.x}, ${p.y}) ${p.direction}, ${p.crossings.length} crossings`)
  })

  // Place the first option
  const placement2 = placements2[0]
  const placed2 = grid.placeWord(word2, placement2.x, placement2.y, placement2.direction)

  if (!placed2) {
    console.log('❌ Test 3: FAIL - Could not place second word')
    return false
  }

  console.log(`\nPlaced WORLD at (${placed2.x}, ${placed2.y}) ${placed2.direction}`)
  console.log(`Crossings: ${placed2.crossings.length}`)

  if (placed2.crossings.length > 0) {
    const crossing = placed2.crossings[0]
    console.log(`  - Crosses word ${crossing.otherWordId} at position ${crossing.position}`)
  }

  console.log('\nGrid visualization:')
  console.log(grid.toString())

  const connected = isConnected(grid)
  console.log(`\nIs connected: ${connected}`)

  const passed = grid.getPlacedWordCount() === 2 &&
    placed2.crossings.length > 0 &&
    connected

  console.log(`\n✅ Test 3: ${passed ? 'PASS' : 'FAIL'}`)
  return passed
}

/**
 * Test 4: Place three words with multiple crossings
 */
function test4_ThreeWords(): boolean {
  console.log('\n=== Test 4: Three Words ===')

  const grid = new Grid(15)
  const words = [
    createWord('1', 'TIME', 'Duration'),
    createWord('2', 'TEAM', 'Group'),
    createWord('3', 'MATE', 'Friend'),
  ]

  let placedCount = 0

  for (const word of words) {
    const placements = findPlacements(word, grid)

    if (placements.length === 0) {
      console.log(`⚠️  No placements found for ${word.term}`)
      continue
    }

    const placement = placements[0]
    const placed = grid.placeWord(word, placement.x, placement.y, placement.direction)

    if (placed) {
      placedCount++
      console.log(`✓ Placed ${word.term} with ${placed.crossings.length} crossings`)
    }
  }

  console.log('\nGrid visualization:')
  console.log(grid.toString())

  const stats = getConnectivityStats(grid)
  console.log('\nConnectivity Stats:')
  console.log(`  Total words: ${stats.totalWords}`)
  console.log(`  Fully connected: ${stats.isFullyConnected}`)
  console.log(`  Avg crossings/word: ${stats.averageCrossingsPerWord.toFixed(2)}`)
  console.log(`  Grid density: ${(grid.getDensity() * 100).toFixed(2)}%`)

  const passed = placedCount >= 2 && stats.isFullyConnected

  console.log(`\n✅ Test 4: ${passed ? 'PASS' : 'FAIL'}`)
  return passed
}

/**
 * Test 5: Words with common letters (multiple crossing options)
 */
function test5_MultipleOptions(): boolean {
  console.log('\n=== Test 5: Multiple Crossing Options ===')

  const grid = new Grid(15)
  const word1 = createWord('1', 'STREET', 'Road')
  const word2 = createWord('2', 'LETTER', 'Written message')

  // Place first word
  const placements1 = findPlacements(word1, grid)
  grid.placeWord(word1, placements1[0].x, placements1[0].y, placements1[0].direction)

  console.log('First word placed: STREET')

  // Find all crossing options for second word
  const placements2 = findPlacements(word2, grid)
  console.log(`\nFound ${placements2.length} crossing options for LETTER`)

  // Count unique crossing letters
  const crossingLetters = new Set<string>()
  placements2.forEach(p => {
    if (p.crossings.length > 0) {
      const pos = p.crossings[0].position
      crossingLetters.add(word2.term[pos])
    }
  })

  console.log(`Crossing via letters: ${Array.from(crossingLetters).join(', ')}`)

  // Place using first option
  if (placements2.length > 0) {
    const placed2 = grid.placeWord(word2, placements2[0].x, placements2[0].y, placements2[0].direction)
    if (placed2) {
      console.log(`\nPlaced LETTER at (${placed2.x}, ${placed2.y})`)
    }
  }

  console.log('\nGrid visualization:')
  console.log(grid.toString())

  // Both words share E, T, E - should have multiple options
  const passed = placements2.length >= 3

  console.log(`\n✅ Test 5: ${passed ? 'PASS' : 'FAIL'}`)
  return passed
}

/**
 * Test 6: Connectivity validation with islands
 */
function test6_Islands(): boolean {
  console.log('\n=== Test 6: Island Detection ===')

  const grid = new Grid(20)
  const word1 = createWord('1', 'HELLO', 'Greeting')
  const word2 = createWord('2', 'WORLD', 'Planet')

  // Manually place words far apart (no crossing)
  grid.placeWord(word1, 2, 2, 'horizontal')
  grid.placeWord(word2, 10, 10, 'horizontal')

  console.log('Placed HELLO at (2,2) and WORLD at (10,10)')

  const connected = isConnected(grid)
  const stats = getConnectivityStats(grid)

  console.log(`\nIs connected: ${connected}`)
  console.log(`Island count: ${stats.islandCount}`)

  console.log('\nGrid visualization:')
  console.log(grid.toString())

  const passed = !connected && stats.islandCount === 2

  console.log(`\n✅ Test 6: ${passed ? 'PASS' : 'FAIL'}`)
  return passed
}

/**
 * Run all Phase 1 tests
 */
export function runPhase1Tests(): void {
  console.log('╔════════════════════════════════════════════╗')
  console.log('║  Phase 1 Tests: Core Functionality        ║')
  console.log('╚════════════════════════════════════════════╝')

  const tests = [
    { name: 'Grid Basics', fn: test1_GridBasics },
    { name: 'First Word', fn: test2_FirstWord },
    { name: 'Second Word Crossing', fn: test3_SecondWord },
    { name: 'Three Words', fn: test4_ThreeWords },
    { name: 'Multiple Options', fn: test5_MultipleOptions },
    { name: 'Island Detection', fn: test6_Islands },
  ]

  const results = tests.map(test => ({
    name: test.name,
    passed: test.fn(),
  }))

  console.log('\n' + '═'.repeat(48))
  console.log('Phase 1 Test Summary')
  console.log('═'.repeat(48))

  results.forEach(r => {
    console.log(`${r.passed ? '✅' : '❌'} ${r.name}`)
  })

  const passedCount = results.filter(r => r.passed).length
  const totalCount = results.length

  console.log('═'.repeat(48))
  console.log(`Result: ${passedCount}/${totalCount} tests passed`)

  if (passedCount === totalCount) {
    console.log('🎉 All Phase 1 tests passed!')
  } else {
    console.log('⚠️  Some tests failed - review above')
  }
  console.log('═'.repeat(48))
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runPhase1Tests()
}
