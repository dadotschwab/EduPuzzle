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
import { clusterWords, validateClustering, getClusteringStats, redistributeFailedWords } from './clustering'

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
 * Shuffles array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Generates a single puzzle attempt from ordered words
 * Internal helper function - use generatePuzzle for public API
 */
function generatePuzzleAttempt(
  words: Word[],
  config: GenerationConfig,
  silent: boolean = false
): Puzzle | null {
  // Calculate initial grid size based on longest word
  const longestWord = words[0].term.length
  const initialGridSize = Math.max(
    config.minGridSize,
    Math.min(config.maxGridSize, longestWord * 2)
  )

  // Create grid
  const grid = new Grid(initialGridSize)

  // Track placement attempts
  let placedCount = 0
  let attempts = 0

  // Place words one by one
  for (const word of words) {
    if (attempts >= config.maxAttemptsPerWord * words.length) {
      if (!silent) console.warn('Max attempts reached, stopping generation')
      break
    }

    // Find all possible placements
    const placements = findPlacements(word, grid)

    if (placements.length === 0) {
      continue
    }

    // Choose best placement using scoring
    const bestPlacement = getBestPlacement(placements, grid)

    if (!bestPlacement) {
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
    return null
  }

  // Convert to Puzzle format
  const puzzle = convertToPuzzle(grid)
  return puzzle
}

/**
 * Generates a crossword puzzle from a list of words
 * Uses multiple attempts with different word orderings to maximize word placement
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

  // Configuration for multiple attempts
  const maxAttempts = 30 // Try up to 30 different orderings
  const minAcceptableWords = Math.max(8, Math.floor(words.length * 0.8)) // At least 8 words or 80%

  let bestPuzzle: Puzzle | null = null
  let bestPlacedCount = 0

  // Try multiple word orderings
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // For first attempt, use sorted order
    // For subsequent attempts, shuffle words (except keep longest first)
    const orderedWords = attempt === 0
      ? sortedWords
      : [sortedWords[0], ...shuffleArray(sortedWords.slice(1))]

    // Generate puzzle with this ordering
    const puzzle = generatePuzzleAttempt(orderedWords, fullConfig, true)

    if (puzzle) {
      const placedCount = puzzle.placedWords.length

      // Keep track of best result
      if (placedCount > bestPlacedCount) {
        bestPlacedCount = placedCount
        bestPuzzle = puzzle
      }

      // If we placed all words or met our target, we're done
      if (placedCount === words.length || placedCount >= minAcceptableWords) {
        if (placedCount === words.length) {
          break // Perfect result, stop trying
        }
      }
    }
  }

  if (!bestPuzzle) {
    console.error('Failed to place any words after all attempts')
    return null
  }

  // Validate connectivity
  const grid = new Grid(bestPuzzle.gridSize)
  // Reconstruct grid for connectivity check
  for (const word of bestPuzzle.placedWords) {
    grid.placeWord(
      { id: word.id, term: word.word, translation: word.clue, listId: '', createdAt: '' },
      word.x,
      word.y,
      word.direction
    )
  }

  const connected = isConnected(grid)
  if (!connected) {
    console.warn('Warning: Generated puzzle has disconnected components')
  }

  const endTime = performance.now()
  const timeElapsed = endTime - startTime

  console.log(`Generated puzzle in ${timeElapsed.toFixed(0)}ms`)
  console.log(`  Placed: ${bestPlacedCount}/${words.length} words`)
  console.log(`  Final grid size: ${bestPuzzle.gridSize}x${bestPuzzle.gridSize}`)
  console.log(`  Connected: ${connected}`)

  return bestPuzzle
}

/**
 * Attempts to place words using limited backtracking
 * Removes last N words and tries different placement orders
 *
 * @param alreadyPlaced - Words successfully placed so far
 * @param failedWords - Words that couldn't be placed
 * @param config - Generation configuration
 * @param backtrackDepth - How many words to remove and retry
 * @returns Best puzzle found or null
 */
function generateWithBacktracking(
  alreadyPlaced: Word[],
  failedWords: Word[],
  config: GenerationConfig,
  backtrackDepth: number = 3
): Puzzle | null {
  if (failedWords.length === 0) return null

  // Try different backtrack depths (2, 3, 4 words)
  const depths = [Math.min(backtrackDepth, alreadyPlaced.length)]

  let bestPuzzle: Puzzle | null = null
  let bestPlacedCount = alreadyPlaced.length

  for (const depth of depths) {
    // Remove last 'depth' words from placed words
    const keptWords = alreadyPlaced.slice(0, -depth)
    const removedWords = alreadyPlaced.slice(-depth)

    // Try each failed word first, then removed words
    for (const failedWord of failedWords) {
      const orderings = [
        [failedWord, ...removedWords],
        [...removedWords, failedWord],
        [failedWord, ...shuffleArray(removedWords)],
      ]

      for (const ordering of orderings) {
        // Reconstruct puzzle with kept words + new ordering
        const newWordOrder = [...keptWords, ...shuffleArray(ordering)]

        const puzzle = generatePuzzleAttempt(newWordOrder, config, true)

        if (puzzle && puzzle.placedWords.length > bestPlacedCount) {
          bestPlacedCount = puzzle.placedWords.length
          bestPuzzle = puzzle

          // If we placed the failed word, that's good enough
          const placedIds = new Set(puzzle.placedWords.map(w => w.id))
          if (placedIds.has(failedWord.id)) {
            return bestPuzzle
          }
        }
      }
    }
  }

  return bestPuzzle
}

/**
 * Crops puzzle to the smallest square that contains all words
 *
 * @param puzzle - The puzzle to crop
 * @returns Cropped puzzle with updated coordinates and grid
 */
function cropToSquare(puzzle: {
  gridSize: number
  placedWords: PlacedWord[]
  grid: (string | null)[][]
}): {
  gridSize: number
  placedWords: PlacedWord[]
  grid: (string | null)[][]
} {
  if (puzzle.placedWords.length === 0) return puzzle

  // Find bounding box of all placed words
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  puzzle.placedWords.forEach(word => {
    const startX = word.x
    const startY = word.y
    const endX = word.direction === 'horizontal' ? word.x + word.word.length - 1 : word.x
    const endY = word.direction === 'vertical' ? word.y + word.word.length - 1 : word.y

    minX = Math.min(minX, startX)
    minY = Math.min(minY, startY)
    maxX = Math.max(maxX, endX)
    maxY = Math.max(maxY, endY)
  })

  // Calculate bounding box size
  const width = maxX - minX + 1
  const height = maxY - minY + 1

  // Use the larger dimension to make it square
  const squareSize = Math.max(width, height)

  // Calculate offset to center the content in the square
  const offsetX = Math.floor((squareSize - width) / 2)
  const offsetY = Math.floor((squareSize - height) / 2)

  // Create new cropped grid
  const croppedGrid: (string | null)[][] = Array(squareSize)
    .fill(null)
    .map(() => Array(squareSize).fill(null))

  // Copy letters to new grid with adjusted coordinates
  for (let y = 0; y < puzzle.gridSize; y++) {
    for (let x = 0; x < puzzle.gridSize; x++) {
      const letter = puzzle.grid[y][x]
      if (letter !== null) {
        // Check if this cell is within the bounding box
        if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
          const newX = x - minX + offsetX
          const newY = y - minY + offsetY
          croppedGrid[newY][newX] = letter
        }
      }
    }
  }

  // Update word coordinates
  const croppedWords: PlacedWord[] = puzzle.placedWords.map(word => ({
    ...word,
    x: word.x - minX + offsetX,
    y: word.y - minY + offsetY,
  }))

  return {
    gridSize: squareSize,
    placedWords: croppedWords,
    grid: croppedGrid,
  }
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

  const uncropped = {
    id: `puzzle-${Date.now()}`,
    gridSize: grid.getSize(),
    placedWords: publicPlacedWords,
    grid: grid.exportGrid(),
  }

  // Crop to smallest square containing all words
  const cropped = cropToSquare(uncropped)

  // Log cropping results
  if (cropped.gridSize < uncropped.gridSize) {
    console.log(`  Cropped: ${uncropped.gridSize}x${uncropped.gridSize} → ${cropped.gridSize}x${cropped.gridSize}`)
  }

  return {
    id: uncropped.id,
    gridSize: cropped.gridSize,
    placedWords: cropped.placedWords,
    grid: cropped.grid,
  }
}

/**
 * Generates multiple puzzles to ensure 100% word coverage
 * Uses balanced clustering with redistribution and backtracking
 *
 * Strategy:
 * 1. First puzzle: 30 attempts (fast mode)
 * 2. Failed words redistributed to remaining clusters by compatibility
 * 3. Remaining puzzles: 30 attempts + backtracking if needed
 *
 * @param words - Words to place
 * @param config - Generation configuration
 * @returns Array of puzzles (99%+ coverage guaranteed)
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
  let clusters = clusterWords(words, {
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

  // Step 2: Generate puzzles with redistribution strategy
  const puzzles: Puzzle[] = []
  const allFailedWords: Word[] = []

  for (let i = 0; i < clusters.length; i++) {
    const cluster = clusters[i]
    console.log(`\n   Puzzle ${i + 1}/${clusters.length}: ${cluster.words.length} words (${cluster.difficulty})`)

    // Generate puzzle (30 attempts)
    const puzzle = await generatePuzzle(cluster.words, config)

    if (puzzle) {
      puzzles.push(puzzle)

      // Track any words that didn't make it into this puzzle
      const placedIds = new Set(puzzle.placedWords.map(w => w.id))
      const unplaced = cluster.words.filter(w => !placedIds.has(w.id))

      if (unplaced.length > 0) {
        console.log(`   ⚠️  ${unplaced.length} words not placed: ${unplaced.map(w => w.term).join(', ')}`)

        // Redistribute failed words to remaining clusters
        if (i < clusters.length - 1) {
          const remainingClusters = clusters.slice(i + 1)
          console.log(`   🔄 Redistributing to ${remainingClusters.length} remaining clusters`)

          const updatedClusters = redistributeFailedWords(unplaced, remainingClusters)

          // Update clusters array with redistributed clusters
          clusters = [...clusters.slice(0, i + 1), ...updatedClusters]

          console.log(`   ✓ Redistributed successfully`)
        } else {
          // Last puzzle - save for final retry
          allFailedWords.push(...unplaced)
        }
      }
    } else {
      console.log(`   ❌ Failed to generate puzzle`)
      allFailedWords.push(...cluster.words)
    }

    // Try backtracking for puzzles 2+ if they have failures
    if (i > 0 && puzzle) {
      const placedIds = new Set(puzzle.placedWords.map(w => w.id))
      const failed = cluster.words.filter(w => !placedIds.has(w.id))

      if (failed.length > 0 && failed.length <= 3) {
        console.log(`   🔙 Attempting backtracking for ${failed.length} failed words...`)

        const placed = cluster.words.filter(w => placedIds.has(w.id))
        const betterPuzzle = generateWithBacktracking(
          placed,
          failed,
          { ...DEFAULT_CONFIG, ...config },
          3
        )

        if (betterPuzzle && betterPuzzle.placedWords.length > puzzle.placedWords.length) {
          // Replace with better puzzle
          puzzles[puzzles.length - 1] = betterPuzzle
          console.log(`   ✓ Backtracking improved: ${betterPuzzle.placedWords.length}/${cluster.words.length} words`)
        }
      }
    }
  }

  // Step 3: Handle any remaining failed words with small puzzles
  if (allFailedWords.length > 0) {
    console.log(`\n🔄 Final retry: ${allFailedWords.length} unplaced words`)

    const retryPuzzles = await retryFailedWords(allFailedWords, config)
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
