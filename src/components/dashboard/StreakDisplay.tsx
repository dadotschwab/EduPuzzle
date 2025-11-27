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
  const { hasActiveStreak, canUseFreeze } = useStreakHelpers()

  // Loading state
  if (isLoading) {
    return (
      <div
        className={`p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl border-2 border-amber-200 ${className}`}
      >
        <Skeleton className="h-4 w-20 mb-3" />
        <div className="space-y-2">
          <Skeleton className="h-12 w-full rounded-lg" />
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  // Error state - only show for actual errors, not missing tables
  if (error && errorType !== 'server') {
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

  // If server error (likely missing tables), show a placeholder instead of breaking
  if (error && errorType === 'server') {
    return (
      <div
        className={`flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 ${className}`}
      >
        <div className="text-gray-400">
          <Flame className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-700">Streak system coming soon!</p>
          <p className="text-xs text-gray-500">
            Daily learning streaks will be available after the next update.
          </p>
        </div>
        <Badge variant="secondary" className="ml-auto">
          Soon
        </Badge>
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
        className={`p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl border-2 border-amber-200 ${className}`}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🔥</span>
          <h3 className="text-sm font-bold text-slate-900">Streak</h3>
        </div>

        <div className="space-y-2">
          {/* Current Streak */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-between p-2 bg-white rounded-lg border-2 border-amber-300 cursor-help">
                <div className="flex items-center gap-2">
                  <div
                    className={`text-xl ${hasActiveStreak ? 'text-orange-500' : 'text-gray-400'}`}
                  >
                    🔥
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                      Current
                    </div>
                    <div
                      className={`text-xl font-bold ${hasActiveStreak ? 'text-orange-600' : 'text-gray-500'}`}
                    >
                      {current_streak}
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500">days</div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Complete 5+ puzzles or all due words daily to maintain your streak</p>
            </TooltipContent>
          </Tooltip>

          <div className="grid grid-cols-2 gap-2">
            {/* Longest Streak */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col p-2 bg-white rounded-lg border-2 border-amber-200 cursor-help">
                  <div className="flex items-center gap-1 mb-0.5">
                    <Trophy className="w-3 h-3 text-yellow-500" />
                    <div className="text-[10px] font-semibold text-slate-500">Best</div>
                  </div>
                  <div className="text-lg font-bold text-gray-700">{longest_streak}</div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Your personal best streak record</p>
              </TooltipContent>
            </Tooltip>

            {/* Freeze Available */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col p-2 bg-white rounded-lg border-2 border-blue-200 cursor-help">
                  <div className="flex items-center gap-1 mb-0.5">
                    <div className={`text-sm ${canUseFreeze ? 'text-blue-500' : 'text-gray-400'}`}>
                      🧊
                    </div>
                    <div className="text-[10px] font-semibold text-slate-500">Freezes</div>
                  </div>
                  <div
                    className={`text-lg font-bold ${canUseFreeze ? 'text-blue-600' : 'text-gray-500'}`}
                  >
                    {streak_freezes_available}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Protect your streak on missed days. Refills monthly on the 1st.</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
