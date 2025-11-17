/**
 * @fileoverview Simple wrapper for puzzle generation
 * Provides a singular generatePuzzle function for SRS-based puzzle creation
 */

import { generatePuzzles } from '@/lib/algorithms/generator'
import type { Word, Puzzle, WordWithProgress } from '@/types'

/**
 * Generates a single puzzle from a list of words
 *
 * @param words - Array of words to include in the puzzle
 * @returns A generated puzzle or null if generation fails
 */
export async function generatePuzzle(words: Word[] | WordWithProgress[]): Promise<Puzzle | null> {
  if (words.length === 0) return null

  try {
    // Convert WordWithProgress to Word if needed
    const puzzleWords: Word[] = words.map(word => ({
      id: word.id,
      listId: word.listId,
      term: word.term,
      translation: word.translation,
      definition: word.definition,
      exampleSentence: word.exampleSentence,
      createdAt: word.createdAt,
    }))

    // Generate puzzles using existing algorithm
    const puzzles = await generatePuzzles(puzzleWords)

    // Return the first puzzle if any were generated
    return puzzles.length > 0 ? puzzles[0] : null
  } catch (error) {
    console.error('Failed to generate puzzle:', error)
    return null
  }
}
