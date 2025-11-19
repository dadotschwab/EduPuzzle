import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSubscription } from '@/hooks/useSubscription'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, ArrowRight, Home } from 'lucide-react'

export function SubscriptionSuccess() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { refetch: refetchSubscription } = useSubscription()

  // Get session_id from URL params (Stripe redirects with this)
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    // Refetch subscription status when component mounts to get updated subscription info
    refetchSubscription()
  }, [refetchSubscription])

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className="text-center">
          <CardHeader className="pb-6">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Welcome to Premium!</CardTitle>
            <CardDescription className="text-lg">
              Your subscription has been activated successfully. You now have access to all premium
              features.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="text-left space-y-3">
              <h3 className="font-semibold text-lg">
                What's included in your premium subscription:
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  Advanced statistics and progress tracking
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  Custom puzzle difficulty settings
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  Priority customer support
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  Early access to new features
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button onClick={() => navigate('/app/dashboard')} className="flex-1" size="lg">
                <Home className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Button>
              <Button
                onClick={() => navigate('/app/todays-puzzles')}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                Start Learning
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {sessionId && (
              <p className="text-xs text-muted-foreground pt-4 border-t">Session ID: {sessionId}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
