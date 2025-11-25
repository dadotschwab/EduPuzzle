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
        <h1 className="text-3xl font-bold tracking-tight">Performance Insights</h1>
        <p className="text-muted-foreground">
          Analyze your learning patterns and optimize your study sessions
        </p>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Learned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalLearned || 0}</div>
            <p className="text-xs text-muted-foreground">words mastered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.successRate || 0}%</div>
            <p className="text-xs text-muted-foreground">overall accuracy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Weekly Puzzles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.weeklyPuzzles || 0}</div>
            <p className="text-xs text-muted-foreground">this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Best Learning Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.bestLearningTime ? `${data.bestLearningTime.hour}:00` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">peak performance</p>
          </CardContent>
        </Card>
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
