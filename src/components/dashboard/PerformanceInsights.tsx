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
      <div className={cn('p-6 bg-gradient-to-br from-pink-50 to-rose-50 rounded-3xl border-2 border-pink-200', className)}>
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('p-6 bg-gradient-to-br from-pink-50 to-rose-50 rounded-3xl border-2 border-pink-200', className)}>
        <h3 className="text-lg font-bold text-slate-900 mb-4">📊 Performance</h3>
        <div className="flex items-center gap-3 p-3 bg-white rounded-xl border-2 border-red-200">
          <div className="text-2xl">⚠️</div>
          <div className="flex-1">
            <div className="font-semibold text-slate-900">Unable to load</div>
            <div className="text-xs text-slate-500 mt-1">Check your connection</div>
          </div>
        </div>
        <Button variant="outline" size="sm" className="w-full mt-3" onClick={retry}>
          Retry
        </Button>
      </div>
    )
  }

  const { totalLearned, successRate, weeklyPuzzles, trends } = data || {}

  return (
    <div className={cn('p-6 bg-gradient-to-br from-pink-50 to-rose-50 rounded-3xl border-2 border-pink-200', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900">📊 Performance</h3>
      </div>

      <div className="space-y-3">
        {/* Main stat */}
        <div className="p-4 bg-white rounded-xl border-2 border-pink-300">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Words Learned</div>
              <div className="flex items-center gap-2 mt-1">
                <div className="text-3xl font-bold text-slate-900">{totalLearned || 0}</div>
                {trends?.learned && trends.learned !== 0 && (
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
            </div>
          </div>
        </div>

        {/* Additional stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-white rounded-xl border-2 border-pink-200">
            <div className="text-xs font-semibold text-slate-600 mb-1">Success Rate</div>
            <div className="text-2xl font-bold text-pink-600">{successRate || 0}%</div>
          </div>

          <div className="p-3 bg-white rounded-xl border-2 border-pink-200">
            <div className="text-xs font-semibold text-slate-600 mb-1">This Week</div>
            <div className="text-2xl font-bold text-pink-600">{weeklyPuzzles || 0}</div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => (window.location.href = '/settings/stats')}
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          View Details
        </Button>
      </div>
    </div>
  )
}
