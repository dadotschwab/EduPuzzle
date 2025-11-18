import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signUp } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AuthForm } from './AuthForm'

export function SignupForm() {
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const handleSignup = async (email: string, password: string) => {
    await signUp(email, password)
    setSuccess(true)
    // Wait a moment then redirect
    setTimeout(() => navigate('/app'), 2000)
  }

  // Show success card after signup
  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We've sent you a confirmation email. Please check your inbox and click the link to
            verify your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate('/login')} className="w-full">
            Go to Login
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <AuthForm
      mode="signup"
      onSubmit={handleSignup}
      title="Create Account"
      description="Start your 7-day free trial with EDU-PUZZLE"
      submitLabel="Create Account"
      loadingLabel="Creating account..."
      alternateLink={{
        text: "Already have an account?",
        linkText: "Sign in",
        to: "/login"
      }}
    />
  )
}
