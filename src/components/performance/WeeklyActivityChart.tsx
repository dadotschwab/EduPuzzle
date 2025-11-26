import { type ReactElement, memo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { ActivityData } from '@/types/performance.types'

/**
 * WeeklyActivityChart - Bar chart showing daily activity levels
 * Displays puzzles completed per day for the past week
 * Memoized to prevent unnecessary re-renders
 */
export const WeeklyActivityChart = memo(function WeeklyActivityChart({
  data,
}: {
  data: ActivityData[]
}): ReactElement {
  return (
    <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-pink-900">
          <span className="text-2xl">📈</span>
          Weekly Activity
        </CardTitle>
        <CardDescription className="text-slate-600 font-medium">
          Puzzles completed each day this week
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#fecdd3" />
            <XAxis
              dataKey="day"
              tickFormatter={(day) => day.slice(0, 3)} // Mon, Tue, etc.
              stroke="#db2777"
            />
            <YAxis stroke="#db2777" />
            <Tooltip
              formatter={(value: number) => [value, 'Puzzles']}
              labelFormatter={(day) => day}
              contentStyle={{
                backgroundColor: 'white',
                border: '2px solid #db2777',
                borderRadius: '12px',
                fontWeight: 'bold'
              }}
            />
            <Bar dataKey="puzzles" fill="#db2777" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
})
