import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, CreditCard, Receipt } from 'lucide-react'

export function SubscriptionSettings() {
  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Manage your subscription and billing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Free Plan</h3>
              <p className="text-sm text-muted-foreground">Currently active</p>
            </div>
            <Badge>Free</Badge>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-600" />
              <span>Unlimited word lists</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-600" />
              <span>Daily puzzles</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-600" />
              <span>Basic statistics</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Upgrade to Premium</CardTitle>
          <CardDescription>Unlock advanced features and remove limitations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Monthly Plan */}
            <div className="border rounded-lg p-4 space-y-4">
              <div>
                <h4 className="font-semibold">Monthly</h4>
                <p className="text-2xl font-bold mt-2">
                  $9.99<span className="text-sm font-normal text-muted-foreground">/month</span>
                </p>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  All Free features
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Advanced statistics
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Custom puzzle difficulty
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Priority support
                </li>
              </ul>
              <Button className="w-full">Upgrade to Monthly</Button>
            </div>

            {/* Yearly Plan */}
            <div className="border-2 border-primary rounded-lg p-4 space-y-4 relative">
              <Badge className="absolute -top-3 right-4">Best Value</Badge>
              <div>
                <h4 className="font-semibold">Yearly</h4>
                <p className="text-2xl font-bold mt-2">
                  $99.99<span className="text-sm font-normal text-muted-foreground">/year</span>
                </p>
                <p className="text-sm text-green-600">Save $20</p>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  All Monthly features
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  2 months free
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Early access to new features
                </li>
              </ul>
              <Button className="w-full">Upgrade to Yearly</Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
