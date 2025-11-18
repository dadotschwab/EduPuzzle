/**
 * @fileoverview Utilities for tracking completed puzzles in Today's Puzzles
 *
 * Uses localStorage to track which puzzles have been completed today.
 * Automatically clears when the date changes.
 *
 * @module lib/utils/puzzleProgress
 */

import type { Puzzle } from '@/types'
import { getTodayDate } from './helpers'

const STORAGE_KEY = 'edupuzzle_todays_puzzles'

interface TodaysPuzzleProgress {
  date: string // YYYY-MM-DD format
  completedPuzzleHashes: string[] // Hashes of completed puzzles
}

/**
 * Generates a unique hash for a puzzle based on its word IDs
 * Two puzzles with the same words will have the same hash
 */
function generatePuzzleHash(puzzle: Puzzle): string {
  const wordIds = puzzle.placedWords
    .map(w => w.id)
    .sort()
    .join('|')

  // Simple hash function
  let hash = 0
  for (let i = 0; i < wordIds.length; i++) {
    const char = wordIds.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }

  return hash.toString(36)
}

/**
 * Loads progress from localStorage
 * Returns null if no progress exists or if the date doesn't match today
 */
function loadProgress(): TodaysPuzzleProgress | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null

    const progress: TodaysPuzzleProgress = JSON.parse(stored)

    // Check if progress is from today
    if (progress.date !== getTodayDate()) {
      // Old data, clear it
      localStorage.removeItem(STORAGE_KEY)
      return null
    }

    return progress
  } catch (error) {
    console.error('Failed to load puzzle progress:', error)
    return null
  }
}

/**
 * Saves progress to localStorage
 */
function saveProgress(progress: TodaysPuzzleProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch (error) {
    console.error('Failed to save puzzle progress:', error)
  }
}

/**
 * Marks a puzzle as completed
 */
export function markPuzzleCompleted(puzzle: Puzzle): void {
  const hash = generatePuzzleHash(puzzle)
  const progress = loadProgress() || {
    date: getTodayDate(),
    completedPuzzleHashes: []
  }

  if (!progress.completedPuzzleHashes.includes(hash)) {
    progress.completedPuzzleHashes.push(hash)
    saveProgress(progress)
  }
}

/**
 * Checks if a puzzle has been completed today
 */
export function isPuzzleCompleted(puzzle: Puzzle): boolean {
  const progress = loadProgress()
  if (!progress) return false

  const hash = generatePuzzleHash(puzzle)
  return progress.completedPuzzleHashes.includes(hash)
}

/**
 * Gets the index of the first uncompleted puzzle
 * Returns 0 if no puzzles are completed
 */
export function getFirstUncompletedPuzzleIndex(puzzles: Puzzle[]): number {
  for (let i = 0; i < puzzles.length; i++) {
    if (!isPuzzleCompleted(puzzles[i])) {
      return i
    }
  }
  return 0 // Default to first puzzle if all are completed
}
