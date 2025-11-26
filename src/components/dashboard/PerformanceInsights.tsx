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
      <div className={cn('p-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-3xl border-2 border-pink-200', className)}>
        <Skeleton className="h-4 w-20 mb-3" />
        <div className="space-y-2">
          <Skeleton className="h-12 w-full rounded-lg" />
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('p-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-3xl border-2 border-pink-200', className)}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">📊</span>
          <h3 className="text-sm font-bold text-slate-900">Stats</h3>
        </div>
        <div className="flex items-center gap-2 p-2 bg-white rounded-lg border-2 border-red-200">
          <div className="text-xl">⚠️</div>
          <div className="flex-1">
            <div className="text-xs font-semibold text-slate-900">Unable to load</div>
          </div>
        </div>
        <Button variant="outline" size="sm" className="w-full mt-2" onClick={retry}>
          Retry
        </Button>
      </div>
    )
  }

  const { totalLearned, successRate, weeklyPuzzles, trends } = data || {}

  return (
    <div className={cn('p-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-3xl border-2 border-pink-200', className)}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">📊</span>
        <h3 className="text-sm font-bold text-slate-900">Stats</h3>
      </div>

      <div className="space-y-2">
        {/* Main stat */}
        <div className="p-2 bg-white rounded-lg border-2 border-pink-300">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Words Learned</div>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="text-xl font-bold text-slate-900">{totalLearned || 0}</div>
                {trends?.learned && trends.learned !== 0 && (
                  <Badge variant={trends.learned > 0 ? 'default' : 'secondary'} className="text-[10px] px-1 py-0">
                    {trends.learned > 0 ? (
                      <TrendingUp className="w-2 h-2 mr-0.5" />
                    ) : (
                      <TrendingDown className="w-2 h-2 mr-0.5" />
                    )}
                    {Math.abs(trends.learned)}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Additional stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 bg-white rounded-lg border-2 border-pink-300">
            <div className="text-[10px] font-semibold text-slate-500 mb-0.5">Success</div>
            <div className="text-lg font-bold text-pink-600">{successRate || 0}%</div>
          </div>

          <div className="p-2 bg-white rounded-lg border-2 border-pink-300">
            <div className="text-[10px] font-semibold text-slate-500 mb-0.5">Week</div>
            <div className="text-lg font-bold text-pink-600">{weeklyPuzzles || 0}</div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => (window.location.href = '/settings/stats')}
        >
          <BarChart3 className="w-3 h-3 mr-1" />
          Details
        </Button>
      </div>
    </div>
  )
}
