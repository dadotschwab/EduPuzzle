import { type ReactElement, memo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle } from 'lucide-react'
import type { WeakWord } from '@/types/performance.types'

/**
 * WeakestWords - Shows words with lowest accuracy rates
 * Displays top 5 words needing improvement with actionable insights
 * Memoized to prevent unnecessary re-renders
 */
export const WeakestWords = memo(function WeakestWords({
  data,
}: {
  data: WeakWord[]
}): ReactElement {
  if (data.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-900">
            <span className="text-2xl">💪</span>
            Weakest Words
          </CardTitle>
          <CardDescription className="text-slate-600 font-medium">
            Words that need more practice
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 text-center py-8 font-semibold">
            No words identified for improvement yet. Keep learning!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-900">
          <span className="text-2xl">💪</span>
          Weakest Words
        </CardTitle>
        <CardDescription className="text-slate-600 font-medium">
          Focus on these words to improve your accuracy
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((word, index) => (
            <div
              key={word.id}
              className="flex items-center justify-between p-3 bg-white border-2 border-amber-200 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-amber-200 text-amber-900 font-bold rounded-full border-2 border-amber-400">
                  {index + 1}
                </div>
                <div>
                  <div className="font-bold text-slate-900">{word.word}</div>
                  <div className="text-sm text-slate-500 font-semibold">{word.attempts} attempts</div>
                </div>
              </div>
              <div className="px-3 py-1 bg-red-100 text-red-700 font-bold text-sm rounded-lg border-2 border-red-300">
                {word.accuracy}%
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
})
