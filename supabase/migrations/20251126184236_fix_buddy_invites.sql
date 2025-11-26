-- Migration: Fix buddy invites system
-- This migration adds proper buddy_invites table and updates functions

-- Create buddy_invites table for storing invite tokens
CREATE TABLE IF NOT EXISTS public.buddy_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  CONSTRAINT valid_expiration CHECK (expires_at > created_at)
);

COMMENT ON TABLE public.buddy_invites IS 'Stores buddy invite tokens with expiration';
COMMENT ON COLUMN public.buddy_invites.inviter_id IS 'User who created the invite';
COMMENT ON COLUMN public.buddy_invites.invite_token IS 'Unique token for the invite link';
COMMENT ON COLUMN public.buddy_invites.expires_at IS 'When the invite expires (24 hours from creation)';
COMMENT ON COLUMN public.buddy_invites.used_by IS 'User who accepted the invite';
COMMENT ON COLUMN public.buddy_invites.is_active IS 'Whether the invite is still valid';

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_buddy_invites_token ON public.buddy_invites(invite_token) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_buddy_invites_inviter ON public.buddy_invites(inviter_id);

-- Enable RLS
ALTER TABLE public.buddy_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for buddy_invites
CREATE POLICY "Users can view their own invites"
  ON public.buddy_invites
  FOR SELECT
  USING (auth.uid() = inviter_id);

CREATE POLICY "Users can create invites"
  ON public.buddy_invites
  FOR INSERT
  WITH CHECK (auth.uid() = inviter_id);

-- Drop and recreate create_buddy_invite function
DROP FUNCTION IF EXISTS public.create_buddy_invite();

CREATE OR REPLACE FUNCTION public.create_buddy_invite()
RETURNS TABLE(invite_token TEXT, expires_at TIMESTAMP WITH TIME ZONE)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_token TEXT;
  v_expires TIMESTAMP WITH TIME ZONE;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if user already has a buddy
  IF EXISTS (SELECT 1 FROM public.buddies WHERE user1_id = v_user_id OR user2_id = v_user_id) THEN
    RAISE EXCEPTION 'User already has a buddy';
  END IF;

  -- Deactivate any existing active invites for this user
  UPDATE public.buddy_invites
  SET is_active = FALSE
  WHERE inviter_id = v_user_id AND is_active = TRUE;

  -- Generate a secure token and expiration (24 hours from now)
  v_token := encode(gen_random_bytes(32), 'hex');
  v_expires := NOW() + INTERVAL '24 hours';

  -- Insert the new invite
  INSERT INTO public.buddy_invites (inviter_id, invite_token, expires_at)
  VALUES (v_user_id, v_token, v_expires);

  RETURN QUERY SELECT v_token, v_expires;
END;
$$;

-- Drop and recreate accept_buddy_invite function
DROP FUNCTION IF EXISTS public.accept_buddy_invite(TEXT);

CREATE OR REPLACE FUNCTION public.accept_buddy_invite(p_invite_token TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_inviter_id UUID;
  v_expires_at TIMESTAMP WITH TIME ZONE;
  v_is_active BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get invite details
  SELECT inviter_id, expires_at, is_active
  INTO v_inviter_id, v_expires_at, v_is_active
  FROM public.buddy_invites
  WHERE invite_token = p_invite_token
  FOR UPDATE; -- Lock the row to prevent race conditions

  -- Validate invite exists
  IF v_inviter_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite token';
  END IF;

  -- Check if invite is still active
  IF NOT v_is_active THEN
    RAISE EXCEPTION 'Invite has already been used or deactivated';
  END IF;

  -- Check if invite has expired
  IF v_expires_at < NOW() THEN
    RAISE EXCEPTION 'Invite has expired';
  END IF;

  -- Check if user is trying to accept their own invite
  IF v_inviter_id = v_user_id THEN
    RAISE EXCEPTION 'Cannot accept your own invite';
  END IF;

  -- Check if either user already has a buddy
  IF EXISTS (SELECT 1 FROM public.buddies WHERE user1_id = v_user_id OR user2_id = v_user_id) THEN
    RAISE EXCEPTION 'You already have a buddy';
  END IF;

  IF EXISTS (SELECT 1 FROM public.buddies WHERE user1_id = v_inviter_id OR user2_id = v_inviter_id) THEN
    RAISE EXCEPTION 'Inviter already has a buddy';
  END IF;

  -- Create the buddy relationship
  INSERT INTO public.buddies (user1_id, user2_id)
  VALUES (v_inviter_id, v_user_id);

  -- Mark invite as used
  UPDATE public.buddy_invites
  SET is_active = FALSE,
      used_by = v_user_id,
      used_at = NOW()
  WHERE invite_token = p_invite_token;

  -- Delete any pending buddy requests between these users
  DELETE FROM public.buddy_requests
  WHERE (requester_id = v_inviter_id AND target_id = v_user_id)
     OR (requester_id = v_user_id AND target_id = v_inviter_id);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_buddy_invite() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.accept_buddy_invite(TEXT) TO authenticated, anon;

-- Add comment
COMMENT ON FUNCTION public.create_buddy_invite() IS 'Creates a new buddy invite token with 24-hour expiration';
COMMENT ON FUNCTION public.accept_buddy_invite(TEXT) IS 'Accepts a buddy invite using the provided token';
