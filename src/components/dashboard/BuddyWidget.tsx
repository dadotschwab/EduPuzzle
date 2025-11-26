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
      <div className={`p-4 bg-gradient-to-br from-violet-50 to-purple-50 rounded-3xl border-2 border-violet-200 ${className}`}>
        <Skeleton className="h-4 w-20 mb-3" />
        <div className="space-y-2">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-8 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`p-4 bg-gradient-to-br from-violet-50 to-purple-50 rounded-3xl border-2 border-violet-200 ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">👥</span>
          <h3 className="text-sm font-bold text-slate-900">Buddy</h3>
        </div>
        <div className="flex items-center gap-2 p-2 bg-white rounded-lg border-2 border-red-200">
          <div className="text-xl">⚠️</div>
          <div className="flex-1">
            <div className="text-xs font-semibold text-slate-900">Unable to load</div>
          </div>
        </div>
        <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className={`p-4 bg-gradient-to-br from-violet-50 to-purple-50 rounded-3xl border-2 border-violet-200 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">👥</span>
        <h3 className="text-sm font-bold text-slate-900">Buddy</h3>
      </div>

      <div className="space-y-2">
        <div className="p-2 bg-white rounded-lg border-2 border-violet-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-xl">{hasBuddy ? '👥' : '🔍'}</div>
            <div className="flex-1">
              {hasBuddy ? (
                <>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Your Buddy</div>
                  <div className="font-bold text-sm text-slate-900">{buddyName}</div>
                </>
              ) : (
                <>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">No Buddy Yet</div>
                  <div className="font-bold text-xs text-slate-900">Find a study partner</div>
                </>
              )}
            </div>
          </div>

          {hasBuddy && (
            <div className={`text-xs font-semibold px-2 py-1 rounded-md ${buddyHasLearnedToday ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
              {buddyHasLearnedToday ? '✅ Learned today!' : '⏳ Not yet today'}
            </div>
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
