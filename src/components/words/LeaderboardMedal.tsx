/**
 * @fileoverview LeaderboardMedal Component
 *
 * Displays medal icons for top 3 leaderboard positions.
 */

import { type ReactElement } from 'react'
import type { LeaderboardMedalProps } from '@/types/leaderboard.types'

/**
 * LeaderboardMedal - Displays medal icons for top 3 leaderboard positions
 * Gold for 1st, silver for 2nd, bronze for 3rd place
 */
export function LeaderboardMedal({ rank }: LeaderboardMedalProps): ReactElement {
  if (rank === 1) {
    return (
      <span className="text-2xl" title="1st Place">
        🥇
      </span>
    )
  }

  if (rank === 2) {
    return (
      <span className="text-2xl" title="2nd Place">
        🥈
      </span>
    )
  }

  if (rank === 3) {
    return (
      <span className="text-2xl" title="3rd Place">
        🥉
      </span>
    )
  }

  return <span className="w-6" /> // Empty space for non-medal ranks
}
