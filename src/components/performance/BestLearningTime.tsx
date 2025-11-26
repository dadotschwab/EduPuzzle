import { type ReactElement, memo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock } from 'lucide-react'
import type { LearningTimeData } from '@/types/performance.types'

/**
 * BestLearningTime - Shows optimal learning hours based on success rates
 * Highlights the best time for studying with hourly breakdown
 * Memoized to prevent unnecessary re-renders
 */
export const BestLearningTime = memo(function BestLearningTime({
  data,
}: {
  data: LearningTimeData[]
}): ReactElement {
  const bestTime =
    data.length > 0
      ? data.reduce((best, current) => (current.successRate > best.successRate ? current : best))
      : { hour: 0, successRate: 0 } // Default value for empty data

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <span className="text-2xl">⏰</span>
          Best Learning Time
        </CardTitle>
        <CardDescription className="text-slate-600 font-medium">
          Your most productive study hours
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white font-bold text-lg rounded-2xl border-2 border-blue-700 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
              <Clock className="w-5 h-5" />
              {bestTime.hour}:00 - {bestTime.successRate}% success
            </div>
          </div>

          <div className="grid grid-cols-6 gap-2 text-sm">
            {data.map((hour) => (
              <div
                key={hour.hour}
                className={`p-2 rounded-lg text-center font-bold border-2 transition-all ${
                  hour.hour === bestTime.hour
                    ? 'bg-blue-500 text-white border-blue-700'
                    : 'bg-white text-slate-700 border-blue-200'
                }`}
              >
                <div className="font-bold">{hour.hour}:00</div>
                <div className="text-xs">{hour.successRate}%</div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
})
