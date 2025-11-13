/**
 * @fileoverview Word clustering for optimal puzzle generation
 *
 * Groups words based on letter overlap to maximize crossing potential.
 * Creates clusters of 10-15 words that can form tight, connected puzzles.
 *
 * @module lib/algorithms/clustering
 */

import type { Word } from '@/types'

/**
 * Word cluster with metadata
 */
export interface WordCluster {
  words: Word[]
  score: number              // Overall cluster quality
  avgLetterOverlap: number   // Average shared letters between words
  difficulty: 'easy' | 'medium' | 'hard'
}

/**
 * Configuration for clustering
 */
export interface ClusterConfig {
  minClusterSize: number     // Minimum words per cluster
  maxClusterSize: number     // Maximum words per cluster
  targetClusterSize: number  // Ideal cluster size
  minOverlap: number         // Minimum shared letters to consider
}

/**
 * Default clustering configuration
 * Optimized for 16x16 grids
 */
const DEFAULT_CONFIG: ClusterConfig = {
  minClusterSize: 8,
  maxClusterSize: 15,
  targetClusterSize: 12,
  minOverlap: 1,
}

/**
 * Calculates how many letters two words share
 *
 * @param word1 - First word
 * @param word2 - Second word
 * @returns Count of shared unique letters
 */
function getSharedLetterCount(word1: Word, word2: Word): number {
  const letters1 = new Set(word1.term.split(''))
  const letters2 = new Set(word2.term.split(''))

  let count = 0
  letters1.forEach(letter => {
    if (letters2.has(letter)) count++
  })

  return count
}

/**
 * Calculates total possible crossing points between two words
 * (More precise than just shared letters)
 *
 * @param word1 - First word
 * @param word2 - Second word
 * @returns Number of possible crossing positions
 */
function getCrossingPotential(word1: Word, word2: Word): number {
  let crossings = 0

  for (let i = 0; i < word1.term.length; i++) {
    for (let j = 0; j < word2.term.length; j++) {
      if (word1.term[i] === word2.term[j]) {
        crossings++
      }
    }
  }

  return crossings
}

/**
 * Calculates a compatibility score between two words
 * Higher score = better clustering potential
 *
 * @param word1 - First word
 * @param word2 - Second word
 * @returns Compatibility score (0-100)
 */
function getCompatibilityScore(word1: Word, word2: Word): number {
  const sharedLetters = getSharedLetterCount(word1, word2)
  const crossingPotential = getCrossingPotential(word1, word2)

  if (sharedLetters === 0) return 0

  // Weight factors
  const letterScore = sharedLetters * 10
  const crossingScore = crossingPotential * 5

  // Bonus for similar word lengths (easier to place together)
  const lengthDiff = Math.abs(word1.term.length - word2.term.length)
  const lengthBonus = lengthDiff <= 2 ? 10 : 0

  return letterScore + crossingScore + lengthBonus
}

/**
 * Builds a compatibility matrix for all word pairs
 *
 * @param words - Array of words
 * @returns Map of word pairs to compatibility scores
 */
function buildCompatibilityMatrix(
  words: Word[]
): Map<string, number> {
  const matrix = new Map<string, number>()

  for (let i = 0; i < words.length; i++) {
    for (let j = i + 1; j < words.length; j++) {
      const key = `${words[i].id}-${words[j].id}`
      const score = getCompatibilityScore(words[i], words[j])
      matrix.set(key, score)
    }
  }

  return matrix
}

/**
 * Gets compatibility score between two words from matrix
 */
function getScore(
  matrix: Map<string, number>,
  word1: Word,
  word2: Word
): number {
  const key1 = `${word1.id}-${word2.id}`
  const key2 = `${word2.id}-${word1.id}`
  return matrix.get(key1) || matrix.get(key2) || 0
}

/**
 * Balanced clustering algorithm
 * Distributes words evenly across clusters to ensure all clusters have similar quality
 *
 * @param words - Words to cluster
 * @param config - Clustering configuration
 * @returns Array of word clusters
 */
export function clusterWords(
  words: Word[],
  config: Partial<ClusterConfig> = {}
): WordCluster[] {
  const fullConfig = { ...DEFAULT_CONFIG, ...config }

  // Calculate optimal number of clusters
  const targetCount = Math.ceil(words.length / fullConfig.targetClusterSize)
  const compatMatrix = buildCompatibilityMatrix(words)

  // Initialize empty clusters
  const clusterArrays: Word[][] = Array(targetCount).fill(null).map(() => [])
  const remaining = new Set(words.map(w => w.id))

  // Sort words by length (mix of long and short in each cluster)
  const sortedWords = [...words].sort((a, b) => b.term.length - a.term.length)

  // Phase 1: Seed each cluster with one long word (round-robin)
  for (let i = 0; i < targetCount && remaining.size > 0; i++) {
    const seedWord = sortedWords.find(w => remaining.has(w.id))
    if (!seedWord) break

    clusterArrays[i].push(seedWord)
    remaining.delete(seedWord.id)
  }

  // Phase 2: Distribute remaining words round-robin, prioritizing compatibility
  let currentClusterIndex = 0

  while (remaining.size > 0) {
    // Skip clusters that are already at max size
    while (clusterArrays[currentClusterIndex].length >= fullConfig.maxClusterSize) {
      currentClusterIndex = (currentClusterIndex + 1) % targetCount

      // If all clusters are full, break
      const allFull = clusterArrays.every(c => c.length >= fullConfig.maxClusterSize)
      if (allFull) break
    }

    if (clusterArrays.every(c => c.length >= fullConfig.maxClusterSize)) break

    const currentCluster = clusterArrays[currentClusterIndex]

    // Find best word for this cluster
    let bestWord: Word | null = null
    let bestScore = 0

    for (const word of sortedWords) {
      if (!remaining.has(word.id)) continue

      // Calculate average compatibility with current cluster
      let totalScore = 0
      for (const clusterWord of currentCluster) {
        totalScore += getScore(compatMatrix, word, clusterWord)
      }
      const avgScore = currentCluster.length > 0 ? totalScore / currentCluster.length : 0

      if (avgScore > bestScore) {
        bestScore = avgScore
        bestWord = word
      }
    }

    // Add best word if found
    if (bestWord) {
      currentCluster.push(bestWord)
      remaining.delete(bestWord.id)
    } else {
      // If no compatible word found, take any remaining word
      const anyWord = sortedWords.find(w => remaining.has(w.id))
      if (anyWord) {
        currentCluster.push(anyWord)
        remaining.delete(anyWord.id)
      }
    }

    // Move to next cluster
    currentClusterIndex = (currentClusterIndex + 1) % targetCount
  }

  // Phase 3: Build cluster objects with metadata
  const clusters: WordCluster[] = clusterArrays
    .filter(cluster => cluster.length > 0)
    .map(cluster => {
      const clusterScore = calculateClusterScore(cluster, compatMatrix)
      const avgOverlap = calculateAverageOverlap(cluster)
      const difficulty = assessClusterDifficulty(cluster)

      return {
        words: cluster,
        score: clusterScore,
        avgLetterOverlap: avgOverlap,
        difficulty,
      }
    })

  return clusters
}

/**
 * Calculates overall quality score for a cluster
 *
 * @param cluster - Words in the cluster
 * @param matrix - Compatibility matrix
 * @returns Quality score (higher is better)
 */
function calculateClusterScore(
  cluster: Word[],
  matrix: Map<string, number>
): number {
  if (cluster.length === 1) return 0

  let totalScore = 0
  let pairCount = 0

  for (let i = 0; i < cluster.length; i++) {
    for (let j = i + 1; j < cluster.length; j++) {
      totalScore += getScore(matrix, cluster[i], cluster[j])
      pairCount++
    }
  }

  return pairCount > 0 ? totalScore / pairCount : 0
}

/**
 * Calculates average letter overlap in cluster
 */
function calculateAverageOverlap(cluster: Word[]): number {
  if (cluster.length === 1) return 0

  let totalOverlap = 0
  let pairCount = 0

  for (let i = 0; i < cluster.length; i++) {
    for (let j = i + 1; j < cluster.length; j++) {
      totalOverlap += getSharedLetterCount(cluster[i], cluster[j])
      pairCount++
    }
  }

  return pairCount > 0 ? totalOverlap / pairCount : 0
}

/**
 * Assesses difficulty of placing a cluster
 * Based on letter rarity and word lengths
 */
function assessClusterDifficulty(cluster: Word[]): 'easy' | 'medium' | 'hard' {
  const avgLength = cluster.reduce((sum, w) => sum + w.term.length, 0) / cluster.length

  // Count rare letters
  const rareLetters = ['Q', 'X', 'Z', 'J', 'K']
  let rareCount = 0
  cluster.forEach(word => {
    rareLetters.forEach(rare => {
      if (word.term.includes(rare)) rareCount++
    })
  })

  const rareRatio = rareCount / cluster.length

  // Assess difficulty
  if (rareRatio > 0.3 || avgLength > 9) return 'hard'
  if (rareRatio > 0.1 || avgLength > 7) return 'medium'
  return 'easy'
}

/**
 * Validates that clustering covers all words
 *
 * @param clusters - Generated clusters
 * @param originalWords - Original word list
 * @returns true if all words are in at least one cluster
 */
export function validateClustering(
  clusters: WordCluster[],
  originalWords: Word[]
): boolean {
  const coveredIds = new Set<string>()

  clusters.forEach(cluster => {
    cluster.words.forEach(word => {
      coveredIds.add(word.id)
    })
  })

  return originalWords.every(word => coveredIds.has(word.id))
}

/**
 * Gets statistics about clustering
 *
 * @param clusters - Generated clusters
 * @returns Clustering statistics
 */
export function getClusteringStats(clusters: WordCluster[]): {
  totalClusters: number
  totalWords: number
  avgClusterSize: number
  minClusterSize: number
  maxClusterSize: number
  avgScore: number
  avgOverlap: number
  difficultyBreakdown: Record<string, number>
} {
  const totalWords = clusters.reduce((sum, c) => sum + c.words.length, 0)
  const avgClusterSize = totalWords / clusters.length
  const sizes = clusters.map(c => c.words.length)
  const avgScore = clusters.reduce((sum, c) => sum + c.score, 0) / clusters.length
  const avgOverlap = clusters.reduce((sum, c) => sum + c.avgLetterOverlap, 0) / clusters.length

  const difficultyBreakdown = {
    easy: 0,
    medium: 0,
    hard: 0,
  }

  clusters.forEach(c => {
    difficultyBreakdown[c.difficulty]++
  })

  return {
    totalClusters: clusters.length,
    totalWords,
    avgClusterSize,
    minClusterSize: Math.min(...sizes),
    maxClusterSize: Math.max(...sizes),
    avgScore,
    avgOverlap,
    difficultyBreakdown,
  }
}

/**
 * Redistributes failed words to remaining clusters based on compatibility
 *
 * @param failedWords - Words that couldn't be placed
 * @param remainingClusters - Clusters that haven't been generated yet
 * @returns Updated clusters with redistributed words
 */
export function redistributeFailedWords(
  failedWords: Word[],
  remainingClusters: WordCluster[]
): WordCluster[] {
  if (failedWords.length === 0 || remainingClusters.length === 0) {
    return remainingClusters
  }

  // Build compatibility matrix for failed words vs cluster words
  const allWords = [
    ...failedWords,
    ...remainingClusters.flatMap(c => c.words)
  ]
  const compatMatrix = buildCompatibilityMatrix(allWords)

  // For each failed word, find best cluster
  failedWords.forEach(failedWord => {
    let bestClusterIndex = 0
    let bestScore = -1

    // Calculate compatibility with each cluster
    remainingClusters.forEach((cluster, clusterIndex) => {
      let totalScore = 0

      // Calculate average compatibility with cluster members
      cluster.words.forEach(clusterWord => {
        totalScore += getScore(compatMatrix, failedWord, clusterWord)
      })

      const avgScore = cluster.words.length > 0 ? totalScore / cluster.words.length : 0

      if (avgScore > bestScore) {
        bestScore = avgScore
        bestClusterIndex = clusterIndex
      }
    })

    // Add failed word to best cluster
    remainingClusters[bestClusterIndex].words.push(failedWord)
  })

  // Recalculate cluster metadata after redistribution
  return remainingClusters.map(cluster => {
    const compatMatrix = buildCompatibilityMatrix(cluster.words)
    const clusterScore = calculateClusterScore(cluster.words, compatMatrix)
    const avgOverlap = calculateAverageOverlap(cluster.words)
    const difficulty = assessClusterDifficulty(cluster.words)

    return {
      words: cluster.words,
      score: clusterScore,
      avgLetterOverlap: avgOverlap,
      difficulty,
    }
  })
}

/**
 * Optimizes cluster sizes by splitting large clusters
 * Ensures all clusters fit within 16x16 grid constraints
 *
 * @param clusters - Initial clusters
 * @param maxSize - Maximum cluster size
 * @returns Optimized clusters
 */
export function optimizeClusterSizes(
  clusters: WordCluster[],
  maxSize: number = 15
): WordCluster[] {
  const optimized: WordCluster[] = []

  clusters.forEach(cluster => {
    if (cluster.words.length <= maxSize) {
      optimized.push(cluster)
    } else {
      // Split large cluster into smaller ones
      const splitClusters = splitCluster(cluster, maxSize)
      optimized.push(...splitClusters)
    }
  })

  return optimized
}

/**
 * Splits a large cluster into smaller, compatible sub-clusters
 */
function splitCluster(cluster: WordCluster, maxSize: number): WordCluster[] {
  const result: WordCluster[] = []
  const words = [...cluster.words]

  while (words.length > 0) {
    const subCluster = words.splice(0, maxSize)
    const avgOverlap = calculateAverageOverlap(subCluster)
    const difficulty = assessClusterDifficulty(subCluster)

    result.push({
      words: subCluster,
      score: cluster.score, // Inherit parent score
      avgLetterOverlap: avgOverlap,
      difficulty,
    })
  }

  return result
}
