/**
 * @fileoverview Unified authentication form component
 *
 * Handles both login and signup forms with shared UI and logic
 *
 * @module components/auth/AuthForm
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface AuthFormProps {
  mode: 'login' | 'signup'
  onSubmit: (email: string, password: string) => Promise<void>
  title: string
  description: string
  submitLabel: string
  loadingLabel: string
  alternateLink: {
    text: string
    linkText: string
    to: string
  }
}

/**
 * Unified authentication form supporting login and signup modes
 */
export function AuthForm({
  mode,
  onSubmit,
  title,
  description,
  submitLabel,
  loadingLabel,
  alternateLink,
}: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate password confirmation for signup
    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters')
        return
      }
    }

    setLoading(true)
    try {
      await onSubmit(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${mode === 'login' ? 'sign in' : 'create account'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength={mode === 'signup' ? 6 : undefined}
            />
            {mode === 'signup' && (
              <p className="text-xs text-muted-foreground">Must be at least 6 characters</p>
            )}
          </div>

          {/* Confirm Password Field (Signup only) */}
          {mode === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? loadingLabel : submitLabel}
          </Button>

          {/* Alternate Action Link */}
          <div className="text-center text-sm text-muted-foreground">
            {alternateLink.text}{' '}
            <Link to={alternateLink.to} className="text-primary hover:underline">
              {alternateLink.linkText}
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
