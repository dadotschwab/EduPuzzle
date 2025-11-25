import { type ReactElement } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { StageData } from '@/types/performance.types'

/**
 * StageDistributionChart - Bar chart for word stage distribution (0-6)
 * Visualizes SRS progression across different learning stages
 */
export function StageDistributionChart({ data }: { data: StageData[] }): ReactElement {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Word Stage Distribution</CardTitle>
        <CardDescription>Words distributed across spaced repetition stages</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="stage" tickFormatter={(stage) => `Stage ${stage}`} />
            <YAxis />
            <Tooltip
              formatter={(value: number) => [value, 'Words']}
              labelFormatter={(stage) => `Stage ${stage}`}
            />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
