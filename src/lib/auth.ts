import { supabase } from './supabase'

/**
 * Sign up a new user
 */
export async function signUp(email: string, password: string, name: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) throw error

  // Create user record in public.users table with name
  if (data.user) {
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        id: data.user.id,
        email: data.user.email!,
        name: name,
      })

    if (userError) {
      console.error('Error creating user record:', userError)
      throw userError
    }
  }

  return data
}

/**
 * Sign in an existing user
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}
