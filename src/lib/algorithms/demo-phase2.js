/**
 * Phase 2 Demo - Multi-word placement with scoring
 *
 * Demonstrates intelligent word placement with 10-15 words
 * using the scoring system to choose optimal positions.
 */

// Letter scores for rare letters
const LETTER_SCORES = {
  'E': 1, 'T': 1, 'A': 1, 'O': 1, 'I': 1, 'N': 1, 'S': 1, 'H': 1, 'R': 1,
  'D': 2, 'L': 2, 'C': 2, 'U': 2, 'M': 2, 'W': 2, 'F': 2, 'G': 2, 'Y': 2, 'P': 2, 'B': 2,
  'V': 3, 'K': 3,
  'J': 5, 'X': 5, 'Q': 5, 'Z': 5,
}

class Grid {
  constructor(size) {
    this.size = size
    this.cells = Array(size).fill(null).map(() =>
      Array(size).fill(null).map(() => ({
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
    if (direction === 'H' && x + len > this.size) return false
    if (direction === 'V' && y + len > this.size) return false

    for (let i = 0; i < len; i++) {
      const cx = direction === 'H' ? x + i : x
      const cy = direction === 'H' ? y : y + i
      const current = this.getLetter(cx, cy)
      if (current !== null && current !== word[i]) return false
    }

    if (direction === 'H') {
      if (x > 0 && this.getLetter(x - 1, y)) return false
      if (x + len < this.size && this.getLetter(x + len, y)) return false
    } else {
      if (y > 0 && this.getLetter(x, y - 1)) return false
      if (y + len < this.size && this.getLetter(x, y + len)) return false
    }

    return true
  }

  place(id, word, x, y, direction) {
    if (!this.canPlace(word, x, y, direction)) return null

    const crossings = []
    for (let i = 0; i < word.length; i++) {
      const cx = direction === 'H' ? x + i : x
      const cy = direction === 'H' ? y : y + i

      if (this.cells[cy][cx].letter === word[i]) {
        crossings.push({ pos: i, x: cx, y: cy })
      }

      this.cells[cy][cx].letter = word[i]
      this.cells[cy][cx].wordIds.add(id)
    }

    const placed = {
      id, word, x, y, direction,
      number: this.nextNumber++,
      crossings: crossings.length
    }

    this.placedWords.set(id, placed)
    return placed
  }

  toString() {
    return this.cells.map(row =>
      row.map(cell => cell.letter || '·').join(' ')
    ).join('\n')
  }

  getPlacedWords() {
    return Array.from(this.placedWords.values())
  }

  getFilledCount() {
    let count = 0
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (this.cells[y][x].letter) count++
      }
    }
    return count
  }
}

// Scoring function
function scorePlacement(word, x, y, direction, crossings, grid) {
  let score = 0

  // 1. Crossing count (most important) - 100 points each
  score += crossings.length * 100

  // 2. Letter rarity in crossings - bonus points
  crossings.forEach(c => {
    const letter = word[c.pos]
    const letterScore = LETTER_SCORES[letter] || 1
    score += letterScore * 10
  })

  // 3. Compactness - prefer tighter placement
  const centerX = grid.size / 2
  const centerY = grid.size / 2
  const wordCenterX = direction === 'H' ? x + word.length / 2 : x
  const wordCenterY = direction === 'V' ? y + word.length / 2 : y
  const distFromCenter = Math.sqrt(
    Math.pow(wordCenterX - centerX, 2) + Math.pow(wordCenterY - centerY, 2)
  )
  score += (1 - distFromCenter / grid.size) * 20

  return score
}

// Find all crossings with scoring
function findBestCrossing(newWord, placedWords, grid) {
  const options = []

  for (const placedWord of placedWords) {
    for (let i = 0; i < newWord.length; i++) {
      for (let j = 0; j < placedWord.word.length; j++) {
        if (newWord[i] === placedWord.word[j]) {
          let cx, cy
          if (placedWord.direction === 'H') {
            cx = placedWord.x + j
            cy = placedWord.y
          } else {
            cx = placedWord.x
            cy = placedWord.y + j
          }

          const newDir = placedWord.direction === 'H' ? 'V' : 'H'
          const sx = newDir === 'H' ? cx - i : cx
          const sy = newDir === 'V' ? cy - i : cy

          if (grid.canPlace(newWord, sx, sy, newDir)) {
            const crossings = [{ pos: i, x: cx, y: cy }]
            const score = scorePlacement(newWord, sx, sy, newDir, crossings, grid)
            options.push({ x: sx, y: sy, direction: newDir, score, crossings })
          }
        }
      }
    }
  }

  // Sort by score (descending)
  options.sort((a, b) => b.score - a.score)
  return options[0] || null
}

// Run Phase 2 Demo
console.log('╔════════════════════════════════════════════╗')
console.log('║  Phase 2 Demo: 10+ Words with Scoring     ║')
console.log('╚════════════════════════════════════════════╝\n')

const words = [
  'TIME', 'TEAM', 'MATE', 'METAL', 'LATE', 'TALE',
  'ALE', 'EAT', 'TEA', 'MEAT', 'STEAM', 'MASTER'
]

const grid = new Grid(20)
let placed = 0
let failed = 0

// Place first word in center
const firstWord = words[0]
const x1 = Math.floor((grid.size - firstWord.length) / 2)
const y1 = Math.floor(grid.size / 2)
grid.place('0', firstWord, x1, y1, 'H')
placed++
console.log(`1. Placed ${firstWord} (first word, center)`)

// Place remaining words with scoring
for (let i = 1; i < words.length; i++) {
  const word = words[i]
  const best = findBestCrossing(word, grid.getPlacedWords(), grid)

  if (best) {
    const result = grid.place(String(i), word, best.x, best.y, best.direction)
    if (result) {
      placed++
      console.log(`${i + 1}. Placed ${word} - Score: ${best.score.toFixed(0)}, Crossings: ${result.crossings}`)
    } else {
      failed++
      console.log(`${i + 1}. Failed to place ${word} (validation failed)`)
    }
  } else {
    failed++
    console.log(`${i + 1}. Failed to place ${word} (no crossings found)`)
  }
}

console.log('\n' + '═'.repeat(48))
console.log('Final Grid:')
console.log('═'.repeat(48))
console.log(grid.toString())

console.log('\n' + '═'.repeat(48))
console.log('Statistics:')
console.log(`  Words attempted: ${words.length}`)
console.log(`  Words placed: ${placed}`)
console.log(`  Words failed: ${failed}`)
console.log(`  Success rate: ${(placed / words.length * 100).toFixed(1)}%`)
console.log(`  Grid density: ${(grid.getFilledCount() / (grid.size * grid.size) * 100).toFixed(1)}%`)

const avgCrossings = grid.getPlacedWords().reduce((sum, w) => sum + w.crossings, 0) / placed
console.log(`  Avg crossings/word: ${avgCrossings.toFixed(2)}`)

console.log('═'.repeat(48))

// Check connectivity (simple version)
let isConnected = true
if (placed > 1) {
  const minCrossings = Math.min(...grid.getPlacedWords().map(w => w.crossings))
  isConnected = minCrossings > 0 || placed === 1
}

if (isConnected) {
  console.log('✅ All words are connected!')
} else {
  console.log('⚠️  Warning: Some words may be disconnected')
}

console.log('\n🎉 Phase 2 scoring system is working!')
