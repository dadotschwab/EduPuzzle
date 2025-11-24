-- Fix: Allow users to view word_lists details when accessing via a valid share link
-- The previous RLS policy was too restrictive - it didn't allow viewing shared lists
-- that the user hasn't joined yet (which is needed for the import/join flow)

-- Drop the current policy and recreate with the additional condition
DROP POLICY IF EXISTS "Users can view own and collaborated word lists" ON public.word_lists;

-- Create a comprehensive policy that allows:
-- 1. Viewing lists the user owns
-- 2. Viewing lists where user is an active collaborator
-- 3. Viewing lists that have an active share (needed for import/join preview)
CREATE POLICY "Users can view own collaborated and shared word lists"
  ON public.word_lists
  FOR SELECT
  USING (
    -- User owns the list
    auth.uid() = user_id
    OR
    -- User is a collaborator on this list
    EXISTS (
      SELECT 1 FROM public.shared_lists sl
      JOIN public.list_collaborators lc ON lc.shared_list_id = sl.id
      WHERE sl.original_list_id = word_lists.id
      AND sl.is_active = true
      AND lc.user_id = auth.uid()
    )
    OR
    -- List has an active share (for viewing shared list details before joining)
    EXISTS (
      SELECT 1 FROM public.shared_lists sl
      WHERE sl.original_list_id = word_lists.id
      AND sl.is_active = true
    )
  );

-- Similarly update words policy to allow viewing words in shared lists
DROP POLICY IF EXISTS "Users can view words in own and collaborated lists" ON public.words;

CREATE POLICY "Users can view words in own collaborated and shared lists"
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
        OR
        -- List has an active share (for import functionality)
        EXISTS (
          SELECT 1 FROM public.shared_lists sl
          WHERE sl.original_list_id = wl.id
          AND sl.is_active = true
        )
      )
    )
  );
