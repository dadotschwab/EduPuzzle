// Core domain types for EDU-PUZZLE

export type ReviewType = 'perfect' | 'half_known' | 'conditional' | 'unknown' | 'not_evaluated'

export interface Word {
  id: string
  listId: string
  term: string
  translation: string
  definition?: string
  exampleSentence?: string
  createdAt: string
}

export interface WordList {
  id: string
  userId: string
  name: string
  sourceLanguage: string
  targetLanguage: string
  createdAt: string
  updatedAt: string
}

export interface WordProgress {
  id: string
  userId: string
  wordId: string
  repetitionLevel: number
  nextReviewDate: string
  lastReviewedAt?: string
  totalReviews: number
  correctReviews: number
}

export interface PlacedWord {
  id: string
  word: string
  clue: string
  x: number
  y: number
  direction: 'horizontal' | 'vertical'
  number: number
  crossings: Crossing[]
}

export interface Crossing {
  position: number
  otherWordId: string
  otherWordPosition: number
}

export interface Puzzle {
  id: string
  gridSize: number
  placedWords: PlacedWord[]
  grid: (string | null)[][]
}

export interface PuzzleSession {
  id: string
  userId: string
  listId?: string
  startedAt: string
  completedAt?: string
  puzzleData: Puzzle
  totalWords: number
  correctWords: number
}

export interface WordReview {
  id: string
  sessionId: string
  wordId: string
  userId: string
  reviewType: ReviewType
  timeToSolve?: number
  hintsUsed: number
  reviewedAt: string
}

export interface User {
  id: string
  email: string
  createdAt: string
  subscriptionStatus: 'trial' | 'active' | 'cancelled' | 'expired'
  subscriptionEndDate?: string
  trialEndDate: string
}
