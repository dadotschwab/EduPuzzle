-- Add word list sharing functionality (Migration for existing database)
-- This migration adds sharing functionality to an existing database
-- where the users table already exists

-- Table: shared_lists
-- Purpose: Tracks shared word lists with their access tokens and sharing modes
CREATE TABLE public.shared_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_list_id UUID NOT NULL REFERENCES public.word_lists(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE NOT NULL,
  share_mode TEXT NOT NULL CHECK (share_mode IN ('copy', 'collaborative')),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ, -- Optional expiration for temporary shares
  is_active BOOLEAN DEFAULT true,
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ
);

-- Table: list_collaborators
-- Purpose: Tracks users who have joined collaborative shared lists
CREATE TABLE public.list_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_list_id UUID NOT NULL REFERENCES public.shared_lists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  UNIQUE(shared_list_id, user_id)
);

-- Add sharing fields to existing word_lists table (if not already added)
DO $$
BEGIN
  -- Check if is_shared column already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'word_lists' 
    AND column_name = 'is_shared'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.word_lists ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT false;
  END IF;

  -- Check if shared_at column already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'word_lists' 
    AND column_name = 'shared_at'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.word_lists ADD COLUMN IF NOT EXISTS shared_at TIMESTAMPTZ;
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_shared_lists_token ON public.shared_lists(share_token) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_shared_lists_original ON public.shared_lists(original_list_id);
CREATE INDEX IF NOT EXISTS idx_list_collaborators_shared ON public.list_collaborators(shared_list_id);
CREATE INDEX IF NOT EXISTS idx_list_collaborators_user ON public.list_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_word_lists_shared ON public.word_lists(is_shared) WHERE is_shared = true;

-- Comments for maintainability
COMMENT ON TABLE public.shared_lists IS 'Tracks shared word lists with access tokens and sharing modes';
COMMENT ON COLUMN public.shared_lists.share_mode IS 'copy: one-time import, collaborative: real-time sync';
COMMENT ON TABLE public.list_collaborators IS 'Users who have joined collaborative shared lists';
COMMENT ON COLUMN public.word_lists.is_shared IS 'Whether this list has been shared publicly';
COMMENT ON COLUMN public.word_lists.shared_at IS 'When this list was first shared';

-- Enable RLS on new tables
ALTER TABLE public.shared_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_collaborators ENABLE ROW LEVEL SECURITY;

-- Shared Lists Policies
-- Owners can manage their shared lists
DROP POLICY IF EXISTS "owners_manage_shared_lists";
CREATE POLICY "owners_manage_shared_lists"
  ON public.shared_lists
  FOR ALL
  USING (auth.uid() = created_by);

-- Anyone can view active shared lists (for token validation)
DROP POLICY IF EXISTS "anyone_view_active_shared_lists";
CREATE POLICY "anyone_view_active_shared_lists"
  ON public.shared_lists
  FOR SELECT
  USING (is_active = true);

-- List Collaborators Policies
-- Owners can manage collaborators on their lists
DROP POLICY IF EXISTS "owners_manage_collaborators";
CREATE POLICY "owners_manage_collaborators"
  ON public.list_collaborators
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.shared_lists
      WHERE shared_lists.id = list_collaborators.shared_list_id
      AND shared_lists.created_by = auth.uid()
    )
  );

-- Collaborators can view their own memberships
DROP POLICY IF EXISTS "collaborators_view_own_membership";
CREATE POLICY "collaborators_view_own_membership"
  ON public.list_collaborators
  FOR SELECT
  USING (auth.uid() = user_id);

-- Words table: Extend existing policies for shared access
-- Collaborators can view words in shared collaborative lists
DROP POLICY IF EXISTS "collaborators_view_shared_words";
CREATE POLICY "collaborators_view_shared_words"
  ON public.words
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.word_lists wl
      JOIN public.shared_lists sl ON sl.original_list_id = wl.id
      JOIN public.list_collaborators lc ON lc.shared_list_id = sl.id
      WHERE wl.id = words.list_id
      AND sl.share_mode = 'collaborative'
      AND sl.is_active = true
      AND lc.user_id = auth.uid()
    )
  );

-- Collaborators can modify words in shared collaborative lists
DROP POLICY IF EXISTS "collaborators_modify_shared_words";
CREATE POLICY "collaborators_modify_shared_words"
  ON public.words
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.word_lists wl
      JOIN public.shared_lists sl ON sl.original_list_id = wl.id
      JOIN public.list_collaborators lc ON lc.shared_list_id = sl.id
      WHERE wl.id = words.list_id
      AND sl.share_mode = 'collaborative'
      AND sl.is_active = true
      AND lc.user_id = auth.uid()
      AND lc.role IN ('owner', 'member')
    )
  );

-- Function: generate_share_token
-- Purpose: Generate a unique, secure share token for list sharing
CREATE OR REPLACE FUNCTION public.generate_share_token()
RETURNS TEXT AS $$
DECLARE
  token TEXT;
  exists_count INTEGER;
BEGIN
  -- Generate a URL-safe token (22 chars = 128 bits of entropy)
  LOOP
    token := encode(gen_random_bytes(16), 'base64url');
    -- Check uniqueness
    SELECT COUNT(*) INTO exists_count
    FROM public.shared_lists
    WHERE share_token = token;

    EXIT WHEN exists_count = 0;
  END LOOP;

  RETURN token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: create_shared_list
-- Purpose: Create a new shared list entry with token generation
CREATE OR REPLACE FUNCTION public.create_shared_list(
  p_list_id UUID,
  p_share_mode TEXT
)
RETURNS UUID AS $$
DECLARE
  v_shared_list_id UUID;
BEGIN
  -- Validate ownership
  IF NOT EXISTS (
    SELECT 1 FROM public.word_lists
    WHERE id = p_list_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: not the owner of this list';
  END IF;

  -- Create shared list entry
  INSERT INTO public.shared_lists (
    original_list_id,
    share_token,
    share_mode,
    created_by
  ) VALUES (
    p_list_id,
    generate_share_token(),
    p_share_mode,
    auth.uid()
  ) RETURNING id INTO v_shared_list_id;

  -- Mark original list as shared
  UPDATE public.word_lists
  SET is_shared = true, shared_at = now()
  WHERE id = p_list_id;

  -- If collaborative, add owner as collaborator
  IF p_share_mode = 'collaborative' THEN
    INSERT INTO public.list_collaborators (
      shared_list_id,
      user_id,
      role
    ) VALUES (
      v_shared_list_id,
      auth.uid(),
      'owner'
    );
  END IF;

  RETURN v_shared_list_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: import_shared_list_copy
-- Purpose: Import a shared list as a personal copy
CREATE OR REPLACE FUNCTION public.import_shared_list_copy(
  p_share_token TEXT
)
RETURNS UUID AS $$
DECLARE
  v_original_list_id UUID;
  v_new_list_id UUID;
  v_user_id UUID := auth.uid();
BEGIN
  -- Validate token and get original list
  SELECT original_list_id INTO v_original_list_id
  FROM public.shared_lists
  WHERE share_token = p_share_token
  AND is_active = true
  AND (expires_at IS NULL OR expires_at > now());

  IF v_original_list_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired share token';
  END IF;

  -- Create new list copy
  INSERT INTO public.word_lists (
    user_id,
    name,
    source_language,
    target_language
  )
  SELECT
    v_user_id,
    name || ' (Shared Copy)',
    source_language,
    target_language
  FROM public.word_lists
  WHERE id = v_original_list_id
  RETURNING id INTO v_new_list_id;

  -- Copy all words
  INSERT INTO public.words (
    list_id,
    term,
    translation,
    definition,
    example_sentence
  )
  SELECT
    v_new_list_id,
    term,
    translation,
    definition,
    example_sentence
  FROM public.words
  WHERE list_id = v_original_list_id;

  -- Copy word progress for the importing user
  INSERT INTO public.word_progress (
    user_id,
    word_id,
    stage,
    ease_factor,
    interval_days,
    next_review_date
  )
  SELECT
    v_user_id,
    w.id,
    0, 2.5, 0, CURRENT_DATE
  FROM public.words w
  WHERE w.list_id = v_new_list_id;

  -- Update access count
  UPDATE public.shared_lists
  SET access_count = access_count + 1,
      last_accessed_at = now()
  WHERE share_token = p_share_token;

  RETURN v_new_list_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: join_collaborative_list
-- Purpose: Join a collaborative shared list
CREATE OR REPLACE FUNCTION public.join_collaborative_list(
  p_share_token TEXT
)
RETURNS UUID AS $$
DECLARE
  v_shared_list_id UUID;
  v_user_id UUID := auth.uid();
BEGIN
  -- Get shared list ID and validate
  SELECT id INTO v_shared_list_id
  FROM public.shared_lists
  WHERE share_token = p_share_token
  AND share_mode = 'collaborative'
  AND is_active = true
  AND (expires_at IS NULL OR expires_at > now());

  IF v_shared_list_id IS NULL THEN
    RAISE EXCEPTION 'Invalid collaborative share token';
  END IF;

  -- Check if already a collaborator
  IF EXISTS (
    SELECT 1 FROM public.list_collaborators
    WHERE shared_list_id = v_shared_list_id
    AND user_id = v_user_id
  ) THEN
    RETURN v_shared_list_id;
  END IF;

  -- Add as collaborator
  INSERT INTO public.list_collaborators (
    shared_list_id,
    user_id,
    role
  ) VALUES (
    v_shared_list_id,
    v_user_id,
    'member'
  );

  -- Update access count
  UPDATE public.shared_lists
  SET access_count = access_count + 1,
      last_accessed_at = now()
  WHERE id = v_shared_list_id;

  RETURN v_shared_list_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.generate_share_token() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_shared_list(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.import_shared_list_copy(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_collaborative_list(TEXT) TO authenticated;

-- Enable Realtime for collaborative word lists
-- Purpose: Real-time synchronization when collaborators modify shared words
ALTER PUBLICATION supabase_realtime ADD TABLE public.words;

-- Optional: Enable Realtime for list_collaborators to show online collaborators
ALTER PUBLICATION supabase_realtime ADD TABLE public.list_collaborators;