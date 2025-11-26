/**
 * @fileoverview Subscription access control component
 *
 * Provides subscription-based access gating throughout the application.
 * Shows upgrade prompts for users without premium access.
 *
 * @module components/auth/SubscriptionGate
 */

import { ReactNode, memo, useCallback, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCheckout } from '@/hooks/useCheckout'
import { Crown, Zap, BookOpen, Target, CheckCircle } from 'lucide-react'

interface SubscriptionGateProps {
  children: ReactNode
  fallback?: ReactNode
  feature?: string
}

/**
 * Wrapper component that gates premium features based on subscription status
 *
 * Shows children if user has access, otherwise shows upgrade prompt.
 * Handles trial users, active subscribers, and expired users.
 */
export const SubscriptionGate = memo(function SubscriptionGate({
  children,
  fallback,
  feature,
}: SubscriptionGateProps) {
  const {
    hasAccess,
    isTrial,
    loading,
    subscriptionExpiresAt,
    user,
    subscriptionStatus,
    refreshSubscription,
  } = useAuth()

  // Debug logging
  console.log('[SubscriptionGate] Access check:', {
    hasAccess,
    isTrial,
    loading,
    subscriptionStatus,
    subscriptionExpiresAt,
    subscriptionMeta: user?.subscription,
  })

  // Only show loading during auth check (much faster now)
  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // User has access - show the premium content
  if (hasAccess) {
    return <>{children}</>
  }

  // User doesn't have access - show upgrade prompt or custom fallback
  if (fallback) {
    return <>{fallback}</>
  }

  // Calculate days remaining
  const daysRemaining = subscriptionExpiresAt
    ? Math.max(
        0,
        Math.ceil((new Date(subscriptionExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      )
    : null

  return (
    <UpgradePrompt
      feature={feature}
      daysRemaining={daysRemaining}
      isTrial={isTrial}
      refreshSubscription={refreshSubscription}
    />
  )
})

interface UpgradePromptProps {
  feature?: string
  daysRemaining: number | null
  isTrial: boolean
  refreshSubscription: () => Promise<void>
}

/**
 * Attractive upgrade prompt component with feature benefits and checkout integration
 */
const UpgradePrompt = memo(function UpgradePrompt({
  feature,
  daysRemaining,
  isTrial,
  refreshSubscription,
}: UpgradePromptProps) {
  const { startCheckout, isPending } = useCheckout()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshSubscription()
      window.location.reload() // Reload to get new JWT
    } catch (error) {
      console.error('Failed to refresh subscription:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleUpgrade = useCallback(() => {
    startCheckout({
      successUrl: window.location.href,
      cancelUrl: window.location.href,
    })
  }, [startCheckout])

  const premiumFeatures = [
    {
      icon: <BookOpen className="w-5 h-5" />,
      title: 'Unlimited Word Lists',
      description: 'Create and manage unlimited vocabulary lists',
    },
    {
      icon: <Target className="w-5 h-5" />,
      title: 'Spaced Repetition',
      description: 'Smart SRS system for optimal learning',
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: 'Advanced Puzzles',
      description: 'Access to all crossword puzzle features',
    },
    {
      icon: <CheckCircle className="w-5 h-5" />,
      title: 'Progress Tracking',
      description: 'Detailed statistics and learning insights',
    },
  ]

  return (
    <div className="min-h-[600px] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Trial Status Banner */}
        {isTrial && daysRemaining !== null && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Crown className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">
                      {daysRemaining > 0
                        ? `${daysRemaining} days left in your free trial`
                        : 'Your trial has ended'}
                    </p>
                    <p className="text-sm text-blue-700">
                      Upgrade now to continue learning without limits
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Trial
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Feature-specific message */}
        {feature && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Crown className="w-5 h-5 text-amber-500" />
                <span>Premium Feature</span>
              </CardTitle>
              <CardDescription>{feature} is available with EduPuzzle Premium</CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Main Upgrade Card */}
        <Card className="border-2 border-primary/20">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Crown className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Unlock EduPuzzle Premium</CardTitle>
            <CardDescription className="text-lg">
              Take your language learning to the next level with advanced features
            </CardDescription>
            <div className="pt-4">
              <div className="text-3xl font-bold">
                €6.99<span className="text-lg font-normal text-muted-foreground">/month</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                7-day free trial • Cancel anytime
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Feature List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {premiumFeatures.map((item, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{item.title}</h4>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <Button onClick={handleUpgrade} disabled={isPending} className="w-full" size="lg">
              {isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Starting Trial...
                </>
              ) : (
                <>
                  <Crown className="w-4 h-4 mr-2" />
                  Start Free 7-Day Trial
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              No credit card required • Upgrade or cancel anytime
            </p>

            {/* Debug: Refresh Subscription Button */}
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="w-full"
              >
                {isRefreshing ? 'Refreshing...' : 'Refresh Subscription Status'}
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-2">
                Having issues? Click to refresh your subscription status
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
})
