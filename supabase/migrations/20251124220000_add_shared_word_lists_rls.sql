-- Add RLS policy to allow viewing shared word lists
-- Users need to be able to see word_lists that have been shared via shared_lists table

-- Policy: Allow viewing word lists that have active shares
CREATE POLICY "Users can view shared word lists"
  ON public.word_lists
  FOR SELECT
  USING (
    -- User owns the list
    auth.uid() = user_id
    OR
    -- List has an active share
    EXISTS (
      SELECT 1 FROM public.shared_lists
      WHERE shared_lists.original_list_id = word_lists.id
      AND shared_lists.is_active = true
    )
  );

-- Drop the old restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view own word lists" ON public.word_lists;
