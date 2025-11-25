/**
 * @fileoverview StreakProgress Component
 *
 * Visual progress indicator showing today's completion toward streak maintenance goals.
 *
 * @module components/dashboard/StreakProgress
 */

import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface StreakProgressProps {
  puzzlesCompleted: number
  wordsCompleted: number
  dueWords: number
  className?: string
}

/**
 * Progress indicator for daily streak maintenance
 *
 * Shows visual progress toward the streak condition (5 puzzles OR all due words).
 * Includes tooltips with detailed breakdown and conditional styling.
 */
export function StreakProgress({
  puzzlesCompleted,
  wordsCompleted,
  dueWords,
  className,
}: StreakProgressProps) {
  // Calculate progress toward streak condition
  const puzzleProgress = Math.min((puzzlesCompleted / 5) * 100, 100)
  const wordProgress = dueWords > 0 ? Math.min((wordsCompleted / dueWords) * 100, 100) : 0

  // Overall progress is the maximum of the two conditions
  const overallProgress = Math.max(puzzleProgress, wordProgress)

  // Check if streak condition is met
  const streakConditionMet = puzzlesCompleted >= 5 || (dueWords > 0 && wordsCompleted >= dueWords)

  // Format progress text
  const getProgressText = () => {
    if (streakConditionMet) {
      return 'Streak maintained! 🎉'
    }

    const puzzleText = `${puzzlesCompleted}/5 puzzles`
    const wordText = dueWords > 0 ? `${wordsCompleted}/${dueWords} words` : 'No words due'

    return `${puzzleText} • ${wordText}`
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('flex flex-col items-end gap-1', className)}>
            <Progress
              value={overallProgress}
              className={cn('w-32 h-2', streakConditionMet ? 'bg-green-100' : 'bg-orange-100')}
              // Custom styling for the progress bar indicator
              style={
                {
                  '--progress-background': streakConditionMet ? '#22c55e' : '#f97316',
                } as React.CSSProperties
              }
            />
            <div className="text-xs text-gray-600 text-right">{getProgressText()}</div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-2">
            <p className="font-medium">Daily Progress</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Puzzles:</span>
                <span className={puzzlesCompleted >= 5 ? 'text-green-600 font-medium' : ''}>
                  {puzzlesCompleted}/5
                </span>
              </div>
              <div className="flex justify-between">
                <span>Words:</span>
                <span
                  className={
                    dueWords > 0 && wordsCompleted >= dueWords ? 'text-green-600 font-medium' : ''
                  }
                >
                  {wordsCompleted}/{dueWords || 0}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Complete 5+ puzzles OR review all due words to maintain your streak
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
