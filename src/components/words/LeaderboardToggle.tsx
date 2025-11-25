/**
 * @fileoverview LeaderboardToggle Component
 *
 * Toggle component for opting in/out of leaderboard participation.
 */

import { type ReactElement } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import type { LeaderboardToggleProps } from '@/types/leaderboard.types'

/**
 * LeaderboardToggle - Opt-in/out toggle for leaderboard participation
 * Allows users to control their privacy in collaborative competitions
 */
export function LeaderboardToggle({
  isOptedIn,
  onToggle,
  isLoading = false,
}: LeaderboardToggleProps): ReactElement {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isOptedIn ? 'default' : 'outline'}
            size="sm"
            onClick={onToggle}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isOptedIn ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
            {isOptedIn ? 'Public' : 'Private'}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isOptedIn
              ? 'Your score is visible to other collaborators'
              : 'Your score is hidden from the leaderboard'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
