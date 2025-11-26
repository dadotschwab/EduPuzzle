import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useBuddy } from '@/hooks/useBuddy'

interface BuddyWidgetProps {
  className?: string
}

export function BuddyWidget({ className }: BuddyWidgetProps) {
  const { hasBuddy, buddyName, buddyHasLearnedToday, isLoading, error, isGeneratingInvite } =
    useBuddy()

  const handleFindBuddy = () => {
    // Navigate to settings or show modal
    window.location.href = '/settings/buddy'
  }

  const handleManageBuddy = () => {
    window.location.href = '/settings/buddy'
  }

  if (isLoading) {
    return (
      <div className={`p-6 bg-gradient-to-br from-violet-50 to-purple-50 rounded-3xl border-2 border-violet-200 ${className}`}>
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`p-6 bg-gradient-to-br from-violet-50 to-purple-50 rounded-3xl border-2 border-violet-200 ${className}`}>
        <h3 className="text-lg font-bold text-slate-900 mb-4">👥 Learning Buddy</h3>
        <div className="flex items-center gap-3 p-3 bg-white rounded-xl border-2 border-red-200">
          <div className="text-2xl">⚠️</div>
          <div className="flex-1">
            <div className="font-semibold text-slate-900">Unable to load</div>
            <div className="text-xs text-slate-500 mt-1">Check your connection</div>
          </div>
        </div>
        <Button variant="outline" size="sm" className="w-full mt-3" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className={`p-6 bg-gradient-to-br from-violet-50 to-purple-50 rounded-3xl border-2 border-violet-200 ${className}`}>
      <h3 className="text-lg font-bold text-slate-900 mb-4">👥 Learning Buddy</h3>

      <div className="space-y-3">
        <div className="p-4 bg-white rounded-xl border-2 border-violet-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-3xl">{hasBuddy ? '👥' : '🔍'}</div>
            <div className="flex-1">
              {hasBuddy ? (
                <>
                  <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Your Buddy</div>
                  <div className="font-bold text-xl text-slate-900">{buddyName}</div>
                </>
              ) : (
                <>
                  <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide">No Buddy Yet</div>
                  <div className="font-bold text-lg text-slate-900">Find a study partner</div>
                </>
              )}
            </div>
          </div>

          {hasBuddy && (
            <div className={`text-sm font-semibold px-3 py-1.5 rounded-lg ${buddyHasLearnedToday ? 'bg-green-100 text-green-700 border-2 border-green-300' : 'bg-slate-100 text-slate-600 border-2 border-slate-200'}`}>
              {buddyHasLearnedToday ? '✅ Learned today!' : '⏳ Not yet today'}
            </div>
          )}

          {!hasBuddy && (
            <p className="text-xs text-slate-500">Share progress and stay motivated together</p>
          )}
        </div>

        <Button
          variant={hasBuddy ? 'outline' : 'default'}
          size="sm"
          className="w-full"
          onClick={hasBuddy ? handleManageBuddy : handleFindBuddy}
          disabled={isGeneratingInvite}
        >
          {hasBuddy ? 'Manage Buddy' : 'Find Buddy'}
        </Button>
      </div>
    </div>
  )
}
