import type { ReviewType } from '@/types'

/**
 * Spaced Repetition System Engine
 * Implements the core SRS algorithm for EDU-PUZZLE
 */

// Interval schedule in days
const INTERVALS = [1, 3, 7, 14, 30, 90, 180]

export interface ReviewResult {
  level: number
  daysUntilNext: number
}

export class SpacedRepetitionEngine {
  /**
   * Calculate the next review date and level based on performance
   */
  calculateNextReview(currentLevel: number, reviewType: ReviewType): ReviewResult {
    switch (reviewType) {
      case 'perfect':
      case 'half_known':
        // Move up one level
        const newLevel = Math.min(currentLevel + 1, INTERVALS.length - 1)
        return {
          level: newLevel,
          daysUntilNext: INTERVALS[newLevel],
        }

      case 'conditional':
        // Stay on the same level
        return {
          level: currentLevel,
          daysUntilNext: INTERVALS[currentLevel],
        }

      case 'unknown':
        // Back to level 0
        return {
          level: 0,
          daysUntilNext: INTERVALS[0],
        }

      case 'not_evaluated':
        // No change
        return {
          level: currentLevel,
          daysUntilNext: INTERVALS[currentLevel],
        }
    }
  }

  /**
   * Determine review type based on user performance
   */
  determineReviewType(params: {
    wasCorrectAtCheck: boolean
    wasCorrectAtSubmit: boolean
    percentageRevealed: number
  }): ReviewType {
    // >70% revealed = cannot be rated
    if (params.percentageRevealed > 70) {
      return 'not_evaluated'
    }

    // Incorrect at submit = unknown
    if (!params.wasCorrectAtSubmit) {
      return 'unknown'
    }

    // 30-70% revealed = conditionally known
    if (params.percentageRevealed >= 30) {
      return 'conditional'
    }

    // Check incorrect, Submit correct = half known
    if (!params.wasCorrectAtCheck && params.wasCorrectAtSubmit) {
      return 'half_known'
    }

    // Correct immediately = perfect
    return 'perfect'
  }

  /**
   * Get the interval in days for a given level
   */
  getInterval(level: number): number {
    return INTERVALS[Math.min(level, INTERVALS.length - 1)]
  }
}

export const srsEngine = new SpacedRepetitionEngine()
