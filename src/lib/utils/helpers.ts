/**
 * @fileoverview Common utility functions used across the application
 *
 * @module lib/utils/helpers
 */

import type { Puzzle } from '@/types'

/**
 * Gets the current date in YYYY-MM-DD format
 * Used for SRS calculations and date-based filtering
 */
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Safely gets a puzzle from an array at a specific index
 * Returns null if puzzles array is invalid or index is out of bounds
 *
 * @param puzzles - Array of puzzles (may be undefined/null)
 * @param currentIndex - Index of puzzle to retrieve
 * @returns The puzzle at the specified index, or null if not found
 */
export function getCurrentPuzzle(
  puzzles: Puzzle[] | undefined | null,
  currentIndex: number
): Puzzle | null {
  if (!puzzles || puzzles.length === 0) return null
  if (currentIndex < 0 || currentIndex >= puzzles.length) return null
  return puzzles[currentIndex]
}
