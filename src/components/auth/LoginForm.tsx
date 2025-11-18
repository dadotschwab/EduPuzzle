import { useNavigate } from 'react-router-dom'
import { signIn } from '@/lib/auth'
import { AuthForm } from './AuthForm'

export function LoginForm() {
  const navigate = useNavigate()

  const handleLogin = async (email: string, password: string) => {
    await signIn(email, password)
    navigate('/app')
  }

  return (
    <AuthForm
      mode="login"
      onSubmit={handleLogin}
      title="Welcome Back"
      description="Sign in to your EDU-PUZZLE account"
      submitLabel="Sign In"
      loadingLabel="Signing in..."
      alternateLink={{
        text: "Don't have an account?",
        linkText: "Sign up",
        to: "/signup"
      }}
    />
  )
}
