/**
 * Main crossword puzzle generator with deterministic seeding
 * Adapted for Deno Edge Functions
 */

import type { Word, Puzzle, PlacedWord, Crossing, GenerationConfig } from './types.ts'
import { Grid } from './grid.ts'
import { findPlacements } from './placement.ts'
import { getBestPlacement } from './scoring.ts'
import { isConnected } from './connectivity.ts'
import { clusterWords, validateClustering, getClusteringStats, redistributeFailedWords } from './clustering.ts'
import { SeededRandom } from './seededRandom.ts'

const DEFAULT_CONFIG: GenerationConfig = {
  maxGridSize: 16,
  minGridSize: 10,
  timeoutMs: 10000,
  minCrossingsPerWord: 1,
  maxAttemptsPerWord: 100,
}

function generatePuzzleAttempt(
  words: Word[],
  config: GenerationConfig,
  rng: SeededRandom,
  silent: boolean = false
): Puzzle | null {
  const longestWord = words[0].term.length
  const initialGridSize = Math.max(
    config.minGridSize,
    Math.min(config.maxGridSize, longestWord * 2)
  )

  const grid = new Grid(initialGridSize)

  let placedCount = 0
  let attempts = 0

  for (const word of words) {
    if (attempts >= config.maxAttemptsPerWord * words.length) {
      if (!silent) logger.info('Max attempts reached, stopping generation')
      break
    }

    const placements = findPlacements(word, grid)

    if (placements.length === 0) {
      continue
    }

    const bestPlacement = getBestPlacement(placements, grid)

    if (!bestPlacement) {
      continue
    }

    const placed = grid.placeWord(
      word,
      bestPlacement.x,
      bestPlacement.y,
      bestPlacement.direction
    )

    if (placed) {
      placedCount++
      attempts = 0
    } else {
      attempts++
    }
  }

  if (placedCount === 0) {
    return null
  }

  return convertToPuzzle(grid)
}

async function generatePuzzle(
  words: Word[],
  config: Partial<GenerationConfig> = {}
): Promise<Puzzle | null> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config }
  const startTime = performance.now()

  // Create seeded RNG
  const seed = fullConfig.seed || Date.now().toString()
  const rng = new SeededRandom(seed)

  const sortedWords = [...words].sort((a, b) => b.term.length - a.term.length)

  const maxAttempts = 30
  const minAcceptableWords = Math.max(8, Math.floor(words.length * 0.8))

  let bestPuzzle: Puzzle | null = null
  let bestPlacedCount = 0

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // For first attempt, use sorted order
    // For subsequent attempts, shuffle with seeded RNG
    const orderedWords = attempt === 0
      ? sortedWords
      : [sortedWords[0], ...rng.shuffle(sortedWords.slice(1))]

    const puzzle = generatePuzzleAttempt(orderedWords, fullConfig, rng, true)

    if (puzzle) {
      const placedCount = puzzle.placedWords.length

      if (placedCount > bestPlacedCount) {
        bestPlacedCount = placedCount
        bestPuzzle = puzzle
      }

      if (placedCount === words.length || placedCount >= minAcceptableWords) {
        if (placedCount === words.length) {
          break
        }
      }
    }
  }

  if (!bestPuzzle) {
    logger.error('Failed to place any words after all attempts')
    return null
  }

  // Validate connectivity
  const grid = new Grid(bestPuzzle.gridSize)
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
    logger.warn('Generated puzzle has disconnected components')
  }

  const endTime = performance.now()
  const timeElapsed = endTime - startTime

  logger.info(`Generated puzzle in ${timeElapsed.toFixed(0)}ms - ${bestPlacedCount}/${words.length} words - ${bestPuzzle.gridSize}x${bestPuzzle.gridSize} grid - ${connected ? 'connected' : 'disconnected'}`)

  return bestPuzzle
}

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

  const width = maxX - minX + 1
  const height = maxY - minY + 1
  const squareSize = Math.max(width, height)

  const offsetX = Math.floor((squareSize - width) / 2)
  const offsetY = Math.floor((squareSize - height) / 2)

  const croppedGrid: (string | null)[][] = Array(squareSize)
    .fill(null)
    .map(() => Array(squareSize).fill(null))

  for (let y = 0; y < puzzle.gridSize; y++) {
    for (let x = 0; x < puzzle.gridSize; x++) {
      const letter = puzzle.grid[y][x]
      if (letter !== null) {
        if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
          const newX = x - minX + offsetX
          const newY = y - minY + offsetY
          croppedGrid[newY][newX] = letter
        }
      }
    }
  }

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

function convertToPuzzle(grid: Grid): Puzzle {
  const placedWords = grid.getPlacedWords()

  const publicPlacedWords: PlacedWord[] = placedWords.map(word => {
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

  const cropped = cropToSquare(uncropped)

  if (cropped.gridSize < uncropped.gridSize) {
    logger.info(`Cropped: ${uncropped.gridSize}x${uncropped.gridSize} → ${cropped.gridSize}x${cropped.gridSize}`)
  }

  return {
    id: uncropped.id,
    gridSize: cropped.gridSize,
    placedWords: cropped.placedWords,
    grid: cropped.grid,
  }
}

async function retryFailedWords(
  words: Word[],
  config?: Partial<GenerationConfig>
): Promise<Puzzle[]> {
  const puzzles: Puzzle[] = []

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

export async function generatePuzzles(
  words: Word[],
  config?: Partial<GenerationConfig>
): Promise<Puzzle[]> {
  if (words.length === 0) return []

  logger.info(`Generating puzzles for ${words.length} words`)

  // Step 1: Cluster words
  let clusters = clusterWords(words, {
    minClusterSize: 8,
    maxClusterSize: 15,
    targetClusterSize: 12,
  })

  const stats = getClusteringStats(clusters)
  logger.info(`Created ${clusters.length} clusters - Avg size: ${stats.avgClusterSize.toFixed(1)}, Difficulty: ${stats.difficultyBreakdown.easy}E/${stats.difficultyBreakdown.medium}M/${stats.difficultyBreakdown.hard}H`)

  if (!validateClustering(clusters, words)) {
    logger.warn('Clustering did not cover all words!')
  }

  logger.info(`Clustering details - Avg compatibility: ${stats.avgScore.toFixed(1)}`)

  // Step 2: Generate puzzles
  const puzzles: Puzzle[] = []
  const allFailedWords: Word[] = []

  for (let i = 0; i < clusters.length; i++) {
    const cluster = clusters[i]
    logger.info(`Puzzle ${i + 1}/${clusters.length}: ${cluster.words.length} words (${cluster.difficulty})`)

    const puzzle = await generatePuzzle(cluster.words, config)

    if (puzzle) {
      puzzles.push(puzzle)

      const placedIds = new Set(puzzle.placedWords.map(w => w.id))
      const unplaced = cluster.words.filter(w => !placedIds.has(w.id))

      if (unplaced.length > 0) {
        logger.info(`${unplaced.length} words not placed: ${unplaced.map(w => w.term).join(', ')}`)

        if (i < clusters.length - 1) {
          const remainingClusters = clusters.slice(i + 1)
          logger.info(`Redistributing to ${remainingClusters.length} remaining clusters`)

          const updatedClusters = redistributeFailedWords(unplaced, remainingClusters)
          clusters = [...clusters.slice(0, i + 1), ...updatedClusters]
        } else {
          allFailedWords.push(...unplaced)
        }
      }
    } else {
      logger.warn(`Failed to generate puzzle for cluster ${i + 1}`)
      allFailedWords.push(...cluster.words)
    }
  }

  // Step 3: Retry failed words (only if >= 5 words, to avoid tiny puzzles)
  if (allFailedWords.length >= 5) {
    logger.info(`Final retry: ${allFailedWords.length} unplaced words`)

    const retryPuzzles = await retryFailedWords(allFailedWords, config)
    puzzles.push(...retryPuzzles)
  } else if (allFailedWords.length > 0) {
    logger.info(`Skipping retry for ${allFailedWords.length} failed words (too few to create meaningful puzzle)`)
    logger.info(`Failed words will be available in next batch: ${allFailedWords.map(w => w.term).join(', ')}`)
  }

  // Step 4: Filter out puzzles with too few words (minimum 5 words)
  const MIN_PUZZLE_SIZE = 5
  const filteredPuzzles = puzzles.filter(p => p.placedWords.length >= MIN_PUZZLE_SIZE)

  if (filteredPuzzles.length < puzzles.length) {
    const removed = puzzles.length - filteredPuzzles.length
    const removedWords = puzzles
      .filter(p => p.placedWords.length < MIN_PUZZLE_SIZE)
      .flatMap(p => p.placedWords.map(w => w.word))
    logger.info(`Filtered out ${removed} small puzzle(s) with <${MIN_PUZZLE_SIZE} words`)
    logger.info(`Words from small puzzles will be available in next batch: ${removedWords.join(', ')}`)
  }

  const totalPlaced = filteredPuzzles.reduce((sum, p) => sum + p.placedWords.length, 0)
  const coverage = (totalPlaced / words.length * 100).toFixed(1)

  logger.info(`Generated ${filteredPuzzles.length} puzzles - ${totalPlaced}/${words.length} words (${coverage}% coverage)`)

  return filteredPuzzles
}
