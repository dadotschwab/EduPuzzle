-- Fix word_lists RLS policy to only show lists where user is owner OR active collaborator
-- Previously it showed ALL shared lists, even after leaving

-- Drop the existing policy that was too permissive
DROP POLICY IF EXISTS "Users can view shared word lists" ON public.word_lists;

-- Create a more restrictive policy:
-- User can view a list if they own it OR if they are an active collaborator
CREATE POLICY "Users can view own and collaborated word lists"
  ON public.word_lists
  FOR SELECT
  USING (
    -- User owns the list
    auth.uid() = user_id
    OR
    -- User is a collaborator on this list (via shared_lists -> list_collaborators)
    EXISTS (
      SELECT 1 FROM public.shared_lists sl
      JOIN public.list_collaborators lc ON lc.shared_list_id = sl.id
      WHERE sl.original_list_id = word_lists.id
      AND sl.is_active = true
      AND lc.user_id = auth.uid()
    )
  );

-- Also fix words policy to be consistent
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view words in shared lists" ON public.words;

-- Create a more restrictive policy for words:
-- User can view words if they own the list OR if they are an active collaborator
CREATE POLICY "Users can view words in own and collaborated lists"
  ON public.words
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.word_lists wl
      WHERE wl.id = words.list_id
      AND (
        -- User owns the list
        wl.user_id = auth.uid()
        OR
        -- User is a collaborator on this list
        EXISTS (
          SELECT 1 FROM public.shared_lists sl
          JOIN public.list_collaborators lc ON lc.shared_list_id = sl.id
          WHERE sl.original_list_id = wl.id
          AND sl.is_active = true
          AND lc.user_id = auth.uid()
        )
      )
    )
  );
