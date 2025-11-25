import { type ReactElement } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'
import { usePerformanceInsights } from '@/hooks/usePerformanceInsights'
import { cn } from '@/lib/utils'

/**
 * PerformanceInsights - Compact dashboard widget for performance metrics
 * Shows total learned words, success rate, weekly puzzles, and trends
 */
export function PerformanceInsights({ className }: { className?: string }): ReactElement {
  const { data, isLoading, error, retry } = usePerformanceInsights()

  if (isLoading) {
    return (
      <Card className={cn('hidden lg:flex', className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={cn('hidden lg:flex', className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="text-2xl">📊</div>
            <div className="flex-1">
              <div className="text-sm text-gray-600">Performance</div>
              <div className="font-semibold">Unable to load</div>
              <div className="text-xs text-gray-500 mt-1">Check your connection</div>
            </div>
            <Button variant="outline" size="sm" onClick={retry}>
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { totalLearned, successRate, weeklyPuzzles, trends } = data || {}

  return (
    <Card className={cn('hidden lg:flex', className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="text-2xl">📊</div>
          <div className="flex-1">
            <div className="text-sm text-gray-600">Performance</div>
            <div className="font-semibold flex items-center gap-2">
              {totalLearned} words learned
              {trends?.learned && (
                <Badge variant={trends.learned > 0 ? 'default' : 'secondary'} className="text-xs">
                  {trends.learned > 0 ? (
                    <TrendingUp className="w-3 h-3 mr-1" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-1" />
                  )}
                  {Math.abs(trends.learned)}
                </Badge>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {successRate}% success rate • {weeklyPuzzles} puzzles this week
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => (window.location.href = '/settings/stats')}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Details
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
