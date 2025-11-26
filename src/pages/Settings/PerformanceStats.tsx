import { type ReactElement } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { usePerformanceInsights } from '@/hooks/usePerformanceInsights'
import { StageDistributionChart } from '@/components/performance/StageDistributionChart'
import { WeeklyActivityChart } from '@/components/performance/WeeklyActivityChart'
import { BestLearningTime } from '@/components/performance/BestLearningTime'
import { WeakestWords } from '@/components/performance/WeakestWords'

/**
 * PerformanceStats - Detailed performance statistics page
 * Comprehensive view of learning analytics with multiple visualizations
 */
export function PerformanceStats(): ReactElement {
  const { data, isLoading, error, retry } = usePerformanceInsights()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load performance data. Please try again.
          <button onClick={retry} className="ml-2 underline hover:no-underline">
            Retry
          </button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-violet-600 via-pink-600 to-amber-600 bg-clip-text text-transparent">
          Performance Insights
        </h1>
        <p className="text-slate-600 text-lg font-medium">
          Analyze your learning patterns and optimize your study sessions
        </p>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="p-6 bg-gradient-to-br from-violet-50 to-purple-50 rounded-3xl border-2 border-slate-200/60">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">📚</span>
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide">Total Learned</h3>
          </div>
          <div className="text-4xl font-bold text-violet-600">{data?.totalLearned || 0}</div>
          <p className="text-sm text-slate-500 font-semibold mt-1">words mastered</p>
        </div>

        <div className="p-6 bg-gradient-to-br from-pink-50 to-rose-50 rounded-3xl border-2 border-slate-200/60">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🎯</span>
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide">Success Rate</h3>
          </div>
          <div className="text-4xl font-bold text-pink-600">{data?.successRate || 0}%</div>
          <p className="text-sm text-slate-500 font-semibold mt-1">overall accuracy</p>
        </div>

        <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl border-2 border-slate-200/60">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🧩</span>
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide">Weekly Puzzles</h3>
          </div>
          <div className="text-4xl font-bold text-amber-600">{data?.weeklyPuzzles || 0}</div>
          <p className="text-sm text-slate-500 font-semibold mt-1">this week</p>
        </div>

        <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl border-2 border-slate-200/60">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">⏰</span>
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide">Best Time</h3>
          </div>
          <div className="text-4xl font-bold text-blue-600">
            {data?.bestLearningTime ? `${data.bestLearningTime.hour}:00` : 'N/A'}
          </div>
          <p className="text-sm text-slate-500 font-semibold mt-1">peak performance</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <StageDistributionChart data={data?.stageDistribution || []} />
        <WeeklyActivityChart data={data?.weeklyActivity || []} />
        <BestLearningTime data={data?.learningTimeData || []} />
        <WeakestWords data={data?.weakestWords || []} />
      </div>
    </div>
  )
}
