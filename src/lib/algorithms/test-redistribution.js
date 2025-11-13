/**
 * Test Redistribution Strategy with Backtracking
 *
 * Tests the new approach:
 * 1. First puzzle: 30 attempts
 * 2. Failed words redistributed to remaining clusters
 * 3. Remaining puzzles: 30 attempts + backtracking
 *
 * Target: 99%+ average coverage
 */

// Mock word data (same as before)
const easyWords = [
  'TIME', 'LIFE', 'WORK', 'PLACE', 'WORLD', 'GREAT', 'FIRST', 'LARGE',
  'WATER', 'POWER', 'POINT', 'STATE', 'NIGHT', 'LIGHT', 'RIGHT', 'HEART',
  'EARTH', 'NATURE', 'MUSIC', 'TRADE', 'STREAM', 'PARENT', 'MARKET', 'REASON',
  'MOMENT', 'SOCIAL', 'WINTER', 'SPRING', 'SUMMER', 'AUTHOR', 'LEADER', 'MASTER',
  'PLANET', 'SISTER', 'BROTHER', 'GARDEN', 'FOREST', 'DESERT', 'MOUNTAIN', 'OCEAN',
  'ENERGY', 'MATTER', 'ANIMAL', 'PERSON', 'FUTURE', 'PRESENT', 'HISTORY', 'CULTURE',
  'SCIENCE', 'LEARNING'
]

const mediumWords = [
  'ALGORITHM', 'KNOWLEDGE', 'QUESTION', 'UNIVERSE', 'CREATIVE', 'POSITIVE',
  'PRACTICE', 'STRATEGY', 'SOLUTION', 'FUNCTION', 'LANGUAGE', 'PLATFORM',
  'PROGRESS', 'NETWORK', 'RESOURCE', 'DISCOVER', 'EXPLORE', 'JOURNEY',
  'ADVENTURE', 'TREASURE', 'SYMPHONY', 'HARMONY', 'BALANCE', 'CRYSTAL',
  'DIAMOND', 'EMERALD', 'SAPPHIRE', 'TOPAZ', 'QUARTZ', 'GRANITE',
  'MARBLE', 'BRONZE', 'SILVER', 'GOLDEN', 'PLATINUM', 'MERCURY',
  'JUPITER', 'SATURN', 'NEPTUNE', 'PLUTO', 'GALAXY', 'NEBULA',
  'ASTEROID', 'COMET', 'METEOR', 'ECLIPSE', 'EQUINOX', 'SOLSTICE',
  'GRAVITY', 'VELOCITY'
]

// Helper functions
function getSharedLetters(word1, word2) {
  const letters1 = new Set(word1.split(''))
  const letters2 = new Set(word2.split(''))
  let count = 0
  letters1.forEach(l => { if (letters2.has(l)) count++ })
  return count
}

function getCrossingPotential(word1, word2) {
  let crossings = 0
  for (let i = 0; i < word1.length; i++) {
    for (let j = 0; j < word2.length; j++) {
      if (word1[i] === word2[j]) crossings++
    }
  }
  return crossings
}

function getCompatibilityScore(word1, word2) {
  const shared = getSharedLetters(word1, word2)
  if (shared === 0) return 0
  const crossings = getCrossingPotential(word1, word2)
  const lengthDiff = Math.abs(word1.length - word2.length)
  const lengthBonus = lengthDiff <= 2 ? 10 : 0
  return shared * 10 + crossings * 5 + lengthBonus
}

function buildCompatibilityMatrix(words) {
  const matrix = new Map()
  for (let i = 0; i < words.length; i++) {
    for (let j = i + 1; j < words.length; j++) {
      const key = `${i}-${j}`
      const score = getCompatibilityScore(words[i], words[j])
      matrix.set(key, score)
    }
  }
  return matrix
}

function getScore(matrix, idx1, idx2) {
  const key1 = `${idx1}-${idx2}`
  const key2 = `${idx2}-${idx1}`
  return matrix.get(key1) || matrix.get(key2) || 0
}

// Balanced clustering
function clusterWords(words, targetSize = 12, maxSize = 15) {
  const targetCount = Math.ceil(words.length / targetSize)
  const compatMatrix = buildCompatibilityMatrix(words)

  const clusters = Array(targetCount).fill(null).map(() => [])
  const remaining = new Set(words.map((_, i) => i))

  const sortedIndices = words
    .map((w, i) => ({ word: w, index: i }))
    .sort((a, b) => b.word.length - a.word.length)
    .map(x => x.index)

  // Seed clusters
  for (let i = 0; i < targetCount && remaining.size > 0; i++) {
    const seedIdx = sortedIndices.find(idx => remaining.has(idx))
    if (seedIdx === undefined) break
    clusters[i].push(seedIdx)
    remaining.delete(seedIdx)
  }

  // Distribute round-robin
  let currentClusterIndex = 0
  while (remaining.size > 0) {
    while (clusters[currentClusterIndex].length >= maxSize) {
      currentClusterIndex = (currentClusterIndex + 1) % targetCount
      if (clusters.every(c => c.length >= maxSize)) break
    }
    if (clusters.every(c => c.length >= maxSize)) break

    const currentCluster = clusters[currentClusterIndex]
    let bestIdx = null
    let bestScore = 0

    for (const idx of sortedIndices) {
      if (!remaining.has(idx)) continue
      let totalScore = 0
      for (const clusterIdx of currentCluster) {
        totalScore += getScore(compatMatrix, idx, clusterIdx)
      }
      const avgScore = currentCluster.length > 0 ? totalScore / currentCluster.length : 0
      if (avgScore > bestScore) {
        bestScore = avgScore
        bestIdx = idx
      }
    }

    if (bestIdx !== null) {
      currentCluster.push(bestIdx)
      remaining.delete(bestIdx)
    } else {
      const anyIdx = sortedIndices.find(idx => remaining.has(idx))
      if (anyIdx !== undefined) {
        currentCluster.push(anyIdx)
        remaining.delete(anyIdx)
      }
    }
    currentClusterIndex = (currentClusterIndex + 1) % targetCount
  }

  return clusters.filter(c => c.length > 0).map(cluster => cluster.map(idx => words[idx]))
}

// Redistribute failed words to remaining clusters
function redistributeFailedWords(failedWords, remainingClusters, allWords) {
  if (failedWords.length === 0 || remainingClusters.length === 0) {
    return remainingClusters
  }

  const compatMatrix = buildCompatibilityMatrix(allWords)

  failedWords.forEach(failedWord => {
    let bestClusterIndex = 0
    let bestScore = -1

    remainingClusters.forEach((cluster, clusterIndex) => {
      let totalScore = 0
      cluster.forEach(clusterWord => {
        const idx1 = allWords.indexOf(failedWord)
        const idx2 = allWords.indexOf(clusterWord)
        totalScore += getScore(compatMatrix, idx1, idx2)
      })
      const avgScore = cluster.length > 0 ? totalScore / cluster.length : 0

      if (avgScore > bestScore) {
        bestScore = avgScore
        bestClusterIndex = clusterIndex
      }
    })

    remainingClusters[bestClusterIndex].push(failedWord)
  })

  return remainingClusters
}

// Grid class
class Grid {
  constructor(size = 16) {
    this.size = Math.min(size, 16)
    this.cells = Array(this.size).fill(null).map(() =>
      Array(this.size).fill(null).map(() => ({ letter: null, wordIds: new Set() }))
    )
    this.placedWords = new Map()
    this.nextNumber = 1
  }

  getLetter(x, y) {
    if (x < 0 || x >= this.size || y < 0 || y >= this.size) return null
    return this.cells[y][x].letter
  }

  canPlace(word, x, y, direction) {
    const len = word.length
    const dx = direction === 'across' ? 1 : 0
    const dy = direction === 'down' ? 1 : 0

    if (direction === 'across' && x + len > this.size) return false
    if (direction === 'down' && y + len > this.size) return false

    for (let i = 0; i < len; i++) {
      const cx = x + i * dx
      const cy = y + i * dy
      const cell = this.cells[cy][cx]
      if (cell.letter && cell.letter !== word[i]) return false
    }

    for (let i = 0; i < len; i++) {
      const cx = x + i * dx
      const cy = y + i * dy
      const cell = this.cells[cy][cx]

      if (!cell.letter || cell.letter !== word[i]) {
        const px = direction === 'across' ? cx : cx - 1
        const py = direction === 'across' ? cy - 1 : cy
        const nx = direction === 'across' ? cx : cx + 1
        const ny = direction === 'across' ? cy + 1 : cy
        if (this.getLetter(px, py) || this.getLetter(nx, ny)) return false
      }
    }

    const beforeX = x - dx
    const beforeY = y - dy
    const afterX = x + len * dx
    const afterY = y + len * dy
    if (this.getLetter(beforeX, beforeY) || this.getLetter(afterX, afterY)) return false

    return true
  }

  place(word, x, y, direction) {
    if (!this.canPlace(word, x, y, direction)) return null

    const len = word.length
    const dx = direction === 'across' ? 1 : 0
    const dy = direction === 'down' ? 1 : 0
    const id = `word_${this.nextNumber}`

    for (let i = 0; i < len; i++) {
      const cx = x + i * dx
      const cy = y + i * dy
      if (cy < 0 || cy >= this.size || cx < 0 || cx >= this.size) return null
      this.cells[cy][cx].letter = word[i]
      this.cells[cy][cx].wordIds.add(id)
    }

    const placed = { id, word, x, y, direction, number: this.nextNumber }
    this.placedWords.set(id, placed)
    this.nextNumber++
    return placed
  }

  getActualSize() {
    let minX = this.size, maxX = -1, minY = this.size, maxY = -1
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (this.cells[y][x].letter) {
          minX = Math.min(minX, x)
          maxX = Math.max(maxX, x)
          minY = Math.min(minY, y)
          maxY = Math.max(maxY, y)
        }
      }
    }
    return { width: maxX - minX + 1, height: maxY - minY + 1 }
  }
}

// Shuffle function
function shuffleArray(array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Generate single puzzle attempt
function generatePuzzleAttempt(words) {
  const grid = new Grid(16)
  const placed = new Set()

  if (words.length > 0) {
    const firstWord = words[0]
    const startX = Math.floor((16 - firstWord.length) / 2)
    const startY = 8
    const result = grid.place(firstWord, startX, startY, 'across')
    if (result) placed.add(firstWord)
  }

  for (let i = 1; i < words.length; i++) {
    const word = words[i]
    let bestPlacement = null
    let bestScore = -1

    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        for (const direction of ['across', 'down']) {
          if (grid.canPlace(word, x, y, direction)) {
            let crossings = 0
            const dx = direction === 'across' ? 1 : 0
            const dy = direction === 'down' ? 1 : 0

            for (let j = 0; j < word.length; j++) {
              const cx = x + j * dx
              const cy = y + j * dy
              if (grid.getLetter(cx, cy) === word[j]) crossings++
            }

            if (placed.size > 0 && crossings === 0) continue
            const score = crossings * 100

            if (score > bestScore) {
              bestScore = score
              bestPlacement = { word, x, y, direction }
            }
          }
        }
      }
    }

    if (bestPlacement) {
      grid.place(bestPlacement.word, bestPlacement.x, bestPlacement.y, bestPlacement.direction)
      placed.add(word)
    }
  }

  return { placedCount: placed.size, grid: grid, placedWords: Array.from(placed) }
}

// Generate puzzle with 30 attempts
function generatePuzzle(words, maxAttempts = 30) {
  const sorted = [...words].sort((a, b) => b.length - a.length)
  const minAcceptable = Math.max(8, Math.floor(words.length * 0.85))

  let bestResult = null
  let bestCount = 0

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const orderedWords = attempt === 0 ? sorted : [sorted[0], ...shuffleArray(sorted.slice(1))]
    const result = generatePuzzleAttempt(orderedWords)

    if (result.placedCount > bestCount) {
      bestCount = result.placedCount
      bestResult = result
    }

    if (result.placedCount === words.length) break
    if (result.placedCount >= minAcceptable && attempt >= 10) break
  }

  if (!bestResult) {
    return { placedCount: 0, totalCount: words.length, placedWords: [], failed: words }
  }

  const actualSize = bestResult.grid.getActualSize()
  const failed = words.filter(w => !bestResult.placedWords.includes(w))

  return {
    placedCount: bestResult.placedCount,
    totalCount: words.length,
    placedWords: bestResult.placedWords,
    gridSize: `${actualSize.width}x${actualSize.height}`,
    failed: failed
  }
}

// Backtracking (simplified for testing)
function generateWithBacktracking(allWords, placed, failed) {
  // Simple backtracking: try placing failed word with different orderings
  const sorted = allWords.sort((a, b) => b.length - a.length)

  for (const failedWord of failed) {
    const orderings = [
      [failedWord, ...placed],
      [...placed, failedWord],
      [sorted[0], failedWord, ...placed.slice(1)]
    ]

    for (const ordering of orderings) {
      const result = generatePuzzleAttempt(shuffleArray(ordering))
      const failedInResult = failed.filter(w => !result.placedWords.includes(w))
      if (failedInResult.length < failed.length) {
        return result
      }
    }
  }

  return null
}

// Main generation with redistribution
function generatePuzzlesWithRedistribution(words) {
  const clusters = clusterWords(words, 12, 15)
  const puzzles = []
  let allFailedWords = []

  for (let i = 0; i < clusters.length; i++) {
    let clusterWords = clusters[i]

    const result = generatePuzzle(clusterWords, 30)
    puzzles.push(result)

    if (result.failed.length > 0) {
      // Redistribute to remaining clusters
      if (i < clusters.length - 1) {
        const remaining = clusters.slice(i + 1)
        redistributeFailedWords(result.failed, remaining, words)
        // Update clusters
        for (let j = i + 1; j < clusters.length; j++) {
          clusters[j] = remaining[j - i - 1]
        }
      } else {
        allFailedWords.push(...result.failed)
      }
    }

    // Try backtracking for puzzles 2+
    if (i > 0 && result.failed.length > 0 && result.failed.length <= 3) {
      const betterResult = generateWithBacktracking(clusterWords, result.placedWords, result.failed)
      if (betterResult && betterResult.placedCount > result.placedCount) {
        puzzles[puzzles.length - 1] = betterResult
      }
    }
  }

  // Handle remaining failed words
  if (allFailedWords.length > 0) {
    const retryResult = generatePuzzle(allFailedWords, 30)
    if (retryResult.placedCount > 0) {
      puzzles.push(retryResult)
    }
  }

  return puzzles
}

// Run comprehensive tests
console.log('=== REDISTRIBUTION STRATEGY TEST ===\n')
console.log('Target: 99%+ average coverage\n')

function runMultipleTests(name, words, count, runs = 3) {
  console.log(`\n${name} (${count} words, ${runs} runs)`)
  console.log('─'.repeat(70))

  const coverages = []
  const puzzleCounts = []
  const minSizes = []

  for (let run = 1; run <= runs; run++) {
    const selected = words.slice(0, count)
    const puzzles = generatePuzzlesWithRedistribution(selected)

    const totalPlaced = puzzles.reduce((sum, p) => sum + p.placedCount, 0)
    const coverage = (totalPlaced / count * 100).toFixed(1)
    const sizes = puzzles.map(p => p.placedCount)
    const minSize = Math.min(...sizes)

    coverages.push(parseFloat(coverage))
    puzzleCounts.push(puzzles.length)
    minSizes.push(minSize)

    console.log(`  Run ${run}: ${puzzles.length} puzzles, ${totalPlaced}/${count} words (${coverage}%), min size: ${minSize}`)
  }

  const avgCoverage = (coverages.reduce((a, b) => a + b, 0) / runs).toFixed(1)
  const avgPuzzles = (puzzleCounts.reduce((a, b) => a + b, 0) / runs).toFixed(1)
  const avgMinSize = (minSizes.reduce((a, b) => a + b, 0) / runs).toFixed(1)

  console.log(`\n  Average: ${avgPuzzles} puzzles, ${avgCoverage}% coverage, min size: ${avgMinSize}`)
  console.log(`  ✓ Average ≥99%: ${parseFloat(avgCoverage) >= 99 ? 'YES ✅' : 'NO ❌'}`)

  return { avgCoverage: parseFloat(avgCoverage), avgPuzzles: parseFloat(avgPuzzles) }
}

const test1 = runMultipleTests('Test 1: Easy Words', easyWords, 35, 3)
const test2 = runMultipleTests('Test 2: Medium Words', mediumWords, 40, 3)
const test3 = runMultipleTests('Test 3: Mixed Large', [...easyWords, ...mediumWords], 50, 3)

console.log('\n' + '='.repeat(70))
console.log('OVERALL RESULTS')
console.log('='.repeat(70))

const overallAvg = ((test1.avgCoverage + test2.avgCoverage + test3.avgCoverage) / 3).toFixed(1)
console.log(`Overall Average Coverage: ${overallAvg}%`)
console.log(`Overall Average Puzzles: ${((test1.avgPuzzles + test2.avgPuzzles + test3.avgPuzzles) / 3).toFixed(1)}`)
console.log(`\n✓ Target Met (≥99%): ${parseFloat(overallAvg) >= 99 ? 'YES ✅' : 'NO ❌'}`)
