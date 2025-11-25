import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { acceptBuddyInvite } from '@/lib/api/buddy'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle, Loader2, Users } from 'lucide-react'

export function BuddyAccept() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [status, setStatus] = useState<
    'loading' | 'success' | 'error' | 'expired' | 'auth_required'
  >('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    if (authLoading) return

    if (!isAuthenticated || !user) {
      setStatus('auth_required')
      return
    }

    if (!token) {
      setStatus('error')
      setErrorMessage('Invalid invite link')
      return
    }

    const acceptInvite = async () => {
      try {
        await acceptBuddyInvite(token)
        setStatus('success')
      } catch (error: any) {
        console.error('Failed to accept buddy invite:', error)

        if (error.message?.includes('Invalid or expired')) {
          setStatus('expired')
        } else if (error.message?.includes('already has a buddy')) {
          setStatus('error')
          setErrorMessage('You already have a learning buddy')
        } else if (error.message?.includes('Cannot accept your own')) {
          setStatus('error')
          setErrorMessage('You cannot accept your own invite')
        } else {
          setStatus('error')
          setErrorMessage(error.message || 'Failed to accept invite')
        }
      }
    }

    acceptInvite()
  }, [token, user, isAuthenticated, authLoading])

  const handleContinue = () => {
    navigate('/app/dashboard')
  }

  const handleSignIn = () => {
    navigate('/login')
  }

  const handleGoToSettings = () => {
    navigate('/settings/buddy')
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-600" />
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'auth_required') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-blue-600" />
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>You need to be signed in to accept a buddy invitation</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={handleSignIn} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-blue-600" />
            <CardTitle>Accepting Buddy Invite</CardTitle>
            <CardDescription>Connecting you with your learning partner...</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-600" />
            <p className="text-muted-foreground">
              Please wait while we set up your buddy relationship
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600" />
            <CardTitle className="text-green-900">Buddy Connected!</CardTitle>
            <CardDescription>
              You've successfully connected with your learning buddy
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              You can now see each other's daily learning progress and stay motivated together.
            </p>
            <div className="flex gap-2">
              <Button onClick={handleContinue} className="flex-1">
                Go to Dashboard
              </Button>
              <Button onClick={handleGoToSettings} variant="outline" className="flex-1">
                Manage Buddy
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-orange-600" />
            <CardTitle className="text-orange-900">Invite Expired</CardTitle>
            <CardDescription>
              This buddy invitation has expired or is no longer valid
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Buddy invites expire after 24 hours. Ask your friend to send a new invitation.
            </p>
            <div className="flex gap-2">
              <Button onClick={handleGoToSettings} className="flex-1">
                Find New Buddy
              </Button>
              <Button onClick={handleContinue} variant="outline" className="flex-1">
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-600" />
          <CardTitle className="text-red-900">Unable to Accept Invite</CardTitle>
          <CardDescription>
            Something went wrong while accepting the buddy invitation
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            {errorMessage || 'Please try again or contact support if the problem persists.'}
          </p>
          <div className="flex gap-2">
            <Button onClick={handleGoToSettings} className="flex-1">
              Go to Settings
            </Button>
            <Button onClick={handleContinue} variant="outline" className="flex-1">
              Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
