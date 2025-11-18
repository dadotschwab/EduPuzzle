/**
 * Connectivity validation for crossword puzzles
 * Adapted for Deno Edge Functions
 */

import type { PlacedWordInternal } from './types.ts'
import { Grid } from './grid.ts'

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
