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
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="text-2xl">⚠️</div>
            <div className="flex-1">
              <div className="text-sm text-gray-600">Buddy Status</div>
              <div className="font-semibold">Unable to load</div>
              <div className="text-xs text-gray-500 mt-1">Check your connection</div>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="text-2xl">{hasBuddy ? '👥' : '🔍'}</div>

          <div className="flex-1">
            {hasBuddy ? (
              <>
                <div className="text-sm text-gray-600">Your Buddy</div>
                <div className="font-semibold">{buddyName}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {buddyHasLearnedToday ? '✅ Learned today!' : '⏳ Not yet today'}
                </div>
              </>
            ) : (
              <>
                <div className="text-sm text-gray-600">Learning Buddy</div>
                <div className="font-semibold">Find a buddy</div>
                <div className="text-xs text-gray-500 mt-1">Share progress and stay motivated</div>
              </>
            )}
          </div>

          <Button
            variant={hasBuddy ? 'outline' : 'default'}
            size="sm"
            onClick={hasBuddy ? handleManageBuddy : handleFindBuddy}
            disabled={isGeneratingInvite}
          >
            {hasBuddy ? 'Manage' : 'Find Buddy'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
