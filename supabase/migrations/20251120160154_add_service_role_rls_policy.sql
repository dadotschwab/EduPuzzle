-- Add service role policy to users table for Edge Functions
-- This allows Edge Functions to access user data when RLS would normally block it

CREATE POLICY "service_role_full_access"
  ON public.users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);