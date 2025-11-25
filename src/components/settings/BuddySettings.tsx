import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Users, Copy, Plus, Loader2 } from 'lucide-react'
import { useBuddy } from '@/hooks/useBuddy'
import { toast } from 'sonner'

export function BuddySettings() {
  const {
    hasBuddy,
    buddyName,
    buddyHasLearnedToday,
    buddyCompletionPercentage,
    generateInvite,
    isGeneratingInvite,
    removeBuddy,
    isRemovingBuddy,
  } = useBuddy()

  const [inviteToken, setInviteToken] = useState<string | null>(null)
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)

  const handleGenerateInvite = async () => {
    try {
      await generateInvite()
      // The invite token will be handled by the hook's success callback
      // For now, we'll show a success message
    } catch (error) {
      // Error is handled by the hook and shown via toast
    }
  }

  const handleCopyLink = async () => {
    if (!inviteToken) return

    const inviteUrl = `${window.location.origin}/buddy/accept/${inviteToken}`

    try {
      await navigator.clipboard.writeText(inviteUrl)
      toast.success('Invite link copied to clipboard!')
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = inviteUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      toast.success('Invite link copied to clipboard!')
    }
  }

  const handleRemoveBuddy = async () => {
    try {
      await removeBuddy()
      setRemoveDialogOpen(false)
      setInviteToken(null) // Clear any pending invite
    } catch (error) {
      // Error is handled by the hook and shown via toast
    }
  }

  return (
    <div className="space-y-6">
      {/* Current Buddy Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Your Learning Buddy
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasBuddy ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{buddyName}</p>
                  <p className="text-sm text-muted-foreground">
                    Connected for mutual accountability
                  </p>
                </div>
                <Badge variant={buddyHasLearnedToday ? 'default' : 'secondary'}>
                  {buddyHasLearnedToday ? 'Active Today' : 'Not Yet'}
                </Badge>
              </div>

              {/* Progress Indicator */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Today's Progress</span>
                  <span>{buddyCompletionPercentage}%</span>
                </div>
                <Progress value={buddyCompletionPercentage} className="h-2" />
              </div>

              <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isRemovingBuddy} className="w-full">
                    {isRemovingBuddy ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Removing...
                      </>
                    ) : (
                      'Remove Buddy'
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove Learning Buddy</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to remove {buddyName} as your learning buddy? This
                      action cannot be undone and you will need to find a new buddy.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleRemoveBuddy}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Remove Buddy
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">You don't have a learning buddy yet</p>
              <Button onClick={handleGenerateInvite} disabled={isGeneratingInvite}>
                {isGeneratingInvite ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Generate Invite Link
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Link Generation */}
      {inviteToken && !hasBuddy && (
        <Card>
          <CardHeader>
            <CardTitle>Invite Link</CardTitle>
            <CardDescription>
              Share this link with someone you'd like to buddy up with
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={`${window.location.origin}/buddy/accept/${inviteToken}`}
                readOnly
                className="flex-1"
              />
              <Button onClick={handleCopyLink} variant="outline">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Link expires in 24 hours</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
