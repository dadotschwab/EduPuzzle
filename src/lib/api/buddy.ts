import { supabase } from '@/lib/supabase'

export interface BuddyData {
  buddyName: string | null
  hasLearnedToday: boolean
  completionPercentage: number
  inviteToken?: string
  inviteExpiresAt?: string
}

export class BuddyApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'BuddyApiError'
  }
}

export async function getBuddyStatus(): Promise<BuddyData> {
  const { data, error } = await supabase.rpc('get_buddy_status')

  if (error) {
    throw new BuddyApiError(error.message, error.code === 'PGRST116' ? 500 : 400)
  }

  const rawData = Array.isArray(data) ? data[0] : null
  if (!rawData) {
    return { buddyName: null, hasLearnedToday: false, completionPercentage: 0 }
  }

  return {
    buddyName: rawData.buddy_name,
    hasLearnedToday: rawData.has_learned_today,
    completionPercentage: rawData.completion_percentage,
  }
}

export async function generateBuddyInvite(): Promise<{ inviteToken: string; expiresAt: string }> {
  const { data, error } = await supabase.rpc('create_buddy_invite')

  if (error) {
    throw new BuddyApiError(error.message, error.code === 'PGRST116' ? 500 : 400)
  }

  if (!data || data.length === 0) {
    throw new BuddyApiError('Failed to generate invite')
  }

  return {
    inviteToken: data[0].invite_token,
    expiresAt: data[0].expires_at,
  }
}

export async function acceptBuddyInvite(inviteToken: string): Promise<void> {
  const { error } = await supabase.rpc('accept_buddy_invite', {
    p_invite_token: inviteToken,
  })

  if (error) {
    throw new BuddyApiError(error.message, error.code === 'PGRST116' ? 500 : 400)
  }
}

export async function removeBuddy(): Promise<void> {
  const { error } = await supabase.rpc('remove_buddy_relationship')

  if (error) {
    throw new BuddyApiError(error.message, error.code === 'PGRST116' ? 500 : 400)
  }
}
