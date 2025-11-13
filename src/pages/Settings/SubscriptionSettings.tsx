import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, CreditCard, Receipt } from 'lucide-react'

type BillingInterval = 'monthly' | 'yearly'
type PlanType = 'free' | 'monthly' | 'yearly'

export function SubscriptionSettings() {
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('yearly')
  const currentPlan = 'free' as PlanType // This would come from your auth/user context

  const plans = {
    free: {
      name: 'Free',
      price: { monthly: 0, yearly: 0 },
      features: [
        'Unlimited word lists',
        'Daily puzzles',
        'Basic statistics',
      ],
    },
    monthly: {
      name: 'Premium Monthly',
      price: { monthly: 9.99, yearly: 0 },
      features: [
        'All Free features',
        'Advanced statistics',
        'Custom puzzle difficulty',
        'Priority support',
      ],
    },
    yearly: {
      name: 'Premium Yearly',
      price: { monthly: 0, yearly: 99.99 },
      features: [
        'All Monthly features',
        'Save $20 compared to monthly',
        'Early access to new features',
      ],
      savings: '$20',
    },
  }

  return (
    <div className="space-y-6">
      {/* Plans Section */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Choose Your Plan</h2>
          <p className="text-muted-foreground mt-1">Select the plan that works best for you</p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setBillingInterval('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                billingInterval === 'monthly'
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('yearly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                billingInterval === 'yearly'
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Yearly
              <span className="ml-2 text-xs text-green-600">Save $20</span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Free Plan */}
          <Card className={currentPlan === 'free' ? 'border-2 border-primary relative' : ''}>
            {currentPlan === 'free' && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Current Plan</Badge>
            )}
            <CardHeader>
              <CardTitle>{plans.free.name}</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                {plans.free.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              {currentPlan === 'free' ? (
                <Button className="w-full" disabled>
                  Current Plan
                </Button>
              ) : (
                <Button variant="outline" className="w-full">
                  Downgrade
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Premium Monthly */}
          {billingInterval === 'monthly' && (
            <Card className={currentPlan === 'monthly' ? 'border-2 border-primary relative' : ''}>
              {currentPlan === 'monthly' && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Current Plan</Badge>
              )}
              <CardHeader>
                <CardTitle>{plans.monthly.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${plans.monthly.price.monthly}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plans.monthly.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                {currentPlan === 'monthly' ? (
                  <Button className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button className="w-full">
                    {currentPlan === 'free' ? 'Upgrade' : 'Switch to Monthly'}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Premium Yearly */}
          {billingInterval === 'yearly' && (
            <Card
              className={`${
                currentPlan === 'yearly' ? 'border-2 border-primary' : 'border-2 border-primary'
              } relative`}
            >
              {currentPlan === 'yearly' ? (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Current Plan</Badge>
              ) : (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Best Value</Badge>
              )}
              <CardHeader>
                <CardTitle>{plans.yearly.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${plans.yearly.price.yearly}</span>
                  <span className="text-muted-foreground">/year</span>
                </div>
                <p className="text-sm text-green-600 font-medium">
                  Save ${plans.yearly.savings}
                </p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plans.yearly.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                {currentPlan === 'yearly' ? (
                  <Button className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button className="w-full">
                    {currentPlan === 'free' ? 'Upgrade' : 'Switch to Yearly'}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Third card - show opposite plan when one is selected */}
          {billingInterval === 'monthly' && (
            <Card className="opacity-50">
              <CardHeader>
                <CardTitle>{plans.yearly.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${plans.yearly.price.yearly}</span>
                  <span className="text-muted-foreground">/year</span>
                </div>
                <p className="text-sm text-green-600 font-medium">Save ${plans.yearly.savings}</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Switch to yearly billing to see this plan
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setBillingInterval('yearly')}
                >
                  View Yearly Plans
                </Button>
              </CardContent>
            </Card>
          )}

          {billingInterval === 'yearly' && (
            <Card className="opacity-50">
              <CardHeader>
                <CardTitle>{plans.monthly.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${plans.monthly.price.monthly}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Switch to monthly billing to see this plan
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setBillingInterval('monthly')}
                >
                  View Monthly Plans
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>Manage your payment information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <CreditCard className="h-5 w-5" />
            <p>No payment method on file</p>
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
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Receipt className="h-5 w-5" />
            <p>No billing history available</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
