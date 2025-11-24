-- Fix import_shared_list_copy to properly copy words by adding RLS policy for shared words
-- The function runs as SECURITY DEFINER but RLS still applies to table access

-- Add policy to allow reading words from shared lists (for copy import)
CREATE POLICY "Users can view words in shared lists"
  ON public.words
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.word_lists wl
      JOIN public.shared_lists sl ON sl.original_list_id = wl.id
      WHERE wl.id = words.list_id
      AND sl.is_active = true
    )
  );
