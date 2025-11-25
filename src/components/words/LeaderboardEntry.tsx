/**
 * @fileoverview LeaderboardEntry Component
 *
 * Displays a single ranked collaborator with avatar, name, score, and progress.
 */

import { type ReactElement } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { LeaderboardMedal } from './LeaderboardMedal'
import { cn } from '@/lib/utils'
import type { LeaderboardEntryProps } from '@/types/leaderboard.types'

/**
 * LeaderboardEntry - Displays a single ranked collaborator
 * Shows avatar, name, score, progress bar, and medal for top 3
 */
export function LeaderboardEntry({
  entry,
  rank,
  isCurrentUser = false,
}: LeaderboardEntryProps): ReactElement {
  const { user, score, wordsLearned, totalWords, isOptedIn } = entry

  // Calculate progress percentage
  const progressPercentage = totalWords > 0 ? (wordsLearned / totalWords) * 100 : 0

  // Get user initials for avatar
  const initials = user.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : user.email.slice(0, 2).toUpperCase()

  return (
    <TooltipProvider>
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg transition-colors',
          isCurrentUser && 'bg-primary/5 border border-primary/20',
          !isOptedIn && 'opacity-60'
        )}
      >
        {/* Rank and Medal */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="text-sm font-medium text-muted-foreground w-6 text-center">{rank}</div>
          <LeaderboardMedal rank={rank} />
        </div>

        {/* Avatar */}
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>

        {/* User Info and Progress */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">
              {user.fullName || user.email}
              {isCurrentUser && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  You
                </Badge>
              )}
            </p>
            {!isOptedIn && (
              <Badge variant="outline" className="text-xs">
                Opted out
              </Badge>
            )}
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Progress value={progressPercentage} className="h-2" />
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {wordsLearned} of {totalWords} words learned
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Score */}
        <div className="text-right flex-shrink-0">
          <div className="text-lg font-bold text-primary">{score.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">points</div>
        </div>
      </div>
    </TooltipProvider>
  )
}
