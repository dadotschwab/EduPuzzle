/**
 * @fileoverview Type definitions for collaborative leaderboard functionality
 */

import type { Database } from './database.types'

/**
 * SRS Stage enum for leaderboard scoring
 * Extended to support Expert (5) and Master (6) stages
 */
export enum SRSStage {
  NEW = 0, // 0 points
  LEARNING = 1, // 1 point
  YOUNG = 2, // 2 points
  MATURE = 3, // 4 points
  RELEARNING = 4, // 7 points
  EXPERT = 5, // 12 points
  MASTER = 6, // 20 points
}

/**
 * Leaderboard point values for each SRS stage
 */
export const LEADERBOARD_POINTS: Record<SRSStage, number> = {
  [SRSStage.NEW]: 0,
  [SRSStage.LEARNING]: 1,
  [SRSStage.YOUNG]: 2,
  [SRSStage.MATURE]: 4,
  [SRSStage.RELEARNING]: 7,
  [SRSStage.EXPERT]: 12,
  [SRSStage.MASTER]: 20,
}

/**
 * Leaderboard statistics for a collaborative list
 */
export interface LeaderboardStats {
  /** Total number of participants */
  totalParticipants: number
  /** Number of opted-in participants */
  activeParticipants: number
  /** Highest score in the leaderboard */
  highestScore: number
  /** Average score among participants */
  averageScore: number
  /** Current user's rank (null if not opted in) */
  currentUserRank?: number
}

/**
 * Leaderboard points configuration for UI display
 */
export interface LeaderboardPoints {
  stage: SRSStage
  points: number
  label: string
  description: string
}

// Database row types
export type LeaderboardCollaborator = Database['public']['Tables']['list_collaborators']['Row'] & {
  cached_score: number
  leaderboard_opted_in: boolean
  score_updated_at: string
}

// API response types
export interface LeaderboardEntry {
  /** Unique user identifier */
  userId: string
  /** User profile information */
  user: {
    id: string
    email: string
    fullName?: string
  }
  /** Current leaderboard score */
  score: number
  /** Number of words learned in this list */
  wordsLearned: number
  /** Total words in the collaborative list */
  totalWords: number
  /** Whether user has opted into leaderboard */
  isOptedIn: boolean
  /** When score was last updated */
  lastUpdated: string
}

// Component prop types
export interface CollaborativeLeaderboardProps {
  /** Shared list identifier */
  sharedListId: string
  /** Current user identifier */
  currentUserId: string
}

export interface LeaderboardEntryProps {
  /** Leaderboard entry data */
  entry: LeaderboardEntry
  /** Rank position (1-based) */
  rank: number
  /** Whether this entry belongs to the current user */
  isCurrentUser?: boolean
}

export interface LeaderboardToggleProps {
  /** Whether the user is currently opted in */
  isOptedIn: boolean
  /** Callback when toggle is clicked */
  onToggle: () => void
  /** Whether the toggle is in loading state */
  isLoading?: boolean
}

export interface LeaderboardMedalProps {
  /** Rank position (1-3 for medals, higher ranks show no medal) */
  rank: number
}

// Hook option types
export interface UseLeaderboardOptions {
  /** Shared list ID */
  sharedListId: string
  /** Enable/disable the hook */
  enabled?: boolean
}

// Hook return types
export interface UseLeaderboardReturn {
  /** Current leaderboard data */
  data: LeaderboardEntry[] | undefined
  /** Loading state */
  isLoading: boolean
  /** Error if fetch failed */
  error: Error | null
  /** Refetch leaderboard data */
  refetch: () => Promise<unknown>
  /** Toggle opt-in mutation */
  toggleOptIn: {
    mutate: (optedIn: boolean) => void
    isPending: boolean
  }
}
