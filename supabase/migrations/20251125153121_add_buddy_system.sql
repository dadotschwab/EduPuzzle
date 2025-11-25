-- Migration: Add buddy system tables
-- File: supabase/migrations/20251125153121_add_buddy_system.sql

-- Table: buddy_relationships
-- Purpose: Store 1:1 bidirectional buddy relationships between users
CREATE TABLE public.buddy_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  -- Ensure 1:1 relationships and prevent self-buddying
  CHECK (user1_id < user2_id), -- Canonical ordering to prevent duplicates
  UNIQUE(user1_id, user2_id)
);

-- Table: buddy_invites
-- Purpose: Store invite tokens for buddy relationship creation
CREATE TABLE public.buddy_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ DEFAULT now(),
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Track who used it
  used_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_buddy_relationships_user1 ON public.buddy_relationships(user1_id);
CREATE INDEX idx_buddy_relationships_user2 ON public.buddy_relationships(user2_id);
CREATE INDEX idx_buddy_invites_token ON public.buddy_invites(invite_token) WHERE expires_at > now();
CREATE INDEX idx_buddy_invites_inviter ON public.buddy_invites(inviter_id);
CREATE INDEX idx_buddy_invites_expires ON public.buddy_invites(expires_at);

-- Comments for clarity
COMMENT ON TABLE public.buddy_relationships IS '1:1 bidirectional buddy relationships for accountability';
COMMENT ON COLUMN public.buddy_relationships.user1_id IS 'First user in canonical ordering (user1_id < user2_id)';
COMMENT ON COLUMN public.buddy_relationships.user2_id IS 'Second user in canonical ordering';
COMMENT ON TABLE public.buddy_invites IS 'Invite tokens for establishing buddy relationships';
COMMENT ON COLUMN public.buddy_invites.invite_token IS 'URL-safe token for invite links';
COMMENT ON COLUMN public.buddy_invites.expires_at IS '24-hour expiry for security';

-- Enable RLS on both tables
ALTER TABLE public.buddy_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buddy_invites ENABLE ROW LEVEL SECURITY;

-- Buddy Relationships: Users can only see relationships they're part of
CREATE POLICY "users_view_own_buddy_relationships"
  ON public.buddy_relationships
  FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Users can delete their own buddy relationships (unilateral disconnect)
CREATE POLICY "users_delete_own_buddy_relationships"
  ON public.buddy_relationships
  FOR DELETE
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Buddy Invites: Users can only see/manage their own invites
CREATE POLICY "users_manage_own_invites"
  ON public.buddy_invites
  FOR ALL
  USING (auth.uid() = inviter_id);

-- Service role can manage all invites (for cleanup cron jobs)
CREATE POLICY "service_role_manage_invites"
  ON public.buddy_invites
  FOR ALL
  USING (auth.role() = 'service_role');

-- Function: generate_buddy_invite_token
-- Purpose: Generate a secure, unique invite token for buddy invitations
CREATE OR REPLACE FUNCTION public.generate_buddy_invite_token()
RETURNS TEXT AS $
DECLARE
  token TEXT;
  exists_count INTEGER;
BEGIN
  -- Generate URL-safe token (22 chars = 128 bits of entropy)
  LOOP
    token := encode(gen_random_bytes(16), 'base64url');
    -- Check uniqueness among active invites
    SELECT COUNT(*) INTO exists_count
    FROM public.buddy_invites
    WHERE invite_token = token AND expires_at > now();

    EXIT WHEN exists_count = 0;
  END LOOP;

  RETURN token;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: create_buddy_invite
-- Purpose: Create a new buddy invite for the authenticated user
CREATE OR REPLACE FUNCTION public.create_buddy_invite()
RETURNS TABLE (
  invite_token TEXT,
  expires_at TIMESTAMPTZ
) AS $
DECLARE
  user_id UUID := auth.uid();
  token TEXT;
BEGIN
  -- Check if user already has a buddy
  IF EXISTS (
    SELECT 1 FROM public.buddy_relationships
    WHERE user1_id = user_id OR user2_id = user_id
  ) THEN
    RAISE EXCEPTION 'User already has a buddy relationship';
  END IF;

  -- Generate unique token
  token := public.generate_buddy_invite_token();

  -- Insert invite
  INSERT INTO public.buddy_invites (inviter_id, invite_token)
  VALUES (user_id, token);

  -- Return token and expiry
  RETURN QUERY SELECT token, (now() + INTERVAL '24 hours')::TIMESTAMPTZ;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: accept_buddy_invite
-- Purpose: Accept a buddy invite and create the relationship
CREATE OR REPLACE FUNCTION public.accept_buddy_invite(
  p_invite_token TEXT
)
RETURNS BOOLEAN AS $
DECLARE
  user_id UUID := auth.uid();
  inviter_id UUID;
  invite_record RECORD;
BEGIN
  -- Check if user already has a buddy
  IF EXISTS (
    SELECT 1 FROM public.buddy_relationships
    WHERE user1_id = user_id OR user2_id = user_id
  ) THEN
    RAISE EXCEPTION 'User already has a buddy relationship';
  END IF;

  -- Find and validate invite
  SELECT * INTO invite_record
  FROM public.buddy_invites
  WHERE invite_token = p_invite_token
    AND expires_at > now()
    AND used_by IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invite token';
  END IF;

  -- Prevent self-buddying
  IF invite_record.inviter_id = user_id THEN
    RAISE EXCEPTION 'Cannot accept your own invite';
  END IF;

  -- Check if inviter still doesn't have a buddy
  IF EXISTS (
    SELECT 1 FROM public.buddy_relationships
    WHERE user1_id = invite_record.inviter_id OR user2_id = invite_record.inviter_id
  ) THEN
    RAISE EXCEPTION 'Inviter already has a buddy relationship';
  END IF;

  -- Create relationship (canonical ordering)
  INSERT INTO public.buddy_relationships (user1_id, user2_id)
  VALUES (
    LEAST(invite_record.inviter_id, user_id),
    GREATEST(invite_record.inviter_id, user_id)
  );

  -- Mark invite as used
  UPDATE public.buddy_invites
  SET used_by = user_id, used_at = now()
  WHERE id = invite_record.id;

  RETURN true;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: get_buddy_status
-- Purpose: Get buddy status for the authenticated user
CREATE OR REPLACE FUNCTION public.get_buddy_status()
RETURNS TABLE (
  buddy_name TEXT,
  has_learned_today BOOLEAN,
  completion_percentage INTEGER
) AS $
DECLARE
  user_id UUID := auth.uid();
  buddy_id UUID;
  today_date DATE := CURRENT_DATE;
BEGIN
  -- Find buddy
  SELECT
    CASE WHEN user1_id = user_id THEN user2_id ELSE user1_id END
  INTO buddy_id
  FROM public.buddy_relationships
  WHERE user1_id = user_id OR user2_id = user_id;

  -- Return empty if no buddy
  IF buddy_id IS NULL THEN
    RETURN;
  END IF;

  -- Get buddy's learning status for today
  RETURN QUERY
  SELECT
    COALESCE(u.raw_user_meta_data->>'full_name', u.email) as buddy_name,
    COALESCE(dc.streak_maintained, false) as has_learned_today,
    CASE
      WHEN dc.due_words_count > 0 THEN
        LEAST(100, (dc.words_completed::FLOAT / dc.due_words_count::FLOAT * 100)::INTEGER)
      ELSE 0
    END as completion_percentage
  FROM auth.users u
  LEFT JOIN public.daily_completions dc ON dc.user_id = buddy_id AND dc.completion_date = today_date
  WHERE u.id = buddy_id;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: remove_buddy_relationship
-- Purpose: Remove the buddy relationship for the authenticated user
CREATE OR REPLACE FUNCTION public.remove_buddy_relationship()
RETURNS BOOLEAN AS $
DECLARE
  user_id UUID := auth.uid();
BEGIN
  -- Delete relationship (works for both sides due to RLS)
  DELETE FROM public.buddy_relationships
  WHERE user1_id = user_id OR user2_id = user_id;

  RETURN FOUND;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_buddy_invite() TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_buddy_invite(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_buddy_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_buddy_relationship() TO authenticated;

-- Enable Realtime for buddy_relationships table
-- Purpose: Instant updates when buddy relationships change (connect/disconnect)
ALTER PUBLICATION supabase_realtime ADD TABLE public.buddy_relationships;

-- Note: Client filters to own user_id, RLS ensures security
-- Realtime events will trigger on relationship creation/deletion for instant UI updates