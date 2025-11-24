-- Fix the generate_share_token function to use compatible encoding
-- PostgreSQL's encode() doesn't support 'base64url', only 'base64', 'hex', 'escape'
-- Error was: unrecognized encoding: "base64url"
-- Also fixes: gen_random_bytes not found (pgcrypto is in extensions schema)

CREATE OR REPLACE FUNCTION public.generate_share_token()
RETURNS TEXT AS $$
DECLARE
  token TEXT;
  exists_count INTEGER;
BEGIN
  -- Generate a URL-safe token (22 chars = 128 bits of entropy)
  -- Use standard base64 and then replace URL-unsafe characters
  LOOP
    -- Generate random bytes using fully qualified path to extensions.gen_random_bytes
    -- Encode as base64, then make URL-safe
    token := encode(extensions.gen_random_bytes(16), 'base64');
    -- Replace + with -, / with _, and remove = padding to make URL-safe
    token := replace(replace(replace(token, '+', '-'), '/', '_'), '=', '');
    
    -- Check uniqueness
    SELECT COUNT(*) INTO exists_count
    FROM public.shared_lists
    WHERE share_token = token;

    EXIT WHEN exists_count = 0;
  END LOOP;

  RETURN token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
