/**
 * Phase 1 Demo - Simple JavaScript version to test core logic
 *
 * This demonstrates the algorithm working with 2-3 words
 * without TypeScript compilation complexity.
 */

// Simple Grid class
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

    // Check bounds
    if (direction === 'H' && x + len > this.size) return false
    if (direction === 'V' && y + len > this.size) return false

    // Check each position
    for (let i = 0; i < len; i++) {
      const cx = direction === 'H' ? x + i : x
      const cy = direction === 'H' ? y : y + i
      const current = this.getLetter(cx, cy)

      if (current !== null && current !== word[i]) {
        return false
      }
    }

    // Check before/after are clear
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

    // Place letters
    for (let i = 0; i < word.length; i++) {
      const cx = direction === 'H' ? x + i : x
      const cy = direction === 'H' ? y : y + i

      if (this.cells[cy][cx].letter === word[i]) {
        // This is a crossing
        crossings.push({ pos: i, x: cx, y: cy })
      }

      this.cells[cy][cx].letter = word[i]
      this.cells[cy][cx].wordIds.add(id)
    }

    const placed = {
      id,
      word,
      x,
      y,
      direction,
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
}

// Find where a word can cross another
function findCrossings(newWord, placedWord, grid) {
  const placements = []

  for (let i = 0; i < newWord.length; i++) {
    for (let j = 0; j < placedWord.word.length; j++) {
      if (newWord[i] === placedWord.word[j]) {
        // Calculate position
        let cx, cy
        if (placedWord.direction === 'H') {
          cx = placedWord.x + j
          cy = placedWord.y
        } else {
          cx = placedWord.x
          cy = placedWord.y + j
        }

        // New word must be perpendicular
        const newDir = placedWord.direction === 'H' ? 'V' : 'H'
        const sx = newDir === 'H' ? cx - i : cx
        const sy = newDir === 'V' ? cy - i : cy

        if (grid.canPlace(newWord, sx, sy, newDir)) {
          placements.push({ x: sx, y: sy, direction: newDir })
        }
      }
    }
  }

  return placements
}

// Run Phase 1 Demo
console.log('╔════════════════════════════════════════════╗')
console.log('║  Phase 1 Demo: 2-3 Words                  ║')
console.log('╚════════════════════════════════════════════╝\n')

// Test 1: Place first word
console.log('=== Test 1: First Word ===\n')
const grid = new Grid(15)
const word1 = 'HELLO'

// Center it
const x1 = Math.floor((grid.size - word1.length) / 2)
const y1 = Math.floor(grid.size / 2)

const placed1 = grid.place('1', word1, x1, y1, 'H')
console.log(`Placed: ${placed1.word} at (${placed1.x}, ${placed1.y}) ${placed1.direction}`)
console.log(`Number: ${placed1.number}`)
console.log(`\nGrid:\n${grid.toString()}\n`)

// Test 2: Place second word with crossing
console.log('=== Test 2: Second Word (Crossing) ===\n')
const word2 = 'WORLD'

const crossings = findCrossings(word2, placed1, grid)
console.log(`Found ${crossings.length} crossing options for ${word2}`)

if (crossings.length > 0) {
  const c = crossings[0]
  const placed2 = grid.place('2', word2, c.x, c.y, c.direction)
  console.log(`\nPlaced: ${placed2.word} at (${placed2.x}, ${placed2.y}) ${placed2.direction}`)
  console.log(`Number: ${placed2.number}`)
  console.log(`Crossings: ${placed2.crossings}`)
  console.log(`\nGrid:\n${grid.toString()}\n`)
}

// Test 3: Place third word
console.log('=== Test 3: Third Word ===\n')
const word3 = 'HELP'

const allPlaced = grid.getPlacedWords()
let placed3 = null

for (const pw of allPlaced) {
  const crossings3 = findCrossings(word3, pw, grid)
  if (crossings3.length > 0) {
    const c = crossings3[0]
    placed3 = grid.place('3', word3, c.x, c.y, c.direction)
    if (placed3) break
  }
}

if (placed3) {
  console.log(`Placed: ${placed3.word} at (${placed3.x}, ${placed3.y}) ${placed3.direction}`)
  console.log(`Number: ${placed3.number}`)
  console.log(`Crossings: ${placed3.crossings}`)
} else {
  console.log(`Could not place ${word3}`)
}

console.log(`\nFinal Grid:\n${grid.toString()}\n`)

// Summary
console.log('═'.repeat(48))
console.log('Summary:')
console.log(`  Words placed: ${grid.placedWords.size}`)
grid.getPlacedWords().forEach(w => {
  console.log(`  - ${w.word} (${w.crossings} crossings)`)
})
console.log('═'.repeat(48))
console.log('\n✅ Phase 1 core logic is working!')
