
-- Drop the failed functions if they partially exist
DROP FUNCTION IF EXISTS public.encrypt_api_key(text);
DROP FUNCTION IF EXISTS public.decrypt_api_key(text);
DROP FUNCTION IF EXISTS public.mask_api_key(text);

-- Function to encrypt an API key
CREATE OR REPLACE FUNCTION public.encrypt_api_key(raw_key text)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN encode(
    extensions.pgp_sym_encrypt(raw_key, current_setting('app.settings.api_key_secret', true)),
    'base64'
  );
END;
$$;

-- Function to decrypt an API key (server-side only)
CREATE OR REPLACE FUNCTION public.decrypt_api_key(encrypted_key text)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN extensions.pgp_sym_decrypt(
    decode(encrypted_key, 'base64'),
    current_setting('app.settings.api_key_secret', true)
  );
END;
$$;

-- Function to return masked version (safe for client display)
CREATE OR REPLACE FUNCTION public.mask_api_key(encrypted_key text)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  raw text;
BEGIN
  -- Handle legacy plaintext keys (not base64-encoded pgp)
  BEGIN
    raw := extensions.pgp_sym_decrypt(
      decode(encrypted_key, 'base64'),
      current_setting('app.settings.api_key_secret', true)
    );
  EXCEPTION WHEN OTHERS THEN
    -- Fallback: treat as plaintext (legacy)
    raw := encrypted_key;
  END;
  IF length(raw) <= 12 THEN
    RETURN repeat('*', length(raw));
  END IF;
  RETURN substr(raw, 1, 4) || repeat('*', length(raw) - 8) || substr(raw, length(raw) - 3);
END;
$$;

-- Revoke decrypt from client roles (only service role should use it)
REVOKE EXECUTE ON FUNCTION public.decrypt_api_key(text) FROM anon, authenticated;
-- Allow mask function for authenticated users (safe)
GRANT EXECUTE ON FUNCTION public.mask_api_key(text) TO authenticated;
-- Revoke encrypt from client (should only be called server-side)
REVOKE EXECUTE ON FUNCTION public.encrypt_api_key(text) FROM anon, authenticated;
