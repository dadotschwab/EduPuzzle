import { useNavigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { XCircle, ArrowRight, Home, CreditCard } from 'lucide-react'

export function SubscriptionCancel() {
  const navigate = useNavigate()

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className="text-center">
          <CardHeader className="pb-6">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
              <XCircle className="h-8 w-8 text-orange-600" />
            </div>
            <CardTitle className="text-2xl">Payment Cancelled</CardTitle>
            <CardDescription className="text-lg">
              Your subscription wasn't completed. No charges have been made to your account.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="text-left space-y-3">
              <h3 className="font-semibold text-lg">Don't worry, you can still:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-muted flex-shrink-0" />
                  Continue using all free features
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-muted flex-shrink-0" />
                  Create unlimited word lists
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-muted flex-shrink-0" />
                  Access daily crossword puzzles
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-muted flex-shrink-0" />
                  View basic learning statistics
                </li>
              </ul>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 text-left">
              <h4 className="font-medium mb-2">Ready to upgrade?</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Premium features include advanced statistics, custom difficulty settings, and
                priority support.
              </p>
              <Button
                onClick={() => navigate('/settings/subscription')}
                size="sm"
                className="w-full sm:w-auto"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                View Premium Plans
              </Button>
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
                Continue Learning
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
