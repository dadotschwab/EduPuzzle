-- Add functions for leaving collaborative lists
-- Users can either:
-- 1. Leave and delete (remove themselves as collaborator, delete their word progress)
-- 2. Leave and keep as copy (create a personal copy of the list, then remove as collaborator)

-- Function: Leave collaborative list and delete
-- Removes user as collaborator and their word progress
CREATE OR REPLACE FUNCTION public.leave_collaborative_list_delete(
  p_shared_list_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_original_list_id UUID;
BEGIN
  -- Get the original list ID
  SELECT original_list_id INTO v_original_list_id
  FROM public.shared_lists
  WHERE id = p_shared_list_id
  AND share_mode = 'collaborative'
  AND is_active = true;

  IF v_original_list_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or inactive collaborative list';
  END IF;

  -- Check if user is a collaborator (but not owner)
  IF NOT EXISTS (
    SELECT 1 FROM public.list_collaborators
    WHERE shared_list_id = p_shared_list_id
    AND user_id = v_user_id
    AND role = 'member'
  ) THEN
    RAISE EXCEPTION 'You are not a member of this collaborative list or you are the owner';
  END IF;

  -- Delete user's word progress for words in this list
  DELETE FROM public.word_progress
  WHERE user_id = v_user_id
  AND word_id IN (
    SELECT id FROM public.words
    WHERE list_id = v_original_list_id
  );

  -- Remove user as collaborator
  DELETE FROM public.list_collaborators
  WHERE shared_list_id = p_shared_list_id
  AND user_id = v_user_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Function: Leave collaborative list and keep as personal copy
-- Creates a copy of the list for the user, then removes them as collaborator
CREATE OR REPLACE FUNCTION public.leave_collaborative_list_keep_copy(
  p_shared_list_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_original_list_id UUID;
  v_new_list_id UUID;
BEGIN
  -- Get the original list ID
  SELECT original_list_id INTO v_original_list_id
  FROM public.shared_lists
  WHERE id = p_shared_list_id
  AND share_mode = 'collaborative'
  AND is_active = true;

  IF v_original_list_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or inactive collaborative list';
  END IF;

  -- Check if user is a collaborator (but not owner)
  IF NOT EXISTS (
    SELECT 1 FROM public.list_collaborators
    WHERE shared_list_id = p_shared_list_id
    AND user_id = v_user_id
    AND role = 'member'
  ) THEN
    RAISE EXCEPTION 'You are not a member of this collaborative list or you are the owner';
  END IF;

  -- Create a personal copy of the list
  INSERT INTO public.word_lists (
    user_id,
    name,
    source_language,
    target_language
  )
  SELECT
    v_user_id,
    name || ' (Personal Copy)',
    source_language,
    target_language
  FROM public.word_lists
  WHERE id = v_original_list_id
  RETURNING id INTO v_new_list_id;

  -- Copy all words to the new list
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

  -- Transfer word progress to the new words (matching by term)
  -- First, create progress for new words based on existing progress
  INSERT INTO public.word_progress (
    user_id,
    word_id,
    stage,
    ease_factor,
    interval_days,
    next_review_date,
    last_reviewed_at,
    total_reviews,
    correct_reviews,
    incorrect_reviews,
    current_streak
  )
  SELECT
    v_user_id,
    new_w.id,
    COALESCE(wp.stage, 0),
    COALESCE(wp.ease_factor, 2.5),
    COALESCE(wp.interval_days, 0),
    COALESCE(wp.next_review_date, CURRENT_DATE),
    wp.last_reviewed_at,
    COALESCE(wp.total_reviews, 0),
    COALESCE(wp.correct_reviews, 0),
    COALESCE(wp.incorrect_reviews, 0),
    COALESCE(wp.current_streak, 0)
  FROM public.words new_w
  LEFT JOIN public.words old_w ON old_w.term = new_w.term AND old_w.list_id = v_original_list_id
  LEFT JOIN public.word_progress wp ON wp.word_id = old_w.id AND wp.user_id = v_user_id
  WHERE new_w.list_id = v_new_list_id
  ON CONFLICT (user_id, word_id) DO NOTHING;

  -- Delete user's word progress for words in the original list
  DELETE FROM public.word_progress
  WHERE user_id = v_user_id
  AND word_id IN (
    SELECT id FROM public.words
    WHERE list_id = v_original_list_id
  );

  -- Remove user as collaborator
  DELETE FROM public.list_collaborators
  WHERE shared_list_id = p_shared_list_id
  AND user_id = v_user_id;

  RETURN v_new_list_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.leave_collaborative_list_delete(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_collaborative_list_keep_copy(UUID) TO authenticated;
