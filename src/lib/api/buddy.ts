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
  const { data, error } = await supabase.rpc('get_buddy_status' as any)

  if (error) {
    throw new BuddyApiError(error.message, error.code === 'PGRST116' ? 500 : 400)
  }

  return (data as any)?.[0] || { buddyName: null, hasLearnedToday: false, completionPercentage: 0 }
}

export async function generateBuddyInvite(): Promise<{ inviteToken: string; expiresAt: string }> {
  const { data, error } = await supabase.rpc('create_buddy_invite' as any)

  if (error) {
    throw new BuddyApiError(error.message, error.code === 'PGRST116' ? 500 : 400)
  }

  const result = data as any
  if (!result || !result[0]) {
    throw new BuddyApiError('Failed to generate invite', 500)
  }

  return {
    inviteToken: result[0].invite_token,
    expiresAt: result[0].expires_at,
  }
}

export async function acceptBuddyInvite(inviteToken: string): Promise<void> {
  const { error } = await supabase.rpc('accept_buddy_invite' as any, {
    p_invite_token: inviteToken,
  })

  if (error) {
    throw new BuddyApiError(error.message, error.code === 'PGRST116' ? 500 : 400)
  }
}

export async function removeBuddy(): Promise<void> {
  const { error } = await supabase.rpc('remove_buddy_relationship' as any)

  if (error) {
    throw new BuddyApiError(error.message, error.code === 'PGRST116' ? 500 : 400)
  }
}
