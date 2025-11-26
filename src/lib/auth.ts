import { supabase } from './supabase'

/**
 * Sign up a new user
 */
export async function signUp(email: string, password: string, name: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name, // Store name in JWT user_metadata
      },
    },
  })

  if (error) throw error

  // Create user record in public.users table with name and trial
  if (data.user) {
    // Calculate trial end date (7 days from now)
    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + 7)

    const { error: userError } = await supabase.from('users').upsert({
      id: data.user.id,
      email: data.user.email!,
      name: name,
      subscription_status: 'trial',
      trial_end_date: trialEndDate.toISOString(),
    })

    if (userError) {
      console.error('Error creating user record:', userError)
      throw userError
    }

    // Call Edge Function to set JWT metadata
    try {
      await supabase.functions.invoke('update-user-subscription', {
        body: { userId: data.user.id },
      })
    } catch (metaError) {
      console.error('Error updating subscription metadata:', metaError)
      // Don't throw - user is created, metadata can be updated on next login
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
