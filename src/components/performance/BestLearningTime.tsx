import { type ReactElement } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock } from 'lucide-react'
import type { LearningTimeData } from '@/types/performance.types'

/**
 * BestLearningTime - Shows optimal learning hours based on success rates
 * Highlights the best time for studying with hourly breakdown
 */
export function BestLearningTime({ data }: { data: LearningTimeData[] }): ReactElement {
  const bestTime = data.reduce((best, current) =>
    current.successRate > best.successRate ? current : best
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Best Learning Time
        </CardTitle>
        <CardDescription>Your most productive study hours</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center">
            <Badge variant="default" className="text-lg px-4 py-2">
              {bestTime.hour}:00 - {bestTime.successRate}% success rate
            </Badge>
          </div>

          <div className="grid grid-cols-6 gap-2 text-sm">
            {data.map((hour) => (
              <div
                key={hour.hour}
                className={`p-2 rounded text-center ${
                  hour.hour === bestTime.hour ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}
              >
                <div className="font-medium">{hour.hour}:00</div>
                <div className="text-xs opacity-75">{hour.successRate}%</div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
