/**
 * Seeded random number generator for deterministic puzzle generation
 * Using a simple LCG (Linear Congruential Generator) algorithm
 */

export class SeededRandom {
  private seed: number

  constructor(seed: string) {
    // Convert string seed to numeric seed using simple hash
    this.seed = this.hashString(seed)
  }

  /**
   * Simple string hash function
   */
  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash)
  }

  /**
   * Generate next random number (0 to 1)
   * Uses LCG algorithm with common constants
   */
  next(): number {
    // LCG formula: seed = (a * seed + c) % m
    const a = 1664525
    const c = 1013904223
    const m = 2 ** 32

    this.seed = (a * this.seed + c) % m
    return this.seed / m
  }

  /**
   * Random integer between min (inclusive) and max (exclusive)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min
  }

  /**
   * Shuffle array using Fisher-Yates algorithm with seeded randomness
   */
  shuffle<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i + 1)
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }
}
