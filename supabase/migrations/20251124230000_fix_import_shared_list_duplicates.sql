-- Fix import_shared_list_copy to handle duplicate word_progress records
-- Uses ON CONFLICT DO NOTHING to skip duplicates gracefully

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

  -- Create word progress for the importing user (skip if already exists)
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
  WHERE w.list_id = v_new_list_id
  ON CONFLICT (user_id, word_id) DO NOTHING;

  -- Update access count
  UPDATE public.shared_lists
  SET access_count = access_count + 1,
      last_accessed_at = now()
  WHERE share_token = p_share_token;

  RETURN v_new_list_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
