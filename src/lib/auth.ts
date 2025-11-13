import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'

export interface AuthUser extends User {
  subscriptionStatus?: 'trial' | 'active' | 'cancelled' | 'expired'
  trialEndDate?: string
}

/**
 * Sign up a new user
 */
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) throw error
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

/**
 * Sign out the current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/**
 * Get the current session
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

/**
 * Get the current user
 */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user
}

/**
 * Reset password for a user
 */
export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })

  if (error) throw error
  return data
}

/**
 * Update user password
 */
export async function updatePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) throw error
  return data
}

/**
 * Get user's subscription status
 */
export async function getUserSubscriptionStatus() {
  const user = await getCurrentUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('users')
    .select('subscription_status, trial_end_date, subscription_end_date')
    .eq('id', user.id)
    .single()

  if (error) throw error
  return data as any
}

/**
 * Check if user's trial or subscription is active
 */
export async function isSubscriptionActive() {
  const status = await getUserSubscriptionStatus()
  if (!status) return false

  const now = new Date()

  // Check if trial is still active
  if (status.subscription_status === 'trial') {
    const trialEnd = new Date(status.trial_end_date)
    return now < trialEnd
  }

  // Check if subscription is active
  if (status.subscription_status === 'active') {
    if (!status.subscription_end_date) return true
    const subEnd = new Date(status.subscription_end_date)
    return now < subEnd
  }

  return false
}
