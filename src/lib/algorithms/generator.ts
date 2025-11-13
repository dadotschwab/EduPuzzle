/**
 * @fileoverview Main crossword puzzle generator with multi-puzzle support
 *
 * Orchestrates the complete puzzle generation process:
 * 1. Clusters words by letter overlap
 * 2. Generates multiple puzzles if needed for 100% coverage
 * 3. Uses scoring to choose optimal placements
 * 4. Validates connectivity throughout
 * 5. Keeps puzzles within 16x16 grid size
 *
 * @module lib/algorithms/generator
 */

import type { Word, Puzzle, PlacedWord, Crossing } from '@/types'
import type { GenerationConfig, GenerationResult, PlacedWordInternal } from './types'
import { Grid } from './grid'
import { findPlacements } from './placement'
import { getBestPlacement } from './scoring'
import { isConnected } from './connectivity'
import { clusterWords, validateClustering, getClusteringStats } from './clustering'

/**
 * Default configuration for puzzle generation
 * Updated for 16x16 grid constraint
 */
const DEFAULT_CONFIG: GenerationConfig = {
  maxGridSize: 16,  // Reduced from 25 for UI requirements
  minGridSize: 10,
  timeoutMs: 10000,
  minCrossingsPerWord: 1,
  maxAttemptsPerWord: 100,
}

/**
 * Generates a crossword puzzle from a list of words
 *
 * @param words - Array of words to place in the puzzle
 * @param config - Optional generation configuration
 * @returns Generated puzzle or null if generation failed
 *
 * @example
 * ```typescript
 * const words = generateMockSRSWords(EASY_DATASET.words)
 * const puzzle = await generatePuzzle(words)
 * ```
 */
export async function generatePuzzle(
  words: Word[],
  config: Partial<GenerationConfig> = {}
): Promise<Puzzle | null> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config }
  const startTime = performance.now()

  // Sort words by length (longest first - better for initial placement)
  const sortedWords = [...words].sort((a, b) => b.term.length - a.term.length)

  // Calculate initial grid size based on longest word
  const longestWord = sortedWords[0].term.length
  const initialGridSize = Math.max(
    fullConfig.minGridSize,
    Math.min(fullConfig.maxGridSize, longestWord * 2)
  )

  // Create grid
  const grid = new Grid(initialGridSize)

  // Track placement attempts
  let placedCount = 0
  let attempts = 0

  // Place words one by one
  for (const word of sortedWords) {
    if (attempts >= fullConfig.maxAttemptsPerWord * words.length) {
      console.warn('Max attempts reached, stopping generation')
      break
    }

    // Find all possible placements
    const placements = findPlacements(word, grid)

    if (placements.length === 0) {
      console.warn(`No valid placements found for word: ${word.term}`)
      continue
    }

    // Choose best placement using scoring
    const bestPlacement = getBestPlacement(placements, grid)

    if (!bestPlacement) {
      console.warn(`Could not score placements for word: ${word.term}`)
      continue
    }

    // Place the word
    const placed = grid.placeWord(
      word,
      bestPlacement.x,
      bestPlacement.y,
      bestPlacement.direction
    )

    if (placed) {
      placedCount++
      attempts = 0 // Reset attempts on successful placement
    } else {
      attempts++
    }
  }

  // Check if we placed enough words
  if (placedCount === 0) {
    console.error('Failed to place any words')
    return null
  }

  // Validate connectivity
  if (!isConnected(grid)) {
    console.warn('Warning: Generated puzzle has disconnected components')
  }

  // Convert to Puzzle format
  const puzzle = convertToPuzzle(grid)

  const endTime = performance.now()
  const timeElapsed = endTime - startTime

  console.log(`Generated puzzle in ${timeElapsed.toFixed(0)}ms`)
  console.log(`  Placed: ${placedCount}/${words.length} words`)
  console.log(`  Grid size: ${puzzle.gridSize}x${puzzle.gridSize}`)
  console.log(`  Connected: ${isConnected(grid)}`)

  return puzzle
}

/**
 * Converts internal grid representation to public Puzzle type
 */
function convertToPuzzle(grid: Grid): Puzzle {
  const placedWords = grid.getPlacedWords()

  // Convert internal PlacedWord format to public format
  const publicPlacedWords: PlacedWord[] = placedWords.map(word => {
    // Convert crossings format
    const crossings: Crossing[] = word.crossings.map(c => ({
      position: c.position,
      otherWordId: c.otherWordId,
      otherWordPosition: c.otherWordPosition,
    }))

    return {
      id: word.id,
      word: word.word,
      clue: word.clue,
      x: word.x,
      y: word.y,
      direction: word.direction,
      number: word.number,
      crossings,
    }
  })

  return {
    id: `puzzle-${Date.now()}`,
    gridSize: grid.getSize(),
    placedWords: publicPlacedWords,
    grid: grid.exportGrid(),
  }
}

/**
 * Generates multiple puzzles to ensure 100% word coverage
 * Uses clustering to group compatible words
 *
 * @param words - Words to place
 * @param config - Generation configuration
 * @returns Array of puzzles (guaranteed to include all words)
 *
 * @example
 * ```typescript
 * const words = generateMockSRSWords(MIXED_DATASET.words, { minWords: 40, maxWords: 50 })
 * const puzzles = await generatePuzzles(words)
 * console.log(`Generated ${puzzles.length} puzzles covering ${words.length} words`)
 * ```
 */
export async function generatePuzzles(
  words: Word[],
  config?: Partial<GenerationConfig>
): Promise<Puzzle[]> {
  if (words.length === 0) return []

  console.log(`\n🔄 Generating puzzles for ${words.length} words...`)

  // Step 1: Cluster words for optimal grouping
  const clusters = clusterWords(words, {
    minClusterSize: 8,
    maxClusterSize: 15,
    targetClusterSize: 12,
  })

  console.log(`📊 Created ${clusters.length} clusters`)

  // Validate clustering covers all words
  if (!validateClustering(clusters, words)) {
    console.warn('⚠️  Warning: Clustering did not cover all words!')
  }

  // Get clustering stats
  const stats = getClusteringStats(clusters)
  console.log(`   Avg cluster size: ${stats.avgClusterSize.toFixed(1)} words`)
  console.log(`   Avg compatibility score: ${stats.avgScore.toFixed(1)}`)
  console.log(`   Difficulty: ${stats.difficultyBreakdown.easy}E / ${stats.difficultyBreakdown.medium}M / ${stats.difficultyBreakdown.hard}H`)

  // Step 2: Generate puzzle for each cluster
  const puzzles: Puzzle[] = []
  const failedWords: Word[] = []

  for (let i = 0; i < clusters.length; i++) {
    const cluster = clusters[i]
    console.log(`\n   Puzzle ${i + 1}/${clusters.length}: ${cluster.words.length} words (${cluster.difficulty})`)

    const puzzle = await generatePuzzle(cluster.words, config)

    if (puzzle) {
      puzzles.push(puzzle)

      // Track any words that didn't make it into this puzzle
      const placedIds = new Set(puzzle.placedWords.map(w => w.id))
      const unplaced = cluster.words.filter(w => !placedIds.has(w.id))

      if (unplaced.length > 0) {
        console.log(`   ⚠️  ${unplaced.length} words not placed`)
        failedWords.push(...unplaced)
      }
    } else {
      console.log(`   ❌ Failed to generate puzzle`)
      failedWords.push(...cluster.words)
    }
  }

  // Step 3: Handle any remaining failed words
  if (failedWords.length > 0) {
    console.log(`\n🔄 Retry: ${failedWords.length} unplaced words`)

    // Try smaller groups
    const retryPuzzles = await retryFailedWords(failedWords, config)
    puzzles.push(...retryPuzzles)
  }

  // Final validation
  const totalPlaced = puzzles.reduce((sum, p) => sum + p.placedWords.length, 0)
  const coverage = (totalPlaced / words.length * 100).toFixed(1)

  console.log(`\n✅ Generated ${puzzles.length} puzzles`)
  console.log(`   Total words placed: ${totalPlaced}/${words.length} (${coverage}%)`)

  return puzzles
}

/**
 * Retries failed words in smaller groups
 * Final attempt to achieve 100% coverage
 */
async function retryFailedWords(
  words: Word[],
  config?: Partial<GenerationConfig>
): Promise<Puzzle[]> {
  const puzzles: Puzzle[] = []

  // Try in very small groups (5-8 words)
  const smallClusters = clusterWords(words, {
    minClusterSize: 3,
    maxClusterSize: 8,
    targetClusterSize: 6,
  })

  for (const cluster of smallClusters) {
    const puzzle = await generatePuzzle(cluster.words, config)
    if (puzzle) {
      puzzles.push(puzzle)
    }
  }

  return puzzles
}

/**
 * Generates a puzzle and returns detailed generation statistics
 *
 * @param words - Words to place
 * @param config - Generation configuration
 * @returns Generation result with statistics
 */
export async function generateWithStats(
  words: Word[],
  config?: Partial<GenerationConfig>
): Promise<GenerationResult> {
  const startTime = performance.now()

  const puzzle = await generatePuzzle(words, config)

  const endTime = performance.now()

  if (!puzzle) {
    return {
      success: false,
      placedWords: [],
      unplacedWords: words,
      gridSize: 0,
      timeElapsed: endTime - startTime,
      attemptsMade: 0,
    }
  }

  const placedWords: PlacedWordInternal[] = []
  const unplacedWordIds = new Set(words.map(w => w.id))

  puzzle.placedWords.forEach(pw => {
    unplacedWordIds.delete(pw.id)
    placedWords.push({
      ...pw,
      wordId: pw.id,
      usedInCrossing: new Set(pw.crossings.map(c => c.position)),
    })
  })

  const unplacedWords = words.filter(w => unplacedWordIds.has(w.id))

  return {
    success: true,
    puzzle,
    placedWords,
    unplacedWords,
    gridSize: puzzle.gridSize,
    timeElapsed: endTime - startTime,
    attemptsMade: 0, // Not tracked yet
  }
}

/**
 * Quick validation that a set of words can potentially form a puzzle
 * (Checks if words have shared letters)
 *
 * @param words - Words to validate
 * @returns true if words can potentially cross
 */
export function canFormPuzzle(words: Word[]): boolean {
  if (words.length === 0) return false
  if (words.length === 1) return true

  // Build letter frequency map
  const letterCounts = new Map<string, number>()

  words.forEach(word => {
    const letters = new Set(word.term.split(''))
    letters.forEach(letter => {
      letterCounts.set(letter, (letterCounts.get(letter) || 0) + 1)
    })
  })

  // Check if at least one letter appears in multiple words
  for (const count of letterCounts.values()) {
    if (count >= 2) return true
  }

  return false
}
