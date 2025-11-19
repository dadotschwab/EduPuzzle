#!/bin/bash

cd "$(dirname "$0")/.."

echo "Updating remaining components for memoization..."

# SubscriptionGate.tsx
cat > src/components/auth/SubscriptionGate.tsx << 'EOF'
/**
 * @fileoverview Subscription access control component
 *
 * Provides subscription-based access gating throughout the application.
 * Shows upgrade prompts for users without premium access.
 *
 * @module components/auth/SubscriptionGate
 */

import { ReactNode, memo, useCallback } from 'react'
import { useSubscription } from '@/hooks/useSubscription'
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
export const SubscriptionGate = memo(function SubscriptionGate({ children, fallback, feature }: SubscriptionGateProps) {
  const { hasAccess, isTrial, daysRemaining, isLoading } = useSubscription()

  // Show loading state while checking subscription
  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking access...</p>
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

  return <UpgradePrompt feature={feature} daysRemaining={daysRemaining} isTrial={isTrial} />
})

interface UpgradePromptProps {
  feature?: string
  daysRemaining: number | null
  isTrial: boolean
}

/**
 * Attractive upgrade prompt component with feature benefits and checkout integration
 */
const UpgradePrompt = memo(function UpgradePrompt({ feature, daysRemaining, isTrial }: UpgradePromptProps) {
  const { startCheckout, isPending } = useCheckout()

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
                €4.99<span className="text-lg font-normal text-muted-foreground">/month</span>
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
})
EOF

# AppLayout.tsx
cat > src/components/layout/AppLayout.tsx << 'EOF'
import { Link } from 'react-router-dom'
import { ProfileMenu } from './ProfileMenu'
import { memo } from 'react'

interface AppLayoutProps {
  children: React.ReactNode
}

export const AppLayout = memo(function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navigation bar */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/app">
                <h1 className="text-xl font-bold text-primary cursor-pointer hover:opacity-80 transition-opacity">
                  EDU-PUZZLE
                </h1>
              </Link>
            </div>
            <ProfileMenu />
          </div>
        </div>
      </div>

      {/* Main content */}
      <main>{children}</main>
    </div>
  )
})
EOF

# PuzzleHelpDialog.tsx
cat > src/components/puzzle/PuzzleHelpDialog.tsx << 'EOF'
/**
 * @fileoverview Help dialog explaining puzzle controls and interactions
 *
 * Provides a comprehensive guide for:
 * - Keyboard navigation
 * - Mouse interactions
 * - Button functions
 *
 * @module components/puzzle/PuzzleHelpDialog
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Keyboard, CheckCircle, Lightbulb, Flag } from 'lucide-react'
import { memo } from 'react'

interface PuzzleHelpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Help dialog that explains all puzzle controls and interactions
 */
export const PuzzleHelpDialog = memo(function PuzzleHelpDialog({ open, onOpenChange }: PuzzleHelpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>How to Solve Puzzles</DialogTitle>
          <DialogDescription>
            Learn all the ways to interact with your crossword puzzle
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Keyboard Controls */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Keyboard className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-lg">Keyboard Controls</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex gap-3 items-center">
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono min-w-[60px] text-center">A-Z</kbd>
                <span className="text-gray-700">Type letters directly. Auto-advances to next cell in the word.</span>
              </div>
              <div className="flex gap-3 items-center">
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono min-w-[60px] text-center flex items-center justify-center gap-1">
                  <span>↑ ↓ ← →</span>
                </kbd>
                <span className="text-gray-700">Navigate between cells in any direction.</span>
              </div>
              <div className="flex gap-3 items-center">
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono min-w-[60px] text-center flex items-center justify-center gap-1">
                  <span>⇥</span> <span className="text-[10px]">Tab</span>
                </kbd>
                <span className="text-gray-700">Jump to the next word in the puzzle.</span>
              </div>
              <div className="flex gap-3 items-center">
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono min-w-[60px] text-center flex items-center justify-center gap-1">
                  <span>↵</span> <span className="text-[10px]">Enter</span>
                </kbd>
                <span className="text-gray-700">Toggle between across/down words (only at cells where both words start).</span>
              </div>
              <div className="flex gap-3 items-center">
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono min-w-[60px] text-center flex items-center justify-center gap-1">
                  <span>⌫</span> <span className="text-[10px]">Back</span>
                </kbd>
                <span className="text-gray-700">Delete current letter or move back in active word if cell is empty.</span>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Buttons</h3>
            <div className="space-y-3 text-sm">
              <div className="flex gap-3 items-center">
                <Button variant="outline" size="sm" className="min-w-[100px] pointer-events-none">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Check
                </Button>
                <span className="text-gray-700">Validate your answers. Correct words show green, incorrect show red.</span>
              </div>
              <div className="flex gap-3 items-center">
                <Button variant="outline" size="sm" className="min-w-[100px] pointer-events-none">
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Hint (3)
                </Button>
                <span className="text-gray-700">Reveal one letter in the selected word. You have 3 hints per puzzle.</span>
              </div>
              <div className="flex gap-3 items-center">
                <Button size="sm" className="min-w-[100px] pointer-events-none">
                  <Flag className="w-4 h-4 mr-2" />
                  Complete
                </Button>
                <span className="text-gray-700">Finish the puzzle and see your results. Updates your learning progress.</span>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-sm mb-2 text-blue-900">Tips for Success</h3>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Selected word cells are highlighted in light blue</li>
              <li>• Currently focused cell has a blue ring</li>
              <li>• Clues with checkmarks are correct</li>
              <li>• Don't worry about mistakes - you can always check and revise</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
})
EOF

echo "✅ All remaining components updated successfully!"
