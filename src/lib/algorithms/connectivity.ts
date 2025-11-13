/**
 * @fileoverview Connectivity validation for crossword puzzles
 *
 * Ensures all words in the puzzle are connected (no islands).
 * Uses graph traversal (DFS) to verify connectivity.
 *
 * @module lib/algorithms/connectivity
 */

import type { PlacedWordInternal } from './types'
import { Grid } from './grid'

/**
 * Checks if all placed words in the grid are connected
 *
 * A puzzle is connected if you can reach any word from any other word
 * by following crossing points.
 *
 * @param grid - The grid to check
 * @returns true if all words are connected, false if there are islands
 */
export function isConnected(grid: Grid): boolean {
  const placedWords = grid.getPlacedWords()

  // Empty or single word is always connected
  if (placedWords.length <= 1) {
    return true
  }

  // Build adjacency graph
  const graph = buildWordGraph(placedWords)

  // Perform DFS from first word
  const visited = new Set<string>()
  const startWord = placedWords[0]

  dfs(startWord.id, graph, visited)

  // Check if all words were visited
  return visited.size === placedWords.length
}

/**
 * Builds an adjacency graph of word connections
 *
 * @param placedWords - Array of placed words
 * @returns Map of word ID to set of connected word IDs
 */
function buildWordGraph(
  placedWords: PlacedWordInternal[]
): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>()

  // Initialize graph with all words
  placedWords.forEach(word => {
    graph.set(word.id, new Set<string>())
  })

  // Add edges based on crossings
  placedWords.forEach(word => {
    word.crossings.forEach(crossing => {
      // Add bidirectional edge
      graph.get(word.id)?.add(crossing.otherWordId)
      graph.get(crossing.otherWordId)?.add(word.id)
    })
  })

  return graph
}

/**
 * Depth-first search to mark connected words
 *
 * @param wordId - Current word ID
 * @param graph - Adjacency graph
 * @param visited - Set of visited word IDs
 */
function dfs(
  wordId: string,
  graph: Map<string, Set<string>>,
  visited: Set<string>
): void {
  if (visited.has(wordId)) return

  visited.add(wordId)

  const neighbors = graph.get(wordId)
  if (neighbors) {
    neighbors.forEach(neighborId => {
      dfs(neighborId, graph, visited)
    })
  }
}

/**
 * Finds disconnected components (islands) in the puzzle
 *
 * @param grid - The grid to analyze
 * @returns Array of word groups, where each group is a connected component
 */
export function findIslands(grid: Grid): string[][] {
  const placedWords = grid.getPlacedWords()

  if (placedWords.length === 0) {
    return []
  }

  const graph = buildWordGraph(placedWords)
  const visited = new Set<string>()
  const islands: string[][] = []

  // Find all connected components
  placedWords.forEach(word => {
    if (!visited.has(word.id)) {
      const island: string[] = []
      const componentVisited = new Set<string>()

      dfs(word.id, graph, componentVisited)

      componentVisited.forEach(id => {
        visited.add(id)
        island.push(id)
      })

      islands.push(island)
    }
  })

  return islands
}

/**
 * Gets statistics about puzzle connectivity
 *
 * @param grid - The grid to analyze
 * @returns Connectivity statistics
 */
export function getConnectivityStats(grid: Grid): {
  isFullyConnected: boolean
  totalWords: number
  islandCount: number
  largestIslandSize: number
  averageCrossingsPerWord: number
} {
  const placedWords = grid.getPlacedWords()
  const islands = findIslands(grid)
  const totalWords = placedWords.length

  const totalCrossings = placedWords.reduce(
    (sum, word) => sum + word.crossings.length,
    0
  )

  // Each crossing is counted twice (once per word), so divide by 2
  const uniqueCrossings = totalCrossings / 2
  const avgCrossings = totalWords > 0 ? uniqueCrossings / totalWords : 0

  return {
    isFullyConnected: islands.length <= 1,
    totalWords,
    islandCount: islands.length,
    largestIslandSize: islands.length > 0
      ? Math.max(...islands.map(island => island.length))
      : 0,
    averageCrossingsPerWord: avgCrossings,
  }
}

/**
 * Validates connectivity after placing a word
 * More efficient than full connectivity check
 *
 * @param grid - The grid
 * @param newWordId - ID of the newly placed word
 * @returns true if puzzle remains connected
 */
export function validateAfterPlacement(grid: Grid, newWordId: string): boolean {
  const placedWords = grid.getPlacedWords()

  // First two words are always valid
  if (placedWords.length <= 2) {
    return true
  }

  // Quick check: new word must have at least one crossing
  const newWord = placedWords.find(w => w.id === newWordId)
  if (!newWord || newWord.crossings.length === 0) {
    return false
  }

  // Full connectivity check
  return isConnected(grid)
}
