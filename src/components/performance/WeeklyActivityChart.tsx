import { type ReactElement } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { ActivityData } from '@/types/performance.types'

/**
 * WeeklyActivityChart - Bar chart showing daily activity levels
 * Displays puzzles completed per day for the past week
 */
export function WeeklyActivityChart({ data }: { data: ActivityData[] }): ReactElement {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Activity</CardTitle>
        <CardDescription>Puzzles completed each day this week</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="day"
              tickFormatter={(day) => day.slice(0, 3)} // Mon, Tue, etc.
            />
            <YAxis />
            <Tooltip
              formatter={(value: number) => [value, 'Puzzles']}
              labelFormatter={(day) => day}
            />
            <Bar dataKey="puzzles" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
