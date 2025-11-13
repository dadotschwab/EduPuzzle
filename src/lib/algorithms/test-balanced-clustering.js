/**
 * Test Balanced Clustering Algorithm
 *
 * Verifies that:
 * 1. All clusters have similar sizes (8-15 words)
 * 2. All clusters have similar quality scores
 * 3. All puzzles have 8+ words
 */

// Mock word data
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

// Compatibility functions
function getSharedLetters(word1, word2) {
  const letters1 = new Set(word1.split(''))
  const letters2 = new Set(word2.split(''))
  let count = 0
  letters1.forEach(l => {
    if (letters2.has(l)) count++
  })
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

  // Initialize empty clusters
  const clusters = Array(targetCount).fill(null).map(() => [])
  const remaining = new Set(words.map((_, i) => i))

  // Sort by length
  const sortedIndices = words
    .map((w, i) => ({ word: w, index: i }))
    .sort((a, b) => b.word.length - a.word.length)
    .map(x => x.index)

  // Phase 1: Seed each cluster
  for (let i = 0; i < targetCount && remaining.size > 0; i++) {
    const seedIdx = sortedIndices.find(idx => remaining.has(idx))
    if (seedIdx === undefined) break

    clusters[i].push(seedIdx)
    remaining.delete(seedIdx)
  }

  // Phase 2: Distribute words round-robin
  let currentClusterIndex = 0

  while (remaining.size > 0) {
    // Skip full clusters
    while (clusters[currentClusterIndex].length >= maxSize) {
      currentClusterIndex = (currentClusterIndex + 1) % targetCount
      if (clusters.every(c => c.length >= maxSize)) break
    }

    if (clusters.every(c => c.length >= maxSize)) break

    const currentCluster = clusters[currentClusterIndex]

    // Find best word for this cluster
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

    // Add best word
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

  // Calculate cluster scores
  return clusters
    .filter(c => c.length > 0)
    .map(cluster => {
      // Calculate average pairwise compatibility
      let totalScore = 0
      let pairCount = 0

      for (let i = 0; i < cluster.length; i++) {
        for (let j = i + 1; j < cluster.length; j++) {
          totalScore += getScore(compatMatrix, cluster[i], cluster[j])
          pairCount++
        }
      }

      const avgScore = pairCount > 0 ? totalScore / pairCount : 0
      const clusterWords = cluster.map(idx => words[idx])

      // Calculate average overlap
      let totalOverlap = 0
      let overlapPairs = 0
      for (let i = 0; i < clusterWords.length; i++) {
        for (let j = i + 1; j < clusterWords.length; j++) {
          totalOverlap += getSharedLetters(clusterWords[i], clusterWords[j])
          overlapPairs++
        }
      }
      const avgOverlap = overlapPairs > 0 ? totalOverlap / overlapPairs : 0

      return {
        indices: cluster,
        words: clusterWords,
        size: cluster.length,
        score: avgScore,
        avgOverlap: avgOverlap
      }
    })
}

// Grid and placement (same as before, but optimized for 16x16)
class Grid {
  constructor(size = 16) {
    this.size = Math.min(size, 16)
    this.cells = Array(this.size).fill(null).map(() =>
      Array(this.size).fill(null).map(() => ({
        letter: null,
        wordIds: new Set(),
      }))
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

    // Bounds check
    if (direction === 'across' && x + len > this.size) return false
    if (direction === 'down' && y + len > this.size) return false

    // Check each cell
    for (let i = 0; i < len; i++) {
      const cx = x + i * dx
      const cy = y + i * dy
      const cell = this.cells[cy][cx]

      if (cell.letter && cell.letter !== word[i]) return false
    }

    // Check perpendicular clearance
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

    // Check before/after clearance
    const beforeX = x - dx
    const beforeY = y - dy
    const afterX = x + len * dx
    const afterY = y + len * dy

    if (this.getLetter(beforeX, beforeY) || this.getLetter(afterX, afterY)) {
      return false
    }

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

      if (cy < 0 || cy >= this.size || cx < 0 || cx >= this.size) {
        console.error(`Out of bounds: (${cx}, ${cy}) for word ${word}`)
        return null
      }

      this.cells[cy][cx].letter = word[i]
      this.cells[cy][cx].wordIds.add(id)
    }

    const placed = { id, word, x, y, direction, number: this.nextNumber }
    this.placedWords.set(id, placed)
    this.nextNumber++

    return placed
  }

  getActualSize() {
    let minX = this.size, maxX = -1
    let minY = this.size, maxY = -1

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

    return {
      width: maxX - minX + 1,
      height: maxY - minY + 1
    }
  }
}

// Shuffle array
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

  // Place first word in center
  if (words.length > 0) {
    const firstWord = words[0]
    const startX = Math.floor((16 - firstWord.length) / 2)
    const startY = 8
    const result = grid.place(firstWord, startX, startY, 'across')
    if (result) placed.add(firstWord)
  }

  // Try to place remaining words
  for (let i = 1; i < words.length; i++) {
    const word = words[i]
    let bestPlacement = null
    let bestScore = -1

    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        for (const direction of ['across', 'down']) {
          if (grid.canPlace(word, x, y, direction)) {
            // Count crossings
            let crossings = 0
            const dx = direction === 'across' ? 1 : 0
            const dy = direction === 'down' ? 1 : 0

            for (let j = 0; j < word.length; j++) {
              const cx = x + j * dx
              const cy = y + j * dy
              if (grid.getLetter(cx, cy) === word[j]) crossings++
            }

            // Must cross at least once (except first word)
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

  const actualSize = grid.getActualSize()
  return {
    placedCount: placed.size,
    grid: grid,
    placedWords: Array.from(placed)
  }
}

// Generate puzzle with multiple attempts
function generatePuzzle(words, maxAttempts = 30) {
  const sorted = [...words].sort((a, b) => b.length - a.length)
  const minAcceptable = Math.max(8, Math.floor(words.length * 0.85))

  let bestResult = null
  let bestCount = 0

  // Try multiple orderings
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const orderedWords = attempt === 0
      ? sorted
      : [sorted[0], ...shuffleArray(sorted.slice(1))]

    const result = generatePuzzleAttempt(orderedWords)

    if (result.placedCount > bestCount) {
      bestCount = result.placedCount
      bestResult = result
    }

    // Early exit if we got perfect or good enough result
    if (result.placedCount === words.length) break
    if (result.placedCount >= minAcceptable && attempt >= 10) break
  }

  if (!bestResult) {
    return {
      placedCount: 0,
      totalCount: words.length,
      coverage: '0.0',
      gridSize: '0x0',
      failed: words
    }
  }

  const actualSize = bestResult.grid.getActualSize()
  const failed = words.filter(w => !bestResult.placedWords.includes(w))

  return {
    placedCount: bestResult.placedCount,
    totalCount: words.length,
    coverage: (bestResult.placedCount / words.length * 100).toFixed(1),
    gridSize: `${actualSize.width}x${actualSize.height}`,
    failed: failed
  }
}

// Run tests
console.log('=== BALANCED CLUSTERING TEST ===\n')

function runTest(name, words, count) {
  console.log(`\n${name} (${count} words)`)
  console.log('─'.repeat(60))

  const selected = words.slice(0, count)
  const clusters = clusterWords(selected, 12, 15)

  console.log(`\nClusters: ${clusters.length}`)
  clusters.forEach((cluster, i) => {
    console.log(`  Cluster ${i + 1}: ${cluster.size} words, score: ${cluster.score.toFixed(1)}, overlap: ${cluster.avgOverlap.toFixed(2)}`)
  })

  // Check balance
  const sizes = clusters.map(c => c.size)
  const scores = clusters.map(c => c.score)
  const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length
  const minSize = Math.min(...sizes)
  const maxSize = Math.max(...sizes)
  const minScore = Math.min(...scores)
  const maxScore = Math.max(...scores)

  console.log(`\nBalance Metrics:`)
  console.log(`  Size: min=${minSize}, max=${maxSize}, avg=${avgSize.toFixed(1)}`)
  console.log(`  Score: min=${minScore.toFixed(1)}, max=${maxScore.toFixed(1)}, avg=${avgScore.toFixed(1)}`)

  // Generate puzzles
  console.log(`\nPuzzle Generation:`)
  let totalPlaced = 0
  let totalWords = 0
  const puzzleSizes = []

  clusters.forEach((cluster, i) => {
    const result = generatePuzzle(cluster.words, 100)
    totalPlaced += result.placedCount
    totalWords += result.totalCount
    puzzleSizes.push(result.placedCount)

    console.log(`  Puzzle ${i + 1}: ${result.placedCount}/${result.totalCount} words (${result.coverage}%), grid: ${result.gridSize}`)
    if (result.failed.length > 0 && result.failed.length <= 5) {
      console.log(`    Failed: ${result.failed.join(', ')}`)
    }
  })

  const overallCoverage = (totalPlaced / totalWords * 100).toFixed(1)
  const minPuzzleSize = Math.min(...puzzleSizes)
  const maxPuzzleSize = Math.max(...puzzleSizes)
  const avgPuzzleSize = (puzzleSizes.reduce((a, b) => a + b, 0) / puzzleSizes.length).toFixed(1)

  console.log(`\nOverall: ${totalPlaced}/${totalWords} words placed (${overallCoverage}%)`)
  console.log(`Puzzle sizes: min=${minPuzzleSize}, max=${maxPuzzleSize}, avg=${avgPuzzleSize}`)

  // Success criteria
  const allClustersBalanced = (maxSize - minSize) <= 5
  const allScoresBalanced = (maxScore - minScore) <= 30
  const allPuzzlesGoodSize = minPuzzleSize >= 8
  const goodCoverage = totalPlaced / totalWords >= 0.95

  console.log(`\n✓ Clusters balanced size: ${allClustersBalanced ? 'YES' : 'NO'}`)
  console.log(`✓ Clusters balanced score: ${allScoresBalanced ? 'YES' : 'NO'}`)
  console.log(`✓ All puzzles ≥8 words: ${allPuzzlesGoodSize ? 'YES' : 'NO'}`)
  console.log(`✓ Coverage ≥95%: ${goodCoverage ? 'YES' : 'NO'}`)
}

runTest('Test 1: Easy Words', easyWords, 35)
runTest('Test 2: Medium Words', mediumWords, 40)
runTest('Test 3: Mixed Large', [...easyWords, ...mediumWords], 50)

console.log('\n' + '='.repeat(60))
