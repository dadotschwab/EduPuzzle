import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Check,
  CreditCard,
  Receipt,
  Loader2,
  AlertCircle,
  Crown,
  Shield,
  Wifi,
  RefreshCw,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useCheckout } from '@/hooks/useCheckout'
import { useCustomerPortal } from '@/hooks/useCustomerPortal'
import { usePostPayment } from '@/hooks/usePostPayment'

export function SubscriptionSettings() {
  const {
    user,
    loading: isLoading,
    hasAccess,
    isTrial,
    subscriptionStatus,
    subscriptionExpiresAt,
    refreshSubscription: refreshAuthSubscription,
  } = useAuth()
  const { startCheckout, isPending: checkoutPending } = useCheckout()
  const { openPortal, isPending: portalPending } = useCustomerPortal()
  const { refreshSubscription } = usePostPayment()

  // Calculate days remaining
  const daysRemaining = subscriptionExpiresAt
    ? Math.max(
        0,
        Math.ceil((new Date(subscriptionExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      )
    : null

  // Get subscription data from user metadata
  const subscription = user?.subscription
  const isActive = subscriptionStatus === 'active'
  const error = null
  const errorType = null
  const retry = () => {}

  // Refresh subscription status after returning from Stripe checkout
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const sessionId = urlParams.get('session_id')

    if (sessionId) {
      // User returned from successful Stripe checkout
      console.log('Detected Stripe checkout return, refreshing subscription status')
      refreshSubscription()
      refreshAuthSubscription()

      // Clean up URL parameter
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('session_id')
      window.history.replaceState({}, '', newUrl.toString())
    }
  }, [refreshSubscription, refreshAuthSubscription])

  // Only show portal access for paid subscriptions (not trial)
  const canAccessPortal =
    isActive || subscription?.status === 'cancelled' || subscription?.status === 'past_due'

  // Show loading state while fetching subscription data
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-600" />
          <p className="text-muted-foreground">Loading subscription details...</p>
        </div>
      </div>
    )
  }

  // Show error state if subscription fetch failed
  if (error) {
    const getErrorIcon = () => {
      switch (errorType) {
        case 'auth':
          return <Shield className="w-6 h-6" />
        case 'network':
          return <Wifi className="w-6 h-6" />
        case 'rate_limit':
          return <RefreshCw className="w-6 h-6" />
        default:
          return <AlertCircle className="w-6 h-6" />
      }
    }

    const getErrorTitle = () => {
      switch (errorType) {
        case 'auth':
          return 'Authentication Required'
        case 'network':
          return 'Connection Problem'
        case 'rate_limit':
          return 'Too Many Requests'
        case 'server':
          return 'Server Error'
        default:
          return 'Unable to Load Subscription'
      }
    }

    const getErrorMessage = () => {
      switch (errorType) {
        case 'auth':
          return 'Your session may have expired. Please log out and log back in to continue.'
        case 'network':
          return 'Unable to connect to our servers. Please check your internet connection and try again.'
        case 'rate_limit':
          return 'Too many requests. Please wait a moment before trying again.'
        case 'server':
          return 'Our servers are experiencing issues. Please try again in a few minutes.'
        default:
          return "We couldn't load your subscription information. Please try again."
      }
    }

    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <Card>
          <CardHeader>
            <div
              className={`flex items-center gap-2 ${errorType === 'auth' ? 'text-orange-600' : 'text-red-600'}`}
            >
              {getErrorIcon()}
              <CardTitle>{getErrorTitle()}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">{getErrorMessage()}</p>
            <div className="flex gap-2">
              <Button onClick={retry} variant="default">
                Try Again
              </Button>
              {errorType === 'auth' && (
                <Button onClick={() => (window.location.href = '/login')} variant="outline">
                  Log In
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const planFeatures = [
    'Unlimited word lists',
    'Daily puzzles',
    'Basic statistics',
    'Advanced statistics',
    'Custom puzzle difficulty',
    'Priority support',
  ]

  const getStatusBadge = () => {
    if (!subscription) return null

    switch (subscription.status) {
      case 'trial':
        return <Badge variant="secondary">Free Trial</Badge>
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>
      case 'expired':
        return <Badge variant="outline">Expired</Badge>
      case 'past_due':
        return <Badge className="bg-orange-100 text-orange-800">Past Due</Badge>
      default:
        return null
    }
  }

  const getStatusMessage = () => {
    if (!subscription) return ''

    if (subscription.status === 'trial' && daysRemaining !== null) {
      return `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining in trial`
    }

    return ''
  }

  const handleUpgrade = () => {
    startCheckout({
      successUrl: `${window.location.origin}/subscription/success`,
      cancelUrl: `${window.location.origin}/settings/subscription`,
    })
  }

  const handleManageSubscription = () => {
    openPortal({
      returnUrl: `${window.location.origin}/settings/subscription`,
    })
  }

  return (
    <div className="space-y-6">
      {/* Current Subscription Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5" />
                Subscription Status
              </CardTitle>
              <CardDescription>
                {subscription?.status === 'trial' ? '7-day free trial' : 'Premium subscription'}
              </CardDescription>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{hasAccess ? '€6.99' : 'Free'}</p>
                <p className="text-sm text-muted-foreground">{hasAccess ? 'per month' : 'plan'}</p>
              </div>
              {subscription && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{getStatusMessage()}</p>
                  {subscription?.trial_ends_at && subscription.status === 'trial' && (
                    <p className="text-xs text-muted-foreground">
                      Trial ends: {new Date(subscription.trial_ends_at).toLocaleDateString()}
                    </p>
                  )}
                  {subscription?.expires_at && subscription.status === 'active' && (
                    <p className="text-xs text-muted-foreground">
                      Next billing: {new Date(subscription.expires_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {subscription?.status === 'trial' && (
                <Button onClick={handleUpgrade} disabled={checkoutPending} className="flex-1">
                  {checkoutPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Starting Checkout...
                    </>
                  ) : (
                    'Upgrade to Premium'
                  )}
                </Button>
              )}

              {!hasAccess && subscription?.status !== 'trial' && (
                <Button onClick={handleUpgrade} disabled={checkoutPending} className="flex-1">
                  {checkoutPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Starting Checkout...
                    </>
                  ) : (
                    'Subscribe Now'
                  )}
                </Button>
              )}

              {canAccessPortal && (
                <Button
                  variant="outline"
                  onClick={handleManageSubscription}
                  disabled={portalPending}
                  className="flex-1"
                >
                  {portalPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Opening Portal...
                    </>
                  ) : (
                    'Manage Subscription'
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan Features */}
      <Card>
        <CardHeader>
          <CardTitle>Premium Features</CardTitle>
          <CardDescription>
            {hasAccess
              ? 'You have access to all premium features'
              : 'Upgrade to unlock all features'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {planFeatures.map((feature, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Check
                  className={`h-5 w-5 flex-shrink-0 ${hasAccess ? 'text-green-600' : 'text-muted-foreground'}`}
                />
                <span className={hasAccess ? '' : 'text-muted-foreground'}>{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>Manage your payment information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <CreditCard className="h-5 w-5" />
              <div>
                {canAccessPortal ? (
                  <>
                    <p>Payment method managed through Stripe</p>
                    <p className="text-xs">Update your card details in the customer portal</p>
                  </>
                ) : (
                  <p>No payment method on file</p>
                )}
              </div>
            </div>
            {canAccessPortal && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleManageSubscription}
                disabled={portalPending}
              >
                {portalPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Manage'
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>View your past invoices and receipts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Receipt className="h-5 w-5" />
              <div>
                {canAccessPortal ? (
                  <>
                    <p>Invoices and receipts available in Stripe</p>
                    <p className="text-xs">Access your billing history in the customer portal</p>
                  </>
                ) : (
                  <p>No billing history yet</p>
                )}
              </div>
            </div>
            {canAccessPortal && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleManageSubscription}
                disabled={portalPending}
              >
                {portalPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'View History'
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
