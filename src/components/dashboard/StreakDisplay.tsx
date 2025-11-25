/**
 * @fileoverview StreakDisplay Component
 *
 * Main component for displaying user streak information with fire/ice icons,
 * progress indicators, and daily completion tracking.
 *
 * @module components/dashboard/StreakDisplay
 */

import { Flame, Trophy } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useStreak, useStreakHelpers } from '@/hooks/useStreak'
import { StreakProgress } from './StreakProgress'

interface StreakDisplayProps {
  className?: string
}

/**
 * Main streak display component
 *
 * Shows current streak, longest streak, freeze availability, and daily progress.
 * Includes loading states, error handling, and responsive design.
 */
export function StreakDisplay({ className }: StreakDisplayProps) {
  const { data, isLoading, error, errorType, retry } = useStreak()
  const { hasActiveStreak, canUseFreeze, todaysProgress } = useStreakHelpers()

  // Loading state
  if (isLoading) {
    return (
      <div
        className={`flex items-center gap-4 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200 ${className}`}
      >
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8 rounded-full" />
          <div>
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-6 w-12" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-5 h-5" />
          <div>
            <Skeleton className="h-4 w-20 mb-1" />
            <Skeleton className="h-5 w-8" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-5 h-5" />
          <div>
            <Skeleton className="h-4 w-16 mb-1" />
            <Skeleton className="h-5 w-6" />
          </div>
        </div>
        <Skeleton className="h-8 w-32 ml-auto" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div
        className={`flex items-center gap-4 p-4 bg-red-50 rounded-lg border border-red-200 ${className}`}
      >
        <div className="text-red-600">
          <Flame className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-red-800">Failed to load streak data</p>
          <p className="text-xs text-red-600">
            {errorType === 'auth'
              ? 'Please sign in again'
              : errorType === 'network'
                ? 'Check your connection'
                : 'Try again later'}
          </p>
        </div>
        <button
          onClick={retry}
          className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded"
        >
          Retry
        </button>
      </div>
    )
  }

  // No streak data yet (new user)
  if (!data?.userStreak) {
    return (
      <div
        className={`flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 ${className}`}
      >
        <div className="text-gray-400">
          <Flame className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-700">Start your streak!</p>
          <p className="text-xs text-gray-500">Complete 5 puzzles or review all due words daily</p>
        </div>
        <Badge variant="secondary" className="ml-auto">
          0 days
        </Badge>
      </div>
    )
  }

  const { current_streak, longest_streak, streak_freezes_available } = data.userStreak

  return (
    <TooltipProvider>
      <div
        className={`flex items-center gap-4 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200 ${className}`}
      >
        {/* Current Streak */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 cursor-help">
              <div className={`text-2xl ${hasActiveStreak ? 'text-orange-500' : 'text-gray-400'}`}>
                🔥
              </div>
              <div>
                <div className="text-sm text-gray-600">Current Streak</div>
                <div
                  className={`text-2xl font-bold ${hasActiveStreak ? 'text-orange-600' : 'text-gray-500'}`}
                >
                  {current_streak}
                </div>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Complete 5+ puzzles or all due words daily to maintain your streak</p>
          </TooltipContent>
        </Tooltip>

        {/* Longest Streak */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 cursor-help">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <div>
                <div className="text-sm text-gray-600">Best Streak</div>
                <div className="text-lg font-semibold text-gray-700">{longest_streak}</div>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Your personal best streak record</p>
          </TooltipContent>
        </Tooltip>

        {/* Freeze Available */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 cursor-help">
              <div className={`text-xl ${canUseFreeze ? 'text-blue-500' : 'text-gray-400'}`}>
                🧊
              </div>
              <div>
                <div className="text-sm text-gray-600">Freezes</div>
                <div
                  className={`text-lg font-semibold ${canUseFreeze ? 'text-blue-600' : 'text-gray-500'}`}
                >
                  {streak_freezes_available}
                </div>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Protect your streak on missed days. Refills monthly on the 1st.</p>
          </TooltipContent>
        </Tooltip>

        {/* Daily Progress */}
        <div className="ml-auto">
          <StreakProgress
            puzzlesCompleted={todaysProgress.puzzlesCompleted}
            wordsCompleted={todaysProgress.wordsCompleted}
            dueWords={todaysProgress.dueWords}
          />
        </div>
      </div>
    </TooltipProvider>
  )
}
