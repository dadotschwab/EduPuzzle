/**
 * @fileoverview Collaborative Leaderboard Component
 *
 * Displays ranked collaborators with SRS-based scores for competitive learning.
 * Includes opt-in/out functionality and real-time updates.
 */

import { type ReactElement, memo } from 'react'
import { useLeaderboard } from '@/hooks/useLeaderboard'
import { LeaderboardEntry } from './LeaderboardEntry'
import { LeaderboardToggle } from './LeaderboardToggle'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Trophy, Users } from 'lucide-react'

interface CollaborativeLeaderboardProps {
  /** Shared list identifier */
  sharedListId: string
  /** Current user identifier */
  currentUserId: string
}

/**
 * CollaborativeLeaderboard - Displays ranked collaborators with SRS-based scores
 * Shows top performers in collaborative word lists with opt-in/out controls
 * Memoized to prevent unnecessary re-renders
 */
export const CollaborativeLeaderboard = memo(function CollaborativeLeaderboard({
  sharedListId,
  currentUserId,
}: CollaborativeLeaderboardProps): ReactElement {
  const { data, isLoading, error, toggleOptIn } = useLeaderboard({ sharedListId })

  if (isLoading) {
    return <LeaderboardSkeleton />
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    )
  }

  const currentUserEntry = data?.find((entry) => entry.userId === currentUserId)
  const isCurrentUserOptedIn = currentUserEntry?.isOptedIn ?? false

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-lg">Leaderboard</CardTitle>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {data?.length || 0}
            </Badge>
          </div>
          <LeaderboardToggle
            isOptedIn={isCurrentUserOptedIn}
            onToggle={() => toggleOptIn.mutate(!isCurrentUserOptedIn)}
            isLoading={toggleOptIn.isPending}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {data && data.length > 0 ? (
          data.map((entry, index) => (
            <LeaderboardEntry
              key={entry.userId}
              entry={entry}
              rank={index + 1}
              isCurrentUser={entry.userId === currentUserId}
            />
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No participants yet</p>
            <p className="text-xs mt-1">Be the first to join the competition!</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
})

function LeaderboardSkeleton(): ReactElement {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-6 w-12" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
