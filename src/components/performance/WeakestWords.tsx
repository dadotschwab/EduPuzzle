import { type ReactElement } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle } from 'lucide-react'
import type { WeakWord } from '@/types/performance.types'

/**
 * WeakestWords - Shows words with lowest accuracy rates
 * Displays top 5 words needing improvement with actionable insights
 */
export function WeakestWords({ data }: { data: WeakWord[] }): ReactElement {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Weakest Words
          </CardTitle>
          <CardDescription>Words that need more practice</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No words identified for improvement yet. Keep learning!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Weakest Words
        </CardTitle>
        <CardDescription>Focus on these words to improve your accuracy</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((word, index) => (
            <div key={word.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Badge variant="outline">{index + 1}</Badge>
                <div>
                  <div className="font-medium">{word.word}</div>
                  <div className="text-sm text-muted-foreground">{word.attempts} attempts</div>
                </div>
              </div>
              <Badge variant="destructive">{word.accuracy}% accuracy</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
