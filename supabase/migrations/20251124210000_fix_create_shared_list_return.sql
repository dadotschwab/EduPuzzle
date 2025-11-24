-- Fix create_shared_list function to return the share_token instead of just the id
-- The frontend expects { share_token: string } but the function was returning just UUID

-- Must drop first because return type is changing
DROP FUNCTION IF EXISTS public.create_shared_list(UUID, TEXT);

CREATE OR REPLACE FUNCTION public.create_shared_list(
  p_list_id UUID,
  p_share_mode TEXT
)
RETURNS TABLE(id UUID, share_token TEXT) AS $$
DECLARE
  v_shared_list_id UUID;
  v_share_token TEXT;
BEGIN
  -- Validate ownership
  IF NOT EXISTS (
    SELECT 1 FROM public.word_lists
    WHERE word_lists.id = p_list_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: not the owner of this list';
  END IF;

  -- Generate the share token first
  v_share_token := public.generate_share_token();

  -- Create shared list entry
  INSERT INTO public.shared_lists (
    original_list_id,
    share_token,
    share_mode,
    created_by
  ) VALUES (
    p_list_id,
    v_share_token,
    p_share_mode,
    auth.uid()
  ) RETURNING shared_lists.id INTO v_shared_list_id;

  -- Mark original list as shared
  UPDATE public.word_lists
  SET is_shared = true, shared_at = now()
  WHERE word_lists.id = p_list_id;

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

  -- Return both the id and share_token
  RETURN QUERY SELECT v_shared_list_id AS id, v_share_token AS share_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Re-grant execute permission
GRANT EXECUTE ON FUNCTION public.create_shared_list(UUID, TEXT) TO authenticated;
