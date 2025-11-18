/**
 * Word clustering for optimal puzzle generation
 * Adapted for Deno Edge Functions
 */

import type { Word, WordCluster, ClusterConfig } from './types.ts'

const DEFAULT_CONFIG: ClusterConfig = {
  minClusterSize: 8,
  maxClusterSize: 15,
  targetClusterSize: 12,
  minOverlap: 1,
}

function getSharedLetterCount(word1: Word, word2: Word): number {
  const letters1 = new Set(word1.term.split(''))
  const letters2 = new Set(word2.term.split(''))

  let count = 0
  letters1.forEach(letter => {
    if (letters2.has(letter)) count++
  })

  return count
}

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

function getCompatibilityScore(word1: Word, word2: Word): number {
  const sharedLetters = getSharedLetterCount(word1, word2)
  const crossingPotential = getCrossingPotential(word1, word2)

  if (sharedLetters === 0) return 0

  const letterScore = sharedLetters * 10
  const crossingScore = crossingPotential * 5
  const lengthDiff = Math.abs(word1.term.length - word2.term.length)
  const lengthBonus = lengthDiff <= 2 ? 10 : 0

  return letterScore + crossingScore + lengthBonus
}

function buildCompatibilityMatrix(words: Word[]): Map<string, number> {
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

function getScore(matrix: Map<string, number>, word1: Word, word2: Word): number {
  const key1 = `${word1.id}-${word2.id}`
  const key2 = `${word2.id}-${word1.id}`
  return matrix.get(key1) || matrix.get(key2) || 0
}

export function clusterWords(
  words: Word[],
  config: Partial<ClusterConfig> = {}
): WordCluster[] {
  const fullConfig = { ...DEFAULT_CONFIG, ...config }

  const targetCount = Math.ceil(words.length / fullConfig.targetClusterSize)
  const compatMatrix = buildCompatibilityMatrix(words)

  const clusterArrays: Word[][] = Array(targetCount).fill(null).map(() => [])
  const remaining = new Set(words.map(w => w.id))

  const sortedWords = [...words].sort((a, b) => b.term.length - a.term.length)

  // Phase 1: Seed clusters
  for (let i = 0; i < targetCount && remaining.size > 0; i++) {
    const seedWord = sortedWords.find(w => remaining.has(w.id))
    if (!seedWord) break

    clusterArrays[i].push(seedWord)
    remaining.delete(seedWord.id)
  }

  // Phase 2: Distribute remaining words
  let currentClusterIndex = 0

  while (remaining.size > 0) {
    while (clusterArrays[currentClusterIndex].length >= fullConfig.maxClusterSize) {
      currentClusterIndex = (currentClusterIndex + 1) % targetCount

      const allFull = clusterArrays.every(c => c.length >= fullConfig.maxClusterSize)
      if (allFull) break
    }

    if (clusterArrays.every(c => c.length >= fullConfig.maxClusterSize)) break

    const currentCluster = clusterArrays[currentClusterIndex]

    let bestWord: Word | null = null
    let bestScore = 0

    for (const word of sortedWords) {
      if (!remaining.has(word.id)) continue

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

    if (bestWord) {
      currentCluster.push(bestWord)
      remaining.delete(bestWord.id)
    } else {
      const anyWord = sortedWords.find(w => remaining.has(w.id))
      if (anyWord) {
        currentCluster.push(anyWord)
        remaining.delete(anyWord.id)
      }
    }

    currentClusterIndex = (currentClusterIndex + 1) % targetCount
  }

  // Phase 3: Build cluster objects
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

function calculateClusterScore(cluster: Word[], matrix: Map<string, number>): number {
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

function assessClusterDifficulty(cluster: Word[]): 'easy' | 'medium' | 'hard' {
  const avgLength = cluster.reduce((sum, w) => sum + w.term.length, 0) / cluster.length

  const rareLetters = ['Q', 'X', 'Z', 'J', 'K']
  let rareCount = 0
  cluster.forEach(word => {
    rareLetters.forEach(rare => {
      if (word.term.includes(rare)) rareCount++
    })
  })

  const rareRatio = rareCount / cluster.length

  if (rareRatio > 0.3 || avgLength > 9) return 'hard'
  if (rareRatio > 0.1 || avgLength > 7) return 'medium'
  return 'easy'
}

export function validateClustering(clusters: WordCluster[], originalWords: Word[]): boolean {
  const coveredIds = new Set<string>()

  clusters.forEach(cluster => {
    cluster.words.forEach(word => {
      coveredIds.add(word.id)
    })
  })

  return originalWords.every(word => coveredIds.has(word.id))
}

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

export function redistributeFailedWords(
  failedWords: Word[],
  remainingClusters: WordCluster[]
): WordCluster[] {
  if (failedWords.length === 0 || remainingClusters.length === 0) {
    return remainingClusters
  }

  const allWords = [
    ...failedWords,
    ...remainingClusters.flatMap(c => c.words)
  ]
  const compatMatrix = buildCompatibilityMatrix(allWords)

  failedWords.forEach(failedWord => {
    let bestClusterIndex = 0
    let bestScore = -1

    remainingClusters.forEach((cluster, clusterIndex) => {
      let totalScore = 0

      cluster.words.forEach(clusterWord => {
        totalScore += getScore(compatMatrix, failedWord, clusterWord)
      })

      const avgScore = cluster.words.length > 0 ? totalScore / cluster.words.length : 0

      if (avgScore > bestScore) {
        bestScore = avgScore
        bestClusterIndex = clusterIndex
      }
    })

    remainingClusters[bestClusterIndex].words.push(failedWord)
  })

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
