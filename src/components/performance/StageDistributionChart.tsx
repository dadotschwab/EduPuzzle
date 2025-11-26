import { type ReactElement, memo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { StageData } from '@/types/performance.types'

/**
 * StageDistributionChart - Bar chart for word stage distribution (0-6)
 * Visualizes SRS progression across different learning stages
 * Memoized to prevent unnecessary re-renders
 */
export const StageDistributionChart = memo(function StageDistributionChart({
  data,
}: {
  data: StageData[]
}): ReactElement {
  return (
    <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-slate-200/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-violet-900">
          <span className="text-2xl">📊</span>
          Word Stage Distribution
        </CardTitle>
        <CardDescription className="text-slate-600 font-medium">
          Words distributed across spaced repetition stages
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" />
            <XAxis
              dataKey="stage"
              tickFormatter={(stage) => `Stage ${stage}`}
              stroke="#7c3aed"
            />
            <YAxis stroke="#7c3aed" />
            <Tooltip
              formatter={(value: number) => [value, 'Words']}
              labelFormatter={(stage) => `Stage ${stage}`}
              contentStyle={{
                backgroundColor: 'white',
                border: '2px solid #7c3aed',
                borderRadius: '12px',
                fontWeight: 'bold'
              }}
            />
            <Bar dataKey="count" fill="#7c3aed" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
})
